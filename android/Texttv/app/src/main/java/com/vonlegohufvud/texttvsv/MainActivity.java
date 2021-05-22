package com.vonlegohufvud.texttvsv;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import android.app.Application;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.Map;
import io.reactivex.disposables.CompositeDisposable;
import io.reactivex.functions.Consumer;

import com.vonlegohufvud.texttvsv.fragments.FindInPageFragment;
import com.vonlegohufvud.texttvsv.shared.CustomSwipeRefreshLayout;

import static androidx.preference.PreferenceManager.getDefaultSharedPreferences;

public class MainActivity extends AppCompatActivity {

  AppStateService mAppState = ServiceLocator.getInstance().getAppStateService();
  CompositeDisposable mSubscriptions = new CompositeDisposable();

  CustomSwipeRefreshLayout mSwipeRefreshLayout;
  WebView mWebView;
  SwipeRefreshLayout.OnRefreshListener mRefreshListener;
  FindInPageFragment mFindInPageFragment = new FindInPageFragment();

  int resumeCount = 0;
  int pauseCount = 0;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    mWebView = findViewById(R.id.web_view);
    mWebView.getSettings().setJavaScriptEnabled(true);
    mWebView.getSettings().setDomStorageEnabled(true);
    mWebView.getSettings().setAppCacheEnabled(true);
    mWebView.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
    mWebView.addJavascriptInterface(new WebAppInterface(this, mWebView), "Android");
    mWebView.setBackgroundColor(0);
    mWebView.setWebViewClient(new WebViewClient() {
      @Override
      public void doUpdateVisitedHistory(WebView webView, String url, boolean isReload) {
        mAppState.setCanGoForward(webView.canGoForward());
        super.doUpdateVisitedHistory(webView, url, isReload);
        Boolean findInPage = mAppState.getShowFindInPageValue();
        if(findInPage != null && findInPage) {
          hideFindInPage();
        }
      }
    });
    mWebView.setFindListener(new WebView.FindListener() {
      @Override
      public void onFindResultReceived(int activeMatchOrdinal, int numberOfMatches, boolean isDoneCounting) {
        mFindInPageFragment.setFindResult(activeMatchOrdinal, numberOfMatches);
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
    mSwipeRefreshLayout.setColorSchemeColors(ContextCompat.getColor(getApplicationContext(), R.color.colorPrimary));
    mSwipeRefreshLayout.setEnabled(false);
    if(mRefreshListener != null) {
      mSwipeRefreshLayout.setOnRefreshListener(mRefreshListener);
    }
    mSwipeRefreshLayout.setOnChildScrollUpCallback(new SwipeRefreshLayout.OnChildScrollUpCallback() {
      @Override
      public boolean canChildScrollUp(@NonNull SwipeRefreshLayout parent, @Nullable View child) {
        return mWebView.getScrollY() > 0;
      }
    });

    mFindInPageFragment = (FindInPageFragment) getSupportFragmentManager().findFragmentById(R.id.find_in_page_fragment);
    getSupportFragmentManager().beginTransaction()
      .hide(mFindInPageFragment)
      .commit();

    this.initSubscriptions();
    mAppState.setPreferences(getDefaultSharedPreferences(this).getAll());
  }

  protected void initSubscriptions() {
    mSubscriptions.addAll(
      mAppState.getPreferences().subscribe(new Consumer<Map<String, ?>>() {
        @Override
        public void accept(Map<String, ?> res) {
          boolean value = res.get("swipeRefresh") != null ? ((Boolean)res.get("swipeRefresh")).booleanValue() : true;
          setSwipeRefreshEnabled(value);
        }
      }),
      mAppState.getRefreshing().subscribe(new Consumer<Boolean>() {
        @Override
        public void accept(Boolean res) {
          if (mSwipeRefreshLayout.isRefreshing() != res) {
            mSwipeRefreshLayout.setRefreshing(res);
          }
        }
      }),
      mAppState.getShowFindInPage().subscribe(new Consumer<Boolean>() {
        @Override
        public void accept(Boolean res) {
          if(res == true)
            showFindInPage();
          else
            hideFindInPage();
        }
      }),
      mFindInPageFragment.textChanged().subscribe(new Consumer<String>() {
        @Override
        public void accept(String res) {
          mWebView.findAllAsync(res);
        }
      }),
      mFindInPageFragment.findNextClick().subscribe(new Consumer<Boolean>() {
        @Override
        public void accept(Boolean res) {
          mWebView.findNext(res);
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
    if (mAppState.getShowFindInPageValue()) {
      hideFindInPage();
    } else if (mWebView.canGoBack()) {
      mWebView.goBack();
    } else if(mAppState.getBlockExitValue()) {
      mAppState.setBlockExit(false);
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

  /*@Override
  protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);

    if (requestCode == WebAppInterface.SETTINGS_REQUEST_CODE) {
      boolean changed = data.getBooleanExtra("changed", false);
      mAppState.setPreferences(getDefaultSharedPreferences(this).getAll());
    }
  }*/

  protected void setSwipeRefreshEnabled(boolean value) {
    if(mSwipeRefreshLayout.isEnabled() != value) {
      if (mSwipeRefreshLayout.isRefreshing()) {
        mSwipeRefreshLayout.setRefreshing(false);
      }
      mSwipeRefreshLayout.setEnabled(value);
    }
  }

  public void showFindInPage() {
    getSupportFragmentManager().beginTransaction()
      .show(mFindInPageFragment)
      .commit();
    mFindInPageFragment.focus();
    mAppState.setShowFindInPage(true);
  }

  public void hideFindInPage() {
    mAppState.setShowFindInPage(false);
    mWebView.clearMatches();
    Handler handler = new Handler();
    Runnable runnable = new Runnable() {
      @Override
      public void run() {
        getSupportFragmentManager().beginTransaction()
          .hide(mFindInPageFragment)
          .commit();
      }
    };
    handler.postDelayed(runnable, 100);
  }
}
