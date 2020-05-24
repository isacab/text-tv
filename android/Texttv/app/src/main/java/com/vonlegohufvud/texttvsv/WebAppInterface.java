package com.vonlegohufvud.texttvsv;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.apache.commons.lang3.ClassUtils;
import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import io.reactivex.disposables.CompositeDisposable;
import io.reactivex.functions.Consumer;

public class WebAppInterface {

  Activity mActivity;
  WebView mWebView;
  AppStateService mAppState = ServiceLocator.getInstance().getAppStateService();

  List<String> mMessageCallbacks = new ArrayList<>();

  CompositeDisposable mSubscriptions;

  public static final int SETTINGS_REQUEST_CODE = 1;

  public WebAppInterface(Activity activity, WebView webView) {
    mActivity = activity;
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

  @JavascriptInterface
  public void getPreferences() {
    Map<String, ?> preferences = mAppState.getPreferencesValue();
    runCallbacks(mMessageCallbacks, "preferences_get", preferences);
  }

  @JavascriptInterface
  public void openSettings() {
    try {
      Intent i = new Intent(mActivity, SettingsActivity.class);
      mActivity.startActivityForResult(i, SETTINGS_REQUEST_CODE);
    } catch (Exception e) {
      Log.d("openSettings", e.getMessage() + e.getStackTrace().toString());
    }
  }

  protected void initSubscriptions() {
    mSubscriptions = new CompositeDisposable();
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
      }),
      mAppState.getPreferences().subscribe(new Consumer<Map<String, ?>>() {
        @Override
        public void accept(Map<String, ?> res) {
          runCallbacks(mMessageCallbacks, "preferences_changed", res);
        }
      }),
      mAppState.onResume().subscribe(new Consumer<Boolean>() {
        @Override
        public void accept(Boolean res) {
          runCallbacks(mMessageCallbacks, "resumed", res);
        }
      }),
      mAppState.onPause().subscribe(new Consumer<Boolean>() {
        @Override
        public void accept(Boolean res) {
          runCallbacks(mMessageCallbacks, "paused", res);
        }
      })
    );
  }

  protected void disposeSubscriptions() {
    if(mSubscriptions != null) {
      mSubscriptions.dispose();
    }
  }

  protected void runCallbacks(List<String> callbacks, String message, Object details) {
    String url = "javascript:";

    String detailsStr;
    if (details == null) {
      detailsStr = "null";
    } else if(details instanceof String) {
      detailsStr = "'" + details + "'";
    } else if(ClassUtils.isPrimitiveOrWrapper(details.getClass())) {
      detailsStr = details.toString();
    } else {
      detailsStr = this.encodeJson(details);
    }

    for (String callback : callbacks) {
      url += callback + "('" + message + "'," + detailsStr + ");";
    }

    mActivity.runOnUiThread(new LoadUrlRunnable(url));
  }

  protected String encodeJson(Object obj) {
    ObjectMapper objectMapper = new ObjectMapper();
    String json = "null";
    try {
      json = objectMapper.writeValueAsString(obj);
    } catch (JsonGenerationException e) {
      Log.d("WebAppInterface", "encodeJson JsonGenerationException: " + e.getMessage());
      e.printStackTrace();
    } catch (JsonMappingException e) {
      Log.d("WebAppInterface", "encodeJson JsonMappingException: " + e.getMessage());
      e.printStackTrace();
    } catch (IOException e) {
      Log.d("WebAppInterface", "encodeJson IOException: " + e.getMessage());
      e.printStackTrace();
    }
    return json;
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


