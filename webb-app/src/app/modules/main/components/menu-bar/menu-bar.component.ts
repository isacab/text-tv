import { Component, OnInit, Output, EventEmitter, Input, HostListener, ElementRef, ViewChild } from '@angular/core';
import { PageNumberInputComponent } from '../page-number-input/page-number-input.component';
import { HotkeysService, Hotkey } from 'angular2-hotkeys';
import { MenuItem } from './menu-item';

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.scss']
})
export class MenuBarComponent implements OnInit {

  MenuItem = MenuItem;
 
  @Input() page: number;
  @Input() direction: 'horizontal' | 'vertical' = 'horizontal';

  @Output() pageChange = new EventEmitter<number>();
  @Output() itemClick = new EventEmitter<MenuItem>();

  @ViewChild(PageNumberInputComponent, { static: true }) pageNumberInputRef: PageNumberInputComponent;

  constructor(
    private hotKeysService: HotkeysService
  ) { }

  ngOnInit() {
    this.hotKeysService.add([
      new Hotkey('left', () => { this.itemClick.emit(MenuItem.Prev); return true; } ),
      new Hotkey('right', () => { this.itemClick.emit(MenuItem.Next); return true; } ),
      new Hotkey('r', () => { this.itemClick.emit(MenuItem.Refresh); return true; } ),
      new Hotkey(['p', '1', '2', '3', '4', '5', '6', '7', '8', '9'], () => { this.pageNumberInputRef.focus(); return true; } )
    ]);
  }

}
