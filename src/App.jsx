import React, { useEffect, useState } from 'react';
import Plan from './ui/Plan.jsx';
import SaveList from './ui/SaveList.jsx';
import Safety from './ui/Safety.jsx';
import Formulary from './ui/Formulary.jsx';
import Pilot from './ui/Pilot.jsx';
import Pharmacy from './ui/Pharmacy.jsx';
import { dayLabel } from './ui/format.js';

const TABS = [
  { key: 'plan', label: 'Plan', short: 'Plan' },
  { key: 'list', label: 'Call list', short: 'Calls' },
  { key: 'safety', label: 'Safety faxes', short: 'Faxes' },
  { key: 'formulary', label: 'January changes', short: 'January' },
  { key: 'pharmacy', label: 'Pharmacy', short: 'Store' },
];

function readHash() {
  const [tab, q] = window.location.hash.replace(/^#\/?/, '').split('?');
  const params = new URLSearchParams(q || '');
  return { tab: tab || 'plan', params };
}

export default function App() {
  const [data, setData] = useState(null);
  const [route, setRoute] = useState(readHash());
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/desk.json`).then((r) => r.json()).then(setData);
    const on = () => setRoute(readHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (tab, params) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    window.location.hash = `/${tab}${q}`;
    window.scrollTo(0, 0);
  };
  if (!data) return <div className="loading">Opening the desk</div>;
  const { tab, params } = route;
  return (
    <div className="app">
      <header className="top">
        <a className="brand" href="#/plan" aria-label="Stars Desk home">
          <img src={`${import.meta.env.BASE_URL}star.svg`} alt="" width="28" height="28" />
          <span>Stars Desk</span>
          <span className="brandsub">synthetic data</span>
        </a>
        <nav className="tabs" aria-label="Sections">
          {TABS.map((t) => (
            <a key={t.key} href={`#/${t.key}`} className={tab === t.key || ((tab === 'pilot' || tab === 'proof') && t.key === 'plan') ? 'tab on' : 'tab'} aria-current={tab === t.key ? 'page' : undefined}><span className="long">{t.label}</span><span className="short">{t.short}</span></a>
          ))}
        </nav>
        <div className="planchip" title="Every member and claim on this desk is made up">
          {data.plan.name} · synthetic · as of {dayLabel(data.plan.asOf)}, {data.plan.year}
        </div>
      </header>
      <main>
        {tab === 'plan' && <Plan data={data} go={go} />}
        {tab === 'list' && <SaveList data={data} params={params} go={go} />}
        {tab === 'safety' && <Safety data={data} params={params} />}
        {tab === 'formulary' && <Formulary data={data} params={params} />}
        {tab === 'pharmacy' && <Pharmacy data={data} />}
        {(tab === 'pilot' || tab === 'proof') && <Pilot data={data} />}
      </main>
      <footer className="foot">
        <span>Synthetic plan and members. Measure rules, cut points and real plan scores from CMS's 2027 Star Ratings.</span>
        <a href="#/pilot">How a pilot would prove it</a>
      </footer>
    </div>
  );
}
