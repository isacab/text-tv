export interface TextTvPage {
    ok: boolean;
    updated: string;
    pageNumber: number;
    nextPageNumber: number;
    prevPageNumber: number;
    subPages: SubPage[];
    totalNumberOfSubpages: number;
    altTexts: string[];
}
export interface SubPage {
    subPageNumber: string;
    htmlContent: string;
    time: number;
}
