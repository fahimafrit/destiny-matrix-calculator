'use strict';

const inputFirstDate = document.getElementById('date_person1');
const inputSecondDate = document.getElementById('date_person2');
const btnChart = document.getElementById('createChart');
const compatibilityContainer = document.querySelector('.compatibility-container');

const today = new Date();

// disallow future dates and dates older than 120 years, for both partners
document.getElementById('date_person1').setAttribute('max', today.toLocaleDateString('en-CA'));
document.getElementById('date_person2').setAttribute('max', today.toLocaleDateString('en-CA'));
const ancientDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDay());
document.getElementById('date_person1').setAttribute('min', ancientDate.toLocaleDateString('en-CA'));
document.getElementById('date_person2').setAttribute('min', ancientDate.toLocaleDateString('en-CA'));

let person = {};
let secondPerson = {};

inputFirstDate.value = '';
inputSecondDate.value = '';

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

// Writes computed values directly by id — no scanning/matching against the DOM.
// Both the desktop and mobile-adaptive tables reuse the same span ids where
// they appear more than once (see compatibility.html), so getElementById
// naturally only reaches the first one; duplicate spans use distinct ids.
function outputCompatibilityMatrixValues(values) {
  document.querySelectorAll('[id^="compatibility"]').forEach((el) => {
    if (Object.prototype.hasOwnProperty.call(values, el.id)) {
      el.innerHTML = values[el.id];
    }
  });
}

btnChart.addEventListener('click', (evt) => {
  evt.preventDefault();

  const date1 = new Date(document.getElementById('date_person1').value);
  const date2 = new Date(document.getElementById('date_person2').value);
  const calculationDateFirst = document.getElementById('date_person1').value;
  const calculationDateSecond = document.getElementById('date_person2').value;
  const wrongDate = document.querySelector('.wrongDate');
  const output2 = document.querySelector('.output2');
  const response = validateDates(date1, date2);

  output2.innerHTML = '';
  wrongDate.innerHTML = '';

  if (response !== true) {
    wrongDate.innerHTML = response;
    compatibilityContainer.classList.add('display-none');
    return;
  }

  const splitDateFirst = calculationDateFirst.split('-');
  const splitDateSecond = calculationDateSecond.split('-');
  const fullDateFirst = `${splitDateFirst[2]}.${splitDateFirst[1]}.${splitDateFirst[0]}`;
  const fullDateSecond = `${splitDateSecond[2]}.${splitDateSecond[1]}.${splitDateSecond[0]}`;

  output2.innerHTML = `${fullDateFirst} + ${fullDateSecond}`;

  const apoint = reduceNumber(+splitDateFirst[2]);
  const bpoint = +splitDateFirst[1];
  const cpoint = calculateYear(+splitDateFirst[0]);
  person = calculatePoints(apoint, bpoint, cpoint);

  const secondApoint = reduceNumber(+splitDateSecond[2]);
  const secondBpoint = +splitDateSecond[1];
  const secondCpoint = calculateYear(+splitDateSecond[0]);
  secondPerson = calculatePoints(secondApoint, secondBpoint, secondCpoint);

  compatibilityContainer.classList.remove('display-none');
  compatibilityContainer.scrollIntoView({ behavior: 'smooth' });
  outputCompatibilityMatrixValues(buildCompatibilityValues());
  clearInputs(inputFirstDate, inputSecondDate);
});

function validateDates(date1, date2) {
  let errorMessage = '';

  if (date1 > today || date2 > today) {
    errorMessage += `<p>Dates can't be in the future.</p>`;
  }

  if (today.getFullYear() - date1.getFullYear() > 120 || today.getFullYear() - date2.getFullYear() > 120) {
    errorMessage += `<p>Dates can't be so far in the past.</p>`;
  }

  const ageDifference = Math.abs(date1.getFullYear() - date2.getFullYear());
  if (ageDifference >= 71) {
    errorMessage += `<p>The age difference is too big.</p>`;
  }

  if (isNaN(date1.getFullYear()) || isNaN(date2.getFullYear())) {
    errorMessage += `<p>Date is not valid or one of the fields is empty.</p>`;
  }

  return errorMessage !== '' ? errorMessage : true;
}
