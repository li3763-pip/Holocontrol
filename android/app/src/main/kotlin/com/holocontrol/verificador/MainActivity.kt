package com.holocontrol.verificador

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.webkit.GeolocationPermissions
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.ActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    // Callback que el WebView espera con la URI del archivo seleccionado
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    // URI de la foto tomada con la cámara (para pasarla al callback si el usuario tomó foto)
    private var cameraImageUri: Uri? = null
    // Callback de geolocalización pendiente de aprobación
    private var pendingGeoCallback: GeolocationPermissions.Callback? = null
    private var pendingGeoOrigin: String? = null

    // Lanzador para el chooser de archivos / cámara
    private val fileChooserLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result: ActivityResult ->
            val callback = filePathCallback ?: return@registerForActivityResult
            filePathCallback = null

            if (result.resultCode == Activity.RESULT_OK) {
                val data = result.data
                val uris: Array<Uri>? = when {
                    // El usuario tomó una foto con la cámara
                    data?.data == null && cameraImageUri != null -> arrayOf(cameraImageUri!!)
                    // El usuario seleccionó un archivo de la galería
                    data?.data != null -> arrayOf(data.data!!)
                    else -> null
                }
                callback.onReceiveValue(uris)
            } else {
                // Cancelado — devolver null para desbloquear el WebView
                callback.onReceiveValue(null)
            }
            cameraImageUri = null
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Let the WebView stay inside the visible area so top/bottom controls are not
        // hidden behind the system status/navigation bars.
        WindowCompat.setDecorFitsSystemWindows(window, true)

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
            // Habilitar geolocalización en el WebView
            setGeolocationEnabled(true)
            // Permitir carga de recursos externos (Google Fonts, APIs) desde file://
            @Suppress("DEPRECATION")
            mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
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

        // Implementar onShowFileChooser para que input[type=file] funcione en el WebView.
        webView.webChromeClient = object : WebChromeClient() {

            // Auto-aprobar geolocalización: primero verificar/pedir permiso de Android
            override fun onGeolocationPermissionsShowPrompt(
                origin: String,
                callback: GeolocationPermissions.Callback
            ) {
                val fine = Manifest.permission.ACCESS_FINE_LOCATION
                if (ContextCompat.checkSelfPermission(this@MainActivity, fine)
                    == PackageManager.PERMISSION_GRANTED
                ) {
                    // Ya tenemos permiso → aprobar directamente
                    callback.invoke(origin, true, false)
                } else {
                    // Guardar callback y pedir permiso al usuario
                    pendingGeoCallback = callback
                    pendingGeoOrigin  = origin
                    ActivityCompat.requestPermissions(
                        this@MainActivity,
                        arrayOf(fine, Manifest.permission.ACCESS_COARSE_LOCATION),
                        REQUEST_LOCATION
                    )
                }
            }

            override fun onShowFileChooser(
                webView: WebView,
                filePathCallback: ValueCallback<Array<Uri>>,
                fileChooserParams: FileChooserParams
            ): Boolean {
                // Cancelar cualquier callback pendiente anterior
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                // Crear un Intent para la cámara (tomar foto directamente)
                val cameraIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).also { intent ->
                    intent.resolveActivity(packageManager)?.let {
                        val photoFile: File = createTempImageFile()
                        val uri = FileProvider.getUriForFile(
                            this@MainActivity,
                            "${packageName}.fileprovider",
                            photoFile
                        )
                        cameraImageUri = uri
                        intent.putExtra(MediaStore.EXTRA_OUTPUT, uri)
                    }
                }

                // Intent para seleccionar desde galería / archivos
                val galleryIntent = fileChooserParams.createIntent()

                // Chooser que permite elegir entre cámara y galería
                val chooser = Intent.createChooser(galleryIntent, "Seleccionar imagen")
                if (cameraImageUri != null) {
                    chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(cameraIntent))
                }

                fileChooserLauncher.launch(chooser)
                return true
            }
        }
    }

    /** Crea un archivo temporal para guardar la foto de la cámara */
    private fun createTempImageFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        return File.createTempFile("IMG_${timeStamp}_", ".jpg", storageDir)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    /** Resultado de la solicitud de permiso de ubicación en runtime */
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_LOCATION) {
            val granted = grantResults.isNotEmpty() &&
                          grantResults[0] == PackageManager.PERMISSION_GRANTED
            pendingGeoCallback?.invoke(pendingGeoOrigin ?: "", granted, false)
            pendingGeoCallback = null
            pendingGeoOrigin   = null
        }
    }

    companion object {
        // Carga local desde assets (src/ está mapeado como raíz de assets en build.gradle.kts)
        private const val APP_URL = "file:///android_asset/apps/verificador/index.html"
        private const val REQUEST_LOCATION = 1001
    }
}
