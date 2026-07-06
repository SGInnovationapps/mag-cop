/* MAG CoP — PWA登録 & 初回のみ「ホーム画面へ追加」ポップアップ
   すべてのページから <script src="pwa.js" defer></script> で読み込む */
(function () {
  'use strict';

  // ---- Service Worker 登録 ----
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {/* 失敗しても通常表示は継続 */});
    });
  }

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
      + 'background:#26394a;border-top:2px solid #6fb9ba;color:#e8eaec;'
      + 'font-family:"Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;'
      + 'padding:16px 18px calc(16px + env(safe-area-inset-bottom));'
      + 'box-shadow:0 -8px 30px rgba(0,0,0,.45);animation:a2hsUp .3s ease-out;}'
      + '@keyframes a2hsUp{from{transform:translateY(100%);}to{transform:translateY(0);}}'
      + '#a2hs .row{display:flex;align-items:center;gap:14px;max-width:640px;margin:0 auto;}'
      + '#a2hs img{width:44px;height:44px;border-radius:9px;flex:0 0 44px;background:#fff;}'
      + '#a2hs .txt{flex:1;min-width:0;font-size:13px;line-height:1.55;}'
      + '#a2hs .txt b{display:block;font-size:14px;margin-bottom:2px;}'
      + '#a2hs .txt .step{color:#98a8b8;font-size:12px;}'
      + '#a2hs .btns{display:flex;flex-direction:column;gap:8px;flex:0 0 auto;}'
      + '#a2hs button{font-family:ui-monospace,monospace;font-size:12px;letter-spacing:.08em;'
      + 'cursor:pointer;border-radius:3px;padding:9px 16px;border:1px solid #4a6076;}'
      + '#a2hs .add{background:#6fb9ba;border-color:#6fb9ba;color:#182430;font-weight:700;}'
      + '#a2hs .later{background:transparent;color:#98a8b8;}';
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
