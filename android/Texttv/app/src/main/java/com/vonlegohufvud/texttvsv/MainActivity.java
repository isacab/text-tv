package com.vonlegohufvud.texttvsv;
import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import java.util.Map;
import io.reactivex.disposables.CompositeDisposable;
import io.reactivex.functions.Consumer;
import com.vonlegohufvud.texttvsv.texttv.TextTvFragment;

import static androidx.preference.PreferenceManager.getDefaultSharedPreferences;

public class MainActivity extends AppCompatActivity {

  AppStateService mAppState = ServiceLocator.getInstance().getAppStateService();
  TextTvFragment mTextTvFragment;
  CompositeDisposable mSubscriptions = new CompositeDisposable();

  int resumeCount = 0;
  int focusCount = 0;
  int pauseCount = 0;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);
    mTextTvFragment = (TextTvFragment) getSupportFragmentManager().findFragmentById(R.id.textTvFragment);
    mTextTvFragment.setOnRefreshListener(new TextTvFragment.OnRefreshListener() {
      @Override
      public void onRefresh() {
        mAppState.setRefreshing(true);
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
          mTextTvFragment.setSwipeRefreshEnabled(value);
        }
      }),
      mAppState.getRefreshing().subscribe(new Consumer<Boolean>() {
        @Override
        public void accept(Boolean res) {
          if (mTextTvFragment.isRefreshing() != res) {
            mTextTvFragment.setRefreshing(res);
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
    if (mTextTvFragment.getWebView().canGoBack()) {
      mTextTvFragment.getWebView().goBack();
    } else {
      super.onBackPressed();
    }
  }

  @Override
  protected void onSaveInstanceState(Bundle outState ) {
    super.onSaveInstanceState(outState);
    mTextTvFragment.getWebView().saveState(outState);
  }

  @Override
  protected void onRestoreInstanceState(Bundle savedInstanceState) {
    super.onRestoreInstanceState(savedInstanceState);
    mTextTvFragment.getWebView().restoreState(savedInstanceState);
  }

  /*@Override
  protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);

    if (requestCode == WebAppInterface.SETTINGS_REQUEST_CODE) {
      boolean changed = data.getBooleanExtra("changed", false);
      mAppState.setPreferences(getDefaultSharedPreferences(this).getAll());
    }
  }*/
}
