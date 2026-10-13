"""
Gera as ilustrações dos produtos da GamerZone em frontend/public/products/.

Todas as imagens são desenhos vetoriais (SVG) feitos para o projeto: não usam
fotos de marcas reais e funcionam offline. Para regenerar:

    python3 frontend/scripts/gerar_ilustracoes.py

Cada produto do seed usa a imagem /products/<slug>.svg.
"""
import math
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'products')
W, H = 800, 600
RGB = ['#ff3b6b', '#ffb13b', '#ffe23b', '#3bff8f', '#3bd1ff', '#7a5bff', '#ff3bd4']


# ─── utilitários ──────────────────────────────────────────────────────────
def lin(id_, stops, x1=0, y1=0, x2=0, y2=1, units=''):
    u = f' gradientUnits="{units}"' if units else ''
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"{"" if op is None else f" stop-opacity=\"{op}\""}/>'
                for o, c, op in [(st + (None,))[:3] for st in stops])
    return f'<linearGradient id="{id_}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"{u}>{s}</linearGradient>'


def rad(id_, stops, cx=0.5, cy=0.5, r=0.5):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{op}"/>' for o, c, op in stops)
    return f'<radialGradient id="{id_}" cx="{cx}" cy="{cy}" r="{r}">{s}</radialGradient>'


def rainbow(id_, x1, x2, y=0):
    n = len(RGB) - 1
    stops = [(f'{i / n:.3f}', c) for i, c in enumerate(RGB)]
    return lin(id_, stops, x1, y, x2, y, 'userSpaceOnUse')


def frame(accent, body, defs='', floor_y=470, glow_y=300):
    """Palco comum: fundo escuro, brilho na cor do produto, grade em perspectiva e sombra."""
    grid = []
    for i in range(-10, 11):
        x = 400 + i * 90
        grid.append(f'<line x1="400" y1="{floor_y - 110}" x2="{x}" y2="{H + 40}"/>')
    for k in range(1, 7):
        y = floor_y - 110 + (k ** 1.7) * 9
        grid.append(f'<line x1="0" y1="{y:.1f}" x2="{W}" y2="{y:.1f}"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<defs>
{lin('bg', [(0, '#1f1950'), (1, '#120e2e')])}
{rad('halo', [(0, accent, .55), (.55, accent, .12), (1, accent, 0)])}
{lin('fade', [(0, '#ffffff', 0), (.45, '#ffffff', .9), (1, '#ffffff', 1)])}
<mask id="floorMask"><rect width="{W}" height="{H}" fill="url(#fade)"/></mask>
<filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="blur18" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
<filter id="blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
{defs}
</defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/>
<g stroke="{accent}" stroke-opacity=".16" stroke-width="1.2" mask="url(#floorMask)">{''.join(grid)}</g>
<ellipse cx="400" cy="{glow_y}" rx="330" ry="250" fill="url(#halo)"/>
<ellipse cx="400" cy="{floor_y}" rx="250" ry="26" fill="#000" opacity=".45" filter="url(#blur18)"/>
{body}
</svg>'''


def write(slug, svg):
    with open(os.path.join(OUT, f'{slug}.svg'), 'w', encoding='utf-8') as f:
        f.write(svg)


# ─── teclado ──────────────────────────────────────────────────────────────
def keyboard(accent, compact=False):
    cols, rows = (15, 5) if compact else (21, 6)
    k, gap = 30, 6
    w = cols * (k + gap) + 34
    h = rows * (k + gap) + 34
    keys = []
    wasd = {(2, 1), (3, 0), (3, 1), (3, 2)} if not compact else {(2, 1), (3, 0), (3, 1), (3, 2)}
    for r in range(rows):
        for c in range(cols):
            if not compact and c in (15, 16) and r in (1, 2):  # vão do bloco de navegação
                pass
            if not compact and c == 14 and r != 0:
                continue  # separação visual entre principal e numérico
            x = -w / 2 + 17 + c * (k + gap)
            y = -h / 2 + 17 + r * (k + gap)
            kw = k
            if r == rows - 1 and c == (6 if compact else 5):
                kw = k * 5 + gap * 4  # barra de espaço
            if r == rows - 1 and ((compact and 6 < c < 11) or (not compact and 5 < c < 10)):
                continue
            hl = (r, c - (0 if compact else 0)) in {(rr, cc + 1) for rr, cc in wasd}
            fill = 'url(#keyHi)' if hl else 'url(#key)'
            keys.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{kw}" height="{k}" rx="5" fill="{fill}" '
                        f'stroke="url(#rgbk)" stroke-width="1.6"/>')
            keys.append(f'<rect x="{x + 4:.1f}" y="{y + 3:.1f}" width="{kw - 8}" height="{k - 12}" rx="3" fill="#fff" opacity=".07"/>')
    sc = 1 if compact else .8
    t = f'translate(400 285) scale({sc} {.6 * sc:.2f}) rotate(-13)'
    body = f'''
<g transform="translate(0 32)"><g transform="{t}">
  <rect x="{-w / 2 - 14}" y="{-h / 2 - 14}" width="{w + 28}" height="{h + 28}" rx="26" fill="url(#rgbk)" opacity=".85" filter="url(#blur18)"/>
</g></g>
<g transform="translate(0 26)"><g transform="{t}">
  <rect x="{-w / 2}" y="{-h / 2}" width="{w}" height="{h}" rx="18" fill="#0d0b22"/>
</g></g>
<g transform="{t}">
  <rect x="{-w / 2}" y="{-h / 2}" width="{w}" height="{h}" rx="18" fill="url(#case)"/>
  <rect x="{-w / 2 + 6}" y="{-h / 2 + 6}" width="{w - 12}" height="{h - 12}" rx="14" fill="#100d26"/>
  {''.join(keys)}
</g>'''
    defs = (lin('case', [(0, '#5b5784'), (1, '#24204a')]) + lin('key', [(0, '#3a3566'), (1, '#1a1638')]) +
            lin('keyHi', [(0, accent), (1, '#7a5b10' if accent == '#ffd23f' else '#1a1638')]) +
            rainbow('rgbk', -w / 2, w / 2))
    return frame(accent, body, defs)


# ─── mouse ────────────────────────────────────────────────────────────────
MOUSE = ('M0,-160 C70,-160 95,-110 98,-40 C102,40 95,120 60,145 C30,165 -30,165 -60,145 '
         'C-95,120 -102,40 -98,-40 C-95,-110 -70,-160 0,-160 Z')


def mouse(accent, wireless=False):
    cable = '' if wireless else (
        f'<path d="M400,118 C392,60 470,40 520,10 S640,-30 700,-20" fill="none" stroke="#2a2550" stroke-width="9" stroke-linecap="round"/>'
        f'<path d="M400,118 C392,60 470,40 520,10 S640,-30 700,-20" fill="none" stroke="#4a4580" stroke-width="3" stroke-linecap="round" opacity=".7"/>')
    body = f'''{cable}
<g transform="translate(400 300) rotate(-16)">
  <path d="{MOUSE}" transform="translate(10 18)" fill="#000" opacity=".5" filter="url(#blur8)"/>
  <path d="{MOUSE}" fill="none" stroke="{accent}" stroke-width="14" opacity=".75" filter="url(#blur18)"/>
  <path d="{MOUSE}" fill="url(#shell)"/>
  <path d="{MOUSE}" fill="none" stroke="{accent}" stroke-width="3.5"/>
  <path d="M-97,-48 Q0,-22 97,-48" fill="none" stroke="#0c0a1f" stroke-width="4"/>
  <path d="M0,-160 L0,-58" stroke="#0c0a1f" stroke-width="4"/>
  <rect x="-10" y="-138" width="20" height="50" rx="10" fill="#0c0a1f"/>
  <rect x="-6" y="-133" width="12" height="40" rx="6" fill="{accent}"/>
  <path d="M-97,-20 C-112,20 -110,70 -94,105" fill="none" stroke="#0c0a1f" stroke-width="10" stroke-linecap="round" opacity=".6"/>
  <path d="M0,50 l26,45 h-52 z" fill="{accent}" opacity=".95"/>
  <path d="M0,50 l26,45 h-52 z" fill="{accent}" filter="url(#blur8)"/>
  <ellipse cx="-34" cy="-90" rx="22" ry="48" fill="#fff" opacity=".13"/>
  <path d="M-60,145 C-30,165 30,165 60,145" fill="none" stroke="{accent}" stroke-width="6" filter="url(#blur3)"/>
</g>'''
    defs = lin('shell', [(0, '#4a4677'), (.55, '#26224f'), (1, '#141130')], 0, 0, 1, 1)
    return frame(accent, body, defs)


# ─── headset ──────────────────────────────────────────────────────────────
def headset(accent, wireless=False):
    mic = '' if wireless else (
        f'<path d="M235,420 C220,470 260,505 330,500" fill="none" stroke="#1a1638" stroke-width="12" stroke-linecap="round"/>'
        f'<circle cx="338" cy="500" r="14" fill="#1a1638"/><circle cx="338" cy="500" r="7" fill="{accent}"/>'
        f'<circle cx="338" cy="500" r="12" fill="{accent}" filter="url(#blur8)" opacity=".7"/>')
    stripe = (f'<path d="M290,175 C350,135 450,135 510,175" fill="none" stroke="{accent}" stroke-width="5" stroke-linecap="round"/>'
              if wireless else '')
    cups = ''
    for cx, inner in ((240, 1), (560, -1)):
        cups += f'''
  <rect x="{cx - 16}" y="232" width="32" height="70" rx="10" fill="#2b2756"/>
  <ellipse cx="{cx}" cy="365" rx="78" ry="104" fill="{accent}" opacity=".6" filter="url(#blur18)"/>
  <ellipse cx="{cx}" cy="365" rx="70" ry="96" fill="url(#cup)"/>
  <ellipse cx="{cx}" cy="365" rx="70" ry="96" fill="none" stroke="{accent}" stroke-width="5"/>
  <ellipse cx="{cx - 4 * inner}" cy="365" rx="46" ry="68" fill="#120f2b"/>
  <ellipse cx="{cx - 4 * inner}" cy="365" rx="46" ry="68" fill="none" stroke="#3b3570" stroke-width="2"/>
  <ellipse cx="{cx + 22 * inner}" cy="330" rx="12" ry="30" fill="#fff" opacity=".12"/>'''
    body = f'''
<path d="M235,300 C235,110 565,110 565,300" fill="none" stroke="#0e0b24" stroke-width="44" stroke-linecap="round" transform="translate(0 8)" opacity=".6"/>
<path d="M235,300 C235,110 565,110 565,300" fill="none" stroke="url(#band)" stroke-width="40" stroke-linecap="round"/>
<path d="M250,290 C250,135 550,135 550,290" fill="none" stroke="#151230" stroke-width="12" stroke-linecap="round"/>
{stripe}
{cups}
{mic}'''
    defs = lin('band', [(0, '#57528a'), (1, '#211d47')]) + lin('cup', [(0, '#4a4579'), (1, '#16132f')], 0, 0, 1, 1)
    return frame(accent, body, defs)


# ─── controle ─────────────────────────────────────────────────────────────
PAD = ('M300,230 C340,215 460,215 500,230 C560,235 600,260 615,330 C630,400 640,470 590,480 '
       'C550,488 530,440 505,410 C480,395 320,395 295,410 C270,440 250,488 210,480 '
       'C160,470 170,400 185,330 C200,260 240,235 300,230 Z')


def controller(accent):
    def stick(cx, cy):
        return (f'<circle cx="{cx}" cy="{cy}" r="34" fill="#141130"/>'
                f'<circle cx="{cx}" cy="{cy}" r="25" fill="url(#stick)"/>'
                f'<circle cx="{cx}" cy="{cy}" r="17" fill="none" stroke="#0c0a1f" stroke-width="2" opacity=".5"/>')
    btn = [(520, 300, '#3bd1ff'), (548, 328, '#ff4f6d'), (492, 328, '#ffd23f'), (520, 356, '#3ddc97')]
    buttons = ''.join(f'<circle cx="{x}" cy="{y}" r="15" fill="#1a1638"/><circle cx="{x}" cy="{y}" r="11" fill="{c}"/>'
                      for x, y, c in btn)
    body = f'''
<g transform="translate(0 6) rotate(-6 400 340)">
  <path d="{PAD}" transform="translate(6 16)" fill="#000" opacity=".45" filter="url(#blur8)"/>
  <path d="{PAD}" fill="url(#pad)"/>
  <path d="{PAD}" fill="none" stroke="#ffffff" stroke-opacity=".25" stroke-width="2"/>
  <path d="M345,238 C380,228 420,228 455,238" fill="none" stroke="{accent}" stroke-width="8" stroke-linecap="round"/>
  <path d="M345,238 C380,228 420,228 455,238" fill="none" stroke="{accent}" stroke-width="14" stroke-linecap="round" filter="url(#blur8)"/>
  {stick(290, 315)}
  {stick(450, 385)}
  <g fill="#1a1638">
    <rect x="335" y="352" width="24" height="70" rx="5"/><rect x="312" y="375" width="70" height="24" rx="5"/>
  </g>
  {buttons}
  <rect x="370" y="290" width="22" height="10" rx="5" fill="#1a1638"/><rect x="408" y="290" width="22" height="10" rx="5" fill="#1a1638"/>
  <circle cx="400" cy="335" r="13" fill="#1a1638"/><circle cx="400" cy="335" r="7" fill="{accent}"/>
  <ellipse cx="260" cy="270" rx="40" ry="14" fill="#fff" opacity=".25" transform="rotate(-20 260 270)"/>
</g>'''
    defs = (lin('pad', [(0, '#f1efff'), (.6, '#c9c4ea'), (1, '#8f89bd')], 0, 0, 0, 1) +
            lin('stick', [(0, '#4a4677'), (1, '#1a1638')]))
    return frame(accent, body, defs)


# ─── monitor ──────────────────────────────────────────────────────────────
def monitor(accent, wide=False):
    sw, sh = (660, 270) if wide else (540, 310)
    x0, y0 = 400 - sw / 2, 70
    bend = 26 if wide else 0
    screen = (f'M{x0},{y0} Q400,{y0 + bend} {x0 + sw},{y0} L{x0 + sw},{y0 + sh} Q400,{y0 + sh + bend} {x0},{y0 + sh} Z')
    inner = (f'M{x0 + 12},{y0 + 12} Q400,{y0 + 12 + bend} {x0 + sw - 12},{y0 + 12} L{x0 + sw - 12},{y0 + sh - 12} '
             f'Q400,{y0 + sh - 12 + bend} {x0 + 12},{y0 + sh - 12} Z')
    # cena synthwave dentro da tela
    hy = y0 + sh * 0.62 + bend / 2
    lines = ''.join(f'<line x1="400" y1="{hy}" x2="{400 + i * 70}" y2="{y0 + sh + 40}"/>' for i in range(-10, 11))
    hl = ''.join(f'<line x1="{x0}" y1="{hy + (j ** 1.8) * 6:.1f}" x2="{x0 + sw}" y2="{hy + (j ** 1.8) * 6:.1f}"/>' for j in range(1, 8))
    sun_r = sh * 0.3
    stripes = ''.join(f'<rect x="{400 - sun_r}" y="{hy - sun_r * 0.55 + i * 11}" width="{sun_r * 2}" height="{2 + i}" fill="#2a0f4f"/>' for i in range(6))
    mountains = (f'<path d="M{x0},{hy} L{x0 + sw * .12},{hy - 50} L{x0 + sw * .2},{hy - 22} L{x0 + sw * .3},{hy - 70} '
                 f'L{x0 + sw * .42},{hy} Z M{x0 + sw * .6},{hy} L{x0 + sw * .72},{hy - 64} L{x0 + sw * .8},{hy - 30} '
                 f'L{x0 + sw * .9},{hy - 58} L{x0 + sw},{hy} Z" fill="#1a0b38"/>')
    body = f'''
<path d="{screen}" fill="{accent}" opacity=".45" filter="url(#blur18)"/>
<rect x="{400 - 22}" y="{y0 + sh}" width="44" height="{470 - y0 - sh - 8}" fill="url(#neck)"/>
<path d="M{400 - 120},472 L{400 + 120},472 L{400 + 95},450 L{400 - 95},450 Z" fill="url(#neck)"/>
<path d="{screen}" fill="#0d0b22"/>
<clipPath id="scr"><path d="{inner}"/></clipPath>
<g clip-path="url(#scr)">
  <rect x="{x0}" y="{y0}" width="{sw}" height="{sh + bend}" fill="url(#sky)"/>
  <circle cx="400" cy="{hy - sun_r * 0.2}" r="{sun_r}" fill="url(#sun)"/>
  {stripes}
  {mountains}
  <rect x="{x0}" y="{hy}" width="{sw}" height="{sh}" fill="#12062a"/>
  <g stroke="{accent}" stroke-width="2" opacity=".9">{lines}{hl}</g>
  <path d="M{x0},{y0} L{x0 + sw * .45},{y0} L{x0 + sw * .25},{y0 + sh} L{x0},{y0 + sh} Z" fill="#fff" opacity=".05"/>
</g>
<path d="{screen}" fill="none" stroke="#3a3570" stroke-width="2"/>
<rect x="{400 - 18}" y="{y0 + sh + 2 + bend}" width="36" height="4" rx="2" fill="{accent}"/>'''
    defs = (lin('sky', [(0, '#160a3a'), (.6, '#5b1a7a'), (1, '#ff4fa0')]) +
            lin('sun', [(0, '#ffe23b'), (1, '#ff3b8a')]) + lin('neck', [(0, '#3a3566'), (1, '#16132f')]))
    return frame(accent, body, defs, glow_y=230)


# ─── SSD ──────────────────────────────────────────────────────────────────
def ssd(accent):
    pins = ''.join(f'<rect x="{-262 + i * 6.2:.1f}" y="-32" width="3.6" height="64" rx="1" fill="url(#gold)"/>'
                   if not 7 <= i <= 8 else '' for i in range(0, 11))
    fins = ''.join(f'<rect x="{-130 + i * 26}" y="-58" width="12" height="116" rx="4" fill="url(#fin)"/>' for i in range(13))
    body = f'''
<g transform="translate(400 300) rotate(-12)">
  <rect x="-270" y="-62" width="540" height="124" rx="10" fill="#000" opacity=".5" transform="translate(10 22)" filter="url(#blur8)"/>
  <rect x="-270" y="-62" width="540" height="124" rx="10" fill="url(#pcb)"/>
  {pins}
  <circle cx="262" cy="0" r="14" fill="#0b2a1e"/><circle cx="262" cy="0" r="8" fill="url(#gold)"/>
  <rect x="-205" y="-46" width="70" height="92" rx="4" fill="#0e0d1c"/>
  <rect x="-140" y="-66" width="380" height="132" rx="12" fill="{accent}" opacity=".35" filter="url(#blur18)"/>
  <rect x="-140" y="-66" width="380" height="132" rx="12" fill="url(#sink)"/>
  {fins}
  <rect x="-140" y="-66" width="380" height="132" rx="12" fill="none" stroke="{accent}" stroke-width="3"/>
  <rect x="-20" y="-20" width="160" height="40" rx="6" fill="#0d0b22"/>
  <text x="60" y="7" text-anchor="middle" font-family="Chakra Petch, Arial, sans-serif" font-weight="700" font-size="20" fill="{accent}">LIGHTSPEED</text>
</g>'''
    defs = (lin('pcb', [(0, '#1a4f3a'), (1, '#0b2a1e')]) + lin('gold', [(0, '#ffe08a'), (1, '#c9952b')]) +
            lin('sink', [(0, '#4a4677'), (1, '#1a1638')]) + lin('fin', [(0, '#5f5a92'), (1, '#2a2552')]))
    return frame(accent, body, defs)


# ─── placa de vídeo ───────────────────────────────────────────────────────
def gpu(accent):
    def fan(cx):
        blades = ''.join(
            f'<path d="M0,0 C12,-20 34,-40 52,-30 C40,-18 22,-4 0,0 Z" fill="#2f2a5c" transform="rotate({i * 40})"/>'
            for i in range(9))
        return (f'<g transform="translate({cx} 300)"><circle r="66" fill="#0c0a1f"/>'
                f'<circle r="62" fill="none" stroke="{accent}" stroke-width="3" opacity=".9"/>'
                f'<circle r="66" fill="none" stroke="{accent}" stroke-width="8" filter="url(#blur8)" opacity=".7"/>'
                f'{blades}<circle r="18" fill="url(#hub)"/><circle r="7" fill="{accent}"/></g>')
    body = f'''
<g transform="rotate(-5 400 300)">
  <rect x="100" y="190" width="600" height="220" rx="18" fill="#000" opacity=".5" transform="translate(10 20)" filter="url(#blur8)"/>
  <rect x="80" y="176" width="22" height="248" rx="3" fill="url(#bracket)"/>
  <g fill="#1a1638">{''.join(f'<rect x="86" y="{196 + i * 22}" width="10" height="14" rx="2"/>' for i in range(9))}</g>
  <rect x="100" y="182" width="600" height="236" rx="18" fill="#3a3566"/>
  <rect x="100" y="190" width="600" height="220" rx="18" fill="url(#shroud)"/>
  <path d="M100,250 L170,190 M700,350 L630,410" stroke="{accent}" stroke-width="4"/>
  <rect x="104" y="184" width="592" height="6" rx="3" fill="{accent}"/>
  <rect x="104" y="180" width="592" height="10" rx="5" fill="{accent}" filter="url(#blur8)"/>
  {fan(225)}{fan(400)}{fan(575)}
  <g fill="url(#gold)">{''.join(f'<rect x="{160 + i * 9}" y="410" width="6" height="18" rx="1"/>' for i in range(22))}</g>
  <text x="600" y="398" text-anchor="end" font-family="Chakra Petch, Arial, sans-serif" font-weight="700" font-size="18" fill="#8f89bd">TITANFORGE</text>
</g>'''
    defs = (lin('shroud', [(0, '#2a2552'), (1, '#120f2b')]) + lin('bracket', [(0, '#d9d6ee'), (1, '#7d78a8')], 0, 0, 1, 0) +
            rad('hub', [(0, '#5f5a92', 1), (1, '#1a1638', 1)]) + lin('gold', [(0, '#ffe08a'), (1, '#c9952b')]))
    return frame(accent, body, defs)


# ─── memória RAM ──────────────────────────────────────────────────────────
def ram(accent):
    def stick(dx, dy):
        cut = ''.join(f'<path d="M{-180 + i * 70},-28 l40,56" stroke="#5a5590" stroke-width="3" opacity=".6"/>' for i in range(6))
        pins = ''.join(f'<rect x="{-215 + i * 7.6:.1f}" y="40" width="4.6" height="16" fill="url(#gold)"/>'
                       for i in range(57) if i != 26)
        return f'''<g transform="translate({400 + dx} {300 + dy}) rotate(-8)">
  <rect x="-225" y="-62" width="450" height="22" rx="8" fill="url(#rgbr)" filter="url(#blur8)" opacity=".9"/>
  <rect x="-225" y="-60" width="450" height="20" rx="8" fill="url(#rgbr)"/>
  <rect x="-225" y="-42" width="450" height="84" rx="6" fill="url(#spread)"/>
  {cut}
  <rect x="-220" y="38" width="440" height="20" rx="2" fill="#0b2a1e"/>
  {pins}
  <text x="150" y="8" text-anchor="middle" font-family="Chakra Petch, Arial, sans-serif" font-weight="700" font-size="18" fill="#b3aee0">PULSE DDR5</text>
</g>'''
    body = stick(30, -55) + stick(-30, 75)
    defs = (rainbow('rgbr', -225, 225) + lin('spread', [(0, '#4a4579'), (1, '#16132f')]) +
            lin('gold', [(0, '#ffe08a'), (1, '#c9952b')]))
    return frame(accent, body, defs)


# ─── gabinete ─────────────────────────────────────────────────────────────
def pc_case(accent):
    def ring(cx, cy, r=38):
        return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#0d0b22"/>'
                f'<circle cx="{cx}" cy="{cy}" r="{r - 4}" fill="none" stroke="url(#rgbc)" stroke-width="6"/>'
                f'<circle cx="{cx}" cy="{cy}" r="{r - 4}" fill="none" stroke="url(#rgbc)" stroke-width="12" filter="url(#blur8)"/>'
                f'<circle cx="{cx}" cy="{cy}" r="9" fill="#2f2a5c"/>')
    body = f'''
<path d="M250,80 L330,60 L590,95 L590,500 L330,520 L250,495 Z" fill="#000" opacity=".4" transform="translate(12 14)" filter="url(#blur8)"/>
<path d="M250,80 L330,60 L330,520 L250,495 Z" fill="url(#front)"/>
<path d="M330,60 L590,95 L590,500 L330,520 Z" fill="#0a0820"/>
<path d="M350,90 L570,118 L570,480 L350,497 Z" fill="#14112e"/>
{ring(290, 170, 30)}{ring(290, 270, 30)}{ring(290, 370, 30)}
<path d="M380,300 L545,312 L545,350 L380,342 Z" fill="#2a2552"/>
<path d="M380,300 L545,312 L545,318 L380,306 Z" fill="{accent}"/>
<rect x="395" y="150" width="70" height="70" rx="6" fill="#1f1b45" transform="skewY(7)"/>
{ring(520, 200, 34)}
<path d="M330,60 L590,95 L590,500 L330,520 Z" fill="url(#glass)"/>
<path d="M330,60 L590,95 L590,500 L330,520 Z" fill="none" stroke="#4a4580" stroke-width="3"/>
<path d="M250,80 L330,60 L590,95 L510,112 Z" fill="#2a2552"/>
<path d="M250,80 L330,60 L330,520 L250,495 Z" fill="none" stroke="#4a4580" stroke-width="2"/>'''
    defs = (rainbow('rgbc', 0, 800) + lin('front', [(0, '#2a2552'), (1, '#16132f')], 0, 0, 1, 0) +
            lin('glass', [(0, '#ffffff', .18), (.4, '#ffffff', .02), (1, '#ffffff', .08)], 0, 0, 1, 1))
    return frame(accent, body, defs, floor_y=505)


# ─── cadeira ──────────────────────────────────────────────────────────────
def chair(accent):
    legs = ''.join(
        f'<g transform="rotate({a} 400 470)"><rect x="396" y="470" width="8" height="0"/>'
        f'<path d="M400,470 L400,470" /></g>' for a in range(0))
    base = ''
    for a in (-90, -18, 54, 126, 198):
        x = 400 + 150 * math.cos(math.radians(a)) * 1.0
        y = 500 + 40 * math.sin(math.radians(a))
        base += (f'<path d="M400,498 L{x:.1f},{y:.1f}" stroke="url(#metal)" stroke-width="16" stroke-linecap="round"/>'
                 f'<circle cx="{x:.1f}" cy="{y + 14:.1f}" r="12" fill="#0d0b22"/>')
    body = f'''
{base}
<rect x="388" y="400" width="24" height="100" rx="6" fill="url(#metal)"/>
<path d="M265,300 L245,250 M535,300 L555,250" stroke="#1a1638" stroke-width="18" stroke-linecap="round"/>
<path d="M300,60 C300,30 500,30 500,60 L520,300 C520,330 280,330 280,300 Z" fill="{accent}" opacity=".4" filter="url(#blur18)"/>
<path d="M300,60 C300,30 500,30 500,60 L520,300 C520,330 280,330 280,300 Z" fill="url(#back)"/>
<path d="M300,60 C300,30 330,28 345,30 L340,310 C320,312 290,310 282,300 Z" fill="{accent}"/>
<path d="M500,60 C500,30 470,28 455,30 L460,310 C480,312 510,310 518,300 Z" fill="{accent}"/>
<rect x="352" y="70" width="96" height="44" rx="20" fill="#14112e"/>
<rect x="345" y="210" width="110" height="46" rx="20" fill="#14112e"/>
<path d="M360,150 L440,150 M360,170 L440,170" stroke="#3a3570" stroke-width="3"/>
<path d="M270,330 C270,305 530,305 530,330 L520,400 C520,420 280,420 280,400 Z" fill="url(#seat)"/>
<path d="M300,325 L500,325" stroke="{accent}" stroke-width="4" stroke-linecap="round"/>
<rect x="215" y="270" width="80" height="22" rx="10" fill="#1a1638"/>
<rect x="505" y="270" width="80" height="22" rx="10" fill="#1a1638"/>
<path d="M250,292 L262,345 M550,292 L538,345" stroke="#1a1638" stroke-width="16" stroke-linecap="round"/>
<ellipse cx="370" cy="110" rx="22" ry="70" fill="#fff" opacity=".07"/>'''
    defs = (lin('back', [(0, '#3a3566'), (1, '#16132f')]) + lin('seat', [(0, '#3a3566'), (1, '#1a1638')]) +
            lin('metal', [(0, '#b9b5d6'), (1, '#5f5a92')], 0, 0, 1, 0))
    return frame(accent, body + legs, defs, floor_y=520, glow_y=240)


# ─── mousepad ─────────────────────────────────────────────────────────────
def mousepad(accent, glow=False):
    pad = 'M150,300 L560,220 L700,330 L270,430 Z'
    texture = ''.join(f'<path d="M{150 + i * 30.0},{300 - i * 5.85} L{270 + i * 30.0},{430 - i * 7.3}" />' for i in range(1, 14))
    edge = (f'<path d="{pad}" fill="none" stroke="url(#rgbm)" stroke-width="16" filter="url(#blur18)"/>'
            f'<path d="{pad}" fill="none" stroke="url(#rgbm)" stroke-width="6" stroke-linejoin="round"/>') if glow else \
        f'<path d="{pad}" fill="none" stroke="{accent}" stroke-width="4" stroke-linejoin="round"/>'
    body = f'''
<path d="{pad}" fill="#000" opacity=".5" transform="translate(6 16)" filter="url(#blur8)"/>
<path d="{pad}" fill="#0b0920" transform="translate(0 8)"/>
<path d="{pad}" fill="url(#cloth)"/>
<g stroke="{accent}" stroke-opacity=".14" stroke-width="2">{texture}</g>
{edge}
<text x="0" y="0" transform="translate(560 362) rotate(-13) skewX(-30)" font-family="Chakra Petch, Arial, sans-serif" font-weight="700" font-size="30" fill="{accent}" opacity=".85">GRID</text>
<g transform="translate(330 250) rotate(-16) scale(.42)">
  <path d="{MOUSE}" fill="#000" opacity=".5" transform="translate(10 18)" filter="url(#blur8)"/>
  <path d="{MOUSE}" fill="url(#mshell)"/>
  <path d="M-97,-48 Q0,-22 97,-48 M0,-160 L0,-58" fill="none" stroke="#0c0a1f" stroke-width="5"/>
</g>'''
    defs = (lin('cloth', [(0, '#2a2552'), (1, '#16132f')], 0, 0, 1, 1) + rainbow('rgbm', 150, 700) +
            lin('mshell', [(0, '#4a4677'), (1, '#141130')], 0, 0, 1, 1))
    return frame(accent, body, defs, floor_y=440)


# ─── suporte de headset ───────────────────────────────────────────────────
def stand(accent):
    body = f'''
<ellipse cx="400" cy="465" rx="140" ry="34" fill="url(#rgbs)" filter="url(#blur18)" opacity=".9"/>
<ellipse cx="400" cy="460" rx="130" ry="30" fill="#14112e"/>
<ellipse cx="400" cy="452" rx="130" ry="30" fill="url(#base)"/>
<ellipse cx="400" cy="452" rx="130" ry="30" fill="none" stroke="url(#rgbs)" stroke-width="4"/>
<rect x="388" y="150" width="24" height="300" rx="8" fill="url(#pole)"/>
<path d="M330,160 C330,120 470,120 470,160" fill="none" stroke="url(#pole)" stroke-width="22" stroke-linecap="round"/>
<g transform="translate(400 200) scale(.62) translate(-400 -170)">
  <path d="M250,300 C250,120 550,120 550,300" fill="none" stroke="#2b2756" stroke-width="34" stroke-linecap="round"/>
  <ellipse cx="250" cy="360" rx="62" ry="86" fill="#1f1b45"/><ellipse cx="250" cy="360" rx="62" ry="86" fill="none" stroke="{accent}" stroke-width="5"/>
  <ellipse cx="550" cy="360" rx="62" ry="86" fill="#1f1b45"/><ellipse cx="550" cy="360" rx="62" ry="86" fill="none" stroke="{accent}" stroke-width="5"/>
</g>
<rect x="360" y="440" width="18" height="8" rx="2" fill="#0d0b22"/><rect x="384" y="440" width="18" height="8" rx="2" fill="#0d0b22"/>'''
    defs = rainbow('rgbs', 270, 530) + lin('base', [(0, '#3a3566'), (1, '#1a1638')]) + \
        lin('pole', [(0, '#c9c4ea'), (1, '#5f5a92')], 0, 0, 1, 0)
    return frame(accent, body, defs, floor_y=480)


# ─── capa de jogo ─────────────────────────────────────────────────────────
def game(accent, theme, title):
    cx, cy, bw, bh = 400, 290, 270, 360
    x0, y0 = cx - bw / 2, cy - bh / 2
    if theme == 'castle':
        art = f'''<rect x="{x0}" y="{y0}" width="{bw}" height="{bh}" fill="url(#sky)"/>
<circle cx="{x0 + 190}" cy="{y0 + 80}" r="34" fill="#f3efff"/>
<path d="M{x0},{y0 + 290} L{x0 + 40},{y0 + 290} L{x0 + 40},{y0 + 200} L{x0 + 55},{y0 + 185} L{x0 + 70},{y0 + 200} L{x0 + 70},{y0 + 240}
 L{x0 + 110},{y0 + 240} L{x0 + 110},{y0 + 150} L{x0 + 128},{y0 + 125} L{x0 + 146},{y0 + 150} L{x0 + 146},{y0 + 240} L{x0 + 190},{y0 + 240}
 L{x0 + 190},{y0 + 190} L{x0 + 205},{y0 + 175} L{x0 + 220},{y0 + 190} L{x0 + 220},{y0 + 290} L{x0 + bw},{y0 + 290} L{x0 + bw},{y0 + bh} L{x0},{y0 + bh} Z" fill="#0b0720"/>
<path d="M{x0 + 60},{y0 + 110} c20,-30 50,-20 60,-5 c10,-12 30,-14 40,-4 c-14,2 -24,10 -28,22 c-10,-6 -30,-6 -38,6 c-6,-10 -20,-16 -34,-19 z" fill="#0b0720"/>
<circle cx="{x0 + 128}" cy="{y0 + 180}" r="5" fill="{accent}"/>'''
        defs = lin('sky', [(0, '#1b1060'), (.7, '#6a2f8a'), (1, '#e0688a')])
    elif theme == 'speed':
        streaks = ''.join(f'<rect x="{x0 - 20 + (i * 37) % 120}" y="{y0 + 40 + i * 22}" width="{120 + (i * 53) % 90}" height="3" fill="#fff" opacity=".35"/>' for i in range(11))
        art = f'''<rect x="{x0}" y="{y0}" width="{bw}" height="{bh}" fill="url(#sky)"/>
<circle cx="{x0 + bw / 2}" cy="{y0 + 160}" r="70" fill="#ffd23f" opacity=".9"/>
{streaks}
<path d="M{x0},{y0 + 215} L{x0 + bw},{y0 + 215} L{x0 + bw},{y0 + bh} L{x0},{y0 + bh} Z" fill="#2a0f2f"/>
<path d="M{x0 + 40},{y0 + 217} c10,-28 40,-40 90,-40 c30,0 60,14 80,30 l26,4 c10,2 12,14 4,18 l-200,0 c-8,0 -10,-8 0,-12 z" fill="#0b0720"/>
<circle cx="{x0 + 80}" cy="{y0 + 231}" r="14" fill="#0b0720" stroke="{accent}" stroke-width="3"/>
<circle cx="{x0 + 200}" cy="{y0 + 231}" r="14" fill="#0b0720" stroke="{accent}" stroke-width="3"/>'''
        defs = lin('sky', [(0, '#ff3b6b'), (.6, '#ff8a3b'), (1, '#ffd23f')])
    else:  # neon
        bld = ''.join(f'<rect x="{x0 + i * 30}" y="{y0 + 120 + ((i * 47) % 70)}" width="26" height="200" fill="#120a30" stroke="{["#ff3bd4", "#3bd1ff"][i % 2]}" stroke-width="2"/>' for i in range(9))
        road = ''.join(f'<line x1="{cx}" y1="{y0 + 250}" x2="{cx + i * 60}" y2="{y0 + bh}" />' for i in range(-5, 6))
        art = f'''<rect x="{x0}" y="{y0}" width="{bw}" height="{bh}" fill="url(#sky)"/>
{bld}
<rect x="{x0}" y="{y0 + 250}" width="{bw}" height="{bh - 250}" fill="#0b0620"/>
<g stroke="#ff3bd4" stroke-width="2">{road}</g>'''
        defs = lin('sky', [(0, '#0b0620'), (1, '#4a1a7a')])
    words = title.split('\n')
    text = ''.join(f'<text x="{cx}" y="{y0 + 300 + i * 30 + (0 if len(words) == 1 else -12)}" text-anchor="middle" '
                   f'font-family="Chakra Petch, Arial, sans-serif" font-weight="700" font-size="27" fill="#ffffff" '
                   f'stroke="#0b0720" stroke-width="5" paint-order="stroke">{w}</text>' for i, w in enumerate(words))
    body = f'''
<g transform="rotate(-6 {cx} {cy})">
  <rect x="{x0 + 8}" y="{y0 + 18}" width="{bw}" height="{bh}" rx="10" fill="#000" opacity=".5" filter="url(#blur8)"/>
  <path d="M{x0 + bw},{y0 + 6} l18,-10 l0,{bh} l-18,10 z" fill="#0d0b22"/>
  <path d="M{x0 + 4},{y0 + 6} l18,-10 l{bw - 4},0 l-18,10 z" fill="#2a2552"/>
  <rect x="{x0 - 6}" y="{y0 - 6}" width="{bw + 12}" height="{bh + 12}" rx="12" fill="{accent}" opacity=".45" filter="url(#blur18)"/>
  <clipPath id="cover"><rect x="{x0}" y="{y0}" width="{bw}" height="{bh}" rx="8"/></clipPath>
  <g clip-path="url(#cover)">{art}{text}
    <rect x="{x0}" y="{y0}" width="{bw}" height="26" fill="#0d0b22"/>
    <text x="{x0 + 12}" y="{y0 + 18}" font-family="Chakra Petch, Arial, sans-serif" font-weight="700" font-size="14" fill="{accent}">PC</text>
    <path d="M{x0},{y0} L{x0 + bw * .5},{y0} L{x0 + bw * .2},{y0 + bh} L{x0},{y0 + bh} Z" fill="#fff" opacity=".06"/>
  </g>
  <rect x="{x0}" y="{y0}" width="{bw}" height="{bh}" rx="8" fill="none" stroke="#3a3570" stroke-width="2"/>
</g>'''
    return frame(accent, body, defs)


# ─── estátua ──────────────────────────────────────────────────────────────
def statue(accent):
    body = f'''
<ellipse cx="400" cy="250" rx="150" ry="190" fill="{accent}" opacity=".35" filter="url(#blur18)"/>
<path d="M300,440 L500,440 L520,490 L280,490 Z" fill="url(#ped)"/>
<rect x="300" y="430" width="200" height="14" rx="3" fill="#2a2552"/>
<rect x="282" y="476" width="236" height="6" fill="{accent}"/>
<rect x="370" y="455" width="60" height="16" rx="2" fill="#c9952b"/>
<path d="M400,90 C440,90 462,122 462,160 C462,175 458,190 452,200 C500,230 520,300 528,430 L272,430 C280,300 300,230 348,200
 C342,190 338,175 338,160 C338,122 360,90 400,90 Z" fill="url(#cloak)"/>
<path d="M400,112 C428,112 444,138 444,165 C444,190 425,208 400,208 C375,208 356,190 356,165 C356,138 372,112 400,112 Z" fill="#06040f"/>
<ellipse cx="383" cy="168" rx="9" ry="5" fill="{accent}"/><ellipse cx="417" cy="168" rx="9" ry="5" fill="{accent}"/>
<ellipse cx="400" cy="168" rx="34" ry="12" fill="{accent}" filter="url(#blur8)" opacity=".8"/>
<path d="M540,120 L540,440" stroke="url(#staff)" stroke-width="10" stroke-linecap="round"/>
<circle cx="540" cy="112" r="22" fill="{accent}"/><circle cx="540" cy="112" r="40" fill="{accent}" filter="url(#blur18)"/>
<path d="M460,230 C500,240 520,260 538,280" stroke="#2a2152" stroke-width="26" stroke-linecap="round" fill="none"/>
<path d="M330,250 C310,300 300,360 290,430 M470,250 C490,300 500,360 510,430" stroke="#000" stroke-opacity=".25" stroke-width="5" fill="none"/>'''
    defs = (lin('cloak', [(0, '#3a2a7a'), (1, '#120a30')]) + lin('ped', [(0, '#2a2552'), (1, '#0d0b22')]) +
            lin('staff', [(0, '#c9c4ea'), (1, '#5f5a92')]))
    return frame(accent, body, defs, floor_y=495, glow_y=250)


# ─── action figure ────────────────────────────────────────────────────────
def figure(accent):
    body = f'''
<ellipse cx="400" cy="488" rx="110" ry="22" fill="#14112e"/>
<ellipse cx="400" cy="480" rx="110" ry="22" fill="url(#ped)"/>
<ellipse cx="400" cy="480" rx="110" ry="22" fill="none" stroke="{accent}" stroke-width="3"/>
<rect x="352" y="330" width="40" height="150" rx="16" fill="url(#suit)"/>
<rect x="408" y="330" width="40" height="150" rx="16" fill="url(#suit)"/>
<rect x="346" y="455" width="52" height="26" rx="10" fill="#2a2552"/><rect x="402" y="455" width="52" height="26" rx="10" fill="#2a2552"/>
<rect x="335" y="200" width="130" height="150" rx="40" fill="url(#suit)"/>
<rect x="365" y="230" width="70" height="60" rx="10" fill="#2a2552"/>
<rect x="378" y="242" width="16" height="10" rx="2" fill="{accent}"/><rect x="400" y="242" width="22" height="10" rx="2" fill="#3bd1ff"/>
<rect x="300" y="215" width="40" height="120" rx="18" fill="url(#suit)" transform="rotate(10 320 215)"/>
<rect x="460" y="215" width="40" height="120" rx="18" fill="url(#suit)" transform="rotate(-25 480 215)"/>
<rect x="508" y="300" width="70" height="22" rx="6" fill="#1a1638" transform="rotate(-25 480 215)"/>
<circle cx="400" cy="150" r="70" fill="url(#suit)"/>
<path d="M345,140 C345,110 455,110 455,140 L450,175 C440,195 360,195 350,175 Z" fill="url(#visor)"/>
<path d="M360,130 C380,120 400,120 420,126" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6" fill="none"/>
<circle cx="400" cy="150" r="70" fill="none" stroke="{accent}" stroke-width="3"/>'''
    defs = (lin('suit', [(0, '#f1efff'), (1, '#9893c4')], 0, 0, 1, 1) + lin('ped', [(0, '#3a3566'), (1, '#1a1638')]) +
            lin('visor', [(0, accent), (1, '#7a3b10')], 0, 0, 1, 1))
    return frame(accent, body, defs, floor_y=495, glow_y=260)


# ─── webcam ───────────────────────────────────────────────────────────────
def webcam(accent):
    body = f'''
<path d="M340,350 L460,350 L480,430 L320,430 Z" fill="url(#clip)"/>
<rect x="300" y="425" width="200" height="18" rx="6" fill="#1a1638"/>
<rect x="380" y="330" width="40" height="30" rx="6" fill="#2a2552"/>
<rect x="230" y="200" width="340" height="140" rx="70" fill="#000" opacity=".5" transform="translate(8 16)" filter="url(#blur8)"/>
<rect x="230" y="200" width="340" height="140" rx="70" fill="url(#body)"/>
<circle cx="400" cy="270" r="74" fill="{accent}" opacity=".7" filter="url(#blur18)"/>
<circle cx="400" cy="270" r="66" fill="#0d0b22"/>
<circle cx="400" cy="270" r="60" fill="none" stroke="{accent}" stroke-width="8"/>
<circle cx="400" cy="270" r="44" fill="url(#glass)"/>
<circle cx="400" cy="270" r="26" fill="#05030f"/>
<circle cx="400" cy="270" r="12" fill="#3b2a8a"/>
<circle cx="388" cy="256" r="8" fill="#fff" opacity=".6"/>
<circle cx="292" cy="270" r="6" fill="#0d0b22"/><circle cx="508" cy="270" r="6" fill="#0d0b22"/>
<circle cx="530" cy="240" r="4" fill="#3ddc97"/>
<ellipse cx="300" cy="225" rx="40" ry="10" fill="#fff" opacity=".12"/>'''
    defs = (lin('body', [(0, '#4a4677'), (1, '#16132f')]) + lin('clip', [(0, '#2a2552'), (1, '#120f2b')]) +
            rad('glass', [(0, '#5b4ad0', 1), (.7, '#1a1450', 1), (1, '#0d0b22', 1)]))
    return frame(accent, body, defs, floor_y=450)


# ─── microfone ────────────────────────────────────────────────────────────
def microphone(accent):
    mesh = ''.join(f'<line x1="345" y1="{110 + i * 12}" x2="455" y2="{110 + i * 12}"/>' for i in range(16))
    mesh += ''.join(f'<line x1="{350 + j * 12}" y1="95" x2="{350 + j * 12}" y2="300"/>' for j in range(9))
    body = f'''
<path d="M400,400 L330,480 M400,400 L470,480 M400,400 L400,485" stroke="url(#metal)" stroke-width="12" stroke-linecap="round"/>
<rect x="392" y="330" width="16" height="75" rx="6" fill="url(#metal)"/>
<ellipse cx="400" cy="230" rx="110" ry="34" fill="none" stroke="#2a2552" stroke-width="10"/>
<rect x="335" y="80" width="130" height="270" rx="65" fill="#000" opacity=".45" transform="translate(8 14)" filter="url(#blur8)"/>
<rect x="335" y="80" width="130" height="270" rx="65" fill="url(#bodym)"/>
<clipPath id="grille"><rect x="341" y="86" width="118" height="200" rx="59"/></clipPath>
<g clip-path="url(#grille)">
  <rect x="341" y="86" width="118" height="200" fill="#2a2552"/>
  <g stroke="#8f89bd" stroke-width="2.4" opacity=".75">{mesh}</g>
</g>
<rect x="335" y="282" width="130" height="10" fill="#14112e"/>
<circle cx="400" cy="318" r="14" fill="#0d0b22"/>
<circle cx="400" cy="318" r="8" fill="{accent}"/><circle cx="400" cy="318" r="18" fill="{accent}" filter="url(#blur8)" opacity=".8"/>
<path d="M290,230 C290,250 510,250 510,230" fill="none" stroke="#3a3570" stroke-width="10"/>
<path d="M300,236 L340,190 M500,236 L460,190 M300,236 L340,280 M500,236 L460,280" stroke="{accent}" stroke-width="2" opacity=".7"/>
<ellipse cx="370" cy="150" rx="12" ry="50" fill="#fff" opacity=".12"/>'''
    defs = (lin('bodym', [(0, '#4a4677'), (1, '#16132f')], 0, 0, 1, 0) +
            lin('metal', [(0, '#c9c4ea'), (1, '#5f5a92')], 0, 0, 1, 0))
    return frame(accent, body, defs, floor_y=490, glow_y=230)


# ─── catálogo: slug → ilustração ──────────────────────────────────────────
PRODUCTS = {
    'teclado-mecanico-rgb-nebula-k1': lambda: keyboard('#ffd23f'),
    'mouse-gamer-vortex-16000-dpi': lambda: mouse('#ff4f6d'),
    'headset-surround-abyss-7-1': lambda: headset('#a77bff'),
    'controle-sem-fio-pulse-x': lambda: controller('#3bd1ff'),
    'monitor-horizon-27-165hz': lambda: monitor('#ff4fd8'),
    'ssd-nvme-lightspeed-1tb': lambda: ssd('#3ddc97'),
    'placa-de-video-titanforge-8gb': lambda: gpu('#ff8a3b'),
    'cadeira-gamer-ergox': lambda: chair('#ff4f6d'),
    'mousepad-extended-grid-xl': lambda: mousepad('#7a5bff'),
    'suporte-de-headset-neon': lambda: stand('#ff4fd8'),
    'cronicas-de-arkhos-pc': lambda: game('#a77bff', 'castle', 'CRÔNICAS\nDE ARKHOS'),
    'velocity-rush-pc': lambda: game('#ff8a3b', 'speed', 'VELOCITY\nRUSH'),
    'estatua-guardiao-do-vazio-30cm': lambda: statue('#a77bff'),
    'action-figure-piloto-estelar': lambda: figure('#ffd23f'),
    'teclado-compacto-nebula-mini-60': lambda: keyboard('#3bd1ff', compact=True),
    'mouse-sem-fio-vortex-air': lambda: mouse('#3bd1ff', wireless=True),
    'headset-sem-fio-abyss-pro': lambda: headset('#3ddc97', wireless=True),
    'webcam-streamer-lumen-full-hd': lambda: webcam('#ffd23f'),
    'microfone-condensador-echo-usb': lambda: microphone('#ff4f6d'),
    'monitor-ultrawide-horizon-34-curvo': lambda: monitor('#3bd1ff', wide=True),
    'memoria-ram-pulse-rgb-32gb': lambda: ram('#a77bff'),
    'gabinete-prism-vidro-temperado': lambda: pc_case('#3bd1ff'),
    'mousepad-rgb-grid-glow': lambda: mousepad('#ff3bd4', glow=True),
    'neon-drift-arena-pc': lambda: game('#ff3bd4', 'neon', 'NEON DRIFT\nARENA'),
}

# ─── departamentos: composição de vários produtos numa cena ───────────────
COMMON_IDS = {'bg', 'halo', 'fade', 'floorMask', 'blur8', 'blur18', 'blur3'}


def parts(svg, prefix):
    """Separa as definições e o desenho de uma ilustração, renomeando os ids
    próprios do produto para não colidirem com os de outro produto na cena."""
    import re
    defs = svg.split('<defs>', 1)[1].split('</defs>', 1)[0]
    body = svg.split('filter="url(#blur18)"/>', 1)[1].rsplit('</svg>', 1)[0]  # depois da sombra do chão
    own = set(re.findall(r'id="([^"]+)"', defs + body)) - COMMON_IDS
    for i in own:
        defs = defs.replace(f'id="{i}"', f'id="{prefix}{i}"')
        defs = defs.replace(f'url(#{i})', f'url(#{prefix}{i})')
        body = body.replace(f'id="{i}"', f'id="{prefix}{i}"')
        body = body.replace(f'url(#{i})', f'url(#{prefix}{i})')
    for common in COMMON_IDS:  # filtros e gradientes comuns já existem no palco
        defs = re.sub(rf'<(linearGradient|radialGradient|filter|mask) id="{common}".*?</\1>', '', defs, flags=re.S)
    return defs, body


def scene(accent, items):
    """items: [(svg_do_produto, transform)] — do fundo para a frente."""
    all_defs, all_body = '', ''
    for n, (svg, transform) in enumerate(items):
        d, b = parts(svg, f'p{n}')
        all_defs += d
        all_body += f'<g transform="{transform}">{b}</g>'
    return frame(accent, all_body, all_defs, floor_y=500)


CATEGORIES = {
    'perifericos': lambda: scene('#ffd23f', [
        (headset('#a77bff'), 'translate(-30 -45) scale(.6)'),
        (keyboard('#ffd23f'), 'translate(90 90) scale(.76)'),
        (mouse('#ff4f6d'), 'translate(470 200) scale(.5)'),
    ]),
    'hardware': lambda: scene('#ff8a3b', [
        (monitor('#ff4fd8'), 'translate(230 10) scale(.6)'),
        (gpu('#ff8a3b'), 'translate(10 160) scale(.7)'),
        (ssd('#3ddc97'), 'translate(370 310) scale(.48)'),
    ]),
    'acessorios': lambda: scene('#ff4f6d', [
        (chair('#ff4f6d'), 'translate(-40 20) scale(.85)'),
        (stand('#ff4fd8'), 'translate(390 110) scale(.6)'),
        (mousepad('#ff3bd4', glow=True), 'translate(260 330) scale(.55)'),
    ]),
    'jogos': lambda: scene('#a77bff', [
        (game('#ff8a3b', 'speed', 'VELOCITY\nRUSH'), 'translate(-110 80) scale(.68) rotate(-10 400 300)'),
        (game('#ff3bd4', 'neon', 'NEON DRIFT\nARENA'), 'translate(330 80) scale(.68) rotate(10 400 300)'),
        (game('#a77bff', 'castle', 'CRÔNICAS\nDE ARKHOS'), 'translate(110 40) scale(.8)'),
    ]),
    'colecionaveis': lambda: scene('#a77bff', [
        (statue('#a77bff'), 'translate(-80 0) scale(.92)'),
        (figure('#ffd23f'), 'translate(300 120) scale(.66)'),
    ]),
}

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for slug, make in PRODUCTS.items():
        write(slug, make())
    cat_dir = os.path.join(OUT, '..', 'categories')
    os.makedirs(cat_dir, exist_ok=True)
    for slug, make in CATEGORIES.items():
        with open(os.path.join(cat_dir, f'{slug}.svg'), 'w', encoding='utf-8') as f:
            f.write(make())
    print(f'{len(PRODUCTS)} ilustrações de produtos e {len(CATEGORIES)} de departamentos geradas.')
