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
  private focusSubject = new Subject<void>();
  private pauseSubject = new Subject<void>();

  constructor() {
    if(!window.Android && !environment.production && environment.client == 'android') { // use mock interface when debugging android app in browser
      window.Android = new MockAndroidInterface();
    }
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
          case 'focused':
            this.focusSubject.next();
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
      // console.log('setRefreshing', value);
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

  get onFocus(): Observable<void> {
    return this.focusSubject.asObservable();
  }

  get onPause(): Observable<void> {
    return this.pauseSubject.asObservable();
  }
}

class MockAndroidInterface {

  private callback: string;
  private focusCounter = 0;
  private preferences = {
    // font: 'Fira Mono',
    // font: 'Droid Sans Mono',
     font: 'Inconsolata',
    // font: 'Roboto Mono',
    zoomLevel: 1,
  };

  constructor() {
    window.addEventListener('focus', (event) => {
      this.runCallback('focused', ++this.focusCounter);
    });
  }

  onMessage(callback: string) {
    if(typeof callback !== 'string')
      this.callback = undefined;
    this.callback = callback.replace(/^window\./i, '');
  }

  setPage(value: number) {
      this.runCallback('page_changed', value);
  }

  setRefreshing(value: boolean) {
    this.runCallback('refreshing_changed', value);
  }

  getPreferences() {
    this.runCallback('preferences_get', this.preferences);
  }

  openSettings() {
  }

  private runCallback(message: string, value: any) {
    if(this.callback) {
      setTimeout(() => {
        console.log(message, value);
        let fun = window;
        this.callback.split('.').forEach(x => fun = fun[x]);
        fun(message, value);
      }, 0);
    }
  }

}
