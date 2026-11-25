// Three visual directions for review, picked by ?direction=a|b|c. With no parameter the desk renders as it ships.
// A: the cut line (newspaper graphics desk). B: the counter (pharmacy will-call shelf). C: the exhibit (strategy deck).
import StoreA from './StoreA.jsx';
import PlanA from './PlanA.jsx';
import StoreB from './StoreB.jsx';
import PlanB from './PlanB.jsx';
import StoreC from './StoreC.jsx';
import PlanC from './PlanC.jsx';
import StoreFinal from './StoreFinal.jsx';
import '../../directions.css';

const FONTS = {
  a: 'family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500',
  b: 'family=IBM+Plex+Sans+Condensed:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600',
  c: 'family=Libre+Franklin:wght@400;500;600;700',
};
// Final: Kevin's pick (Nov 25). A's style on every view, B's store headline, C's refill calendar redrawn in A's style.
FONTS.final = FONTS.a;

function read() {
  if (typeof window === 'undefined') return null;
  const d = new URLSearchParams(window.location.search).get('direction');
  return d && FONTS[d.toLowerCase()] ? d.toLowerCase() : null;
}

export const DIRECTION = read();

if (DIRECTION) {
  // Final wears A's styles everywhere, so it sets the A theme and marks itself for the few final-only rules.
  document.documentElement.dataset.direction = DIRECTION === 'final' ? 'a' : DIRECTION;
  if (DIRECTION === 'final') document.documentElement.dataset.final = '';
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${FONTS[DIRECTION]}&display=swap`;
  document.head.appendChild(link);
}

const STORE = { a: StoreA, b: StoreB, c: StoreC, final: StoreFinal };
const PLAN = { a: PlanA, b: PlanB, c: PlanC, final: PlanA };
export const StoreFor = (d) => (d ? STORE[d] : null);
export const PlanFor = (d) => (d ? PLAN[d] : null);
