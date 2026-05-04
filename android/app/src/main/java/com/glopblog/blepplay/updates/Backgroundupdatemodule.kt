package com.glopblog.blepplay.updates

import android.content.Context
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

// ─────────────────────────────────────────────────────────────
//  BackgroundUpdateModule
//  Expõe métodos nativos ao JavaScript via NativeModules
// ─────────────────────────────────────────────────────────────
class BackgroundUpdateModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "BackgroundUpdateModule"

    // ─ Inicia verificações periódicas em background
    // Parâmetros: repoOwner, repoName, currentVersion
    @ReactMethod
fun startBackgroundCheck(
    repoOwner: String,
    repoName: String,
    currentVersion: String,
    promise: Promise
) {
    try {
        android.util.Log.d("BGUpdateModule", "startBackgroundCheck chamado: owner=$repoOwner repo=$repoName version=$currentVersion")
        
        val prefs = reactContext.getSharedPreferences("update_prefs", Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString("repo_owner", repoOwner)
            putString("repo_name", repoName)
            putString("current_version", currentVersion)
            apply()
        }
        
        // Confirma o que foi salvo
        android.util.Log.d("BGUpdateModule", "Salvo: owner=${prefs.getString("repo_owner", "?")} repo=${prefs.getString("repo_name", "?")} version=${prefs.getString("current_version", "?")}")
        
        BackgroundUpdateWorker.schedule(reactContext)
        android.util.Log.d("BGUpdateModule", "Worker agendado com sucesso")
        promise.resolve("scheduled")
    } catch (e: Exception) {
        android.util.Log.e("BGUpdateModule", "Erro: ${e.message}", e)
        promise.reject("SCHEDULE_ERROR", e.message, e)
    }
}

    // ─ Para verificações em background
    @ReactMethod
    fun stopBackgroundCheck(promise: Promise) {
        try {
            BackgroundUpdateWorker.cancel(reactContext)
            promise.resolve("cancelled")
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", e.message, e)
        }
    }

    // ─ Atualiza versão atual armazenada (chamar após update)
    @ReactMethod
    fun updateStoredVersion(version: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("update_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString("current_version", version).apply()
            promise.resolve("updated")
        } catch (e: Exception) {
            promise.reject("UPDATE_ERROR", e.message, e)
        }
    }

    // Dispara verificação imediata (OneTimeWork)
    @ReactMethod
    fun checkNow(promise: Promise) {
        try {
            val request = OneTimeWorkRequestBuilder<BackgroundUpdateWorker>()
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .build()
            WorkManager.getInstance(reactContext).enqueue(request)
            promise.resolve("triggered")
        } catch (e: Exception) {
            promise.reject("CHECK_ERROR", e.message, e)
        }
    }
}