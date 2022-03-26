import "./swwipe.css"
import "./polyfill-ie"
import {Mode} from "./types"
import SWWipe from "./swwipe"


window.addEventListener("load", () => {
    document.querySelectorAll<HTMLElement>(".banner").forEach(b => {
        const mode: Mode = b.hasAttribute("data-multi-swipe") ? Mode.MULTI_SECTION : Mode.AUTO
        const noLoop: boolean = b.hasAttribute("data-no-loop")
        const owner = b.closest("section")
        if (!owner) throw Error("banner element not part of a section")
        // noinspection UnnecessaryLocalVariableJS
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
})




