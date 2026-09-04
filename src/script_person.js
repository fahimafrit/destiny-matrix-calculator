'use strict';

const dateInput = document.getElementById('date');
const nameInput = document.getElementById('name');
const container = document.querySelector('.matrix-container');
const btnAnswer = document.getElementById('get_the_answer');
const errorOutput = document.querySelector('.errorOutput');
const outputDate = document.querySelector('.output-personal-date');

setDateBounds(dateInput);

dateInput.value = '';
nameInput.value = '';

let person = {};

function titleCase(str) {
  return str.replace(/^[a-zа-яё]|[\- ][a-zа-яё]/g, (a) => a.toUpperCase());
}

btnAnswer.addEventListener('click', (evt) => {
  evt.preventDefault();

  const calculationDate = dateInput.value;
  const date = new Date(calculationDate);
  const name = nameInput.value;
  const response = validate(date, name);

  outputDate.innerHTML = '';
  errorOutput.innerHTML = '';

  if (response !== true) {
    errorOutput.innerHTML = response;
    container.classList.add('display-none');
    return;
  }

  const splitDate = calculationDate.split('-');
  const fullDate = `${splitDate[2]}.${splitDate[1]}.${splitDate[0]}`;

  outputDate.innerHTML = `${titleCase(name)} <span class="gray">Date of Birth:</span> ${fullDate}`;

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
  const today = new Date();
  const nameValid = new RegExp('^[а-яё\\- ]*[a-z\\- ]*$', 'i');

  if (name === '' || isNaN(date.getFullYear())) {
    errorMessage += `<p>Date is not valid or one of the fields is empty.</p>`;
  }

  if (date > today) {
    errorMessage += `<p>Date can't be in the future.</p>`;
  }

  if (today.getFullYear() - date.getFullYear() > MAX_AGE_YEARS) {
    errorMessage += `<p>Date can't be so far in the past.</p>`;
  }

  if (!nameValid.test(name)) {
    errorMessage += `<p>Name format is incorrect: allowed characters are letters, dash and space. Example: Anna, Anna-Maria, Anna Maria.</p>`;
  }

  return errorMessage !== '' ? errorMessage : true;
}
