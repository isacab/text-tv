package com.vonlegohufvud.texttvsv;

import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import java.util.Map;

import io.reactivex.Observable;
import io.reactivex.subjects.AsyncSubject;
import io.reactivex.subjects.BehaviorSubject;
import io.reactivex.subjects.ReplaySubject;
import io.reactivex.subjects.Subject;

public class AppStateService {

  private ReplaySubject<Integer> mPageSubject = ReplaySubject.createWithSize(1);
  private ReplaySubject<Boolean> mRefreshingSubject = ReplaySubject.createWithSize(1);
  private ReplaySubject<Map<String, ?>> mPreferencesSubject = ReplaySubject.createWithSize(1);
  private AsyncSubject<Integer> mResumeSubject = AsyncSubject.create();
  private AsyncSubject<Integer> mPauseSubject = AsyncSubject.create();

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

