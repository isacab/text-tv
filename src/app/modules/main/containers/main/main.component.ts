import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild, ApplicationRef } from '@angular/core';
import { Observable, of, Subscription, timer, merge } from 'rxjs';
import { TextTvService } from 'src/app/services/text-tv.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Direction } from '../../components/swipe-container/swipe-container.component';
import { environment } from '../../../../../environments/environment';
import { AndroidInterfaceService } from 'src/app/services/android-interface.service';
import { TextTvPage } from 'src/app/models/text-tv-page';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { delay, take } from 'rxjs/operators';

declare var window: any;
declare var DocumentTouch: any;

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

  private _textTvPage: TextTvPage;
  private _textTvPageSubscription: Subscription;
  private _lastFetchedPageNumber: number;

  @ViewChild('scrollWrapper', { static: true }) scrollWrapperRef: ElementRef;
  @ViewChild('wrapper', { static: true }) wrapperRef: ElementRef;

  init: boolean = false;
  preferences: any;
  style: any = {};
  envClass: string = '';
  orientationClass: string = '';
  fontClass: string = '';
  showLoadingOverlay = false;
  swipeDisabled = false;
  swipeAnimationDisabled = true;
  pageNumber: number | string;
  renderTheme: string = 'double-height-titles';

  fontConfig = {
    'Inconsolata': { class: 'font_inconsolata', contentWidth: 320, contentHeight: 388, letterWidth: 8 },
    'Fira Mono': { class: 'font_fira_mono', contentWidth: 376, contentHeight: 432, letterWidth: 9 },
    'Roboto Mono': { class: 'font_roboto_mono', contentWidth: 376, contentHeight: 432, letterWidth: 9 },
    'Droid Sans Mono': { class: 'font_droid_sans_mono', contentWidth: 376, contentHeight: 432, letterWidth: 9 },
    'VT323': { class: 'font_vt323', contentWidth: 352, contentHeight: 452, letterWidth: 9 },
  };

  constructor(
    private textTvService: TextTvService,
    private androidInterface: AndroidInterfaceService,
    private route: ActivatedRoute,
    private router: Router,
    private appRef: ApplicationRef,
  ) { }

  ngOnInit(): void {
    this.envClass = ['web', 'android'].includes(environment.client) ? 'env-' + environment.client : 'env-web';
    this.updateOrientation();
    setTimeout(() => { this.updateZoom(); }, 0);
    
    this.route.paramMap.subscribe(params => {
      let param = params.get('page');
      if (params.get('page') === null || typeof params.get('page') === 'undefined' || params.get('page') === '') {
        param = '100';
      }
      const page = parseInt(param, 10);
      this.loadPage(page);
    });
    this.swipeDisabled = this.isDesktop() && environment.production;
    this.androidInterface.refreshing.subscribe(refreshing => {
      if(refreshing) {
        this.refresh(false);
      }
    });
    this.androidInterface.onResume.subscribe(() => {
      this.refresh(true);
    });
    this.androidInterface.preferences.subscribe(preferences => {
      this.applyPreferences(preferences);
      this.init = true;
    });
    timer(1000).subscribe(() => {
      this.init = true;
    });
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

  get currentFontConfig(): any {
    const font = this.preferences && this.preferences.font;
    return this.fontConfig[font] || this.fontConfig['Inconsolata'];
  }

  get totalMargin(): number {
    let zoomLevel = 2;
    if(this.preferences && this.preferences.zoomLevel != null) {
      zoomLevel = parseInt(this.preferences.zoomLevel);
    }
    return this.currentFontConfig.letterWidth * 2 * zoomLevel;
  }

  loadPage(page: number, showLoadingOverlay: boolean = true) {

    // check is currently fetching page
    if (this._textTvPageSubscription && !this._textTvPageSubscription.closed) {
      if (this._lastFetchedPageNumber === page) {
        return; // is already fetching page
      } else {
        this._textTvPageSubscription.unsubscribe(); // if new page then cancel current fetch
      }
    }

    this._lastFetchedPageNumber = page;
    this.pageNumber = page;

    this._textTvPageSubscription = this.textTvService.getPage(page).subscribe(res => {
        this.textTvPage = res;
        this.showLoadingOverlay = false;
        this.androidInterface.setRefreshing(false);
      }, err => {
        this.textTvPage = err;
        this.showLoadingOverlay = false;
        this.androidInterface.setRefreshing(false);
      }
    );

    setTimeout(() => {
      if(this._textTvPageSubscription && !this._textTvPageSubscription.closed) {
        this.showLoadingOverlay = showLoadingOverlay;
      }
    }, 333);

    setTimeout(() => {
      (document.activeElement as HTMLElement).blur();
    }, 100);
  }

  onLinkClick(href: string) {
    if (/*is same origin*/ true) {
      const url = href.substr(href.lastIndexOf('/') + 1);
      this.pageChange(url);
    }
  }

  pageChange(newPage: number | string) {
    this.pageNumber = newPage;
    if(newPage >= 100 && newPage <= 999) {
      if (newPage === this.textTvPage.pageNumber || newPage.toString() === this.route.snapshot.paramMap.get('page')) {
        this.loadPage(newPage as number);
      } else {
        this.router.navigateByUrl('/' + newPage);
      }
    }
  }

  refresh(showLoadingOverlay: boolean = true) {
    this.loadPage(this.textTvPage.pageNumber, showLoadingOverlay);
  }

  next() {
    this.pageChange(this.textTvPage.nextPageNumber);
  }

  prev() {
    this.pageChange(this.textTvPage.prevPageNumber);
  }

  openSettings() {
    this.androidInterface.openSettings();
  }

  swipe(direction: Direction) {
    if(direction & Direction.LEFT) {
      this.next();
    } else if(direction & Direction.RIGHT) {
      this.prev();
    }
  }

  applyPreferences(preferences: any): void {
    console.log('applyPreferences', preferences);
    if(preferences) {
      this.preferences = preferences;
      this.renderTheme = this.getRendererTheme(preferences);
      this.fontClass = this.currentFontConfig.class;
      this.swipeDisabled = !preferences.swipePageNavigation;
      setTimeout(() => { this.updateZoom(); this.appRef.tick(); }, 0);
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
    if((window.innerWidth / window.innerHeight) > 1.75 && window.innerHeight <= 600) {
      this.orientationClass = 'landscape';
    } else {
      this.orientationClass = 'portrait';
    }
  }
  
  updateZoom() {
    const wrapperRect = this.wrapperRef.nativeElement.getBoundingClientRect();
    const textTvContentRect = { width: this.currentFontConfig.contentWidth + this.totalMargin, height: this.currentFontConfig.contentHeight }; //{ width: 352, height: 388 };
    const zoom = Math.min(wrapperRect.width / textTvContentRect.width, 1.5);
    const scale = Math.min(zoom, 1);
    this.style = { 'zoom': zoom, 'transform': 'initial', 'transform-origin': 'initial', '-ms-zoom': zoom, '-webkit-zoom': zoom, '-moz-transform': `scale(${scale},${scale})`, '-moz-transform-origin': 'left top' }; 
  }

  getRendererTheme(preferences) {
    switch(preferences.headerSize) {
      case 'x1': return 'normal-size-titles';
      case 'bigger_text': return 'default';
      default: return 'double-height-titles';
    }
  }
}
