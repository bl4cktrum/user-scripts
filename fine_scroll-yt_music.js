// ==UserScript==
// @name         Fine Volume Scroll for Youtube Music
// @namespace    http://tampermonkey.net/
// @version      2024-06-18
// @description  try to take over the world!
// @author       bl4cktrum
// @match        *://music.youtube.com/watch?v=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    const VIDEO_SELECTOR = '.video-stream.html5-main-video';
    const SLIDERS_SELECTOR = '#volume-slider, #expand-volume-slider'
    const SLIDER_SETTERS_SELECTOR = '.slider-knob.style-scope.tp-yt-paper-slider, #sliderBar'

    const SLIDE_MULTIPLIER = 2;
    let volume;

    async function getVideoElement() {
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

    function getStoredVolume() {
        return localStorage.getItem('fine_scroll-yt_music_volume');
    }

    async function getSliderElements() {
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

    async function getSliderSetterElements() {
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

    function setWheelBehaviour(videoElement, sliders, sliderSetters, preventer) {
        sliders.forEach(slider => {
            slider.addEventListener('wheel', (e) => {
                videoElement.removeEventListener('volumechange', preventer);
                if (e.deltaY > 0) {
                    videoElement.volume = Math.max(videoElement.volume - 0.01 * SLIDE_MULTIPLIER, 0);
                } else {
                    videoElement.volume = Math.min(videoElement.volume + 0.01 * SLIDE_MULTIPLIER, 1);
                }
                setVolumeVisually(videoElement, sliderSetters);
                volume = videoElement.volume;
                localStorage.setItem('fine_scroll-yt_music_volume', volume);
                videoElement.addEventListener('volumechange', preventer);
            });
        });
    }

    function setVolumeVisually(videoElement, sliderSetters) {
        const knobs = sliderSetters.filter(sliderSetter => sliderSetter.classList.contains('slider-knob'));
        const sliderBars = sliderSetters.filter(sliderSetter => sliderSetter.id === 'sliderBar');
        sliderBars.forEach(sliderBar => sliderBar.value = videoElement.volume * 100);
        knobs.forEach(knob => knob.style.left = `${videoElement.volume * 100}%`);

    }

    function preventInternalVolumeChanges(videoElement) {
        let volChangeEvent = videoElement.addEventListener('volumechange', () => {
            if (videoElement.volume !== volume) {
                videoElement.volume = volume;
            }
        });
        videoElement.addEventListener('play', () => {
            videoElement.removeEventListener('volumechange', volChangeEvent)
            videoElement.volume = volume
            videoElement.addEventListener('volumechange', volChangeEvent)
        })
        return volChangeEvent
    }

    async function run() {
        const videoElement = await getVideoElement();
        videoElement.volume = getStoredVolume() || 0.5;
        volume = videoElement.volume;
        const sliders = await getSliderElements();
        const sliderSetters = await getSliderSetterElements();
        setVolumeVisually(videoElement, sliderSetters);
        let preventer = preventInternalVolumeChanges(videoElement);
        setWheelBehaviour(videoElement, sliders, sliderSetters, preventer);
    }

    run();
})();
