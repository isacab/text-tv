package com.vonlegohufvud.texttvsv;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import io.reactivex.Observable;
import io.reactivex.subjects.AsyncSubject;
import io.reactivex.subjects.BehaviorSubject;
import io.reactivex.subjects.Subject;

public class AppStateService {

  BehaviorSubject<Integer> mPageSubject = BehaviorSubject.create();
  BehaviorSubject<Boolean> mRefreshingSubject = BehaviorSubject.create();
  AsyncSubject<Integer> mResumeSubject = AsyncSubject.create();

  public AppStateService() {
  }

  public Observable<Integer> getPage() {
    return mPageSubject.hide();
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

  public Observable onResume() {
    return mResumeSubject.hide();
  }

  public void triggerResume(Integer count) {
    this.mResumeSubject.onNext(count);
  }
}

