import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Observable, of, Subscription, timer } from 'rxjs';
import { TextTvService } from 'src/app/services/text-tv.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Direction } from '../../components/swipe-container/swipe-container.component';
import { environment } from '../../../../../environments/environment';
import { AndroidInterfaceService } from 'src/app/services/android-interface.service';
import { TextTvPage } from 'src/app/models/text-tv-page';

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

  style: any;
  envClass: string;
  orientationClass: string;
  showLoadingOverlay = false;
  swipeDisabled = false;
  swipeAnimationDisabled = true;
  pageNumber: number | string;

  constructor(
    private textTvService: TextTvService,
    private androidInterface: AndroidInterfaceService,
    private route: ActivatedRoute,
    private router: Router
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
    if((window.innerWidth / window.innerHeight) > 1.75 && window.innerHeight <= 600) {
      this.orientationClass = 'landscape';
    } else {
      this.orientationClass = 'portrait';
    }
  }
  
  updateZoom() {
    const wrapperRect = this.wrapperRef.nativeElement.getBoundingClientRect();
    const textTvContentRect = { width: 320 + 16, height: 388 }; //{ width: 352, height: 388 };
    const zoom = Math.min(wrapperRect.width / textTvContentRect.width, 1.5);
    const scale = Math.min(zoom, 1);
    this.style = { 'zoom': zoom, 'transform': 'initial', 'transform-origin': 'initial', '-ms-zoom': zoom, '-webkit-zoom': zoom, '-moz-transform': `scale(${scale},${scale})`, '-moz-transform-origin': 'left top' }; 
  }
}
