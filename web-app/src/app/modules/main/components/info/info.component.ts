import { Component, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {

  constructor(
    private _bottomSheetRef: MatBottomSheetRef<InfoComponent>
  ) { }

  ngOnInit(): void {
  }

  close(event: MouseEvent) {
    this._bottomSheetRef.dismiss();
    event.preventDefault();
  }

}
