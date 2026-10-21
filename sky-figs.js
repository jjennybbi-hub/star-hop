'use strict';
/* Small diagrams for the course: one picture per idea a beginner needs a mental model for.
   Colours come from the page's tokens (classes below), so they follow Red mode too. */
const FIGS = (() => {
  const f = (n, d = 1) => +n.toFixed(d);
  const svg = (vb, label, body) => `<svg viewBox="${vb}" role="img" aria-label="${label}">${body}</svg>`;
  const star = (x, y, r, cls = 'inkf') => `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}"/>`;
  const t = (x, y, s, cls = 't', anchor = 'start') => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${s}</text>`;
  const arrow = (x1, y1, x2, y2, cls = 'am') => {
    const a = Math.atan2(y2 - y1, x2 - x1), h = 7;
    return `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>` +
      `<path class="${cls}" d="M${f(x2 - h * Math.cos(a - .45))} ${f(y2 - h * Math.sin(a - .45))} L${x2} ${y2} L${f(x2 - h * Math.cos(a + .45))} ${f(y2 - h * Math.sin(a + .45))}"/>`;
  };
  return {
    what: () => ({
      cap: 'A constellation is a picture we draw. The stars in it only look close together — they are usually at very different distances.',
      svg: svg('0 0 320 160', 'Three stars that look side by side are really at very different distances',
        `<rect class="box" x="6" y="22" width="118" height="118" rx="6"/>` + t(65, 14, 'What you see', 'tb', 'middle') +
        `<polyline class="am" points="34,62 96,48 76,108 34,62"/>` + star(34, 62, 3.4) + star(96, 48, 2.8) + star(76, 108, 3.1) +
        t(222, 14, 'From the side', 'tb', 'middle') +
        `<circle class="inkf" cx="150" cy="98" r="5"/>` + t(150, 120, 'you', 't', 'middle') +
        `<line class="ln dash" x1="150" y1="98" x2="196" y2="70"/><line class="ln dash" x1="150" y1="98" x2="250" y2="122"/><line class="ln dash" x1="150" y1="98" x2="306" y2="46"/>` +
        star(196, 70, 3.4) + star(250, 122, 3.1) + star(306, 46, 2.8) +
        t(196, 62, '8 light yrs', 'ta', 'middle') + t(250, 140, '430 light yrs', 'ta', 'middle') + t(306, 36, '2,000 light yrs', 'ta', 'end'))
    }),
    dome: () => {
      const ox = 160, oy = 136, sx = f(160 + 130 * Math.cos(40 * D2R)), sy = f(136 - 112 * Math.sin(40 * D2R));
      const ax = f(ox + 38 * Math.cos(40 * D2R)), ay = f(oy - 38 * Math.sin(40 * D2R));
      return {
        cap: 'Two numbers place anything in the sky: which way along the horizon (here, south) and how high up — its altitude, from 0° at the horizon to 90° overhead.',
        svg: svg('0 0 320 176', 'The sky as a dome over you, with the zenith overhead and a star 40 degrees up in the south',
          `<ellipse class="ground" cx="160" cy="136" rx="130" ry="22"/>` +
          `<path class="ln" d="M30 136 A130 112 0 0 1 290 136"/>` +
          `<line class="ln dash" x1="${ox}" y1="${oy}" x2="160" y2="24"/>` + star(160, 24, 3.4, 'amf') + t(168, 22, 'zenith · 90° straight up', 'ta') +
          `<line class="ln" x1="${ox}" y1="${oy}" x2="290" y2="136"/>` +
          `<line class="am" x1="${ox}" y1="${oy}" x2="${sx}" y2="${sy}"/>` + star(sx, sy, 4, 'amf') + t(sx - 6, sy - 9, 'a star', 'tb', 'end') +
          `<path class="am" d="M${ox + 38} ${oy} A38 38 0 0 0 ${ax} ${ay}"/>` + t(ox + 44, oy - 12, '40° up', 'ta') +
          `<circle class="inkf" cx="${ox}" cy="${oy}" r="4.5"/>` + t(ox - 8, oy + 4, 'you', 't', 'end') +
          t(304, 140, 'S', 'tb', 'middle') + t(16, 140, 'N', 'tb', 'middle') + t(160, 172, 'E', 'tb', 'middle') + t(171, 110, 'W', 'tbd', 'start'))
      };
    },
    axis: () => {
      const cx = 86, cy = 104, dx = Math.sin(23.4 * D2R), dy = -Math.cos(23.4 * D2R);
      const p = [f(cx + dx * 92), f(cy + dy * 92)], q = [f(cx - dx * 62), f(cy - dy * 62)];
      let trails = '';
      const P = [238, 70];
      [14, 28, 42, 56].forEach((r, i) => {
        const a0 = (-40 + i * 37) * D2R, a1 = a0 + 95 * D2R;
        const x0 = f(P[0] + r * Math.cos(a0)), y0 = f(P[1] + r * Math.sin(a0)), x1 = f(P[0] + r * Math.cos(a1)), y1 = f(P[1] + r * Math.sin(a1));
        trails += `<path class="gd" d="M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}"/>` + star(x1, y1, 2.2, 'inkf');
      });
      return {
        cap: 'Earth spins once a day around its axis. The axis points almost exactly at Polaris — so Polaris stays put while every other star circles around it.',
        svg: svg('0 0 320 166', 'Earth spinning on its axis, which points at Polaris; the sky appears to circle Polaris',
          `<line class="ln dash" x1="${q[0]}" y1="${q[1]}" x2="${p[0]}" y2="${p[1]}"/>` +
          `<circle class="earth" cx="${cx}" cy="${cy}" r="40"/>` +
          `<path class="am" d="M52 76 A38 11 -23 0 0 116 52"/><path class="am" d="M108 47 L116 52 L108 58"/>` +
          t(18, 160, 'Earth spins', 't') +
          star(p[0], p[1], 3.6, 'amf') + t(p[0] + 8, p[1] + 4, 'Polaris', 'ta') +
          trails + star(P[0], P[1], 3.6, 'amf') + t(P[0], P[1] + 72, 'what you see: stars', 't', 'middle') + t(P[0], P[1] + 86, 'circle round Polaris', 't', 'middle'))
      };
    },
    hand: () => {
      const rows = [['little finger', 1], ['thumb', 2], ['three fingers', 5], ['fist', 10], ['spread hand', 20]];
      const h = f(Math.tan(5 * D2R) * 278), hf = f(Math.tan(5 * D2R) * 108);
      return {
        cap: 'Held out at arm’s length, your hand measures the sky. A fist covers about 10° whether you are a child or an adult — longer arms come with bigger hands.',
        svg: svg('0 0 320 196', 'Hand measures at arm’s length: little finger 1 degree, thumb 2, three fingers 5, fist 10, spread hand 20',
          `<circle class="inkf" cx="22" cy="66" r="5"/>` + t(22, 88, 'eye', 't', 'middle') +
          `<line class="ln" x1="22" y1="66" x2="300" y2="${f(66 - h)}"/><line class="ln" x1="22" y1="66" x2="300" y2="${f(66 + h)}"/>` +
          `<rect class="fist" x="122" y="${f(66 - hf)}" width="18" height="${f(hf * 2)}" rx="5"/>` + t(131, f(66 - hf - 8), 'fist', 'tb', 'middle') +
          t(296, 70, '10°', 'ta', 'end') + t(240, 30, 'arm’s length', 't', 'middle') +
          rows.map(([n, d], i) => { const y = 116 + i * 16;
            return t(20, y + 5, n, 't') + `<rect class="amf" x="118" y="${y - 3}" width="${f(d * 8.4)}" height="6" rx="2"/>` + t(f(124 + d * 8.4), y + 5, d + '°', 'ta'); }).join(''))
      };
    },
    mags: () => {
      const x = m => f(34 + (m + 1.5) * 34);
      const dots = [-1.5, 0, 1, 2, 3, 4, 5, 6].map(m => star(x(m), 84, f(Math.max(1.3, 8.4 - (m + 1.5) * 0.92)), 'inkf') + t(x(m), 106, String(m).replace('-', '−'), 't', 'middle')).join('');
      const br = (m, y, label) => `<line class="gd" x1="${x(-1.5)}" y1="${y}" x2="${x(m)}" y2="${y}"/><line class="gd" x1="${x(m)}" y1="${y - 4}" x2="${x(m)}" y2="${y + 4}"/>` + t(f(x(m) - 4), y - 4, label, 'tg', 'end');
      return {
        cap: 'Magnitude: the smaller the number, the brighter the star. Each step is about 2½ times fainter. A city sky stops near 3; a dark countryside sky goes past 6 — around ten times as many stars.',
        svg: svg('0 0 320 150', 'Magnitude scale from minus 1.5 (Sirius) to 6 (the faintest you can see from a dark site)',
          br(3, 60, 'city') + br(4.5, 42, 'suburb') + br(6.5, 24, 'dark countryside') + dots +
          t(x(-1.5), 124, 'Sirius', 'ta', 'middle') + t(x(0), 124, 'Vega', 'ta', 'middle') + t(x(2), 124, 'Polaris', 'ta', 'middle') + t(x(6), 124, 'faintest', 'ta', 'middle') +
          t(34, 144, '← brighter', 't') + t(306, 144, 'fainter →', 't', 'end'))
      };
    },
    orbit: () => ({
      cap: 'As Earth travels round the Sun, our night side faces a different direction in space. So each season has its own evening stars.',
      svg: svg('0 0 320 160', 'Earth on opposite sides of its orbit; the night side faces Orion in December and Scorpius in June',
        `<ellipse class="ln dash" cx="160" cy="84" rx="92" ry="34"/>` + star(160, 84, 11, 'amf') + t(160, 112, 'Sun', 'ta', 'middle') +
        `<circle class="earth" cx="68" cy="84" r="9"/><path class="night" d="M68 75 A9 9 0 0 0 68 93 Z"/>` +
        `<circle class="earth" cx="252" cy="84" r="9"/><path class="night" d="M252 75 A9 9 0 0 1 252 93 Z"/>` +
        arrow(56, 84, 14, 84) + arrow(264, 84, 306, 84) +
        t(10, 70, 'Orion', 'tb') + t(10, 104, 'December nights', 't') + t(310, 70, 'Scorpius', 'tb', 'end') + t(310, 104, 'June nights', 't', 'end') +
        t(68, 140, 'Earth in December', 't', 'middle') + t(252, 140, 'Earth in June', 't', 'middle'))
    }),
    ecliptic: () => ({
      cap: 'The solar system is flat, and we are inside it. So the Sun, Moon and planets always sit near one line across the sky — the ecliptic.',
      svg: svg('0 0 320 170', 'The ecliptic: the line across the sky that the Sun, Moon and planets follow',
        `<path class="ln" d="M20 112 A140 96 0 0 1 300 112"/><line class="ln" x1="10" y1="112" x2="310" y2="112"/>` + t(160, 126, 'horizon', 't', 'middle') +
        `<path class="am dash" d="M36 112 Q160 4 284 112"/>` + t(160, 46, 'the ecliptic', 'ta', 'middle') +
        star(62, 86, 5, 'amf') + t(62, 78, 'Sun', 'ta', 'end') + star(118, 61, 4.2, 'inkf') + t(118, 52, 'Moon', 't', 'middle') +
        star(198, 60, 3.2, 'inkf') + star(240, 76, 2.8, 'inkf') + t(219, 92, 'planets', 't', 'middle') +
        `<line class="ln" x1="60" y1="152" x2="260" y2="152"/>` + star(160, 152, 4.5, 'amf') + star(120, 152, 2, 'inkf') + star(214, 152, 2.6, 'inkf') + star(84, 152, 2.2, 'inkf') +
        t(160, 166, 'the solar system, seen edge-on', 't', 'middle'))
    }),
    darkeyes: () => {
      const X = m => 40 + m * 8.6, Y = s => 118 - s * 92;
      const pts = []; for (let m = 0; m <= 30; m += 0.5) pts.push(f(X(m)) + ',' + f(Y(1 - 0.5 * Math.exp(-m / 2.2) - 0.5 * Math.exp(-m / 8))));
      return {
        cap: 'In the dark your eyes keep getting more sensitive for about 20 minutes. One look at a white screen sends you back to the start — Red mode keeps your progress.',
        svg: svg('0 0 320 150', 'Dark adaptation: sensitivity rises over about 20 minutes and resets with white light',
          `<line class="ln" x1="40" y1="118" x2="300" y2="118"/><line class="ln" x1="40" y1="118" x2="40" y2="20"/>` +
          [0, 10, 20, 30].map(m => t(f(X(m)), 134, m + (m === 30 ? ' min' : ''), 't', 'middle')).join('') +
          t(46, 18, 'how many faint stars you can see', 't') +
          `<polyline class="gd" points="${pts.join(' ')}"/>` +
          `<line class="am dash" x1="${f(X(14))}" y1="${f(Y(0.86))}" x2="${f(X(14))}" y2="112"/>` +
          t(f(X(14) + 6), 92, 'one glance at a white', 'ta') + t(f(X(14) + 6), 105, 'screen: back to zero', 'ta') +
          t(296, 58, 'Red mode keeps this', 'tg', 'end'))
      };
    }
  };
})();
