# Scale of the Universe

[![Tests](https://github.com/bomberJV/scale-of-the-universe/actions/workflows/tests.yml/badge.svg)](https://github.com/bomberJV/scale-of-the-universe/actions/workflows/tests.yml) · [Open it on brandonfhuang.com](https://brandonfhuang.com/projects/play/scale/)

One frame, zoomed and turned by hand from the Planck length, through a proton, a cell, a New York street, the Earth and the Milky Way, to the edge of the observable universe: about 62 powers of ten. Every size, distance and position is a real one, with its source on the page.

From the repository root, run `python -m http.server 8000` and open [Scale of the universe](http://localhost:8000/scale/).

Run `node --test tests/*.test.mjs` with Node 22 or newer.

[Scenes, controls and how it is put together](scale/README.md) · [Portfolio](https://brandonfhuang.com)

## Layout

| Folder | Contents |
| --- | --- |
| `scale/` | The page: controls, scenes, notes, sounds, the wavelengths' strip, the state and county outlines and the surveys' galaxies |
| `home/` | Modules shared with the homepage: the pull back from the Earth to the Milky Way (`journey.js`), stars, galaxies, the Moon and the world map. `home/red/` holds the zoom below 8 m (`sizes.js`), the lettering (`ink.js`), the street's vehicles and the five boroughs, shared with the red homepage |
| `shared/` | The projects' stylesheet and symbol font |
| `tools/` | `scale_boundaries.py`, which writes `scale/boundaries.js` from the Census Bureau's files, and `build_galaxies.py`, which writes `scale/galaxies.js` from two redshift surveys; the `Boundaries` and `Galaxies` workflows run them and commit what they write |
| `tests/` | Checks that every file the page loads is here and that every module loads, that every name in the zoom has a note, and that the galaxies are where the clusters are |

The website serves the same files at `/projects/play/scale/`, `/home/` and `/projects/play/shared/`. The served copy differs in two files: `scale/index.html` carries the site's header, search metadata, themes and analytics and loads `/home/` from the site root, and `scale/notes.js` links the consulting page by path instead of by its full address.

## License

Created by Brandon Frank Han-Chween Huang ([brandonfhuang.com](https://brandonfhuang.com)).

- **Code** (scripts, styles, page markup, tests and tools): [Apache License 2.0](LICENSE). Keep the [NOTICE](NOTICE) file with any copy or derivative.
- **Writing and figures** (the notes, descriptions and source lists): [CC BY 4.0](LICENSE-CC-BY-4.0.txt). Credit “Brandon Frank Han-Chween Huang” and link to https://brandonfhuang.com or this repository.
- **Third-party data and files** keep their own terms:
  - The star catalogue in `home/stars.js` is an adapted subset of HYGLike v3.2 from the [AT-HYG database](https://github.com/astronexus/HYG-Database) (David Nash, astronexus), under CC BY-SA 4.0.
  - The land and places in `home/geography.js` are from Natural Earth, in the public domain.
  - The borough outlines in `home/red/newyork.js` are the NYC Department of City Planning's borough boundaries, as packaged by Code for America's Click That Hood (MIT).
  - The state and county outlines in `scale/boundaries.js` are from the US Census Bureau's cartographic boundary files, in the public domain.
  - The galaxies in `scale/galaxies.js` are positions worked out from the 2MASS Redshift Survey (Huchra et al. 2012, ApJS 199, 26, from the CDS's VizieR service) and from the Sloan Digital Sky Survey's Data Release 17 (public data; cite SDSS when using them).
  - `shared/symbols.woff` is a DejaVu font subset under the Bitstream Vera license ([shared/FONT-LICENSE.txt](shared/FONT-LICENSE.txt)).
  - Pictures in the side panel are fetched from Wikimedia Commons when a note opens and are shown with their author and license; none are stored here.
