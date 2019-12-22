import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TextTvService {

  private pageBaseUrl = 'https://www.svt.se/svttext/tv/pages/';

  constructor(
    private http: HttpClient
  ) { }

  getPage(page: number): Observable<TextTvPage> {
    const url = this.pageBaseUrl + page + '.html';
    return this.http.get(url, { responseType: 'text' }).pipe(
      map(res => this.createTextTvPage(res, page))
      , catchError(err => this.throwCouldNotGetPage(err, page))
    );
  }

  getNextPageNumber(doc: Element, currentPage: number) {
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

  getPrevPageNumber(doc: Element, currentPage: number) {
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
        htmlEl.style.backgroundImage = htmlEl.style.backgroundImage.replace(`url("`, `url("` + this.pageBaseUrl);
      }
    }

    const imgs = Array.from(doc.getElementsByTagName('img'));
    for (const i of imgs) {
      if (typeof i.src === 'string') {
        i.src = this.pageBaseUrl + i.src;
      }
    }
  }

  private getContent(doc: Element, page: number): string {

    if (!doc) {
      return null;
    }

    this.insertScaleElements(doc);

    const contentElements = doc.querySelectorAll('pre.root,a.preclass');

    if (contentElements.length) {
      this.transformLinks(contentElements[0].parentElement);
    }

    if(page === 100 || page === 188) {
      this.fixFirstPageFooter(doc);
    }

    const html = [];

    html.push('<div>');
    contentElements.forEach(el => {
      html.push(el.outerHTML);
    });
    html.push('</div>');

    return html.join('');
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
    if(footerTextEl && footerTextEl.innerHTML.match(/^Inrikes[ ]*<a.*a>[ ]*Utrikes[ ]*<a.*a>[ ]*Innehåll[ ]*<a.*a>$/)) {
      // (footerTextEl.previousSibling as HTMLElement).style.zIndex = '1';
      footerTextEl.parentNode.insertBefore(footerTextEl, footerTextEl.previousSibling);
    }
  }

  private throwCouldNotGetPage(error: HttpErrorResponse, page: number): Observable<never> {
    return throwError({
      htmlContent: `<pre class="root"><div class="error-message">${this.getErrorMessage(error)}</div></pre>`,
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
      prevPageNumber: this.getPrevPageNumber(navForm, page)
    };
  }
}
