import { Component, OnInit, Input, EventEmitter, Output, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-page-number-input',
  templateUrl: './page-number-input.component.html',
  styleUrls: ['./page-number-input.component.scss']
})
export class PageNumberInputComponent implements OnInit {

  @Input() page: number;
  @Output() pageChange = new EventEmitter<number>();

  @ViewChild('Input') inputRef: ElementRef;

  constructor() { }

  ngOnInit() {
  }

  change(value: number): void {
    if (value.toString().length > 3) {
      value = parseInt(value.toString().substr(0, 3), 10);
      this.page = value;
    } else if (value >= 100 && value <= 999) {
      this.pageChange.emit(value);
    }
  }

  onClick(event: Event) {
    this.page = undefined;
  }

  focus() {
    this.inputRef.nativeElement.focus();
    this.page = undefined;
  }

}
