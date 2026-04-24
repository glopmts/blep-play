package com.blepplay.update

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class UpdateModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    init {
        // Share context with service and emitter
        UpdateService.reactContext = reactContext
    }

    override fun getName(): String = "UpdateModule"

    // ─── RN-callable methods ─────────────────────────────────────────────────

    @ReactMethod
    fun startDownload(url: String, version: String, fileSize: Double, promise: Promise) {
        try {
            UpdateService.startDownload(
                reactContext,
                url,
                version,
                fileSize.toLong()
            )
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DOWNLOAD_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun cancelDownload(promise: Promise) {
        try {
            UpdateService.cancelDownload(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun canInstallPackages(promise: Promise) {
        try {
            val canInstall = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.packageManager.canRequestPackageInstalls()
            } else {
                // Below Android 8, check Unknown Sources setting
                @Suppress("DEPRECATION")
                Settings.Secure.getInt(
                    reactContext.contentResolver,
                    Settings.Secure.INSTALL_NON_MARKET_APPS, 0
                ) == 1
            }
            promise.resolve(canInstall)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun requestInstallPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!reactContext.packageManager.canRequestPackageInstalls()) {
                    val intent = android.content.Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        android.net.Uri.parse("package:${reactContext.packageName}")
                    ).apply {
                        flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    reactContext.startActivity(intent)
                    promise.resolve("permission_screen_opened")
                    return
                }
            }
            promise.resolve("already_granted")
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getAppVersion(promise: Promise) {
        try {
            val pInfo = reactContext.packageManager.getPackageInfo(reactContext.packageName, 0)
            val result = Arguments.createMap().apply {
                putString("versionName", pInfo.versionName)
                putDouble("versionCode",
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P)
                        pInfo.longVersionCode.toDouble()
                    else
                        @Suppress("DEPRECATION") pInfo.versionCode.toDouble()
                )
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("VERSION_ERROR", e.message, e)
        }
    }

    // Required for addListener / removeListeners (RN event emitter pattern)
    @ReactMethod
    fun addListener(eventName: String) { /* no-op */ }

    @ReactMethod
    fun removeListeners(count: Int) { /* no-op */ }
}