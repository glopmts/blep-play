package com.glopblog.blepplay.updates

import android.app.Activity
import android.app.Application
import android.os.Bundle

object AppLifecycleTracker : Application.ActivityLifecycleCallbacks {
    var isInForeground = false
        private set

    private var started = 0

    override fun onActivityStarted(a: Activity) {
        if (++started == 1) isInForeground = true
    }

    override fun onActivityStopped(a: Activity) {
        if (--started == 0) isInForeground = false
    }

    override fun onActivityCreated(a: Activity, b: Bundle?) {}
    override fun onActivityResumed(a: Activity) {}
    override fun onActivityPaused(a: Activity) {}
    override fun onActivitySaveInstanceState(a: Activity, b: Bundle) {}
    override fun onActivityDestroyed(a: Activity) {}
}