import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, fromEventPattern, of, Subject, from } from 'rxjs';
import { map, catchError, switchMap, tap, share, shareReplay, take, mergeMap, finalize, publishReplay, refCount } from 'rxjs/operators';
import { TextTvPage } from '../models/text-tv-page';

export interface TextTvServiceConfig {
  refresh?: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class TextTvService {

  private svtBaseUrl = 'https://www.svt.se/svttext/tv/pages/';
  private requests: { [key: string]: Observable<any> } = {};

  constructor(
    private http: HttpClient
  ) { }

  getPage(page: number, config?: TextTvServiceConfig): Observable<TextTvPage> {
    config = config || {};

    if(!this.requests[page] || config.refresh) {
      const url = this.svtBaseUrl + page + '.html';
      this.requests[page] = this.http.get(url, { responseType: 'text' }).pipe(
        map(res => this.createTextTvPage(res, page))
        , catchError(err => this.throwCouldNotGetPage(err, page))
        //, shareReplay(1)
        , publishReplay(1, 1000 * 60 * 2) // cache for 2 minutes
        , refCount()
      );
    }

    return this.requests[page].pipe(take(1));
  }

  private getNextPageNumber(doc: Element, currentPage: number) {
    let num: number;
    currentPage = currentPage || 100;
    if (doc) {
      const a = doc.querySelector('#navform > a.btnBg:last-of-type') as HTMLAnchorElement;
      if (a) {
        num = parseInt(a.href.substring(a.href.lastIndexOf('/') + 1).replace('.html', ''), 10);
      }
    }
    return num || Math.min(currentPage + 1, 999);
  }

  private getPrevPageNumber(doc: Element, currentPage: number) {
    let num: number;
    currentPage = currentPage || 100;
    if (doc) {
      const a = doc.querySelector('#navform > a.btnBg') as HTMLAnchorElement;
      if (a) {
        num = parseInt(a.href.substring(a.href.lastIndexOf('/') + 1).replace('.html', ''), 10);
      }
    }
    return num || Math.min(currentPage - 1, 100);
  }

  private transformLinks(doc: Element) {

    if (!doc) {
      return;
    }

    const links = Array.from(doc.getElementsByTagName('a'));
    for (const l of links) {
      if (typeof l.href === 'string') {
        l.href = l.href.replace('.html', '');
      }
    }

    const styledElements = Array.from(doc.querySelectorAll('[style]'));
    for (const e of styledElements) {
      const htmlEl = e as HTMLElement;
      if (htmlEl.style.backgroundImage) {
        htmlEl.style.backgroundImage = htmlEl.style.backgroundImage.replace(`url("`, `url("` + this.svtBaseUrl);
      }
    }

    const imgs = Array.from(doc.getElementsByTagName('img'));
    for (const i of imgs) {
      if (typeof i.src === 'string') {
        i.src = this.svtBaseUrl + i.src;
      }
    }
  }

  private getContent(doc: Element, page: number): string[] {

    if (!doc) {
      return null;
    }

    this.insertScaleElements(doc);

    const contentElements = doc.querySelectorAll('pre.root'); //,a.preclass');

    if (contentElements.length) {
      this.transformLinks(contentElements[0].parentElement);
    }

    if(page === 100 || page === 188) {
      this.fixFirstPageFooter(doc);
    }

    const html = [];

    contentElements.forEach(el => {
      html.push(el.outerHTML);
    });

    return html;
  }

  private insertScaleElements(doc: Element): void {
    const dhElements = doc.querySelectorAll('span.DH');
    dhElements.forEach((dhEl: HTMLSpanElement) => {
      if(dhEl.parentElement && dhEl.parentElement.classList && !dhEl.parentElement.classList.contains('DH')) {
        let style = '';
        if(dhEl.style.backgroundImage) {
          style = ` style="background-image: ${dhEl.style.backgroundImage}"`;
        }
        dhEl.innerHTML = `<span class="SC"${style}>${dhEl.innerHTML}</span>`;
      }
    });
  }

  private fixFirstPageFooter(doc: Element): void {
    const footerTextEl = doc.querySelector('pre.root>span:last-child');
    if(footerTextEl && footerTextEl.innerHTML.match(/Inrikes[ ]*<a.*a>[ ]*Utrikes[ ]*<a.*a>[ ]*Innehåll[ ]*<a.*a>/)) {
      // (footerTextEl.previousSibling as HTMLElement).style.zIndex = '1';
      footerTextEl.parentNode.insertBefore(footerTextEl, footerTextEl.previousSibling);
    }
  }

  private throwCouldNotGetPage(error: HttpErrorResponse, page: number): Observable<never> {
    return throwError({
      htmlContent: [`<pre class="root"><div class="error-message">${this.getErrorMessage(error)}</div></pre>`],
      ok: false,
      pageNumber: page,
      nextPageNumber: page + 1,
      prevPageNumber: page - 1
    } as TextTvPage);
  }

  private getErrorMessage(error: HttpErrorResponse) {

    if (!error) {
      return '';
    }

    switch (error.status) {
      case 0:   return 'Ej ansluten till internet';
      case 404: return 'Sidan finns inte';
    }

    return '';
  }

  private createTextTvPage(htmlString: string, page: number): TextTvPage {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const navForm = doc.querySelector('#navform');

    return {
      htmlContent: this.getContent(doc.documentElement, page),
      ok: true,
      pageNumber: page,
      nextPageNumber: this.getNextPageNumber(navForm, page),
      prevPageNumber: this.getPrevPageNumber(navForm, page),
      date: new Date(),
      backgroundCanvas: this.createBackgroundCanvas(doc.querySelectorAll('pre.root')[0] as HTMLElement)
    };
  }

  private createBackgroundCanvas(preElement: HTMLElement) {
    const grid = this.getBackgroundGrid(preElement);

    let cellWidth = 10;
    let cellHeight = 17;

    const canvas = document.createElement('canvas');
    canvas.width = cellWidth * grid[0].length;
    canvas.height = cellHeight * grid.length;
    const ctx = canvas.getContext("2d");

    for(let y = 0, rowLength = grid.length; y < rowLength; y++) {
      for(let x = 0, colLength = grid[y].length; x < colLength; x++) {
        const color = this.bgClassToColor(grid[y][x].color);
        const imgSrc = grid[y][x].img ? grid[y][x].img.replace(/^url\(\"/, '').replace(/\"\)$/, '') : null;
        if(color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
        if(imgSrc) {
          const img = new Image();
          img.src = imgSrc;
          img.onload = () => {
            ctx.drawImage(img, x * cellWidth, y * cellHeight);
          }
        }
      }
    }

    return canvas;
  }

  private bgClassToColor(className: string): string {
    switch(className) {
      case 'bgY': return '#FF0';
      case 'bgB': return '#00F';
      case 'bgC': return '#0FF';
      case 'bgG': return '#0F0';
      case 'bgR': return '#F00';
      case 'bgM': return '#F0F';
      case 'bgW': return '#FFF';
      case 'bgBK': return '#000';
    }
    return '';
  }

  private getBackgroundGrid(preElement: HTMLElement): any[] {
    let cont = true;
    let node = preElement;
    let parent = node.parentNode;
    let x = 0;
    let y = 0;
    let grid = [[]];
    let iterNum = 0;
    let parentLevels: any[] = [{}];
    let curLvl: any;
    while(cont && iterNum < 20000) {
      iterNum++;

      if(!curLvl) {
        curLvl = { childIndex: 0 };

        // check background color
        if(node.classList) {
          for (let i=0, l=node.classList.length; i<l; ++i) {
            if(/^bg[A-Z]/.test(node.classList[i])) {
              curLvl.color = node.classList[i];
            } else if(node.classList[i] === 'DH') {
              curLvl.dh = true;
            }
          }
        }
  
        if(node.style && node.style.backgroundImage) {
          curLvl.img = node.style.backgroundImage;
        }
      }

      if(node.childNodes.length > curLvl.childIndex) {
        node = node.childNodes[curLvl.childIndex] as HTMLElement;
        curLvl.childIndex++;
        parentLevels.push(curLvl);
        curLvl = null;
      } else {
        if(!node.childNodes.length) {
          const text = node.textContent;
          for(let i=0, l=text.length; i<l; i++) {
            if(text[i] === '\n') {
              if(grid[y] && grid[y].find(item => item.dh)) {
                grid.push(grid[y]); // repeat row if dh
                y++;
              }
              grid.push([]);
              y++;
            } else {
              grid[y].push(Object.assign({}, ...parentLevels, curLvl));
              parentLevels.forEach(lev => { 
                if(lev.img) delete lev.img;
              });
              if(curLvl.img) delete curLvl.img;
              x++;
            }
          }
        } else if(node.parentNode === parent) {
            cont = false;
        }
        curLvl = parentLevels.pop();
        node = node.parentNode as HTMLElement;
      }
      //cont = false;
    }
    return grid;
  }
}
