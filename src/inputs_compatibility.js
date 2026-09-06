'use strict';

const inputFirstDate = document.getElementById('date_person1');
const inputSecondDate = document.getElementById('date_person2');
const btnChart = document.getElementById('createChart');
const compatibilityContainer = document.querySelector('.compatibility-container');
const wrongDateOutput = document.querySelector('.wrongDate');
const output2 = document.querySelector('.output2');

let person = {};
let secondPerson = {};

inputFirstDate.value = '';
inputSecondDate.value = '';

// ─── DD/MM/YYYY TEXT MASK ───────────────────────────────────────────────────
// Auto-inserts slashes as the person types digits, so both boxes always read
// DD/MM/YYYY regardless of browser/OS locale (native <input type="date">
// ignores the lang attribute in most browsers, so masked text inputs are
// used instead).

function maskDateInput(evt) {
  const input = evt.target;
  let digits = input.value.replace(/\D/g, '').slice(0, 8);

  let formatted = digits;
  if (digits.length > 4) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  } else if (digits.length > 2) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  input.value = formatted;
}

inputFirstDate.addEventListener('input', maskDateInput);
inputSecondDate.addEventListener('input', maskDateInput);

// Parses a "DD/MM/YYYY" string into { day, month, year } (numbers), or
// null if the string isn't in that shape yet.
function parseDdMmYyyy(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  return { day: +dd, month: +mm, year: +yyyy };
}

// Every point that gets a simple "sum of both charts, then reduce" treatment.
// One entry here replaces one hand-written object in the old compatibilityMatrix array.
const SIMPLE_SUM_POINTS = [
  'apoint', 'bpoint', 'cpoint', 'dpoint', 'epoint', 'fpoint', 'gpoint',
  'hpoint', 'ipoint', 'jpoint', 'npoint', 'lpoint', 'kpoint', 'mpoint',
  'spoint', 'opoint', 'tpoint', 'ppoint', 'qpoint', 'rpoint', 'vpoint', 'upoint',
];

function pairSum(pointKey) {
  return reduceNumber(person.points[pointKey] + secondPerson.points[pointKey]);
}

// combines two already-reduced pair sums into one further-reduced value
function combine(a, b) {
  return reduceNumber(a + b);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildCompatibilityValues() {
  const values = {};

  SIMPLE_SUM_POINTS.forEach((key) => {
    values[`compatibility${capitalize(key)}`] = pairSum(key);
  });

  const sky = combine(pairSum('bpoint'), pairSum('dpoint'));
  const earth = combine(pairSum('apoint'), pairSum('cpoint'));
  const male = combine(pairSum('fpoint'), pairSum('ipoint'));
  const female = combine(pairSum('gpoint'), pairSum('hpoint'));
  const relationship = combine(sky, earth);
  const union = combine(male, female);
  const harmony = combine(relationship, union);

  Object.assign(values, {
    compatibilitySkypoint: sky,
    compatibilityEarthpoint: earth,
    compatibilityMalepoint: male,
    compatibilityFemalepoint: female,
    compatibilityRelationship: relationship,
    compatibilityUnion: union,
    compatibilityHarmony1: relationship,
    compatibilityHarmony2: union,
    compatibilityHarmony: harmony,
  });

  return values;
}

// Writes computed values directly by id. The compatibility summary is a
// single responsive grid (see compatibility.html) with one span per value,
// so each id now appears exactly once in the DOM.
function outputCompatibilityMatrixValues(values) {
  document.querySelectorAll('[id^="compatibility"]').forEach((el) => {
    if (Object.prototype.hasOwnProperty.call(values, el.id)) {
      el.innerHTML = values[el.id];
    }
  });
}

btnChart.addEventListener('click', (evt) => {
  evt.preventDefault();

  const calculationDateFirst = inputFirstDate.value;
  const calculationDateSecond = inputSecondDate.value;
  runCompatibilityCalculation(calculationDateFirst, calculationDateSecond);
});

function runCompatibilityCalculation(calculationDateFirst, calculationDateSecond, { updateUrl = true } = {}) {
  const parsedFirst = parseDdMmYyyy(calculationDateFirst);
  const parsedSecond = parseDdMmYyyy(calculationDateSecond);
  const date1 = parsedFirst ? new Date(parsedFirst.year, parsedFirst.month - 1, parsedFirst.day) : new Date(NaN);
  const date2 = parsedSecond ? new Date(parsedSecond.year, parsedSecond.month - 1, parsedSecond.day) : new Date(NaN);
  const response = validateDates(date1, date2, parsedFirst, parsedSecond);

  output2.innerHTML = '';
  wrongDateOutput.innerHTML = '';

  if (response !== true) {
    wrongDateOutput.innerHTML = response;
    compatibilityContainer.classList.add('display-none');
    return;
  }

  const fullDateFirst = `${String(parsedFirst.day).padStart(2, '0')}.${String(parsedFirst.month).padStart(2, '0')}.${parsedFirst.year}`;
  const fullDateSecond = `${String(parsedSecond.day).padStart(2, '0')}.${String(parsedSecond.month).padStart(2, '0')}.${parsedSecond.year}`;

  output2.innerHTML = `${fullDateFirst} + ${fullDateSecond}`;

  const apoint = reduceNumber(parsedFirst.day);
  const bpoint = parsedFirst.month;
  const cpoint = calculateYear(parsedFirst.year);
  person = calculatePoints(apoint, bpoint, cpoint);

  const secondApoint = reduceNumber(parsedSecond.day);
  const secondBpoint = parsedSecond.month;
  const secondCpoint = calculateYear(parsedSecond.year);
  secondPerson = calculatePoints(secondApoint, secondBpoint, secondCpoint);

  compatibilityContainer.classList.remove('display-none');
  compatibilityContainer.scrollIntoView({ behavior: 'smooth' });
  outputCompatibilityMatrixValues(buildCompatibilityValues());

  // Same page, no reload/new page — just swap the shareable URL in place.
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set('dob1', calculationDateFirst.replace(/\//g, '-'));
    url.searchParams.set('dob2', calculationDateSecond.replace(/\//g, '-'));
    window.history.pushState({}, '', url);
  }

  clearInputs(inputFirstDate, inputSecondDate);
}

function validateDates(date1, date2, parsedFirst, parsedSecond) {
  let errorMessage = '';
  const today = new Date();

  if (!parsedFirst || !parsedSecond || isNaN(date1.getFullYear()) || isNaN(date2.getFullYear())) {
    errorMessage += `<p>Date is not valid or one of the fields is empty. Use DD/MM/YYYY.</p>`;
  }

  if (parsedFirst && parsedSecond) {
    if (date1 > today || date2 > today) {
      errorMessage += `<p>Dates can't be in the future.</p>`;
    }

    if (today.getFullYear() - date1.getFullYear() > MAX_AGE_YEARS || today.getFullYear() - date2.getFullYear() > MAX_AGE_YEARS) {
      errorMessage += `<p>Dates can't be so far in the past.</p>`;
    }

    const ageDifference = Math.abs(date1.getFullYear() - date2.getFullYear());
    if (ageDifference >= 71) {
      errorMessage += `<p>The age difference is too big.</p>`;
    }
  }

  return errorMessage !== '' ? errorMessage : true;
}

// If the page is opened with ?d1=DD-MM-YYYY&d2=DD-MM-YYYY in the URL
// (e.g. a shared link), fill both inputs and calculate immediately — no
// click required.
(function calculateFromUrlIfPresent() {
  const params = new URLSearchParams(window.location.search);
  const d1FromUrl = params.get('dob1');
  const d2FromUrl = params.get('dob2');

  if (d1FromUrl && d2FromUrl) {
    const dob1FromUrl = d1FromUrl.replace(/-/g, '/');
    const dob2FromUrl = d2FromUrl.replace(/-/g, '/');
    inputFirstDate.value = dob1FromUrl;
    inputSecondDate.value = dob2FromUrl;
    runCompatibilityCalculation(dob1FromUrl, dob2FromUrl, { updateUrl: false });
  }
})();
