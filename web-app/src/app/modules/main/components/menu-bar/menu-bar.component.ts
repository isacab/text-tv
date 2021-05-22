import { Component, OnInit, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { HotKeysService } from 'src/app/services/hot-keys.service';
import { PageNumberInputComponent } from '../page-number-input/page-number-input.component';
import { ClosePopupsService } from 'src/app/services/close-popups.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.scss']
})
export class MenuBarComponent implements OnInit {

  @Input() page: number;
  @Input() disabledItems: { [key:string]: boolean };
  @Input() bookmarked: boolean;
  @Input() direction: 'horizontal' | 'vertical';

  @Output() pageChange = new EventEmitter<number>();
  @Output() itemClick = new EventEmitter<string>();

  @ViewChild(PageNumberInputComponent, { static: true }) pageNumberInputRef: PageNumberInputComponent;
  @ViewChild(MatMenuTrigger) moreMenuTrigger: MatMenuTrigger;

  constructor(
    private hotKeysService: HotKeysService,
    private closePopupsService: ClosePopupsService,
    private location: Location,
    private router: Router
  ) { }

  ngOnInit() {
    this.hotKeysService.add('ArrowLeft', () => { this.onItemClick('prev'); return true; } );
    this.hotKeysService.add('ArrowRight', () => { this.onItemClick('next'); return true; } ),
    this.hotKeysService.add('r', () => { this.onItemClick('refresh'); return true; } ),
    this.hotKeysService.add('p'/*, '1', '2', '3', '4', '5', '6', '7', '8', '9'*/, () => { this.pageNumberInputRef.focus(); return true; } );
  }

  ngAfterViewInit() {
    this.moreMenuTrigger.menuOpened.subscribe(() => {
      this.closePopupsService.add(this.moreMenuTrigger);
    });
  }

  onPageChange(newPage: number) {
    this.pageChange.emit(newPage);
  }

  onItemClick(itemKey: string, e?: MouseEvent) {
    if(this.disabledItems?.[itemKey]) {
      e?.stopPropagation();
    } else {
      this.itemClick.emit(itemKey);
    }
  }

}
