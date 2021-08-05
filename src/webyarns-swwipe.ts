import "./swwipe.css"
/*

See https://github.com/DaveSeidman/StarWarsWipe

	To Do
	------------------------------------------
	Fix diagonal wipe
	fix radial wipe


Webyarns version:
- Added "destroy" flag and method
- Added support for `data-startAt` to set start percentage
- on destroy remove created elements
*/

enum Mode {
    AUTO, MULTI_SECTION
}

interface ImageObject {
    startPercentage: number;
    fadeWidth: number;
    fadeType: string | null;
    fadeDelay: number;
    fadeDuration: number;
    aspect: number;
    img: HTMLImageElement;
    proportional: boolean;
    widthScale: number;
    heightScale: number;
    dimensions: { "width": number, "height": number }
}

class SWWipe {

    currentIdx = -1;
    width: number = window.innerWidth;				// width of container (banner)
    height: number = window.innerHeight;				// height of container
    aspect: number = this.width / this.height;				// aspect ratio of container

    private readonly imageArray: ImageObject[];
    private readonly _backCanvas: HTMLCanvasElement = document.createElement('canvas');
    private readonly _foreCanvas: HTMLCanvasElement = document.createElement('canvas');
    private readonly _backContext: CanvasRenderingContext2D;
    private readonly _foregroundContext: CanvasRenderingContext2D;

    private percent: number = 0;
    private startTime: Date = new Date;
    private nextFadeTimer: NodeJS.Timeout | null = null;


    private get curImg(): ImageObject {
        return this.imageArray[this.currentIdx];
    }

    private get nxtImg(): ImageObject {
        return this.imageArray[(this.currentIdx + 1) % this.imageArray.length];
    }

    constructor(readonly banner: HTMLElement, readonly owner: HTMLElement, readonly mode: Mode = Mode.AUTO, readonly loop = true) {
        const images = Array.from(this.banner.querySelectorAll("img"));
        this.imageArray = images.map(img => {
            const aspect = img.width / img.height;
            const fadeDuration = img.hasAttribute("data-fadeDuration") ? Number(img.getAttribute("data-fadeDuration")) * 1000 : 1000;
            const fadeDelay = img.hasAttribute("data-fadeDelay") ? Number(img.getAttribute("data-fadeDelay")) * 1000 : 1000;
            const fadeType = img.hasAttribute("data-fadeType") ? img.getAttribute("data-fadeType") : "cross-lr";
            const fadeWidth = img.hasAttribute("data-fadeWidth") ? Number(img.getAttribute("data-fadeWidth")) : .1;
            const startPercentage = img.hasAttribute("data-startAt") ? Number(img.getAttribute("data-startAt")) : 0;
            const proportional = img.hasAttribute("data-proportional");
            const heightScale = img.hasAttribute("data-proportional-height") ? Number(img.getAttribute("data-proportional-height")) : 1;
            const widthScale = img.hasAttribute("data-proportional-width") ? Number(img.getAttribute("data-proportional-width")) : 1;

            const dimensions = {
                width: img.width,
                height: img.height,
            }
            return {
                img,
                aspect,
                fadeDuration,
                fadeDelay,
                fadeType,
                fadeWidth,
                startPercentage,
                proportional,
                widthScale,
                heightScale,
                dimensions
            }
        })

        this.banner.appendChild(this._backCanvas);
        this.banner.appendChild(this._foreCanvas);
        const backContext = this._backCanvas.getContext("2d")
        const foreContext = this._foreCanvas.getContext("2d");
        if (backContext === null || foreContext === null) throw Error("2d context not supported")
        this._backContext = backContext;
        this._foregroundContext = foreContext;

        window.addEventListener('resize', this.resize);
    }

    private nextFade = () => {
        // advance indices
        this.currentIdx = ++this.currentIdx % this.imageArray.length;
        this.drawImage();

        // clear the foreground
        this._foregroundContext.clearRect(0, 0, this.width, this.height);

        // setup and start the fade
        this.percent = -this.curImg.fadeWidth;
        this.startTime = new Date;
        this.redraw();
    }

    private redraw = () => {
        // calculate percent completion of wipe
        const currentTime = new Date;
        const elapsed = currentTime.getTime() - this.startTime.getTime();
        this.percent = this.curImg.startPercentage + elapsed / this.curImg.fadeDuration;


        this._foregroundContext.save();
        this._foregroundContext.clearRect(0, 0, this.width, this.height);
        const fadeWidth = this.curImg.fadeWidth

        switch (this.curImg.fadeType) {

            case "cross-lr": {
                const gradient = this._foregroundContext.createLinearGradient(
                    (this.percent * (1 + fadeWidth) - fadeWidth) * this.width, 0,
                    (this.percent * (1 + fadeWidth) + fadeWidth) * this.width, 0);
                gradient.addColorStop(0.0, 'rgba(0,0,0,1)');
                gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
                this._foregroundContext.fillStyle = gradient;
                this._foregroundContext.fillRect(0, 0, this.width, this.height);
                break;
            }

            case "cross-rl": {
                const gradient = this._foregroundContext.createLinearGradient(
                    ((1 - this.percent) * (1 + fadeWidth) + fadeWidth) * this.width, 0,
                    ((1 - this.percent) * (1 + fadeWidth) - fadeWidth) * this.width, 0);
                gradient.addColorStop(0.0, 'rgba(0,0,0,1)');
                gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
                this._foregroundContext.fillStyle = gradient;
                this._foregroundContext.fillRect(0, 0, this.width, this.height);
                break;
            }

            case "cross-ud": {
                const gradient = this._foregroundContext.createLinearGradient(
                    0, (this.percent * (1 + fadeWidth) - fadeWidth) * this.width,
                    0, (this.percent * (1 + fadeWidth) + fadeWidth) * this.width);
                gradient.addColorStop(0.0, 'rgba(0,0,0,1)');
                gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
                this._foregroundContext.fillStyle = gradient;
                this._foregroundContext.fillRect(0, 0, this.width, this.height);
                break;
            }

            case "cross-du": {
                const gradient = this._foregroundContext.createLinearGradient(
                    0, ((1 - this.percent) * (1 + fadeWidth) + fadeWidth) * this.width,
                    0, ((1 - this.percent) * (1 + fadeWidth) - fadeWidth) * this.width);
                gradient.addColorStop(0.0, 'rgba(0,0,0,1)');
                gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
                this._foregroundContext.fillStyle = gradient;
                this._foregroundContext.fillRect(0, 0, this.width, this.height);
                break;
            }

            case "diagonal-tl-br": {// DS: This diagonal not working properly

                const gradient = this._foregroundContext.createLinearGradient(
                    (this.percent * (2 + fadeWidth) - fadeWidth) * this.width, 0,
                    (this.percent * (2 + fadeWidth) + fadeWidth) * this.width, fadeWidth * (this.width / (this.height / 2)) * this.width);
                gradient.addColorStop(0.0, 'rgba(0,0,0,1)');
                gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
                this._foregroundContext.fillStyle = gradient;
                this._foregroundContext.fillRect(0, 0, this.width, this.height);

                break;
            }

            case "diagonal-tr-bl": {
                const gradient = this._foregroundContext.createLinearGradient(
                    (this.percent * (1 + fadeWidth) - fadeWidth) * this.width, 0,
                    (this.percent * (1 + fadeWidth) + fadeWidth) * this.width + this.width, this.height);
                gradient.addColorStop(0.0, 'rgba(0,0,0,1)');
                gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
                this._foregroundContext.fillStyle = gradient;
                this._foregroundContext.fillRect(0, 0, this.width, this.height);

                break;
            }

            case "radial-btm": {

                const segments = 300; // the amount of segments to split the semi circle into, DS: adjust this for performance
                const len = Math.PI / segments;
                const step = 1 / segments;

                // expand percent to cover fadeWidth
                const adjustedPercent = this.percent * (1 + fadeWidth) - fadeWidth;

                // iterate a percent
                for (let prct = -fadeWidth; prct < 1 + fadeWidth; prct += step) {

                    // convert percent to angle
                    const angle = prct * Math.PI;

                    // calculate coordinates for wedge
                    const x1 = Math.cos(angle + Math.PI) * (this.height * 2) + this.width / 2;
                    const y1 = Math.sin(angle + Math.PI) * (this.height * 2) + this.height;
                    const x2 = Math.cos(angle + len + Math.PI) * (this.height * 2) + this.width / 2;
                    const y2 = Math.sin(angle + len + Math.PI) * (this.height * 2) + this.height;

                    // calculate alpha for wedge
                    const alpha = (adjustedPercent - prct + fadeWidth) / fadeWidth;

                    // draw wedge
                    this._foregroundContext.beginPath();
                    this._foregroundContext.moveTo(this.width / 2 - 2, this.height);
                    this._foregroundContext.lineTo(x1, y1);
                    this._foregroundContext.lineTo(x2, y2);
                    this._foregroundContext.lineTo(this.width / 2 + 2, this.height);
                    this._foregroundContext.fillStyle = 'rgba(0,0,0,' + alpha + ')';
                    this._foregroundContext.fill();
                }

                break;
            }

            case "radial-top": {

                const segments = 300; // the amount of segments to split the semi circle into, DS: adjust this for performance
                const len = Math.PI / segments;
                const step = 1 / segments;

                // expand percent to cover fadeWidth
                const adjustedPercent = this.percent * (1 + fadeWidth) - fadeWidth;

                // iterate a percent
                for (let percent = -fadeWidth; percent < 1 + fadeWidth; percent += step) {

                    // convert percent to angle
                    const angle = percent * Math.PI;

                    // calculate coordinates for wedge
                    const x1 = Math.cos(angle + len + 2 * Math.PI) * (this.height * 2) + this.width / 2;
                    const y1 = Math.sin(angle + len + 2 * Math.PI) * (this.height * 2);
                    const x2 = Math.cos(angle + 2 * Math.PI) * (this.height * 2) + this.width / 2;
                    const y2 = Math.sin(angle + 2 * Math.PI) * (this.height * 2);


                    // calculate alpha for wedge
                    const alpha = (adjustedPercent - percent + fadeWidth) / fadeWidth;

                    // draw wedge
                    this._foregroundContext.beginPath();
                    this._foregroundContext.moveTo(this.width / 2 - 2, 0);
                    this._foregroundContext.lineTo(x1, y1);
                    this._foregroundContext.lineTo(x2, y2);
                    this._foregroundContext.lineTo(this.width / 2 + 2, 0);
                    this._foregroundContext.fillStyle = 'rgba(0,0,0,' + alpha + ')';
                    this._foregroundContext.fill();
                }

                break;
            }

            case "radial-out":
            case "radial-in": {
                const percent = this.curImg.fadeType === "radial-in" ? (1 - this.percent) : this.percent
                const width = 100;
                const endState = 0.01
                const innerRadius = (percent) * this.height - width < 0 ? endState : (percent) * this.height - width;
                const outerRadius = percent * this.height + width
                /*if (this.curImg.fadeType === "radial-in"){
                    console.table({"percent": percent,"innerRadius": innerRadius, "outerRadius": outerRadius })
                }*/

                const gradient = this._foregroundContext.createRadialGradient(
                    this.width / 2,
                    this.height / 2, innerRadius,
                    this.width / 2,
                    this.height / 2, outerRadius);
                if (this.curImg.fadeType === "radial-in") {
                    gradient.addColorStop(1.0, 'rgba(0,0,0,1)');
                    gradient.addColorStop(0.0, 'rgba(0,0,0,0)');
                } else {
                    gradient.addColorStop(0.0, 'rgba(0,0,0,1)');
                    gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
                }
                this._foregroundContext.fillStyle = gradient;
                this._foregroundContext.fillRect(0, 0, this.width, this.height);

                break;
            }

            default:
                break;

        }


        this._foregroundContext.globalCompositeOperation = this.nxtImg.proportional ? "source-atop" : "source-in";
        this._draw(this.nxtImg, this._foregroundContext, this._backContext)

        this._foregroundContext.restore();


        if (elapsed < this.curImg.fadeDuration)
            window.requestAnimationFrame(this.redraw);
        else if (this.mode === Mode.AUTO)
            if (this.loop || this.currentIdx < this.imageArray.length - 1)
                this.nextFadeTimer = setTimeout(this.nextFade, this.curImg.fadeDelay);
    }

    private _draw(i: ImageObject, ctx: CanvasRenderingContext2D, otherCtx: CanvasRenderingContext2D) {
        if (i.proportional) {
            ctx.save()
            const canvasWidthMiddle = ctx.canvas.width / 2;
            const canvasHeightMiddle = ctx.canvas.height / 2;
            const g = ctx.createRadialGradient(canvasWidthMiddle, canvasHeightMiddle, 0, canvasWidthMiddle, canvasHeightMiddle, Math.max(canvasWidthMiddle, canvasHeightMiddle))
            g.addColorStop(0, "#5cb8f8")
            g.addColorStop(1, "#464848")
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, this.width, this.height)
            const hr = .98;
            const wr = .333;
            const h = this.height * i.heightScale
            const w = this.width * i.widthScale
            const r = 1
            ctx.drawImage(
                i.img,
                this.width / 2 - w / 2,
                this.height / 2 - h / 2,
                w, h)
        } else if (this.aspect > i.aspect) {

            ctx.drawImage(i.img,
                0,
                (this.height - this.width / i.aspect) / 2,
                this.width,
                this.width / i.aspect);
        } else {

            ctx.drawImage(i.img,
                (this.width - this.height * i.aspect) / 2,
                0,
                this.height * i.aspect,
                this.height);
        }

    }

    private resize() {

        this.width = window.innerWidth;
        this.height = document.documentElement.clientHeight; // DS: fix for iOS 9 bug
        this.aspect = this.width / this.height;

        this._backContext.canvas.width = this.width;
        this._backContext.canvas.height = this.height;

        this._foregroundContext.canvas.width = this.width;
        this._foregroundContext.canvas.height = this.height;

        this.drawImage();
    };

    private drawImage() {
        if (this.curImg) {
            this._draw(this.curImg, this._backContext, this._foregroundContext)
        } else {
            throw Error("no image " + this.currentIdx + " " + this.imageArray.length)
        }
    }


    start() {
        this.currentIdx = -1
        this.nextFade();
        this.resize();
    }

    stop() {
        this.nextFadeTimer && clearTimeout(this.nextFadeTimer)
    }

    next() {
        if (this.mode !== Mode.MULTI_SECTION)
            throw Error("This swwipe operates in AUTO mode")
        this.nextFade()
    }


    get numberOfFades() {
        return this.imageArray.length
    }
}

class SWWipeStatic {
    private readonly img: HTMLImageElement;
    private heightScale: number;
    private widthScale: number;

    width: number = window.innerWidth;				// width of container (banner)
    height: number = window.innerHeight;				// height of container


    private readonly _canvas: HTMLCanvasElement = document.createElement('canvas');
    private readonly _context: CanvasRenderingContext2D;

    constructor(readonly banner: HTMLElement, readonly owner: HTMLElement) {
        const images = Array.from(this.banner.querySelectorAll("img"));
        if (images.length !== 1) {
            throw Error("Was expecting a single img for static-banner")
        }
        this.img = images[0]
        this.heightScale = images[0].hasAttribute("data-proportional-height") ? Number(this.img.getAttribute("data-proportional-height")) : 1;
        this.widthScale = images[0].hasAttribute("data-proportional-width") ? Number(this.img.getAttribute("data-proportional-width")) : 1;

        this.banner.appendChild(this._canvas);
        const context = this._canvas.getContext("2d")
        if (context === null) throw Error("2d context not supported")
        this._context = context;
        this._context.globalCompositeOperation = "source-over";
        this.img.addEventListener("load",()=> this.draw())
        this.draw();
        // window.addEventListener('resize', this.resize);
    }

    start() {
        this.resize();
    }
    draw() {


        const canvasWidthMiddle = this._context.canvas.width / 2;
        const canvasHeightMiddle = this._context.canvas.height / 2;
        const g = this._context.createRadialGradient(canvasWidthMiddle, canvasHeightMiddle, 0, canvasWidthMiddle, canvasHeightMiddle, Math.max(canvasWidthMiddle, canvasHeightMiddle))
        g.addColorStop(0, "#5cb8f8")
        g.addColorStop(1, "#464848")
        this._context.save();
        this._context.fillStyle = g;
        this._context.fillRect(0, 0, this._context.canvas.width, this._context.canvas.height)
        const h = this.height * this.heightScale
        const w = this.width * this.widthScale
        this._context.restore();
        this._context.drawImage(
            this.img,
            this.width / 2 - w / 2,
            this.height / 2 - h / 2,
            w, h)


    }

    private resize() {

        this.width = window.innerWidth;
        this.height = document.documentElement.clientHeight; // DS: fix for iOS 9 bug

        this._context.canvas.width = this.width;
        this._context.canvas.height = this.height;


        this.draw();
    };



}

(function () {

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll<HTMLElement>(".banner").forEach(b => {
            const mode: Mode = b.hasAttribute("data-multi-swipe") ? Mode.MULTI_SECTION : Mode.AUTO
            const noLoop: boolean = b.hasAttribute("data-no-loop")
            const owner = b.closest("section")
            if (!owner) throw Error("banner element not part of a section")
            const wipe = new SWWipe(b, owner, mode, !noLoop);
            // @ts-ignore
            b.sswipe = wipe;
        })

        Reveal.addEventListener("slidechanged", (e) => {
            const prevBanner = e.previousSlide?.querySelector(".banner");
            if (prevBanner) {
                const wipe = prevBanner.sswipe as SWWipe;
                if (wipe.mode === Mode.AUTO)
                    wipe.stop();
                else {
                    const ownerIndex: { h: number; v: number; } = Reveal.getIndices(wipe.owner)
                    const currentIndex: { h: number; v: number; } = Reveal.getIndices(e.currentSlide)
                    const distance = e.currentSlide.indexV ?
                        currentIndex.v - (ownerIndex.v || 0) :
                        currentIndex.h - ownerIndex.h
                    console.log(distance);
                    if (distance > 0 && distance < wipe.numberOfFades) {
                        e.currentSlide.appendChild(wipe.banner)
                    } else {
                        wipe.stop()
                        wipe.owner.appendChild(wipe.banner)
                    }


                }
            }
            const nextBanner = e.currentSlide.querySelector(".banner");
            if (nextBanner) {
                let sswipe = nextBanner.sswipe as SWWipe;
                if (sswipe.mode === Mode.AUTO || sswipe.owner === e.currentSlide)
                    sswipe.start();
                else
                    sswipe.next();

            }
        })

        document.querySelectorAll<HTMLElement>(".static-banner").forEach(b => {
            const owner = b.closest("section")
            if (!owner) throw Error("banner element not part of a section")
            const staticWipe = new SWWipeStatic(b, owner)
            staticWipe.start()

        })
    })


})()

// `closest` Polyfill for IE

if (!Element.prototype.matches) {
    // @ts-ignore
    Element.prototype.matches = Element.prototype.msMatchesSelector ||
        Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    // @ts-ignore
    Element.prototype.closest = function (s) {
        let el = this;

        do {
            if (Element.prototype.matches.call(el, s)) return el;
            // @ts-ignore
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

