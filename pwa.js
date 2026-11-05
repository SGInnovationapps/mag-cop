/* MAG CoP — PWA登録 / ページ切り替え時に履歴を積まない / 初回のみ「ホーム画面へ追加」ポップアップ
   すべてのページから <script src="pwa.js" defer></script> で読み込む */
(function () {
  'use strict';

  // ---- Service Worker 登録 ----
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {/* 失敗しても通常表示は継続 */});
    });
  }

  // ---- タブ切り替えは履歴を上書き（端末の戻るボタン1回でアプリを閉じる） ----
  // data-nav の付いたリンクは location.replace で移動するため、履歴が積み重ならない。
  // PDF・動画は別タブで開くので、アプリ側の履歴には影響しない。
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-nav]') : null;
    if (!a || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // 新規タブで開く操作はそのまま
    e.preventDefault();
    if (a.getAttribute('aria-current') === 'page') return;          // 表示中のタブは何もしない
    location.replace(a.href);
  });

  // ---- 初回のみ A2HS（Add to Home Screen）ポップアップ ----
  var KEY = 'magcop_a2hs_shown';
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches
                     || window.navigator.standalone === true;   // iOS
  if (isStandalone) return;                    // 既にインストール済みなら出さない
  try { if (localStorage.getItem(KEY)) return; } catch (e) { return; }

  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();          // Chrome標準ミニバーを抑止して自前UIで出す
    deferredPrompt = e;
  });

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
              || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function markShown() {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
  }

  function showBanner() {
    var css = ''
      + '#a2hs{position:fixed;left:0;right:0;bottom:0;z-index:9999;'
      + 'background:#2b2858;border-top:2px solid #4fc4b6;color:#ffffff;'
      + 'font-family:"Noto Sans JP","Hiragino Sans","Yu Gothic",sans-serif;'
      + 'padding:16px 18px calc(16px + env(safe-area-inset-bottom));'
      + 'box-shadow:0 -8px 30px rgba(0,0,0,.45);animation:a2hsUp .3s ease-out;}'
      + '@keyframes a2hsUp{from{transform:translateY(100%);}to{transform:translateY(0);}}'
      + '#a2hs .row{display:flex;align-items:center;gap:14px;max-width:640px;margin:0 auto;}'
      + '#a2hs img{width:44px;height:44px;border-radius:9px;flex:0 0 44px;background:#fff;}'
      + '#a2hs .txt{flex:1;min-width:0;font-size:13px;line-height:1.55;}'
      + '#a2hs .txt b{display:block;font-size:14px;margin-bottom:2px;}'
      + '#a2hs .txt .step{color:#b9b6dd;font-size:12px;}'
      + '#a2hs .btns{display:flex;flex-direction:column;gap:8px;flex:0 0 auto;}'
      + '#a2hs button{font-family:inherit;font-size:13px;letter-spacing:.04em;min-height:44px;'
      + 'cursor:pointer;border-radius:999px;padding:9px 18px;border:1.5px solid #4a4785;}'
      + '#a2hs .add{background:#4fc4b6;border-color:#4fc4b6;color:#17153a;font-weight:700;}'
      + '#a2hs .later{background:transparent;color:#d9d7f2;}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var stepHTML = isIOS
      ? '<span class="step">共有ボタン <span style="font-size:15px">&#x2B06;&#xFE0E;</span> →「ホーム画面に追加」でインストールできます</span>'
      : '<span class="step">ホーム画面から1タップで開けるようになります</span>';

    var banner = document.createElement('div');
    banner.id = 'a2hs';
    banner.innerHTML = ''
      + '<div class="row">'
      + '  <img src="icons/icon-192.png" alt="">'
      + '  <div class="txt"><b>MAG CoP をホーム画面に追加</b>' + stepHTML + '</div>'
      + '  <div class="btns">'
      + (isIOS ? '' : '<button class="add">追加する</button>')
      + '    <button class="later">閉じる</button>'
      + '  </div>'
      + '</div>';
    document.body.appendChild(banner);

    function close() { banner.remove(); markShown(); }
    banner.querySelector('.later').addEventListener('click', close);
    var addBtn = banner.querySelector('.add');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.finally(close);
          deferredPrompt = null;
        } else {
          close();
        }
      });
    }
  }

  // ページ描画を邪魔しないよう少し待ってから表示
  window.addEventListener('load', function () {
    setTimeout(showBanner, 1200);
  });
})();
