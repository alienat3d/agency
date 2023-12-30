'use strict';

import Swiper from 'swiper';

import {
  Keyboard,
  Mousewheel,
  Navigation
} from 'swiper/modules';

const swiper = new Swiper('.hero-slider', {
  modules: [Keyboard, Mousewheel, Navigation],
  mousewheel: {
    invert: false,
  },
  keyboard: {
    enabled: true,
    onlyInViewport: true,
  },
  navigation: {
    prevEl: '.slider-button-prev',
    nextEl: '.slider-button-next',
  },
});

swiper();