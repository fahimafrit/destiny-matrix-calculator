'use strict';

// ─── Two-person + tabs wiring for the compatibility chart preview ──────────
// Reuses calculatePoints / reduceNumber / calculateYear / renderValues /
// setDateBounds from code.js — no calculation logic is duplicated here.
//
// On submit: both people are calculated independently, and the compatibility
// formula is derived from both, giving three ready-made datasets —
// person1Data, person2Data, compatibilityData. The three tabs (Compatibility
// / Person 1 / Person 2) only decide which of those three already-computed
// datasets feeds the single octogram on the page; clicking a tab never
// recalculates anything.

const dateInputPerson1 = document.getElementById('date-person1');
const dateInputPerson2 = document.getElementById('date-person2');
const container = document.querySelector('.matrix-container');
const btnAnswer = document.getElementById('get_the_answer');
const errorOutput = document.querySelector('.errorOutput');
const outputDate = document.querySelector('.output-personal-date');
const tabButtons = document.querySelectorAll('.cv2-tab');
const compatibilityExcludedPoints = document.getElementById('compatibility-excluded-points');

// These points are meaningful on each person's own chart, but are not part
// of the combined compatibility chart.
const COMPATIBILITY_EXCLUDED_POINT_KEYS = new Set([
  'upoint', 'vpoint',
  'f1point', 'f2point', 'g1point', 'g2point',
  'h1point', 'h2point', 'i1point', 'i2point',
]);

// Which dataset feeds the octogram right now. Switching this never
// recalculates anything — all three datasets are already sitting in memory
// from the last submit; a tab click only decides which one gets rendered.
let activeTab = 'compatibility';

function getDataForTab(tab) {
  return { compatibility: compatibilityData, person1: person1Data, person2: person2Data }[tab];
}

// Every rendered value in the octogram (both the main points and the
// age-band ticks) shares the .matrix-value-point class. Clearing all of
// them before applying a dataset is what makes a point genuinely blank
// when that dataset has no value for it — renderValues() only ever *writes*
// keys it's given, it never clears keys that are missing, so without this
// step a switch to a sparser dataset (e.g. compatibilityData, which has no
// `years` yet) would leave stale numbers from the previous tab on screen.
function clearAllPoints() {
  document.querySelectorAll('.matrix-value-point').forEach((el) => {
    el.textContent = '';
  });
}

function renderDataset(data) {
  clearAllPoints();
  compatibilityExcludedPoints.classList.toggle('display-none', activeTab === 'compatibility');
  if (!data) return;

  if (data.points) renderValues(data.points);
  if (data.years) renderValues(data.years);
}

// The Relationship/Union/Harmony summary is always computed from
// compatibilityData and must stay visible across all three tabs.

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;

    tabButtons.forEach((b) => {
      const isActive = b === btn;
      b.classList.toggle('cv2-tab--active', isActive);
      b.setAttribute('aria-selected', String(isActive));
    });

    renderDataset(getDataForTab(activeTab));
  });
});

// These hold the two independent results after a successful calculation,
// plus the combined compatibility result derived from both.
let person1Data = null;
let person2Data = null;
let compatibilityData = null;

// ─── COMPATIBILITY CALCULATION ──────────────────────────────────────────────
// A compatibility point is the pairwise sum of the corresponding personal
// points, reduced with the compatibility rule. Points listed in
// COMPATIBILITY_EXCLUDED_POINT_KEYS intentionally have no compatibility
// meaning, so they are omitted from the result altogether.
//
// The Relationship / Union / Harmony summary (`summary` below) is ported
// top of the current system: it combines values straight from
// compatibilityData.points (already pair-summed + reduced) instead of
// re-deriving its own pair sums, and every combining step uses
// reduceCompatibilityNumber — not reduceNumber — to stay consistent with
// this page's compatibility-chart rule.
function calculateCompatibility(p1Points, p2Points) {
  const compatibilityPoints = {};

  for (const key of Object.keys(p1Points)) {
    if (COMPATIBILITY_EXCLUDED_POINT_KEYS.has(key)) continue;

    const raw = p1Points[key] + p2Points[key];
    compatibilityPoints[key] = reduceCompatibilityNumber(raw);
  }

  const sky = reduceCompatibilityNumber(compatibilityPoints.bpoint + compatibilityPoints.dpoint);
  const earth = reduceCompatibilityNumber(compatibilityPoints.apoint + compatibilityPoints.cpoint);
  const male = reduceCompatibilityNumber(compatibilityPoints.fpoint + compatibilityPoints.ipoint);
  const female = reduceCompatibilityNumber(compatibilityPoints.gpoint + compatibilityPoints.hpoint);
  const relationship = reduceCompatibilityNumber(sky + earth);
  const union = reduceCompatibilityNumber(male + female);
  const harmony = reduceCompatibilityNumber(relationship + union);

  const summary = {
    compatibilitySkypoint: sky,
    compatibilityEarthpoint: earth,
    compatibilityMalepoint: male,
    compatibilityFemalepoint: female,
    compatibilityRelationship: relationship,
    compatibilityUnion: union,
    compatibilityHarmony1: relationship,
    compatibilityHarmony2: union,
    compatibilityHarmony: harmony,
  };

  return { points: compatibilityPoints, summary };
}

// Writes the Relationship/Union/Harmony summary values into the compat-grid
// by id — separate from renderDataset()/renderValues() since these ids live
// outside the octogram and only ever apply to compatibilityData.
function renderCompatibilitySummary(data) {
  const summaryEls = document.querySelectorAll('#compat-grid [id^="compatibility"]');
  summaryEls.forEach((el) => {
    el.textContent = data && data.summary ? (data.summary[el.id] ?? '') : '';
  });
}

dateInputPerson1.value = '';
dateInputPerson2.value = '';
setDateBounds(dateInputPerson1);
setDateBounds(dateInputPerson2);

function maskDateInput(evt) {
  const input = evt.target;
  let digits = input.value.replace(/\D/g, '').slice(0, 8);

  let formatted = digits;
  if (digits.length >= 4) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  } else if (digits.length >= 2) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  input.value = formatted;
}

dateInputPerson1.addEventListener('input', maskDateInput);
dateInputPerson2.addEventListener('input', maskDateInput);

function parseDdMmYyyy(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  return { day: +dd, month: +mm, year: +yyyy };
}

function validateOne(date, parsed, label) {
  let errorMessage = '';
  const today = new Date();
  const dateIsValid = isValidCalendarDate(parsed, date);

  if (!dateIsValid) {
    errorMessage += `<p>${label}: date is not valid. Use DD/MM/YYYY.</p>`;
  }
  if (dateIsValid && (date > today)) {
    errorMessage += `<p>${label}: date can't be in the future.</p>`;
  }

  return errorMessage;
}

// ─── COMPATIBILITY REDUCTION ────────────────────────────────────────────────
// Deliberately separate from reduceNumber() in code.js — that one is the
// individual-chart rule (reduces above 22, stops at master numbers 11/22/33
// via calculatePoints' own logic). This one is the compatibility-chart rule:
// keep raw sums of 22 or less as-is, otherwise digit-sum repeatedly until
// the result is 22 or less. Do not merge these two functions.
function reduceCompatibilityNumber(raw) {
  let num = raw;
  while (num > 22) {
    num = String(num)
      .split('')
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  return num;
}

// Runs the existing calculatePoints engine (from code.js) for one person's
// date of birth and returns the same { points, purposes, chartHeart, years }
// shape it always has — nothing about the math changes per-person.
function calculateForPerson(calculationDate) {
  const parsed = parseDdMmYyyy(calculationDate);
  const date = parsed ? new Date(parsed.year, parsed.month - 1, parsed.day) : new Date(NaN);

  const apoint = reduceNumber(parsed.day);
  const bpoint = parsed.month;
  const cpoint = calculateYear(parsed.year);

  return {
    dob: calculationDate,
    fullDate: `${String(parsed.day).padStart(2, '0')}.${String(parsed.month).padStart(2, '0')}.${parsed.year}`,
    ...calculatePoints(apoint, bpoint, cpoint),
  };
}

function runCalculation({ updateUrl = true } = {}) {
  const dob1 = dateInputPerson1.value;
  const dob2 = dateInputPerson2.value;

  const parsed1 = parseDdMmYyyy(dob1);
  const parsed2 = parseDdMmYyyy(dob2);
  const date1 = parsed1 ? new Date(parsed1.year, parsed1.month - 1, parsed1.day) : new Date(NaN);
  const date2 = parsed2 ? new Date(parsed2.year, parsed2.month - 1, parsed2.day) : new Date(NaN);

  const errorMessage =
    validateOne(date1, parsed1, 'Person 1') +
    validateOne(date2, parsed2, 'Person 2');

  outputDate.innerHTML = '';
  errorOutput.innerHTML = '';

  if (errorMessage !== '') {
    errorOutput.innerHTML = errorMessage;
    container.classList.add('display-none');
    return;
  }

  // Each person is calculated independently — neither call reads or
  // affects the other's inputs or results.
  person1Data = calculateForPerson(dob1);
  person2Data = calculateForPerson(dob2);
  compatibilityData = calculateCompatibility(person1Data.points, person2Data.points);

  outputDate.innerHTML =
    `<span class="gray">Person 1 DOB:</span> ${person1Data.fullDate} &nbsp;&nbsp; ` +
    `<span class="gray">Person 2 DOB:</span> ${person2Data.fullDate}`;

  container.classList.remove('display-none');
  container.scrollIntoView({ behavior: 'smooth' });

  // Every submit starts back on the Compatibility tab.
  activeTab = 'compatibility';
  tabButtons.forEach((b) => {
    const isActive = b.dataset.tab === activeTab;
    b.classList.toggle('cv2-tab--active', isActive);
    b.setAttribute('aria-selected', String(isActive));
  });
  renderDataset(getDataForTab(activeTab));
  renderCompatibilitySummary(compatibilityData);

  // Confirm both objects independently in the console for now.
  console.log('person1Data', person1Data);
  console.log('person2Data', person2Data);
  console.log('compatibilityData', compatibilityData);

  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set('dob1', dob1.replace(/\//g, '-'));
    url.searchParams.set('dob2', dob2.replace(/\//g, '-'));
    window.history.pushState({}, '', url);
  }

  dateInputPerson1.value = '';
  dateInputPerson2.value = '';
}

btnAnswer.addEventListener('click', (evt) => {
  evt.preventDefault();
  runCalculation();
});

(function calculateFromUrlIfPresent() {
  const params = new URLSearchParams(window.location.search);
  const d1FromUrl = params.get('dob1');
  const d2FromUrl = params.get('dob2');

  if (d1FromUrl && d2FromUrl) {
    dateInputPerson1.value = d1FromUrl.replace(/-/g, '/');
    dateInputPerson2.value = d2FromUrl.replace(/-/g, '/');
    runCalculation({ updateUrl: false });
  }
})();
