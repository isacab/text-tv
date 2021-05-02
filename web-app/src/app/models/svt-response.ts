export interface SvtResponse {
    data: {
        meta: { 
            updated: string;
        };
        nextPage: string;
        pageNumber: string;
        prevPage: string;
        subPages: SvtSubPage[];
    };
    status: string;
}

export interface SvtSubPage {
    altText: string;
    gifAsBase64: string;
    imageMap: string;
    subPageNumber: string;
}