var burger = document.getElementById('burger');
var mobileMenu = document.getElementById('mobileMenu');
if (burger && mobileMenu) {
  burger.addEventListener('click', function () { mobileMenu.classList.toggle('open'); });
  mobileMenu.addEventListener('click', function (e) { if (e.target.tagName === 'A') mobileMenu.classList.remove('open'); });
}
document.addEventListener('submit', function (e) {
  var form = e.target.closest('form[data-tz]');
  if (!form) return;
  e.preventDefault();
  if (!form.checkValidity()) { form.reportValidity(); return; }
  var ok = document.createElement('div');
  ok.className = 'form-success';
  ok.innerHTML = '<h3>Запрос получен</h3><p>Инженер изучит данные и свяжется с вами в течение рабочего дня. Демо-режим прототипа: данные никуда не отправлены.</p>';
  form.replaceWith(ok);
});

/* ---------- выпадающий поиск из шапки (по всем страницам) ---------- */
var S_CATS = [
  { n: 'Насосы и запасные части', h: 'pumps.html' },
  { n: 'Компрессоры и запасные части', h: 'catalog.html' },
  { n: 'Двигатели и запасные части', h: 'caterpillar.html' },
  { n: 'Фильтры', h: 'filters.html' },
  { n: 'Теплообменники и сепараторы', h: 'filters.html' },
  { n: 'Клапаны и арматура', h: 'valves.html' },
  { n: 'Редукторы, муфты, приводы', h: 'drives.html' },
  { n: 'Уплотнения', h: 'drives.html' },
  { n: 'Горелки, факелы, печи', h: 'catalog.html' },
  { n: 'Масла и смазки', h: 'oils.html' },
  { n: 'РВД и рукава', h: 'catalog.html' },
  { n: 'Свечи зажигания', h: 'oils.html' },
  { n: 'Электродвигатели, автоматика, диагностика', h: 'electro.html' },
  { n: 'Ликвидация разливов нефти (ЛАРН)', h: 'spill.html' },
  { n: 'Катера и вездеходы', h: 'boats.html' }
];
var S_ITEMS = [
  { n: 'Двигатель Caterpillar 3406E', s: '3406E', c: 'Двигатели', h: 'cat-3406e.html', k: 'кат катерпиллер дизель буровая' },
  { n: 'Двигатель Caterpillar 3512', s: '3512', c: 'Двигатели', h: 'cat-3512.html', k: 'v12 буровая' },
  { n: 'Двигатель Caterpillar C27', s: 'C27', c: 'Двигатели', h: 'cat-c27.html', k: 'с27 генерация' },
  { n: 'Насос Grundfos CR 64-2-1', s: 'CR 64-2-1', c: 'Насосы', h: 'pump-grundfos-cr64.html', k: 'грундфос многоступенчатый' },
  { n: 'Насос ЦНС 180-1900', s: 'ЦНС 180-1900', c: 'Насосы', h: 'pump-cns-180-1900.html', k: 'ппд секционный' },
  { n: 'Фильтроэлемент Parker PS-604', s: 'PS-604', c: 'Фильтры', h: 'filter-parker-ps604.html', k: 'паркер сепаратор' },
  { n: 'Теплообменник Alfa Laval M15', s: 'M15', c: 'Теплообмен', h: 'heatex-alfa-m15.html', k: 'альфа лаваль пластинчатый' },
  { n: 'Насосы Sundyne, KSB, Klaus Union', s: 'подбор', c: 'Насосы', h: 'pumps.html', k: 'сандайн ксб клаус юнион netzsch lowara hmd' },
  { n: 'Фильтры Hydac, Facet, Donaldson', s: 'подбор', c: 'Фильтры', h: 'filters.html', k: 'хайдак фасет дональдсон' },
  { n: 'Компрессоры CAMERON, Atlas Copco, Ariel', s: 'подбор', c: 'Компрессоры', h: 'catalog.html', k: 'камерон атлас копко ариэль lmf' },
  { n: 'Теплообменники GEA, Alfa Laval', s: 'подбор', c: 'Теплообмен', h: 'filters.html', k: 'геа сепараторы' },
  { n: 'Уплотнения Eagle Burgmann', s: 'подбор', c: 'Уплотнения', h: 'drives.html', k: 'игл бургман торцевые' },
  { n: 'Клапаны Emerson, Honeywell', s: 'подбор', c: 'Арматура', h: 'valves.html', k: 'эмерсон ханивел' },
  { n: 'Муфты и приводы Flender, Voith', s: 'подбор', c: 'Приводы', h: 'drives.html', k: 'флендер фойт гидромуфты турбопередачи редукторы' },
  { n: 'Горелки John Zink, ZEECO', s: 'подбор', c: 'Печи', h: 'catalog.html', k: 'зик зико факелы окислители' },
  { n: 'Масла Shell, Mobil, Kluber', s: 'подбор', c: 'Расходники', h: 'oils.html', k: 'шелл мобил клюбер смазки rheinol ingersoll' },
  { n: 'Свечи зажигания MWM, Jenbacher, Denso', s: 'подбор', c: 'Расходники', h: 'oils.html', k: 'йенбахер денсо' },
  { n: 'Редукторы SEW-Eurodrive, муфты ESCO', s: 'подбор', c: 'Приводы', h: 'drives.html', k: 'сев евродрайв мотор-редуктор эско муфта' },
  { n: 'Электродвигатели ABB, WEG, VEM', s: 'подбор', c: 'Электро', h: 'electro.html', k: 'абб вег вем электродвигатель siemens simatic сименс' },
  { n: 'Катера Apparel, вездеходы АРХАНТ', s: 'подбор', c: 'Транспорт', h: 'boats.html', k: 'катер аппарель архант снегоболотоход амфибия вездеход' },
  { n: 'Боны и скиммеры ЛАРН', s: 'подбор', c: 'ЛАРН', h: 'spill.html', k: 'бон скиммер разлив нефти ларн' },
  { n: 'Вибромониторинг Bently Nevada', s: 'подбор', c: 'Автоматика', h: 'electro.html', k: 'бентли невада диагностика abb' }
];
var searchPanel = document.getElementById('searchPanel');
var searchBackdrop = document.getElementById('searchBackdrop');
var searchInput = document.getElementById('searchInput');
var searchRes = document.getElementById('searchRes');
function escapeHtml(s) { return s.replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
function catRow(c) { return '<a class="search-item" href="' + c.h + '"><span class="s-name">' + c.n + '</span><span class="s-cat">раздел каталога →</span></a>'; }
function itemRow(d) { return '<a class="search-item" href="' + d.h + '"><span class="s-name">' + d.n + '</span><span class="s-sku">' + d.s + '</span><span class="s-cat">' + d.c + '</span></a>'; }
function renderPanel() {
  if (!searchRes) return;
  var q = searchInput.value.trim().toLowerCase();
  if (!q) { searchRes.innerHTML = '<div class="search-group">Разделы каталога</div>' + S_CATS.map(catRow).join(''); return; }
  var cats = S_CATS.filter(function (c) { return c.n.toLowerCase().indexOf(q) !== -1; });
  var items = S_ITEMS.filter(function (d) { return (d.n + ' ' + d.s + ' ' + d.c + ' ' + (d.k || '')).toLowerCase().indexOf(q) !== -1; });
  var html = '';
  if (cats.length) html += '<div class="search-group">Разделы каталога</div>' + cats.map(catRow).join('');
  if (items.length) html += '<div class="search-group">Позиции и бренды</div>' + items.map(itemRow).join('');
  if (!html) html = '<div class="search-empty">По запросу «' + escapeHtml(searchInput.value.trim()) + '» в демо-базе ничего нет. <a href="request.html">Пришлите артикул — найдём за 24 часа →</a></div>';
  searchRes.innerHTML = html;
}
function openSearch(q) {
  if (!searchPanel) return;
  searchPanel.classList.add('open');
  searchBackdrop.classList.add('open');
  if (typeof q === 'string') searchInput.value = q;
  renderPanel();
  searchInput.focus();
}
function closeSearch() {
  if (!searchPanel) return;
  searchPanel.classList.remove('open');
  searchBackdrop.classList.remove('open');
}
if (searchPanel) {
  var sb = document.getElementById('searchBtn');
  if (sb) sb.addEventListener('click', function () { openSearch(); });
  document.getElementById('searchClose').addEventListener('click', closeSearch);
  searchBackdrop.addEventListener('click', closeSearch);
  searchInput.addEventListener('input', renderPanel);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSearch();
    if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });
  document.querySelectorAll('.search-hint button[data-q]').forEach(function (b) {
    b.addEventListener('click', function () { openSearch(b.dataset.q); });
  });
  var ms = document.getElementById('mobileSearch');
  if (ms) ms.addEventListener('click', function (e) { e.preventDefault(); openSearch(); });
}
