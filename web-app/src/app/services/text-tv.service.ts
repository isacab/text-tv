import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, of, concat, Subscriber, merge, EMPTY } from 'rxjs';
import { map, catchError, switchMap, shareReplay, tap, startWith, filter, mergeMap, delay } from 'rxjs/operators';
import { SvtResponse } from '../models/svt-response';
import { SubPage, TextTvPage } from '../models/text-tv-page';
import { CellData, GridData } from '../models/grid-data';
import { characterMap } from './character-map';

@Injectable({
  providedIn: 'root'
})
export class TextTvService {

  private pageBaseUrl = 'https://www.svt.se/text-tv/api/';
  private canvasEl: HTMLCanvasElement;
  private canvasContext: CanvasRenderingContext2D;
  private imgWidth = 520;
  private imgHeight = 400; 
  private gridWidth = 40;
  private gridHeight = 25;
  private cacheMaxSeconds = 60;
  private cache = new Map<number, TextTvPage>();
  private requests = new Map<string, { time: number, request: Observable<SvtResponse> }>();

  constructor(
    private http: HttpClient
  ) {
    this.canvasEl = document.createElement("canvas");
    this.canvasEl.width = this.imgWidth;
    this.canvasEl.height = this.imgHeight;
    this.canvasContext = this.canvasEl.getContext('2d');
  }

  getPage(page: number, forceRefetch: boolean = false, prefetch: boolean = true): Observable<TextTvPage> {
    const url = this.pageBaseUrl + page;
    return this.fetch(url, forceRefetch).pipe(
      catchError(err => throwError(this.createErrorPage(err, page)))
      , switchMap((res: SvtResponse) => {
        let textTvPage = this.createTextTvPage(res, page);
        let subPagesObservable = this.createSubPages(res, page, textTvPage.subPages.length).pipe(
          tap((subPage) => { // next
            textTvPage.subPages = textTvPage.subPages.concat(subPage);
          })
          , catchError(err => throwError(this.createErrorPage(err, page, textTvPage.nextPageNumber, textTvPage.prevPageNumber)))
          , startWith(0)
          , map(_ => textTvPage)
        );
        const nextAndPrevPageObservable = prefetch ? merge(
          this.getPage(textTvPage.nextPageNumber, false, false).pipe(catchError(x => of(null)), filter(x => false)),
          this.getPage(textTvPage.prevPageNumber, false, false).pipe(catchError(x => of(null)), filter(x => false))
        ) : EMPTY;
        return concat(
          subPagesObservable, nextAndPrevPageObservable
        );
      })
    );
  }

  private fetch(url: string, forceRefetch: boolean): Observable<SvtResponse> {
    if(!forceRefetch) { // check if there is a current or cached reqeust
      const cached = this.requests.get(url);
      if(cached && Math.abs((Date.now() - cached.time) / 1000) < this.cacheMaxSeconds) {
        return cached.request;
      }
    }
    const request = this.http.get<SvtResponse>(url).pipe(shareReplay(1));
    this.requests.set(url, { time: Date.now(), request: request });
    return request;
  }

  private createTextTvPage(response: SvtResponse, page: number): TextTvPage {
    if(!response?.data) {
      throw this.createErrorPage('Kunde inte hämta sidan', page); 
    }

    const nextPageNumber = parseInt(response.data.nextPage);
    const prevPageNumber = parseInt(response.data.prevPage);
    
    if(response.status === 'fail' || !response.data.subPages?.length) {
      throw this.createErrorPage('Sidan ej i sändning', page, nextPageNumber, prevPageNumber);
    }

    try {
      let cached = this.cache.get(page);
      // check if cached and if cached version match altText from response 
      if(cached != null && cached.altTexts.every((x, i) => x === response.data.subPages[i]?.altText)) {
        return { ...cached };
      } else {
        // create new
        const textTvPage = {
          ok: true,
          updated: response.data.meta?.updated,
          pageNumber: page,
          nextPageNumber: nextPageNumber || Math.min(page+1, 899),
          prevPageNumber: prevPageNumber || Math.max(page-1, 100),
          subPages: [],
          totalNumberOfSubpages: response.data.subPages.length,
          altTexts: response.data.subPages.map(x => x.altText)
        } as TextTvPage;
        this.cache.set(page, textTvPage);
        return textTvPage;
      }
    } catch(err) {
      throw this.createErrorPage('Ett fel uppstod', page, nextPageNumber, prevPageNumber);
    }
  }

  private createSubPages(response: SvtResponse, page: number, createFromIndex: number): Observable<SubPage> {
    return new Observable((subscriber) => {
      if (createFromIndex < response.data.subPages.length) {
        this.recursivlyCreateSubPages(response, page, createFromIndex, subscriber);
      } else {
        subscriber.complete();
      }
    });
  } 

  private recursivlyCreateSubPages(response: SvtResponse, page: number, index: number, subscriber: Subscriber<SubPage>): void {
    const sp = response.data.subPages[index];
    // console.log(response.data.pageNumber, index);
    // console.time('createSubPage ' + sp.subPageNumber);
    this.createHtmlContent(sp.gifAsBase64, page).then(html => {
      if(!subscriber.closed) {
        const newSubPage = {
          subPageNumber: sp.subPageNumber,
          htmlContent: html,
          time: Date.now() 
        } as SubPage;
        // console.timeEnd('createSubPage ' + sp.subPageNumber);
        subscriber.next(newSubPage);
        if(index+1 < response.data.subPages.length) {
          setTimeout(() => {
            this.recursivlyCreateSubPages(response, page, index+1, subscriber);
          }, 0);
        } else {
          subscriber.complete();
        }
      } else {
        // console.log('closed');
      }
    }).catch(err => {
      subscriber.error('Ett fel uppstod');
      subscriber.complete();
    });
  }

  private createErrorPage(error: HttpErrorResponse | string, page: number, nextPage?: number, prevPage?: number): TextTvPage {
    return {
      ok: false,
      updated: null,
      pageNumber: page,
      nextPageNumber: nextPage || Math.min(page+1, 899),
      prevPageNumber: prevPage || Math.max(page-1, 100),
      subPages: [{
        subPageNumber: '',
        htmlContent: `<div class="error-message"><pre class="root">${this.getErrorMessage(error)}</pre></div>`,
        time: Date.now()
      } as SubPage],
      totalNumberOfSubpages: 1
    } as TextTvPage;
  }

  private getErrorMessage(error: HttpErrorResponse | string) {

    if (!error) {
      return '';
    }

    if (typeof error === 'string') {
      return error;
    }

    if ((error as HttpErrorResponse).status === 404) {
      return 'Ej tillgänglig';
    }

    if (navigator && navigator.onLine === false) {
      return 'Ingen anslutning';
    }

    return 'Kunde inte ladda sida';
  }

  private async createHtmlContent(gifAsBase64: string, page: number): Promise<string> {
    // Load base64 into image element
    const image = await this.loadImage('data:image/gif;base64,' + gifAsBase64);
    // Extract content from image
    const data = this.extractCharactersFromImage(image);
    // Construct html with text and background image
    let lines = [];
    let htmlLine = '';
    const gridData = data.gridData;
    const gridWidth = this.gridWidth;
    const gridHeight = this.gridHeight;
    let curColor = 'W';
    let dh = false;
    for (var row = 0; row < gridHeight; row++) {
      htmlLine += '<span>'
      for (let col = 0; col < gridWidth; col++) {
        let cell = gridData?.[row][col] || {} as CellData;
        if(!dh && cell.yScale == 2) {
          htmlLine += '<span class="DH"><span class="SC">';
          dh = true;
        }
        if(cell.color != null) {
          let color = this.getColorClassByRGB(cell.color.r, cell.color.g, cell.color.b);
          if(color !== curColor) {
            htmlLine += curColor !== 'W' ? '</span>' : '';
            htmlLine += color !== 'W' ? `<span class="${color}">` : '';
            curColor = color;
          }
        }
        htmlLine += cell.char || ' ';
      }
      if(curColor !== 'W') {
        htmlLine += curColor != 'W' ? '</span>' : '';
        curColor = 'W';
      }
      if(dh === true) {
        htmlLine += '</span></span>';
        dh = false;
      }
      htmlLine += '</span>';
      htmlLine = this.insertLinks(htmlLine, page, row);
      lines.push(htmlLine);
      htmlLine = '';
    }
    const fullHtml = `<div><pre class="root" style="background-image: url(${data.imgSrc});">${lines.join('\n')}</pre></div>`;
    return fullHtml;
  }

  private insertLinks(htmlLine, page, row): string {
    const mode = this.shouldInsertLinks(page, row);
    
    if(mode === InsertLinksMode.No) {
      return htmlLine;
    }

    let regex;
    if(mode === InsertLinksMode.Yes) {
      regex = /([^0-9])[1-8][0-9][0-9](?![0-9])/g;
      // regex = /(?<![0-9])[1-9][0-9][0-9](?![0-9])/g // lookbehind not supported in older browsers
    } else if (mode === InsertLinksMode.FirstPageSpecial) {
      regex = /([>* \-.\/\\])[1-8][0-9][0-9](?=((<\/span>|[f* \-.]|[\-\/\\][1-8][0-9][0-9])(<\/span>|[* \-.]|$)))/g;
    } else if (mode === InsertLinksMode.IfLast) {
      regex = /([^0-9])[1-8][0-9][0-9](?=f?([-\/\\][1-8][0-9][0-9]f?)?([ .\-*]*(<\/span>))+$)/g;
    }

    return htmlLine.replace(regex, (num) => { 
      let behind = num.substr(0, num.length - 3); // lookbehind not supported in older browsers
      num = num.substr(num.length - 3);
      return `${behind}<a href="${num}">${num}</a>`;
    });
  }

  private shouldInsertLinks(page: number, row: number): InsertLinksMode {
    if (row === 0 || page >= 711)
      return InsertLinksMode.No;
    else if ( ((row === 1 || row === this.gridHeight-2) && !(page >= 202 && page <= 246)) 
       || page === 330 || (page >= 190 && page <= 201) || (page >= 247 && page <= 299) || page === 400 || page === 420 || (page >= 550 && page <= 710))
      return InsertLinksMode.Yes;
    else if (page <= 105 || (page >= 300 && page <= 302) || page === 376) {
      if(row === this.gridHeight-3)
        return InsertLinksMode.Yes;
      else if(page === 100)
        return InsertLinksMode.FirstPageSpecial;
      else
        return InsertLinksMode.IfLast;
    }
    return InsertLinksMode.No;
  }

  private extractCharactersFromImage(img: HTMLImageElement): { gridData: GridData, imgSrc: string } { 
    // console.time('extractCharactersFromImage');
    const imgWidth = this.imgWidth;
    const imgHeight = this.imgHeight; 
    const gridWidth = this.gridWidth;
    const gridHeight = this.gridHeight;
    const cellWidth = imgWidth / gridWidth;
    const cellHeight = imgHeight / gridHeight;
    const canvas = this.canvasEl;
    const ctx = this.canvasContext;

    // Get pixel data from image 
    ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
    const imgData = ctx.getImageData(0, 0, imgWidth, imgHeight);

    // Get characters, color and yscale for all "cells" in image and erase characters in image data
    const gridData: GridData = [];
    let yScale;
    for (let row = 0; row < gridHeight; row++) {
      gridData.push([]);
      yScale = null;
      for (let col = 0; col < gridWidth; col++) {
        let cellData = this.extractCell(imgData, imgWidth, col*cellWidth, row*cellHeight, cellWidth, cellHeight, yScale || 1);
        if(yScale == null) {
          if (cellData.char) {
            yScale = 1;
          } else {
            let cellDataDH = this.extractCell(imgData, imgWidth, col*cellWidth, row*cellHeight, cellWidth, cellHeight, 2);
            if (cellDataDH.char) {
              yScale = 2;
              cellData = cellDataDH;
            }
          }
        }
        gridData[row].push(cellData);
      }
    }

    // Create base64 from modified imageData
    ctx.clearRect(0, 0, imgWidth, imgHeight);
    ctx.putImageData(imgData, 0, 0);
    const imgSrc = canvas.toDataURL("image/png"); 
    
    // console.timeEnd('extractCharactersFromImage');
    return {
      gridData: gridData,
      imgSrc: imgSrc
    };
  }
  
  private extractCell(imgData: ImageData, imgWidth: number, x: number, y: number, cellWidth: number, cellHeight: number, yScale: number): CellData {
    let data = imgData.data;
    let textColorR, textColorG, textColorB;
    let indexes = [];
    let keyParts = [];
    let b = 1;
    let pow = 4503599627370496; // 2^52;
  
    if (this.isEmptyCell(data, imgWidth, x, y, yScale)) {
      return { char: undefined, color: undefined, yScale: yScale } as CellData;
    }
  
    let baseIndex = (x + y * imgWidth) * 4; // first pixel
    let bgColorR = data[baseIndex];
    let bgColorG = data[baseIndex+1];
    let bgColorB = data[baseIndex+2];
  
    let i = 0;
    for (let relY = 0; relY < cellHeight; relY++) {
      const absY = y + relY * yScale;
      for (let relX = 0; relX < cellWidth; relX++) {
        i++;
        const absX = x + relX;
        baseIndex = (absX + absY * imgWidth) * 4;
        if(data[baseIndex] !== bgColorR || data[baseIndex+1] !== bgColorG || data[baseIndex+2] !== bgColorB) {
          b = b * 2 + 1;
          textColorR = data[baseIndex];
          textColorG = data[baseIndex+1];
          textColorB = data[baseIndex+2];
          indexes.push(baseIndex);
        } else {
          b = b * 2;
        }
        if(i === 52) {
          keyParts.push(b-pow);
          i = 0;
          b = 1;
        }
      }
    }
  
    const key = keyParts[0] + '.' + keyParts[1] + '.' + keyParts[2] + '.' + keyParts[3];
    const char = characterMap[key];
  
    if (char) {
      indexes.forEach((index) => {
        data[index] = bgColorR;
        data[index+1] = bgColorG;
        data[index+2] = bgColorB;
        if (yScale > 1) {
          data[index+imgWidth*4] = bgColorR;
          data[index+1+imgWidth*4] = bgColorG;
          data[index+2+imgWidth*4] = bgColorB;
        }
      });
    }
  
    return {
      char: char,
      color: char ? { r: textColorR, g: textColorG, b: textColorB } : undefined,
      yScale: yScale
    } as CellData;
  }
  
  private isEmptyCell(data: Uint8ClampedArray, imgWidth: number, x: number, y: number, yScale: number) {
    let bgIndex = (x + y * imgWidth) * 4;
    let p1Index = (x+3 + (y+11*yScale) * imgWidth) * 4;
    let p2Index = (x+6 + (y+11*yScale) * imgWidth) * 4;
    let p3Index = (x+4 + (y+2*yScale) * imgWidth) * 4;
    let p4Index = (x+6 + (y+9*yScale) * imgWidth) * 4;
    let p5Index = (x+6 + (y+13*yScale) * imgWidth) * 4;
  
    return !((data[bgIndex] !== data[p1Index] || data[bgIndex+1] !== data[p1Index+1] || data[bgIndex+2] !== data[p1Index+2])
      || (data[bgIndex] !== data[p2Index] || data[bgIndex+1] !== data[p2Index+1] || data[bgIndex+2] !== data[p2Index+2])
      || (data[bgIndex] !== data[p3Index] || data[bgIndex+1] !== data[p3Index+1] || data[bgIndex+2] !== data[p3Index+2])
      || (data[bgIndex] !== data[p4Index] || data[bgIndex+1] !== data[p4Index+1] || data[bgIndex+2] !== data[p4Index+2])
      || (data[bgIndex] !== data[p5Index] || data[bgIndex+1] !== data[p5Index+1] || data[bgIndex+2] !== data[p5Index+2]));
  }  

  private loadImage(imgSrc): Promise<HTMLImageElement> {
    return new Promise((resFunc, rejFunc) => {
      let img = new Image();
      img.onload = () => {
        resFunc(img);
      };
      img.src = imgSrc;
      return img;
    });
  }

  private getColorClassByRGB(r, g, b): string {
    if(r == 255 && g == 255 && b == 255) {
      return 'W';
    } else if (r == 255 && g == 0 && b == 0) {
      return 'R';
    } else if (r == 0 && g == 255 && b == 0) {
      return 'G';
    } else if (r == 0 && g == 0 && b == 255) {
      return 'B';
    } else if (r == 255 && g == 0 && b == 255) {
      return 'M';
    } else if (r == 0 && g == 255 && b == 255) {
      return 'C';
    } else if (r == 255 && g == 255 && b == 0) {
      return 'Y';
    } else if (r == 0 && g == 0 && b == 0) {
      return 'BK';
    }
  }

}

enum InsertLinksMode {
  No,
  Yes,
  FirstPageSpecial,
  IfLast
 };