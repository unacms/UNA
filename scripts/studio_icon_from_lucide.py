"""
Studio app icons from Lucide glyphs, with the glyph flattened to one outline.

Lucide draws a glyph as several stroked paths. Layered with a translucent gradient and a 10% shadow copy, every
overlap between two strokes shows twice as dark. So each stroke is expanded to its outline (2 units wide, round
caps and joins, as Lucide draws it), all outlines are united into one shape, and that shape is filled instead.

Usage: python3 scripts/studio_icon_from_lucide.py <repo root>   (needs: pip install shapely svgpathtools)
"""
import math
import re
import sys
import xml.etree.ElementTree as ET

from shapely.geometry import LineString, Polygon, MultiPolygon
from shapely.ops import unary_union
from svgpathtools import parse_path

ROOT = sys.argv[1].rstrip('/')
LUCIDE = ROOT + '/plugins_public/lucide/icons/'

PLATES = {
    'gray':   ('#71717A', '#3F3F46'),
    'green':  ('#059669', '#065F46'),
    'orange': ('#D97706', '#92400E'),
    'purple': ('#7C3AED', '#5B21B6'),
    'red':    ('#F43F5E', '#BE123C'),
    'white':  ('#F3F4F6', '#E5E7EB'),
}
# glyph gradient (top, bottom): white fading out on a coloured plate, zinc on the white plate
GLYPH = {
    'white': ('#71717A', '#3F3F46'),
}

ICONS = [
    ('modules/boonex/api/template/images/icons/std-icon.svg', 'api', 'gray', 'webhook', 80),
    ('modules/boonex/anon_follow/template/images/icons/std-icon.svg', 'anon_follow', 'orange', 'hat-glasses', 80),
    ('modules/boonex/decorous/template/images/icons/std-icon.svg', 'decorous', 'purple', 'panels-top-left', 80),
    ('modules/boonex/editor/template/images/icons/std-icon.svg', 'editor', 'gray', 'text-initial', 80),
    ('modules/boonex/lucid/template/images/icons/std-icon.svg', 'lucid', 'purple', 'layout-panel-top', 80),
    ('modules/boonex/mapshow/template/images/icons/std-icon.svg', 'mapshow', 'green', 'map', 80),
    ('studio/template/images/modules/bx_polls.svg', 'polls', 'green', 'vote', 72),
    ('modules/boonex/cas_connect/template/images/icons/std-icon.svg', 'cas', 'white', 'fingerprint-pattern', 80),
    # discontinued apps and integrations whose service is gone: a dashed placeholder on the gray plate
    ('modules/boonex/datafox/template/images/icons/std-icon.svg', 'datafox', 'gray', 'square-dashed', 80),
    ('modules/boonex/dolphin_migration/template/images/icons/std-icon.svg', 'dolphin_migration', 'gray', 'square-dashed', 80),
    ('modules/boonex/froala/template/images/icons/std-icon.svg', 'froala', 'gray', 'square-dashed', 80),
]

# Brand artwork on the white plate: the source SVG's shapes are copied as they are (fills, gradients), scaled to
# ART_WIDTH px and centred; the shadow is the united outline of every shape, filled black/10 and shifted 1px down.
# 'skip' drops shapes by class or id (wordmarks, registered marks). The source files are not part of the repo.
ART_WIDTH = 50
ART = [
    # ('modules/boonex/azure_b2c_con/template/images/icons/std-icon.svg', 'azrb2c', '<thesvg.org azure-azure-ad-b2c default.svg>', ()),
    # ('modules/boonex/azure_connect/template/images/icons/std-icon.svg', 'azrcon', '<thesvg.org azure-entra-connect default.svg>', ()),
    # ('modules/boonex/cidaas_connect/template/images/icons/std-icon.svg', 'cidaascon', '<cidaas logo-cidaas-vertical-color-print.svg>', ('st5',)),
]

STROKE = 2.0      # Lucide stroke width, in its 24-unit space
STEP = 0.02       # sampling step along curves
TOL = 0.003       # simplification tolerance of the united outline


def element_to_d(el):
    """A Lucide shape element as a path 'd' string."""
    tag = el.tag.split('}')[-1]
    a = el.attrib
    f = lambda k, d='0': float(a.get(k, d))
    if tag == 'path':
        return a['d']
    if tag == 'circle':
        cx, cy, r = f('cx'), f('cy'), f('r')
        return f'M{cx - r},{cy} A{r},{r} 0 1 0 {cx + r},{cy} A{r},{r} 0 1 0 {cx - r},{cy} Z'
    if tag == 'ellipse':
        cx, cy, rx, ry = f('cx'), f('cy'), f('rx'), f('ry')
        return f'M{cx - rx},{cy} A{rx},{ry} 0 1 0 {cx + rx},{cy} A{rx},{ry} 0 1 0 {cx - rx},{cy} Z'
    if tag == 'rect':
        x, y, w, h = f('x'), f('y'), f('width'), f('height')
        rx = f('rx', a.get('ry', '0'))
        ry = f('ry', str(rx))
        if rx == 0 and ry == 0:
            return f'M{x},{y} h{w} v{h} h{-w} Z'
        return (f'M{x + rx},{y} h{w - 2 * rx} a{rx},{ry} 0 0 1 {rx},{ry} v{h - 2 * ry} a{rx},{ry} 0 0 1 {-rx},{ry} '
                f'h{-(w - 2 * rx)} a{rx},{ry} 0 0 1 {-rx},{-ry} v{-(h - 2 * ry)} a{rx},{ry} 0 0 1 {rx},{-ry} Z')
    if tag == 'line':
        return f'M{f("x1")},{f("y1")} L{f("x2")},{f("y2")}'
    if tag in ('polyline', 'polygon'):
        pts = re.findall(r'-?\d*\.?\d+', a['points'])
        d = 'M' + ' L'.join(f'{pts[i]},{pts[i + 1]}' for i in range(0, len(pts), 2))
        return d + (' Z' if tag == 'polygon' else '')
    return None


def sample(d):
    """Each continuous subpath of 'd' as a list of (x, y) points."""
    path = parse_path(d)
    runs = []
    for sub in path.continuous_subpaths():
        pts = []
        for seg in sub:
            n = max(2, int(math.ceil(seg.length() / STEP)))
            for i in range(n):
                p = seg.point(i / n)
                pts.append((p.real, p.imag))
        end = sub[-1].point(1.0)
        pts.append((end.real, end.imag))
        runs.append(pts)
    return runs


def glyph_outline(name):
    root = ET.parse(LUCIDE + name + '.svg').getroot()
    shapes = []
    for el in root.iter():
        d = element_to_d(el)
        if not d:
            continue
        for pts in sample(d):
            if len(pts) < 2:
                continue
            shapes.append(LineString(pts).buffer(STROKE / 2, quad_segs=48, cap_style='round', join_style='round'))
    shape = unary_union(shapes).simplify(TOL, preserve_topology=True)
    return shape


def ring_to_d(coords):
    parts = []
    for i, (x, y) in enumerate(coords[:-1]):
        parts.append(('M' if i == 0 else 'L') + f'{x:.2f} {y:.2f}')
    return ' '.join(parts) + ' Z'


def shape_to_d(shape):
    polys = shape.geoms if isinstance(shape, MultiPolygon) else [shape]
    d = []
    for poly in polys:
        d.append(ring_to_d(list(poly.exterior.coords)))
        for ring in poly.interiors:
            d.append(ring_to_d(list(ring.coords)))
    return ' '.join(d)


def icon(uid, plate, d, size):
    c1, c2 = PLATES[plate]
    g1, g2 = GLYPH.get(plate, ('white', 'white'))
    g2_opacity = '' if plate in GLYPH else ' stop-opacity="0.6"'
    if size == 80:
        t, ts, s = '13.6 13.6', '13.6 14.6', '2.2'
    else:
        t, ts, s = '12 12', '12 13', '2'
    return f'''<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="{size}" height="{size}" fill="url(#paint0_linear_{uid})"/>
<g transform="translate({t}) scale({s})">
<path fill-rule="evenodd" fill="url(#paint1_linear_{uid})" d="{d}"/>
</g>
<g transform="translate({ts}) scale({s})">
<path fill-rule="evenodd" fill="black" fill-opacity="0.1" d="{d}"/>
</g>
<defs>
<linearGradient id="paint0_linear_{uid}" x1="{size / 2:g}" y1="0" x2="{size / 2:g}" y2="{size}" gradientUnits="userSpaceOnUse">
<stop stop-color="{c1}"/>
<stop offset="1" stop-color="{c2}"/>
</linearGradient>
<linearGradient id="paint1_linear_{uid}" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
<stop stop-color="{g1}"/>
<stop offset="1" stop-color="{g2}"{g2_opacity}/>
</linearGradient>
</defs>
</svg>
'''


def art_icon(uid, src, skip, size=80):
    """White plate, the source artwork scaled to ART_WIDTH and centred, its united outline as the shadow."""
    from shapely.geometry import Polygon
    ns = '{http://www.w3.org/2000/svg}'
    root = ET.parse(src).getroot()
    # class fills from a <style> block become attributes, so the art survives being inlined next to other icons
    css = {}
    for st in root.iter(ns + 'style'):
        for cls, body in re.findall(r'\.([\w-]+)\s*\{([^}]*)\}', st.text or ''):
            css[cls] = dict(kv.split(':', 1) for kv in body.split(';') if ':' in kv)
    inner, polys = [], []
    for el in list(root):
        if el.tag in (ns + 'style', ns + 'defs') and el.tag == ns + 'style':
            continue
    defs = ''.join(ET.tostring(el, encoding='unicode') for el in root.iter(ns + 'defs'))
    xs, ys = [], []

    def walk(el):
        tag = el.tag.split('}')[-1]
        if tag in ('style', 'defs'):
            return
        if el.attrib.get('class') in skip or el.attrib.get('id') in skip:
            return
        d = element_to_d(el)
        if d:
            for cls in el.attrib.pop('class', '').split():
                for k, v in css.get(cls, {}).items():
                    el.set(k.strip(), v.strip())
            for pts in sample(d):
                if len(pts) > 2:
                    polys.append(Polygon(pts).buffer(0))
                    xs.extend(x for x, _ in pts)
                    ys.extend(y for _, y in pts)
            inner.append(ET.tostring(el, encoding='unicode'))
            return
        for c in el:
            walk(c)

    for el in list(root):
        walk(el)
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    s = ART_WIDTH / (x1 - x0)
    tx, ty = (size - (x1 - x0) * s) / 2 - x0 * s, (size - (y1 - y0) * s) / 2 - y0 * s
    shadow = shape_to_d(unary_union(polys).simplify(TOL / s, preserve_topology=True))
    body = ''.join(inner).replace('xmlns:ns0="http://www.w3.org/2000/svg"', '').replace('ns0:', '')
    c1, c2 = PLATES['white']
    return f'''<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="{size}" height="{size}" fill="url(#paint0_linear_{uid})"/>
<g transform="translate({tx:.3f} {ty:.3f}) scale({s:.5f})">
{body}
</g>
<g transform="translate({tx:.3f} {ty + 1:.3f}) scale({s:.5f})">
<path fill-rule="evenodd" fill="black" fill-opacity="0.1" d="{shadow}"/>
</g>
<defs>
<linearGradient id="paint0_linear_{uid}" x1="{size / 2:g}" y1="0" x2="{size / 2:g}" y2="{size}" gradientUnits="userSpaceOnUse">
<stop stop-color="{c1}"/>
<stop offset="1" stop-color="{c2}"/>
</linearGradient>
{defs}
</defs>
</svg>
'''


for rel, uid, plate, glyph, size in ICONS:
    shape = glyph_outline(glyph)
    d = shape_to_d(shape)
    n = 1 if isinstance(shape, Polygon) else len(shape.geoms)
    with open(ROOT + '/' + rel, 'w') as fh:
        fh.write(icon(uid, plate, d, size))
    print(f'{rel}: {glyph} -> {n} outline(s), {len(d)} chars')

for rel, uid, src, skip in ART:
    with open(ROOT + '/' + rel, 'w') as fh:
        fh.write(art_icon(uid, src, skip))
    print(f'{rel}: art from {src}')
