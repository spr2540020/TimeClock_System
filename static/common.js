/* 打刻システム 共通スクリプト
   各ページの <body data-role="emp|adm" data-active="メニューID"> を元に
   ヘッダー・左メニューを組み立てる（共通フォーマット）。 */

const EMP_MENU = [
  ['top', 'トップ', 'emp_top.html', false, 'home'],
  ['history', '出退勤履歴', 'emp_history.html', false, 'history'],
  ['account', 'アカウント', 'emp_account.html', true, 'user'],   // 4つ目=true：PCでは左メニューに出さない（ヘッダーの氏名から開く）。スマホのフッターには表示
];
const ADM_MENU = [
  ['top', 'トップ', 'adm_top.html'],
  ['register', '従業員情報登録', 'adm_emp_register.html'],
  ['view', '従業員情報閲覧', 'adm_emp_view.html'],
];

/** スマホ用フッターのアイコン（線画SVG） */
const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5.5h4V20"/>',
  history: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>',
};
const icon = k => `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ''}</svg>`;

/* ---------- ダミーデータ ---------- */
const EMPLOYEES = [
  { id: 'E001', name: '大原太郎', sex: '男性', mail: 'ohara@example.com', tel: '090-1111-2222', addr: '東京都千代田区1-1-1', birth: '2000-04-12', bank: 'みらい銀行 本店 普通 1234567', type: '正社員', last: '2026-10-19', work: '152時間', days: '19日', wage: '1,500円', trans: '12,000円', ot: '8時間' },
  { id: 'E002', name: '鈴木 花子', sex: '女性', mail: 'suzuki@example.com', tel: '080-2222-3333', addr: '東京都新宿区2-2-2', birth: '1998-08-30', bank: 'さくら銀行 新宿 普通 2345678', type: 'アルバイト', last: '2026-10-19', work: '96時間', days: '14日', wage: '1,200円', trans: '8,400円', ot: '0時間' },
  { id: 'E003', name: '高橋 健', sex: '男性', mail: 'takahashi@example.com', tel: '070-3333-4444', addr: '神奈川県横浜市3-3-3', birth: '1995-01-05', bank: 'みらい銀行 横浜 普通 3456789', type: '正社員', last: '2026-10-16', work: '148時間', days: '18日', wage: '1,600円', trans: '15,000円', ot: '5時間' },
  { id: 'E004', name: '田中 美咲', sex: '女性', mail: 'tanaka@example.com', tel: '090-4444-5555', addr: '埼玉県さいたま市4-4-4', birth: '2001-11-23', bank: 'あおぞら銀行 大宮 普通 4567890', type: 'アルバイト', last: '2026-10-15', work: '80時間', days: '12日', wage: '1,200円', trans: '6,000円', ot: '0時間' },
  { id: 'E005', name: '伊藤 翼', sex: '男性', mail: 'ito@example.com', tel: '080-5555-6666', addr: '千葉県千葉市5-5-5', birth: '1997-06-18', bank: 'さくら銀行 千葉 普通 5678901', type: '正社員', last: '2026-08-31', work: '0時間', days: '0日', wage: '1,500円', trans: '0円', ot: '0時間' },
];
// 登録画面で追加した従業員（このブラウザに保存）を読み込む
try { (JSON.parse(localStorage.getItem('kintai_new_emps')) || []).forEach(e => EMPLOYEES.push(e)); } catch (e) { }
/** IDの自動採番：E + 3桁連番（既存の最大値+1） */
const nextEmpId = () => 'E' + pad3(Math.max(0, ...EMPLOYEES.map(e => +e.id.slice(1) || 0)) + 1);
function pad3(n) { return String(n).padStart(3, '0'); }
/** 初期パスワード＝生年月日（YYYYMMDD） */
const initialPassword = birth => birth.replace(/-/g, '');
/** 現在のパスワード：従業員が変更していればそれ、なければ初期パスワード（生年月日） */
function empPassword(e) { try { return (JSON.parse(localStorage.getItem('kintai_pw')) || {})[e.id] || initialPassword(e.birth); } catch (x) { return initialPassword(e.birth); } }
function setEmpPassword(e, pw) { try { const m = JSON.parse(localStorage.getItem('kintai_pw')) || {}; m[e.id] = pw; localStorage.setItem('kintai_pw', JSON.stringify(m)); } catch (x) { } }
/** 管理者アカウント（デモ） */
const ADMINS = [{ id: 'A001', name: '山館', pw: 'admin' }];
function adminPassword(a) { try { return (JSON.parse(localStorage.getItem('kintai_admin_pw')) || {})[a.id] || a.pw; } catch (x) { return a.pw; } }
function setAdminPassword(a, pw) { try { const m = JSON.parse(localStorage.getItem('kintai_admin_pw')) || {}; m[a.id] = pw; localStorage.setItem('kintai_admin_pw', JSON.stringify(m)); } catch (x) { } }
/* ---------- ユーティリティ ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');

/** 確認ダイアログ（確認アラート） */
function confirmDialog({ title = '確認', body = '', okLabel = 'OK', cancelLabel = '戻る', danger = false, onOk, onCancel, extra = '' }) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal" role="dialog"><h3>${title}</h3><div>${body}</div>${extra}
    <div class="actions"><button class="btn" data-c>${cancelLabel}</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${okLabel}</button></div></div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
  $('[data-c]', bg).onclick = () => { close(); onCancel && onCancel(); };
  $('[data-ok]', bg).onclick = () => { if (onOk && onOk(bg) === false) return; close(); };
  return bg;
}

/** 完了画面 */
function showDone(container, title, msg, links = []) {
  container.innerHTML = `<div class="card done"><h2>${title}</h2><p>${msg}</p>
    <div class="row" style="justify-content:center">${links.map(l => `<a class="btn ${l.primary ? 'primary' : ''}" href="${l.href}">${l.label}</a>`).join('')}</div></div>`;
}

/** 時刻の差分（分）→ "h:mm" */
const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const fmtMin = m => `${Math.floor(m / 60)}:${pad(m % 60)}`;

/** 従業員選択プルダウンの option */
const empOptions = (list = EMPLOYEES) => list.map(e => `<option value="${e.id}">${e.id} ${e.name}</option>`).join('');

/* ---------- 共通レイアウト組み立て ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const role = document.body.dataset.role;
  if (!role) return;                       // ログイン画面などは対象外
  document.body.classList.add('role-' + role);
  const active = document.body.dataset.active;
  const menu = role === 'adm' ? ADM_MENU : EMP_MENU;
  const topHref = menu[0][2];
  const who = role === 'adm' ? '管理者：<a href="adm_account.html" class="who" title="アカウント情報">山館</a>' : '従業員：<a href="emp_account.html" class="who" title="アカウント情報">大原太郎</a>';
  const link = ([id, label, href]) => `<a href="${href}" class="${id === active ? 'active' : ''}">${label}</a>`;

  const nodes = [...document.body.children].filter(n => n.tagName !== 'SCRIPT');
  const header = document.createElement('div');
  header.className = 'header';
  header.innerHTML = `<a class="title" href="${topHref}">打刻システム</a><div class="right"><span>${who}</span><a href="logout.html">ログアウト</a></div>`;
  const layout = document.createElement('div');
  layout.className = 'layout';
  layout.innerHTML = `<nav class="side">${menu.filter(m => !m[3]).map(link).join('')}</nav><main class="content"></main>`;
  const main = $('main', layout);
  nodes.forEach(n => main.appendChild(n));
  document.body.prepend(header, layout);
  // 従業員のスマホ画面：下部に固定フッターメニュー
  if (role === 'emp') {
    const f = document.createElement('nav');
    f.className = 'footer-nav';
    f.innerHTML = menu.map(([id, label, href, , ic]) => `<a href="${href}" class="${id === active ? 'active' : ''}">${icon(ic)}<span>${label}</span></a>`).join('');
    document.body.appendChild(f);
  }
});
