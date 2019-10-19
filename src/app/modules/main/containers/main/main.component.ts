import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Observable, of, Subscription } from 'rxjs';
import { TextTvService } from 'src/app/services/text-tv.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Direction } from '../../components/swipe-container/swipe-container.component';
import { environment } from '../../../../../environments/environment';

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

  @ViewChild('wrapper', { static: true }) wrapperRef: ElementRef;

  style: any;
  swipeDisabled = false;
  swipeAnimationDisabled = true;
  showLoadingOverlay = false;

  constructor(
    private textTvService: TextTvService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.updateZoom();
    this.route.paramMap.subscribe(params => {
      let param = params.get('page');
      if (params.get('page') === null || typeof params.get('page') === 'undefined' || params.get('page') === '') {
        param = '100';
      }
      const page = parseInt(param, 10);
      this.loadPage(page);
    });
    this.swipeDisabled = this.isDesktop() && environment.production;
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

  loadPage(page: number) {
    this.showLoadingOverlay = true;

    if (this._textTvPageSubscription) {
      this._textTvPageSubscription.unsubscribe();
    }

    this._textTvPageSubscription = this.textTvService.getPage(page).subscribe(
      res => {
        this.textTvPage = res;
        this.showLoadingOverlay = false;
      }, err => {
        this.textTvPage = err;
        this.showLoadingOverlay = false;
      }
    );

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
    if (newPage === this.textTvPage.pageNumber) {
      this.refresh();
    } else {
      this.router.navigateByUrl('/' + newPage);
    }
  }

  refresh() {
    this.loadPage(this.textTvPage.pageNumber);
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
  
  updateZoom() {
    const width = this.wrapperRef.nativeElement.getBoundingClientRect().width;
    const zoom = Math.min(width / 372, 1.5);
    const scale = Math.min(zoom, 1);
    this.style = { 'zoom': zoom, 'transform': 'initial', 'transform-origin': 'initial', '-ms-zoom': zoom, '-webkit-zoom': zoom, '-moz-transform': `scale(${scale},${scale})`, '-moz-transform-origin': 'left top' }; 
  }
}
