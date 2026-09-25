import { h } from '../../core/dom';

/**
 * A row of stars that fill in one by one. A newly earned star gets a small pop
 * (skipped with reduced motion; the filled shape and colour are the static cue).
 */
export function starRow(total: number, label: (n: number) => string): { el: HTMLElement; set: (earned: boolean[]) => void } {
  const stars = Array.from({ length: total }, () => h('span', { class: 'star', 'aria-hidden': 'true' }, '☆'));
  const el = h('span', { class: 'star-row', role: 'img' }, stars);
  let prev: boolean[] = [];
  return {
    el,
    set(earned) {
      const n = earned.filter(Boolean).length;
      // live-region friendly: nothing changes unless the score does
      if (prev.length && n === prev.filter(Boolean).length && earned.length === prev.length) return;
      // earned stars fill from the left so the row reads as a score
      stars.forEach((st, i) => {
        const on = i < n;
        const was = prev.filter(Boolean).length > i;
        st.textContent = on ? '★' : '☆';
        st.classList.toggle('on', on);
        if (on && !was) {
          st.classList.remove('pop');
          void st.offsetWidth;
          st.classList.add('pop');
        }
      });
      el.setAttribute('aria-label', label(n));
      prev = earned;
    },
  };
}
