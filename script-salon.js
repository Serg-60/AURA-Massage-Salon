  /* ── CURSOR (тільки для пристроїв з мишею) ── */
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const cur = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!isTouch) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function loop() {
      rx += (mx - rx) * .14;
      ry += (my - ry) * .14;
      cur.style.left = mx + 'px';
      cur.style.top = my + 'px';
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(loop);
    })();
  }

  /* ── SLIDER ── */
  const slides = document.querySelectorAll('.slide');
  const pbs = document.querySelectorAll('.pb');
  let cur_ = 0, timer;

  function resetPB(i) {
    const fill = pbs[i].querySelector('.pb-fill');
    fill.style.transition = 'none';
    fill.style.width = '0%';
    pbs[i].classList.remove('active');
    void fill.offsetWidth; // reflow
  }

  function activatePB(i) {
    const fill = pbs[i].querySelector('.pb-fill');
    fill.style.transition = 'none';
    fill.style.width = '0%';
    pbs[i].classList.add('active');
    void fill.offsetWidth; /* примусовий reflow — браузер фіксує width:0% */
    fill.style.transition = 'width 30s linear';
    fill.style.width = '100%';
  }

  function goTo(n) {
    slides[cur_].classList.remove('active');
    resetPB(cur_);
    cur_ = n;
    slides[cur_].classList.add('active');
    activatePB(cur_);
    clearInterval(timer);
    timer = setInterval(next, 30000);
  }

  function next() { goTo((cur_ + 1) % slides.length); }

  activatePB(0);
  timer = setInterval(next, 30000);

  /* ── MODAL ── */
  function openModal() {
    /* заморозити фон без стрибка */
    var scrollY = window.scrollY;
    document.body.style.top = '-' + scrollY + 'px';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    document.getElementById('modalBg').classList.add('open');
    document.getElementById('formView').style.display = 'block';
    document.getElementById('successView').classList.remove('show');

    if (!bkInitDone) { bkInit(); bkInitDone = true; }

    /* очистити послугу, дату і час при кожному відкритті */
    document.getElementById('bkService').value = '';
    bkSelDate = null;
    bkSelTime = null;
    var now = new Date(); bkCalY = now.getFullYear(); bkCalM = now.getMonth();
    bkRenderCal();
    document.getElementById('bkTimeWrap').innerHTML = '<div class="bk-no-date">Спочатку оберіть дату</div>';
    document.getElementById('bkSummary').classList.remove('show');
  }
  function closeModal() {
    document.getElementById('modalBg').classList.remove('open');
    /* відновити скрол сторінки */
    var scrollY = parseInt(document.body.style.top || '0') * -1;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, scrollY);
  }
  function handleBgClick(e) {
    if (e.target === document.getElementById('modalBg')) closeModal();
  }

  /* ── BOOKING FORM LOGIC ── */
  var bkInitDone = false;
  var bkSelDate = null;
  var bkSelTime = null;
  var bkCalY, bkCalM;

  var BK_SCHEDULE = {
    0: null,
    1: { open: '09:00', close: '21:00', step: 60 },
    2: { open: '09:00', close: '21:00', step: 60 },
    3: { open: '09:00', close: '21:00', step: 60 },
    4: { open: '09:00', close: '21:00', step: 60 },
    5: { open: '09:00', close: '21:00', step: 60 },
    6: { open: '10:00', close: '20:00', step: 60 }
  };
  var BK_BOOKED = {
    /* ЗМІНИТИ — формат: 'РРРР-ММ-ДД': ['ГГ:ХХ',...] */
  };
  var BK_MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];

  function bkInit() {
    var now = new Date();
    bkCalY = now.getFullYear(); bkCalM = now.getMonth();
    bkRenderCal();
    document.getElementById('bkCalPrev').addEventListener('click', function () {
      var n = new Date(); if (bkCalY === n.getFullYear() && bkCalM === n.getMonth()) return;
      bkCalM--; if (bkCalM < 0) { bkCalM = 11; bkCalY--; } bkRenderCal();
    });
    document.getElementById('bkCalNext').addEventListener('click', function () {
      bkCalM++; if (bkCalM > 11) { bkCalM = 0; bkCalY++; } bkRenderCal();
    });
    document.getElementById('bkName').addEventListener('blur', bkValName);
    document.getElementById('bkPhone').addEventListener('blur', bkValPhone);
    document.getElementById('bkName').addEventListener('input', function () { if (this.classList.contains('bk-error')) bkValName(); });
    document.getElementById('bkPhone').addEventListener('input', function () { if (this.classList.contains('bk-error')) bkValPhone(); });
    document.getElementById('bkService').addEventListener('change', bkUpdateSummary);
  }

  function bkFmtDate(y, m, d) { return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d; }

  function bkGetSlots(dateStr, dow) {
    var sc = BK_SCHEDULE[dow]; if (!sc) return [];
    var slots = [], o = sc.open.split(':').map(Number), c = sc.close.split(':').map(Number);
    var cur = o[0] * 60 + o[1], end = c[0] * 60 + c[1];
    while (cur < end) { var h = Math.floor(cur / 60), mn = cur % 60; slots.push((h < 10 ? '0' : '') + h + ':' + (mn < 10 ? '0' : '') + mn); cur += sc.step || 60; }
    return slots;
  }

  function bkRenderCal() {
    document.getElementById('bkCalTitle').textContent = BK_MONTHS[bkCalM] + ' ' + bkCalY;
    var grid = document.getElementById('bkCalGrid'); grid.innerHTML = '';
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var fd = new Date(bkCalY, bkCalM, 1).getDay(), off = (fd + 6) % 7;
    var dim = new Date(bkCalY, bkCalM + 1, 0).getDate();
    for (var i = 0; i < off; i++) { var e = document.createElement('div'); e.className = 'bk-cal-cell empty'; grid.appendChild(e); }
    for (var d = 1; d <= dim; d++) {
      var cell = document.createElement('div'); cell.className = 'bk-cal-cell'; cell.textContent = d;
      var dt = new Date(bkCalY, bkCalM, d); dt.setHours(0, 0, 0, 0);
      var dow = dt.getDay(), ds = bkFmtDate(bkCalY, bkCalM + 1, d);
      if (dt < today) { cell.classList.add('past'); }
      else if (!BK_SCHEDULE[dow]) { cell.classList.add('bk-off'); }
      else {
        var slots = bkGetSlots(ds, dow), booked = BK_BOOKED[ds] || [];
        var free = slots.some(function (t) { return booked.indexOf(t) === -1; });
        if (!free) { cell.classList.add('bk-off'); cell.title = 'День повністю заброньовано'; }
        else {
          cell.classList.add('bk-available');
          if (dt.getTime() === today.getTime()) cell.classList.add('bk-today');
          if (ds === bkSelDate) cell.classList.add('bk-selected');
          cell.addEventListener('click', (function (s, dw) {
            return function () {
              if (bkSelDate === s) {
                /* повторний клік — скидаємо вибір */
                bkSelDate = null; bkSelTime = null;
                bkRenderCal();
                document.getElementById('bkTimeWrap').innerHTML = '<div class="bk-no-date">Спочатку оберіть дату</div>';
                bkUpdateSummary();
              } else {
                bkSelDate = s; bkSelTime = null;
                bkHideErr('bkDateErr'); bkRenderCal(); bkRenderSlots(s, dw); bkUpdateSummary();
              }
            };
          })(ds, dow));
        }
      }
      grid.appendChild(cell);
    }
  }

  function bkRenderSlots(dateStr, dow) {
    var wrap = document.getElementById('bkTimeWrap'), slots = bkGetSlots(dateStr, dow), booked = BK_BOOKED[dateStr] || [];
    var now = new Date(), todayStr = bkFmtDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
    if (!slots.length) { wrap.innerHTML = '<div class="bk-no-date">Вихідний день</div>'; return; }
    var g = document.createElement('div'); g.className = 'bk-time-grid';
    slots.forEach(function (t) {
      var btn = document.createElement('div'); btn.className = 'bk-time-slot'; btn.textContent = t;
      var past = false; if (dateStr === todayStr) { var p = t.split(':').map(Number); if (p[0] * 60 + p[1] <= now.getHours() * 60 + now.getMinutes()) past = true; }
      if (booked.indexOf(t) !== -1 || past) { btn.classList.add('booked'); }
      else {
        if (t === bkSelTime) btn.classList.add('bk-sel');
        btn.addEventListener('click', (function (time) { return function () { bkSelTime = time; document.querySelectorAll('.bk-time-slot').forEach(function (el) { if (!el.classList.contains('booked')) el.classList.toggle('bk-sel', el.textContent === time); }); bkUpdateSummary(); }; })(t));
      }
      g.appendChild(btn);
    });
    wrap.innerHTML = ''; wrap.appendChild(g);
  }

  function bkUpdateSummary() {
    var sum = document.getElementById('bkSummary'), txt = document.getElementById('bkSummaryText');
    var parts = [];
    if (bkSelDate) { var d = new Date(bkSelDate + 'T00:00:00'); parts.push('<strong>' + d.getDate() + ' ' + BK_MONTHS[d.getMonth()] + '</strong>'); }
    if (bkSelTime) parts.push('о <strong>' + bkSelTime + '</strong>');
    var sv = document.getElementById('bkService').value;
    if (sv) parts.push('&mdash; ' + document.getElementById('bkService').options[document.getElementById('bkService').selectedIndex].text.split(' — ')[0]);
    if (parts.length) { txt.innerHTML = parts.join(' '); sum.classList.add('show'); }
    else sum.classList.remove('show');
  }

  function bkShowErr(id) { document.getElementById(id).classList.add('show'); }
  function bkHideErr(id) { document.getElementById(id).classList.remove('show'); }

  function bkValName() {
    var v = document.getElementById('bkName').value.trim();
    if (!v) { bkShowErr('bkNameErr'); document.getElementById('bkName').classList.add('bk-error'); return false; }
    bkHideErr('bkNameErr'); document.getElementById('bkName').classList.remove('bk-error'); return true;
  }
  function bkValPhone() {
    var p = document.getElementById('bkPhone').value.trim().replace(/[\s\-\(\)]/g, '');
    if (!/^(\+?38)?0\d{9}$/.test(p)) { bkShowErr('bkPhoneErr'); document.getElementById('bkPhone').classList.add('bk-error'); return false; }
    bkHideErr('bkPhoneErr'); document.getElementById('bkPhone').classList.remove('bk-error'); return true;
  }

  function bkSubmit() {
    var ok = bkValName() & bkValPhone();
    if (!ok) return;
    var btn = document.getElementById('bkSubmitBtn');
    btn.classList.add('bk-loading'); btn.disabled = true;
    setTimeout(function () {
      btn.classList.remove('bk-loading'); btn.disabled = false;
      var name = document.getElementById('bkName').value.trim();
      var sv = document.getElementById('bkService');
      var svcName = sv.value ? sv.options[sv.selectedIndex].text.split(' — ')[0] : '';
      var rows = '<div class="bk-sdr"><strong>Клiєнт:</strong>' + name + '</div>';
      if (svcName) rows += '<div class="bk-sdr"><strong>Послуга:</strong>' + svcName + '</div>';
      if (bkSelDate) { var d = new Date(bkSelDate + 'T00:00:00'); rows += '<div class="bk-sdr"><strong>Дата:</strong>' + d.getDate() + ' ' + BK_MONTHS[d.getMonth()] + ' ' + d.getFullYear() + '</div>'; }
      if (bkSelTime) rows += '<div class="bk-sdr"><strong>Час:</strong>' + bkSelTime + '</div>';
      document.getElementById('bkSuccessDetail').innerHTML = rows;

      /* очистити всі поля після відправки */
      document.getElementById('bkName').value = '';
      document.getElementById('bkPhone').value = '';
      document.getElementById('bkService').value = '';
      bkSelDate = null; bkSelTime = null;
      var now = new Date(); bkCalY = now.getFullYear(); bkCalM = now.getMonth();
      bkRenderCal();
      document.getElementById('bkTimeWrap').innerHTML = '<div class="bk-no-date">Спочатку оберіть дату</div>';
      document.getElementById('bkSummary').classList.remove('show');
      ['bkNameErr', 'bkPhoneErr', 'bkDateErr'].forEach(function (id) { bkHideErr(id); });
      document.getElementById('bkName').classList.remove('bk-error');
      document.getElementById('bkPhone').classList.remove('bk-error');

      document.getElementById('formView').style.display = 'none';
      document.getElementById('successView').classList.add('show');
      setTimeout(closeModal, 4000);
    }, 1200);
  }

  /* скидати помилки при введенні */
  document.addEventListener('DOMContentLoaded', function () {
    var ni = document.getElementById('nameInput'), pi = document.getElementById('phoneInput');
    if (ni) ni.addEventListener('input', function () { this.style.borderColor = ''; document.getElementById('nameError') && document.getElementById('nameError').classList.remove('visible'); });
    if (pi) pi.addEventListener('input', function () { this.style.borderColor = ''; document.getElementById('phoneError') && document.getElementById('phoneError').classList.remove('visible'); });
  });

  /* ── CERTIFICATES ZOOM ── */
  function openCert(card) {
    const img = card.querySelector('.cert-img');
    const overlay = document.getElementById('certOverlay');
    document.getElementById('certZoomImg').src = img.src;
    document.getElementById('certZoomImg').alt = img.alt;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCert() {
    document.getElementById('certOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── SERVICE PANEL DATA ── */
  const SERVICES = [
    {
      tag: '✦ Послуга 01',
      title: 'Класичний релакс',
      dur: '60 хв — 90 хв',
      desc: 'Класичний масаж — це мистецтво глибокого розслаблення. Майстер працює з кожним м\'язом тіла, використовуючи натуральні ароматичні олії холодного віджиму. Плавні, ритмічні рухи знімають напругу, що накопичилась від стресу, покращують кровообіг та лімфоток, повертаючи тілу природну легкість і гармонію.',
      includes: ['Консультація перед сеансом', 'Ароматичні масажні олії', 'Прогрівання м\'язів', 'Робота з тригерними точками', 'Чай та вода після сеансу'],
      price: '800 грн',
      priceSub: '/ 60 хв · 1100 грн / 90 хв',
      imgs: [
        'https://images.unsplash.com/photo-1741522509407-41cfe73b0b75?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDl8fHxlbnwwfHx8fHw%3D',
        'https://plus.unsplash.com/premium_photo-1661266827214-f758639ed8ab?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzkxfHwlRDAlQkElRDElOTYlRDAlQkMlRDAlQkQlRDAlQjAlRDElODIlRDAlQjglMjAlRDAlQkMlRDAlQjAlRDElODElRDAlQjAlRDAlQjYlRDAlQkQlRDAlQkUlRDAlQjMlRDAlQkUlMjAlRDElODElRDAlQjAlRDAlQkIlRDAlQkUlRDAlQkQlRDElODN8ZW58MHx8MHx8fDA%3Dhttps://images.unsplash.com/photo-1775133262667-316bd4d9e5b5?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1745327883508-b6cd32e5dde5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDl8fHxlbnwwfHx8fHw%3D',
      ]
    },
    {
      tag: '✦ Послуга 02',
      title: 'Тайський ритуал',
      dur: '90 хв — 120 хв',
      desc: 'Стародавня техніка Нуад Боран, якій понад 2500 років. Поєднує глибоку акупресуру вздовж енергетичних ліній тіла з пасивними йога-розтяжками. Не використовує олій — майстер працює через бавовняний одяг, відновлюючи вільний рух енергії, знімаючи блоки та дарую відчуття абсолютної свободи і легкості.',
      includes: ['Традиційний тайський одяг', 'Акупресура меридіанів', 'Йога-розтяжка тіла', 'Робота з суглобами', 'Медитативна музика', 'Трав\'яний чай після сеансу'],
      price: '1200 грн',
      priceSub: '/ 90 хв · 1600 грн / 120 хв',
      imgs: [
        'https://images.unsplash.com/photo-1749131871347-6d211039ac3e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTU5fHwlRDElODIlRDAlQjAlRDAlQjklRDElODElRDElOEMlRDAlQkElRDAlQjglRDAlQjklMjAlRDAlQkMlRDAlQjAlRDElODElRDAlQjAlRDAlQjZ8ZW58MHx8Mnx8fDA%3D',
        'https://images.unsplash.com/photo-1611073615848-d6ff6215931f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzQ5fHwlRDAlQkElRDElOTYlRDAlQkMlRDAlQkQlRDAlQjAlRDElODIlRDAlQjglMjAlRDAlQkMlRDAlQjAlRDElODElRDAlQjAlRDAlQjYlRDAlQkQlRDAlQkUlRDAlQjMlRDAlQkUlMjAlRDElODElRDAlQjAlRDAlQkIlRDAlQkUlRDAlQkQlRDElODN8ZW58MHx8Mnx8fDA%3D',
        'https://images.unsplash.com/photo-1706795033735-823bb5fde87b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTZ8fCVEMCVCQSVEMSU5NiVEMCVCQyVEMCVCRCVEMCVCMCVEMSU4MiVEMCVCOCUyMCVEMCVCQyVEMCVCMCVEMSU4MSVEMCVCMCVEMCVCNiVEMCVCRCVEMCVCRSVEMCVCMyVEMCVCRSUyMCVEMSU4MSVEMCVCMCVEMCVCQiVEMCVCRSVEMCVCRCVEMSU4M3xlbnwwfHwwfHx8MA%3D%3D',
      ]
    },
    {
      tag: '✦ Послуга 03',
      title: 'Масаж гарячим камінням',
      dur: '75 хв — 105 хв',
      desc: 'Вулканічні базальтові камені, прогріті до ідеальної температури 50–55°С, стають продовженням рук майстра. Тепло проникає на глибину 3–4 см, де не дістає звичайний масаж, розслаблюючи найглибші шари м\'язів. Поєднання тепла, ваги та техніки знімає хронічні затискання і дарує відчуття повного оновлення.',
      includes: ['Базальтові вулканічні камені', 'Масажні олії з ефірними есенціями', 'Прогрівання спини та кінцівок', 'Точковий масаж лиця', 'Ароматерапія', 'Чай та снек після сеансу'],
      price: '1400 грн',
      priceSub: '/ 75 хв · 1900 грн / 105 хв',
      imgs: [
        'https://plus.unsplash.com/premium_photo-1661306458301-79601a9d2696?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDM2fHx8ZW58MHx8fHx8',
        'https://images.unsplash.com/photo-1696841212541-449ca29397cc?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1610402601271-5b4bd5b3eba4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDJ8fHxlbnwwfHx8fHw%3D',
      ]
    }
  ];

  let spCurImg = 0;
  let spCurService = 0;

  function openService(idx) {
    spCurService = idx;
    spCurImg = 0;
    const s = SERVICES[idx];

    document.getElementById('spTag').textContent = s.tag;
    document.getElementById('spTitle').textContent = s.title;
    document.getElementById('spDur').textContent = s.dur;
    document.getElementById('spDesc').textContent = s.desc;
    document.getElementById('spPrice').textContent = s.price;
    document.getElementById('spPriceSub').textContent = s.priceSub;

    // includes
    const inc = document.getElementById('spIncludes');
    inc.innerHTML = s.includes.map(i => `<div class="sp-include-item">${i}</div>`).join('');

    // images
    const imgs = ['spImg0', 'spImg1', 'spImg2'];
    imgs.forEach((id, i) => {
      const el = document.getElementById(id);
      el.style.backgroundImage = `url('${s.imgs[i] || s.imgs[0]}')`;
      el.classList.toggle('active', i === 0);
    });

    // thumbs
    const thumbsEl = document.getElementById('spThumbs');
    thumbsEl.innerHTML = s.imgs.map((url, i) =>
      `<div class="sp-thumb ${i === 0 ? 'active' : ''}" style="background-image:url('${url}')" onclick="spGoTo(${i});event.stopPropagation()"></div>`
    ).join('');

    document.getElementById('srvPanelBg').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeService() {
    document.getElementById('srvPanelBg').classList.remove('open');
    document.body.style.overflow = '';
  }

  function handlePanelBgClick(e) {
    if (e.target === document.getElementById('srvPanelBg')) closeService();
  }

  function spGoTo(n) {
    const imgs = ['spImg0', 'spImg1', 'spImg2'];
    imgs.forEach((id, i) => document.getElementById(id).classList.toggle('active', i === n));
    document.querySelectorAll('.sp-thumb').forEach((t, i) => t.classList.toggle('active', i === n));
    spCurImg = n;
  }

  function spPrev() { spGoTo((spCurImg + SERVICES[spCurService].imgs.length - 1) % SERVICES[spCurService].imgs.length); }
  function spNext() { spGoTo((spCurImg + 1) % SERVICES[spCurService].imgs.length); }

  function openModalFromPanel() {
    closeService();
    setTimeout(openModal, 300);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeService(); closeModal(); closeCert(); }
  });

  /* ── SMOOTH SCROLL ── */
  function smoothTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var offset = 70;
    var top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  /* ── RESET INPUTS ON TYPE ── */
  (function () {
    var ni = document.getElementById('nameInput');
    var pi = document.getElementById('phoneInput');
    if (ni) ni.addEventListener('input', function () {
      this.style.borderColor = '';
      var ne = document.getElementById('nameError');
      if (ne) ne.classList.remove('visible');
    });
    if (pi) pi.addEventListener('input', function () {
      this.style.borderColor = '';
      var pe = document.getElementById('phoneError');
      if (pe) pe.classList.remove('visible');
    });
  })();

  /* ── CAROUSEL ── */
  const teamMembers = [
    { name: 'Олена Мороз', role: 'Тайський масаж' },
    { name: 'Дмитро Карпенко', role: 'Класичний масаж' },
    { name: 'Марія Ткаченко', role: 'Гарячі камені' },
    { name: 'Олена Кунець', role: 'Спортивний масаж' },
    { name: 'Світлана Когунь', role: 'Масаж обличчя' },
    { name: 'Андрій Бондаренко', role: 'Ароматерапія' }
  ];

  const cCards = document.querySelectorAll('.card');
  const cDots = document.querySelectorAll('.dot');
  const cName = document.getElementById('memberName');
  const cRole = document.getElementById('memberRole');
  const cLeft = document.querySelector('.nav-arrow.left');
  const cRight = document.querySelector('.nav-arrow.right');
  let cIdx = 0, cAnim = false;

  function updateCarousel(n) {
    if (cAnim) return;
    cAnim = true;
    cIdx = (n + cCards.length) % cCards.length;
    cCards.forEach((card, i) => {
      const off = (i - cIdx + cCards.length) % cCards.length;
      card.classList.remove('center', 'left-1', 'left-2', 'right-1', 'right-2', 'hidden');
      if (off === 0) card.classList.add('center');
      else if (off === 1) card.classList.add('right-1');
      else if (off === 2) card.classList.add('right-2');
      else if (off === cCards.length - 1) card.classList.add('left-1');
      else if (off === cCards.length - 2) card.classList.add('left-2');
      else card.classList.add('hidden');
    });
    cDots.forEach((d, i) => d.classList.toggle('active', i === cIdx));
    cName.style.opacity = '0';
    cRole.style.opacity = '0';
    setTimeout(() => {
      cName.textContent = teamMembers[cIdx].name;
      cRole.textContent = teamMembers[cIdx].role;
      cName.style.opacity = '1';
      cRole.style.opacity = '1';
    }, 300);
    setTimeout(() => { cAnim = false; }, 800);
  }

  if (cLeft) cLeft.addEventListener('click', () => updateCarousel(cIdx - 1));
  if (cRight) cRight.addEventListener('click', () => updateCarousel(cIdx + 1));
  cDots.forEach((d, i) => d.addEventListener('click', () => updateCarousel(i)));
  cCards.forEach((c, i) => c.addEventListener('click', () => updateCarousel(i)));

  /* swipe тільки в межах каруселі */
  const carouselEl = document.querySelector('.carousel-container');
  if (carouselEl) {
    let cTouchX = 0;
    carouselEl.addEventListener('touchstart', e => { cTouchX = e.changedTouches[0].screenX; });
    carouselEl.addEventListener('touchend', e => {
      const diff = cTouchX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) updateCarousel(diff > 0 ? cIdx + 1 : cIdx - 1);
    });
  }

  if (cCards.length) updateCarousel(0);

  /* ── HAMBURGER ── */
  function toggleMenu() {
    document.getElementById('hamburger').classList.toggle('open');
    document.getElementById('mobileMenu').classList.toggle('open');
    document.body.style.overflow = document.getElementById('mobileMenu').classList.contains('open') ? 'hidden' : '';
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var mm = document.getElementById('mobileMenu');
      if (mm.classList.contains('open')) toggleMenu();
      closeService(); closeModal(); closeCert();
    }
  });

  /* ── REVIEWS SLIDER ── */
  var revIdx = 0;
  var revCards = document.querySelectorAll('.review-card');
  var revDotEls = document.querySelectorAll('.reviews-dot');

  function goReview(n) {
    revIdx = (n + revCards.length) % revCards.length;
    document.getElementById('reviewsTrack').style.transform = 'translateX(-' + (revIdx * 100) + '%)';
    revDotEls.forEach(function (d, i) { d.classList.toggle('active', i === revIdx); });
  }

  var revPrevBtn = document.getElementById('revPrev');
  var revNextBtn = document.getElementById('revNext');
  if (revPrevBtn) revPrevBtn.addEventListener('click', function () { goReview(revIdx - 1); });
  if (revNextBtn) revNextBtn.addEventListener('click', function () { goReview(revIdx + 1); });
  revDotEls.forEach(function (d, i) { d.addEventListener('click', function () { goReview(i); }); });

  /* swipe для відгуків */
  var rvTouchX = 0;
  var rvWrap = document.querySelector('.reviews-slider-wrap');
  if (rvWrap) {
    rvWrap.addEventListener('touchstart', function (e) { rvTouchX = e.changedTouches[0].screenX; });
    rvWrap.addEventListener('touchend', function (e) {
      var diff = rvTouchX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) goReview(diff > 0 ? revIdx + 1 : revIdx - 1);
    });
  }

  /* зірки у формі */
  var pickedStars = 5;
  function pickStar(n) {
    pickedStars = n;
    document.querySelectorAll('#starPicker svg').forEach(function (s, i) {
      s.classList.toggle('lit', i < n);
    });
  }
  pickStar(5);

  /* показати / сховати форму */
  function toggleReviewForm() {
    var fw = document.getElementById('reviewFormWrap');
    fw.classList.toggle('open');
  }

  /* закриття кліком поза формою */
  document.addEventListener('click', function (e) {
    var fw = document.getElementById('reviewFormWrap');
    var btn = document.querySelector('.review-add-btn');
    if (!fw || !fw.classList.contains('open')) return;
    /* якщо клік всередині форми або на кнопку "Залишити відгук" — не закривати */
    if (fw.contains(e.target) || (btn && btn.contains(e.target))) return;
    fw.classList.remove('open');
  });

  /* додати відгук */
  function submitReview() {
    var name = document.getElementById('rvName').value.trim();
    var date = document.getElementById('rvDate').value.trim();
    var text = document.getElementById('rvText').value.trim();
    var err = document.getElementById('rvError');
    if (!name || !text) {
      err.textContent = "Будь ласка, заповніть ім'я та текст відгуку.";
      err.classList.add('visible');
      return;
    }
    err.classList.remove('visible');

    /* будуємо зірки */
    var starsHTML = '';
    for (var i = 0; i < pickedStars; i++) {
      starsHTML += '<svg class="review-star" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }

    var card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML =
      '<div class="review-stars">' + starsHTML + '</div>' +
      '<p class="review-text">' + text + '</p>' +
      '<div class="review-author">' +
      '<div class="review-avatar" style="background:rgba(200,151,58,.15);display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:1.2rem;">&#9670;</div>' +
      '<div class="review-info">' +
      '<div class="review-name">' + name + '</div>' +
      '<div class="review-date">' + (date || 'Щойно') + '</div>' +
      '</div>' +
      '</div>';

    document.getElementById('reviewsTrack').appendChild(card);

    /* оновлюємо дані */
    revCards = document.querySelectorAll('.review-card');
    var newDot = document.createElement('div');
    newDot.className = 'reviews-dot';
    var newIdx = revCards.length - 1;
    newDot.addEventListener('click', (function (idx) { return function () { goReview(idx); }; })(newIdx));
    document.getElementById('revDots').appendChild(newDot);
    revDotEls = document.querySelectorAll('.reviews-dot');

    /* очищаємо форму і переходимо до нового відгуку */
    document.getElementById('rvName').value = '';
    document.getElementById('rvDate').value = '';
    document.getElementById('rvText').value = '';
    pickStar(5);
    document.getElementById('reviewFormWrap').classList.remove('open');
    goReview(newIdx);
  }
  /* ── MAP CONFIG ── */
  var MAP_CONFIG = {
    salonName: 'AURA SPA',                        /* ЗМІНИТИ — назва салону у заголовку карти */
    address: 'вул. Золотоворітська, 5, Київ',   /* ЗМІНИТИ — адреса під назвою */
    gmapsLink: 'https://maps.google.com/', /* ЗМІНИТИ — посилання "Відкрити у Google Maps" */
    /* ЗМІНИТИ — iframe embed URL з Google Maps:
       1. Відкрийте maps.google.com
       2. Знайдіть адресу
       3. Натисніть «Поділитися» → «Вставити карту»
       4. Скопіюйте лише значення src="..." з iframe
       5. Вставте його нижче */
    iframeSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2189.900668557593!2d30.512074787314674!3d50.449492966240925!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40d4cf0075ea368b%3A0xeea22a4d2fdba6dd!2z0JfQvtC70L7RgtGWINCy0L7RgNC-0YLQsA!5e1!3m2!1suk!2sua!4v1779456339275!5m2!1suk!2sua"
    /* ЗМІНИТИ — вставте ваш iframe src вище */
  };

  /* ── MAP FUNCTIONS ── */
  function openMap() {
    document.getElementById('mapSalonName').textContent = MAP_CONFIG.salonName;
    document.getElementById('mapSalonAddr').textContent = MAP_CONFIG.address;
    document.getElementById('mapGmapsLink').href = MAP_CONFIG.gmapsLink;
    /* завантажуємо iframe лише при відкритті */
    var iframe = document.getElementById('mapIframe');
    if (!iframe.src || iframe.src === window.location.href) {
      iframe.src = MAP_CONFIG.iframeSrc;
    }
    document.getElementById('mapModalBg').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMap() {
    document.getElementById('mapModalBg').classList.remove('open');
    document.body.style.overflow = '';
  }
  function handleMapBgClick(e) {
    if (e.target === document.getElementById('mapModalBg')) closeMap();
  }
  /* Escape закриває і карту */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMap();
  });
