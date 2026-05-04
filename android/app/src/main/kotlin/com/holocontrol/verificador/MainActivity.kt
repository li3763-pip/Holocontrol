package com.holocontrol.verificador

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Draw edge-to-edge so the web app fills the entire screen.
        WindowCompat.setDecorFitsSystemWindows(window, false)

        setContentView(R.layout.activity_main)
        webView = findViewById(R.id.webView)

        // Style the status bar to match the app's dark accent color.
        window.statusBarColor = Color.parseColor("#7B1C2E")
        WindowInsetsControllerCompat(window, webView).apply {
            isAppearanceLightStatusBars = false
        }

        configureWebView()

        // Use OnBackPressedDispatcher (replaces deprecated onBackPressed override).
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl(APP_URL)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true          // enables localStorage / sessionStorage
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
            // Allow mixed-content only if needed (Google Fonts CDN is HTTPS so this is safe).
            @Suppress("DEPRECATION")
            mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
        }

        // Keep all navigation inside the WebView — never open an external browser.
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url.toString()
                // Let file:// URLs and the app's own host load inside the WebView.
                return if (url.startsWith("file://") || url.startsWith("http")) {
                    false
                } else {
                    true
                }
            }
        }

        // Required for <title> changes and console messages (useful during development).
        webView.webChromeClient = WebChromeClient()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    companion object {
        // The verificador app is served from the assets root which mirrors src/.
        private const val APP_URL = "file:///android_asset/apps/verificador/index.html"
    }
}
