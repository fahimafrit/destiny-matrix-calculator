'use strict';

const dateInput = document.getElementById('date');
const nameInput = document.getElementById('name');
const container = document.querySelector('.matrix-container');
const btnAnswer = document.getElementById('get_the_answer');
const errorOutput = document.querySelector('.errorOutput');
const outputDate = document.querySelector('.output-personal-date');

dateInput.value = '';
nameInput.value = '';

let person = {};

function titleCase(str) {
  return str.replace(/^[a-zа-яё]|[\- ][a-zа-яё]/g, (a) => a.toUpperCase());
}

// ─── DD/MM/YYYY TEXT MASK ───────────────────────────────────────────────────
// Auto-inserts slashes as the person types digits, so the box always reads
// DD/MM/YYYY regardless of browser/OS locale (native <input type="date">
// ignores the lang attribute in most browsers, so a masked text input is
// used instead).

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

dateInput.addEventListener('input', maskDateInput);

// Parses a "DD/MM/YYYY" string into { day, month, year } (numbers), or
// null if the string isn't in that shape yet.
function parseDdMmYyyy(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  return { day: +dd, month: +mm, year: +yyyy };
}

btnAnswer.addEventListener('click', (evt) => {
  evt.preventDefault();

  const calculationDate = dateInput.value;
  const name = nameInput.value;
  runCalculation(calculationDate, name);
});

function runCalculation(calculationDate, name, { updateUrl = true } = {}) {
  const parsed = parseDdMmYyyy(calculationDate);
  const date = parsed ? new Date(parsed.year, parsed.month - 1, parsed.day) : new Date(NaN);
  const dateIsValid = isValidCalendarDate(parsed, date);
  const response = validate(date, name, parsed, dateIsValid);

  outputDate.innerHTML = '';
  errorOutput.innerHTML = '';

  if (response !== true) {
    errorOutput.innerHTML = response;
    container.classList.add('display-none');
    return;
  }

  const fullDate = `${String(parsed.day).padStart(2, '0')}.${String(parsed.month).padStart(2, '0')}.${parsed.year}`;

  outputDate.innerHTML = `${titleCase(name)} <span class="gray">Date of Birth:</span> ${fullDate}`;

  container.classList.remove('display-none');
  container.scrollIntoView({ behavior: 'smooth' });

  const apoint = reduceNumber(parsed.day); // day of birth
  const bpoint = parsed.month; // month of birth
  const cpoint = calculateYear(parsed.year); // year of birth

  person = calculatePoints(apoint, bpoint, cpoint);

  renderValues(person.points);
  ChartHeart(person.chartHeart);
  renderValues(person.purposes);
  renderValues(person.years);
  renderInterpretations(person);

  // Same page, no reload/new page — just swap the shareable URL in place.
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set('dob', calculationDate.replace(/\//g, '-'));
    url.searchParams.set('name', name);
    window.history.pushState({}, '', url);
  }

  clearInputs(dateInput, nameInput);
}

function validate(date, name, parsed, dateIsValid) {
  let errorMessage = '';
  const today = new Date();
  const nameValid = new RegExp('^[а-яё\\- ]*[a-z\\- ]*$', 'i');

  if (name === '' || !parsed || !dateIsValid) {
    errorMessage += `<p>Date is not valid or one of the fields is empty. Use DD/MM/YYYY.</p>`;
  }

  if (parsed && dateIsValid && (date > today)) {
    errorMessage += `<p>Date can't be in the future.</p>`;
  }

  if (!nameValid.test(name)) {
    errorMessage += `<p>Name format is incorrect: allowed characters are letters, dash and space. Example: Anna, Anna-Maria, Anna Maria.</p>`;
  }

  return errorMessage !== '' ? errorMessage : true;
}

// If the page is opened with ?d=DD-MM-YYYY&name=... in the URL (e.g. a
// shared link), fill the inputs and calculate immediately — no click required.
(function calculateFromUrlIfPresent() {
  const params = new URLSearchParams(window.location.search);
  const dFromUrl = params.get('dob');
  const nameFromUrl = params.get('name');

  if (dFromUrl && nameFromUrl) {
    const dobFromUrl = dFromUrl.replace(/-/g, '/');
    dateInput.value = dobFromUrl;
    nameInput.value = nameFromUrl;
    runCalculation(dobFromUrl, nameFromUrl, { updateUrl: false });
  }
})();