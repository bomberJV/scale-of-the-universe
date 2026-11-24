#!/usr/bin/env python3
"""Write scale/boundaries.js: state and county outlines around New York.

Source: US Census Bureau, 2023 cartographic boundary files at 1:500,000
(cb_2023_us_state_500k and cb_2023_us_county_500k), read with the standard library only.
Kept: every state that reaches into the box below, and every county of New Jersey and New
York. Outlines are simplified (Douglas-Peucker) and stored as whole numbers of 10 m east and
north of Times Square, each ring as differences from the point before.

Run by .github/workflows/boundaries.yml, which commits the result; run it by hand with `python3 tools/scale_boundaries.py`.
"""
import io, json, math, struct, sys, urllib.request, zipfile
from pathlib import Path

BASE = "https://www2.census.gov/geo/tiger/GENZ2023/shp/"
OUT = Path(__file__).resolve().parent.parent / "scale/boundaries.js"
HERE = (40.758, -73.9855)  # Times Square, the frame's centre
BOX = (-81.5, 37.8, -69.5, 45.6)  # lon, lat: what a frame of about 1,000 km round New York can show
COUNTY_STATES = {"34", "36"}  # New Jersey, New York
UNIT = 10  # metres per stored unit
M_LAT = 111_200
M_LON = 111_320 * math.cos(math.radians(HERE[0]))


def fetch(name):
    req = urllib.request.Request(BASE + name, headers={"User-Agent": "brandon-studio boundaries script"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return zipfile.ZipFile(io.BytesIO(r.read()))


def read_dbf(data):
    count, header, size = struct.unpack("<IHH", data[4:12])
    fields, pos = [], 32
    while data[pos] != 0x0D:
        name = data[pos:pos + 11].split(b"\0")[0].decode()
        fields.append((name, data[pos + 16]))
        pos += 32
    rows = []
    for i in range(count):
        rec, at, row = data[header + i * size: header + (i + 1) * size], 1, {}
        for name, length in fields:
            row[name] = rec[at:at + length].decode("latin-1").strip()
            at += length
        rows.append(row)
    return rows


def read_shp(data):
    shapes, pos = [], 100
    while pos < len(data):
        _, length = struct.unpack(">ii", data[pos:pos + 8])
        body = data[pos + 8: pos + 8 + length * 2]
        pos += 8 + length * 2
        kind = struct.unpack("<i", body[:4])[0]
        if kind == 0:
            shapes.append([])
            continue
        parts_n, points_n = struct.unpack("<ii", body[36:44])
        parts = list(struct.unpack(f"<{parts_n}i", body[44:44 + 4 * parts_n])) + [points_n]
        at = 44 + 4 * parts_n
        pts = struct.unpack(f"<{2 * points_n}d", body[at:at + 16 * points_n])
        shapes.append([[(pts[2 * k], pts[2 * k + 1]) for k in range(parts[p], parts[p + 1])] for p in range(parts_n)])
    return shapes


def load(name):
    z = fetch(name + ".zip")
    shp = z.read(name + ".shp")
    dbf = z.read(name + ".dbf")
    return list(zip(read_dbf(dbf), read_shp(shp)))


def metres(lon, lat):
    return ((lon - HERE[1]) * M_LON, (lat - HERE[0]) * M_LAT)


def simplify(pts, tol):
    if len(pts) < 4:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]
        bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy) or 1e-9
        far, at = -1.0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            d = abs(dy * (px - ax) - dx * (py - ay)) / L if (dx or dy) else math.hypot(px - ax, py - ay)
            if d > far:
                far, at = d, i
        if far > tol and at > 0:
            keep[at] = True
            stack += [(a, at), (at, b)]
    return [p for p, k in zip(pts, keep) if k]


def area(pts):
    return abs(sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]))) / 2


def pack(rings, tol, smallest):
    out = []
    for ring in rings:
        lon = [p[0] for p in ring]
        lat = [p[1] for p in ring]
        if max(lon) < BOX[0] or min(lon) > BOX[2] or max(lat) < BOX[1] or min(lat) > BOX[3]:
            continue
        pts = [metres(*p) for p in ring]
        if area(pts) < smallest:
            continue
        pts = simplify(pts, tol)
        if len(pts) < 4:
            continue
        q = [(round(x / UNIT), round(y / UNIT)) for x, y in pts]
        flat, px, py = [], 0, 0
        for x, y in q:
            flat += [x - px, y - py]
            px, py = x, y
        out.append(flat)
    return out


def main():
    states, counties = [], []
    for row, rings in load("cb_2023_us_state_500k"):
        packed = pack(rings, 250, 2e6)
        if packed:
            states.append({"name": row["NAME"], "abbr": row["STUSPS"], "fips": row["STATEFP"], "rings": packed})
    for row, rings in load("cb_2023_us_county_500k"):
        if row["STATEFP"] not in COUNTY_STATES:
            continue
        packed = pack(rings, 90, 4e5)
        if packed:
            counties.append({"name": row["NAMELSAD"], "state": row["STUSPS"], "fips": row["STATEFP"] + row["COUNTYFP"], "rings": packed})
    states.sort(key=lambda s: s["name"])
    counties.sort(key=lambda c: (c["state"], c["name"]))
    points = sum(len(r) // 2 for s in states + counties for r in s["rings"])
    body = json.dumps({"unit": UNIT, "origin": HERE, "states": states, "counties": counties}, separators=(",", ":"))
    OUT.write_text(
        "// Generated by tools/scale_boundaries.py from the US Census Bureau's 2023 cartographic\n"
        "// boundary files (1:500,000). Do not edit by hand. Each ring is whole numbers of `unit` metres\n"
        "// east and north of Times Square, as differences from the point before.\n"
        f"export const BOUNDARIES = {body};\n"
    )
    print(f"{len(states)} states, {len(counties)} counties, {points} points, {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    sys.exit(main())
