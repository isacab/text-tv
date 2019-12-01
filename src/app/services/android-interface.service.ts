import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

declare var window: any;

@Injectable({
  providedIn: 'root'
})
export class AndroidInterfaceService {

  private pageSubject = new Subject<number>();
  private refreshingSubject = new BehaviorSubject<boolean>(false);
  private refreshEnabledSubject = new BehaviorSubject<boolean>(false);

  constructor(zone: NgZone) {
    if(!window.Android && !environment.production && environment.client == 'android') { // use mock interface when debugging android app in browser
      window.Android = new MockAndroidInterface(zone);
    }
    if (window.Android) {
      window.Android.receiveMessage = (message: string, details: any) => {
        switch(message) {
          case 'page_changed':
            this.pageSubject.next(details);
            break;
          case 'refreshing_changed': 
            this.refreshingSubject.next(details);
            break;
          case 'refresh_enabled_changed':
            this.refreshEnabledSubject.next(details);
            break;
        }
      };
      window.Android.onMessage("window.Android.receiveMessage");
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

  get refreshEnabled(): Observable<boolean> {
    return this.refreshEnabledSubject.asObservable();
  }
  setRefreshEnabled(value: boolean): void {
    if(window.Android && this.refreshEnabledSubject.getValue() != value) {
      console.log('setRefreshEnabled', value);
      window.Android.setRefreshEnabled(value);
    }
  }
}

class MockAndroidInterface {

  private callback: string;

  constructor(private zone: NgZone) {}

  onMessage(callback: string) {
    if(typeof callback !== 'string')
      this.callback = undefined;
    this.callback = callback.replace(/^window\./i, '');
  }

  setRefreshEnabled(value: boolean) {
    this.runCallback('refresh_enabled_changed', value);
  }

  setRefreshing(value: boolean) {
    this.runCallback('refreshing_changed', value);
  }

  setPage(value: number) {
      this.runCallback('page_changed', value);
  }

  private runCallback(message: string, value: any) {
    if(this.callback) {
      setTimeout(() => {
        let fun = window;
        this.callback.split('.').forEach(x => fun = fun[x]);
        fun(message, value);
      }, 0);
    }
  }

}
