(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  var globalConfig = window.CF_ANALYTICS_CONFIG || {};

  var API_URL =
    globalConfig.apiUrl ||
    (currentScript && currentScript.getAttribute('data-api-url')) ||
    'http://localhost:4000/api/events';

  var FLUSH_INTERVAL =
    globalConfig.flushInterval ||
    parseInt((currentScript && currentScript.getAttribute('data-flush-interval')) || '3000', 10);

  var SESSION_STORAGE_KEY = 'cf_analytics_session_id';
  var SESSION_COOKIE_NAME = 'cf_analytics_session_id';
  var MAX_BATCH_SIZE = 20;

  // ---------------------------------------------------------------------
  // Session ID: stored in localStorage, falling back to a cookie if
  // localStorage is unavailable (e.g. privacy mode in some browsers).
  // ---------------------------------------------------------------------
  function generateId() {
    // RFC4122-ish v4 UUID, good enough for a session identifier.
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
  }

  function getOrCreateSessionId() {
    var id = null;

    try {
      id = window.localStorage.getItem(SESSION_STORAGE_KEY);
    } catch (e) {
      // localStorage may be disabled; fall through to cookie.
    }

    if (!id) {
      id = getCookie(SESSION_COOKIE_NAME);
    }

    if (!id) {
      id = generateId();
    }

    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, id);
    } catch (e) {
      // ignore
    }
    setCookie(SESSION_COOKIE_NAME, id, 1); // 1 day session window

    return id;
  }

  var sessionId = getOrCreateSessionId();

  // ---------------------------------------------------------------------
  // Event queue + transport
  // ---------------------------------------------------------------------
  var queue = [];
  var flushing = false;

  function buildEvent(eventType, extra) {
    var base = {
      sessionId: sessionId,
      eventType: eventType,
      pageUrl: window.location.pathname + window.location.search,
      timestamp: new Date().toISOString(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      referrer: document.referrer || undefined,
    };
    return Object.assign(base, extra || {});
  }

  function enqueue(event) {
    queue.push(event);
    if (queue.length >= MAX_BATCH_SIZE) {
      flush();
    }
  }

  function flush(useBeacon) {
    if (flushing || queue.length === 0) return;

    var batch = queue.splice(0, queue.length);
    var body = JSON.stringify(batch);


    if (useBeacon && navigator.sendBeacon) {
      var blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(API_URL, blob);
      return;
    }

    flushing = true;
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      keepalive: true,
    })
      .catch(function (err) {
        // On failure, put events back so the next flush retries them.
        // (Simple strategy; a production tracker would cap retries/backoff.)
        queue = batch.concat(queue);
        if (window.console && console.warn) {
          console.warn('[cf-analytics] failed to send events, will retry:', err);
        }
      })
      .finally(function () {
        flushing = false;
      });
  }

  // ---------------------------------------------------------------------
  // Event listeners
  // ---------------------------------------------------------------------

  // page_view: fired once when the script loads on this page.
  enqueue(buildEvent('page_view'));

  // click: fired on every click, anywhere in the document.
  document.addEventListener(
    'click',
    function (e) {
      enqueue(
        buildEvent('click', {
          x: e.clientX,
          y: e.clientY,
        })
      );
    },
    true
  );

  // Periodic flush.
  setInterval(function () {
    flush(false);
  }, FLUSH_INTERVAL);

  // Best-effort flush when the user leaves/hides the tab.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      flush(true);
    }
  });
  window.addEventListener('pagehide', function () {
    flush(true);
  });

  // Expose a tiny public API for manual/custom event tracking if needed.
  window.cfAnalytics = {
    sessionId: sessionId,
    track: function (eventType, extra) {
      enqueue(buildEvent(eventType, extra));
    },
    flush: function () {
      flush(false);
    },
  };
})();
