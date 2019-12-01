package com.vonlegohufvud.texttvsv;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;

import io.reactivex.disposables.CompositeDisposable;
import io.reactivex.functions.Consumer;

public class MainActivity extends AppCompatActivity {

  AppStateService mAppState = ServiceLocator.getInstance().getAppStateService();
  CustomSwipeRefreshLayout mSwipeRefreshLayout;
  WebView mWebView;
  LinearLayout mOverlay;
  CompositeDisposable mSubscriptions = new CompositeDisposable();

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    mOverlay = findViewById(R.id.overlay);

    mWebView = findViewById(R.id.web_view);
    mWebView.getSettings().setJavaScriptEnabled(true);
    mWebView.getSettings().setDomStorageEnabled(true);
    mWebView.getSettings().setAppCacheEnabled(true);
    mWebView.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
    mWebView.addJavascriptInterface(new WebAppInterface(this, mWebView), "Android");
    mWebView.setWebViewClient(new WebViewClient() {
      @Override
      public void onPageFinished(WebView view, String url) {
        Log.d("TextTvPageFragment", "onPageFinished");
        mOverlay.setVisibility(LinearLayout.GONE);
      }
    });
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      mWebView.setWebContentsDebuggingEnabled(true);
    }
    mWebView.loadUrl("file:///android_asset/www/index.html");

    mSwipeRefreshLayout = findViewById(R.id.swipe_refresh_layout);
    //mSwipeRefreshLayout.setProgressBackgroundColorSchemeResource(R.color.colorAccent);
    mSwipeRefreshLayout.setColorSchemeColors(getResources().getColor(R.color.colorPrimary));
    mSwipeRefreshLayout.setOnRefreshListener(new SwipeRefreshLayout.OnRefreshListener() {
      @Override
      public void onRefresh() {
        mAppState.setRefreshing(true);
      }
    });
    mSwipeRefreshLayout.setEnabled(true);
    mSwipeRefreshLayout.setOnChildScrollUpCallback(new SwipeRefreshLayout.OnChildScrollUpCallback() {
      @Override
      public boolean canChildScrollUp(@NonNull SwipeRefreshLayout parent, @Nullable View child) {
        return mWebView.getScrollY() > 0;
      }
    });

    this.initSubscriptions();
  }

  public void initSubscriptions() {
    mSubscriptions.addAll(
      mAppState.getRefreshing().subscribe(new Consumer<Boolean>() {
        @Override
        public void accept(Boolean res) {
          if (mSwipeRefreshLayout.isRefreshing() != res) {
            mSwipeRefreshLayout.setRefreshing(res);
          }
        }
      })
    );
  }

  @Override
  public void onBackPressed() {
    if (mWebView.canGoBack()) {
      mWebView.goBack();
    } else {
      super.onBackPressed();
    }
  }
}
