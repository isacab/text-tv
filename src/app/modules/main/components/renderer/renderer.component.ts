import { Component, OnInit, Input, ViewEncapsulation, EventEmitter, Output, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-renderer',
  templateUrl: './renderer.component.html',
  styleUrls: ['./renderer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RendererComponent implements OnInit, OnChanges {

  @Input() htmlContent: string;

  @ViewChild('wrapper') wrapperRef: ElementRef;

  @Output() linkClick = new EventEmitter<string>();

  style: any;

  constructor() { }

  ngOnInit() {
    //this.updateZoom();
  }

  ngOnChanges(changes: SimpleChanges) {
    /*const htmlContent = changes['htmlContent'] && changes['htmlContent'].currentValue;
    if(htmlContent) {
      setTimeout(() => {
      }, 0);
    }*/
  }

  onClick(event: MouseEvent) {
    const target = event.target as HTMLAnchorElement;
    if (target.tagName.toLowerCase() === 'a') {
      event.stopPropagation();
      const navigateWithinSameTab = !event.ctrlKey && (!target.target || target.target.toLowerCase() === '_self');
      if (/*UrlUtils.isSameOrigin(target.href) && */ navigateWithinSameTab) {
        event.preventDefault();
        this.linkClick.emit(target.href);
      }
    }
  }
  
  updateZoom() {
    /*const width = this.wrapperRef.nativeElement.getBoundingClientRect().width;
    const zoom = Math.min(width / 394, 1.5);
    const scale = Math.min(zoom, 1);
    this.style = { 'zoom': zoom, 'transform': 'initial', 'transform-origin': 'initial', '-ms-zoom': zoom, '-webkit-zoom': scale, '-moz-transform': `scale(${scale},${scale})`, '-moz-transform-origin': 'left top' }; 
    */
  }

}
