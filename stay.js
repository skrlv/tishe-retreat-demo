export const ROOMS = Object.freeze({
  forest: { title: 'Лесной дом', rate: 11900, capacity: 2, area: 32, image: 'assets/cabin.jpg', alt: 'Деревянный дом среди деревьев', description: 'Уютный дом для двух человек. Дерево, мягкий текстиль и собственная терраса, с которой можно смотреть на лес сколько угодно.', features: ['Спальная зона с большой кроватью', 'Кухонный уголок и посуда', 'Душевая и тёплый пол', 'Терраса для неспешных завтраков'] },
  lake: { title: 'Дом у воды', rate: 15900, capacity: 2, area: 44, image: 'assets/interior.jpg', alt: 'Спокойный светлый интерьер с натуральными материалами', description: 'Пространство, в котором много воздуха и света. Большая гостиная, уголок для чтения и ощущение, что день наконец принадлежит вам.', features: ['Отдельная спальня с большой кроватью', 'Гостиная с местом для чтения', 'Кухня и обеденный стол', 'Панорамные окна и терраса'] },
  family: { title: 'Большой дом', rate: 19900, capacity: 4, area: 68, image: 'assets/suite.jpg', alt: 'Просторная спальня с мягким текстилем', description: 'Дом для небольшого круга близких. Две спальни и общая гостиная, где приятно собираться вечером, готовить вместе и не смотреть на часы.', features: ['Две отдельные спальни', 'Кухня и большой общий стол', 'Гостиная для настольных игр', 'Просторная терраса'] },
});
const DAY = 86400000;
export function parseDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000 || year > 9999) return null;
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? time : null;
}
export function localToday(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function addDays(value, days) {
  const time = parseDay(value);
  if (time === null || !Number.isInteger(days)) throw new Error('Некорректная дата');
  return new Date(time + days * DAY).toISOString().slice(0, 10);
}
export function calculateStay({ arrival, departure, guests, roomId, today = localToday() }) {
  const room = ROOMS[roomId];
  if (!room) throw new Error('Выберите дом из списка.');
  const start = parseDay(arrival), end = parseDay(departure), present = parseDay(today);
  if (start === null || end === null || present === null) throw new Error('Укажите корректные даты заезда и выезда.');
  if (start < present) throw new Error('Дата заезда не может быть в прошлом.');
  const nights = (end - start) / DAY;
  if (nights < 1) throw new Error('Выезд должен быть хотя бы на день позже заезда.');
  if (nights > 30) throw new Error('Для демонстрационного расчёта выберите от 1 до 30 ночей.');
  const count = Number(guests);
  if (!Number.isInteger(count) || count < 1 || count > 4) throw new Error('Выберите от 1 до 4 гостей.');
  if (count > room.capacity) throw new Error(`«${room.title}» рассчитан максимум на ${room.capacity} гостей. Для 3–4 гостей выберите Большой дом.`);
  return { roomId, room, arrival, departure, guests: count, nights, rate: room.rate, total: nights * room.rate };
}
export const money = value => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);
export const plural = (value, one, few, many) => value % 100 >= 11 && value % 100 <= 14 ? many : value % 10 === 1 ? one : value % 10 >= 2 && value % 10 <= 4 ? few : many;
