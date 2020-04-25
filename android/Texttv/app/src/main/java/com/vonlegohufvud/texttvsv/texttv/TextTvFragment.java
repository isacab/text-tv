package com.vonlegohufvud.texttvsv.texttv;

import android.os.Build;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;

import com.vonlegohufvud.texttvsv.BuildConfig;
import com.vonlegohufvud.texttvsv.R;
import com.vonlegohufvud.texttvsv.WebAppInterface;
import com.vonlegohufvud.texttvsv.shared.CustomSwipeRefreshLayout;

public class TextTvFragment extends Fragment {

  public interface OnRefreshListener extends SwipeRefreshLayout.OnRefreshListener {};

  CustomSwipeRefreshLayout mSwipeRefreshLayout;
  WebView mWebView;
  LinearLayout mOverlay;
  SwipeRefreshLayout.OnRefreshListener mRefreshListener;

  public TextTvFragment() { }

  @Override
  public View onCreateView(LayoutInflater inflater, ViewGroup container,
                           Bundle savedInstanceState) {
    View v = inflater.inflate(R.layout.fragment_text_tv, container, false);

    mOverlay = v.findViewById(R.id.overlay);

    mWebView = v.findViewById(R.id.web_view);
    mWebView.getSettings().setJavaScriptEnabled(true);
    mWebView.getSettings().setDomStorageEnabled(true);
    mWebView.getSettings().setAppCacheEnabled(true);
    mWebView.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
    mWebView.addJavascriptInterface(new WebAppInterface(getActivity(), mWebView), "Android");
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

    mSwipeRefreshLayout = v.findViewById(R.id.swipe_refresh_layout);
    //mSwipeRefreshLayout.setProgressBackgroundColorSchemeResource(R.color.colorAccent);
    mSwipeRefreshLayout.setColorSchemeColors(getResources().getColor(R.color.colorPrimary));
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

    return v;
  }

  public WebView getWebView() {
    return mWebView;
  }

  public boolean getSwipeRefreshEnabled() {
    return mSwipeRefreshLayout.isEnabled();
  }

  public void setSwipeRefreshEnabled(boolean value) {
    if(mSwipeRefreshLayout.isEnabled() != value) {
      if (mSwipeRefreshLayout.isRefreshing()) {
        mSwipeRefreshLayout.setRefreshing(false);
      }
      mSwipeRefreshLayout.setEnabled(value);
    }
  }

  public boolean isRefreshing() {
    return mSwipeRefreshLayout.isRefreshing();
  }

  public void setRefreshing(boolean value) {
    mSwipeRefreshLayout.setRefreshing(value);
  }

  public void setOnRefreshListener(OnRefreshListener listener) {
    mRefreshListener = listener;
    if(mSwipeRefreshLayout != null) {
      mSwipeRefreshLayout.setOnRefreshListener(listener);
    }
  }

}
