import { Component, OnInit, EventEmitter, Output, ViewChild, Input } from '@angular/core';

export enum Direction {
  NONE = 1,
  LEFT = 2,
  RIGHT = 4,
  UP = 8,
  DOWN = 16,
  HORIZONTAL = 6,
  VERTICAL = 24,
  ALL = 30,
  R
};

@Component({
  selector: 'app-swipe-container',
  templateUrl: './swipe-container.component.html',
  styleUrls: ['./swipe-container.component.scss']
})
export class SwipeContainerComponent implements OnInit {
  private _deltaX = 0;
  isActive = false;
  position = '0px';

  private width: number;
  private swipeThreshold = 0.55; 

  get deltaX(): number {
    return this._deltaX;
  }
  set deltaX(value: number) {
    this._deltaX = value;
    if(!this.animationDisabled) {
      this.position = this.deltaX + 'px';
    } else if(this.position !== '0') {
      this.position = '0';
    }
  }

  @Output() pageChange = new EventEmitter<Direction>();

  @Input() disabled = true;

  @Input() animationDisabled = true;

  @ViewChild('swipableRef', { static: true }) swipableRef;

  constructor() { }

  ngOnInit() {
    this.calcWidth();
  }

  calcWidth() {
    this.width = this.swipableRef.nativeElement.getBoundingClientRect().width;
  }

  onPanStart(event: any): void {
    if(!this.disabled && event.direction & Direction.HORIZONTAL) {
      //event.preventDefault();
      this.isActive = true;
    }
  }

  onPanEnd(event: any): void {
    event.preventDefault();
    if (!this.width) {
      this.calcWidth();
    }
    const distance = Math.abs(event.deltaX);
    const threshold = this.width*this.swipeThreshold;
    if(this.isActive && distance > threshold) {
      const direction = event.deltaX > 0 ? Direction.RIGHT : Direction.LEFT;
      // console.log('panend');
      this.pageChange.emit(direction);
    }
    this.isActive = false;
    this.deltaX = 0;
  }

  onPan(event: any): void {
    if(this.isActive) {
      //event.preventDefault();
      this.deltaX = event.deltaX;
    }
  }

  onSwipe(event: any): void {
    this.isActive = false;
    if(event.direction & Direction.HORIZONTAL) {
      // console.log('swipe');
      event.preventDefault();
      this.pageChange.emit(event.direction);
    }
  }

}
