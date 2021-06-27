import "./swwipe.css"
/*

	To Do
	------------------------------------------
	Fix diagonal wipe
	fix radial wipe


Webyarns version:
- Added "destroy" flag and method
- Added support for `data-startAt` to set start percentage
- on destroy remove created elements
*/

interface ImageObject {
    startPercentage: number;
    fadeWidth: number;
    fadeType: string | null;
    fadeDelay: number;
    fadeDuration: number;
    aspect: number;
    img: HTMLImageElement;
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

    constructor(private readonly banner: HTMLElement) {
        const images = Array.from(this.banner.querySelectorAll("img"));
        this.imageArray = images.map(img => {
            const aspect = img.width / img.height;
            const fadeDuration = img.hasAttribute("data-fadeDuration") ? Number(img.getAttribute("data-fadeDuration")) * 1000 : 1000;
            const fadeDelay = img.hasAttribute("data-fadeDelay") ? Number(img.getAttribute("data-fadeDelay")) * 1000 : 1000;
            const fadeType = img.hasAttribute("data-fadeType") ? img.getAttribute("data-fadeType") : "cross-lr";
            const fadeWidth = img.hasAttribute("data-fadeWidth") ? Number(img.getAttribute("data-fadeWidth")) : .1;
            const startPercentage = img.hasAttribute("data-startAt") ? Number(img.getAttribute("data-startAt")) : 0;
            return {
                img,
                aspect,
                fadeDuration,
                fadeDelay,
                fadeType,
                fadeWidth,
                startPercentage
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

                const innerRadius = (this.percent) * this.height - 100 < 0 ? .01 : (this.percent) * this.height - 100;
                const outerRadius = this.percent * this.height + 100
                const gradient = this._foregroundContext.createRadialGradient(this.width / 2, this.height / 2, innerRadius, this.width / 2, this.height / 2, outerRadius);
                gradient.addColorStop(0.0, 'rgba(0,0,0,1)');
                gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
                this._foregroundContext.fillStyle = gradient;
                this._foregroundContext.fillRect(0, 0, this.width, this.height);

                break;
            }


            default:

                break;

        }

        this._foregroundContext.globalCompositeOperation = "source-in";

        if (this.aspect > this.nxtImg.aspect) {

            this._foregroundContext.drawImage(this.nxtImg.img,
                0,
                (this.height - this.width / this.nxtImg.aspect) / 2,
                this.width,
                this.width / this.nxtImg.aspect);
        } else {

            this._foregroundContext.drawImage(this.nxtImg.img,
                (this.width - this.height * this.nxtImg.aspect) / 2,
                0,
                this.height * this.nxtImg.aspect,
                this.height);
        }

        this._foregroundContext.restore();


        if (elapsed < this.curImg.fadeDuration)
            window.requestAnimationFrame(this.redraw);
        else
            this.nextFadeTimer = setTimeout(this.nextFade, this.curImg.fadeDelay);
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
            if (this.aspect > this.curImg.aspect) {

                this._backContext.drawImage(
                    this.curImg.img,
                    0,
                    (this.height - this.width / this.curImg.aspect) / 2,
                    this.width,
                    this.width / this.curImg.aspect);
            } else {

                this._backContext.drawImage(
                    this.curImg.img,
                    (this.width - this.height * this.curImg.aspect) / 2,
                    0,
                    this.height * this.curImg.aspect,
                    this.height);
            }
        } else {
            throw Error("no image " + this.currentIdx +" " + this.imageArray.length )
        }
    }


    start(){
        this.currentIdx = -1
        this.nextFade();
        this.resize();
    }

    stop(){
        this.nextFadeTimer && clearTimeout(this.nextFadeTimer)
    }

}

(function () {

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll<HTMLElement>(".banner").forEach(b=>{
            // @ts-ignore
            b.sswipe = new SWWipe(b);
        })

        Reveal.addEventListener("slidechanged", (e) => {
            const prevBanner = e.currentSlide.querySelector(".banner");
            if (prevBanner) {
                (prevBanner.sswipe as SWWipe).stop();
            }
            const nextBanner = e.currentSlide.querySelector(".banner");
            if (nextBanner) {
                (prevBanner.sswipe as SWWipe).start();
            }
        })
    })


})()


