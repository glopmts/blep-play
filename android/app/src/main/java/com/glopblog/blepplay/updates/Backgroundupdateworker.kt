package com.glopblog.blepplay.updates

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit
import org.json.JSONObject

// ─────────────────────────────────────────────────────────────
//  BackgroundUpdateWorker
//  Roda em segundo plano via WorkManager (não precisa do app aberto)
// ─────────────────────────────────────────────────────────────
class BackgroundUpdateWorker(private val context: Context, workerParams: WorkerParameters) :
        CoroutineWorker(context, workerParams) {

    companion object {
        const val WORK_TAG = "background_update_check"
        const val CHANNEL_ID = "update_channel"
        const val CHANNEL_NAME = "Atualizações do App"
        const val NOTIF_ID = 1001

        // Agenda verificação periódica (a cada 6 horas)
        fun schedule(context: Context) {
            val constraints =
                    Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()

            val request =
                    PeriodicWorkRequestBuilder<BackgroundUpdateWorker>(
                6, TimeUnit.HOURS,
                30, TimeUnit.MINUTES // flex interval
                            )
                            .setConstraints(constraints)
                            .addTag(WORK_TAG)
                            .setBackoffCriteria(BackoffPolicy.LINEAR, 30, TimeUnit.MINUTES)
                            .build()

            WorkManager.getInstance(context)
                    .enqueueUniquePeriodicWork(WORK_TAG, ExistingPeriodicWorkPolicy.KEEP, request)
        }

        // Cancela verificações em background
        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelAllWorkByTag(WORK_TAG)
        }
    }

    override suspend fun doWork(): Result {
        return try {
            val prefs = context.getSharedPreferences("update_prefs", Context.MODE_PRIVATE)
            val currentVersion = prefs.getString("current_version", "0.0.0") ?: "0.0.0"
            val repoOwner = prefs.getString("repo_owner", "") ?: ""
            val repoName = prefs.getString("repo_name", "") ?: ""

            if (repoOwner.isEmpty() || repoName.isEmpty()) return Result.success()

            val latestRelease = fetchLatestRelease(repoOwner, repoName) ?: return Result.success()

            val latestVersion = latestRelease.optString("tag_name", "").trimStart('v')
            if (latestVersion.isEmpty()) return Result.success()

            if (isNewerVersion(currentVersion, latestVersion)) {
                // App está em background/fechado → enviar notificação push
                if (!isAppInForeground()) {
                    sendUpdateNotification(latestVersion)
                }
            }

            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }

    // ─ HTTP: busca último release no GitHub
    private fun fetchLatestRelease(owner: String, repo: String): JSONObject? {
        val url = URL("https://api.github.com/repos/$owner/$repo/releases/latest")
        val conn = url.openConnection() as HttpURLConnection
        conn.apply {
            requestMethod = "GET"
            setRequestProperty("Accept", "application/vnd.github.v3+json")
            connectTimeout = 10_000
            readTimeout = 15_000
        }
        return try {
            if (conn.responseCode == 200) {
                val body = conn.inputStream.bufferedReader().readText()
                JSONObject(body)
            } else null
        } finally {
            conn.disconnect()
        }
    }

    // ─ Compara versões semver (ex: "1.2.3" vs "1.3.0")
    private fun isNewerVersion(current: String, latest: String): Boolean {
        fun parse(v: String) = v.split(".").map { it.toIntOrNull() ?: 0 }
        val c = parse(current)
        val l = parse(latest)
        for (i in 0 until maxOf(c.size, l.size)) {
            val cv = c.getOrElse(i) { 0 }
            val lv = l.getOrElse(i) { 0 }
            if (lv > cv) return true
            if (lv < cv) return false
        }
        return false
    }
    private fun isAppInForeground() = AppLifecycleTracker.isInForeground

    // ─ Envia notificação push com ícone do app
    private fun sendUpdateNotification(version: String) {
        createNotificationChannel()

        val launchIntent =
                context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                }

        val pendingFlags =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
                        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                else PendingIntent.FLAG_UPDATE_CURRENT

        val pendingIntent = PendingIntent.getActivity(context, 0, launchIntent, pendingFlags)

        // Ícone grande = ícone do app (launcher icon)
        val appIconBitmap =
                try {
                    val drawable = context.packageManager.getApplicationIcon(context.packageName)
                    val bitmap =
                            android.graphics.Bitmap.createBitmap(
                                    drawable.intrinsicWidth,
                                    drawable.intrinsicHeight,
                                    android.graphics.Bitmap.Config.ARGB_8888
                            )
                    val canvas = android.graphics.Canvas(bitmap)
                    drawable.setBounds(0, 0, canvas.width, canvas.height)
                    drawable.draw(canvas)
                    bitmap
                } catch (e: Exception) {
                    null
                }

        val notification =
                NotificationCompat.Builder(context, CHANNEL_ID)
                        .setSmallIcon(getSmallIconRes()) // ícone monocromático (barra de status)
                        .setLargeIcon(appIconBitmap) // ícone colorido do app (canto direito)
                        .setContentTitle("Nova versão disponível")
                        .setContentText("Versão $version está pronta para instalar.")
                        .setStyle(
                                NotificationCompat.BigTextStyle()
                                        .bigText(
                                                "Uma nova versão ($version) do app está disponível. Toque para atualizar agora."
                                        )
                        )
                        .setContentIntent(pendingIntent)
                        .setAutoCancel(true)
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setCategory(NotificationCompat.CATEGORY_RECOMMENDATION)
                        .setColor(0xFF2563EB.toInt()) // cor de destaque (azul)
                        .build()

        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIF_ID, notification)
    }

    // ─ Cria canal de notificação (obrigatório Android 8+)
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel =
                    NotificationChannel(
                                    CHANNEL_ID,
                                    CHANNEL_NAME,
                                    NotificationManager.IMPORTANCE_HIGH
                            )
                            .apply {
                                description = "Notificações sobre novas versões disponíveis"
                                enableLights(true)
                                lightColor = 0xFF2563EB.toInt()
                                enableVibration(true)
                                setShowBadge(true)
                            }
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }
    }

    // ─ Tenta usar ic_notification customizado, fallback para ícone do app
    private fun getSmallIconRes(): Int {
        // Expo-notifications gera com esse nome exato
        val res =
                context.resources.getIdentifier(
                        "notification_icon",
                        "drawable",
                        context.packageName
                )
        return if (res != 0) res
        else {
            // Fallback para o ícone do launcher (pode aparecer quadrado no Android 5+)
            context.resources.getIdentifier("ic_launcher", "mipmap", context.packageName)
        }
    }
}
