/* =========================================================
   WEBページが開くまで ─ 情報Ⅰ 情報通信ネットワーク
   ※ 問題・クイズの内容は「データ」の部分（各 const）を書きかえるだけで変更できます。
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 共通ユーティリティ ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = ms => new Promise(res => setTimeout(res, ms));
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* =========================================================
     データ（先生用：ここを編集すると内容が変わります）
     ========================================================= */

  const STEPS = [
    { n: 1, title: 'URLの入力と解析', lead: '住所（URL）を3つの要素に分解する' },
    { n: 2, title: 'DNSによる「名前解決」', lead: 'ドメイン名をIPアドレスへ変換する' },
    { n: 3, title: 'WEBサーバーへの接続とパケット通信', lead: 'TCP/IPとルーターでデータを運ぶ' },
    { n: 4, title: 'HTTPリクエストとレスポンス', lead: 'クライアントが要求し、サーバーが応答する' },
    { n: 5, title: 'ブラウザによるレンダリング', lead: '受け取ったHTMLを画面に描き出す' }
  ];

  // ステップ1：URLパズル（5問）
  const URL_PUZZLES = [
    { proto: 'https://', domain: 'example.com', path: '/index.html',
      note: '基本の形です。「プロトコル → ドメイン名 → パス名」の順に並んでいます。' },
    { proto: 'http://', domain: 'www.example.ac.jp', path: '/club/kendo.html',
      note: 'ドメイン名は「.」で区切られた、いくつかの部分でできています。' },
    { proto: 'https://', domain: 'info.example.jp', path: '/quiz/question1.html',
      note: '先頭の「info.」のように、名前を足してサイトを区別することもあります。' },
    { proto: 'https://', domain: 'www.example.co.jp', path: '/shop/item/photo.jpg',
      note: 'パス名の「/」はフォルダの区切りです。最後の photo.jpg はファイル名で、画像もファイルの一つです。' },
    { proto: 'http://', domain: 'example.org', path: '/news/2026/09/index.html',
      note: 'http:// で始まるURLは、通信が暗号化されません。現在は https:// が広く使われています。' }
  ];

  // ステップ2：DNSの台帳（IPアドレスは説明用に予約されている番号）
  const DNS_RECORDS = [
    { d: 'example.com', ip: '192.0.2.1' },
    { d: 'www.example.ac.jp', ip: '198.51.100.24' },
    { d: 'info.example.jp', ip: '203.0.113.7' },
    { d: 'example.org', ip: '192.0.2.88' },
    { d: 'www.example.co.jp', ip: '198.51.100.150' }
  ];
  const DNS_CHOICES = ['example.com', 'www.example.ac.jp', 'examp1e.com', 'example.org']; // examp1e.com は打ち間違い

  // ステップ3：送るメッセージ（6つに分割）と宛先
  const PACKET_CHUNKS = ['example.com', 'の', 'トップ', 'ページを', '見せて', 'ください'];
  const PACKET_DEST = '192.0.2.1';

  // ステップ4：サーバーにあるファイル
  const HTTP_PAGES = {
    '/index.html': { code: 200, text: 'OK', body: '<html>\n <body>\n  <h1>ようこそ</h1>\n  <p>トップページです</p>\n </body>\n</html>' },
    '/about.html': { code: 200, text: 'OK', body: '<html>\n <body>\n  <h1>このサイトについて</h1>\n </body>\n</html>' },
    '/missing.html': { code: 404, text: 'Not Found', body: '<html>\n <body>\n  <h1>404 Not Found</h1>\n  <p>ページが見つかりません</p>\n </body>\n</html>' }
  };

  // ステップ5：レンダリングの正しい順番
  const RENDER_FLOW = [
    { id: 'html', title: 'HTMLの解析', desc: '文章構造や骨組み（テキスト・見出し）を解析し、DOMツリーを構築する。',
      why: 'まず骨組み（DOMツリー）がないと、デザインを当てる対象も、プログラムで動かす対象もありません。',
      lines: ['html', ' ├ head', ' │  └ title「example.com」', ' └ body', '    ├ h3「ようこそ！」', '    ├ p「これはWEBページの見本です。」', '    ├ p「読み込み時刻：（あとで入る）」', '    └ button「いいね！」', '→ DOMツリー完成'] },
    { id: 'css', title: 'CSSの解析', desc: 'デザインやレイアウトを解析し、スタイルを適用する。',
      why: '骨組みができたら、次はデザインやレイアウトの情報を、それぞれの要素に当てはめます。',
      lines: ['h3     → 大きな文字・青い色', 'p      → 行の間隔を広げる', 'button → 角丸・赤い背景色', 'body   → 余白・うすい背景色', '→ スタイルを適用完了'] },
    { id: 'js', title: 'JavaScriptの実行', desc: 'JavaScriptを実行し、ページの動的な動きやプログラム処理を反映する。',
      why: '見た目の準備ができたあとで、プログラムを実行して、動きや処理を加えます。',
      lines: ['読み込み時刻を求めて、ページに書き込む', 'ボタンを押すと数字が増えるように設定', '→ 動的な動きを反映'] },
    { id: 'paint', title: '画面描画', desc: '各要素の位置やサイズを計算し、ディスプレイ画面へピクセルとして描画する。',
      why: '最後に、要素の位置や大きさを計算して、画面にピクセルとして描き出します。',
      lines: ['各要素の位置と大きさを計算（例：見出し x:22 y:20）', '画面のピクセルに変換して出力', '→ 画面に表示！'] }
  ];

  // クイズ（q：問題 / o：選択肢 / a：正解の番号(0から) / e：解説）
  const QUIZ = {
    dns: [
      { q: '「example.com」のような名前を、「192.0.2.1」のような数字に変換するしくみはどれ？',
        o: ['HTTP', 'DNS', 'パケット交換方式'], a: 1,
        e: 'DNS（Domain Name System）が、ドメイン名をIPアドレスに変換します。これを「名前解決」といいます。' },
      { q: '名前解決の正しい順番はどれ？',
        o: ['① 応答 → ② 問い合わせ → ③ 検索・参照', '① 検索・参照 → ② 応答 → ③ 問い合わせ', '① 問い合わせ → ② 検索・参照 → ③ 応答'], a: 2,
        e: 'PCが問い合わせ、DNSサーバーが台帳を検索・参照し、見つかったIPアドレスを応答します。' },
      { q: '通信にはIPアドレスが必要なのに、私たちがドメイン名を使うのはなぜ？',
        o: ['数字の羅列は、人間には覚えにくいから', 'ドメイン名のほうが通信が速いから', 'IPアドレスは使えなくなったから'], a: 0,
        e: '人間が覚えやすい名前を使い、コンピュータが使う数字への変換はDNSにまかせています。' }
    ],
    packet: [
      { q: 'データを小さな「パケット」に分けて、宛先や番号を付けて送る通信方式はどれ？',
        o: ['1つの通信が回線を独占する方式', 'パケット交換方式', 'ドメイン名を数字にする方式'], a: 1,
        e: 'パケット交換方式です。1本の回線を、たくさんの通信で分け合って使えます。' },
      { q: 'パケットの宛先を見て、次にどこへ送るか選んで転送する機器はどれ？',
        o: ['ルーター', 'ブラウザ', 'DNSサーバー'], a: 0,
        e: 'ルーターが経路を選ぶ（ルーティング）ので、故障や混雑をよけて届けられます。' },
      { q: 'パケットが順番バラバラに届いても、元のデータに戻せるのはなぜ？',
        o: ['パケットがいつも同じ経路を通るから', 'ルーターが順番どおりにそろえて送るから', 'パケットに番号がついていて、TCPが並べ直すから'], a: 2,
        e: '番号をもとに、受け取った側のTCPが並べ直します。届かないパケットは再送も求めます。' },
      { q: 'TCP/IPのうち、「宛先のIPアドレスまでパケットを届ける（住所の役割）」を担うのはどっち？',
        o: ['TCP', 'IP'], a: 1,
        e: 'IPが宛先まで届け、TCPが順番の確認や再送で「確実に届ける」役割を担います。' }
    ],
    http: [
      { q: '<code>GET /index.html HTTP/1.1</code> は、どちらのメッセージ？',
        o: ['HTTPリクエスト（要求）', 'HTTPレスポンス（応答）'], a: 0,
        e: 'クライアントがサーバーへ「このファイルをください」と要求するのがHTTPリクエストです。' },
      { q: '<code>HTTP/1.1 404 Not Found</code> は、何を伝えている？',
        o: ['成功したので、ページを返します', 'IPアドレスを調べています', '要求されたファイルがサーバーに見つかりません'], a: 2,
        e: '404は「見つからない」という結果です。サーバーは、ファイルがないことも応答で知らせます。' },
      { q: 'クライアント・サーバーモデルで、「クライアント」にあたるのはどれ？',
        o: ['WEBサーバー', 'ルーター', 'WEBブラウザ（要求を出す側）'], a: 2,
        e: '要求を出す側がクライアント、応じて提供する側がサーバーです。' }
    ]
  };

  /* =========================================================
     進み具合の保存・画面遷移
     ========================================================= */
  const KEY = 'info1-network-progress-v1';
  let progress = { 1: false, 2: false, 3: false, 4: false, 5: false };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') progress = Object.assign(progress, saved);
  } catch (e) { /* 保存できない環境でも動く */ }
  function saveProgress() {
    try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch (e) { /* 何もしない */ }
  }

  const VIEWS = ['home', '1', '2', '3', '4', '5'];
  const FOCUS = { home: 'proto domain path', 1: 'proto domain path', 2: 'domain', 3: 'domain', 4: 'path', 5: '' };
  const STATUS = {
    home: '待機中',
    1: 'URLを解析しています…',
    2: 'ホスト名を解決しています…',
    3: 'example.com に接続しています…',
    4: 'example.com からの応答を待っています…',
    5: 'ページを表示しています…'
  };
  const addr = $('#addr');
  let current = 'home';

  function go(v) {
    v = String(v);
    if (!VIEWS.includes(v)) v = 'home';
    current = v;
    $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
    $$('.st').forEach(b => {
      const on = b.dataset.go === v;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    addr.dataset.focus = FOCUS[v];
    updateStatus();
    try { history.replaceState(null, '', v === 'home' ? location.pathname + location.search : '#' + v); } catch (e) { /* file:// など */ }
    window.scrollTo(0, 0);
  }

  function updateStatus() {
    const allDone = STEPS.every(s => progress[s.n]);
    let text = STATUS[current];
    let loading = current !== 'home';
    let finished = false;
    if (current === 'home') {
      if (allDone) { text = '完了'; finished = true; }
    } else if (progress[current]) {
      text = '完了'; loading = false; finished = true;
    }
    $('#statusText').textContent = text;
    addr.classList.toggle('loading', loading);
    addr.classList.toggle('finished', finished);
  }

  function renderJourney() {
    const ol = $('#journey');
    ol.innerHTML = '';
    STEPS.forEach(s => {
      const li = el('li', 'j-item' + (progress[s.n] ? ' done' : ''));
      li.innerHTML = '<button type="button" class="j-btn" data-go="' + s.n + '">' +
        '<span class="j-num">' + (progress[s.n] ? '✓' : s.n) + '</span>' +
        '<span class="j-text"><b>' + s.title + '</b><small>' + s.lead + '</small></span>' +
        '<span class="j-state">' + (progress[s.n] ? 'クリア' : 'これから') + '</span></button>';
      ol.appendChild(li);
    });
  }

  function updateProgressUI() {
    const count = STEPS.filter(s => progress[s.n]).length;
    $('#loadbar').style.width = (count / STEPS.length * 100) + '%';
    $$('.st').forEach(b => {
      const n = b.dataset.go;
      const done = n !== 'home' && progress[n];
      b.classList.toggle('done', done);
      $('.st-dot', b).textContent = n === 'home' ? '⌂' : (done ? '✓' : n);
    });
    STEPS.forEach(s => { const b = $('#done-' + s.n); if (b) b.hidden = !progress[s.n]; });
    $('#complete-msg').hidden = count !== STEPS.length;
    renderJourney();
    updateStatus();
  }

  let toastTimer = null;
  function toast(text) {
    const t = $('#toast');
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  function markDone(n) {
    const first = !progress[n];
    progress[n] = true;
    saveProgress();
    updateProgressUI();
    if (first) {
      toast('ステップ' + n + ' クリア！');
      const b = $('#done-' + n);
      if (b) setTimeout(() => b.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
    }
  }

  // 複数の条件（体験＋クイズ）がそろったらクリア
  const parts = { 2: { sim: false, quiz: false }, 3: { sim: false, quiz: false }, 4: { sim: false, quiz: false } };
  function part(n, key) {
    if (!parts[n]) return;
    parts[n][key] = true;
    if (Object.values(parts[n]).every(Boolean)) markDone(n);
  }

  /* =========================================================
     共通部品：パーツ運び（タップ／ドラッグ両対応）
     ========================================================= */
  function makeChip(content, data, isHtml) {
    const b = el('button', 'chip');
    b.type = 'button';
    b.innerHTML = '<span class="grip" aria-hidden="true">⋮⋮</span><span class="chip-text"></span>';
    const t = $('.chip-text', b);
    if (isHtml) t.innerHTML = content; else t.textContent = content;
    Object.keys(data || {}).forEach(k => { b.dataset[k] = data[k]; });
    return b;
  }

  function createPlacer(pool, slots, onChange) {
    let selected = null;
    const bodyOf = s => $('.slot-body', s);
    const slotOf = c => c.closest('.slot');

    function setSelected(c) {
      if (selected) selected.classList.remove('selected');
      selected = c || null;
      if (selected) selected.classList.add('selected');
      slots.forEach(s => s.classList.toggle('armed', !!selected));
    }

    function move(chip, dest) {
      const from = slotOf(chip);
      if (dest === pool) {
        pool.appendChild(chip);
      } else {
        const body = bodyOf(dest);
        const occupant = $('.chip', body);
        if (occupant && occupant !== chip) (from ? bodyOf(from) : pool).appendChild(occupant);
        body.appendChild(chip);
      }
      setSelected(null);
      onChange();
    }

    function tap(chip) {
      const inSlot = slotOf(chip);
      if (selected && selected !== chip) {
        if (inSlot) move(selected, inSlot); else setSelected(chip);
      } else if (inSlot) {
        move(chip, pool);
      } else {
        setSelected(selected === chip ? null : chip);
      }
    }

    slots.forEach(s => s.addEventListener('click', () => { if (selected) move(selected, s); }));

    function add(chip) {
      let sx = 0, sy = 0, pid = null, dragging = false;
      chip.addEventListener('pointerdown', e => {
        if (chip.classList.contains('locked')) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        pid = e.pointerId; sx = e.clientX; sy = e.clientY; dragging = false;
        try { chip.setPointerCapture(pid); } catch (err) { /* 何もしない */ }
      });
      chip.addEventListener('pointermove', e => {
        if (pid === null || e.pointerId !== pid) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (!dragging && Math.hypot(dx, dy) > 8) { dragging = true; chip.classList.add('dragging'); }
        if (dragging) chip.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.04)';
      });
      const finish = (e, cancelled) => {
        if (pid === null || e.pointerId !== pid) return;
        const wasDragging = dragging;
        pid = null; dragging = false;
        try { chip.releasePointerCapture(e.pointerId); } catch (err) { /* 何もしない */ }
        if (wasDragging) {
          chip.style.visibility = 'hidden';
          const under = cancelled ? null : document.elementFromPoint(e.clientX, e.clientY);
          chip.style.visibility = '';
          chip.classList.remove('dragging');
          chip.style.transform = '';
          const slot = under && under.closest('.slot');
          if (slot && slots.indexOf(slot) >= 0) move(chip, slot);
          else if (under && (under === pool || pool.contains(under)) && slotOf(chip)) move(chip, pool);
        } else if (!cancelled) {
          tap(chip);
        }
      };
      chip.addEventListener('pointerup', e => finish(e, false));
      chip.addEventListener('pointercancel', e => finish(e, true));
      chip.addEventListener('click', e => {
        e.stopPropagation();
        if (e.detail === 0 && !chip.classList.contains('locked')) tap(chip); // キーボード操作
      });
      pool.appendChild(chip);
    }

    return { add, clearSelection: () => setSelected(null) };
  }

  /* =========================================================
     共通部品：クイズ
     ========================================================= */
  function mountQuiz(root, items, onAllCorrect) {
    root.innerHTML = '';
    let correct = 0;
    items.forEach((it, qi) => {
      const q = el('div', 'q');
      q.appendChild(el('p', 'q-text', '<b>Q' + (qi + 1) + '.</b> ' + it.q));
      const opts = el('div', 'q-opts');
      const exp = el('p', 'q-exp');
      exp.hidden = true;
      it.o.forEach((txt, oi) => {
        const b = el('button', 'opt', txt);
        b.type = 'button';
        b.addEventListener('click', () => {
          if (q.classList.contains('solved')) return;
          exp.hidden = false;
          if (oi === it.a) {
            b.classList.add('ok');
            q.classList.add('solved');
            $$('.opt', opts).forEach(x => { x.disabled = true; });
            exp.className = 'q-exp ok';
            exp.innerHTML = '<b>正解！</b> ' + it.e;
            correct++;
            if (correct === items.length && onAllCorrect) onAllCorrect();
          } else {
            b.classList.add('ng');
            b.disabled = true;
            exp.className = 'q-exp ng';
            exp.textContent = 'おしい！もう一度考えてみよう。';
          }
        });
        opts.appendChild(b);
      });
      q.appendChild(opts);
      q.appendChild(exp);
      root.appendChild(q);
    });
  }

  /* =========================================================
     ステップ1：URLパズル
     ========================================================= */
  function initStep1() {
    const pool = $('#p1-pool');
    const slotsWrap = $('#p1-slots');
    const slots = $$('.slot', slotsWrap);
    const checkBtn = $('#p1-check'), resetBtn = $('#p1-reset'), nextBtn = $('#p1-next');
    const fb = $('#p1-feedback'), note = $('#p1-note'), numEl = $('#p1-num'), dots = $('#p1-dots');
    const solved = new Set();
    let idx = 0, locked = false;

    const placer = createPlacer(pool, slots, () => {
      if (locked) return;
      clearMarks();
      fb.className = 'feedback'; fb.textContent = '';
      checkBtn.disabled = !slots.every(s => $('.chip', s));
    });

    function clearMarks() {
      slots.forEach(s => s.classList.remove('ok', 'ng'));
      $$('.chip', $('#view-1')).forEach(c => c.classList.remove('ok', 'ng', 'r-proto', 'r-domain', 'r-path'));
    }

    function renderDots() {
      dots.innerHTML = '';
      URL_PUZZLES.forEach((_, i) => {
        dots.appendChild(el('span', 'dot' + (solved.has(i) ? ' solved' : '') + (i === idx ? ' now' : '')));
      });
    }

    function load(i) {
      idx = i; locked = false;
      placer.clearSelection();
      slots.forEach(s => { s.classList.remove('ok', 'ng'); $('.slot-body', s).innerHTML = ''; });
      pool.innerHTML = '';
      fb.className = 'feedback'; fb.textContent = '';
      note.hidden = true;
      const p = URL_PUZZLES[i];
      const items = [{ role: 'proto', text: p.proto }, { role: 'domain', text: p.domain }, { role: 'path', text: p.path }];
      let order;
      do { order = shuffle(items); } while (order.every((x, k) => x === items[k]));
      order.forEach(it => placer.add(makeChip(it.text, { role: it.role })));
      slotsWrap.classList.toggle('nohint', i >= 3); // 4問目以降はヒントなし
      numEl.textContent = i + 1;
      checkBtn.hidden = false; checkBtn.disabled = true;
      resetBtn.hidden = false; nextBtn.hidden = true;
      renderDots();
    }

    checkBtn.addEventListener('click', () => {
      const results = slots.map(s => {
        const c = $('.chip', s);
        const good = !!c && c.dataset.role === s.dataset.role;
        s.classList.add(good ? 'ok' : 'ng');
        if (c) {
          c.classList.add(good ? 'ok' : 'ng');
          if (good) c.classList.add('r-' + s.dataset.role);
        }
        return good;
      });
      const p = URL_PUZZLES[idx];
      if (results.every(Boolean)) {
        locked = true;
        solved.add(idx);
        $$('.chip', slotsWrap).forEach(c => c.classList.add('locked'));
        fb.className = 'feedback ok';
        fb.innerHTML = '正解！ <span class="url-inline"><span class="u-proto" style="color:var(--proto)">' + esc(p.proto) +
          '</span><span style="color:var(--domain)">' + esc(p.domain) + '</span><span style="color:var(--path)">' + esc(p.path) + '</span></span>';
        note.textContent = p.note;
        note.hidden = false;
        checkBtn.hidden = true; resetBtn.hidden = true;
        if (idx < URL_PUZZLES.length - 1) {
          nextBtn.hidden = false;
        } else {
          fb.innerHTML += '<br>5問すべてクリア！';
        }
        renderDots();
        if (solved.size === URL_PUZZLES.length) markDone(1);
      } else {
        fb.className = 'feedback ng';
        fb.textContent = '赤いパーツは、場所がちがいます。それぞれの役割をもう一度確認して、置き直してみよう。';
      }
    });
    resetBtn.addEventListener('click', () => load(idx));
    nextBtn.addEventListener('click', () => load(idx + 1));
    load(0);
  }

  /* ---- 自由入力のURL分解 ---- */
  function parseUrl(str) {
    if (/\s/.test(str)) return null;
    const m = str.match(/^([a-zA-Z][a-zA-Z0-9+.\-]*):\/\/([^\/?#]+)(.*)$/);
    if (!m) return null;
    return { proto: m[1] + '://', domain: m[2], path: m[3] };
  }

  function initAnalyzer() {
    const input = $('#az-input'), out = $('#az-out');
    function run() {
      const v = input.value.trim();
      if (!v) { out.innerHTML = '<p class="muted">URLを入力すると、ここに分解した結果が出ます。</p>'; return; }
      const r = parseUrl(v);
      if (!r) {
        out.innerHTML = '<p class="az-warn">3つの要素に分けられません。「https://」のように、最初のプロトコルと「://」を付けて入力してみよう。</p>';
        return;
      }
      const pathHtml = r.path
        ? '<code>' + esc(r.path) + '</code><small>サーバーの中の、ファイルやデータの場所。</small>'
        : '<code>（なし）</code><small>パス名がないときは、サーバーが用意している標準のページ（トップページなど）が返されるのが一般的です。</small>';
      out.innerHTML =
        '<p class="az-url"><span class="u-proto">' + esc(r.proto) + '</span><span class="u-domain">' + esc(r.domain) + '</span><span class="u-path">' + esc(r.path) + '</span></p>' +
        '<div class="az-list">' +
        '<div class="az-item r-proto"><b>プロトコル</b><div><code>' + esc(r.proto) + '</code><small>通信の約束事。</small></div></div>' +
        '<div class="az-item r-domain"><b>ドメイン名</b><div><code>' + esc(r.domain) + '</code><small>WEBサイトの名称・住所。</small></div></div>' +
        '<div class="az-item r-path"><b>パス名</b><div>' + pathHtml + '</div></div>' +
        '</div>';
    }
    input.addEventListener('input', run);
    $$('[data-example]').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.example; run(); }));
    run();
  }

  /* =========================================================
     ステップ2：DNS
     ========================================================= */
  function initStep2() {
    const wrap = $('#dns-domains'), env = $('#dns-env'), msg = $('#dns-msg'), pcNote = $('#dns-pc-note');
    const tbody = $('#dns-table tbody');
    const b1 = $('#dns-b1'), b2 = $('#dns-b2'), b3 = $('#dns-b3'), resetBtn = $('#dns-reset');
    let domain = null, found = null, busy = false;

    DNS_RECORDS.forEach(r => {
      const tr = el('tr', '', '<td>' + esc(r.d) + '</td><td>' + esc(r.ip) + '</td>');
      tr.dataset.d = r.d;
      tbody.appendChild(tr);
    });
    DNS_CHOICES.forEach(d => {
      const b = el('button', 'pick', esc(d));
      b.type = 'button'; b.dataset.d = d;
      wrap.appendChild(b);
    });

    function setMsg(html, cls) { msg.className = 'stage-msg' + (cls ? ' ' + cls : ''); msg.innerHTML = html; }

    function reset() {
      found = null; busy = false;
      env.className = 'env'; env.textContent = '✉️';
      pcNote.className = 'node-note'; pcNote.textContent = 'IPアドレス：？';
      $$('tr', tbody).forEach(tr => tr.classList.remove('scan', 'hit'));
      $$('.pick', wrap).forEach(b => { b.disabled = false; b.classList.toggle('on', b.dataset.d === domain); });
      b1.disabled = !domain; b2.disabled = true; b3.disabled = true;
      setMsg(domain ? '「<b>' + esc(domain) + '</b>」を調べます。① 問い合わせ を押してください。' : 'ドメイン名を選んでください。');
    }

    wrap.addEventListener('click', e => {
      const b = e.target.closest('.pick');
      if (!b || busy) return;
      domain = b.dataset.d;
      reset();
    });
    resetBtn.addEventListener('click', () => { if (!busy) reset(); });

    b1.addEventListener('click', async () => {
      busy = true;
      b1.disabled = true;
      $$('.pick', wrap).forEach(b => { b.disabled = true; });
      setMsg('<span class="tag">① 問い合わせ</span>PC →「<b>' + esc(domain) + '</b> のIPアドレスを教えてください」');
      env.classList.add('show');
      await sleep(40);
      env.classList.add('right');
      await sleep(1250);
      setMsg('<span class="tag">① 問い合わせ</span>DNSサーバーに届きました。次は ② 検索・参照 です。');
      busy = false; b2.disabled = false;
    });

    b2.addEventListener('click', async () => {
      busy = true;
      b2.disabled = true;
      setMsg('<span class="tag">② 検索・参照</span>DNSサーバーが、台帳から「<b>' + esc(domain) + '</b>」を探しています…');
      const rows = $$('tr', tbody);
      for (const tr of rows) {
        tr.classList.add('scan');
        await sleep(420);
        if (tr.dataset.d === domain) { tr.classList.remove('scan'); tr.classList.add('hit'); found = DNS_RECORDS.find(r => r.d === domain); break; }
        tr.classList.remove('scan');
      }
      if (found) setMsg('<span class="tag">② 検索・参照</span>見つかりました！ <b>' + esc(found.d) + '</b> ＝ <b>' + esc(found.ip) + '</b>。次は ③ 応答 です。');
      else setMsg('<span class="tag">② 検索・参照</span>台帳に「<b>' + esc(domain) + '</b>」はありません…。それでも ③ 応答 を返します。', 'ng');
      busy = false; b3.disabled = false;
    });

    b3.addEventListener('click', async () => {
      busy = true;
      b3.disabled = true;
      setMsg('<span class="tag">③ 応答</span>DNSサーバー → PC ' + (found ? '「IPアドレスは <b>' + esc(found.ip) + '</b> です」' : '「見つかりませんでした」'));
      env.textContent = found ? '📨' : '❓';
      env.classList.remove('right');
      await sleep(1300);
      if (found) {
        pcNote.className = 'node-note got';
        pcNote.textContent = 'IPアドレス：' + found.ip;
        setMsg('名前解決 成功！ 「<b>' + esc(found.d) + '</b>」は <b>' + esc(found.ip) + '</b> と分かりました。この番号を宛先にして、WEBサーバーへ接続します（ステップ3へ）。', 'ok');
        part(2, 'sim');
      } else {
        pcNote.className = 'node-note fail';
        pcNote.textContent = '名前解決に失敗';
        setMsg('名前解決 失敗。ドメイン名を打ち間違えると、IPアドレスが分からず「サイトにアクセスできません」と表示されます。別のドメイン名でもう一度試そう。', 'ng');
      }
      busy = false;
      $$('.pick', wrap).forEach(b => { b.disabled = false; }); // 別のドメイン名も試せるように
    });

    reset();
  }

  /* =========================================================
     ステップ3：パケット通信
     ========================================================= */
  const NET = {
    nodes: {
      PC: { x: 58, y: 150, end: true, icon: '💻', cap: 'あなたのPC' },
      R1: { x: 190, y: 70 }, R2: { x: 190, y: 230 },
      R3: { x: 330, y: 44 }, R4: { x: 330, y: 150 }, R5: { x: 330, y: 256 },
      R6: { x: 470, y: 90 }, R7: { x: 470, y: 210 },
      SV: { x: 622, y: 150, end: true, icon: '🖥️', cap: 'WEBサーバー' }
    },
    edges: [['PC', 'R1'], ['PC', 'R2'], ['R1', 'R3'], ['R1', 'R4'], ['R2', 'R4'], ['R2', 'R5'],
            ['R3', 'R6'], ['R4', 'R6'], ['R4', 'R7'], ['R5', 'R7'], ['R6', 'SV'], ['R7', 'SV']]
  };

  function initStep3() {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = $('#net');
    const sendBtn = $('#pk-send'), resetBtn = $('#pk-reset'), msg = $('#pk-msg');
    const cardsEl = $('#pk-cards'), recvEl = $('#pk-recv'), logEl = $('#pk-log');
    const N = PACKET_CHUNKS.length;
    const broken = new Set();
    const adj = {};
    let sending = false, finished = false;

    const mk = (tag, attrs, parent) => {
      const e = document.createElementNS(NS, tag);
      Object.keys(attrs || {}).forEach(k => e.setAttribute(k, attrs[k]));
      (parent || svg).appendChild(e);
      return e;
    };
    const dist = (a, b) => Math.hypot(NET.nodes[a].x - NET.nodes[b].x, NET.nodes[a].y - NET.nodes[b].y);

    // ネットワーク図の描画
    const gEdges = mk('g'), gNodes = mk('g'), gPk = mk('g');
    NET.edges.forEach(([a, b]) => {
      (adj[a] = adj[a] || []).push(b);
      (adj[b] = adj[b] || []).push(a);
      mk('line', { x1: NET.nodes[a].x, y1: NET.nodes[a].y, x2: NET.nodes[b].x, y2: NET.nodes[b].y, class: 'net-edge', 'data-a': a, 'data-b': b }, gEdges);
    });
    const routerEls = {};
    Object.keys(NET.nodes).forEach(id => {
      const n = NET.nodes[id];
      if (n.end) {
        const g = mk('g', { class: 'net-node end', transform: 'translate(' + n.x + ',' + n.y + ')' }, gNodes);
        mk('rect', { x: -36, y: -26, width: 72, height: 52, rx: 12, class: 'net-box' }, g);
        mk('text', { y: 8, 'font-size': 26 }, g).textContent = n.icon;
        mk('text', { y: 44, class: 'net-cap', 'font-size': 12 }, g).textContent = n.cap;
      } else {
        const g = mk('g', { class: 'net-node router', transform: 'translate(' + n.x + ',' + n.y + ')', tabindex: 0, role: 'button', 'aria-label': id.replace('R', 'ルーター') + '（タップで故障を切りかえ）' }, gNodes);
        mk('circle', { r: 22, class: 'net-r' }, g);
        const t = mk('text', { y: 5, 'font-size': 14 }, g);
        t.textContent = id;
        routerEls[id] = { g, t };
        const toggle = () => {
          if (sending) return;
          if (broken.has(id)) broken.delete(id); else broken.add(id);
          g.classList.toggle('broken', broken.has(id));
          t.textContent = broken.has(id) ? '✕' : id;
        };
        g.addEventListener('click', toggle);
        g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      }
    });

    // パケットカード・受信スロット
    const cardEls = [], recvSlots = [];
    PACKET_CHUNKS.forEach((c, i) => {
      const card = el('div', 'pcard pk' + (i + 1),
        '<span class="pc-no">' + (i + 1) + '</span><span class="pc-head">宛先 ' + PACKET_DEST + ' ｜ ' + (i + 1) + '/' + N + '</span><span class="pc-data">' + esc(c) + '</span>');
      cardsEl.appendChild(card); cardEls.push(card);
      const rs = el('div', 'rslot pk' + (i + 1), '<span class="rno">' + (i + 1) + '番</span><span class="rdata"></span>');
      recvEl.appendChild(rs); recvSlots.push(rs);
    });

    function setMsg(html, cls) { msg.className = 'stage-msg' + (cls ? ' ' + cls : ''); msg.innerHTML = html; }

    // 壊れていないルーターだけを通る経路を探す（距離にゆらぎを入れて、パケットごとに道が変わる）
    function findPath() {
      const ids = Object.keys(NET.nodes).filter(id => !broken.has(id));
      const d = {}, prev = {};
      ids.forEach(id => { d[id] = Infinity; });
      d.PC = 0;
      const todo = new Set(ids);
      while (todo.size) {
        let u = null;
        todo.forEach(id => { if (u === null || d[id] < d[u]) u = id; });
        if (d[u] === Infinity) break;
        todo.delete(u);
        if (u === 'SV') break;
        (adj[u] || []).forEach(v => {
          if (!todo.has(v)) return;
          const w = dist(u, v) * (0.55 + Math.random() * 1.5);
          if (d[u] + w < d[v]) { d[v] = d[u] + w; prev[v] = u; }
        });
      }
      if (d.SV === Infinity) return null;
      const path = [];
      for (let c = 'SV'; c; c = prev[c]) path.unshift(c);
      return path;
    }

    function resetAll() {
      if (sending) return;
      finished = false;
      $$('.net-edge', svg).forEach(l => l.classList.remove('used'));
      gPk.innerHTML = '';
      cardEls.forEach(c => c.classList.remove('sent'));
      recvSlots.forEach(r => { r.classList.remove('got'); $('.rdata', r).textContent = ''; });
      logEl.innerHTML = '';
      sendBtn.textContent = '送信する';
      sendBtn.disabled = false;
      setMsg('「送信する」を押してください。ルーターをタップして故障させてから送ってもOK。');
    }

    async function send() {
      if (sending) return;
      if (finished) resetAll();
      const paths = PACKET_CHUNKS.map(() => findPath());
      if (paths.some(p => !p)) {
        setMsg('PCからWEBサーバーまでの経路がありません。故障したルーターを、もう一度タップして復旧させてください。', 'ng');
        return;
      }
      sending = true;
      sendBtn.disabled = true; resetBtn.disabled = true;
      $$('.net-edge', svg).forEach(l => l.classList.remove('used'));
      gPk.innerHTML = '';
      recvSlots.forEach(r => { r.classList.remove('got'); $('.rdata', r).textContent = ''; });
      logEl.innerHTML = '';
      setMsg('パケットを送信中…。ルーターが、それぞれのパケットの次の送り先を選んでいます。');

      const arrivals = [];
      const pkts = paths.map((path, i) => {
        const pts = path.map(id => NET.nodes[id]);
        const segs = [];
        let total = 0;
        for (let k = 0; k < pts.length - 1; k++) {
          const len = Math.hypot(pts[k + 1].x - pts[k].x, pts[k + 1].y - pts[k].y);
          segs.push(len); total += len;
          const a = path[k], b = path[k + 1];
          const edge = $$('.net-edge', svg).find(l => (l.dataset.a === a && l.dataset.b === b) || (l.dataset.a === b && l.dataset.b === a));
          if (edge) edge.classList.add('used');
        }
        const g = mk('g', { class: 'net-pkt pk' + (i + 1), opacity: 0 }, gPk);
        mk('rect', { x: -14, y: -14, width: 28, height: 28, rx: 7 }, g);
        mk('text', {}, g).textContent = String(i + 1);
        return { n: i + 1, pts, segs, total, g, done: false, started: false, speed: 0.17 * (0.65 + Math.random() * 0.9), delay: i * 260 };
      });

      const t0 = performance.now();
      await new Promise(resolve => {
        function frame(now) {
          let active = 0;
          pkts.forEach(p => {
            if (p.done) return;
            const t = now - t0 - p.delay;
            if (t < 0) { active++; return; }
            if (!p.started) { p.started = true; cardEls[p.n - 1].classList.add('sent'); p.g.setAttribute('opacity', 1); }
            let d = t * p.speed;
            if (d >= p.total) {
              p.done = true;
              p.g.remove();
              arrivals.push(p.n);
              const rs = recvSlots[p.n - 1];
              $('.rdata', rs).textContent = PACKET_CHUNKS[p.n - 1];
              rs.classList.add('got');
              logEl.textContent = '到着した順番：' + arrivals.join(' → ');
              return;
            }
            active++;
            let k = 0;
            while (k < p.segs.length - 1 && d > p.segs[k]) { d -= p.segs[k]; k++; }
            const r = d / p.segs[k];
            const x = p.pts[k].x + (p.pts[k + 1].x - p.pts[k].x) * r;
            const y = p.pts[k].y + (p.pts[k + 1].y - p.pts[k].y) * r;
            p.g.setAttribute('transform', 'translate(' + x + ',' + y + ')');
          });
          if (active > 0) requestAnimationFrame(frame); else resolve();
        }
        requestAnimationFrame(frame);
      });

      const inOrder = arrivals.every((n, i) => n === i + 1);
      logEl.innerHTML = '到着した順番：' + arrivals.join(' → ') + (inOrder ? '（たまたま順番どおり）' : '（順番がバラバラ！）') +
        '<span class="assembled">TCPが番号順に並べ直して、元のメッセージを復元：「' + esc(PACKET_CHUNKS.join('')) + '」</span>';
      setMsg('全部のパケットが届きました。パケットごとに通った道（青い線）がちがっても、番号があるから元に戻せます。ルーターを故障させて、もう一度送ってみよう。', 'ok');
      sending = false; finished = true;
      sendBtn.textContent = 'もう一度送信する';
      sendBtn.disabled = false; resetBtn.disabled = false;
      part(3, 'sim');
    }

    sendBtn.addEventListener('click', send);
    resetBtn.addEventListener('click', () => {
      broken.clear();
      Object.keys(routerEls).forEach(id => { routerEls[id].g.classList.remove('broken'); routerEls[id].t.textContent = id; });
      resetAll();
    });
    resetAll();
  }

  /* =========================================================
     ステップ4：HTTPリクエスト／レスポンス
     ========================================================= */
  function initStep4() {
    const wrap = $('#http-paths'), env = $('#http-env'), sendBtn = $('#http-send');
    const reqEl = $('#http-req'), resEl = $('#http-res'), msg = $('#http-msg');
    let path = null, busy = false;

    Object.keys(HTTP_PAGES).forEach(p => {
      const b = el('button', 'pick', esc(p));
      b.type = 'button'; b.dataset.p = p;
      wrap.appendChild(b);
    });
    function setMsg(html, cls) { msg.className = 'stage-msg' + (cls ? ' ' + cls : ''); msg.innerHTML = html; }

    function showRequest() {
      reqEl.innerHTML =
        '<span class="c-key">GET</span> <span class="c-path">' + esc(path) + '</span> HTTP/1.1\n' +
        '<span class="c-key">Host:</span> <span class="c-host">example.com</span>\n' +
        '<span class="c-key">Accept:</span> text/html';
    }

    wrap.addEventListener('click', e => {
      const b = e.target.closest('.pick');
      if (!b || busy) return;
      path = b.dataset.p;
      $$('.pick', wrap).forEach(x => x.classList.toggle('on', x === b));
      showRequest();
      resEl.className = 'code'; resEl.textContent = '（まだ届いていません）';
      env.className = 'env'; env.textContent = '✉️';
      sendBtn.disabled = false;
      setMsg('リクエストができました。1行目に「メソッド（GET）」「パス名」、Host に「どのサイトか」が書かれています。');
    });

    sendBtn.addEventListener('click', async () => {
      if (!path || busy) return;
      busy = true;
      sendBtn.disabled = true;
      $$('.pick', wrap).forEach(x => { x.disabled = true; });
      resEl.className = 'code waiting'; resEl.textContent = '（レスポンス待ち…）';
      env.className = 'env'; env.textContent = '✉️';
      setMsg('クライアント → サーバー：HTTPリクエスト（要求）を送信中…');
      await sleep(30);
      env.classList.add('show');
      await sleep(40);
      env.classList.add('right');
      await sleep(1300);

      const page = HTTP_PAGES[path];
      setMsg('サーバーが <b>' + esc(path) + '</b> を探しています…');
      await sleep(900);

      env.textContent = page.code === 200 ? '📦' : '⚠️';
      env.classList.remove('right');
      setMsg('サーバー → クライアント：HTTPレスポンス（応答）を返信中…');
      const size = (window.Blob ? new Blob([page.body]).size : page.body.length);
      const cls = page.code === 200 ? 'c-ok' : 'c-ng';
      await sleep(1300);
      resEl.className = 'code';
      resEl.innerHTML =
        'HTTP/1.1 <span class="' + cls + '">' + page.code + ' ' + esc(page.text) + '</span>\n' +
        '<span class="c-key">Content-Type:</span> text/html\n' +
        '<span class="c-key">Content-Length:</span> ' + size + '\n\n' +
        '<span class="c-body">' + esc(page.body) + '</span>';
      if (page.code === 200) {
        setMsg('レスポンスの1行目が「<b>200 OK</b>」＝成功。あとに続くHTMLが、ブラウザに渡されます（ステップ5で画面になります）。', 'ok');
      } else {
        setMsg('レスポンスの1行目が「<b>404 Not Found</b>」＝そのファイルはサーバーにありません。「ない」ことも、応答として知らせてくれます。', 'ng');
      }
      busy = false;
      $$('.pick', wrap).forEach(x => { x.disabled = false; });
      sendBtn.disabled = false;
      part(4, 'sim');
    });
  }

  /* =========================================================
     ステップ5：レンダリングの順番パズル
     ========================================================= */
  function initStep5() {
    const pool = $('#rd-pool'), slotsWrap = $('#rd-slots');
    const slots = $$('.slot', slotsWrap);
    const runBtn = $('#rd-run'), resetBtn = $('#rd-reset'), replayBtn = $('#rd-replay'), fb = $('#rd-feedback');
    const stageEls = $$('#rd-stages .rstage');
    const screen = $('#rd-screen'), pix = $('#rd-pixels'), blank = $('#rd-blank');
    const pgBtn = $('#pg-btn'), pgCount = $('#pg-count'), pgTime = $('#pg-time');
    let attempts = 0, busy = false, solved = false, count = 0;

    for (let i = 0; i < 96; i++) pix.appendChild(document.createElement('div'));
    $$('div', pix).forEach(d => { d.style.animationDelay = Math.floor(Math.random() * 900) + 'ms'; });

    const placer = createPlacer(pool, slots, () => {
      if (busy || solved) return;
      runBtn.disabled = !slots.every(s => $('.chip', s));
      fb.className = 'feedback'; fb.textContent = '';
    });

    function resetScreen() {
      screen.classList.add('blank');
      pix.classList.remove('run');
      blank.textContent = 'まだ何も表示されません';
      pgBtn.disabled = true;
      pgTime.textContent = '--:--:--';
      count = 0; pgCount.textContent = '0';
      stageEls.forEach(s => {
        s.classList.remove('active', 'done');
        $('b', s).textContent = '？';
        $('.rs-out', s).textContent = '（待機中）';
      });
    }

    function load() {
      busy = false; solved = false; attempts = 0;
      placer.clearSelection();
      slots.forEach(s => { $('.slot-body', s).innerHTML = ''; s.classList.remove('ok', 'ng'); });
      pool.innerHTML = '';
      let order;
      do { order = shuffle(RENDER_FLOW); } while (order.every((x, k) => x === RENDER_FLOW[k]));
      order.forEach(step => {
        const chip = makeChip('<b>' + step.title + '</b><small>' + step.desc + '</small>', { id: step.id }, true);
        chip.classList.add('card-chip');
        placer.add(chip);
      });
      fb.className = 'feedback'; fb.textContent = '';
      runBtn.hidden = false; runBtn.disabled = true; resetBtn.hidden = false; replayBtn.hidden = true;
      resetScreen();
    }

    async function play() {
      busy = true;
      runBtn.disabled = true; resetBtn.disabled = true; replayBtn.disabled = true;
      resetScreen();
      await sleep(250);
      for (let i = 0; i < RENDER_FLOW.length; i++) {
        const step = RENDER_FLOW[i], card = stageEls[i], out = $('.rs-out', card);
        card.classList.add('active');
        $('b', card).textContent = step.title;
        out.textContent = '';
        if (step.id === 'paint') {
          screen.classList.remove('blank');
          pix.classList.add('run');
        }
        for (const line of step.lines) {
          out.textContent += (out.textContent ? '\n' : '') + line;
          if (step.id === 'js' && line.indexOf('読み込み時刻') === 0) {
            pgTime.textContent = new Date().toLocaleTimeString('ja-JP');
            pgBtn.disabled = false; // JSの実行後にボタンが動くようになる
          }
          await sleep(step.id === 'paint' ? 380 : 330);
        }
        card.classList.remove('active');
        card.classList.add('done');
        await sleep(200);
      }
      await sleep(600);
      busy = false; resetBtn.disabled = false; replayBtn.disabled = false;
    }

    runBtn.addEventListener('click', async () => {
      if (busy || solved) return;
      const chosen = slots.map(s => { const c = $('.chip', s); return c ? c.dataset.id : null; });
      const wrongAt = chosen.findIndex((id, i) => id !== RENDER_FLOW[i].id);
      resetScreen();
      if (wrongAt >= 0) {
        attempts++;
        slots.forEach((s, i) => s.classList.toggle('ng', i === wrongAt));
        blank.textContent = '画面に出力できません';
        screen.classList.remove('shake'); void screen.offsetWidth; screen.classList.add('shake');
        fb.className = 'feedback ng';
        fb.textContent = wrongAt + 1 + '番目の処理が正しくないため、画面には何も出力されません（白紙のまま）。' +
          (attempts >= 2 ? 'ヒント：' + RENDER_FLOW[wrongAt].why : '「前の処理の結果がないと、次の処理ができない」と考えてみよう。');
        return;
      }
      solved = true;
      slots.forEach(s => { s.classList.remove('ng'); s.classList.add('ok'); });
      $$('.chip', slotsWrap).forEach(c => c.classList.add('locked'));
      runBtn.hidden = true; resetBtn.hidden = true;
      fb.className = 'feedback ok';
      fb.textContent = '正しい順番です！ ブラウザの内部で、4つの処理が順番に進みます。';
      await play();
      replayBtn.hidden = false;
      resetBtn.hidden = false;
      fb.textContent = '画面に表示されました。HTMLの解析 → CSSの解析 → JavaScriptの実行 → 画面描画、の順に進みます。右の「いいね！」ボタンも押してみよう。';
      markDone(5);
    });

    resetBtn.addEventListener('click', () => { if (!busy) load(); });
    replayBtn.addEventListener('click', () => { if (!busy) play(); });
    pgBtn.addEventListener('click', () => { count++; pgCount.textContent = String(count); });
    load();
  }

  /* =========================================================
     起動
     ========================================================= */
  function init() {
    // 画面遷移（data-go を持つ要素すべて）
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-go]');
      if (b) go(b.dataset.go);
    });
    $('#reset-progress').addEventListener('click', () => {
      if (window.confirm('学習の進み具合をリセットしますか？')) {
        progress = { 1: false, 2: false, 3: false, 4: false, 5: false };
        saveProgress();
        window.location.reload();
      }
    });

    initStep1();
    initAnalyzer();
    initStep2();
    initStep3();
    initStep4();
    initStep5();
    mountQuiz($('#quiz-dns'), QUIZ.dns, () => part(2, 'quiz'));
    mountQuiz($('#quiz-packet'), QUIZ.packet, () => part(3, 'quiz'));
    mountQuiz($('#quiz-http'), QUIZ.http, () => part(4, 'quiz'));

    updateProgressUI();
    const start = (location.hash || '').replace('#', '');
    go(VIEWS.includes(start) ? start : 'home');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
