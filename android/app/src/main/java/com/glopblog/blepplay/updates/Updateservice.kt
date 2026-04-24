package com.blepplay.update

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.net.Uri
import android.os.*
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.content.FileProvider
import com.facebook.react.bridge.ReactApplicationContext
import okhttp3.*
import java.io.*
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.roundToInt

class UpdateService : Service() {

    companion object {
        const val CHANNEL_ID = "blep_update_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START_DOWNLOAD = "ACTION_START_DOWNLOAD"
        const val ACTION_CANCEL_DOWNLOAD = "ACTION_CANCEL_DOWNLOAD"
        const val EXTRA_DOWNLOAD_URL = "EXTRA_DOWNLOAD_URL"
        const val EXTRA_VERSION = "EXTRA_VERSION"
        const val EXTRA_FILE_SIZE = "EXTRA_FILE_SIZE"

        var reactContext: ReactApplicationContext? = null

        fun startDownload(context: Context, url: String, version: String, fileSize: Long = 0) {
            val intent = Intent(context, UpdateService::class.java).apply {
                action = ACTION_START_DOWNLOAD
                putExtra(EXTRA_DOWNLOAD_URL, url)
                putExtra(EXTRA_VERSION, version)
                putExtra(EXTRA_FILE_SIZE, fileSize)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun cancelDownload(context: Context) {
            val intent = Intent(context, UpdateService::class.java).apply {
                action = ACTION_CANCEL_DOWNLOAD
            }
            context.startService(intent)
        }
    }

    private val isCancelled = AtomicBoolean(false)
    private var downloadThread: Thread? = null
    private lateinit var notificationManager: NotificationManager
    private val client = OkHttpClient.Builder()
        .retryOnConnectionFailure(true)
        .build()

    override fun onCreate() {
        super.onCreate()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_DOWNLOAD -> {
                val url = intent.getStringExtra(EXTRA_DOWNLOAD_URL) ?: return START_NOT_STICKY
                val version = intent.getStringExtra(EXTRA_VERSION) ?: "unknown"
                val fileSize = intent.getLongExtra(EXTRA_FILE_SIZE, 0L)

                isCancelled.set(false)
                val notification = buildNotification("Iniciando download...", 0)
                startForeground(NOTIFICATION_ID, notification)
                startDownload(url, version, fileSize)
            }
            ACTION_CANCEL_DOWNLOAD -> {
                isCancelled.set(true)
                downloadThread?.interrupt()
                UpdateEventEmitter.emitDownloadError(reactContext, "Download cancelado pelo usuário")
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun startDownload(url: String, version: String, expectedSize: Long) {
        downloadThread = Thread {
            try {
                val apkFile = File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "blep-play-$version.apk")
                
                // Check for partial download (resume support)
                val downloadedBytes = if (apkFile.exists()) apkFile.length() else 0L
                
                val requestBuilder = Request.Builder().url(url)
                if (downloadedBytes > 0) {
                    requestBuilder.addHeader("Range", "bytes=$downloadedBytes-")
                }
                
                val request = requestBuilder.build()
                val response = client.newCall(request).execute()
                
                if (!response.isSuccessful) {
                    throw IOException("Falha na requisição: ${response.code}")
                }
                
                val body = response.body ?: throw IOException("Resposta vazia")
                val contentLength = body.contentLength()
                val totalBytes = if (contentLength > 0) contentLength + downloadedBytes else expectedSize
                
                val outputStream = FileOutputStream(apkFile, downloadedBytes > 0)
                val inputStream = body.byteStream()
                val buffer = ByteArray(8192)
                var bytesRead: Int
                var totalDownloaded = downloadedBytes
                var lastNotificationTime = 0L
                var lastEmitTime = 0L
                var lastBytes = downloadedBytes
                var lastTime = System.currentTimeMillis()

                while (!isCancelled.get()) {
                    bytesRead = inputStream.read(buffer)
                    if (bytesRead == -1) break
                    outputStream.write(buffer, 0, bytesRead)
                    totalDownloaded += bytesRead

                    val now = System.currentTimeMillis()
                    val progress = if (totalBytes > 0) ((totalDownloaded * 100) / totalBytes).toInt() else 0

                    // Throttle: update notification max every 500ms
                    if (now - lastNotificationTime > 500) {
                        val elapsed = (now - lastTime) / 1000.0
                        val speed = if (elapsed > 0) ((totalDownloaded - lastBytes) / elapsed).toLong() else 0L
                        lastBytes = totalDownloaded
                        lastTime = now
                        lastNotificationTime = now

                        val speedText = formatSpeed(speed)
                        val progressText = "${formatBytes(totalDownloaded)} / ${formatBytes(totalBytes)} • $speedText"
                        updateNotification(progressText, progress)
                    }

                    // Emit to React Native max every 300ms
                    if (now - lastEmitTime > 300) {
                        lastEmitTime = now
                        val elapsed = (now - lastTime + 1) / 1000.0
                        val speed = if (elapsed > 0) ((totalDownloaded - lastBytes) / elapsed).toLong() else 0L
                        UpdateEventEmitter.emitDownloadProgress(
                            reactContext,
                            progress,
                            totalDownloaded,
                            totalBytes,
                            speed
                        )
                    }
                }

                outputStream.flush()
                outputStream.close()
                inputStream.close()

                if (isCancelled.get()) {
                    apkFile.delete()
                    stopForeground(true)
                    stopSelf()
                    return@Thread
                }

                // Download complete
                UpdateEventEmitter.emitDownloadComplete(reactContext, apkFile.absolutePath)
                updateNotificationInstalling()
                installApk(apkFile)

            } catch (e: Exception) {
                if (!isCancelled.get()) {
                    UpdateEventEmitter.emitDownloadError(reactContext, e.message ?: "Erro desconhecido")
                    updateNotificationError()
                }
            }
        }
        downloadThread?.start()
    }

    private fun installApk(apkFile: File) {
        UpdateEventEmitter.emitInstallStatus(reactContext, "installing")
        
        val uri = FileProvider.getUriForFile(
            this,
            "${packageName}.provider",
            apkFile
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!packageManager.canRequestPackageInstalls()) {
                val settingsIntent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                    data = Uri.parse("package:$packageName")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                startActivity(settingsIntent)
                UpdateEventEmitter.emitInstallStatus(reactContext, "permission_required")
                stopForeground(true)
                stopSelf()
                return
            }
        }

        val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
        }
        startActivity(installIntent)
        UpdateEventEmitter.emitInstallStatus(reactContext, "launched")
        updateNotificationComplete()
        
        Handler(Looper.getMainLooper()).postDelayed({
            stopForeground(true)
            stopSelf()
        }, 3000)
    }

    // ─── Notification Helpers ─────────────────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Atualização do App",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Notificações de atualização do Blep Play"
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String, progress: Int): Notification {
        val cancelIntent = Intent(this, UpdateService::class.java).apply { action = ACTION_CANCEL_DOWNLOAD }
        val cancelPendingIntent = PendingIntent.getService(
            this, 0, cancelIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Atualizando Blep Play")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setProgress(100, progress, progress == 0)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .addAction(android.R.drawable.ic_delete, "Cancelar", cancelPendingIntent)
            .build()
    }

    private fun updateNotification(text: String, progress: Int) {
        val notification = buildNotification(text, progress)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun updateNotificationInstalling() {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Instalando atualização")
            .setContentText("Preparando para instalar...")
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setProgress(100, 100, true)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .build()
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun updateNotificationComplete() {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Atualização concluída")
            .setContentText("Blep Play foi atualizado com sucesso!")
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setAutoCancel(true)
            .build()
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun updateNotificationError() {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Falha na atualização")
            .setContentText("Não foi possível baixar a atualização. Tente novamente.")
            .setSmallIcon(android.R.drawable.stat_notify_error)
            .setAutoCancel(true)
            .build()
        notificationManager.notify(NOTIFICATION_ID, notification)
        stopForeground(false)
        stopSelf()
    }

    // ─── Formatters ───────────────────────────────────────────────────────────

    private fun formatBytes(bytes: Long): String {
        return when {
            bytes >= 1_073_741_824 -> "%.1f GB".format(bytes / 1_073_741_824.0)
            bytes >= 1_048_576 -> "%.1f MB".format(bytes / 1_048_576.0)
            bytes >= 1024 -> "%.1f KB".format(bytes / 1024.0)
            else -> "$bytes B"
        }
    }

    private fun formatSpeed(bytesPerSecond: Long): String {
        return when {
            bytesPerSecond >= 1_048_576 -> "%.1f MB/s".format(bytesPerSecond / 1_048_576.0)
            bytesPerSecond >= 1024 -> "%.0f KB/s".format(bytesPerSecond / 1024.0)
            else -> "$bytesPerSecond B/s"
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        isCancelled.set(true)
        downloadThread?.interrupt()
        super.onDestroy()
    }
}