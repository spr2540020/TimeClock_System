/* 管理者画面 共通部品（従業員一覧・詳細） */

/** 従業員一覧テーブル。0件の場合は「従業員が存在しません」 */
function empListTable(el, { actionLabel = '詳細', list = EMPLOYEES, onPick }) {
  if (!list.length) { el.innerHTML = '<div class="empty">従業員が存在しません</div>'; return; }
  el.innerHTML = `<table class="tbl"><tr><th>ID</th><th>名前</th><th class="c">操作</th></tr>
    ${list.map(e => `<tr><td>${e.id}</td><td>${e.name}</td>
    <td class="c"><button class="btn sm" data-id="${e.id}">${actionLabel}</button></td></tr>`).join('')}</table>`;
  $$('button[data-id]', el).forEach(b => b.onclick = () => onPick(EMPLOYEES.find(e => e.id === b.dataset.id)));
}

/** 従業員詳細（ID、名前、性別、メールアドレス、電話番号、住所、生年月日、口座情報） */
function empDetailTable(e) {
  return `<table class="tbl kv">
    <tr><th>ID</th><td>${e.id}</td></tr><tr><th>名前</th><td>${e.name}</td></tr><tr><th>雇用形態</th><td>${e.type}</td></tr><tr><th>性別</th><td>${e.sex}</td></tr>
    <tr><th>メールアドレス</th><td>${e.mail}</td></tr><tr><th>電話番号</th><td>${e.tel}</td></tr><tr><th>住所</th><td>${e.addr}</td></tr>
    <tr><th>生年月日</th><td>${e.birth}</td></tr><tr><th>口座情報</th><td>${e.bank}</td></tr></table>`;
}

/** 従業員入力フォーム（登録・変更共通）。idLocked=true でID・生年月日を変更不可 */
function empForm(e = {}, idLocked = false) {
  const v = k => e[k] || '';
  const dis = idLocked ? 'disabled' : '';
  return `
  ${idLocked ? `<div class="form-row"><label>ID</label><div style="padding-top:7px">${v('id')}</div></div>` : ''}
  <div class="form-row"><label class="req">名前</label><div><input type="text" id="f-name" value="${v('name')}" placeholder="例：山田 太郎"><div class="err-text" id="e-name"></div></div></div>
  <div class="form-row"><label${idLocked ? '' : ' class="req"'}>雇用形態</label>${idLocked ? `<div style="padding-top:7px">${v('type')}</div>` : `<div><select id="f-type">${['正社員', 'アルバイト', 'パート', '契約社員'].map(t => `<option ${v('type') === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`}</div>
  <div class="form-row"><label>性別</label><div><select id="f-sex"><option>男性</option><option ${v('sex') === '女性' ? 'selected' : ''}>女性</option><option ${v('sex') === 'その他' ? 'selected' : ''}>その他</option></select></div></div>
  <div class="form-row"><label class="req">メールアドレス</label><div><input type="email" id="f-mail" value="${v('mail')}"><div class="err-text" id="e-mail"></div></div></div>
  <div class="form-row"><label class="req">電話番号</label><div><input type="tel" id="f-tel" value="${v('tel')}"><div class="err-text" id="e-tel"></div></div></div>
  <div class="form-row"><label class="req">住所</label><div style="flex:1"><input type="text" id="f-addr" style="width:100%;max-width:520px" value="${v('addr')}"><div class="err-text" id="e-addr"></div></div></div>
  <div class="form-row"><label${idLocked ? '' : ' class="req"'}>生年月日</label>${idLocked ? `<div style="padding-top:7px">${v('birth')}</div>` : `<div><div id="birth-drum"></div><input type="hidden" id="f-birth"><div class="muted">上下にスクロールして選択</div><div class="err-text" id="e-birth"></div></div>`}</div>
  <div class="form-row"><label class="req">口座情報</label><div style="flex:1"><input type="text" id="f-bank" style="width:100%;max-width:520px" value="${v('bank')}" placeholder="例：みらい銀行 本店 普通 1234567"><div class="err-text" id="e-bank"></div></div></div>
  <div class="form-row"><label class="req">顔認証登録</label><div style="flex:1">
    <input type="hidden" id="f-face" value="${idLocked ? '1' : ''}">
    <div class="face-reg">
      <div class="face-box hidden" id="face-box"><video id="face-video" autoplay playsinline muted></video><div class="face-guide"></div></div>
      <img id="face-img" class="face-img hidden" alt="登録した顔写真">
      <div id="face-state" class="muted">${idLocked ? '登録済み（打刻用の顔データ）' : '未登録（打刻時の顔認証に使用します）'}</div>
      <div class="actions" style="margin-top:8px">
        <button type="button" class="btn" id="face-start">${idLocked ? '顔を再登録' : 'カメラを起動'}</button>
        <button type="button" class="btn primary hidden" id="face-shot">撮影して登録</button>
      </div>
    </div><div class="err-text" id="e-face"></div></div></div>`;
}

/** 顔認証登録（カメラ起動→撮影）。empForm の描画後に呼ぶ。撮影すると #f-face に値が入る */
function initFaceReg() {
  const st = $('#face-state'), box = $('#face-box'), vid = $('#face-video'), img = $('#face-img'), hid = $('#f-face');
  let stream = null;
  const stop = () => { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } box.classList.add('hidden'); $('#face-shot').classList.add('hidden'); };
  const done = (src, msg) => { hid.value = src || '1'; $('#e-face').textContent = ''; if (src) { img.src = src; img.classList.remove('hidden'); } st.textContent = msg; $('#face-start').textContent = '撮り直す'; stop(); };
  $('#face-start').onclick = async () => {
    stop();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      vid.srcObject = stream; box.classList.remove('hidden'); $('#face-shot').classList.remove('hidden');
      st.textContent = '枠に顔を合わせて「撮影して登録」を押してください';
    } catch (e) {
      st.textContent = 'カメラを利用できません。（デモ：カメラなしで登録済みにします）';
      done('', '登録済み（デモ：カメラなし）');
    }
  };
  $('#face-shot').onclick = () => {
    const c = document.createElement('canvas'); c.width = 160; c.height = 120;
    c.getContext('2d').drawImage(vid, 0, 0, 160, 120);
    done(c.toDataURL('image/jpeg', .7), '登録済み（顔データを登録しました）');
  };
}

/** empForm の必須チェック。OKなら入力値を返す、NGなら null */
function empFormValidate(skip = []) {
  const keys = ['name', 'mail', 'tel', 'addr', 'birth', 'bank', 'face'].filter(k => !skip.includes(k));
  let ok = true;
  keys.forEach(k => {
    const inp = $('#f-' + k), er = $('#e-' + k);
    er.textContent = ''; inp.classList.remove('field-err');
    if (!inp.value.trim()) { er.textContent = k === 'face' ? '顔認証の登録をしてください' : '入力してください'; inp.classList.add('field-err'); ok = false; }
  });
  if (!ok) return null;
  const o = {};
  ['id', 'name', 'type', 'sex', 'mail', 'tel', 'addr', 'birth', 'bank'].forEach(k => { const el = $('#f-' + k); o[k] = el ? el.value : ''; });
  return o;
}

/** ドラムロール式の生年月日入力。#birth-drum に描画し、値(YYYY-MM-DD)を hidden の #f-birth に反映 */
function initBirthDrum(def = [2000, 1, 1]) {
  const H = 36, el = $('#birth-drum'), hid = $('#f-birth');
  const thisYear = new Date().getFullYear();
  const years = []; for (let y = thisYear - 15; y >= thisYear - 70; y--) years.push(y);   // 15〜70歳
  el.className = 'drum-wrap';
  el.innerHTML = '<div class="drum-band"></div><div class="drum" data-k="y"></div><div class="drum" data-k="m"></div><div class="drum" data-k="d"></div>';
  const col = { y: $('[data-k=y]', el), m: $('[data-k=m]', el), d: $('[data-k=d]', el) };
  const fill = (c, arr, suffix) => { c.innerHTML = arr.map(v => `<div data-v="${v}">${v}${suffix}</div>`).join(''); };
  fill(col.y, years, '年'); fill(col.m, [...Array(12)].map((_, i) => i + 1), '月');
  const idx = c => Math.max(0, Math.min(c.children.length - 1, Math.round(c.scrollTop / H)));
  const val = c => +c.children[idx(c)].dataset.v;
  const mark = c => [...c.children].forEach((n, i) => n.classList.toggle('on', i === idx(c)));
  const days = (y, m) => new Date(y, m, 0).getDate();
  function sync() {
    const y = val(col.y), m = val(col.m), n = days(y, m);
    if (col.d.children.length !== n) { const keep = col.d.children.length ? val(col.d) : def[2]; fill(col.d, [...Array(n)].map((_, i) => i + 1), '日'); col.d.scrollTop = (Math.min(keep, n) - 1) * H; }
    Object.values(col).forEach(mark);
    hid.value = `${y}-${pad(m)}-${pad(val(col.d))}`;
  }
  Object.entries(col).forEach(([k, c]) => {
    let t; c.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(sync, 60); });
    c.addEventListener('click', ev => { const n = ev.target.closest('[data-v]'); if (n) c.scrollTo({ top: [...c.children].indexOf(n) * H, behavior: 'smooth' }); });
  });
  // 初期位置の設定中はスナップを無効化（再スナップで先頭に戻されるため）
  el.classList.add('init');
  col.y.scrollTop = Math.max(0, years.indexOf(def[0])) * H; col.m.scrollTop = (def[1] - 1) * H;
  sync(); col.d.scrollTop = (def[2] - 1) * H; sync();
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('init')));
}
