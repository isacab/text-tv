import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { of, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Direction } from '../../components/swipe-container/swipe-container.component';
import { environment } from '../../../../../environments/environment';
import { AndroidInterfaceService } from 'src/app/services/android-interface.service';
import { TextTvPage } from 'src/app/models/text-tv-page';
import { TextTvService } from 'src/app/services/text-tv.service';
import { StatusMessageService } from 'src/app/services/status-message.service';
import { catchError, filter } from 'rxjs/operators';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MoreMenuBottomSheetComponent } from '../../components/more-menu-bottom-sheet/more-menu-bottom-sheet.component';

declare var window: any;
declare var DocumentTouch: any;

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy, AfterViewInit {

  private _textTvPage: TextTvPage;
  private _textTvPageSubscription: Subscription;
  private _lastFetchedPageNumber: number;

  @ViewChild('scrollWrapper', { static: true }) scrollWrapperRef: ElementRef;
  @ViewChild('wrapper', { static: true }) wrapperRef: ElementRef;

  init: boolean = false;
  preferences: any;
  style: any = { zoom: 1.2};
  envClass: string = '';
  orientationClass: string = '';
  viewModeClass: string = '';
  showLoadingOverlay = false;
  swipeDisabled = false;
  swipeAnimationDisabled = true;
  pageNumber: number | string;
  renderTheme: string = 'double-height-titles';
  renderDimensions: {};

  fontConfig = {
    //'Consolas': { class: null, contentWidth: 340, contentHeight: 392, letterWidth: 9 }, 
    'Inconsolata': { class: 'font_inconsolata', contentWidth: 340, contentHeight: 425, letterWidth: 8 },
    'Fira Mono': { class: 'font_fira_mono', contentWidth: 384, contentHeight: 428, letterWidth: 8 },
    'Roboto Mono': { class: 'font_roboto_mono', contentWidth: 384, contentHeight: 431, letterWidth: 9 },
    'Droid Sans Mono': { class: 'font_droid_sans_mono', contentWidth: 384, contentHeight: 428, letterWidth: 9 }
  };

  currentFontConfig = this.fontConfig['Inconsolata'];

  constructor(
    private textTvService: TextTvService,
    private androidInterface: AndroidInterfaceService,
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private statusMessage: StatusMessageService,
    private bottomSheet: MatBottomSheet
  ) { }

  ngOnInit(): void {
    this.envClass = environment.client || 'web';
    this.updateOrientation();
    this.route.paramMap.subscribe(params => {
      let param = params.get('page');
      if (param == null || param == '') {
        param = '100';
      }
      const page = parseInt(param, 10);
      this.loadPage(page, true);
    });
    this.swipeDisabled = this.isDesktop() && environment.production;
    this.androidInterface.refreshing.subscribe(refreshing => {
      if (refreshing) {
        this.ngZone.run(() => {
          this.refresh(false);
        });
      }
    });
    this.androidInterface.onResume.subscribe(() => {
      if (this.textTvPage && this.init) {
        this.ngZone.run(() => {
          this.refresh(true, false, false);
        });
      }
    });
    // this.androidInterface.preferences.subscribe(preferences => {
    //   this.applyPreferences(preferences);
    //   this.init = true;
    // });
    this.statusMessage.check();
  }

  ngAfterViewInit() {
    setTimeout(() => { 
      this.updateZoom(); 
    }, 0);
    setTimeout(() => {
      this.updateZoom(); 
    }, 200);
  }

  ngOnDestroy(): void {
    this._textTvPageSubscription.unsubscribe();
  }

  get textTvPage(): TextTvPage {
    return this._textTvPage;
  }

  set textTvPage(value) {
    const oldPage = this._textTvPage;
    this._textTvPage = value;
    if (oldPage && value && oldPage.pageNumber !== value.pageNumber) {
      window.scrollTo(0, 0);
    }
  }

  get menuDirection(): string {
    return this.orientationClass === 'portrait' ? 'horizontal' : 'vertical';
  }

  // get currentFontConfig(): any {
  //   let font = this.preferences?.font;
  //   if(this.fontConfig[font])
  //     return this.fontConfig[font];
  //   // else if(this.envClass === 'env-web' && this.isDesktop())
  //   //   return this.fontConfig['Consolas'];
  //   else
  //     return this.fontConfig['Inconsolata'];
  // }

  get totalMargin(): number {
    let zoomLevel = 1.5;
    if(this.preferences && this.preferences.zoomLevel != null) {
      zoomLevel = parseInt(this.preferences.zoomLevel);
    }
    return this.currentFontConfig.letterWidth * 2 * zoomLevel;
  }

  loadPage(page: number, showLoadingOverlay: boolean = true, forceRefetch: boolean = false, prefetch: boolean = true): void {

    // check is currently fetching page
    if (this._textTvPageSubscription && !this._textTvPageSubscription.closed) {
      if (this._lastFetchedPageNumber === page && this.textTvPage.pageNumber !== page) {
        return; // is already fetching this page 
      } else {
        this._textTvPageSubscription.unsubscribe(); // cancel current subscription
      }
    } 

    this._lastFetchedPageNumber = page;
    this.pageNumber = page;
    let ready = false;

    this._textTvPageSubscription = this.textTvService.getPage(page, forceRefetch, prefetch)
      .pipe(
        filter((res: TextTvPage) => res.subPages.length >= Math.min(2, res.totalNumberOfSubpages)),
        catchError((err: TextTvPage) => of(err))
      )
      .subscribe(res => {
        ready = true;
        this.showLoadingOverlay = false;
        this.androidInterface.setRefreshing(false);
        this.textTvPage = res;
        if(!this.init) {
          setTimeout(() => {
            this.init = true; 
          }, 200);
        }
      });

    setTimeout(() => {
      if(!ready) {
        this.showLoadingOverlay = showLoadingOverlay;
      }
    }, 0); //333);

    setTimeout(() => {
      (document.activeElement as HTMLElement).blur();
    }, 100);
  }

  onLinkClick(href: string) {
    const url = href.substr(href.lastIndexOf('/') + 1);
    this.pageChange(url);
  }

  pageChange(newPage: number | string) {
    if(newPage >= 100 && newPage <= 999 && newPage.toString() !== this.route.snapshot.paramMap.get('page')) {
      this.router.navigateByUrl('/' + newPage);
    }
  }

  refresh(showLoadingOverlay: boolean = true, force: boolean = true, prefetch: boolean = true) {
    const page = this.textTvPage?.pageNumber || parseInt(this.pageNumber.toString()) || 100;
    this.loadPage(page, showLoadingOverlay, force, prefetch);
  }

  next() {
    if(this.pageNumber === this.textTvPage.prevPageNumber && this.textTvPage.pageNumber !== this.textTvPage.prevPageNumber) { 
      // backed from prev page before page loaded
      this.pageChange(this.textTvPage.pageNumber);
    } else {
      this.pageChange(this.textTvPage.nextPageNumber);
    }
  }

  prev() {
    if(this.pageNumber === this.textTvPage.nextPageNumber && this.textTvPage.pageNumber !== this.textTvPage.nextPageNumber) { 
      // backed from next page before page loaded
      this.pageChange(this.textTvPage.pageNumber);
    } else {
      this.pageChange(this.textTvPage.prevPageNumber);
    }
  }

  openSettings() {
    this.androidInterface.openSettings();
  }

  moreMenu() {
    this.bottomSheet.open(MoreMenuBottomSheetComponent);
  }

  home() {
    this.pageChange(100);
  }

  // applyPreferences(preferences: any): void {
  //   //console.log('applyPreferences', preferences);
  //   if(preferences) {
  //     this.preferences = preferences;
  //     this.swipeDisabled = !preferences.swipePageNavigation;
  //     setTimeout(() => { this.updateZoom(); this.appRef.tick(); }, 0);
  //   }
  // }

  swipe(direction: Direction) {
    if(direction & Direction.LEFT) {
      this.next();
    } else if(direction & Direction.RIGHT) {
      this.prev();
    }
  }

  isDesktop() : boolean{
    let isDesktop = true;
    if(window.matchMedia) {
      const res = window.matchMedia("(hover: hover) and (pointer: fine)");
      isDesktop = res.matches;
    }
    return isDesktop;
  }

  windowSizeChanged() {
    this.updateOrientation();
    setTimeout(() => { this.updateZoom(); }, 0);
  }

  updateOrientation() {
    if((window.innerWidth / window.innerHeight) > 1.75 && window.innerHeight <= 600 && window.innerWidth <= 1100) {
      this.orientationClass = 'landscape';
    } else {
      this.orientationClass = 'portrait';
    }
  }
  
  updateZoom() {
    const wrapperRect = this.wrapperRef.nativeElement.getBoundingClientRect();
    const textTvContentRect = { width: this.currentFontConfig.contentWidth + this.totalMargin, height: this.currentFontConfig.contentHeight }; //{ width: 352, height: 388 };
    const zoom = Math.min(wrapperRect.width / textTvContentRect.width, 1.5);
    // const scale = Math.min(zoom, 1);
    if(zoom !== this.style.zoom) {
      this.style = { 'zoom': zoom, 'transform': 'initial', 'transform-origin': 'initial', '-ms-zoom': zoom, '-webkit-zoom': zoom, /*'-moz-transform': `scale(${scale},${scale})`, '-moz-transform-origin': 'left top'*/ }; 
    }
  }
}
