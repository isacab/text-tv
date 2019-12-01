package com.vonlegohufvud.texttvsv;

import android.app.Activity;
import android.content.Context;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import java.util.ArrayList;
import java.util.List;

import io.reactivex.disposables.CompositeDisposable;
import io.reactivex.functions.Consumer;

public class WebAppInterface {

  Context mContext;
  WebView mWebView;
  AppStateService mAppState = ServiceLocator.getInstance().getAppStateService();

  List<String> mMessageCallbacks = new ArrayList<>();

  CompositeDisposable mSubscriptions = new CompositeDisposable();

  public WebAppInterface(Context context, WebView webView) {
    mContext = context;
    mWebView = webView;
    initSubscriptions();
  }

  public void destroy() {
    disposeSubscriptions();
  }

  @JavascriptInterface
  public void onMessage(String callback) {
    mMessageCallbacks.add(callback);
  }

  @JavascriptInterface
  public void setPage(String value) {
    try {
      int page = Integer.parseInt(value);
      mAppState.setPage(page);
    } catch (NumberFormatException e) {
      Log.d("setPage", e.getMessage() + e.getStackTrace().toString());
    }
  }

  @JavascriptInterface
  public void setRefreshing(String value) {
    try {
      boolean refreshing = Boolean.parseBoolean(value);
      mAppState.setRefreshing(refreshing);
    } catch (NumberFormatException e) {
      Log.d("setRefreshing", e.getMessage() + e.getStackTrace().toString());
    }
  }

  protected void initSubscriptions() {
    mSubscriptions.addAll(
      mAppState.getPage().subscribe(new Consumer<Integer>() {
        @Override
        public void accept(Integer res) {
          runCallbacks(mMessageCallbacks, "page_changed", res);
        }
      }),
      mAppState.getRefreshing().subscribe(new Consumer<Boolean>() {
        @Override
        public void accept(Boolean res) {
          runCallbacks(mMessageCallbacks, "refreshing_changed", res);
        }
      })
    );
  }

  protected void disposeSubscriptions() {
    mSubscriptions.dispose();
  }

  protected void runCallbacks(List<String> callbacks, String message, Object details) {
    String url = "javascript:";
    String detailsStr = details.toString();
    if(details instanceof String) {
      detailsStr = "'" + detailsStr + "'";
    }
    for (String callback : callbacks) {
      url += callback + "('" + message + "'," + detailsStr + ");";
    }
    if (mContext instanceof Activity) {
      ((Activity) mContext).runOnUiThread(new LoadUrlRunnable(url));
    } else {
      Log.d("WebAppInterface", "context is not an instance of Activity");
    }
  }

  class LoadUrlRunnable implements Runnable {
    private String _url;

    public LoadUrlRunnable(String url) {
      super();
      _url = url;
    }

    @Override
    public void run() {
      mWebView.loadUrl(_url);
    }
  }
}


