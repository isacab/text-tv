import { Component, OnInit, Input, ViewEncapsulation, EventEmitter, Output, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-renderer',
  templateUrl: './renderer.component.html',
  styleUrls: ['./renderer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RendererComponent implements OnInit {

  @Input() htmlContent: string;

  @ViewChild('wrapper', { static: true }) wrapperRef: ElementRef;

  @Output() linkClick = new EventEmitter<string>();

  style: any;

  constructor() { }

  ngOnInit() {
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

}
