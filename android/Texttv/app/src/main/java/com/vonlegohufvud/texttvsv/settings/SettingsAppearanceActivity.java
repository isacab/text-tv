package com.vonlegohufvud.texttvsv.settings;

import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.preference.PreferenceFragmentCompat;

import com.vonlegohufvud.texttvsv.BuildConfig;
import com.vonlegohufvud.texttvsv.R;
import com.vonlegohufvud.texttvsv.WebAppInterface;
import com.vonlegohufvud.texttvsv.settings.SettingsActivity;

public class SettingsAppearanceActivity extends SettingsActivity implements SharedPreferences.OnSharedPreferenceChangeListener {

  WebView mWebView;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
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
        //mOverlay.setVisibility(LinearLayout.GONE);
      }
    });
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      mWebView.setWebContentsDebuggingEnabled(true);
    }
    if (savedInstanceState == null) {
      mWebView.loadUrl(BuildConfig.WEB_APP_URL + "/#/?preview_mode=1");
    }
  }

  @Override
  protected int getLayoutId() {
    return R.layout.settings_appearance_activity;
  }

  @Override
  protected PreferenceFragmentCompat getPreferenceFragment() {
    return new SettingsAppearanceFragment();
  }

  public static class SettingsAppearanceFragment extends PreferenceFragmentCompat {
    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {
      setPreferencesFromResource(R.xml.appearance_preferences, rootKey);
    }
  }

}
