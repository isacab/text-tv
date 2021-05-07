import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject, ReplaySubject } from 'rxjs';
import { environment } from 'src/environments/environment';

declare var window: any;

@Injectable({
  providedIn: 'root'
})
export class AndroidInterfaceService {

  private pageSubject = new ReplaySubject<number>(1);
  private refreshingSubject = new BehaviorSubject<boolean>(false);
  private preferencesSubject = new ReplaySubject<any>(1);
  private resumeSubject = new Subject<void>();
  private pauseSubject = new Subject<void>();

  constructor() {
    if (window.Android) {
      window.Android.receiveMessage = (message: string, details: any) => {
        // console.log('window.Android.receiveMessage', message, details);
        switch(message) {
          case 'page_changed':
            this.pageSubject.next(details);
            break;
          case 'refreshing_changed': 
            this.refreshingSubject.next(details);
            break;
          case 'preferences_changed':
          case 'preferences_get':
            this.preferencesSubject.next(details);
          case 'resumed':
            this.resumeSubject.next();
          case 'paused':
            this.pauseSubject.next();
        }
      };
      window.Android.onMessage("window.Android.receiveMessage");
      window.Android.getPreferences();
    }
  }

  get page(): Observable<number> {
    return this.pageSubject.asObservable();
  }
  setPage(value: number): void {
    if (window.Android) {
      console.log('setPage', value);
      window.Android.setPage(value);
    }
  }

  get refreshing(): Observable<boolean> {
    return this.refreshingSubject.asObservable();
  }
  setRefreshing(value: boolean): void {
    if(window.Android && this.refreshingSubject.getValue() != value) {
      console.log('setRefreshing', value);
      window.Android.setRefreshing(value);
    }
  }

  get preferences(): Observable<any> {
    return this.preferencesSubject.asObservable();
  }

  openSettings(): void {
    if (window.Android) {
      // console.log('openSettings');
      window.Android.openSettings();
    }
  }

  get onResume(): Observable<void> {
    return this.resumeSubject.asObservable();
  }

  get onPause(): Observable<void> {
    return this.pauseSubject.asObservable();
  }
}
