import { Component, OnInit, Input, ViewEncapsulation, EventEmitter, Output, ElementRef, ViewChild } from '@angular/core';
import { SubPage } from 'src/app/models/text-tv-page';

@Component({
  selector: 'app-renderer',
  templateUrl: './renderer.component.html',
  styleUrls: ['./renderer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RendererComponent implements OnInit {

  @Input() pages: SubPage[];

  @ViewChild('wrapper', { static: true }) wrapperRef: ElementRef;

  @Output() linkClick = new EventEmitter<string>();

  constructor() { }

  ngOnInit() {
  }

  onClick(event: MouseEvent) {
    const target = event.target as HTMLAnchorElement;
    if (target.tagName.toLowerCase() === 'a') {
      event.stopPropagation();
      target.classList.add('clicked');
      const navigateWithinSameTab = !event.ctrlKey && (!target.target || target.target.toLowerCase() === '_self');
      if (/*UrlUtils.isSameOrigin(target.href) && */ navigateWithinSameTab) {
        event.preventDefault();
        this.linkClick.emit(target.href);
      }
    }
  }

  trackByFn(index: number, item: SubPage) {
    return `${item.subPageNumber}_${item.time}`;
  }

}
