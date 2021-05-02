import { Component, OnInit, Input, EventEmitter, Output, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-page-number-input',
  templateUrl: './page-number-input.component.html',
  styleUrls: ['./page-number-input.component.scss']
})
export class PageNumberInputComponent implements OnInit {

  private prevActiveElement: any;

  @Input() page: number;
  @Output() pageChange = new EventEmitter<number>();
  @Output() focusChange = new EventEmitter<boolean>();

  @ViewChild('Input', { static: true }) inputRef: ElementRef;

  constructor() { }

  ngOnInit() {
  }

  change(value: number): void {
    if (this.inputRef.nativeElement.value?.length > 3) {
      this.inputRef.nativeElement.value = this.inputRef.nativeElement.value.substr(0, 3).replace(/\./g, '');
      value = parseInt(this.inputRef.nativeElement.value.toString(), 10);
      this.page = value;
    } else {
      this.pageChange.emit(value);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    const key: any = event.key?.toLowerCase();
    if((isFinite(key) && this.inputRef.nativeElement.value?.length >= 3) || ['e', '.', ',', '+', '-'].includes(key)) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent) {
    let text = event.clipboardData?.getData("text")
    if(text) {
      event.preventDefault();
      text = text.replace(/\D/g,'').substr(0, 3-this.inputRef.nativeElement.value?.length);
      document.execCommand('insertText', false, text);
    }
  }

  onMouseDown(event: MouseEvent) {
    this.prevActiveElement = document.activeElement;
  }

  onClick(event: MouseEvent) {
    if(this.prevActiveElement !== this.inputRef.nativeElement) {
      this.resetPage();
    }
    event.stopPropagation();
  }

  focus() {
    if(document.activeElement !== this.inputRef.nativeElement) {
      this.inputRef.nativeElement.focus();
      this.resetPage();
    }
  }

  hasFocus() {
    return document.activeElement === this.inputRef.nativeElement;
  }

  resetPage() {
    this.page = undefined;
    this.pageChange.emit(this.page);
  }

  onFocusChange() {
    this.focusChange.emit(this.hasFocus());
  }

}
