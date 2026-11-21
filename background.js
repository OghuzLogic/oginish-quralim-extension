'use strict';

/**
 * ئۆگىنىش قۇرالىم — Chrome Manifest V3 Background Service Worker
 * Handles browser-startup study reminders, optional periodic alarms, and notification clicks.
 * Strictly 100% local — zero network requests.
 */

const STORAGE_KEYS = {
  BOOKS: 'oq_books_v1',
  SETTINGS: 'oq_settings_v1'
};

const ALARM_NAME = 'oq_periodic_study_reminder';

const DEFAULT_SETTINGS = {
  startupReminderEnabled: true,
  periodicIntervalMinutes: 60,
  reminderBookId: 'all'
};

function getStorageData() {
  return new Promise(function (resolve) {
    try {
      chrome.storage.local.get([STORAGE_KEYS.BOOKS, STORAGE_KEYS.SETTINGS], function (res) {
        if (chrome.runtime.lastError) {
          resolve({ books: [], settings: DEFAULT_SETTINGS });
          return;
        }
        const books = Array.isArray(res[STORAGE_KEYS.BOOKS]) ? res[STORAGE_KEYS.BOOKS] : [];
        const settings = Object.assign({}, DEFAULT_SETTINGS, res[STORAGE_KEYS.SETTINGS] || {});
        resolve({ books: books, settings: settings });
      });
    } catch (_err) {
      resolve({ books: [], settings: DEFAULT_SETTINGS });
    }
  });
}

function pickReminderQuestion(books, reminderBookId) {
  if (!Array.isArray(books) || books.length === 0) return null;

  let pool = books;
  if (reminderBookId && reminderBookId !== 'all') {
    const matched = books.find(function (b) {
      return b.id === reminderBookId;
    });
    if (matched) pool = [matched];
  }

  const validBooks = pool.filter(function (b) {
    return Array.isArray(b.items) && b.items.length > 0;
  });
  if (validBooks.length === 0) return null;

  const chosenBook = validBooks[Math.floor(Math.random() * validBooks.length)];
  const unmastered = chosenBook.items.filter(function (item) {
    return !item.mastered;
  });
  const candidates = unmastered.length > 0 ? unmastered : chosenBook.items;
  const chosenItem = candidates[Math.floor(Math.random() * candidates.length)];

  return {
    bookTitle: chosenBook.title,
    question: chosenItem.question,
    remainingCount: unmastered.length
  };
}

async function triggerStudyNotification(forceShow) {
  try {
    const data = await getStorageData();
    if (!forceShow && !data.settings.startupReminderEnabled) {
      return { ok: false, error: 'ئەسكەرتىش ئېتىك.' };
    }

    const picked = pickReminderQuestion(data.books, data.settings.reminderBookId);
    if (!picked) {
      return { ok: false, error: 'ئەسكەرتىش چىقىرىش ئۈچۈن كەمىدە بىر كىتاب قوشۇلۇشى كېرەك.' };
    }

    const notificationId = 'oq_reminder_' + Date.now();
    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'ئۆگىنىش قۇرالىم — ' + picked.bookTitle,
      message: picked.question,
      contextMessage: 'جاۋابىنى كۆرۈش ئۈچۈن قىستۇرمىنى ئېچىڭ',
      priority: 1
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function syncPeriodicAlarm() {
  try {
    const data = await getStorageData();
    chrome.alarms.clear(ALARM_NAME, function () {
      const interval = Number(data.settings.periodicIntervalMinutes) || 0;
      if (data.settings.startupReminderEnabled && interval >= 15) {
        chrome.alarms.create(ALARM_NAME, {
          delayInMinutes: interval,
          periodInMinutes: interval
        });
      }
    });
  } catch (_err) {
    // Safe fallback
  }
}

chrome.runtime.onInstalled.addListener(function () {
  syncPeriodicAlarm();
});

chrome.runtime.onStartup.addListener(function () {
  syncPeriodicAlarm();
  triggerStudyNotification(false);
});

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm && alarm.name === ALARM_NAME) {
    triggerStudyNotification(false);
  }
});

chrome.notifications.onClicked.addListener(function (notificationId) {
  try {
    chrome.notifications.clear(notificationId);
    if (chrome.action && typeof chrome.action.openPopup === 'function') {
      chrome.action.openPopup().catch(function () {
        // Chrome may restrict openPopup without an active user gesture in some contexts
      });
    }
  } catch (_err) {
    // Safe fallback
  }
});

chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
  if (!message || typeof message !== 'object') return;

  if (message.type === 'SYNC_ALARM') {
    syncPeriodicAlarm().then(function () {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === 'TEST_REMINDER') {
    triggerStudyNotification(true).then(function (result) {
      sendResponse(result);
    });
    return true;
  }
});
