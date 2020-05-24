package com.vonlegohufvud.texttvsv;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;

import java.util.Map;

import io.reactivex.disposables.CompositeDisposable;
import io.reactivex.functions.Consumer;

import static androidx.preference.PreferenceManager.getDefaultSharedPreferences;

public class MainActivity extends AppCompatActivity {

  AppStateService mAppState = ServiceLocator.getInstance().getAppStateService();
  CustomSwipeRefreshLayout mSwipeRefreshLayout;
  WebView mWebView;
  LinearLayout mOverlay;
  CompositeDisposable mSubscriptions = new CompositeDisposable();

  int resumeCount = 0;
  int pauseCount = 0;

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
        // Log.d("TextTvPageFragment", "onPageFinished");
        mOverlay.setVisibility(LinearLayout.GONE);
      }
    });
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      mWebView.setWebContentsDebuggingEnabled(true);
    }
    if (savedInstanceState == null) {
      mWebView.loadUrl(BuildConfig.WEB_APP_URL);
    }


    mSwipeRefreshLayout = findViewById(R.id.swipe_refresh_layout);
    //mSwipeRefreshLayout.setProgressBackgroundColorSchemeResource(R.color.colorAccent);
    mSwipeRefreshLayout.setColorSchemeColors(getResources().getColor(R.color.colorPrimary));
    mSwipeRefreshLayout.setEnabled(false);
    mSwipeRefreshLayout.setOnRefreshListener(new SwipeRefreshLayout.OnRefreshListener() {
      @Override
      public void onRefresh() {
        mAppState.setRefreshing(true);
      }
    });
    mSwipeRefreshLayout.setOnChildScrollUpCallback(new SwipeRefreshLayout.OnChildScrollUpCallback() {
      @Override
      public boolean canChildScrollUp(@NonNull SwipeRefreshLayout parent, @Nullable View child) {
        return mWebView.getScrollY() > 0;
      }
    });

    this.initSubscriptions();
    mAppState.setPreferences(getDefaultSharedPreferences(this).getAll());
  }

  public void initSubscriptions() {
    mSubscriptions.addAll(
      mAppState.getPreferences().subscribe(new Consumer<Map<String, ?>>() {
        @Override
        public void accept(Map<String, ?> res) {
          boolean value = res.get("swipeRefresh") != null ? ((Boolean)res.get("swipeRefresh")).booleanValue() : true;
          if(mSwipeRefreshLayout.isEnabled() != value) {
            if (mSwipeRefreshLayout.isRefreshing()) {
              mSwipeRefreshLayout.setRefreshing(false);
            }
            mSwipeRefreshLayout.setEnabled(value);
          }
        }
      }),
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
  protected void onResume() {
    super.onResume();
    if(this.resumeCount > 0) {
      this.mAppState.triggerResume(this.resumeCount);
    }
    this.resumeCount++;
  }

  @Override
  protected void onPause() {
    super.onPause();
    this.pauseCount++;
    this.mAppState.triggerPause(this.pauseCount);
  }

  @Override
  public void onBackPressed() {
    if (mWebView.canGoBack()) {
      mWebView.goBack();
    } else {
      super.onBackPressed();
    }
  }

  @Override
  protected void onSaveInstanceState(Bundle outState ) {
    super.onSaveInstanceState(outState);
    mWebView.saveState(outState);
  }

  @Override
  protected void onRestoreInstanceState(Bundle savedInstanceState) {
    super.onRestoreInstanceState(savedInstanceState);
    mWebView.restoreState(savedInstanceState);
  }

  @Override
  protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);

    if (requestCode == WebAppInterface.SETTINGS_REQUEST_CODE) {
      boolean changed = data.getBooleanExtra("changed", false);
      mAppState.setPreferences(getDefaultSharedPreferences(this).getAll());
    }
  }
}
