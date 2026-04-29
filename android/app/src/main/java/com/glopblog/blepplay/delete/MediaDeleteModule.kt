package com.glopblog.blepplay

import android.app.Activity
import android.content.ContentUris
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.activity.result.ActivityResult
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableNativeArray

class MediaDeleteModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "MediaDeleteModule"

    @ReactMethod
    fun deleteMediaFiles(uris: ReadableArray, promise: Promise) {
        try {
            val mediaUris = mutableListOf<Uri>()

            for (i in 0 until uris.size()) {
                uris.getString(i)?.let { str ->
                    runCatching { Uri.parse(str) }.getOrNull()?.let { mediaUris.add(it) }
                }
            }

            if (mediaUris.isEmpty()) {
                promise.resolve(true)
                return
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                // Android 11+ — usa createDeleteRequest (diálogo nativo correto)
                val pendingIntent = MediaStore.createDeleteRequest(
                    reactContext.contentResolver,
                    mediaUris,
                )

                // ← correção: acessa currentActivity via reactContext
                val activity = reactContext.currentActivity
                if (activity !is FragmentActivity) {
                    promise.reject("ERR_NO_ACTIVITY", "Activity não é FragmentActivity")
                    return
                }

                val key = "media_delete_${System.currentTimeMillis()}"
                val launcher = activity.activityResultRegistry.register(
                    key,
                    ActivityResultContracts.StartIntentSenderForResult(),
                ) { result: ActivityResult ->
                    if (result.resultCode == Activity.RESULT_OK) {
                        promise.resolve(true)
                    } else {
                        promise.reject("ERR_CANCELLED", "Usuário cancelou a deleção")
                    }
                }

                launcher.launch(
                    IntentSenderRequest.Builder(pendingIntent.intentSender).build()
                )
            } else {
                // Android 9/10 — deleção direta via ContentResolver
                var deletedCount = 0
                for (uri in mediaUris) {
                    runCatching {
                        reactContext.contentResolver.delete(uri, null, null)
                        deletedCount++
                    }
                }
                promise.resolve(deletedCount > 0)
            }
        } catch (e: Exception) {
            promise.reject("ERR_DELETE", e.message ?: "Erro ao deletar arquivos", e)
        }
    }

    @ReactMethod
    fun resolveAudioUris(assetIds: ReadableArray, promise: Promise) {
        try {
            val result = WritableNativeArray()

            for (i in 0 until assetIds.size()) {
                assetIds.getString(i)?.let { id ->
                    runCatching {
                        val numericId = id.toLong()
                        ContentUris.withAppendedId(
                            MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                            numericId,
                        ).toString()
                    }.getOrNull()?.let { result.pushString(it) }
                }
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERR_RESOLVE", e.message ?: "Erro ao resolver URIs", e)
        }
    }
}