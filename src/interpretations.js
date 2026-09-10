'use strict';

/*
  interpretations.js
  Loads all 15 interpretation JSON files, then renders them as
  styled accordion sections with tabbed subsections.
*/

const INTERP_PATH = './src/interpretations/';

const FILES = {
  'section-01': { file: 'point-a.json',           type: 'A', title: 'Your Core Self',           getKey: (p) => p.points.apoint },
  'section-02': { file: 'point-b.json',           type: 'A', title: 'Your Outer Presence',       getKey: (p) => p.points.bpoint },
  'section-04': { file: 'point-e.json',           type: 'A', title: 'Your Hidden Talents',       getKey: (p) => p.points.epoint },
  'section-05': { file: 'point-f.json',           type: 'A', title: 'Your Love Energy',          getKey: (p) => p.points.fpoint },
  'section-06': { file: 'point-g.json',           type: 'A', title: 'Your Relationship Pattern', getKey: (p) => p.points.gpoint },
  'section-07': { file: 'point-h.json',           type: 'A', title: 'Your Money Energy',         getKey: (p) => p.points.hpoint },
  'section-08': { file: 'point-i.json',           type: 'A', title: 'Your Abundance Blocks',     getKey: (p) => p.points.ipoint },
  'section-09': { file: 'purpose-personal.json',  type: 'A', title: 'Your Life Path',            getKey: (p) => p.purposes.perspurpose },
  'section-10': { file: 'purpose-social.json',    type: 'A', title: 'Your Social Mission',       getKey: (p) => p.purposes.socialpurpose },
  'section-11': { file: 'purpose-general.json',   type: 'A', title: 'Your General Purpose',      getKey: (p) => p.purposes.generalpurpose },
  'section-14': { file: 'year.json',              type: 'A', title: 'Your Current Year Energy',  getKey: (p) => p.points.cpoint },
  'section-16': { file: 'purpose-planetary.json', type: 'A', title: 'Your Legacy',               getKey: (p) => p.purposes.planetarypurpose },
  'section-03': { file: 'karmic-tail.json',       type: 'B', title: "Your Soul's Journey",       getKey: (p) => `${p.points.jpoint}-${p.points.rpoint}-${p.points.dpoint}` },
  'section-12': { file: 'point-o-p.json',         type: '12', title: 'Your Family Blueprint' },
  'section-15': { file: 'chakras.json',           type: 'C',  title: 'Your Body and Energy Map' },
};

// NOTE: keys here must exactly match the "chakra" field in chakras.json
// and the id prefixes used in ChartHeart()'s chartHeart object (code.js).
// Sacral chakra is spelled "svadhisthana" throughout the project — do not
// reintroduce the "svadhishtana" typo from an earlier draft.
const CHAKRA_MAP = {
  sahasrara:     { physics: 'sahphysics',  energy: 'sahenergy',  emotions: 'sahemotions',  label: 'Crown — Sahasrara' },
  ajna:          { physics: 'ajphysics',   energy: 'ajenergy',   emotions: 'ajemotions',   label: 'Third Eye — Ajna' },
  vishuddha:     { physics: 'vishphysics', energy: 'vishenergy', emotions: 'vishemotions', label: 'Throat — Vishuddha' },
  anahata:       { physics: 'anahphysics', energy: 'anahenergy', emotions: 'anahemotions', label: 'Heart — Anahata' },
  manipura:      { physics: 'manphysics',  energy: 'manenergy',  emotions: 'manemotions',  label: 'Solar Plexus — Manipura' },
  svadhisthana:  { physics: 'svadphysics', energy: 'svadenergy', emotions: 'svademotions', label: 'Sacral — Svadhisthana' },
  muladhara:     { physics: 'mulphysics',  energy: 'mulenergy',  emotions: 'mulemotions',  label: 'Root — Muladhara' },
};

const data = {};

async function safeFetch(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const interpretationsReady = (async () => {
  await Promise.all(
    Object.entries(FILES).map(async ([id, cfg]) => {
      data[id] = await safeFetch(INTERP_PATH + cfg.file);
    })
  );
})();

// ─── BUILD ACCORDION + TABS ────────────────────────────────────────────────

function buildAccordion(sectionId, title, subsections) {
  const container = document.getElementById(sectionId);
  if (!container) return;
  container.innerHTML = '';

  const accordion = document.createElement('div');
  accordion.className = 'interp-accordion';

  const header = document.createElement('button');
  header.className = 'interp-accordion-header';
  header.setAttribute('aria-expanded', 'false');

  const headerTitle = document.createElement('span');
  headerTitle.className = 'interp-accordion-title';
  headerTitle.textContent = title;

  const chevron = document.createElement('span');
  chevron.className = 'interp-chevron';
  chevron.innerHTML = '&#8964;'; // ⌄

  header.appendChild(headerTitle);
  header.appendChild(chevron);

  const body = document.createElement('div');
  body.className = 'interp-accordion-body';

  const tabBar = document.createElement('div');
  tabBar.className = 'interp-tab-bar';

  const panelWrap = document.createElement('div');
  panelWrap.className = 'interp-panel-wrap';

  subsections.forEach((sub, i) => {
    const tab = document.createElement('button');
    tab.className = 'interp-tab' + (i === 0 ? ' interp-tab--active' : '');
    tab.textContent = sub.heading;
    tab.dataset.index = i;

    const panel = document.createElement('div');
    panel.className = 'interp-panel' + (i === 0 ? ' interp-panel--active' : '');
    panel.dataset.index = i;
    const p = document.createElement('p');
    p.className = 'interp-panel-text';
    p.textContent = sub.text;
    panel.appendChild(p);

    tab.addEventListener('click', () => {
      tabBar.querySelectorAll('.interp-tab').forEach(t => t.classList.remove('interp-tab--active'));
      panelWrap.querySelectorAll('.interp-panel').forEach(p => p.classList.remove('interp-panel--active'));
      tab.classList.add('interp-tab--active');
      panel.classList.add('interp-panel--active');
    });

    tabBar.appendChild(tab);
    panelWrap.appendChild(panel);
  });

  body.appendChild(tabBar);
  body.appendChild(panelWrap);

  header.addEventListener('click', () => {
    const isOpen = body.classList.toggle('interp-accordion-body--open');
    header.setAttribute('aria-expanded', isOpen);
    chevron.classList.toggle('interp-chevron--open', isOpen);
  });

  accordion.appendChild(header);
  accordion.appendChild(body);
  container.appendChild(accordion);
}

// ─── RENDER HELPERS ─────────────────────────────────────────────────────────

function renderTypeA(sectionId, cfg, person) {
  const json = data[sectionId];
  if (!json) return;
  const entry = json.find(e => e.arcana === cfg.getKey(person));
  if (!entry) return;
  buildAccordion(sectionId, cfg.title, entry.subsections);
}

function renderTypeB(sectionId, cfg, person) {
  const json = data[sectionId];
  if (!json) return;
  const key = cfg.getKey(person);
  const entry = json.find(e => e.cluster === key);
  if (!entry) return;
  buildAccordion(sectionId, cfg.title, entry.subsections);
}

function renderSection12(person) {
  const json = data['section-12'];
  if (!json) return;
  const oEntry = json.find(e => e.arcana === person.points.opoint);
  const pEntry = json.find(e => e.arcana === person.points.ppoint);
  if (!oEntry && !pEntry) return;

  // Merge subsections from both entries into one accordion
  const subsections = [];
  if (oEntry) oEntry.subsections.forEach(s => subsections.push(s));
  if (pEntry && pEntry.arcana !== oEntry?.arcana) {
    pEntry.subsections.forEach(s => {
      // avoid duplicating "The Imprint From Your Parents" if both resolve to same arcana
      if (!subsections.find(existing => existing.heading === s.heading)) {
        subsections.push(s);
      }
    });
  }
  buildAccordion('section-12', 'Your Family Blueprint', subsections);
}

function renderChakras(person) {
  const container = document.getElementById('section-15');
  const json = data['section-15'];
  if (!container || !json) return;
  container.innerHTML = '';

  const accordion = document.createElement('div');
  accordion.className = 'interp-accordion';

  const header = document.createElement('button');
  header.className = 'interp-accordion-header';
  header.setAttribute('aria-expanded', 'false');

  const headerTitle = document.createElement('span');
  headerTitle.className = 'interp-accordion-title';
  headerTitle.textContent = 'Your Body and Energy Map';

  const chevron = document.createElement('span');
  chevron.className = 'interp-chevron';
  chevron.innerHTML = '&#8964;';

  header.appendChild(headerTitle);
  header.appendChild(chevron);

  const body = document.createElement('div');
  body.className = 'interp-accordion-body';

  // Chakra selector row (top-level tabs selecting which chakra)
  const chakraTabBar = document.createElement('div');
  chakraTabBar.className = 'interp-tab-bar interp-tab-bar--chakra';

  const chakraPanelWrap = document.createElement('div');
  chakraPanelWrap.className = 'interp-panel-wrap';

  let firstChakra = true;

  Object.entries(CHAKRA_MAP).forEach(([key, map]) => {
    const chakraEntry = json.find(c => c.chakra === key);
    if (!chakraEntry) return;

    const physVal  = String(person.chartHeart[map.physics]);
    const engVal   = String(person.chartHeart[map.energy]);
    const emoVal   = String(person.chartHeart[map.emotions]);
    const physText = chakraEntry.physics?.[physVal];
    const engText  = chakraEntry.energy?.[engVal];
    const emoText  = chakraEntry.emotions?.[emoVal];
    if (!physText && !engText && !emoText) return;

    const chakraTab = document.createElement('button');
    chakraTab.className = 'interp-tab' + (firstChakra ? ' interp-tab--active' : '');
    chakraTab.textContent = map.label;

    const chakraPanel = document.createElement('div');
    chakraPanel.className = 'interp-panel' + (firstChakra ? ' interp-panel--active' : '');

    const innerTabBar = document.createElement('div');
    innerTabBar.className = 'interp-tab-bar interp-tab-bar--inner';

    const innerPanelWrap = document.createElement('div');
    innerPanelWrap.className = 'interp-panel-wrap';

    [
      { label: 'Physics',  text: physText },
      { label: 'Energy',   text: engText  },
      { label: 'Emotions', text: emoText  },
    ].forEach((col, i) => {
      if (!col.text) return;

      const innerTab = document.createElement('button');
      innerTab.className = 'interp-tab interp-tab--inner' + (i === 0 ? ' interp-tab--active' : '');
      innerTab.textContent = col.label;

      const innerPanel = document.createElement('div');
      innerPanel.className = 'interp-panel' + (i === 0 ? ' interp-panel--active' : '');
      const p = document.createElement('p');
      p.className = 'interp-panel-text';
      p.textContent = col.text;
      innerPanel.appendChild(p);

      innerTab.addEventListener('click', () => {
        innerTabBar.querySelectorAll('.interp-tab--inner').forEach(t => t.classList.remove('interp-tab--active'));
        innerPanelWrap.querySelectorAll('.interp-panel').forEach(p => p.classList.remove('interp-panel--active'));
        innerTab.classList.add('interp-tab--active');
        innerPanel.classList.add('interp-panel--active');
      });

      innerTabBar.appendChild(innerTab);
      innerPanelWrap.appendChild(innerPanel);
    });

    chakraPanel.appendChild(innerTabBar);
    chakraPanel.appendChild(innerPanelWrap);

    chakraTab.addEventListener('click', () => {
      chakraTabBar.querySelectorAll('.interp-tab').forEach(t => t.classList.remove('interp-tab--active'));
      chakraPanelWrap.querySelectorAll('.interp-panel').forEach(p => p.classList.remove('interp-panel--active'));
      chakraTab.classList.add('interp-tab--active');
      chakraPanel.classList.add('interp-panel--active');
    });

    chakraTabBar.appendChild(chakraTab);
    chakraPanelWrap.appendChild(chakraPanel);
    firstChakra = false;
  });

  body.appendChild(chakraTabBar);
  body.appendChild(chakraPanelWrap);

  header.addEventListener('click', () => {
    const isOpen = body.classList.toggle('interp-accordion-body--open');
    header.setAttribute('aria-expanded', isOpen);
    chevron.classList.toggle('interp-chevron--open', isOpen);
  });

  accordion.appendChild(header);
  accordion.appendChild(body);
  container.appendChild(accordion);
}

// ─── MAIN ENTRY POINT ───────────────────────────────────────────────────────
async function renderInterpretations(person) {
  await interpretationsReady;

  const wrapper = document.getElementById('interpretations-section');
  if (wrapper) wrapper.classList.remove('display-none');

  Object.entries(FILES).forEach(([sectionId, cfg]) => {
    if (cfg.type === 'A') renderTypeA(sectionId, cfg, person);
    if (cfg.type === 'B') renderTypeB(sectionId, cfg, person);
  });

  renderSection12(person);
  renderChakras(person);
}
