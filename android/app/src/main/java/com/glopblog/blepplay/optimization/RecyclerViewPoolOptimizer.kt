
// optimization/RecyclerViewPoolOptimizer.kt
package com.blepplay.optimization

import androidx.recyclerview.widget.RecyclerView

object RecyclerViewPoolOptimizer {
    
    private val sharedPool = RecyclerView.RecycledViewPool()
    
    fun initialize() {
        // Configura pool compartilhado para todos os RecyclerViews
        sharedPool.setMaxRecycledViews(0, 20) // 20 células de música
        sharedPool.setMaxRecycledViews(1, 10) // 10 células com capa
    }
    
    fun getSharedPool(): RecyclerView.RecycledViewPool = sharedPool
}
