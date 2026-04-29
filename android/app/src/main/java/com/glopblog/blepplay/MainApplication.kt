package com.glopblog.blepplay

import android.app.Application
import android.content.res.Configuration
import android.os.StrictMode
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory
import com.blepplay.update.UpdatePackage
import java.util.concurrent.Executors
import com.glopblog.blepplay.MediaDeletePackage
import expo.modules.core.interfaces.Package

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(UpdatePackage())
          add(MediaDeletePackage())
          add(MusicLibraryPackage()) 
        }
    )
  }

  override fun onCreate() {
    super.onCreate()

    // ── 1. Prioridade do processo — evita throttle durante scan de mídia
    android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_FOREGROUND)

    // ── 2. Release level (mantido do seu código original)
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }

    // ── 3. Carrega React Native (mantido do seu código original)
    loadReactNative(this)

    // ── 4. Pre-aquece threads de I/O para leitura de capas/áudios
    //    Alinhado com COVER_CONCURRENCY = 3 do useAlbumsLocal
    warmUpIoThreadPool()

    // ── 5. StrictMode em debug — detecta I/O na main thread e leaks de stream
    if (BuildConfig.DEBUG) {
      enableStrictMode()
    }

    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  /**
   * Cria 4 threads de I/O antes do usuário interagir com o app.
   * Sem isso, a JVM cria as threads sob demanda na primeira chamada de
   * fetchAndCacheCover, adicionando latência perceptível no primeiro scroll.
   *
   * isDaemon = true → as threads não impedem o processo de encerrar.
   */
  private fun warmUpIoThreadPool() {
    val pool = Executors.newFixedThreadPool(4) { runnable ->
      Thread(runnable, "blepplay-io").apply {
        priority = Thread.NORM_PRIORITY - 1 // abaixo da UI, sem travar animações
        isDaemon = true
      }
    }
    repeat(4) {
      pool.submit {
        android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_BACKGROUND)
      }
    }
  }

  /**
   * Detecta em debug:
   * - leitura/escrita de disco na main thread (scan de álbuns vazando para UI thread)
   * - FileInputStream não fechado após leitura de capa (getSongCoverArt)
   * - leaks de objetos SQLite (MMKV usa SQLite internamente em alguns modos)
   */
  private fun enableStrictMode() {
    StrictMode.setThreadPolicy(
      StrictMode.ThreadPolicy.Builder()
        .detectDiskReads()
        .detectDiskWrites()
        .detectNetwork()
        .penaltyLog()
        .build()
    )
    StrictMode.setVmPolicy(
      StrictMode.VmPolicy.Builder()
        .detectLeakedSqlLiteObjects()
        .detectLeakedClosableObjects()
        .detectActivityLeaks()
        .penaltyLog()
        .build()
    )
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}