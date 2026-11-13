import { ROOMS, localToday, addDays, calculateStay, money, plural } from './stay.js';
const $ = id => document.getElementById(id);
const form = $('stay-form'), arrival = $('arrival'), departure = $('departure'), guests = $('guests'), roomSelect = $('room');
const roomDialog = $('room-dialog'), estimateDialog = $('estimate-dialog');
let selectedRoom = 'forest';
const openers = new WeakMap();
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
  openers.set(dialog, trigger instanceof HTMLElement ? trigger : document.activeElement);
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
    const trigger = openers.get(dialog);
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
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
  openers.set(roomDialog, roomSelect);
  updateStayPreview();
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
    $('form-error').focus({ preventScroll: true });
  }
});
$('edit-estimate').addEventListener('click', () => { openers.set(estimateDialog, arrival); closeDialog(estimateDialog); arrival.focus({ preventScroll: true }); });


// The preview is an estimate only; the same validated calculation drives both views.
function updateStayPreview() {
  try {
    const stay = calculateStay({ arrival: arrival.value, departure: departure.value, guests: guests.value, roomId: roomSelect.value });
    $('stay-preview').textContent = `${stay.nights} ${plural(stay.nights, 'ночь', 'ночи', 'ночей')} · ${stay.guests} ${plural(stay.guests, 'гость', 'гостя', 'гостей')} · ${money(stay.total)} за дом`;
  } catch {
    $('stay-preview').textContent = 'Выберите подходящие даты, дом и количество гостей.';
  }
}
form.addEventListener('change', updateStayPreview);
updateStayPreview();

// All three stories remain readable without JavaScript. Tabs enhance the layout only.
const rhythmTabs = [...document.querySelectorAll('[data-rhythm]')];
const rhythmPanels = [...document.querySelectorAll('[data-rhythm-panel]')];
function selectRhythm(key, moveFocus = false) {
  for (const tab of rhythmTabs) {
    const active = tab.dataset.rhythm === key;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && moveFocus) tab.focus({ preventScroll: true });
  }
  for (const panel of rhythmPanels) {
    const active = panel.dataset.rhythmPanel === key;
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
    panel.tabIndex = active ? 0 : -1;
  }
}
for (const [index, tab] of rhythmTabs.entries()) {
  tab.addEventListener('click', () => selectRhythm(tab.dataset.rhythm));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % rhythmTabs.length;
    if (event.key === 'ArrowLeft') next = (index + rhythmTabs.length - 1) % rhythmTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = rhythmTabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectRhythm(rhythmTabs[next].dataset.rhythm, true);
  });
}
document.querySelector('.rhythm-tabs').hidden = false;
selectRhythm('morning');

// Motion never gates content: targets are visible before the optional entrance plays.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-revealed');
      reveal.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  for (const target of document.querySelectorAll('.intro, .section-head, .room-card, .ritual-content, .gallery figure, .gallery-quote, .faq-list, .closing h2')) reveal.observe(target);
  reducedMotion.addEventListener('change', event => { if (event.matches) reveal.disconnect(); });
}
let progressQueued = false;
function updateReadingProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  document.documentElement.style.setProperty('--reading-progress', String(max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0));
  progressQueued = false;
}
function queueReadingProgress() {
  if (progressQueued) return;
  progressQueued = true;
  requestAnimationFrame(updateReadingProgress);
}
addEventListener('scroll', queueReadingProgress, { passive: true });
addEventListener('resize', queueReadingProgress);
updateReadingProgress();
