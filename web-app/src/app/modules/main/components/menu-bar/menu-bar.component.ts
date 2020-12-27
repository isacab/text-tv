import { Component, OnInit, Output, EventEmitter, Input, HostListener, ElementRef, ViewChild } from '@angular/core';
import { HotKeysService } from 'src/app/services/hot-keys.service';
import { PageNumberInputComponent } from '../page-number-input/page-number-input.component';

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.scss']
})
export class MenuBarComponent implements OnInit {

  @Input() page: number;
  @Input() direction: 'horizontal' | 'vertical';

  @Output() pageChange = new EventEmitter<number>();
  @Output() prevClick = new EventEmitter();
  @Output() nextClick = new EventEmitter();
  @Output() settingsClick = new EventEmitter();
  @Output() refreshClick = new EventEmitter();

  @ViewChild(PageNumberInputComponent, { static: true }) pageNumberInputRef: PageNumberInputComponent;

  constructor(
    private hotKeysService: HotKeysService
  ) { }

  ngOnInit() {
    this.hotKeysService.add('ArrowLeft', () => { this.prev(); return true; } );
    this.hotKeysService.add('ArrowRight', () => { this.next(); return true; } ),
    this.hotKeysService.add('r', () => { this.refresh(); return true; } ),
    this.hotKeysService.add('p'/*, '1', '2', '3', '4', '5', '6', '7', '8', '9'*/, () => { this.pageNumberInputRef.focus(); return true; } );
  }

  next() {
    this.nextClick.emit();
  }

  prev() {
    this.prevClick.emit();
  }

  settings() {
    this.settingsClick.emit();
  }

  refresh() {
    this.refreshClick.emit();
  }

  pageInputChange(newPage: number) {
    this.pageChange.emit(newPage);
  }

}
