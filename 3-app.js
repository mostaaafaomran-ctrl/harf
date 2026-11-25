(function () {
  var H = window.Harf;
  var T = {
    ar: {
      h1: 'أدوات النص العربي، من غير مكتبات', sub: 'تنضيف التشكيل والتطويل، توحيد الحروف، أرقام لكلمات، تحويل الحروف اللاتينية والعربيزي. نفس الكود بيشتغل في المتصفح وNode.',
      input: 'النص', output: 'النتيجة', copy: 'نسخ', copied: 'اتنسخ ✓', sample: 'جرّب مثال', usage: 'الاستخدام في الكود',
      foot: 'حرف · مفتوح المصدر MIT · كل حاجة بتحصل في متصفحك',
      tabs: { clean: 'تنضيف', digits: 'أرقام', words: 'رقم بالحروف', translit: 'لاتيني', arabizi: 'عربيزي', search: 'بحث', stats: 'إحصاء' },
      o: { dia: 'شيل التشكيل', tat: 'شيل التطويل', alef: 'وحّد الألف', yaa: 'وحّد الياء', taa: 'التاء المربوطة هاء', hamza: 'شيل الهمزة', digits: 'أرقام إنجليزي' },
      toIndic: 'إلى أرقام هندية', toWest: 'إلى أرقام إنجليزي', sl: 'رابط (slug)', dir: 'الاتجاه', needle: 'كلمة البحث', stem: 'مع الجذع'
    },
    en: {
      h1: 'Arabic text tools, zero dependencies', sub: 'Strip diacritics and tatweel, unify letters, numbers to words, transliterate, convert Arabizi. The same code runs in the browser and Node.',
      input: 'Text', output: 'Result', copy: 'Copy', copied: 'Copied ✓', sample: 'Try an example', usage: 'Use it in code',
      foot: 'harf · open source MIT · everything runs in your browser',
      tabs: { clean: 'Clean', digits: 'Digits', words: 'Number to words', translit: 'Latin', arabizi: 'Arabizi', search: 'Search', stats: 'Stats' },
      o: { dia: 'Strip diacritics', tat: 'Strip tatweel', alef: 'Unify alef', yaa: 'Unify yaa', taa: 'Taa marbuta to haa', hamza: 'Remove hamza', digits: 'Western digits' },
      toIndic: 'To Arabic-Indic digits', toWest: 'To Western digits', sl: 'Slug', dir: 'Direction', needle: 'Search word', stem: 'Use stemming'
    }
  };
  var SAMPLES = { clean: 'أَهْلاً وَسَهْلاً بِكُمْ فِي مَوْقِعِنَا الجَمِيـــــل', digits: 'السعر 1250 جنيه في 2026', words: '1234567', translit: 'مرحبا بالعالم', arabizi: '7abibi ya 3arabi, ezayak?', search: 'ذهبت إلى المدرسة مع المعلمين', stats: 'اللغة العربية جميلة وغنية بالكلمات. Arabic is beautiful.' };
  var SNIP = {
    clean: "const Harf = require('harf-arabic');\nHarf.normalize('أَهْلاً');\n// or: Harf.stripDiacritics(text), Harf.removeTatweel(text)",
    digits: "Harf.toArabicIndic('2026');   // ٢٠٢٦\nHarf.toWesternDigits('٢٠٢٦'); // 2026",
    words: "Harf.numberToWords(1234);\n// ألف ومائتان وأربعة وثلاثون",
    translit: "Harf.transliterate('محمد'); // mhmd\nHarf.slugify('مرحبا بالعالم'); // mrhba-balalm",
    arabizi: "Harf.fromArabizi('7abibi'); // حبيبي",
    search: "Harf.matches('ذهبت إلى المدرسة', 'مدرسه'); // true\nHarf.matches(text, 'معلم', { stem: true });",
    stats: "Harf.stats(text);\n// { words, letters, diacritics, direction, arabicRatio }"
  };
  var lang = 'ar', tab = 'clean', inp = document.getElementById('inp'), out = document.getElementById('out');
  var opt = { dia: true, tat: true, alef: true, yaa: true, taa: false, hamza: false, digits: false, stem: false };
  var needle = 'مدرسه';

  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function rows(list) { return '<table>' + list.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>'; }

  function run() {
    var v = inp.value, t = T[lang], html;
    if (tab === 'clean') {
      html = esc(H.normalize(v, { diacritics: opt.dia, tatweel: opt.tat, alef: opt.alef, yaa: opt.yaa, taaMarbuta: opt.taa, hamza: opt.hamza, digits: opt.digits }));
    } else if (tab === 'digits') {
      html = rows([[t.toIndic, H.toArabicIndic(H.toWesternDigits(v))], [t.toWest, H.toWesternDigits(v)]]);
    } else if (tab === 'words') {
      var n = parseInt(H.toWesternDigits(v).replace(/[^\d-]/g, ''), 10);
      try { html = isNaN(n) ? '' : esc(H.numberToWords(n)); } catch (e) { html = esc(e.message); }
    } else if (tab === 'translit') {
      html = rows([['Latin', H.transliterate(v)], [t.sl, H.slugify(v)]]);
    } else if (tab === 'arabizi') {
      html = esc(H.fromArabizi(v));
    } else if (tab === 'search') {
      html = '<div dir="auto">' + H.tokenize(v).map(function (w) { return esc(w) + ' → ' + esc(H.stem(w)); }).join('<br>') + '</div><br>' + rows([[t.needle, ''], ['match', String(H.matches(v, needle, { stem: opt.stem }))]]);
    } else {
      var s = H.stats(v); html = rows(Object.keys(s).map(function (k) { return [k, s[k]]; }));
    }
    out.innerHTML = html;
    document.getElementById('snippet').textContent = SNIP[tab];
  }

  function renderOpts() {
    var box = document.getElementById('opts'), t = T[lang], h = '';
    if (tab === 'clean') ['dia', 'tat', 'alef', 'yaa', 'taa', 'hamza', 'digits'].forEach(function (k) {
      h += '<label><input type="checkbox" data-k="' + k + '"' + (opt[k] ? ' checked' : '') + '> ' + t.o[k] + '</label>';
    });
    if (tab === 'search') h = '<label>' + t.needle + ' <input id="needle" value="' + needle + '" style="border:2px solid #14171a;padding:3px 8px;font:inherit"></label><label><input type="checkbox" data-k="stem"' + (opt.stem ? ' checked' : '') + '> ' + t.stem + '</label>';
    box.innerHTML = h;
    box.querySelectorAll('input[data-k]').forEach(function (c) { c.onchange = function () { opt[c.dataset.k] = c.checked; run(); }; });
    var nd = document.getElementById('needle'); if (nd) nd.oninput = function () { needle = nd.value; run(); };
  }

  function render() {
    var t = T[lang];
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i]').forEach(function (e) { e.textContent = t[e.dataset.i]; });
    document.getElementById('langBtn').textContent = lang === 'ar' ? 'English' : 'العربية';
    var nav = document.getElementById('tabs'); nav.innerHTML = '';
    Object.keys(t.tabs).forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = t.tabs[k]; if (k === tab) b.className = 'on';
      b.onclick = function () { tab = k; inp.value = SAMPLES[k]; render(); }; nav.appendChild(b);
    });
    renderOpts(); run();
  }

  var hm = location.hash.replace('#', '').split(','); if (hm[0] && SAMPLES[hm[0]]) tab = hm[0]; if (hm[1] === 'en') lang = 'en';
  inp.value = SAMPLES[tab]; inp.oninput = run;
  document.getElementById('langBtn').onclick = function () { lang = lang === 'ar' ? 'en' : 'ar'; render(); };
  document.getElementById('sample').onclick = function () { inp.value = SAMPLES[tab]; run(); };
  document.getElementById('copy').onclick = function () {
    var b = this; navigator.clipboard.writeText(out.innerText).then(function () { b.textContent = T[lang].copied; setTimeout(function () { b.textContent = T[lang].copy; }, 1200); });
  };
  render();
})();
