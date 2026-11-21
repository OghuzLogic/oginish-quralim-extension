'use strict';

/**
 * ئۆگىنىش قۇرالىم — Chrome Manifest V3 Popup Controller
 * 100% Local Storage, Zero Telemetry, Strict XSS-Safe DOM Manipulation.
 */

const STORAGE_KEYS = {
  BOOKS: 'oq_books_v1',
  SETTINGS: 'oq_settings_v1',
  DHIKR: 'oq_dhikr_v1'
};

const MASTER_AI_PROMPT = "سەن ئىلمىي، تەجرىبىلىك مائارىپ مۇتەخەسسىسى ۋە بىلىم قۇرۇلمىلاشتۇرغۇچىسەن.\nمەن تۆۋەندە بېرىدىغان كىتاب، ماقالە ياكى دەرسلىك مەزمۇنىنى چوڭقۇر تەھلىل قىلىپ، شۇ مەزمۇندىكى ئەڭ مۇھىم، ئەڭ يادرولۇق ۋە چوقۇم ئىگىلەشكە تېگىشلىك دەل 30 دانە تەپسىلىي سۇئال-جاۋاب تەييارلاپ بەر.\n\nتەلەپلەر:\n1. پەقەتلا ساپ JSON فورماتىدا جاۋاب قايتۇر (JSON نىڭ سىرتىدا ھېچقانداق ئىزاھات، سالام ياكى قوشۇمچە خەت يازما).\n2. بارلىق سۇئال، جاۋاب ۋە ئەسكەرتمىلەر راۋان، توغرا ۋە ئىلمىي ئۇيغۇر تىلىدا يېزىلسۇن.\n3. ھەر بىر سۇئال ئېنىق، مەزمۇننىڭ يادروسىنى تۇتقان بولسۇن؛ ھەر بىر جاۋاب تەپسىلىي، چۈشىنىشلىك ۋە ئەستە تۇتۇشقا قولايلىق بولسۇن.\n4. «hint» قىسمىدا جاۋابنى ئەسلەشكە ياردەم بېرىدىغان قىسقا بىر يىپ ئۇچى يېزىلسۇن.\n5. «items» تىزىملىكىدە دەل 30 دانە سۇئال-جاۋاب بولسۇن (id نومۇرى 1 دىن 30 غىچە).\n\nچوقۇم تۆۋەندىكى JSON قۇرۇلمىسىغا قاتتىق ئەمەل قىل:\n{\n  \"title\": \"كىتاب ياكى دەرسلىكنىڭ ئېنىق نامى\",\n  \"author\": \"ئاپتور ياكى مەنبە (ئەگەر بولسا)\",\n  \"category\": \"بىلىم ساھەسى\",\n  \"items\": [\n    {\n      \"id\": 1,\n      \"question\": \"1-سۇئال تېكىستى...\",\n      \"answer\": \"1-سۇئالنىڭ تەپسىلىي ۋە ئېنىق جاۋابى...\",\n      \"hint\": \"ئەسلەش ئۈچۈن قىسقا يىپ ئۇچى\"\n    }\n  ]\n}\n\nتۆۋەندىكىسى مەن بېرىدىغان كىتاب ياكى دەرسلىك مەزمۇنى:\n[بۇ يەرگە كىتاب ياكى دەرسلىك مەزمۇنىنى چاپلاڭ]";

const DHIKR_ITEMS = [
  {
    id: 'rabbi-zidni',
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    uyghur: 'رەببى زىدنى ئىلما',
    meaning: 'رەببىم، مېنىڭ ئىلمىمنى زىيادە قىلغىن (ئىلىم ئېلىش دۇئاسى)',
    target: 33
  },
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    uyghur: 'سۇبھانەللاھ',
    meaning: 'ئاللاھ بارلىق نۇقسانلاردىن پاكتۇر',
    target: 33
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    uyghur: 'ئەلھەمدۇلىللاھ',
    meaning: 'بارلىق ھەمدۇسانا ئاللاھقا خاستۇر',
    target: 33
  },
  {
    id: 'allahuakbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    uyghur: 'ئاللاھۇ ئەكبەر',
    meaning: 'ئاللاھ ئەڭ بۈيۈكتۇر',
    target: 33
  },
  {
    id: 'tahlil',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    uyghur: 'لا ئىلاھە ئىللەللاھۇ ۋەھدەھۇ لا شەرىكە لەھۇ',
    meaning: 'بىر ئاللاھتىن باشقا ئىلاھ يوقتۇر، ئۇنىڭ شېرىكى يوقتۇر',
    target: 100
  },
  {
    id: 'istighfar',
    arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ',
    uyghur: 'ئەستەغفىرۇللاھەل ئەزىم ۋە ئەتۇبۇ ئىلەيھى',
    meaning: 'بۈيۈك ئاللاھتىن مەغپىرەت تىلەيمەن ۋە ئۇنىڭغا تەۋبە قىلىمەن',
    target: 100
  }
];

const DEFAULT_SETTINGS = {
  startupReminderEnabled: true,
  periodicIntervalMinutes: 60,
  reminderBookId: 'all',
  showHintByDefault: false
};

const state = {
  books: [],
  settings: Object.assign({}, DEFAULT_SETTINGS),
  dhikr: {
    selectedId: DHIKR_ITEMS[0].id,
    counts: {},
    totalAllTime: 0
  },
  currentView: 'home',
  activeBookId: null,
  studyFilter: 'all',
  studyOrder: [],
  studyCursor: 0,
  answerVisible: false,
  hintVisible: false,
  pendingDeleteId: null
};

let toastTimer = null;

function $(id) {
  return document.getElementById(id);
}

function showToast(message, type) {
  try {
    const el = $('toast');
    if (!el) return;
    el.textContent = message;
    el.className = 'toast ' + (type === 'error' ? 'error' : 'success');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.add('hidden');
    }, 3400);
  } catch (err) {
    console.error('Toast error:', err);
  }
}

async function storageGet(keys) {
  return new Promise(function (resolve, reject) {
    try {
      chrome.storage.local.get(keys, function (result) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(result || {});
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function storageSet(data) {
  return new Promise(function (resolve, reject) {
    try {
      chrome.storage.local.set(data, function () {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function persistBooks() {
  try {
    await storageSet({ [STORAGE_KEYS.BOOKS]: state.books });
  } catch (err) {
    showToast('كىتابلارنى ساقلاشتا خاتالىق كۆرۈلدى: ' + err.message, 'error');
  }
}

async function persistSettings() {
  try {
    await storageSet({ [STORAGE_KEYS.SETTINGS]: state.settings });
    try {
      chrome.runtime.sendMessage({ type: 'SYNC_ALARM' }, function () {
        void chrome.runtime.lastError;
      });
    } catch (_ignored) {
      // Service worker wakes automatically on next event
    }
  } catch (err) {
    showToast('تەڭشەكنى ساقلاشتا خاتالىق كۆرۈلدى: ' + err.message, 'error');
  }
}

async function persistDhikr() {
  try {
    await storageSet({ [STORAGE_KEYS.DHIKR]: state.dhikr });
  } catch (err) {
    showToast('زىكىر سانىنى ساقلاشتا خاتالىق كۆرۈلدى.', 'error');
  }
}

function parseAndValidateBookJson(rawInput, overrideTitle) {
  try {
    if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
      return { ok: false, error: 'JSON مەزمۇنى بوش بولماسلىقى كېرەك.' };
    }

    let cleaned = rawInput.trim();
    if (cleaned.charCodeAt(0) === 0xfeff) {
      cleaned = cleaned.slice(1).trim();
    }

    const fenceMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fenceMatch && fenceMatch[1]) {
      cleaned = fenceMatch[1].trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (_parseErr) {
      return {
        ok: false,
        error: 'JSON قۇرۇلمىسىدا گرامماتىكا خاتالىقى بار. تىرناق ۋە پەشلەرنى تەكشۈرۈڭ.'
      };
    }

    let rawTitle = '';
    let rawAuthor = '';
    let rawCategory = '';
    let rawItems = [];

    if (Array.isArray(parsed)) {
      rawItems = parsed;
    } else if (parsed && typeof parsed === 'object') {
      rawTitle = typeof parsed.title === 'string' ? parsed.title.trim() : '';
      rawAuthor = typeof parsed.author === 'string' ? parsed.author.trim() : '';
      rawCategory = typeof parsed.category === 'string' ? parsed.category.trim() : '';

      if (Array.isArray(parsed.items)) {
        rawItems = parsed.items;
      } else if (Array.isArray(parsed.questions)) {
        rawItems = parsed.questions;
      } else if (Array.isArray(parsed.qa)) {
        rawItems = parsed.qa;
      } else {
        return {
          ok: false,
          error: 'JSON ئىچىدە «items» ناملىق سۇئال-جاۋاب تىزىملىكى تېپىلمىدى.'
        };
      }
    } else {
      return { ok: false, error: 'JSON تىپى توغرا ئەمەس.' };
    }

    if (rawItems.length === 0) {
      return { ok: false, error: 'سۇئال-جاۋاب تىزىملىكى بوش بولماسلىقى كېرەك.' };
    }

    if (rawItems.length > 500) {
      return { ok: false, error: 'بىر كىتابتا ئەڭ كۆپ بولغاندا 500 سۇئال قوللايدۇ.' };
    }

    const validatedItems = [];
    for (let i = 0; i < rawItems.length; i++) {
      const entry = rawItems[i];
      if (!entry || typeof entry !== 'object') {
        return { ok: false, error: (i + 1) + '-ماددىنىڭ فورماتى توغرا ئەمەس.' };
      }
      const q = typeof entry.question === 'string' ? entry.question.trim() : '';
      const a = typeof entry.answer === 'string' ? entry.answer.trim() : '';
      const h = typeof entry.hint === 'string' ? entry.hint.trim() : '';

      if (!q || !a) {
        return {
          ok: false,
          error: (i + 1) + '-ماددىدا «question» ياكى «answer» كەم.'
        };
      }

      validatedItems.push({
        id: i + 1,
        question: q.slice(0, 1200),
        answer: a.slice(0, 4000),
        hint: h ? h.slice(0, 400) : '',
        mastered: Boolean(entry.mastered),
        reviewCount: typeof entry.reviewCount === 'number' ? entry.reviewCount : 0
      });
    }

    const finalTitle = ((overrideTitle || '').trim() || rawTitle).slice(0, 140);
    if (!finalTitle) {
      return {
        ok: false,
        error: 'كىتاب نامىنى يۇقىرىدىكى كاتەكچىگە كىرگۈزۈڭ ياكى JSON غا «title» قوشۇڭ.'
      };
    }

    return {
      ok: true,
      book: {
        id: 'book_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        title: finalTitle,
        author: rawAuthor.slice(0, 120) || 'بەلگىلەنمىگەن',
        category: rawCategory.slice(0, 80) || 'ئومۇمىي بىلىم',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: validatedItems
      }
    };
  } catch (err) {
    return { ok: false, error: 'تەكشۈرۈش خاتالىقى: ' + err.message };
  }
}

function downloadJsonFile(filename, dataObject) {
  try {
    const jsonString = JSON.stringify(dataObject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    return true;
  } catch (err) {
    showToast('ھۆججەت چۈشۈرۈشتە خاتالىق كۆرۈلدى.', 'error');
    return false;
  }
}

function switchView(viewName, customTitle) {
  state.currentView = viewName;
  state.pendingDeleteId = null;

  const views = ['home', 'add', 'study', 'settings', 'dhikr'];
  views.forEach(function (name) {
    const el = $('view-' + name);
    if (el) {
      el.classList.toggle('hidden', name !== viewName);
    }
  });

  const isHome = viewName === 'home';
  $('btn-back').classList.toggle('hidden', isHome);
  $('header-spacer').classList.toggle('hidden', isHome);

  if (customTitle) {
    $('header-title').textContent = customTitle;
  } else if (viewName === 'home') {
    $('header-title').textContent = 'ئۆگىنىش قۇرالىم';
  } else if (viewName === 'add') {
    $('header-title').textContent = 'كىتاب قوشۇش';
  } else if (viewName === 'settings') {
    $('header-title').textContent = 'تەڭشەك';
  } else if (viewName === 'dhikr') {
    $('header-title').textContent = 'زىكىر';
  }

  if (viewName === 'home') renderBooksList();
  if (viewName === 'settings') renderSettings();
  if (viewName === 'dhikr') renderDhikr();
}

function renderBooksList() {
  try {
    const container = $('books-list');
    const countLabel = $('books-count-label');
    if (!container) return;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    countLabel.textContent = state.books.length + ' كىتاب';

    if (state.books.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';

      const msg = document.createElement('p');
      msg.textContent = 'تېخى كىتاب قوشۇلمىدى. «پرومپىتى كۆچۈرۈش» ئارقىلىق JSON تەييارلاپ، «كىتاب قوشۇش» دىن يۈكلەڭ.';
      empty.appendChild(msg);

      container.appendChild(empty);
      return;
    }

    state.books.forEach(function (book, index) {
      const row = document.createElement('div');
      row.className = 'book-row';

      const mainBtn = document.createElement('button');
      mainBtn.type = 'button';
      mainBtn.className = 'book-main-btn';
      mainBtn.addEventListener('click', function () {
        openStudyView(book.id);
      });

      const titleLine = document.createElement('span');
      titleLine.className = 'book-title-line';
      titleLine.textContent = (index + 1) + '. ' + book.title;

      const masteredCount = book.items.filter(function (item) {
        return item.mastered;
      }).length;

      const metaLine = document.createElement('span');
      metaLine.className = 'book-meta-line';
      metaLine.textContent = masteredCount + ' / ' + book.items.length + ' يادلىدىم · ئوقۇش ئۈچۈن بېسىڭ';

      mainBtn.appendChild(titleLine);
      mainBtn.appendChild(metaLine);

      const actions = document.createElement('div');
      actions.className = 'book-actions';

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'row-action-btn save';
      saveBtn.textContent = 'ساقلاش';
      saveBtn.title = 'بۇ كىتابنى JSON ھۆججەت قىلىپ زاپاسلاش';
      saveBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const safeName = book.title.replace(/[^\u0600-\u06FFa-zA-Z0-9_-]+/g, '_').slice(0, 40) || 'kitab';
        if (downloadJsonFile(safeName + '.json', book)) {
          showToast('«' + book.title + '» JSON قىلىپ ساقلاندى.', 'success');
        }
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'row-action-btn delete';
      const isConfirming = state.pendingDeleteId === book.id;
      deleteBtn.textContent = isConfirming ? 'جەزملەش؟' : 'ئۆچۈرۈش';
      deleteBtn.addEventListener('click', async function (e) {
        e.stopPropagation();
        if (state.pendingDeleteId !== book.id) {
          state.pendingDeleteId = book.id;
          renderBooksList();
          return;
        }
        state.books = state.books.filter(function (b) {
          return b.id !== book.id;
        });
        state.pendingDeleteId = null;
        if (state.settings.reminderBookId === book.id) {
          state.settings.reminderBookId = 'all';
          await persistSettings();
        }
        await persistBooks();
        renderBooksList();
        showToast('كىتاب ئۆچۈرۈلدى.', 'success');
      });

      actions.appendChild(saveBtn);
      actions.appendChild(deleteBtn);

      row.appendChild(mainBtn);
      row.appendChild(actions);
      container.appendChild(row);
    });
  } catch (err) {
    showToast('كىتاب تىزىملىكىنى كۆرسىتىشتە خاتالىق كۆرۈلدى.', 'error');
  }
}

function getActiveBook() {
  return state.books.find(function (b) {
    return b.id === state.activeBookId;
  }) || null;
}

function rebuildStudyOrder(shuffle) {
  const book = getActiveBook();
  if (!book) {
    state.studyOrder = [];
    state.studyCursor = 0;
    return;
  }

  let indices = [];
  for (let i = 0; i < book.items.length; i++) {
    if (state.studyFilter === 'unmastered' && book.items[i].mastered) {
      continue;
    }
    indices.push(i);
  }

  if (shuffle && indices.length > 1) {
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
  }

  state.studyOrder = indices;
  state.studyCursor = 0;
  state.answerVisible = false;
  state.hintVisible = Boolean(state.settings.showHintByDefault);
}

function openStudyView(bookId) {
  const book = state.books.find(function (b) {
    return b.id === bookId;
  });
  if (!book) return;

  state.activeBookId = bookId;
  state.studyFilter = 'all';
  rebuildStudyOrder(false);
  switchView('study', book.title);
  renderStudyCard();
}

function renderStudyCard() {
  try {
    const book = getActiveBook();
    if (!book) return;

    const total = book.items.length;
    const mastered = book.items.filter(function (it) {
      return it.mastered;
    }).length;
    const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;

    $('study-progress-text').textContent = mastered + ' / ' + total + ' يادلىدىم (' + percent + '%)';
    $('study-progress-bar').style.width = percent + '%';

    $('btn-filter-all').classList.toggle('active', state.studyFilter === 'all');
    $('btn-filter-unmastered').classList.toggle('active', state.studyFilter === 'unmastered');

    if (state.studyOrder.length === 0) {
      $('study-index-text').textContent = 'تۈگىدى';
      $('qa-question').textContent = 'ماشاءئاللاھ! بۇ سۈزگۈچتە يادلىمىغان سۇئال قالمىدى.';
      $('qa-hint').classList.add('hidden');
      $('qa-answer').classList.add('hidden');
      return;
    }

    if (state.studyCursor >= state.studyOrder.length) {
      state.studyCursor = 0;
    }

    const itemIdx = state.studyOrder[state.studyCursor];
    const item = book.items[itemIdx];

    $('study-index-text').textContent =
      'سۇئال ' + (state.studyCursor + 1) + ' / ' + state.studyOrder.length + (item.mastered ? ' · يادلىدىم' : '');
    $('qa-question').textContent = item.question;

    if (item.hint && state.hintVisible) {
      $('qa-hint').textContent = 'يىپ ئۇچى: ' + item.hint;
      $('qa-hint').classList.remove('hidden');
    } else {
      $('qa-hint').classList.add('hidden');
    }

    if (state.answerVisible) {
      $('qa-answer').textContent = item.answer;
      $('qa-answer').classList.remove('hidden');
      $('btn-reveal-answer').textContent = 'جاۋابنى يوشۇرۇش';
    } else {
      $('qa-answer').classList.add('hidden');
      $('btn-reveal-answer').textContent = 'جاۋابنى كۆرۈش';
    }
  } catch (err) {
    showToast('سۇئالنى كۆرسىتىشتە خاتالىق كۆرۈلدى.', 'error');
  }
}

async function markCurrentCard(masteredValue) {
  try {
    const book = getActiveBook();
    if (!book || state.studyOrder.length === 0) return;

    const itemIdx = state.studyOrder[state.studyCursor];
    const item = book.items[itemIdx];
    item.mastered = masteredValue;
    item.reviewCount = (item.reviewCount || 0) + 1;
    book.updatedAt = new Date().toISOString();

    await persistBooks();

    if (state.studyFilter === 'unmastered' && masteredValue) {
      rebuildStudyOrder(false);
    } else {
      state.studyCursor = (state.studyCursor + 1) % state.studyOrder.length;
      state.answerVisible = false;
      state.hintVisible = Boolean(state.settings.showHintByDefault);
    }

    renderStudyCard();
  } catch (err) {
    showToast('ھالەتنى ساقلاشتا خاتالىق كۆرۈلدى.', 'error');
  }
}

function renderSettings() {
  try {
    $('toggle-startup-reminder').checked = Boolean(state.settings.startupReminderEnabled);
    $('select-periodic-interval').value = String(state.settings.periodicIntervalMinutes || 0);

    const bookSelect = $('select-reminder-book');
    while (bookSelect.firstChild) {
      bookSelect.removeChild(bookSelect.firstChild);
    }

    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = 'بارلىق كىتابلاردىن ئىختىيارىي';
    bookSelect.appendChild(allOpt);

    state.books.forEach(function (book) {
      const opt = document.createElement('option');
      opt.value = book.id;
      opt.textContent = book.title;
      bookSelect.appendChild(opt);
    });

    bookSelect.value = state.settings.reminderBookId || 'all';
  } catch (err) {
    showToast('تەڭشەكنى يۈكلەشتە خاتالىق كۆرۈلدى.', 'error');
  }
}

function renderDhikr() {
  try {
    const select = $('select-dhikr');
    if (select.options.length === 0) {
      DHIKR_ITEMS.forEach(function (item) {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = item.uyghur + ' (' + item.target + ')';
        select.appendChild(opt);
      });
    }

    const active = DHIKR_ITEMS.find(function (d) {
      return d.id === state.dhikr.selectedId;
    }) || DHIKR_ITEMS[0];

    select.value = active.id;
    const currentCount = state.dhikr.counts[active.id] || 0;

    $('dhikr-arabic').textContent = active.arabic;
    $('dhikr-uyghur').textContent = active.uyghur;
    $('dhikr-meaning').textContent = active.meaning;
    $('dhikr-current-count').textContent = String(currentCount);
    $('dhikr-target-label').textContent = '/ ' + active.target;
    $('dhikr-total-label').textContent = 'جەمئىي زىكىر: ' + (state.dhikr.totalAllTime || 0);
  } catch (err) {
    showToast('زىكىر بۆلىكىنى يۈكلەشتە خاتالىق كۆرۈلدى.', 'error');
  }
}

async function copyPromptToClipboard() {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(MASTER_AI_PROMPT);
    } else {
      const temp = document.createElement('textarea');
      temp.value = MASTER_AI_PROMPT;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    }
    showToast('30 سۇئال-جاۋابلىق AI پرومپت كۆچۈرۈلدى! خالىغان AI مودېلىغا چاپلاپ ئىشلىتىڭ.', 'success');
  } catch (err) {
    showToast('كۆچۈرۈش مەغلۇپ بولدى: ' + err.message, 'error');
  }
}

function bindEvents() {
  $('btn-back').addEventListener('click', function () {
    switchView('home');
  });

  $('btn-open-add').addEventListener('click', function () {
    $('input-book-title').value = '';
    $('input-json-text').value = '';
    $('input-json-file').value = '';
    switchView('add');
  });

  $('btn-copy-prompt').addEventListener('click', copyPromptToClipboard);

  $('btn-open-settings').addEventListener('click', function () {
    switchView('settings');
  });

  $('btn-open-dhikr').addEventListener('click', function () {
    switchView('dhikr');
  });

  $('input-json-file').addEventListener('change', function (e) {
    try {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        const text = typeof reader.result === 'string' ? reader.result : '';
        $('input-json-text').value = text;
        try {
          const preview = JSON.parse(text.trim());
          if (preview && typeof preview.title === 'string' && !$('input-book-title').value.trim()) {
            $('input-book-title').value = preview.title.trim();
          }
        } catch (_ignored) {
          // Validated cleanly when user clicks Save
        }
        showToast('ھۆججەت ئوقۇلدى. «كىتابنى ساقلاش» نى بېسىڭ.', 'success');
      };
      reader.onerror = function () {
        showToast('ھۆججەتنى ئوقۇشتا خاتالىق كۆرۈلدى.', 'error');
      };
      reader.readAsText(file, 'utf-8');
    } catch (err) {
      showToast('ھۆججەت تاللاشتا خاتالىق كۆرۈلدى.', 'error');
    }
  });

  $('btn-save-book').addEventListener('click', async function () {
    try {
      const titleOverride = $('input-book-title').value;
      const rawJson = $('input-json-text').value;
      const result = parseAndValidateBookJson(rawJson, titleOverride);

      if (!result.ok) {
        showToast(result.error, 'error');
        return;
      }

      state.books.unshift(result.book);
      await persistBooks();
      showToast('«' + result.book.title + '» (' + result.book.items.length + ' سۇئال) مۇۋەپپەقىيەتلىك ساقلاندى.', 'success');
      switchView('home');
    } catch (err) {
      showToast('ساقلاش جەريانىدا خاتالىق يۈز بەردى.', 'error');
    }
  });

  // Study controls
  $('btn-filter-all').addEventListener('click', function () {
    state.studyFilter = 'all';
    rebuildStudyOrder(false);
    renderStudyCard();
  });

  $('btn-filter-unmastered').addEventListener('click', function () {
    state.studyFilter = 'unmastered';
    rebuildStudyOrder(false);
    renderStudyCard();
  });

  $('btn-shuffle-cards').addEventListener('click', function () {
    rebuildStudyOrder(true);
    renderStudyCard();
    showToast('سۇئاللار تەرتىپى ئارىلاشتۇرۇلدى.', 'success');
  });

  $('btn-toggle-hint').addEventListener('click', function () {
    state.hintVisible = !state.hintVisible;
    renderStudyCard();
  });

  $('btn-reveal-answer').addEventListener('click', function () {
    state.answerVisible = !state.answerVisible;
    renderStudyCard();
  });

  $('btn-mark-mastered').addEventListener('click', function () {
    markCurrentCard(true);
  });

  $('btn-mark-review').addEventListener('click', function () {
    markCurrentCard(false);
  });

  $('btn-prev-card').addEventListener('click', function () {
    if (state.studyOrder.length === 0) return;
    state.studyCursor = (state.studyCursor - 1 + state.studyOrder.length) % state.studyOrder.length;
    state.answerVisible = false;
    state.hintVisible = Boolean(state.settings.showHintByDefault);
    renderStudyCard();
  });

  $('btn-next-card').addEventListener('click', function () {
    if (state.studyOrder.length === 0) return;
    state.studyCursor = (state.studyCursor + 1) % state.studyOrder.length;
    state.answerVisible = false;
    state.hintVisible = Boolean(state.settings.showHintByDefault);
    renderStudyCard();
  });

  // Settings controls
  $('toggle-startup-reminder').addEventListener('change', async function (e) {
    state.settings.startupReminderEnabled = Boolean(e.target.checked);
    await persistSettings();
    showToast(
      state.settings.startupReminderEnabled
        ? 'بروسىر ئېچىلىش ئەسكەرتىشى ئېچىلدى.'
        : 'بروسىر ئېچىلىش ئەسكەرتىشى ئېتىلدى.',
      'success'
    );
  });

  $('select-periodic-interval').addEventListener('change', async function (e) {
    state.settings.periodicIntervalMinutes = Number(e.target.value) || 0;
    await persistSettings();
    showToast('قەرەللىك ئەسكەرتىش ۋاقتى يېڭىلاندى.', 'success');
  });

  $('select-reminder-book').addEventListener('change', async function (e) {
    state.settings.reminderBookId = e.target.value || 'all';
    await persistSettings();
    showToast('ئەسكەرتىش كىتابى يېڭىلاندى.', 'success');
  });

  $('btn-test-notification').addEventListener('click', function () {
    try {
      chrome.runtime.sendMessage({ type: 'TEST_REMINDER' }, function (response) {
        if (chrome.runtime.lastError) {
          showToast('ئەسكەرتىش مۇلازىمىتى بىلەن ئالاقىلىشىشتا خاتالىق كۆرۈلدى.', 'error');
          return;
        }
        if (response && response.ok) {
          showToast('سىناق ئەسكەرتىشى چىقىرىلدى.', 'success');
        } else {
          showToast((response && response.error) || 'ئەسكەرتىش چىقىرىش ئۈچۈن ئالدى بىلەن كىتاب قوشۇڭ.', 'error');
        }
      });
    } catch (err) {
      showToast('ئەسكەرتىش سىنىقى مەغلۇپ بولدى.', 'error');
    }
  });

  $('btn-export-all').addEventListener('click', function () {
    if (state.books.length === 0) {
      showToast('زاپاسلايدىغان كىتاب يوق.', 'error');
      return;
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'ئۆگىنىش قۇرالىم',
      books: state.books
    };
    if (downloadJsonFile('oginish-quralim-barliq-kitablar.json', payload)) {
      showToast('بارلىق كىتابلار زاپاسلاندى.', 'success');
    }
  });

  // Dhikr controls
  $('select-dhikr').addEventListener('change', async function (e) {
    state.dhikr.selectedId = e.target.value;
    await persistDhikr();
    renderDhikr();
  });

  $('btn-dhikr-tap').addEventListener('click', async function () {
    const id = state.dhikr.selectedId;
    state.dhikr.counts[id] = (state.dhikr.counts[id] || 0) + 1;
    state.dhikr.totalAllTime = (state.dhikr.totalAllTime || 0) + 1;
    await persistDhikr();
    renderDhikr();
  });

  $('btn-dhikr-reset').addEventListener('click', async function () {
    const id = state.dhikr.selectedId;
    state.dhikr.counts[id] = 0;
    await persistDhikr();
    renderDhikr();
    showToast('بۇ زىكىر ساناقى نۆللەندى.', 'success');
  });
}

async function init() {
  try {
    const data = await storageGet([
      STORAGE_KEYS.BOOKS,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.DHIKR
    ]);

    if (Array.isArray(data[STORAGE_KEYS.BOOKS])) {
      state.books = data[STORAGE_KEYS.BOOKS];
    }

    if (data[STORAGE_KEYS.SETTINGS] && typeof data[STORAGE_KEYS.SETTINGS] === 'object') {
      state.settings = Object.assign({}, DEFAULT_SETTINGS, data[STORAGE_KEYS.SETTINGS]);
    }

    if (data[STORAGE_KEYS.DHIKR] && typeof data[STORAGE_KEYS.DHIKR] === 'object') {
      state.dhikr = Object.assign(
        { selectedId: DHIKR_ITEMS[0].id, counts: {}, totalAllTime: 0 },
        data[STORAGE_KEYS.DHIKR]
      );
    }

    bindEvents();
    renderBooksList();
  } catch (err) {
    showToast('قىستۇرمىنى قوزغىتىشتا خاتالىق كۆرۈلدى: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', init);
