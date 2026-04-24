
// optimization/ThreadPoolOptimizer.kt
package com.blepplay.optimization

import java.util.concurrent.*

object ThreadPoolOptimizer {
    
    private lateinit var ioExecutor: ExecutorService
    private lateinit var computeExecutor: ExecutorService
    
    fun configure() {
        // IO intensivo (disco, rede)
        ioExecutor = ThreadPoolExecutor(
            4, // Core pool size
            8, // Max pool size
            60L, TimeUnit.SECONDS,
            LinkedBlockingQueue(),
            ThreadPoolExecutor.DiscardPolicy()
        )
        
        // CPU intensivo (processamento de imagens, JSON)
        val cpuCount = Runtime.getRuntime().availableProcessors()
        computeExecutor = ThreadPoolExecutor(
            cpuCount,
            cpuCount * 2,
            30L, TimeUnit.SECONDS,
            LinkedBlockingQueue(),
            ThreadPoolExecutor.DiscardPolicy()
        )
    }
    
    fun getIOExecutor(): ExecutorService = ioExecutor
    fun getComputeExecutor(): ExecutorService = computeExecutor
}

