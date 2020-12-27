import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { EventManager } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class HotKeysService {

  constructor(
    private eventManager: EventManager,
    @Inject(DOCUMENT) private document: Document) {
  }

  add(keys: string, callback: () => boolean) {
    const event = `keydown.${keys}`;

    const handler = (e) => {
      e.preventDefault();
      return callback();
    };

    const dispose = this.eventManager.addEventListener(this.document as any, event, handler);

    return () => {
      dispose();
    };
  }

}
