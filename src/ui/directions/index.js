// Three visual directions for review, picked by ?direction=a|b|c. With no parameter the desk renders as it ships.
// A: the cut line (newspaper graphics desk). B: the counter (pharmacy will-call shelf). C: the exhibit (strategy deck).
import StoreA from './StoreA.jsx';
import PlanA from './PlanA.jsx';
import StoreB from './StoreB.jsx';
import PlanB from './PlanB.jsx';
import StoreC from './StoreC.jsx';
import PlanC from './PlanC.jsx';
import '../../directions.css';

const FONTS = {
  a: 'family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500',
  b: 'family=IBM+Plex+Sans+Condensed:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600',
  c: 'family=Libre+Franklin:wght@400;500;600;700',
};

function read() {
  if (typeof window === 'undefined') return null;
  const d = new URLSearchParams(window.location.search).get('direction');
  return d && FONTS[d.toLowerCase()] ? d.toLowerCase() : null;
}

export const DIRECTION = read();

if (DIRECTION) {
  document.documentElement.dataset.direction = DIRECTION;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${FONTS[DIRECTION]}&display=swap`;
  document.head.appendChild(link);
}

const STORE = { a: StoreA, b: StoreB, c: StoreC };
const PLAN = { a: PlanA, b: PlanB, c: PlanC };
export const StoreFor = (d) => (d ? STORE[d] : null);
export const PlanFor = (d) => (d ? PLAN[d] : null);
