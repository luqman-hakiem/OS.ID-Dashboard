package id.orangesky.admin;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

import java.util.Locale;

/**
 * WebView wrapper untuk dashboard adminlive di https://orangesky.id/manajemen/.
 *
 * Tidak ada aset lokal dan tidak ada data dummy: semua halaman, login, OTP,
 * sesi, dan download berasal dari server orangesky.id yang asli.
 */
public class MainActivity extends Activity {

    private static final String START_URL = "https://orangesky.id/manajemen/";
    private static final String HOST = "orangesky.id";
    private static final int FILE_CHOOSER_REQUEST = 1001;

    private WebView web;
    private ProgressBar progress;
    private ValueCallback<Uri[]> filePathCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.parseColor("#28293B"));

        web = new WebView(this);

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setIndeterminate(false);
        progress.setProgressBackgroundTintList(ColorStateList.valueOf(Color.parseColor("#28293B")));
        progress.setProgressTintList(ColorStateList.valueOf(Color.parseColor("#C0A751")));
        progress.setVisibility(View.GONE);

        FrameLayout container = new FrameLayout(this);
        container.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        int barHeight = Math.round(getResources().getDisplayMetrics().density * 4);
        FrameLayout.LayoutParams barParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, barHeight);
        barParams.gravity = Gravity.TOP;
        container.addView(progress, barParams);
        setContentView(container);

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setUserAgentString(settings.getUserAgentString() + " OSIDDashboard/1.3");

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(web, true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            web.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        }

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isOrangeSky(uri)) {
                    return false; // tetap di dalam WebView
                }
                return openExternally(uri); // WA, tel:, mailto:, dll dibuka di aplikasi lain
            }

        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_CHOOSER_REQUEST);
                } catch (Exception e) {
                    filePathCallback = null;
                    return false;
                }
                return true;
            }
        });

        web.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition,
                                        String mimeType, long contentLength) {
                openExternally(Uri.parse(url));
            }
        });

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(START_URL);
        }
    }

    private static boolean isOrangeSky(Uri uri) {
        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equalsIgnoreCase("https") && !scheme.equalsIgnoreCase("http"))) {
            return false;
        }
        String host = uri.getHost();
        if (host == null) {
            return false;
        }
        host = host.toLowerCase(Locale.ROOT);
        return host.equals(HOST) || host.endsWith("." + HOST);
    }

    private boolean openExternally(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException e) {
            // Tidak ada aplikasi penangan: abaikan saja.
        }
        return true;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || filePathCallback == null) {
            return;
        }
        Uri[] results = null;
        if (resultCode == RESULT_OK && data != null && data.getData() != null) {
            results = new Uri[]{data.getData()};
        }
        filePathCallback.onReceiveValue(results);
        filePathCallback = null;
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (web != null) {
            web.saveState(outState);
        }
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
