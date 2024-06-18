// ==UserScript==
// @name         Fine Volume Scroll for Youtube Music
// @namespace    http://tampermonkey.net/
// @version      2024-06-18
// @description  try to take over the world!
// @author       bl4cktrum
// @match        *://*.youtube.com/watch?v=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    const VIDEO_SELECTOR = '.video-stream.html5-main-video';
    const SLIDERS_SELECTOR = '#volume-slider, #expand-volume-slider'
    const SLIDER_SETTERS_SELECTOR = '.slider-knob.style-scope.tp-yt-paper-slider, #sliderBar'

    const SLIDE_MULTIPLIER = 2;

    async function findVideo() {
        return new Promise((resolve) => {
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.addedNodes.length) {
                        let videoElement = document.querySelector(VIDEO_SELECTOR);
                        if (videoElement) {
                            observer.disconnect();
                            resolve(videoElement);
                            return;
                        }
                    }
                }
            });

            observer.observe(document, { childList: true, subtree: true });
        });
    }

    async function findSliders() {
        return new Promise((resolve) => {
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.addedNodes.length) {
                        let sliderElements = document.querySelectorAll(SLIDERS_SELECTOR);
                        if (sliderElements.length >= 2) {
                            observer.disconnect();
                            let sliders = Array.from(sliderElements).map(sliderElement => sliderElement = removeAllEventListeners(sliderElement));
                            resolve(sliders);
                            return;
                        }
                    }
                }
            });

            observer.observe(document, { childList: true, subtree: true });
        });
    }

    async function findSliderSetters() {
        return new Promise((resolve) => {
            const observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.addedNodes.length) {
                        let sliderSetterElements = document.getElementById('right-controls').querySelectorAll(SLIDER_SETTERS_SELECTOR);
                        if (sliderSetterElements.length >= 4) {
                            let sliderSetters = Array.from(sliderSetterElements)
                            observer.disconnect();
                            resolve(sliderSetters);
                            return;
                        }
                    }
                }
            });

            observer.observe(document, { childList: true, subtree: true });
        });
    }

    function removeAllEventListeners(element) {
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        return newElement;
    }

    function setWheelBehaviour(videoElement, sliders, sliderSetters) {
        const knobs = sliderSetters.filter(sliderSetter => sliderSetter.classList.contains('slider-knob'));
        const sliderBars = sliderSetters.filter(sliderSetter => sliderSetter.id === 'sliderBar');
        sliders.forEach(slider => {
            slider.addEventListener('wheel', (e) => {
                if (e.deltaY > 0) {
                    videoElement.volume = Math.max(videoElement.volume - 0.01 * SLIDE_MULTIPLIER, 0);
                } else {
                    videoElement.volume = Math.min(videoElement.volume + 0.01 * SLIDE_MULTIPLIER, 1);
                }
                sliderBars.forEach(sliderBar => sliderBar.value = videoElement.volume * 100);
                knobs.forEach(knob => knob.style.left = `${videoElement.volume * 100}%`);
            });
        });
    }

    async function run() {
        const videoElement = await findVideo();
        const sliders = await findSliders();
        const sliderSetters = await findSliderSetters();
        setWheelBehaviour(videoElement, sliders, sliderSetters);
    }

    run();
})();
