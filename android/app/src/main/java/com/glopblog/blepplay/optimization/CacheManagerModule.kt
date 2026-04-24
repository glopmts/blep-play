// optimization/CacheManagerModule.kt (Native Module para React Native)
package com.blepplay.optimization

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.*

class CacheManagerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName() = "CacheManager"
    
    @ReactMethod
    fun clearMemoryCache(promise: Promise) {
        try {
            // Limpa cache de imagens
            com.bumptech.glide.Glide.get(reactApplicationContext).clearMemory()
            
            // Limpa cache de RecyclerView
            RecyclerViewPoolOptimizer.getSharedPool().clear()
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CACHE_ERROR", e)
        }
    }
    
    @ReactMethod
    fun getCacheStats(promise: Promise) {
        val stats = Arguments.createMap()
        // Retorna estatísticas de cache
        stats.putInt("memoryCacheSize", getMemoryCacheSize())
        promise.resolve(stats)
    }
    
    private fun getMemoryCacheSize(): Int {
        // Implementar lógica para retornar tamanho do cache
        return Runtime.getRuntime().totalMemory().toInt() / 1024 / 1024 // em MB
    }
}

