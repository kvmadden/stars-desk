import React from 'react';

// How a plan would prove the desk works. No outcome claim is made before a pilot.
const CARDS = [
  {
    title: 'Logged on every call',
    lines: ['Reached or not', 'Barrier the pharmacist found', 'Fix offered and accepted', 'Follow-up date'],
    note: 'The Log call outcome button on the call list captures these.',
  },
  {
    title: 'What it answers',
    lines: [
      'Main: share of members at 80% PDC on December 31, by arm, using the CMS rules',
      'Saves per 100 calls',
      "How often the desk's barrier guess matched what the pharmacist found",
      'How close the year-end projection came',
    ],
  },
  {
    title: 'Guardrails',
    lines: [
      "Both arms keep the plan's standard refill reminders",
      'Pharmacists can override the list',
      'No member is denied a clinical call',
      "Size it before the first call, from the plan's own prior-year rate for members like these",
    ],
  },
  {
    title: 'Decision',
    lines: [
      'Adopt the desk if its arm beats the current list by the margin set in advance',
      'If not, the barrier log shows whether the ranking or the fix fell short',
      'Calls in October, readout in February once December claims settle',
    ],
  },
];

function checked(market) {
  const c = market?.check;
  return [
    "PDC math matches CMS's own worked examples",
    'Cut points match the CMS 2027 data file on all six measures',
    c
      ? `Star logic gives CMS's published star on ${c.reproduced.toLocaleString()} of ${c.checked.toLocaleString()} real plan scores. The other ${c.heldAt2026} are plans CMS kept at their 2026 star under its disaster rule`
      : "Star logic checked against CMS's published stars",
    'Reads only claims a plan has on October 1',
    'Automated tests for each of these in the repo',
  ];
}

export default function Pilot({ data }) {
  const CHECKED = checked(data?.market);
  return (
    <div className="page pilot">
      <section className="hero small">
        <p className="eyebrow">No outcome claim yet</p>
        <h1>
          The test that would <span className="hl">prove it</span>.
        </h1>
        <p className="lede">A two-arm pilot against the team's current call list, measured the way CMS measures it.</p>
      </section>

      <ol className="pflow" aria-label="Pilot design">
        <li className="pstep">
          <span className="mono">Oct 1</span>
          <strong>Members who can still reach 80%</strong>
        </li>
        <li className="parrow" aria-hidden="true">→</li>
        <li className="pstep">
          <span className="mono">Randomize</span>
          <strong>Same calls per arm</strong>
        </li>
        <li className="parrow" aria-hidden="true">→</li>
        <li className="parms">
          <div className="pstep arm">
            <span className="mono">Arm A</span>
            <strong>The team's current list and script</strong>
          </div>
          <div className="pstep arm hot">
            <span className="mono">Arm B</span>
            <strong>Stars Desk list and matched fix</strong>
          </div>
        </li>
        <li className="parrow" aria-hidden="true">→</li>
        <li className="pstep">
          <span className="mono">Dec 31</span>
          <strong>Share at 80% PDC, by arm</strong>
        </li>
      </ol>

      <div className="pcards">
        {CARDS.map((c) => (
          <article key={c.title} className="mcard">
            <h3>{c.title}</h3>
            <ul className="plist">
              {c.lines.map((l) => <li key={l}>{l}</li>)}
            </ul>
            {c.note && <p className="sub">{c.note}</p>}
          </article>
        ))}
      </div>

      <section className="checked" aria-label="Already checked">
        <h2>Already checked</h2>
        <ul>
          {CHECKED.map((c) => <li key={c}><span className="tick-mark" aria-hidden="true">✓</span>{c}</li>)}
        </ul>
        <p className="sub">
          During development a simulator checked the code's logic. Its effect sizes came from assumed call success rates, not measured ones, so none of them appear here as results.
        </p>
      </section>
    </div>
  );
}
