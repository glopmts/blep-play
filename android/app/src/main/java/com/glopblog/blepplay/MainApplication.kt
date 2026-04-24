// MainApplication.kt
package com.glopblog.blepplay

import android.app.Application
import android.content.res.Configuration
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.blepplay.optimization.*
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory
import com.blepplay.update.UpdatePackage
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          add(UpdatePackage())
          add(PerformanceOptimizationPackage())
        }
    )
  }

  override fun onCreate() {
    super.onCreate()
    
    // ⚡ INICIALIZA OTIMIZAÇÕES (com try-catch para não quebrar o build)
    try {
      initializePerformanceOptimizations()
    } catch (e: Exception) {
      Log.e("MainApplication", "Failed to initialize optimizations", e)
    }
    
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    
    SoLoader.init(this, false) // ← Remove OpenSourceMergedSoMapping
    
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
  
  private fun initializePerformanceOptimizations() {
    // 1. Otimização de banco de dados SQLite
    DatabaseOptimizer.optimize(this)
    
    // 3. Otimização de RecyclerView pools
    RecyclerViewPoolOptimizer.initialize()
    
    // 4. Configuração de thread pools
    ThreadPoolOptimizer.configure()
    
    // 5. Pré-carregamento de recursos críticos
    PreloadManager.initialize(this)
    
    Log.d("MainApplication", "✅ Performance optimizations initialized")
  }
}