/**
 * DragonChat AI Widget — by Dreki Solutions
 * Embed: <script src="https://app.drekisolutions.com/dragonchat.js" data-key="..." data-bot-name="..." data-color="..." data-greeting="..."></script>
 */
(function () {
  'use strict';

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var API_KEY   = script.getAttribute('data-key')      || '';
  var BOT_NAME  = script.getAttribute('data-bot-name') || 'DragonChat AI';
  var COLOR     = script.getAttribute('data-color')    || '#9B7B3F';
  var GREETING  = script.getAttribute('data-greeting') || 'Hi there! How can I help you today?';
  var API_URL   = 'https://app.drekisolutions.com/api/chat';

  /* ── Styles ──────────────────────────────────────────────────────────── */
  var css = [
    '#dc-widget-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,.35);z-index:2147483646;transition:transform .2s ease,box-shadow .2s ease;}',
    '#dc-widget-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(0,0,0,.45);}',
    '#dc-widget-btn svg{pointer-events:none;}',
    '#dc-widget-panel{position:fixed;bottom:92px;right:24px;width:340px;max-height:520px;border-radius:12px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.5);z-index:2147483645;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;transform:scale(.92) translateY(12px);opacity:0;pointer-events:none;transition:transform .22s ease,opacity .22s ease;}',
    '#dc-widget-panel.dc-open{transform:scale(1) translateY(0);opacity:1;pointer-events:all;}',
    '#dc-panel-header{padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;}',
    '#dc-panel-header .dc-avatar{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:16px;}',
    '#dc-panel-header .dc-title{color:#fff;font-size:14px;font-weight:600;line-height:1;}',
    '#dc-panel-header .dc-subtitle{color:rgba(255,255,255,.65);font-size:11px;margin-top:2px;}',
    '#dc-panel-header .dc-close{margin-left:auto;background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;padding:4px;display:flex;line-height:1;}',
    '#dc-panel-header .dc-close:hover{color:#fff;}',
    '#dc-messages{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px;background:#1a1a1a;}',
    '#dc-messages::-webkit-scrollbar{width:4px;}',
    '#dc-messages::-webkit-scrollbar-track{background:transparent;}',
    '#dc-messages::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:2px;}',
    '.dc-msg{max-width:82%;padding:9px 13px;border-radius:12px;font-size:13px;line-height:1.5;word-break:break-word;}',
    '.dc-msg.dc-bot{align-self:flex-start;background:#2a2a2a;color:#e8e8e8;border-bottom-left-radius:3px;}',
    '.dc-msg.dc-user{align-self:flex-end;color:#fff;border-bottom-right-radius:3px;}',
    '.dc-typing{align-self:flex-start;display:flex;gap:4px;padding:10px 14px;background:#2a2a2a;border-radius:12px;border-bottom-left-radius:3px;}',
    '.dc-typing span{width:7px;height:7px;border-radius:50%;background:#888;animation:dc-bounce .9s infinite ease-in-out;}',
    '.dc-typing span:nth-child(1){animation-delay:0s;}',
    '.dc-typing span:nth-child(2){animation-delay:.18s;}',
    '.dc-typing span:nth-child(3){animation-delay:.36s;}',
    '@keyframes dc-bounce{0%,80%,100%{transform:translateY(0);}40%{transform:translateY(-6px);}}',
    '#dc-input-row{display:flex;gap:8px;padding:10px 12px;background:#111;border-top:1px solid #2a2a2a;flex-shrink:0;}',
    '#dc-input{flex:1;background:#1e1e1e;border:1px solid #333;border-radius:8px;padding:9px 12px;color:#e8e8e8;font-size:13px;outline:none;resize:none;line-height:1.4;max-height:90px;font-family:inherit;}',
    '#dc-input::placeholder{color:#666;}',
    '#dc-input:focus{border-color:var(--dc-color);}',
    '#dc-send{background:var(--dc-color);border:none;border-radius:8px;padding:0 13px;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .15s;}',
    '#dc-send:hover{opacity:.85;}',
    '#dc-send:disabled{opacity:.4;cursor:not-allowed;}',
    '#dc-badge{position:absolute;top:-3px;right:-3px;width:14px;height:14px;border-radius:50%;background:#ef4444;display:none;border:2px solid #fff;}',
  ].join('');

  /* ── SVG icons ──────────────────────────────────────────────────────── */
  var CHAT_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var CLOSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var SEND_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';

  /* ── DOM ─────────────────────────────────────────────────────────────── */
  function injectStyles() {
    var el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  }

  function buildWidget() {
    /* Root variable for color */
    document.documentElement.style.setProperty('--dc-color', COLOR);

    /* Panel */
    var panel = document.createElement('div');
    panel.id = 'dc-widget-panel';
    panel.innerHTML = [
      '<div id="dc-panel-header" style="background:' + COLOR + '">',
        '<div class="dc-avatar">🐉</div>',
        '<div>',
          '<div class="dc-title">' + escHtml(BOT_NAME) + '</div>',
          '<div class="dc-subtitle">Powered by Dreki AI</div>',
        '</div>',
        '<button class="dc-close" id="dc-close-btn" aria-label="Close chat">' + CLOSE_ICON + '</button>',
      '</div>',
      '<div id="dc-messages"></div>',
      '<div id="dc-input-row">',
        '<textarea id="dc-input" rows="1" placeholder="Type a message…" aria-label="Chat message"></textarea>',
        '<button id="dc-send" aria-label="Send">' + SEND_ICON + '</button>',
      '</div>',
    ].join('');

    /* Toggle button */
    var btn = document.createElement('button');
    btn.id = 'dc-widget-btn';
    btn.setAttribute('aria-label', 'Open chat');
    btn.style.background = COLOR;
    btn.innerHTML = CHAT_ICON + '<span id="dc-badge"></span>';

    document.body.appendChild(panel);
    document.body.appendChild(btn);

    /* Init messages */
    appendBotMsg(GREETING);

    /* Events */
    btn.addEventListener('click', function () { togglePanel(panel, btn); });
    document.getElementById('dc-close-btn').addEventListener('click', function () { closePanel(panel, btn); });

    var input = document.getElementById('dc-input');
    var sendBtn = document.getElementById('dc-send');

    sendBtn.addEventListener('click', function () { sendMessage(input, sendBtn); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input, sendBtn);
      }
    });
    input.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 90) + 'px';
    });
  }

  var panelOpen = false;

  function togglePanel(panel, btn) {
    if (panelOpen) { closePanel(panel, btn); } else { openPanel(panel, btn); }
  }

  function openPanel(panel, btn) {
    panelOpen = true;
    panel.classList.add('dc-open');
    btn.setAttribute('aria-label', 'Close chat');
    btn.innerHTML = CLOSE_ICON + '<span id="dc-badge"></span>';
    btn.querySelector('svg').style.color = '#fff';
    document.getElementById('dc-badge').style.display = 'none';
    setTimeout(function () { document.getElementById('dc-input').focus(); }, 250);
    scrollToBottom();
  }

  function closePanel(panel, btn) {
    panelOpen = false;
    panel.classList.remove('dc-open');
    btn.setAttribute('aria-label', 'Open chat');
    btn.innerHTML = CHAT_ICON + '<span id="dc-badge"></span>';
  }

  function appendBotMsg(text) {
    var msgs = document.getElementById('dc-messages');
    if (!msgs) return;
    var el = document.createElement('div');
    el.className = 'dc-msg dc-bot';
    el.textContent = text;
    msgs.appendChild(el);
    scrollToBottom();
    return el;
  }

  function appendUserMsg(text) {
    var msgs = document.getElementById('dc-messages');
    var el = document.createElement('div');
    el.className = 'dc-msg dc-user';
    el.style.background = COLOR;
    el.textContent = text;
    msgs.appendChild(el);
    scrollToBottom();
  }

  function showTyping() {
    var msgs = document.getElementById('dc-messages');
    var el = document.createElement('div');
    el.className = 'dc-typing';
    el.id = 'dc-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(el);
    scrollToBottom();
  }

  function hideTyping() {
    var el = document.getElementById('dc-typing');
    if (el) el.remove();
  }

  function scrollToBottom() {
    var msgs = document.getElementById('dc-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  function sendMessage(input, sendBtn) {
    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;
    appendUserMsg(text);
    showTyping();

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, botName: BOT_NAME, apiKey: API_KEY }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        hideTyping();
        appendBotMsg(data.reply || "I'm here to help!");
      })
      .catch(function () {
        hideTyping();
        appendBotMsg("I'm having a moment — please try again shortly!");
      })
      .finally(function () {
        sendBtn.disabled = false;
        input.focus();
        /* Show badge if panel is closed */
        if (!panelOpen) {
          document.getElementById('dc-badge').style.display = 'block';
        }
      });
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Boot ─────────────────────────────────────────────────────────────── */
  function init() {
    injectStyles();
    buildWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
