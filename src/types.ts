export enum Mode {
    AUTO, MULTI_SECTION
}

export  interface ImageObject {
    startPercentage: number;
    fadeWidth: number;
    fadeType: string | null;
    fadeDelay: number;
    fadeDuration: number;
    aspect: number;
    img: HTMLImageElement;
    noResize: boolean;
}
