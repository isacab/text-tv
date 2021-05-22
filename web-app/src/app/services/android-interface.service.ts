import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject, ReplaySubject } from 'rxjs';
import { environment } from 'src/environments/environment';

declare var window: any;

@Injectable({
  providedIn: 'root'
})
export class AndroidInterfaceService {

  // private pageSubject = new ReplaySubject<number>(1);
  private refreshingSubject = new BehaviorSubject<boolean>(false);
  private canGoForwardSubject = new BehaviorSubject<boolean>(false);
  private blockExitSubject = new BehaviorSubject<boolean>(false);
  private showFindInPageSubject = new BehaviorSubject<boolean>(false);
  private preferencesSubject = new ReplaySubject<any>(1);
  private resumeSubject = new Subject<void>();
  private pauseSubject = new Subject<void>();

  constructor() {
    if (window.Android) {
      window.Android.receiveMessage = (message: string, details: any) => {
        // console.log('window.Android.receiveMessage', message, details);
        switch(message) {
          // case 'page_changed':
          //   this.pageSubject.next(details);
          //   break;
          case 'refreshing_changed': 
            this.refreshingSubject.next(details);
            break;
          case 'can_go_forward_changed':
            this.canGoForwardSubject.next(details);
            break;
          case 'block_exit_changed':
            this.blockExitSubject.next(details);
            break;
          case 'show_find_in_page_changed':
            this.showFindInPageSubject.next(details);
            break;
          case 'preferences_changed':
          case 'preferences_get':
            this.preferencesSubject.next(details);
            break;
          case 'resumed':
            this.resumeSubject.next();
            break;
          case 'paused':
            this.pauseSubject.next();
            break;
        }
      };
      window.Android.onMessage("window.Android.receiveMessage");
      window.Android.getPreferences();
    }
  }

  // get page(): Observable<number> {
  //   return this.pageSubject.asObservable();
  // }
  // setPage(value: number): void {
  //   if (window.Android) {
  //     // console.log('setPage', value);
  //     window.Android.setPage(value);
  //   }
  // }

  setBlockExit(value: boolean): void {
    if(window.Android) {
      window.Android.setBlockExit(value);
    }
  }

  openInBrowser(url: string): void {
    if(window.Android) {
      window.Android.openInBrowser(url);
    }
  }

  setShowFindInPage(value: boolean): void {
    if(window.Android && this.showFindInPageSubject.getValue() != value) {
      window.Android.setShowFindInPage(value);
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

  get canGoForward(): Observable<boolean> {
    return this.canGoForwardSubject.asObservable();
  }

  get blockExit(): Observable<boolean> {
    return this.blockExitSubject.asObservable();
  }

  get showFindInPage(): Observable<boolean> {
    return this.showFindInPageSubject.asObservable();
  }

  get preferences(): Observable<any> {
    return this.preferencesSubject.asObservable();
  }

  get onResume(): Observable<void> {
    return this.resumeSubject.asObservable();
  }

  get onPause(): Observable<void> {
    return this.pauseSubject.asObservable();
  }
}
