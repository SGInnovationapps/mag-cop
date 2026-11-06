/* MAG CoP — PDFをアプリ内の全画面オーバーレイで開く
   - pdfs/ または pdfs_jp/ への PDF リンクのクリックを横取りし、viewer.html を iframe で重ねて表示する
   - href の #page=N と data-q（検索語）を viewer に渡すので、該当ページが開き検索語が強調される
   - 開くときに履歴を1つ積むため、端末の戻るボタン（または ×）でオーバーレイだけが閉じる
     閉じた後の戻るボタンは、これまで通りアプリを閉じる
   すべてのページから <script src="pdfview.js" defer></script> で読み込む */
(function () {
  'use strict';

  var overlay = null, lastFocus = null;
  var STATE_KEY = 'magcopViewer';

  // 再読み込み時にオーバーレイ用の履歴状態が残っていたら消しておく
  if (history.state && history.state[STATE_KEY]) {
    try { history.replaceState(null, ''); } catch (e) {}
  }

  function viewerUrl(a) {
    var href = a.getAttribute('href') || '';
    var parts = href.split('#');
    var file = parts[0];
    if (!/^pdfs(_jp)?\/[\w.\-]+\.pdf$/i.test(file)) return null;
    var page = 1, m = (parts[1] || '').match(/page=(\d+)/);
    if (m) page = parseInt(m[1], 10) || 1;
    var url = 'viewer.html?file=' + encodeURIComponent(file) + '&page=' + page;
    var q = a.getAttribute('data-q');
    if (q) url += '&q=' + encodeURIComponent(q);
    return url;
  }

  function openViewer(url, link) {
    if (overlay) closeNow();
    lastFocus = link || null;
    overlay = document.createElement('div');
    overlay.className = 'pdf-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'PDFビューア');
    var frame = document.createElement('iframe');
    frame.title = 'PDFビューア';
    frame.src = url;
    overlay.appendChild(frame);
    document.body.appendChild(overlay);
    document.documentElement.classList.add('pdf-open');
    var st = {}; st[STATE_KEY] = true;
    try { history.pushState(st, ''); } catch (e) {}
    frame.addEventListener('load', function () { try { frame.contentWindow.focus(); } catch (e) {} });
  }

  function closeNow() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.documentElement.classList.remove('pdf-open');
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  }

  // × やEscで閉じるときは、積んだ履歴を戻して閉じる（戻るボタンと同じ経路にそろえる）
  function requestClose() {
    if (history.state && history.state[STATE_KEY]) history.back();
    else closeNow();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // 新規タブで開く操作はそのまま
    var url = viewerUrl(a);
    if (!url) return;
    e.preventDefault();
    openViewer(url, a);
  });

  window.addEventListener('popstate', function () { closeNow(); });

  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin) return;
    if (e.data && e.data.type === 'magcop-viewer-close') requestClose();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay) requestClose();
  });
})();
