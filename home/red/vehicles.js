// The vehicles on red's street (red/place.js) and in the scale app's Times Square
// (projects/play/scale/city.js), so both draw the same ones at the same sizes. Each is at one
// real model's size: [length, width, height] in metres, then its shape as
// boxes along it, rear (0) to front (1): [from, to, inset (share of the width), bottom, top (shares
// of the height), side ink, top ink], and bands painted on the sides: [from, to, bottom, top, ink].
// Sizes, looked up on 2026-11-19 (sources in the scale app's notes): a 2025 Toyota Camry (4.92 × 1.84 × 1.445 m,
// which is also the yellow cab); a Toyota RAV4 (4.60 × 1.855 × 1.69); a Ford F-150 SuperCrew with
// the 5.5 ft bed (231.7 × 79.9 × 77.2 in); a Ford Transit cargo van, 148 in wheelbase, high roof
// (235.5 × 81.3 × 110.2 in); a box truck with a 26 ft box (102 in wide, 13 ft 6 in tall; its cab
// drawn); a rear-loading garbage truck (23.5 ft long, 11 ft 7 in tall, Seattle Public Utilities'
// sheet); New Flyer Xcelsior buses, 41 ft and 60 ft 10 in over the bumpers, 102 in wide, 11 ft 1 in
// tall; and a tractor-trailer at New York City's limit off the interstates (55 ft, 8 ft, 13 ft 6 in).
const redVehicles = (() => {
  'use strict';
  const KINDS = {
    sedan: { name: 'Sedan · 4.9 m', size: [4.92, 1.84, 1.445], parts: [[0, 1, 0, .14, .56, 'body', 'body'], [.24, .72, .07, .56, 1, 'glass', 'body']] },
    cab: { name: 'NYC yellow cab · 4.9 m', size: [4.92, 1.84, 1.445], ink: '#e8c22a', parts: [[0, 1, 0, .14, .56, 'body', 'body'], [.24, .72, .07, .56, 1, 'glass', 'body'], [.47, .53, .3, 1, 1.12, 'light', 'light']] },
    suv: { name: 'SUV · 4.6 m', size: [4.60, 1.855, 1.69], parts: [[0, 1, 0, .16, .56, 'body', 'body'], [.06, .78, .05, .56, 1, 'glass', 'body']] },
    pickup: { name: 'Pickup truck · 5.9 m', size: [5.89, 2.03, 1.96], parts: [[0, 1, 0, .2, .52, 'body', 'body'], [.38, .72, .04, .52, 1, 'glass', 'body'], [.72, 1, .03, .52, .6, 'body', 'body']] },
    van: { name: 'Delivery van · 6.0 m', size: [5.98, 2.07, 2.80], ink: '#e9ecea', parts: [[0, .84, 0, .1, 1, 'body', 'body'], [.84, 1, .04, .1, .52, 'body', 'body'], [.78, .86, .05, .52, .86, 'glass', 'body']] },
    box: { name: 'Box truck, 26 ft box · 10.4 m', size: [10.4, 2.59, 4.11], ink: '#e6e4dc', cab: '#c9372c', parts: [[0, .76, 0, .23, 1, 'body', 'body'], [.77, 1, .06, .14, .62, 'cab', 'cab'], [.82, .97, .08, .38, .6, 'glass', 'cab']] },
    garbage: { name: 'Garbage truck · 7.2 m', size: [7.16, 2.44, 3.53], ink: '#eef0ec', cab: '#eef0ec', parts: [[0, .13, .03, .16, .86, 'dark', 'dark'], [.12, .76, 0, .2, 1, 'body', 'body'], [.77, 1, .03, .1, .74, 'cab', 'cab'], [.78, .99, .05, .42, .72, 'glass', 'cab']] },
    bus: { name: 'City bus · 12.5 m', size: [12.5, 2.59, 3.38], ink: '#e4e8ea', parts: [[0, 1, 0, .1, .95, 'body', 'light']], bands: [[.03, .97, .42, .82, 'glass'], [0, 1, .24, .32, 'stripe']] },
    artic: { name: 'Articulated bus · 18.5 m', size: [18.5, 2.59, 3.38], ink: '#e4e8ea', parts: [[0, .47, 0, .1, .95, 'body', 'light'], [.47, .5, .1, .12, .9, 'dark', 'dark'], [.5, 1, 0, .1, .95, 'body', 'light']], bands: [[.02, .46, .42, .82, 'glass'], [.51, .98, .42, .82, 'glass'], [0, 1, .24, .32, 'stripe']] },
    semi: { name: 'Tractor-trailer · 16.8 m', size: [16.76, 2.44, 4.11], ink: '#d9dcd9', cab: '#8a2f2a', parts: [[0, .74, 0, .28, 1, 'body', 'body'], [.7, .84, .12, .2, .33, 'dark', 'dark'], [.83, 1, .03, .2, .83, 'cab', 'cab'], [.87, .99, .05, .52, .8, 'glass', 'cab']] },
};
  // How often each turns up in traffic that is not a queue drawn by hand: mostly cars.
  const MIX = [['sedan', .32], ['cab', .25], ['suv', .2], ['pickup', .07], ['van', .07], ['box', .03], ['garbage', .015], ['bus', .03], ['artic', .01], ['semi', .005]];
  const pick = x => { let a = 0; for (const [k, p] of MIX) { a += p; if (x < a) return k; } return 'sedan'; };
  return { KINDS, MIX, pick };
})();
