package id.orangesky.admin;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.GestureDetector;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.Locale;

/**
 * OS.ID Dashboard — WebView dengan chrome aplikasi Android:
 * top bar, bottom navigation mengambang, dan indikator loading jaringan.
 * Konten tetap berasal dari dashboard live orangesky.id.
 */
public class MainActivity extends Activity {

    private static final String BASE = "https://orangesky.id/manajemen/";
    private static final String INDEX = BASE + "index.php?menu=";
    private static final int FILE_CHOOSER_REQUEST = 1001;

    private static final int ACTIVE_COLOR = Color.parseColor("#28293B");
    private static final int INACTIVE_COLOR = Color.parseColor("#7A7F8C");
    private static final int GOLD = Color.parseColor("#C0A751");

    private static final String[] TAB_LABELS = {
            "Rate Plan & Avability", "Booking", "Property", "Member", "Laporan"
    };
    private static final int[] TAB_ICONS = {
            R.drawable.ic_nav_rate,
            R.drawable.ic_nav_booking,
            R.drawable.ic_nav_property,
            R.drawable.ic_nav_member,
            R.drawable.ic_nav_report
    };
    private static final String[] TAB_URLS = {
            INDEX + "ratePlans",
            INDEX + "bookingKeyword",
            INDEX + "property",
            INDEX + "member",
            INDEX + "lapBooking"
    };

    private static final String[] MORE_LABELS = {
            "Rate Plan", "Facility", "Voucher", "User & Hak Akses",
            "Cek Pembayaran", "Update Poin Member",
            "Laporan Room", "Laporan Member", "Ganti Password", "Log Out"
    };
    private static final String[] MORE_URLS = {
            INDEX + "ratePlans", INDEX + "facility", INDEX + "voucher", INDEX + "user",
            INDEX + "checkBookingPayment", INDEX + "updateMemberPoint",
            INDEX + "lapRoom", INDEX + "lapMember", INDEX + "gantiPass", INDEX + "keluar"
    };

    private WebView web;
    private ProgressBar progress;
    private View loadingCard;
    private LinearLayout topBar;
    private LinearLayout bottomNav;
    private GestureDetector gestureDetector;
    private float lastTouchY;
    private boolean bottomNavHidden;

    private final View[] tabItems = new View[5];
    private final ImageView[] tabIcons = new ImageView[5];
    private final TextView[] tabLabels = new TextView[5];
    private int activeTab = 0;
    private ValueCallback<Uri[]> filePathCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.parseColor("#28293B"));

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);

        // ---------- Top app bar ----------
        topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.HORIZONTAL);
        topBar.setGravity(Gravity.CENTER_VERTICAL);
        topBar.setBackgroundColor(Color.parseColor("#28293B"));
        topBar.setPadding(dp(16), 0, dp(8), 0);

        TextView appTitle = new TextView(this);
        appTitle.setText("OS.ID Dashboard");
        appTitle.setTextColor(Color.WHITE);
        appTitle.setTextSize(18);
        topBar.addView(appTitle, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f));

        TextView refresh = actionText("↻");
        refresh.setOnClickListener(v -> {
            showLoading();
            web.reload();
        });
        topBar.addView(refresh);

        TextView more = actionText("⋮");
        more.setOnClickListener(this::showMoreMenu);
        topBar.addView(more);

        content.addView(topBar, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(56)));

        // ---------- Web area ----------
        FrameLayout webArea = new FrameLayout(this);
        web = new WebView(this);
        webArea.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setIndeterminate(false);
        progress.setProgressBackgroundTintList(ColorStateList.valueOf(Color.parseColor("#E9E6DA")));
        progress.setProgressTintList(ColorStateList.valueOf(GOLD));
        progress.setVisibility(View.GONE);
        FrameLayout.LayoutParams barParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, dp(4));
        barParams.gravity = Gravity.TOP;
        webArea.addView(progress, barParams);

        loadingCard = buildLoadingCard();
        FrameLayout.LayoutParams loadingParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER);
        webArea.addView(loadingCard, loadingParams);

        LinearLayout.LayoutParams webParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f);
        content.addView(webArea, webParams);

        root.addView(content, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        // ---------- Floating bottom navigation ----------
        bottomNav = new LinearLayout(this);
        bottomNav.setOrientation(LinearLayout.HORIZONTAL);
        bottomNav.setBackgroundResource(R.drawable.bg_bottom_nav);
        bottomNav.setElevation(dp(10));
        bottomNav.setPadding(dp(4), dp(6), dp(4), dp(6));
        for (int i = 0; i < TAB_LABELS.length; i++) {
            bottomNav.addView(buildTab(i),
                    new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f));
        }
        FrameLayout.LayoutParams navParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, dp(64), Gravity.BOTTOM);
        navParams.setMargins(dp(12), 0, dp(12), dp(12));
        root.addView(bottomNav, navParams);

        setContentView(root);
        setActiveTab(0, false);
        configureWebView();

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            showLoading();
            web.loadUrl(BASE);
        }
    }

    private View buildLoadingCard() {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER);
        card.setBackgroundResource(R.drawable.bg_loading);
        card.setPadding(dp(20), dp(16), dp(20), dp(16));
        card.setElevation(dp(8));
        card.setClickable(false);
        card.setFocusable(false);

        ProgressBar spinner = new ProgressBar(this, null, android.R.attr.progressBarStyle);
        spinner.setIndeterminate(true);
        spinner.setIndeterminateTintList(ColorStateList.valueOf(GOLD));
        card.addView(spinner, new LinearLayout.LayoutParams(dp(34), dp(34)));

        TextView label = new TextView(this);
        label.setText("Memuat...");
        label.setTextColor(Color.WHITE);
        label.setTextSize(13);
        label.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams labelParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        labelParams.topMargin = dp(8);
        card.addView(label, labelParams);

        card.setVisibility(View.GONE);
        return card;
    }

    private TextView actionText(String text) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextColor(Color.WHITE);
        view.setTextSize(22);
        view.setGravity(Gravity.CENTER);
        view.setPadding(dp(12), dp(6), dp(4), dp(6));
        return view;
    }

    private View buildTab(final int index) {
        LinearLayout item = new LinearLayout(this);
        item.setOrientation(LinearLayout.VERTICAL);
        item.setGravity(Gravity.CENTER);
        item.setPadding(0, dp(8), 0, dp(6));
        item.setOnClickListener(v -> {
            showBottomNav();
            setActiveTab(index, true);
        });

        ImageView icon = new ImageView(this);
        icon.setImageResource(TAB_ICONS[index]);
        icon.setAdjustViewBounds(true);
        icon.setMaxWidth(dp(24));
        icon.setMaxHeight(dp(24));

        TextView label = new TextView(this);
        label.setText(TAB_LABELS[index]);
        label.setTextSize(11);
        label.setGravity(Gravity.CENTER);

        item.addView(icon);
        item.addView(label);

        tabItems[index] = item;
        tabIcons[index] = icon;
        tabLabels[index] = label;
        return item;
    }

    private void configureWebView() {
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setUserAgentString(settings.getUserAgentString() + " OSIDDashboard/1.11");

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(web, true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            web.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        }

        gestureDetector = new GestureDetector(this, new GestureDetector.SimpleOnGestureListener() {
            @Override
            public boolean onDown(MotionEvent e) {
                lastTouchY = e.getY();
                return true;
            }

            @Override
            public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX, float distanceY) {
                float delta = e2.getY() - lastTouchY;
                lastTouchY = e2.getY();
                if (Math.abs(delta) < 4f) {
                    return false;
                }
                if (delta < 0) {
                    hideBottomNav();   // jari naik = halaman scroll ke bawah
                } else {
                    showBottomNav();   // jari turun = halaman scroll ke atas
                }
                return false;
            }
        });
        web.setOnTouchListener((v, event) -> {
            gestureDetector.onTouchEvent(event);
            return false;
        });

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isOrangeSky(uri)) {
                    return false;
                }
                return openExternally(uri);
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                showLoading();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                hideLoading();
                syncFromUrl(url);
                showBottomNav();
                fitToDevice(view);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                hideLoading();
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                boolean loading = newProgress < 100;
                progress.setProgress(newProgress);
                progress.setVisibility(loading ? View.VISIBLE : View.GONE);
                loadingCard.setVisibility(loading ? View.VISIBLE : View.GONE);
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
    }

    /**
     * Render halaman selebar perangkat (bukan di-scaling mengecil agar muat semua),
     * supaya teks tabel/rate plan tetap terbaca. Tabel lebar tetap bisa di-scroll
     * horizontal atau diperbesar dengan pinch-zoom.
     */
    private static void fitToDevice(WebView view) {
        String viewport = "width=device-width, initial-scale=1, minimum-scale=0.5,"
                + " maximum-scale=5, user-scalable=yes";
        String css = "html,body{max-width:100%!important}"
                + "img,video{max-width:100%!important;height:auto!important}"
                + ".dataTables_wrapper,.table-responsive{overflow-x:auto!important}";

        String script = "(function(){"
                + "var c=" + jsLiteral(viewport) + ";"
                + "var m=document.querySelector('meta[name=viewport]');"
                + "if(m){m.setAttribute('content',c);}else{"
                + "m=document.createElement('meta');m.name='viewport';"
                + "m.setAttribute('content',c);document.head.appendChild(m);}"
                + "var s=document.getElementById('osid-fit');"
                + "if(!s){s=document.createElement('style');s.id='osid-fit';"
                + "s.textContent=" + jsLiteral(css) + ";"
                + "document.head.appendChild(s);}"
                + "})();";
        view.evaluateJavascript(script, null);
    }

    private static String jsLiteral(String value) {
        return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'";
    }

    private void showLoading() {
        if (loadingCard == null || progress == null) {
            return;
        }
        progress.setProgress(0);
        progress.setVisibility(View.VISIBLE);
        loadingCard.setVisibility(View.VISIBLE);
    }

    private void hideLoading() {
        if (loadingCard == null || progress == null) {
            return;
        }
        progress.setProgress(100);
        progress.setVisibility(View.GONE);
        loadingCard.setVisibility(View.GONE);
    }

    private void showBottomNav() {
        if (bottomNav == null) {
            return;
        }
        bottomNav.animate().cancel();
        bottomNav.animate().translationY(0f).setDuration(180).start();
        bottomNavHidden = false;
    }

    private void hideBottomNav() {
        if (bottomNav == null || bottomNav.getVisibility() != View.VISIBLE || bottomNavHidden) {
            return;
        }
        bottomNav.animate().cancel();
        bottomNav.animate().translationY(dp(84)).setDuration(180).start();
        bottomNavHidden = true;
    }

    private void showMoreMenu(View anchor) {
        PopupMenu popup = new PopupMenu(this, anchor);
        for (int i = 0; i < MORE_LABELS.length; i++) {
            final int index = i;
            popup.getMenu().add(MORE_LABELS[i]).setOnMenuItemClickListener(item -> {
                showLoading();
                showBottomNav();
                web.loadUrl(MORE_URLS[index]);
                return true;
            });
        }
        popup.show();
    }

    private void setActiveTab(int index, boolean load) {
        activeTab = index;
        for (int i = 0; i < tabIcons.length; i++) {
            int color = (i == index) ? ACTIVE_COLOR : INACTIVE_COLOR;
            tabIcons[i].setImageTintList(ColorStateList.valueOf(color));
            tabLabels[i].setTextColor(color);
        }
        if (load) {
            showLoading();
            web.loadUrl(TAB_URLS[index]);
        }
    }

    private void syncFromUrl(String url) {
        String lower = (url == null) ? "" : url.toLowerCase(Locale.ROOT);
        int index = 0;
        if (lower.contains("menu=bookingkeyword") || lower.contains("menu=bookingdate")) {
            index = 1;
        } else if (lower.contains("menu=property") || lower.contains("menu=facility")) {
            index = 2;
        } else if (lower.contains("menu=member")) {
            index = 3;
        } else if (lower.contains("menu=lap")) {
            index = 4;
        }
        setActiveTab(index, false);

        boolean loginScreen = lower.endsWith("/login.php") || lower.contains("menu=keluar");
        topBar.setVisibility(loginScreen ? View.GONE : View.VISIBLE);
        bottomNav.setVisibility(loginScreen ? View.GONE : View.VISIBLE);
        if (loginScreen) {
            bottomNav.setTranslationY(0f);
            bottomNavHidden = false;
            hideLoading();
        } else {
            showBottomNav();
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
        return host.equals("orangesky.id") || host.endsWith(".orangesky.id");
    }

    private boolean openExternally(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException e) {
            // Abaikan bila tidak ada aplikasi penangan.
        }
        return true;
    }

    private int dp(int value) {
        return Math.round(getResources().getDisplayMetrics().density * value);
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
            showLoading();
            web.goBack();
        } else if (activeTab != 0) {
            setActiveTab(0, true);
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
