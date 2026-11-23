import React, { useMemo, useState } from 'react';
import { Chip } from './bits.jsx';

const ISSUE = {
  D11: (d) => `Filling ${d.drug} for diabetes with no statin this year.`,
  D12: (d) => `Filling ${d.opioid} and ${d.benzo} together, ${d.overlap} overlapping days so far.`,
  D13: (d) => `Filling ${d.drugs.join(' and ')}, both strongly anticholinergic, ${d.overlap} overlapping days so far.`,
};
const ASK = {
  D11: () => 'Consider a moderate-intensity statin if there is no contraindication. The ADA Standards of Care recommend one for people with diabetes aged 40 to 75, in addition to lifestyle therapy.',
  D12: () => 'Consider whether both are still needed, a gradual benzodiazepine taper if appropriate, and a naloxone prescription. The CDC 2022 opioid guideline advises caution with this combination.',
  D13: (d) => d.suggestions.map((s) => `${s.drug}: ${s.text}`).join(' '),
};
const LABEL = { D11: 'No statin', D12: 'Opioid with benzo', D13: 'Two anticholinergics' };
const TONE = { D11: 'gold', D12: 'brick', D13: 'slate' };

export default function Safety({ data }) {
  const [i, setI] = useState(0);
  const [queued, setQueued] = useState({});
  const fax = data.faxes[i];
  const totals = useMemo(() => {
    const t = { D11: 0, D12: 0, D13: 0 };
    for (const f of data.faxes) for (const it of f.items) t[it.measure]++;
    return t;
  }, [data]);
  const members = Object.values(totals).reduce((a, b) => a + b, 0);
  return (
    <div className="page safety">
      <section className="hero small">
        <h1>
          The top {data.faxes.length} prescribers have <span className="hl">{members} patients</span> to raise.
        </h1>
        <p className="lede">One fax per prescriber, with the patient, the issue and a specific ask. Overlap past 30 days already counts for 2026, but stopping it still protects the patient and next year's rate.</p>
        <div className="chips">
          {data.safetyMeasures.map((m) => (
            <Chip key={m.id} tone={TONE[m.id]}>{LABEL[m.id]} <span className="mono">{totals[m.id]}</span></Chip>
          ))}
        </div>
      </section>
      <div className="split">
        <ol className="rows">
          {data.faxes.map((f, k) => (
            <li key={f.prescriber.id}>
              <button className={k === i ? 'row on' : 'row'} onClick={() => setI(k)}>
                <span className="who">
                  <strong>{f.prescriber.name}</strong>
                  <span className="sub">{f.prescriber.practice}</span>
                </span>
                <span className="when">
                  <span className="mono">{f.items.length}</span>
                  <span className="sub">{queued[f.prescriber.id] ? 'queued' : 'patients'}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <section className="detail faxwrap">
          {fax && (
            <>
              <div className="fax">
                <div className="faxtop">
                  <span className="mono">FAX</span>
                  <span className="mono">Page 1 of 1</span>
                </div>
                <dl>
                  <dt>To</dt><dd>{fax.prescriber.name}, {fax.prescriber.practice}</dd>
                  <dt>From</dt><dd>Clinical pharmacy team, {data.plan.name} (synthetic)</dd>
                  <dt>Re</dt><dd>{fax.items.length} of your patients, medication safety review</dd>
                </dl>
                <p>We reviewed pharmacy claims for your patients in our plan. Each item below is a suggestion for your judgment. Please reply on this sheet or call us.</p>
                <ol className="faxitems">
                  {fax.items.map((it) => (
                    <li key={it.member + it.measure}>
                      <p><b>{it.name}</b>, {it.age}. {ISSUE[it.measure](it.detail)}</p>
                      <p className="ask">{ASK[it.measure](it.detail)}</p>
                      <p className="reply mono">[ ] Will change   [ ] Keep as is, reason: ________</p>
                    </li>
                  ))}
                </ol>
                <p className="refs">References: ADA Standards of Care in Diabetes, section 10. CDC Clinical Practice Guideline for Prescribing Opioids for Pain, 2022. American Geriatrics Society Beers Criteria, 2023.</p>
              </div>
              <button className="primary" onClick={() => setQueued({ ...queued, [fax.prescriber.id]: true })} disabled={queued[fax.prescriber.id]}>
                {queued[fax.prescriber.id] ? 'In the fax queue' : 'Add to fax queue'}
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
