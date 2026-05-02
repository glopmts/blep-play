package com.glopblog.blepplay

import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import expo.modules.splashscreen.SplashScreenManager

class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
        SplashScreenManager.registerOnActivity(this)
        // @generated end expo-splashscreen

        // null é intencional: evita crash de restauração de estado no React Navigation
        super.onCreate(null)

        // Mantém tela ligada durante scans de biblioteca e playback ativo
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    override fun getMainComponentName(): String = "main"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {}
        )

    override fun onResume() {
        super.onResume()
        // Re-aplica após voltar do background (sistema pode ter removido a flag)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    override fun onPause() {
        super.onPause()
        // Remove em background para não drenar bateria
        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    override fun invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                super.invokeDefaultOnBackPressed()
            }
            return
        }
        super.invokeDefaultOnBackPressed()
    }
}