import { Injectable } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialogRef } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { Observable } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { AndroidInterfaceService } from './android-interface.service';

type PopupRef = MatBottomSheetRef|MatMenuTrigger|MatDialogRef<any>;

@Injectable({
  providedIn: 'root'
})
export class ClosePopupsService {

  popups: PopupRef[] = []; 

  constructor(
    private android: AndroidInterfaceService
  ) { }

  add(ref: PopupRef): void {
    this.popups.push(ref);

    let closed: Observable<any>;
    if (ref instanceof MatBottomSheetRef) {
      closed = ref.afterDismissed();
    } else if (ref instanceof MatMenuTrigger) {
      closed = ref.menuClosed;
    } else if (ref instanceof MatDialogRef) {
      closed = ref.afterClosed();
    }
    closed.pipe(take(1)).subscribe(() => {
      this.remove(ref);
    });
    
    this.android.setBlockExit(true);
  }

  remove(popup: PopupRef): void {
    this.popups = this.popups.filter(x => x !== popup);
    if(this.popups.length === 0) {
      this.android.setBlockExit(false);
    }
  }

  closeAll(): number {
    let count = 0;
    this.popups.forEach(popup => {
      if (popup instanceof MatBottomSheetRef) {
        let ref = popup as MatBottomSheetRef;
        ref.dismiss();
      } else if (popup instanceof MatMenuTrigger) {
        let ref = popup as MatMenuTrigger;
        ref.closeMenu();
      } else if (popup instanceof MatDialogRef) {
        let ref = popup as MatDialogRef<any>;
        ref.close();
      }
      count++;
    });
    return count;
  }
}
