#!/usr/bin/env python3
"""Write scale/galaxies.js: galaxies at their measured places, for the frames wider than about
100 million light-years, so that superclusters, walls and voids show as the galaxies in them.

Two redshift surveys, read with the standard library only:

  2MRS   The 2MASS Redshift Survey (Huchra et al. 2012, ApJS 199, 26), table 3 from the CDS:
         43,533 galaxies brighter than Ks = 11.75 over the whole sky outside the Milky Way's
         plane (|b| > 5 degrees, 8 toward the bulge). Every galaxy past the near limit is kept.
  SDSS   The Sloan Digital Sky Survey's main galaxy sample (Strauss et al. 2002), from Data
         Release 17's SkyServer: spectra classed as galaxies with a clean redshift between
         SDSS_Z[0] and SDSS_Z[1], one in SDSS_KEEP of them (chosen by plate and fibre number,
         which has nothing to do with the galaxy). It covers about a third of the sky.

A galaxy's place is its direction and a distance worked out from its redshift: the redshift is
moved to the frame of the cosmic microwave background (Planck 2018 dipole: 369.82 km/s toward
l = 264.021, b = 48.253), and the distance is the comoving one in a flat universe with
H0 = 73 km/s/Mpc and matter density 0.315. H0 = 73 is the rate measured from nearby galaxies
(Riess et al. 2022) and the one that puts the clusters where far.js has them from their
catalogued distances; with Planck's 67.4 every galaxy would sit 8 percent farther. Because the
distance comes from redshift, the galaxies' own speeds inside a cluster stretch it along the
line of sight.

Positions are whole numbers of `unit` light-years along the galactic axes far.js uses (x toward
the galactic centre, y toward longitude 90, z toward the north galactic pole), three 16-bit
numbers a galaxy, little-endian, in base64.

Run by .github/workflows/galaxies.yml, which commits the result; run it by hand with
`python3 tools/build_galaxies.py`.
"""
import base64, gzip, io, json, math, re, struct, sys, time, urllib.parse, urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "scale/galaxies.js"
AGENT = {"User-Agent": "scale-of-the-universe galaxies script (github.com/bomberJV/scale-of-the-universe)"}
C = 299792.458            # km/s
H0, OMEGA_M = 73.0, 0.315
LY_PER_MPC = 3.26156e6
DIPOLE = (369.82, 264.021, 48.253)      # km/s, galactic longitude and latitude (Planck 2018)
NEAR = 500.0              # km/s in the CMB frame: nearer than this a redshift says little about distance
TWOMRS_REACH = 8.5e8      # light-years
SDSS_Z = (0.045, 0.17)
SDSS_KEEP = 9             # one in this many
CDS = ["https://cdsarc.cds.unistra.fr/ftp/J/ApJS/199/26/", "https://cdsarc.u-strasbg.fr/ftp/J/ApJS/199/26/"]
SKYSERVER = ["https://skyserver.sdss.org/dr17/SkyServerWS/SearchTools/SqlSearch", "https://skyserver.sdss.org/dr18/SkyServerWS/SearchTools/SqlSearch",
             "https://skyserver.sdss.org/dr16/SkyServerWS/SearchTools/SqlSearch"]
# J2000 right ascension and declination to a galactic direction (the matrix far.js uses).
T = [[-.0548755604, -.8734370902, -.4838350155], [.4941094279, -.4448296300, .7469822445], [-.8676661490, -.1980763734, .4559837762]]
RAD = math.pi / 180


def say(*a):
    print(*a, flush=True)


def fetch(urls, tries=3, timeout=300):
    last = None
    for url in urls:
        for n in range(tries):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=timeout) as r:
                    data = r.read()
                say(f"  fetched {len(data):,} bytes from {url[:110]}")
                return data
            except Exception as e:      # noqa: BLE001 - any failure moves on to the next try or mirror
                last = e
                say(f"  failed ({e!r}) {url[:110]}")
                time.sleep(5 * (n + 1))
    raise SystemExit(f"::error::could not fetch {urls[0][:120]}: {last!r}")


def comoving_ly(z, steps=24):
    """Comoving distance in light-years (Simpson's rule)."""
    if z <= 0:
        return 0.0
    f = lambda x: 1 / math.sqrt(OMEGA_M * (1 + x) ** 3 + 1 - OMEGA_M)
    h = z / steps
    s = f(0) + f(z) + sum((4 if i % 2 else 2) * f(i * h) for i in range(1, steps))
    return C / H0 * s * h / 3 * LY_PER_MPC


def galactic(ra, dec):
    v = (math.cos(dec * RAD) * math.cos(ra * RAD), math.cos(dec * RAD) * math.sin(ra * RAD), math.sin(dec * RAD))
    return tuple(sum(row[i] * v[i] for i in range(3)) for row in T)


D0 = (math.cos(DIPOLE[2] * RAD) * math.cos(DIPOLE[1] * RAD), math.cos(DIPOLE[2] * RAD) * math.sin(DIPOLE[1] * RAD), math.sin(DIPOLE[2] * RAD))


def place(direction, cz):
    """A unit galactic direction and a heliocentric cz [km/s] to a position [ly], or None if too near."""
    v = cz + DIPOLE[0] * sum(a * b for a, b in zip(direction, D0))
    if v < NEAR:
        return None
    d = comoving_ly(v / C)
    return tuple(c * d for c in direction)


def columns(readme, table):
    """Byte ranges by label from a CDS ReadMe's byte-by-byte description of `table`."""
    lines = readme.splitlines()
    start = next(i for i, l in enumerate(lines) if l.startswith("Byte-by-byte Description of file") and table in l)
    out, rules = {}, 0
    for l in lines[start + 1:]:
        if l.startswith("-----"):
            rules += 1
            if rules == 3:
                break
            continue
        if rules < 2:
            continue
        m = re.match(r"\s*(\d+)\s*-\s*(\d+)\s+(\S+)\s+(\S+)\s+(\S+)", l) or re.match(r"\s*()(\d+)\s+(\S+)\s+(\S+)\s+(\S+)", l)
        if m:
            a, b = int(m.group(1) or m.group(2)), int(m.group(2))
            out[m.group(5)] = (a - 1, b)
    return out


def twomrs():
    say("2MRS (CDS J/ApJS/199/26, table 3)")
    readme = fetch([u + "ReadMe" for u in CDS]).decode("latin-1")
    cols = columns(readme, "table3.dat")
    say("  columns:", " ".join(f"{k}[{a + 1}-{b}]" for k, (a, b) in cols.items()))
    pick = lambda *names: next((cols[n] for n in names if n in cols), None)
    lon, lat, ra, dec = pick("GLON", "GLONdeg"), pick("GLAT", "GLATdeg"), pick("RAdeg", "RAJ2000"), pick("DEdeg", "DEJ2000")
    vel = pick("cz", "HRV", "Vhel", "RV") or next((v for k, v in cols.items() if "cz" in k.lower() and not k.lower().startswith(("e_", "r_", "n_"))), None)
    if not vel or not ((lon and lat) or (ra and dec)):
        raise SystemExit("::error::2MRS: could not find the position and velocity columns in the ReadMe")
    raw = fetch([u + "table3.dat.gz" for u in CDS])
    text = gzip.decompress(raw).decode("latin-1") if raw[:2] == b"\x1f\x8b" else raw.decode("latin-1")
    out, read, near, far = [], 0, 0, 0
    for line in text.splitlines():
        try:
            cz = float(line[vel[0]:vel[1]])
            if lon and lat:
                l, b = float(line[lon[0]:lon[1]]) * RAD, float(line[lat[0]:lat[1]]) * RAD
                d = (math.cos(b) * math.cos(l), math.cos(b) * math.sin(l), math.sin(b))
            else:
                d = galactic(float(line[ra[0]:ra[1]]), float(line[dec[0]:dec[1]]))
        except ValueError:
            continue
        read += 1
        p = place(d, cz)
        if p is None:
            near += 1
        elif math.hypot(*p) > TWOMRS_REACH:
            far += 1
        else:
            out.append(p)
    say(f"  {read:,} galaxies with a redshift; {near:,} nearer than {NEAR:.0f} km/s left to the nearby list; {far:,} past {TWOMRS_REACH / 1e6:.0f} million ly dropped; {len(out):,} kept")
    if len(out) < 35000:
        raise SystemExit(f"::error::2MRS: only {len(out)} galaxies read; expected about 43,000")
    return out


def sdss():
    say("SDSS main galaxy sample (SkyServer)")
    where = f"class='GALAXY' AND zWarning=0 AND z BETWEEN {SDSS_Z[0]} AND {SDSS_Z[1]} AND ((plate + fiberID) % {SDSS_KEEP}) = 0"
    queries = [f"SELECT ra, dec, z FROM SpecObj WHERE {where} AND survey='sdss' AND (legacy_target1 & 64) > 0",
               f"SELECT ra, dec, z FROM SpecObj WHERE {where} AND survey='sdss'"]
    rows = None
    for q in queries:
        say("  query:", q)
        for base in SKYSERVER:
            try:
                with urllib.request.urlopen(urllib.request.Request(base + "?" + urllib.parse.urlencode({"cmd": q, "format": "csv"}), headers=AGENT), timeout=600) as r:
                    text = r.read().decode("utf-8", "replace")
            except Exception as e:      # noqa: BLE001
                say(f"  failed ({e!r}) {base}")
                continue
            lines = [l for l in text.splitlines() if l and not l.startswith("#")]
            say(f"  {base}: {len(lines):,} lines; first: {lines[:2]}")
            if len(lines) > 1000 and lines[0].replace(" ", "").lower().startswith("ra,dec,z"):
                rows = lines[1:]
                break
        if rows:
            break
    if not rows:
        raise SystemExit("::error::SDSS: no usable answer from SkyServer")
    out = []
    for l in rows:
        try:
            ra, dec, z = (float(x) for x in l.split(",")[:3])
        except ValueError:
            continue
        p = place(galactic(ra, dec), z * C)
        if p:
            out.append(p)
    say(f"  {len(out):,} galaxies kept (one in {SDSS_KEEP})")
    if not 20000 < len(out) < 140000:
        raise SystemExit(f"::error::SDSS: {len(out)} galaxies; expected some tens of thousands")
    return out


def pack(points):
    reach = max(max(abs(c) for c in p) for p in points)
    unit = math.ceil(reach / 32767 / 100) * 100
    data = b"".join(struct.pack("<3h", *(round(c / unit) for c in p)) for p in points)
    return unit, base64.b64encode(data).decode("ascii")


def check(name, points, ra, dec, d_ly, radius_ly, least):
    """Count the galaxies within radius_ly of a known cluster, as a check on directions and distances."""
    centre = tuple(c * d_ly for c in galactic(ra, dec))
    n = sum(1 for p in points if math.dist(p, centre) < radius_ly)
    say(f"  check: {n} galaxies within {radius_ly / 1e6:.0f} million ly of {name} ({d_ly / 1e6:.0f} million ly)")
    if n < least:
        raise SystemExit(f"::error::{name}: only {n} galaxies where at least {least} were expected; positions or distances are off")


def main():
    a = twomrs()
    # The clusters far.js places from catalogued positions and distances must have their galaxies.
    check("the Coma Cluster", a, 194.953, 27.981, 320e6, 40e6, 150)
    check("the Perseus Cluster", a, 49.652, 41.515, 240e6, 40e6, 100)
    check("the Hydra Cluster", a, 159.214, -27.526, 190e6, 35e6, 60)
    check("the Norma Cluster", a, 243.887, -60.908, 220e6, 40e6, 25)
    b = sdss()
    # The Sloan Great Wall: along the celestial equator about a billion light-years away.
    check("the middle of the Sloan Great Wall", b, 195, 0, 1.03e9, 120e6, 80)
    surveys = []
    for key, name, source, points in [
        ("2mrs", "2MASS Redshift Survey", "Huchra et al. 2012, ApJS 199, 26 (CDS J/ApJS/199/26, table 3)", a),
        ("sdss", "Sloan Digital Sky Survey, main galaxy sample", f"SDSS Data Release 17, SkyServer; one in {SDSS_KEEP} of the galaxies with redshift {SDSS_Z[0]} to {SDSS_Z[1]}", b),
    ]:
        unit, data = pack(points)
        reach = max(math.hypot(*p) for p in points)
        say(f"  {key}: {len(points):,} galaxies, unit {unit:,} ly, farthest {reach / 1e6:.0f} million ly, {len(data):,} characters")
        surveys.append({"key": key, "name": name, "source": source, "count": len(points), "unit": unit, "reach": round(reach), "data": data})
    head = ("// Generated by tools/build_galaxies.py. Do not edit by hand. Galaxies at their measured places:\n"
            "// direction on the sky, and a distance from redshift (CMB frame, H0 = 73 km/s/Mpc). Each survey's\n"
            "// `data` is base64 of three little-endian 16-bit numbers a galaxy: whole numbers of `unit`\n"
            "// light-years along the galactic x (toward the centre), y (longitude 90) and z (north pole).\n")
    OUT.write_text(head + "export const GALAXIES = " + json.dumps({"h0": H0, "near": NEAR, "surveys": surveys}, separators=(",", ":")) + ";\n", encoding="utf-8")
    say(f"wrote {OUT} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    sys.exit(main())
