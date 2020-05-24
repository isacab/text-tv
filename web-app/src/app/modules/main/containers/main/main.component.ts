import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild, ApplicationRef, NgZone, ChangeDetectorRef, AfterViewInit, AfterContentChecked, Input, AfterViewChecked, DoCheck } from '@angular/core';
import { timer } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TextTvService } from 'src/app/services/text-tv.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Direction } from '../../components/swipe-container/swipe-container.component';
import { environment } from '../../../../../environments/environment';
import { AndroidInterfaceService } from 'src/app/services/android-interface.service';
import { default as Swiper } from 'swiper';
import { MenuItem } from '../../components/menu-bar/menu-item';
import { Slide } from 'src/app/models/slide';

declare var window: any;
declare var DocumentTouch: any;

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy, DoCheck {

  @ViewChild('textTvWrapper', { static: true }) textTvWrapperRef: ElementRef;
  @ViewChild('swiperContainer', { static: true }) swiperContainerRef: ElementRef;

  init: boolean = false;
  preferences: any;
  orientationClass: string = '';
  fontClass: string = '';
  viewModeClass: string = '';
  backgroundRepeatClass: string = '';
  showLoadingOverlay = false;
  swipeDisabled = false;
  swipeAnimationDisabled = true;
  pageNumber: number;
  renderTheme: string = 'double-height-titles';

  swiper: any;
  virtualData: any = { slides: [] };
  slides: Slide[] = [ ...Array(1000).fill(0).map(() => { return {}; }) ];
  initialSlide: number = Math.floor(this.slides.length / 2);

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
    private appRef: ApplicationRef
  ) { }

  get activeSlideIndex(): number {
    return this.swiper ? this.swiper.activeIndex : this.initialSlide;
  }

  get activeSlide(): Slide {
    return this.slides[this.activeSlideIndex]; 
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

  ngOnInit(): void {
    this.updateOrientation();
    
    this.route.paramMap.subscribe(params => {
      let param = params.get('page');
      if (params.get('page') == null || params.get('page') === '') {
        param = '100';
      }
      const page = parseInt(param, 10);
      this.pageNumber = page;
      const slideIndex = this.getNewTargetSlideIndex(page);
      this.clearSlides(slideIndex);
      this.loadPage(page, slideIndex, {
        preloadNextPages: 2,
        preloadPrevPages: 2,
        slideTo: true
      });
    });

    this.route.queryParamMap.subscribe(queryParams => {
      if(parseInt(queryParams.get('preview_mode'))) {
        this.viewModeClass = 'preview-mode';
      }
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
  }

  ngDoCheck(): void {
    this.initSwiper();
  }

  initSwiper() {
    if(!this.swiper && this.swiperContainerRef.nativeElement.clientWidth) {
      this.swiper = new Swiper(this.swiperContainerRef.nativeElement, {
        initialSlide: this.initialSlide,
        //simulateTouch: false, 
        centeredSlides: true,
        virtual: {
          slides: this.slides,
          renderExternal: data => {
            this.virtualData = data;
          },
          cache: false,
        }
      });
      // this.swiper.on('slideChange', () => {
      this.swiper.on('transitionEnd', () => {
        const slide = this.activeSlide;
        this.pageChange(slide.pageNumber);
        this.updateAllowSlide();
      });
    }
  } 

  loadPage(page: number, slideIndex: number, extras?: {
    preloadPrevPages?: number,
    preloadNextPages?: number,
    showLoadingOverlay?: boolean,
    refresh?: boolean,
    slideTo?: boolean
  }): void {
    extras = extras || {};
    const slide = this.slides[slideIndex];
    slide.pageNumber = page;

    this.textTvService.getPage(page).pipe(
      filter(res => res.pageNumber === slide.pageNumber)
    ).subscribe(res => {
      // set slide data
      slide.data = res;
      // slide to slideIndex if flag is set and slide is not already active
      if(extras.slideTo && slideIndex !== this.activeSlideIndex) {
        this.swiper.slideTo(slideIndex, 0);
      }
      // update allow slide next and prev if slideIndex is activeSlideIndex
      if(this.activeSlideIndex !== slideIndex) {
        this.updateAllowSlide();
      }
      // preload next pages
      if(extras.preloadNextPages > 0) { // && !this.slideIsLoaded(res.nextPageNumber, this.slides[slideIndex+1])) {
        this.loadPage(res.nextPageNumber, slideIndex+1, { preloadPrevPages: 0, preloadNextPages: extras.preloadNextPages-1 });
      }
      // preload prev pages
      if(extras.preloadPrevPages > 0) { // && !this.slideIsLoaded(res.prevPageNumber, this.slides[slideIndex-1])) {
        this.loadPage(res.prevPageNumber, slideIndex-1, { preloadPrevPages: extras.preloadPrevPages-1, preloadNextPages: 0 });
      }
    }, err => {
      // handle error
    });

    setTimeout(() => {
      (document.activeElement as HTMLElement).blur();
    }, 100);
  }

  updateAllowSlide(): void {
    const slide = this.slides[this.swiper.activeIndex];
    const prevSlide = this.slides[this.swiper.activeIndex-1];
    const nextSlide = this.slides[this.swiper.activeIndex+1];
    if(slide.data) {
      this.swiper.allowSlidePrev = !!(slide.data.prevPageNumber != null && slide.data.prevPageNumber !== slide.data.pageNumber);
      this.swiper.allowSlideNext = !!(slide.data.nextPageNumber != null && slide.data.nextPageNumber !== slide.data.pageNumber);
    } else {
      this.swiper.allowSlidePrev = !!(prevSlide && prevSlide.data && prevSlide.data.pageNumber != null);
      this.swiper.allowSlideNext = !!(nextSlide && nextSlide.data && nextSlide.data.pageNumber != null);
    }
  }

  slideIsLoaded(page: number, slide: Slide): boolean {
    return slide && slide.pageNumber === page && slide.data && slide.data.pageNumber === page && slide.data.ok;
  }

  clearSlides(slideIndex: number): void {
    if(slideIndex !== this.activeSlideIndex) {
      console.log('clear slides', slideIndex)
      for(let i = slideIndex-2, l = slideIndex+2; i < l; i++) {
        if(i !== this.activeSlideIndex) {
          delete this.slides[i].data;
          delete this.slides[i].pageNumber;
        }
      }
    }
  }
 
  onLinkClick(href: string) {
    if (/*is same origin*/ true) {
      const url = href.substr(href.lastIndexOf('/') + 1);
      this.pageChange(url);
    }
  }

  pageChange(newPage: number | string) {
    if(newPage >= 100 && newPage <= 999 && newPage.toString() !== this.route.snapshot.paramMap.get('page')) {
      this.router.navigateByUrl('/' + newPage);
    }
  }

  menuItemClick(item: MenuItem): void {
    switch(item) {
      case MenuItem.Refresh: this.refresh();
        break;
      case MenuItem.Next: this.next();
        break;
      case MenuItem.Prev: this.prev();
        break;
    }
  }

  refresh(showLoadingOverlay: boolean = true) {
    this.loadPage(this.pageNumber, this.activeSlideIndex, { showLoadingOverlay: showLoadingOverlay, slideTo: true });
  }

  next() {
    this.swiper.slideNext(0);
    // this.pageChange(this.activeSlide.data.nextPageNumber);
  }

  prev() {
    this.swiper.slidePrev(0);
    // this.pageChange(this.activeSlide.data.prevPageNumber);
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
      this.backgroundRepeatClass = preferences.backgroundNoRepeat ? 'background-no-repeat' : 'background-repeat';
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

  private _zoomContainerStyle: any = {};
  get zoomContainerStyle(): any {
    if(!this._zoomContainerStyle.zoom) {
      this.updateZoom();
    }
    return this._zoomContainerStyle;
  }
  set zoomContainerStyle(value: any) {
    this._zoomContainerStyle = value;
  }
  
  updateZoom() {
    const wrapperRect = this.textTvWrapperRef.nativeElement.getBoundingClientRect();
    const textTvContentRect = { width: this.currentFontConfig.contentWidth + this.totalMargin, height: this.currentFontConfig.contentHeight }; //{ width: 352, height: 388 };
    const zoom = Math.min(wrapperRect.width / textTvContentRect.width, 1.5);
    const scale = zoom; //Math.min(zoom, 1); 
    this.zoomContainerStyle = { 'zoom': zoom, 'transform': 'initial', 'transform-origin': 'initial', '-ms-zoom': zoom, '-webkit-zoom': zoom, '-moz-transform': `scale(${scale},${scale})`, '-moz-transform-origin': `${scale > 1 ? 'center' : '8px' } top` }; 
  }

  getRendererTheme(preferences) {
    switch(preferences.headerSize) {
      case 'x1': return 'normal-size-titles';
      case 'bigger_text': return 'default';
      default: return 'double-height-titles';
    }
  }

  getNewTargetSlideIndex(page: number): number {
    if(this.activeSlide.pageNumber === page) {
      return this.activeSlideIndex;
    }
    if(this.virtualData && this.virtualData.slides) {
      this.virtualData.slides.forEach((slide, index) => {
        if(slide.pageNumber === page) {
          return this.virtualData.from + index;
        }
      });
    }
    return page;
  }

  

  // onPageLoaded(page: TextTvPage): void {
  //   const targetSlideIndex = this._targetSlideIndex;
  //   const slide = this.findSlideForPage(page);

  //   if(page.pageNumber === this.pageNumber) {
  //     slide = this.slides[targetSlideIndex];
  //   } else if(this.virtualData.slides) {
  //     if(page.pageNumber > this.slides[targetSlideIndex].textTvPage.pageNumber) {
  //       const index = this.virtualData.slides.findIndex(slide => slide && slide.textTvPage && slide.textTvPage.nextPageNumber === page.pageNumber);
  //       if(index !== -1 && index+1 < this.virtualData.slides.length) {
  //         slide = this.virtualData.slides[index+1];
  //       }
  //     } else {
  //       const index = this.virtualData.slides.findIndex(slide => slide && slide.textTvPage && slide.textTvPage.prevPageNumber === page.pageNumber);
  //       if(index-1 >= 0) {
  //         slide = this.virtualData.slides[index-1];
  //       }
  //     }
  //   }

  //   slide.textTvPage = page;
  // }

  // addPageToSlide(page: TextTvPage, activeSlideIndex: number, activePageNumber: number): void {
  //   let slideIndex = this.activeSlideIndex;
  //   let slide;

  //   if(page.pageNumber === activePageNumber) {
  //     slide = this.slides[slideIndex];
  //   } else if(page.pageNumber < activePageNumber) {
  //     while(this.slides[slideIndex].data && this.slides[slideIndex].data.prevPageNumber !== page.pageNumber) {
        
  //     }
  //   }

  //   if(slide) {
  //     slide.textTvPage = page;
  //   }
  // }

  // onPageLoadError(errorPage: TextTvPage): void {
  //   this.onPageLoaded(errorPage);
  // }
}
