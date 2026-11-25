/*! harf: zero-dependency Arabic text toolkit. MIT */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Harf = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
  var TATWEEL = /\u0640/g;
  var ARABIC_LETTER = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  var ARABIC_LETTER_G = new RegExp(ARABIC_LETTER.source, 'g');
  var LATIN_LETTER_G = /[A-Za-z]/g;

  function str(s) { return s == null ? '' : String(s); }

  function stripDiacritics(s) { return str(s).replace(DIACRITICS, ''); }
  function removeTatweel(s) { return str(s).replace(TATWEEL, ''); }

  // digits
  var WEST = '0123456789', INDIC = '٠١٢٣٤٥٦٧٨٩', PERSIAN = '۰۱۲۳۴۵۶۷۸۹';
  function toArabicIndic(s) { return str(s).replace(/[0-9]/g, function (d) { return INDIC[d]; }); }
  function toWesternDigits(s) {
    return str(s).replace(/[٠-٩۰-۹]/g, function (d) {
      var i = INDIC.indexOf(d); if (i < 0) i = PERSIAN.indexOf(d); return WEST[i];
    });
  }

  // normalize
  function normalize(s, o) {
    o = o || {};
    var t = str(s);
    if (o.diacritics !== false) t = stripDiacritics(t);
    if (o.tatweel !== false) t = removeTatweel(t);
    if (o.alef !== false) t = t.replace(/[أإآٱ]/g, 'ا');
    if (o.yaa !== false) t = t.replace(/[ىیۍ]/g, 'ي');
    if (o.kaf !== false) t = t.replace(/ک/g, 'ك');
    if (o.taaMarbuta) t = t.replace(/ة/g, 'ه');
    if (o.hamza) t = t.replace(/[ؤ]/g, 'و').replace(/[ئ]/g, 'ي').replace(/ء/g, '');
    if (o.digits) t = toWesternDigits(t);
    if (o.spaces !== false) t = t.replace(/[ \t\u00A0\u200B-\u200F]+/g, ' ').trim();
    return t;
  }

  // detection
  function isArabic(s) { return ARABIC_LETTER.test(str(s)); }
  function arabicRatio(s) {
    var t = str(s), a = (t.match(ARABIC_LETTER_G) || []).length, l = (t.match(LATIN_LETTER_G) || []).length;
    return a + l === 0 ? 0 : a / (a + l);
  }
  function direction(s) {
    var t = str(s), m = t.match(/[A-Za-z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/);
    if (!m) return 'neutral';
    return ARABIC_LETTER.test(m[0]) ? 'rtl' : 'ltr';
  }

  // words
  function tokenize(s) {
    return (str(s).match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z0-9]+/g) || [])
      .filter(function (w) { return !/^[\u0640\u064B-\u065F]+$/.test(w); });
  }
  function wordCount(s) { return tokenize(s).length; }

  // light stemmer
  var PREFIXES = ['وبال', 'وكال', 'وفال', 'ولل', 'وال', 'بال', 'كال', 'فال', 'لل', 'ال', 'و'];
  var SUFFIXES = ['هما', 'كما', 'ات', 'ون', 'ين', 'ان', 'ها', 'هم', 'هن', 'كم', 'نا', 'تم', 'ة', 'ه', 'ي', 'ك'];
  function stem(word) {
    var w = normalize(word, { taaMarbuta: false });
    var i, p;
    for (i = 0; i < PREFIXES.length; i++) {
      p = PREFIXES[i];
      if (w.indexOf(p) === 0 && w.length - p.length >= 3) { w = w.slice(p.length); break; }
    }
    for (i = 0; i < SUFFIXES.length; i++) {
      p = SUFFIXES[i];
      if (w.length - p.length >= 3 && w.slice(-p.length) === p) { w = w.slice(0, -p.length); break; }
    }
    return w;
  }

  // search
  function matches(haystack, needle, o) {
    o = o || {};
    var n = { taaMarbuta: true, hamza: true };
    var h = normalize(haystack, n).toLowerCase(), q = normalize(needle, n).toLowerCase();
    if (!q) return false;
    if (o.stem) {
      var hs = tokenize(h).map(stem), qs = tokenize(q).map(stem);
      return qs.length > 0 && qs.every(function (w) { return hs.indexOf(w) >= 0; });
    }
    return h.indexOf(q) >= 0;
  }

  // numbers to words
  var ONES = ['صفر', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
    'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  var TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  var HUNDREDS = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  var SCALES = [null,
    { one: 'ألف', two: 'ألفان', few: 'آلاف' },
    { one: 'مليون', two: 'مليونان', few: 'ملايين' },
    { one: 'مليار', two: 'ملياران', few: 'مليارات' }];

  function below1000(n) {
    var parts = [], h = Math.floor(n / 100), r = n % 100;
    if (h) parts.push(HUNDREDS[h]);
    if (r) {
      if (r < 20) parts.push(ONES[r]);
      else {
        var u = r % 10, t = Math.floor(r / 10);
        if (u) parts.push(ONES[u]);
        parts.push(TENS[t]);
      }
    }
    return parts.join(' و');
  }
  function numberToWords(n) {
    var x = Number(n);
    if (!isFinite(x) || Math.floor(x) !== x) throw new RangeError('numberToWords needs an integer');
    if (Math.abs(x) > 999999999999) throw new RangeError('numberToWords supports up to 999,999,999,999');
    if (x === 0) return ONES[0];
    var neg = x < 0; x = Math.abs(x);
    var groups = [], i;
    for (i = 0; x > 0; i++) { groups.push(x % 1000); x = Math.floor(x / 1000); }
    var out = [];
    for (i = groups.length - 1; i >= 0; i--) {
      var g = groups[i];
      if (!g) continue;
      if (i === 0) out.push(below1000(g));
      else {
        var sc = SCALES[i];
        if (g === 1) out.push(sc.one);
        else if (g === 2) out.push(sc.two);
        else if (g <= 10) out.push(ONES[g] + ' ' + sc.few);
        else out.push(below1000(g) + ' ' + sc.one);
      }
    }
    return (neg ? 'سالب ' : '') + out.join(' و');
  }

  // transliteration
  var AR2LAT = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ٱ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
    'ع': '3', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y',
    'ى': 'a', 'ة': 'a', 'ء': '2', 'ؤ': '2', 'ئ': '2', 'پ': 'p', 'چ': 'ch', 'گ': 'g', 'ڤ': 'v',
    '؟': '?', '،': ',', '؛': ';'
  };
  function transliterate(s, o) {
    o = o || {};
    var t = stripDiacritics(removeTatweel(str(s))), out = '';
    for (var i = 0; i < t.length; i++) {
      var c = t[i];
      if (c === 'ع' && o.ayn === 'apostrophe') out += "'";
      else if (AR2LAT[c] !== undefined) out += AR2LAT[c];
      else out += toWesternDigits(c);
    }
    return out;
  }
  function slugify(s) {
    var t = isArabic(s) ? transliterate(s, { ayn: 'apostrophe' }) : str(s);
    return t.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  // arabizi (Franco-Arab) to Arabic
  var DIGRAPHS = { sh: 'ش', kh: 'خ', gh: 'غ', th: 'ث', dh: 'ذ', ch: 'تش', ee: 'ي', oo: 'و', aa: 'ا', ou: 'و', ai: 'ي', ei: 'ي' };
  var LAT2AR = {
    a: 'ا', b: 'ب', t: 'ت', g: 'ج', j: 'ج', h: 'ه', d: 'د', r: 'ر', z: 'ز', s: 'س', f: 'ف', q: 'ق', k: 'ك', l: 'ل',
    m: 'م', n: 'ن', w: 'و', y: 'ي', e: '', i: 'ي', o: 'و', u: 'و', p: 'ب', v: 'ف', x: 'كس', c: 'ك',
    '2': 'ء', '3': 'ع', '4': 'ذ', '5': 'خ', '6': 'ط', '7': 'ح', '8': 'غ', '9': 'ص'
  };
  function fromArabizi(s) {
    return str(s).split(/(\s+)/).map(function (w) {
      if (!/[A-Za-z0-9]/.test(w)) return w;
      var lw = w.toLowerCase(), out = '', i = 0;
      while (i < lw.length) {
        var two = lw.substr(i, 2);
        if (DIGRAPHS[two]) { out += DIGRAPHS[two]; i += 2; continue; }
        var c = lw[i];
        var m = LAT2AR[c];
        if (m === undefined) out += c;
        else if (i > 0 && i < lw.length - 1 && 'aeiou'.indexOf(c) >= 0 && c !== 'i' && c !== 'o' && c !== 'u') out += '';
        else if (i > 0 && 'aeiou'.indexOf(c) >= 0 && i < lw.length - 1 && (c === 'a' || c === 'e')) out += '';
        else if (i === 0 && c === 'e') out += 'ا';
        else if (c === 'a' && i === 0) out += 'ا';
        else out += m;
        i++;
      }
      return out;
    }).join('');
  }

  // sorting
  function sort(words) { return words.slice().sort(function (a, b) { return normalize(a).localeCompare(normalize(b), 'ar'); }); }

  function stats(s) {
    var t = str(s), toks = tokenize(t);
    return {
      characters: t.length,
      letters: (t.match(ARABIC_LETTER_G) || []).length + (t.match(LATIN_LETTER_G) || []).length,
      arabicLetters: (t.match(ARABIC_LETTER_G) || []).length,
      words: toks.length,
      uniqueWords: Object.keys(toks.reduce(function (m, w) { m[normalize(w)] = 1; return m; }, {})).length,
      diacritics: (t.match(DIACRITICS) || []).length,
      direction: direction(t),
      arabicRatio: Math.round(arabicRatio(t) * 100) / 100
    };
  }

  return {
    stripDiacritics: stripDiacritics, removeTatweel: removeTatweel, normalize: normalize,
    toArabicIndic: toArabicIndic, toWesternDigits: toWesternDigits,
    isArabic: isArabic, arabicRatio: arabicRatio, direction: direction,
    tokenize: tokenize, wordCount: wordCount, stem: stem, matches: matches,
    numberToWords: numberToWords, transliterate: transliterate, slugify: slugify,
    fromArabizi: fromArabizi, sort: sort, stats: stats, version: '1.0.0'
  };
});
