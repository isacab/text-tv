package com.vonlegohufvud.texttvsv;

import android.os.Handler;
import android.os.Looper;

import com.vonlegohufvud.texttvsv.shared.RunnableWithArg;

import java.util.Map;

import io.reactivex.Observable;
import io.reactivex.subjects.AsyncSubject;
import io.reactivex.subjects.PublishSubject;
import io.reactivex.subjects.ReplaySubject;

public class AppStateService {

  private ReplaySubject<Integer> mPageSubject = ReplaySubject.createWithSize(1);
  private ReplaySubject<Boolean> mCanGoForwardSubject = ReplaySubject.createWithSize(1);
  private ReplaySubject<Boolean> mRefreshingSubject = ReplaySubject.createWithSize(1);
  private ReplaySubject<Boolean> mBlockExitSubject = ReplaySubject.createWithSize(1);
  private ReplaySubject<Boolean> mShowFindInPageSubject = ReplaySubject.createWithSize(1);
  private ReplaySubject<Map<String, ?>> mPreferencesSubject = ReplaySubject.createWithSize(1);
  private PublishSubject<Integer> mResumeSubject = PublishSubject.create();
  private PublishSubject<Integer> mPauseSubject = PublishSubject.create();

  public AppStateService() {
  }

  public Observable<Integer> getPage() {
    return mPageSubject.hide();
  }

  public Integer getPageValue() {
    return mPageSubject.getValue();
  }

  public void setPage(Integer value) {
    // Log.d("setPage", value.toString());
    if (mPageSubject.getValue() != value) {
      new Handler(Looper.getMainLooper()).post(new RunnableWithArg(value) {
        @Override
        public void run() {
          mPageSubject.onNext((Integer)arg);
        }
      });
    }
  }

  public Observable<Boolean> getCanGoForward() {
    return mCanGoForwardSubject.hide();
  }

  public Boolean getCanGoForwardValue() {
    return mCanGoForwardSubject.getValue();
  }

  public void setCanGoForward(Boolean value) {
    // Log.d("setCanGoForward", value.toString());
    if (mCanGoForwardSubject.getValue() != value) {
      new Handler(Looper.getMainLooper()).post(new RunnableWithArg(value) {
        @Override
        public void run() {
          mCanGoForwardSubject.onNext((Boolean)arg);
        }
      });
    }
  }

  public Observable<Boolean> getRefreshing() {
    return mRefreshingSubject.hide();
  }

  public Boolean getRefreshingValue() {
    return mRefreshingSubject.getValue();
  }

  public void setRefreshing(Boolean value) {
    // Log.d("setRefreshing", value.toString());
    if (mRefreshingSubject.getValue() != value) {
      new Handler(Looper.getMainLooper()).post(new RunnableWithArg(value) {
        @Override
        public void run() {
          mRefreshingSubject.onNext((Boolean)arg);
        }
      });
    }
  }

  public Observable<Boolean> getBlockExit() {
    return mBlockExitSubject.hide();
  }

  public Boolean getBlockExitValue() {
    return mBlockExitSubject.getValue();
  }

  public void setBlockExit(Boolean value) {
    // Log.d("setBlockExit", value.toString());
    if (mBlockExitSubject.getValue() != value) {
      new Handler(Looper.getMainLooper()).post(new RunnableWithArg(value) {
        @Override
        public void run() {
          mBlockExitSubject.onNext((Boolean)arg);
        }
      });
    }
  }

  public Observable<Boolean> getShowFindInPage() {
    return mShowFindInPageSubject.hide();
  }

  public Boolean getShowFindInPageValue() {
    return mShowFindInPageSubject.getValue();
  }

  public void setShowFindInPage(Boolean value) {
    // Log.d("setShowFindInPage", value.toString());
    if (mShowFindInPageSubject.getValue() != value) {
      new Handler(Looper.getMainLooper()).post(new RunnableWithArg(value) {
        @Override
        public void run() {
          mShowFindInPageSubject.onNext((Boolean)arg);
        }
      });
    }
  }

  public Observable<Map<String, ?>> getPreferences() {
    return mPreferencesSubject.hide();
  }

  public Map<String, ?> getPreferencesValue() {
    return mPreferencesSubject.getValue();
  }

  public void setPreferences(Map<String, ?> value) {
    // Log.d("setPreferences", value.toString());
    if (mPreferencesSubject.getValue() != value) {
      new Handler(Looper.getMainLooper()).post(new RunnableWithArg(value) {
        @Override
        public void run() {
          mPreferencesSubject.onNext((Map<String, ?>) arg);
        }
      });
    }
  }

  public Observable onResume() {
    return mResumeSubject.hide();
  }

  public void triggerResume(Integer count) {
    this.mResumeSubject.onNext(count);
  }

  public Observable onPause() {
    return mPauseSubject.hide();
  }

  public void triggerPause(Integer count) {
    this.mPauseSubject.onNext(count);
  }
}

