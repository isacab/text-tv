import { Component, OnInit, Input, ViewEncapsulation, EventEmitter, Output, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-renderer',
  templateUrl: './renderer.component.html',
  styleUrls: ['./renderer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RendererComponent implements OnInit, OnChanges {

  @Input() htmlContent: string;
  @Input() theme: 'default' | 'double-height-titles' | 'normal-size-titles';

  @ViewChild('wrapper', { static: true }) wrapperRef: ElementRef;

  @Output() linkClick = new EventEmitter<string>();

  style: any;
  themeClass: string;

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes.theme) {
      switch(this.theme) {
        case 'double-height-titles': this.themeClass = 'double-height-titles';
          break;
          case 'normal-size-titles': this.themeClass = 'normal-size-titles';
          break;
        default: this.themeClass = '';
          break;
      }
    }
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
    } else {
      this.ClearSelection();
    }
  }

  ClearSelection() {
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    }
  }

}
