'use strict';

const dateInput = document.getElementById('date');
const nameInput = document.getElementById('name');
const container = document.querySelector('.matrix-container');
const btnAnswer = document.getElementById('get_the_answer');

const today = new Date();

// disallow future dates and dates older than 120 years
document.getElementById('date').setAttribute('max', today.toLocaleDateString('en-CA'));
const ancientDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDay());
document.getElementById('date').setAttribute('min', ancientDate.toLocaleDateString('en-CA'));

dateInput.value = '';
nameInput.value = '';

let person = {};

function titleCase(str) {
  return str.replace(/^[a-zа-яё]|[\- ][a-zа-яё]/g, (a) => a.toUpperCase());
}

btnAnswer.addEventListener('click', (evt) => {
  evt.preventDefault();

  const date = new Date(document.getElementById('date').value);
  const calculationDate = document.getElementById('date').value;
  const name = document.getElementById('name').value;
  const errorOutput = document.querySelector('.errorOutput');
  const output = document.querySelector('.output-personal-date');
  const response = validate(date, name);

  output.innerHTML = '';
  errorOutput.innerHTML = '';

  const splitDate = calculationDate.split('-');
  const fullDate = `${splitDate[2]}.${splitDate[1]}.${splitDate[0]}`;

  if (response !== true) {
    errorOutput.innerHTML = response;
    container.classList.add('display-none');
    return;
  }

  output.innerHTML = `${titleCase(name)} <span class="gray">Date of Birth:</span> ${fullDate}`;

  container.classList.remove('display-none');
  container.scrollIntoView({ behavior: 'smooth' });

  const apoint = reduceNumber(+splitDate[2]); // day of birth
  const bpoint = +splitDate[1]; // month of birth
  const year = +splitDate[0]; // year of birth
  const cpoint = calculateYear(year);

  person = calculatePoints(apoint, bpoint, cpoint);

  renderValues(person.points);
  ChartHeart(person.chartHeart);
  renderValues(person.purposes);
  renderValues(person.years);
  renderInterpretations(person);
  clearInputs(dateInput, nameInput);
});

function validate(date, name) {
  let errorMessage = '';
  const nameValid = new RegExp('^[а-яё\\- ]*[a-z\\- ]*$', 'i');

  if (name === '' || isNaN(date.getFullYear())) {
    errorMessage += `<p>Date is not valid or one of the fields is empty.</p>`;
  }

  if (date > today) {
    errorMessage += `<p>Date can't be in the future.</p>`;
  }

  if (today.getFullYear() - date.getFullYear() > 120) {
    errorMessage += `<p>Date can't be so far in the past.</p>`;
  }

  if (!nameValid.test(name)) {
    errorMessage += `<p>Name format is incorrect: allowed characters are letters, dash and space. Example: Anna, Anna-Maria, Anna Maria.</p>`;
  }

  return errorMessage !== '' ? errorMessage : true;
}
