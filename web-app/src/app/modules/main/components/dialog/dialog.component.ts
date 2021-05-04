import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StatusMessage } from 'src/app/models/status-message';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StatusMessage
  ) { }

  ngOnInit(): void {
  }

  onCloseClick(doNotShowAgain?: boolean) {
    this.dialogRef.close(doNotShowAgain);
  }

}
