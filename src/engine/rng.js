// Small seeded random tools so every synthetic plan is reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashSeed(...parts) {
  let h = 2166136261;
  for (const p of parts.join('|')) {
    h ^= p.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
export function weighted(rng, pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of pairs) {
    r -= w;
    if (r <= 0) return v;
  }
  return pairs[pairs.length - 1][0];
}
export function normal(rng, mean = 0, sd = 1) {
  const u = Math.max(1e-12, rng());
  const v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
export const expo = (rng, mean) => -mean * Math.log(Math.max(1e-12, 1 - rng()));
