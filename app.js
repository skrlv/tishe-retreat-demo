import { ROOMS, localToday, addDays, calculateStay, money, plural } from './stay.js';
const $ = id => document.getElementById(id);
const form = $('stay-form'), arrival = $('arrival'), departure = $('departure'), guests = $('guests'), roomSelect = $('room');
const roomDialog = $('room-dialog'), estimateDialog = $('estimate-dialog');
let selectedRoom = 'forest';
let opener;
const today = localToday();
arrival.min = today;
arrival.value = addDays(today, 14);
departure.min = addDays(arrival.value, 1);
departure.value = addDays(today, 17);
arrival.addEventListener('change', () => {
  if (arrival.value) {
    try {
      departure.min = addDays(arrival.value, 1);
      if (departure.value && departure.value <= arrival.value) departure.value = addDays(arrival.value, 1);
    } catch { /* Invalid date remains visible for the form's explicit validation. */ }
  }
  $('form-error').textContent = '';
});
form.addEventListener('input', () => { $('form-error').textContent = ''; });
function showDialog(dialog, trigger) {
  opener = trigger instanceof HTMLElement ? trigger : document.activeElement;
  dialog.showModal();
}
function closeDialog(dialog) {
  dialog.close();
}
for (const dialog of [roomDialog, estimateDialog]) {
  dialog.querySelector('.dialog-close').addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog(dialog);
  });
  dialog.addEventListener('close', () => {
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });
}
for (const button of document.querySelectorAll('[data-room-details]')) {
  button.addEventListener('click', () => {
    selectedRoom = button.dataset.roomDetails;
    const room = ROOMS[selectedRoom];
    $('room-dialog-image').src = room.image;
    $('room-dialog-image').alt = room.alt;
    $('room-dialog-meta').textContent = `${room.area} М² / ДО ${room.capacity} ГОСТЕЙ`;
    $('room-dialog-title').textContent = room.title;
    $('room-dialog-text').textContent = room.description;
    $('room-dialog-features').replaceChildren(...room.features.map(feature => { const item = document.createElement('li'); item.textContent = feature; return item; }));
    $('room-dialog-price').textContent = `${money(room.rate)} / ночь`;
    showDialog(roomDialog, button);
  });
}
$('choose-room').addEventListener('click', () => {
  roomSelect.value = selectedRoom;
  opener = roomSelect;
  closeDialog(roomDialog);
  $('plan').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  roomSelect.focus({ preventScroll: true });
});
const dateLabel = value => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
form.addEventListener('submit', event => {
  event.preventDefault();
  $('form-error').textContent = '';
  try {
    const stay = calculateStay({ arrival: arrival.value, departure: departure.value, guests: guests.value, roomId: roomSelect.value });
    $('estimate-room').textContent = stay.room.title;
    const lines = [ ['Заезд', dateLabel(stay.arrival)], ['Выезд', dateLabel(stay.departure)], ['Продолжительность', `${stay.nights} ${plural(stay.nights, 'ночь', 'ночи', 'ночей')}`], ['Гости', `${stay.guests} ${plural(stay.guests, 'гость', 'гостя', 'гостей')}`], ['Цена за ночь', money(stay.rate)] ];
    $('estimate-lines').replaceChildren(...lines.map(([key, value]) => { const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = key; dd.textContent = value; row.append(dt, dd); return row; }));
    $('estimate-total').textContent = money(stay.total);
    showDialog(estimateDialog, form.querySelector('button[type="submit"]'));
  } catch (error) {
    $('form-error').textContent = error.message;
  }
});
$('edit-estimate').addEventListener('click', () => { opener = arrival; closeDialog(estimateDialog); arrival.focus({ preventScroll: true }); });
