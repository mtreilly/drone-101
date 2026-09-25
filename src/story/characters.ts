import rough from 'roughjs';
import { s } from '../core/dom';

export type Who = 'mika' | 'theo' | 'june';
export type Mood = 'neutral' | 'happy' | 'think' | 'surprised' | 'worried' | 'excited';

const cache = new Map<string, string>();

/**
 * Original doodle avatars. Drawn with Rough.js (fixed seeds, so they never jitter),
 * in ink + paper tones only, so they never compete with the data colours.
 */
export function avatar(who: Who, mood: Mood = 'neutral'): SVGSVGElement {
  const key = `${who}:${mood}`;
  const svg = s('svg', { viewBox: '0 0 64 64', 'aria-hidden': 'true', class: `avatar-svg ${who}` });
  // each avatar blinks on its own rhythm
  svg.style.setProperty('--blink-delay', `${(-Math.random() * 6).toFixed(2)}s`);
  const hit = cache.get(key);
  if (hit) {
    svg.innerHTML = hit;
    return svg;
  }
  const rc = rough.svg(svg);
  const ink = 'currentColor';
  const base = { stroke: ink, strokeWidth: 1.6, roughness: 1.1, seed: who.length * 13 + 5 };
  const skin = { ...base, fill: 'var(--paper-2)', fillStyle: 'solid' };
  const hair = { ...base, fill: ink, fillStyle: 'hachure', hachureGap: 2.6, fillWeight: 1.2 };
  const parts: SVGElement[] = [];

  if (who === 'mika') {
    parts.push(rc.circle(32, 36, 38, skin));
    parts.push(rc.path('M14 30 Q18 14 32 15 Q46 14 50 30 Q42 22 32 24 Q22 22 14 30Z', hair));
    parts.push(rc.path('M31 16 Q28 4 38 6 Q32 9 34 16', { ...base, strokeWidth: 2 }));
  } else if (who === 'theo') {
    parts.push(rc.ellipse(32, 36, 34, 44, skin));
    parts.push(rc.path('M15 28 Q16 12 32 12 Q48 12 49 28 L45 22 Q32 18 19 22Z', hair));
    parts.push(rc.rectangle(18, 31, 11, 8, { ...base, strokeWidth: 1.8 }));
    parts.push(rc.rectangle(35, 31, 11, 8, { ...base, strokeWidth: 1.8 }));
    parts.push(rc.line(29, 34, 35, 34, base));
  } else {
    parts.push(rc.circle(32, 37, 36, skin));
    parts.push(rc.path('M14 34 Q12 14 32 14 Q52 14 50 34 Q46 22 32 22 Q20 22 14 34Z', hair));
    parts.push(rc.path('M49 26 Q60 30 56 46 Q53 38 48 34', hair));
    // goggles on the forehead
    parts.push(rc.line(14, 24, 50, 24, { ...base, strokeWidth: 2.2 }));
    parts.push(rc.circle(25, 23, 9, { ...base, fill: 'var(--card)', fillStyle: 'solid' }));
    parts.push(rc.circle(39, 23, 9, { ...base, fill: 'var(--card)', fillStyle: 'solid' }));
  }

  // eyes
  const eyeY = who === 'theo' ? 35 : 36;
  const eyeX = who === 'theo' ? [23.5, 40.5] : [25, 39];
  const eyeR = mood === 'surprised' ? 2.6 : 1.8;
  for (const x of eyeX) {
    if (mood === 'happy' || mood === 'excited') parts.push(rc.path(`M${x - 3} ${eyeY + 1} Q${x} ${eyeY - 3} ${x + 3} ${eyeY + 1}`, base));
    else parts.push(s('circle', { cx: x, cy: eyeY, r: eyeR, fill: ink, class: 'eye' }));
  }
  if (mood === 'think') parts.push(rc.line(eyeX[1] - 4, eyeY - 6, eyeX[1] + 4, eyeY - 8, base));
  if (mood === 'worried') {
    parts.push(rc.line(eyeX[0] - 4, eyeY - 7, eyeX[0] + 3, eyeY - 5, base));
    parts.push(rc.line(eyeX[1] - 3, eyeY - 5, eyeX[1] + 4, eyeY - 7, base));
  }

  // mouth
  const my = who === 'theo' ? 47 : 47;
  const mouths: Record<Mood, string> = {
    neutral: `M27 ${my} L37 ${my}`,
    happy: `M25 ${my - 2} Q32 ${my + 5} 39 ${my - 2}`,
    excited: `M25 ${my - 2} Q32 ${my + 8} 39 ${my - 2} Z`,
    think: `M28 ${my} Q33 ${my - 2} 37 ${my + 1}`,
    surprised: '',
    worried: `M26 ${my + 2} Q32 ${my - 3} 38 ${my + 2}`,
  };
  if (mood === 'surprised') parts.push(rc.ellipse(32, my, 6, 8, base));
  else parts.push(rc.path(mouths[mood], mood === 'excited' ? { ...base, fill: ink, fillStyle: 'solid' } : base));

  svg.append(...parts);
  cache.set(key, svg.innerHTML);
  return svg;
}
