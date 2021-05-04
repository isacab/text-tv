import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { StatusMessage, StatusMessageType } from '../models/status-message';
import { DialogComponent } from '../modules/main/components/dialog/dialog.component';

@Injectable({
  providedIn: 'root'
})
export class StatusMessageService {

  constructor(
    private http: HttpClient,
    private dialog: MatDialog
  ) { }

  check(): void {
    this.http.get<StatusMessage>(environment.statusMesageUrl).subscribe(msg => {
      if(this.shouldShowMessage(msg)) {
        const dialogRef = this.dialog.open(DialogComponent, { 
          data: msg,
          disableClose: true
        });
        dialogRef.afterClosed().subscribe((doNotShowAgain: boolean) => {
          if(doNotShowAgain) {
            this.saveStatusId(msg.id);
          }
        });
      }
    });
  }

  private shouldShowMessage(msg: StatusMessage): boolean {
    if(!msg?.active || !msg.id || !(msg.title || msg.body))
      return false;

    if(msg.type === StatusMessageType.DialogOnStartup) {
      return true;
    }

    const ids = this.getSavedMessageIds();
    return !ids.find(x => x === msg.id);
  }

  private saveStatusId(id: string): void {
    const ids = this.getSavedMessageIds();
    if(!ids.find(x => x === id)) {
      ids.push(id);
    }
    localStorage.setItem('statusMsg', JSON.stringify(ids));
  }

  private getSavedMessageIds(): any[] {
    let arr: any = [];
    const savedString = localStorage.getItem('statusMsg');
    try {
        if(savedString) {
          arr = JSON.parse(savedString);
        }
        if(!Array.isArray(arr)) {
          arr = [];
        }
    } catch(err) {}
    return arr;
  }
}
