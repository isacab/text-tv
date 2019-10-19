import { Component, OnInit, Output, EventEmitter, Input, HostListener, ElementRef, ViewChild } from '@angular/core';
import { PageNumberInputComponent } from '../page-number-input/page-number-input.component';
import { HotkeysService, Hotkey } from 'angular2-hotkeys';

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.scss']
})
export class MenuBarComponent implements OnInit {

  @Input() page: number;

  @Output() pageChange = new EventEmitter<number>();
  @Output() prevClick = new EventEmitter();
  @Output() nextClick = new EventEmitter();
  @Output() settingsClick = new EventEmitter();

  @ViewChild(PageNumberInputComponent, { static: true }) pageNumberInputRef: PageNumberInputComponent;

  constructor(
    private hotKeysService: HotkeysService
  ) { }

  ngOnInit() {
    this.hotKeysService.add([
      new Hotkey('left', () => { this.prev(); return true; } ),
      new Hotkey('right', () => { this.next(); return true; } ),
      new Hotkey('p', () => { this.pageNumberInputRef.focus(); return true; } ),
      new Hotkey('r', () => { this.refresh(); return true; } ),
    ]);
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
    this.pageChange.emit(this.page);
  }

  pageInputChange(e) {
    this.pageChange.emit(this.page);
  }

}
