package com.blepplay.update

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

object UpdateEventEmitter {

    // Event names (must match JS side exactly)
    const val EVENT_DOWNLOAD_PROGRESS = "progressoDownload"
    const val EVENT_DOWNLOAD_COMPLETE = "downloadCompleto"
    const val EVENT_DOWNLOAD_ERROR = "erroDownload"
    const val EVENT_INSTALL_STATUS = "statusInstalacao"

    fun emitDownloadProgress(
        reactContext: ReactApplicationContext?,
        progress: Int,
        downloadedBytes: Long,
        totalBytes: Long,
        speedBytesPerSec: Long
    ) {
        reactContext ?: return
        if (!reactContext.hasActiveReactInstance()) return

        val params = Arguments.createMap().apply {
            putInt("progress", progress)
            putDouble("downloadedBytes", downloadedBytes.toDouble())
            putDouble("totalBytes", totalBytes.toDouble())
            putDouble("speed", speedBytesPerSec.toDouble())
            putString("downloadedFormatted", formatBytes(downloadedBytes))
            putString("totalFormatted", formatBytes(totalBytes))
            putString("speedFormatted", formatSpeed(speedBytesPerSec))
        }

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_DOWNLOAD_PROGRESS, params)
    }

    fun emitDownloadComplete(reactContext: ReactApplicationContext?, filePath: String) {
        reactContext ?: return
        if (!reactContext.hasActiveReactInstance()) return

        val params = Arguments.createMap().apply {
            putString("filePath", filePath)
        }

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_DOWNLOAD_COMPLETE, params)
    }

    fun emitDownloadError(reactContext: ReactApplicationContext?, error: String) {
        reactContext ?: return
        if (!reactContext.hasActiveReactInstance()) return

        val params = Arguments.createMap().apply {
            putString("error", error)
        }

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_DOWNLOAD_ERROR, params)
    }

    fun emitInstallStatus(reactContext: ReactApplicationContext?, status: String) {
        reactContext ?: return
        if (!reactContext.hasActiveReactInstance()) return

        val params = Arguments.createMap().apply {
            putString("status", status)
        }

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_INSTALL_STATUS, params)
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
}