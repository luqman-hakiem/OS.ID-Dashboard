/* OrangeSky Admin Panel — aplikasi web mandiri (vanilla JS) */
(function () {
  'use strict';

  const KEY = 'orangesky-admin-web-v1';
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* abaikan */ }
    const s = window.ORANGE_SEED();
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* abaikan */ }
    return s;
  }

  let state = loadState();
  let ui = {
    tablePage: {},
    filters: {},
    reportFilters: {},
    reportRows: {},
    tempPhoto: '',
    cal: (() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; })(),
    rate: { pID: '', tkID: '', rID: '' },
    otp: null,
    confirmCb: null,
    ctx: {}
  };

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { notify('Gagal menyimpan ke localStorage', 'err'); }
  }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fmt(n) { return Number(n || 0).toLocaleString('id-ID'); }
  function rp(n) { return 'Rp' + fmt(n); }
  function uid(p) { return p + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 6); }
  function byId(arr, id) { return (arr || []).find(x => String(x.id) === String(id)); }
  function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function initials(name) { return String(name || '?').split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase(); }

  function badge(s) {
    const map = {
      'Active': 'badge-ok', 'Publish': 'badge-ok', 'Verified': 'badge-ok', 'Completed': 'badge-ok', 'Processed': 'badge-ok',
      'Waiting': 'badge-warn', 'Pending': 'badge-warn', 'Draft': 'badge-warn',
      'Expired': 'badge-danger', 'Not Active': 'badge-danger', 'Cancelled': 'badge-danger',
      'Admin': 'badge-info', 'User': 'badge-muted', 'Gold': 'badge-warn', 'Platinum': 'badge-info', 'Silver': 'badge-muted'
    };
    return `<span class="badge ${map[s] || 'badge-muted'}">${esc(s)}</span>`;
  }

  function notify(msg, type) {
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    toastRoot.appendChild(el);
    setTimeout(() => el.remove(), 3400);
  }

  function showModal(title, body, footer, wide) {
    modalRoot.innerHTML = `
      <div class="modal-backdrop" data-action="backdrop">
        <div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
          <div class="modal-head"><h3>${esc(title)}</h3><button class="modal-close" data-action="closeModal" aria-label="Tutup">×</button></div>
          <div class="modal-body">${body}</div>
          ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
        </div>
      </div>`;
  }
  function closeModal() { modalRoot.innerHTML = ''; }
  function confirmDialog(msg, cb) {
    ui.confirmCb = cb;
    showModal('Konfirmasi', `<p>${esc(msg)}</p>`, `<button class="btn btn-light" data-action="closeModal">Batal</button><button class="btn btn-danger" data-action="confirmYes">Ya, lanjutkan</button>`);
  }

  /* ---------------- Routing ---------------- */
  function getRoute() {
    const h = location.hash.replace(/^#\/?/, '');
    const parts = h.split('/').filter(Boolean);
    if (parts[0] === 'login') return { menu: 'login', id: parts[1] ? decodeURIComponent(parts[1]) : '' };
    if (parts[0] === 'm') return { menu: parts[1] || 'dashboard', id: parts.slice(2).join('/') ? decodeURIComponent(parts.slice(2).join('/')) : '' };
    return { menu: 'dashboard', id: '' };
  }
  function go(menu, id) {
    location.hash = '#/m/' + menu + (id ? '/' + encodeURIComponent(id) : '');
  }
  function splitId(id) { return String(id || '').split('|'); }

  const TITLES = {
    dashboard: 'Dashboard', bookingKeyword: 'Booking by Keyword', bookingDate: 'Booking by Date',
    propertyNew: 'New Property', property: 'Data Property', propertyEdit: 'Update Property',
    roomType: 'Room Type', room: 'Data Room', roomFacility: 'Room Facility', gallery: 'Gallery',
    facility: 'Data Facility', ratePlans: 'Room Rate & Availability',
    member: 'Data Member', memberDetail: 'Detail Member', memberUpgrade: 'Upgrade Member', memberLog: 'Member Log',
    merchantNew: 'New Merchant', merchant: 'Data Merchant', merchantEdit: 'Update Merchant',
    voucherNew: 'New Promotion', voucher: 'Data Voucher', voucherEdit: 'Update Promotion',
    userNew: 'New User', user: 'Data User', userEdit: 'Update User', userProperty: 'User Property',
    checkBookingPayment: 'Check Booking Payment', updateMemberPoint: 'Update Member Point',
    lapBooking: 'Booking Report', lapRoom: 'Room Report', lapMember: 'Member Report',
    lapMerchant: 'Merchant Report', lapVoucher: 'Voucher Report', lapVoucherRevenue: 'Voucher Revenue',
    gantiPass: 'Ganti Password'
  };

  const MENU = [
    { id: 'home', label: 'Home', href: '#/m/dashboard', icon: '⌂' },
    { id: 'booking', label: 'Booking', icon: '▤', children: [['bookingKeyword', 'By Keyword'], ['bookingDate', 'By Date']] },
    { id: 'property', label: 'Property', icon: '▣', children: [['propertyNew', 'New Property'], ['property', 'Data Property'], ['facility', 'Data Facility'], ['ratePlans', 'Rate Plan & Avability']] },
    { id: 'member', label: 'Data Member', href: '#/m/member', icon: '♙' },
    { id: 'merchant', label: 'Merchant', icon: '◈', children: [['merchantNew', 'New Merchant'], ['merchant', 'Data Merchant']] },
    { id: 'voucher', label: 'Voucher', icon: '◉', children: [['voucherNew', 'New Voucher'], ['voucher', 'Data Voucher']] },
    { id: 'user', label: 'Users', icon: '♟', children: [['userNew', 'New User'], ['user', 'Data User']] },
    { id: 'tools', label: 'Tools', icon: '⚙', children: [['checkBookingPayment', 'Check Booking Payment'], ['updateMemberPoint', 'Update Member Point']] },
    { id: 'report', label: 'Report', icon: '▥', children: [['lapBooking', 'Booking'], ['lapRoom', 'Room'], ['lapMember', 'Member'], ['lapMerchant', 'Merchant'], ['lapVoucher', 'Voucher'], ['lapVoucherRevenue', 'Voucher Revenue']] }
  ];
  const GROUP_OF = {
    bookingKeyword: 'booking', bookingDate: 'booking',
    propertyNew: 'property', property: 'property', propertyEdit: 'property', roomType: 'property', room: 'property', roomFacility: 'property', gallery: 'property', facility: 'property', ratePlans: 'property',
    merchantNew: 'merchant', merchant: 'merchant', merchantEdit: 'merchant',
    voucherNew: 'voucher', voucher: 'voucher', voucherEdit: 'voucher',
    userNew: 'user', user: 'user', userEdit: 'user', userProperty: 'user',
    checkBookingPayment: 'tools', updateMemberPoint: 'tools',
    lapBooking: 'report', lapRoom: 'report', lapMember: 'report', lapMerchant: 'report', lapVoucher: 'report', lapVoucherRevenue: 'report'
  };

  function render() {
    const { menu, id } = getRoute();
    if (!state.session) {
      if (menu !== 'login') { location.replace('#/login'); return; }
      renderLogin(); return;
    }
    if (menu === 'login') { location.replace('#/m/dashboard'); return; }

    const content = renderContent(menu, id);
    const title = TITLES[menu] || 'Dashboard';
    app.innerHTML = shell(title, content, menu);
    document.querySelectorAll('[data-table]').forEach(() => {});
    initTables();
    if (menu === 'dashboard') drawBookingChart();
  }

  function shell(title, content, active) {
    const u = state.session;
    const group = GROUP_OF[active];
    const nav = MENU.map(item => {
      const isGroupOpen = item.id === group;
      const isSingleActive = item.href && item.href.endsWith('/' + active);
      let cls = 'nav-group' + (isGroupOpen || isSingleActive ? ' open' : '');
      let link = item.href
        ? `<a class="nav-link ${isSingleActive ? 'active' : ''}" href="${item.href}"><span class="ic">${item.icon}</span><span>${item.label}</span></a>`
        : `<div class="nav-link ${isGroupOpen ? 'active' : ''}" data-action="toggleGroup" data-group="${item.id}"><span class="ic">${item.icon}</span><span>${item.label}</span><span class="caret">▶</span></div>`;
      const sub = item.children ? `<div class="subnav">${item.children.map(([m, label]) => `<a href="#/m/${m}" class="${m === active ? 'active' : ''}">${label}</a>`).join('')}</div>` : '';
      return `<div class="${cls}">${link}${sub}</div>`;
    }).join('');

    return `
      <div class="shell">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-brand"><img src="assets/logo.png" alt="logo"><div><strong>OrangeSky</strong><small>Admin Panel</small></div></div>
          <div class="sidebar-profile"><div class="avatar">${esc(initials(u.name))}</div><h4>${esc(u.name)}</h4><p>${esc(u.role)}</p></div>
          <div class="sidebar-title">Menu</div>
          <nav class="nav">${nav}</nav>
          <div class="sidebar-foot">Copyright © 2026 OrangeSkyGroup.</div>
        </aside>
        <div class="main">
          <header class="topbar">
            <div style="display:flex;align-items:center;gap:12px">
              <button class="menu-toggle" data-action="toggleSidebar">☰</button>
              <h1>${esc(title)}</h1>
            </div>
            <div class="top-user">
              <button class="top-user-btn" data-action="toggleUserMenu"><span class="avatar-sm">${esc(initials(u.name))}</span><span>${esc(u.email)}</span><span>▾</span></button>
              <div class="dropdown" id="userDropdown">
                <a href="#/m/gantiPass">Change Password</a>
                <button data-action="logout">Log Out</button>
              </div>
            </div>
          </header>
          <main class="content">${content}</main>
        </div>
      </div>`;
  }

  /* ---------------- Login ---------------- */
  function renderLogin() {
    app.innerHTML = `
      <div class="login-page">
        <div class="login-box">
          <div class="login-head"><img src="assets/logo.png" alt="OrangeSky"><p>Admin Panel — Hotel & Hospitality</p></div>
          <div class="login-body">
            <form data-form="login">
              <div class="field"><label>Username</label><input class="input" name="uname" autocomplete="username" placeholder="Username" required></div>
              <div class="field"><label>Password</label>
                <div class="password-wrap"><input class="input" name="upass" type="password" autocomplete="current-password" placeholder="Password" required><button type="button" class="toggle-pass" data-action="togglePassword">👁</button></div>
              </div>
              <button class="btn btn-block" type="submit">Login</button>
            </form>
            <div class="login-hint">Demo: <code>REDACTED</code> / <code>REDACTED</code><br>Kode OTP ditampilkan di layar setelah login.</div>
          </div>
        </div>
      </div>`;
  }

  function showOtpModal(uname) {
    const code = state.otpHint || '482913';
    ui.otp = { code, uname };
    showModal('Verifikasi OTP', `
      <p class="note">Kode 6 digit telah dikirim ke email <b>hm******@gm***.com</b>.</p>
      <form data-form="otp" id="frmOtp">
        <div style="display:flex;gap:8px;justify-content:center;margin:18px 0">
          ${Array.from({ length: 6 }, (_, i) => `<input class="input otp-input" maxlength="1" inputmode="numeric" style="width:48px;text-align:center;font-size:20px" data-otp="${i}">`).join('')}
        </div>
        <p class="note" style="text-align:center">Kode demo: <span class="code">${code}</span></p>
      </form>`,
      `<button class="btn btn-light" data-action="closeModal">Batal</button><button class="btn" data-action="submitOtp">Send</button>`);
    setTimeout(() => { const el = document.querySelector('.otp-input'); if (el) el.focus(); }, 50);
  }

  /* ---------------- Helpers UI ---------------- */
  function tableHTML(id, headers, rows, opts) {
    opts = opts || {};
    const search = opts.search === false ? '' : `<input class="input" id="search-${id}" data-table-search="${id}" placeholder="Search...">`;
    return `
      <div class="card">
        ${opts.title ? `<h3 class="card-title">${esc(opts.title)}</h3>` : ''}
        ${search ? `<div class="toolbar"><div class="field search-field">${search}</div>${opts.toolbar || ''}</div>` : ''}
        <div class="table-wrap" data-table="${id}" data-pagesize="${opts.pageSize || 10}">
          <table class="tbl"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rows.length ? rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}" class="empty">No data available in table</td></tr>`}</tbody></table>
        </div>
        <div class="table-foot"><span class="table-info" id="info-${id}"></span><div class="pager" id="pager-${id}"></div></div>
      </div>`;
  }

  function initTables() {
    document.querySelectorAll('[data-table]').forEach(wrap => {
      const id = wrap.dataset.table;
      const input = document.getElementById('search-' + id);
      if (input && !input.dataset.bound) {
        input.dataset.bound = '1';
        input.addEventListener('input', () => { ui.tablePage[id] = 0; applyTable(id); });
      }
      applyTable(id);
    });
  }

  function applyTable(id) {
    const wrap = document.querySelector(`[data-table="${id}"]`);
    if (!wrap) return;
    const input = document.getElementById('search-' + id);
    const q = input ? input.value.trim().toLowerCase() : '';
    const all = [...wrap.querySelectorAll('tbody tr')].filter(tr => !tr.querySelector('.empty'));
    const filtered = q ? all.filter(tr => tr.textContent.toLowerCase().includes(q)) : all;
    const size = Number(wrap.dataset.pagesize || 10);
    const pages = Math.max(1, Math.ceil(filtered.length / size));
    const page = Math.min(Math.max(0, ui.tablePage[id] || 0), pages - 1);
    ui.tablePage[id] = page;
    all.forEach(tr => { tr.style.display = 'none'; });
    filtered.slice(page * size, page * size + size).forEach(tr => { tr.style.display = ''; });
    const info = document.getElementById('info-' + id);
    if (info) info.textContent = filtered.length ? `Menampilkan ${page * size + 1}–${Math.min((page + 1) * size, filtered.length)} dari ${filtered.length} entri` : 'Tidak ada entri';
    const pager = document.getElementById('pager-' + id);
    if (pager) {
      pager.innerHTML = Array.from({ length: pages }, (_, i) => `<button data-action="tablePage" data-table="${id}" data-page="${i}" class="${i === page ? 'active' : ''}">${i + 1}</button>`).join('');
    }
  }

  function photoCell(p, fallback) {
    return p && p.photo ? `<img class="thumb" src="${esc(p.photo)}" alt="">` : `<span style="color:#b9c0cc">${fallback || '—'}</span>`;
  }
  function formPhoto(entity) {
    return `<div class="field full"><label>Foto</label><input type="file" accept="image/*" class="input" data-photo="1">
      <div class="photo-preview"><img id="photoPreview" class="thumb-lg" src="${esc(entity && entity.photo || '')}" alt="Preview" style="${entity && entity.photo ? '' : 'display:none'}"></div></div>`;
  }

  function selectOptions(items, value, placeholder) {
    const opts = (placeholder ? [['', placeholder]] : []).concat(items.map(x => Array.isArray(x) ? x : [x.id, x.name]));
    return opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`).join('');
  }

  /* ---------------- Dashboard ---------------- */
  function renderDashboard() {
    const s = state;
    const activeMember = s.members.filter(m => m.status === 'Active').length;
    const completed = s.bookings.filter(b => b.status === 'Completed').length;
    const waiting = s.bookings.filter(b => b.status === 'Waiting').length;
    const activeMerchant = s.merchants.length;
    const activeVoucher = s.vouchers.filter(v => v.status === 'Publish' && v.end >= today()).length;
    const expiredVoucher = s.vouchers.filter(v => v.end < today()).length;
    const upcomingVoucher = s.vouchers.filter(v => v.status === 'Publish' && v.start > today()).length;
    const silver = s.members.filter(m => m.memberType === 'Silver').length;
    const gold = s.members.filter(m => m.memberType === 'Gold').length;
    const platinum = s.members.filter(m => m.memberType === 'Platinum').length;
    const latest = [...s.bookings].filter(b => b.status === 'Waiting' || b.start >= today()).sort((a, b) => b.created.localeCompare(a.created)).slice(0, 10);

    return `
      <div class="page-head"><div><h2>Dashboard</h2><p>Ringkasan aktivitas OrangeSky Group</p></div></div>
      <div class="grid grid-4">
        <div class="card stat-card"><span class="stat-icon">♙</span><h3>Total Member</h3><div class="stat-row"><span>Not Active<b>${s.members.length - activeMember}</b></span><span>Active<b>${activeMember}</b></span></div></div>
        <div class="card stat-card"><span class="stat-icon">▤</span><h3>Total Booking</h3><div class="stat-row"><span>Completed<b>${completed}</b></span><span>Waiting<b>${waiting}</b></span></div></div>
        <div class="card stat-card"><span class="stat-icon">◈</span><h3>Total Merchant</h3><div class="stat-row"><span>Active<b>${activeMerchant}</b></span><span>Inactive<b>0</b></span></div></div>
        <div class="card stat-card"><span class="stat-icon">◉</span><h3>Total Voucher</h3><div class="stat-row"><span>Upcoming<b>${upcomingVoucher}</b></span><span>Active<b>${activeVoucher}</b></span><span>Expired<b>${expiredVoucher}</b></span></div></div>
      </div>
      <div class="grid grid-2">
        <div class="card"><h3 class="card-title">▤ Member Type</h3><div class="stat-row" style="display:flex;gap:24px"><span>Silver<b>${silver}</b></span><span>Gold<b>${gold}</b></span><span>Platinum<b>${platinum}</b></span></div></div>
        <div class="card"><h3 class="card-title">▥ BOOKINGS <span style="font-weight:400;color:#888">(${s.bookings.length})</span></h3><div class="chart-box"><canvas id="bookingChart"></canvas></div></div>
      </div>
      <div class="card"><h3 class="card-title">▤ 10 Latest Upcoming Book</h3><div class="table-wrap"><table class="tbl"><thead><tr><th>Created Date</th><th>Booking ID</th><th>Email</th><th>Start Date</th><th>End Date</th><th>Status</th></tr></thead><tbody>
        ${latest.length ? latest.map(b => `<tr><td>${esc(b.created)}</td><td><a href="#/m/bookingKeyword">${esc(b.id)}</a></td><td>${esc(b.email)}</td><td>${esc(b.start)}</td><td>${esc(b.end)}</td><td>${badge(b.status)}</td></tr>`).join('') : `<tr><td colspan="6" class="empty">No data available in table</td></tr>`}
      </tbody></table></div></div>
      <div class="grid grid-2">
        <div class="card"><h3 class="card-title">♙ Visitor</h3>
          <div class="grid grid-2" style="gap:12px">
            <div class="stat-card" style="border:1px solid var(--border);padding:12px"><h3>Total Visitor</h3><div style="font-size:22px;font-weight:700">${fmt(s.visitor.total)}</div></div>
            <div class="stat-card" style="border:1px solid var(--border);padding:12px"><h3>Unique Visitor</h3><div style="font-size:22px;font-weight:700">${fmt(s.visitor.unique)}</div></div>
          </div>
          <div class="divider"></div>
          <h3 class="card-title">♙ Visitor Today</h3>
          <div class="grid grid-2" style="gap:12px">
            <div class="stat-card" style="border:1px solid var(--border);padding:12px"><h3>Total</h3><div style="font-size:22px;font-weight:700">${fmt(s.visitor.todayTotal)}</div></div>
            <div class="stat-card" style="border:1px solid var(--border);padding:12px"><h3>Unique</h3><div style="font-size:22px;font-weight:700">${fmt(s.visitor.todayUnique)}</div></div>
          </div>
        </div>
        <div class="card"><h3 class="card-title">▥ Page View</h3><div class="table-wrap"><table class="tbl"><thead><tr><th>Page</th><th class="num">Total</th></tr></thead><tbody>${s.pageViews.map(p => `<tr><td>${esc(p.page)}</td><td class="num">${p.total}</td></tr>`).join('')}</tbody></table></div></div>
      </div>
      <div class="card"><h3 class="card-title">◉ City / Country</h3><div class="table-wrap"><table class="tbl"><thead><tr><th>City</th><th>Country</th><th class="num">Total</th></tr></thead><tbody>${s.cities.map(c => `<tr><td>${esc(c.city)}</td><td>${esc(c.country)}</td><td class="num">${c.total}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  function drawBookingChart() {
    const canvas = document.getElementById('bookingChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(300, rect.width * dpr);
    canvas.height = Math.max(180, rect.height * dpr);
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;
    ctx.clearRect(0, 0, W, H);
    const buckets = Array.from({ length: 10 }, (_, i) => state.bookings.filter(b => {
      const d = new Date(b.start); const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
      return diff >= 0 && Math.floor(diff / 3) === (9 - i);
    }).length);
    const max = Math.max(1, ...buckets);
    const left = 34, bottom = 26, top = 10, right = 8;
    const cw = W - left - right, ch = H - bottom - top;
    ctx.strokeStyle = '#e6e9ee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = top + ch * i / 4;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(W - right, y); ctx.stroke();
      ctx.fillStyle = '#98a0ad'; ctx.font = '10px Segoe UI'; ctx.fillText(String(Math.round(max * (4 - i) / 4)), 6, y + 3);
    }
    const bw = cw / buckets.length * 0.62;
    buckets.forEach((v, i) => {
      const x = left + cw * i / buckets.length + (cw / buckets.length - bw) / 2;
      const h = ch * v / max;
      const grad = ctx.createLinearGradient(0, H - bottom - h, 0, H - bottom);
      grad.addColorStop(0, '#f7b955'); grad.addColorStop(1, '#f39c12');
      ctx.fillStyle = grad;
      ctx.fillRect(x, H - bottom - h, bw, h);
      ctx.fillStyle = '#98a0ad'; ctx.font = '10px Segoe UI';
      ctx.fillText(`-${(buckets.length - i) * 3}d`, x, H - 8);
    });
  }

  /* ---------------- Booking ---------------- */
  function renderBookingSearch(mode) {
    const f = ui.filters[mode] || (mode === 'bookingKeyword' ? { kriteria: 'id', value: '' } : { start: today(), end: today() });
    let rowsData = [];
    if (f.kriteria) {
      const q = String(f.value || '').toLowerCase();
      rowsData = state.bookings.filter(b => {
        const val = f.kriteria === 'id' ? b.id : f.kriteria === 'email' ? b.email : f.kriteria === 'fullname' ? b.guest : '';
        return q && String(val).toLowerCase().includes(q);
      });
    } else if (f.start && f.end) {
      rowsData = state.bookings.filter(b => b.start >= f.start && b.start <= f.end);
    }
    const form = mode === 'bookingKeyword'
      ? `<form class="toolbar" data-form="bookingKeyword"><div class="field"><label>Kriteria</label><select class="input" name="kriteria">${selectOptions([['id','Booking ID'],['email','Email'],['fullname','Fullname']], f.kriteria)}</select></div><div class="field search-field"><label>Keyword</label><input class="input" name="value" value="${esc(f.value)}" placeholder="Masukkan keyword"></div><div class="toolbar-actions"><button class="btn" type="submit">Search</button></div></form>`
      : `<form class="toolbar" data-form="bookingDate"><div class="field"><label>Start Date</label><input class="input" type="date" name="start" value="${esc(f.start)}"></div><div class="field"><label>End Date</label><input class="input" type="date" name="end" value="${esc(f.end)}"></div><div class="toolbar-actions"><button class="btn" type="submit">Search</button></div></form>`;
    const rows = rowsData.map(b => [esc(b.created), `<b>${esc(b.id)}</b>`, esc(b.email), esc(b.guest), esc(b.property), esc(b.roomType), esc(b.start), esc(b.end), badge(b.status), rp(b.totalPayment)]);
    return `<div class="page-head"><div><h2>${mode === 'bookingKeyword' ? 'Booking by Keyword' : 'Booking by Date'}</h2><p>Pencarian data booking</p></div></div>
      <div class="card">${form}</div>
      ${tableHTML('bookingResult', ['Created Date','Booking ID','Email','Fullname','Property','Room Type','Start','End','Status','Total'], rows)}`;
  }

  /* ---------------- Property ---------------- */
  function renderPropertyList() {
    const rows = state.properties.map(p => [
      photoCell(p, '▣'), `<b>${esc(p.name)}</b>`, esc(p.telp), esc(p.email), esc(p.city), esc(p.address),
      `<div class="toolbar-actions"><button class="btn btn-sm btn-info" data-action="goRoomType" data-id="${p.id}">Room Type</button><button class="btn btn-sm btn-outline" data-action="goRoom" data-id="${p.id}">Room</button><button class="btn btn-sm btn-light" data-action="editProperty" data-id="${p.id}">Edit</button><button class="btn btn-sm btn-danger" data-action="delete" data-type="properties" data-id="${p.id}">Delete</button></div>`
    ]);
    return `<div class="page-head"><div><h2>Data Properties</h2></div><a class="btn" href="#/m/propertyNew">+ New Property</a></div>
      ${tableHTML('propertyList', ['Photo','Property','Telp','Email','City','Address','Aksi'], rows)}`;
  }

  function renderPropertyForm(id) {
    const p = id ? byId(state.properties, id) : null;
    return `<div class="page-head"><div><h2>${p ? 'Update Property Data' : 'Add New Property'}</h2></div><a class="btn btn-light" href="#/m/property">Back</a></div>
      <div class="card"><form data-form="property" class="form-grid">
        ${p ? `<input type="hidden" name="id" value="${esc(p.id)}">` : ''}
        ${formPhoto(p)}
        <div class="field"><label>PROPERTY NAME</label><input class="input" name="name" value="${esc(p && p.name)}" required></div>
        <div class="field"><label>NO TELP</label><input class="input" name="telp" value="${esc(p && p.telp)}"></div>
        <div class="field"><label>EMAIL</label><input class="input" type="email" name="email" value="${esc(p && p.email)}"></div>
        <div class="field"><label>CITY</label><input class="input" name="city" value="${esc(p && p.city)}"></div>
        <div class="field full"><label>ADDRESS</label><input class="input" name="address" value="${esc(p && p.address)}"></div>
        <div class="form-actions full"><button class="btn" type="submit">Save</button><a class="btn btn-light" href="#/m/property">Back</a></div>
      </form></div>`;
  }

  function renderRoomType(prID) {
    const p = byId(state.properties, prID);
    const list = state.roomTypes.filter(r => r.prID === prID);
    const rows = list.map(rt => [
      `<button class="btn btn-sm btn-light" data-action="delete" data-type="roomTypes" data-id="${rt.id}">🗑</button>`,
      `<b>${esc(rt.name)}</b>`, esc(rt.space) + ' m²', rp(rt.price), esc(rt.upgrade),
      `<div class="toolbar-actions"><button class="btn btn-sm btn-info" data-action="goRoom" data-id="${prID}|${rt.id}">Data Room</button><button class="btn btn-sm btn-outline" data-action="goGallery" data-id="${prID}|${rt.id}">Gallery</button></div>`
    ]);
    return `<div class="page-head"><div><h2>Room Type — ${esc(p ? p.name : '')}</h2></div><a class="btn btn-light" href="#/m/property">Back</a></div>
      <div class="card"><form data-form="roomType" class="form-grid">
        <input type="hidden" name="prID" value="${esc(prID)}">
        <div class="field"><label>ROOM TYPE</label><input class="input" name="name" placeholder="Nama tipe kamar" required></div>
        <div class="field"><label>SPACE (m2)</label><input class="input" type="number" name="space" placeholder="22"></div>
        <div class="field"><label>PRICE (Rp)</label><input class="input" type="number" name="price" placeholder="480000"></div>
        <div class="field"><label>TYPE UPGRADE</label><input class="input" name="upgrade" placeholder="Deluxe Room"></div>
        <div class="form-actions full"><button class="btn" type="submit">Save</button></div>
      </form></div>
      ${tableHTML('roomTypeList', ['','Room Type','Space (m2)','Price (Rp)','Type Upgrade','Aksi'], rows)}`;
  }

  function renderRoom(id) {
    const [prID, tkID] = splitId(id);
    const p = byId(state.properties, prID);
    const rt = byId(state.roomTypes, tkID);
    const list = state.rooms.filter(r => r.tkID === tkID);
    const yesNo = (v) => v === 'Yes' ? badge('Active') : badge('Not Active');
    const rows = list.map(r => [
      `<button class="btn btn-sm btn-light" data-action="delete" data-type="rooms" data-id="${r.id}">🗑</button>`,
      `<b>${esc(r.name)}</b>`, yesNo(r.status), yesNo(r.is_breakfast), yesNo(r.is_smoking), yesNo(r.is_wifi), esc(r.adult), esc(r.child), esc(r.bed), esc(r.total)
    ]);
    const opts = (vals) => vals.map(v => `<option value="${v}">${v}</option>`).join('');
    return `<div class="page-head"><div><h2>DATA ROOM</h2><p>${esc(p ? p.name : '')} — ${esc(rt ? rt.name : '')}</p></div><a class="btn btn-light" href="#/m/roomType/${esc(prID)}">Back</a></div>
      <div class="card"><h3 class="card-title">＋ NEW ROOM</h3><form data-form="room" class="form-grid">
        <input type="hidden" name="tkID" value="${esc(tkID)}">
        <div class="field"><label>ROOM NAME</label><input class="input" name="name" required></div>
        <div class="field"><label>STATUS</label><select class="input" name="status">${opts(['Publish','Draft'])}</select></div>
        ${['is_breakfast','is_smoking','is_wifi','is_fitness','is_parking'].map(k => `<div class="field"><label>${k.replace('is_','').toUpperCase()}?</label><select class="input" name="${k}">${opts(['Yes','No'])}</select></div>`).join('')}
        <div class="field"><label>ADULT</label><select class="input" name="adult">${opts(['1','2','3','4'])}</select></div>
        <div class="field"><label>CHILD</label><select class="input" name="child">${opts(['0','1','2','3'])}</select></div>
        <div class="field"><label>BED TYPE</label><select class="input" name="bed">${opts(['Single','Double','Twin','King'])}</select></div>
        <div class="field"><label>Total</label><input class="input" type="number" name="total" value="1"></div>
        <div class="field full"><label>DESCRIPTION</label><input class="input" name="description"></div>
        <div class="form-actions full"><button class="btn" type="submit">Save</button></div>
      </form></div>
      ${tableHTML('roomList', ['','Room Name','Status','Breakfast','Smoking','Wifi','Adult','Child','Bed','Total'], rows)}`;
  }

  function renderGallery(id) {
    const [prID, tkID] = splitId(id);
    const rt = byId(state.roomTypes, tkID);
    const list = state.gallery.filter(g => g.tkID === tkID);
    return `<div class="page-head"><div><h2>Gallery — ${esc(rt ? rt.name : '')}</h2></div><a class="btn btn-light" href="#/m/roomType/${esc(prID)}">Back</a></div>
      <div class="card"><form data-form="gallery" class="form-grid"><input type="hidden" name="tkID" value="${esc(tkID)}">${formPhoto(null)}
        <div class="field full"><label>Caption</label><input class="input" name="caption" placeholder="Deskripsi foto" required></div>
        <div class="form-actions full"><button class="btn" type="submit">Save</button></div></form></div>
      <div class="grid grid-4">${list.length ? list.map(g => `<div class="card" style="text-align:center"><div style="height:120px;background:#f4f6f8;display:flex;align-items:center;justify-content:center;overflow:hidden">${g.url ? `<img src="${esc(g.url)}" style="width:100%;height:100%;object-fit:cover">` : '<span style="color:#aab">No image</span>'}</div><p class="note">${esc(g.caption)}</p><button class="btn btn-sm btn-danger" data-action="delete" data-type="gallery" data-id="${g.id}">Delete</button></div>`).join('') : '<div class="empty">Belum ada foto</div>'}</div>`;
  }

  function renderFacility() {
    const rows = state.facilities.map(f => [`<button class="btn btn-sm btn-danger" data-action="delete" data-type="facilities" data-id="${f.id}">🗑</button>`, esc(f.category), esc(f.name)]);
    const cats = ['General','Public Facilities','In-room Facilities','Connectivity','Amenities & Toiletries'];
    return `<div class="page-head"><div><h2>FACILITY</h2></div></div>
      <div class="card"><h3 class="card-title">＋ NEW FACILITY</h3><form data-form="facility" class="form-grid">
        <div class="field"><label>Category</label><select class="input" name="category">${cats.map(c => `<option>${c}</option>`).join('')}</select></div>
        <div class="field"><label>Facility</label><input class="input" name="name" required></div>
        <div class="form-actions full"><button class="btn" type="submit">Save</button></div></form></div>
      ${tableHTML('facilityList', ['','Category','Facility'], rows)}`;
  }

  function renderRatePlans() {
    const r = ui.rate;
    if (!r.pID && state.properties.length) r.pID = state.properties[0].id;
    const roomTypes = state.roomTypes.filter(x => x.prID === r.pID);
    if (!roomTypes.some(x => x.id === r.tkID)) r.tkID = roomTypes.length ? roomTypes[0].id : '';
    const rooms = state.rooms.filter(x => x.tkID === r.tkID);
    if (!rooms.some(x => x.id === r.rID)) r.rID = '';

    const y = ui.cal.y, m = ui.cal.m;
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const monthName = new Date(y, m, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    const events = state.ratePlans.filter(e => e.tkID === r.tkID && (!r.rID || e.rID === r.rID));
    let cells = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => `<div class="cal-dow">${d}</div>`).join('');
    for (let i = 0; i < first; i++) cells += `<div class="cal-day muted"></div>`;
    for (let d = 1; d <= days; d++) {
      const date = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const evs = events.filter(e => e.date === date);
      const isToday = date === today();
      cells += `<div class="cal-day ${isToday ? 'today' : ''}" data-action="calDay" data-date="${date}">
        <b>${d}</b>${evs.map(e => `<span class="evt" data-action="calEvent" data-id="${e.id}">${rp(e.rate)} · sisa ${e.availability}</span>`).join('')}</div>`;
    }

    return `<div class="page-head"><div><h2>Room Rate & Room Avability</h2></div></div>
      <div class="card"><div class="toolbar">
        <div class="field"><label>Property</label><select class="input" data-action="rateProperty" name="pID">${selectOptions(state.properties.map(p => [p.id, p.name]), r.pID)}</select></div>
        <div class="field"><label>Room Type</label><select class="input" data-action="rateRoomType" name="tkID">${selectOptions(roomTypes.map(x => [x.id, x.name]), r.tkID)}</select></div>
        <div class="field"><label>Room</label><select class="input" data-action="rateRoom" name="rID">${selectOptions(rooms.map(x => [x.id, x.name]), r.rID, 'Semua kamar')}</select></div>
        <div class="toolbar-actions"><button class="btn" data-action="bulkRate">Bulk Edit</button></div>
      </div></div>
      <div class="card"><div class="cal-head"><h3 class="card-title" style="margin:0">${monthName}</h3><div class="toolbar-actions"><button class="btn btn-light btn-sm" data-action="calPrev">‹ Prev</button><button class="btn btn-light btn-sm" data-action="calNext">Next ›</button></div></div><div class="cal-grid">${cells}</div></div>`;
  }

  /* ---------------- Member ---------------- */
  function renderMember() {
    const f = ui.filters.member || { kriteria: 'fullname', value: '' };
    let list = state.members;
    if (f.value) {
      const q = f.value.toLowerCase();
      list = list.filter(m => String(m[f.kriteria] || '').toLowerCase().includes(q));
    }
    const rows = list.map(m => [
      `<div class="toolbar-actions"><button class="btn btn-sm btn-info" data-action="memberDetail" data-id="${m.id}">Detail</button><button class="btn btn-sm btn-outline" data-action="memberUpgrade" data-id="${m.id}">Upgrade</button><button class="btn btn-sm btn-light" data-action="memberLog" data-id="${m.id}">Log</button><button class="btn btn-sm btn-danger" data-action="delete" data-type="members" data-id="${m.id}">🗑</button></div>`,
      m.avatar ? `<img class="thumb" src="${esc(m.avatar)}">` : '—', `<b>${esc(m.fullname)}</b>`, esc(m.joined), esc(m.email), esc(m.mobile), badge(m.memberType), esc(m.point), esc(m.nationality), badge(m.status), esc(m.reference)
    ]);
    return `<div class="page-head"><div><h2>DATA MEMBER</h2></div></div>
      <div class="card"><form class="toolbar" data-form="member"><div class="field"><label>Kriteria</label><select class="input" name="kriteria">${selectOptions([['fullname','Name'],['email','Email'],['mobile','Mobile'],['nationality','Nationality'],['memberType','Member Type'],['reference','Reference Code']], f.kriteria)}</select></div><div class="field search-field"><label>Keyword</label><input class="input" name="value" value="${esc(f.value)}" placeholder="Masukkan keyword"></div><div class="toolbar-actions"><button class="btn" type="submit">Cari</button><button class="btn btn-light" type="button" data-action="memberShowAll">Show All</button></div></form></div>
      ${tableHTML('memberList', ['Aksi','Avatar','Name','Joined','Email','Mobile','Type','Point','Nationality','Status','Reference Code'], rows)}`;
  }

  function memberDetailModal(id) {
    const m = byId(state.members, id);
    if (!m) return;
    showModal('Detail Member', `<dl class="kv"><dt>Nama</dt><dd>${esc(m.fullname)}</dd><dt>Email</dt><dd>${esc(m.email)}</dd><dt>Mobile</dt><dd>${esc(m.mobile)}</dd><dt>Kebangsaan</dt><dd>${esc(m.nationality)}</dd><dt>Level</dt><dd>${badge(m.memberType)}</dd><dt>Point</dt><dd>${fmt(m.point)}</dd><dt>Status</dt><dd>${badge(m.status)}</dd><dt>Reference</dt><dd>${esc(m.reference)}</dd><dt>Bergabung</dt><dd>${esc(m.joined)}</dd></dl>`, `<button class="btn btn-light" data-action="closeModal">Tutup</button>`, true);
  }
  function memberUpgradeModal(id) {
    const m = byId(state.members, id);
    if (!m) return;
    showModal('Upgrade Member', `<form data-form="memberUpgrade"><input type="hidden" name="id" value="${m.id}"><p class="note">Member: <b>${esc(m.fullname)}</b> — level saat ini ${badge(m.memberType)}</p><div class="field"><label>Level Baru</label><select class="input" name="memberType">${selectOptions(['Silver','Gold','Platinum'], m.memberType)}</select></div></form>`, `<button class="btn btn-light" data-action="closeModal">Batal</button><button class="btn" data-action="submitMemberUpgrade">Save</button>`);
  }
  function memberLogModal(id) {
    const logs = state.memberLogs.filter(l => l.mID === id);
    showModal('Member Log', logs.length ? `<table class="tbl"><thead><tr><th>Created</th><th>Booking</th><th>Property</th><th>Point</th><th>Type</th><th>Status</th></tr></thead><tbody>${logs.map(l => `<tr><td>${esc(l.created)}</td><td>${esc(l.bookingID)}</td><td>${esc(l.property)}</td><td>${l.point}</td><td>${esc(l.type)}</td><td>${badge(l.status)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">Belum ada log.</p>', `<button class="btn btn-light" data-action="closeModal">Tutup</button>`, true);
  }

  /* ---------------- Merchant ---------------- */
  function renderMerchantList() {
    const rows = state.merchants.map(m => [photoCell(m, '◈'), esc(m.name), esc(m.email), esc(m.phone), esc(m.type), esc(m.address),
      `<div class="toolbar-actions"><button class="btn btn-sm btn-light" data-action="editMerchant" data-id="${m.id}">Edit</button><button class="btn btn-sm btn-danger" data-action="delete" data-type="merchants" data-id="${m.id}">🗑</button></div>`]);
    return `<div class="page-head"><div><h2>Data Merchant</h2></div><a class="btn" href="#/m/merchantNew">+ New Merchant</a></div>
      ${tableHTML('merchantList', ['Photo','Name','Email','Phone','Type','Address','Aksi'], rows)}`;
  }
  function renderMerchantForm(id) {
    const m = id ? byId(state.merchants, id) : null;
    const types = ['Accessories','Attraction','Beautycare','Expedition','Favourite','Food & Beverage','Goodies','Playground','Recreation','Retail','Salon','Transportation','Treatments','Wellnes Spa'];
    return `<div class="page-head"><div><h2>${m ? 'UPDATE DATA MERCHANT' : 'NEW DATA MERCHANT'}</h2></div><a class="btn btn-light" href="#/m/merchant">Back</a></div>
      <div class="card"><form data-form="merchant" class="form-grid">
        ${m ? `<input type="hidden" name="id" value="${m.id}">` : ''}${formPhoto(m)}
        <div class="field"><label>NAME</label><input class="input" name="name" value="${esc(m && m.name)}" required></div>
        <div class="field"><label>EMAIL</label><input class="input" type="email" name="email" value="${esc(m && m.email)}"></div>
        <div class="field"><label>PHONE</label><input class="input" name="phone" value="${esc(m && m.phone)}"></div>
        <div class="field"><label>MERCHANT TYPE</label><select class="input" name="type">${selectOptions(types, m && m.type, 'Select Merchant Type')}</select></div>
        <div class="field"><label>PASSWORD</label><input class="input" type="password" name="pass" value="${esc(m && m.pass)}" placeholder="enter the password"></div>
        <div class="field full"><label>ADDRESS</label><input class="input" name="address" value="${esc(m && m.address)}"></div>
        <div class="form-actions full"><button class="btn" type="submit">Save</button><a class="btn btn-light" href="#/m/merchant">Back</a></div>
      </form></div>`;
  }

  /* ---------------- Voucher ---------------- */
  function renderVoucherList() {
    const rows = state.vouchers.map(v => [photoCell(v, '◉'), `<b>${esc(v.title)}</b>`, esc(byId(state.merchants, v.mID) ? byId(state.merchants, v.mID).name : '-'), esc(v.start), esc(v.end), rp(v.minimum), v.discount + '%', v.discountOrange + '%', badge(v.status),
      `<div class="toolbar-actions"><button class="btn btn-sm btn-light" data-action="editVoucher" data-id="${v.id}">Edit</button><button class="btn btn-sm btn-danger" data-action="delete" data-type="vouchers" data-id="${v.id}">🗑</button></div>`]);
    return `<div class="page-head"><div><h2>Data Voucher</h2></div><a class="btn" href="#/m/voucherNew">+ New Voucher</a></div>
      ${tableHTML('voucherList', ['Photo','Title','Merchant','Start','End','Minimum','Disc Guest','Disc OS','Status','Aksi'], rows)}`;
  }
  function renderVoucherForm(id) {
    const v = id ? byId(state.vouchers, id) : null;
    return `<div class="page-head"><div><h2>${v ? 'UPDATE DATA PROMOTION' : 'NEW PROMOTION'}</h2></div><a class="btn btn-light" href="#/m/voucher">Back</a></div>
      <div class="card"><form data-form="voucher" class="form-grid">
        ${v ? `<input type="hidden" name="id" value="${v.id}">` : ''}${formPhoto(v)}
        <div class="field"><label>MERCHANT</label><select class="input" name="mID">${selectOptions(state.merchants.map(x => [x.id, x.name]), v && v.mID, 'Select Merchant')}</select></div>
        <div class="field"><label>TITLE</label><input class="input" name="title" value="${esc(v && v.title)}" required></div>
        <div class="field"><label>Minimum Transaction</label><input class="input" type="number" name="minimum" value="${esc(v && v.minimum)}"></div>
        <div class="field"><label>% Discount (Guest)</label><input class="input" type="number" name="discount" value="${esc(v && v.discount)}" placeholder="Discount for guest"></div>
        <div class="field"><label>% Discount (Orangesky)</label><input class="input" type="number" name="discountOrange" value="${esc(v && v.discountOrange)}" placeholder="Discount for orangesky"></div>
        <div class="field"><label>START DATE</label><input class="input" type="date" name="start" value="${esc(v && v.start)}"></div>
        <div class="field"><label>END DATE</label><input class="input" type="date" name="end" value="${esc(v && v.end)}"></div>
        <div class="field"><label>STATUS</label><select class="input" name="status">${selectOptions(['Publish','Draft'], v && v.status)}</select></div>
        <div class="field full"><label>DESCRIPTION</label><textarea class="input" name="description">${esc(v && v.description)}</textarea></div>
        <div class="form-actions full"><button class="btn" type="submit">Save</button><a class="btn btn-light" href="#/m/voucher">Back</a></div>
      </form></div>`;
  }

  /* ---------------- User ---------------- */
  function renderUserList() {
    const rows = state.users.map(u => {
      const props = state.userProperties.filter(up => up.uID === u.id).map(up => byId(state.properties, up.propertyID)).filter(Boolean);
      return [photoCell(u, '♟'), esc(u.uname), esc(u.name), esc(u.email), badge(u.type), props.map(p => esc(p.name)).join(', ') || '—',
        `<div class="toolbar-actions"><button class="btn btn-sm btn-info" data-action="userProperty" data-id="${u.id}">Property</button><button class="btn btn-sm btn-light" data-action="editUser" data-id="${u.id}">Edit</button><button class="btn btn-sm btn-danger" data-action="delete" data-type="users" data-id="${u.id}">🗑</button></div>`];
    });
    return `<div class="page-head"><div><h2>Data User</h2></div><a class="btn" href="#/m/userNew">+ New User</a></div>
      ${tableHTML('userList', ['Photo','Username','Name','Email','Type','Property','Aksi'], rows)}`;
  }
  function renderUserForm(id) {
    const u = id ? byId(state.users, id) : null;
    return `<div class="page-head"><div><h2>${u ? 'UPDATE DATA USER' : 'NEW DATA USER'}</h2></div><a class="btn btn-light" href="#/m/user">Back</a></div>
      <div class="card"><form data-form="user" class="form-grid">
        ${u ? `<input type="hidden" name="id" value="${u.id}">` : ''}${formPhoto(u)}
        <div class="field"><label>NAME</label><input class="input" name="name" value="${esc(u && u.name)}" required></div>
        <div class="field"><label>USERNAME</label><input class="input" name="uname" value="${esc(u && u.uname)}" required></div>
        <div class="field"><label>PASSWORD</label><input class="input" type="password" name="pass" value="${esc(u && u.pass)}"></div>
        <div class="field"><label>EMAIL</label><input class="input" type="email" name="email" value="${esc(u && u.email)}"></div>
        <div class="field"><label>USER TYPE</label><select class="input" name="type">${selectOptions(['Admin','User'], u && u.type)}</select></div>
        <div class="form-actions full"><button class="btn" type="submit">Save</button><a class="btn btn-light" href="#/m/user">Back</a></div>
      </form></div>`;
  }
  function renderUserProperty(id) {
    const u = byId(state.users, id);
    return `<div class="page-head"><div><h2>Update Data User Property</h2></div><a class="btn btn-light" href="#/m/user">Back</a></div>
      <div class="card"><form data-form="userProperty" class="form-grid">
        <input type="hidden" name="uID" value="${esc(id)}">
        <div class="field"><label>USER NAME</label><input class="input" value="${esc(u ? u.name : '')}" disabled></div>
        <div class="field"><label>SELECT PROPERTY</label><select class="input" name="propertyID">${selectOptions(state.properties.map(p => [p.id, p.name]), '', 'Pilih Property')}</select></div>
        <div class="form-actions full"><button class="btn" type="submit">Save</button></div>
      </form></div>`;
  }

  /* ---------------- Tools ---------------- */
  function renderCheckPayment() {
    const f = ui.filters.checkPayment || { start: today(), end: today() };
    const list = state.bookings.filter(b => b.start >= f.start && b.start <= f.end && ['Completed','Expired','Waiting'].includes(b.status));
    const rows = list.map(b => {
      const pay = state.payments.find(p => p.bookingID === b.id);
      return [`<input type="checkbox" class="check-pay" value="${b.id}">`, esc(b.created), `<b>${esc(b.id)}</b>`, esc(b.email), esc(b.guest), esc(b.start), esc(b.end), badge(b.status), rp(b.totalPayment), pay ? badge(pay.status) : badge('Pending')];
    });
    return `<div class="page-head"><div><h2>Check Booking Payment</h2></div></div>
      <div class="card"><form class="toolbar" data-form="checkPayment"><div class="field"><label>Start Date</label><input class="input" type="date" name="start" value="${esc(f.start)}"></div><div class="field"><label>End Date</label><input class="input" type="date" name="end" value="${esc(f.end)}"></div><div class="toolbar-actions"><button class="btn" type="submit">Search</button></div></form></div>
      ${tableHTML('checkPay', ['','Created Date','Booking ID','Email','Fullname','Start','End','Status','Total','Payment'], rows, { toolbar: `<button class="btn btn-primary" data-action="verifyPayment">Check Booking Payment</button>` })}`;
  }

  function renderUpdatePoint() {
    const pointRows = state.memberLogs.filter(l => l.type !== 'Booking').map(l => [
      `<input type="checkbox" class="check-point" value="${l.id}">`, esc(l.created), esc(byId(state.members, l.mID) ? byId(state.members, l.mID).fullname : '-'), esc(l.bookingID), esc(l.property), esc(l.roomType), esc(l.point), esc(l.type), badge(l.status)
    ]);
    const bookingRows = state.memberLogs.filter(l => l.type === 'Booking').map(l => [
      `<input type="checkbox" class="check-booking" value="${l.id}">`, esc(l.created), esc(byId(state.members, l.mID) ? byId(state.members, l.mID).fullname : '-'), esc(l.bookingID), esc(l.property), esc(l.roomType), esc(l.point), esc(l.type), badge(l.status)
    ]);
    const heads = ['','Created Date','Member','Booking ID','Property','Room Type','Point','Type','Status'];
    return `<div class="page-head"><div><h2>Update Member Point</h2></div></div>
      ${tableHTML('pointLog', heads, pointRows, { title: 'Point Log', toolbar: `<button class="btn" data-action="updatePoint">Update Point</button>` })}
      ${tableHTML('bookingLog', heads, bookingRows, { title: 'Booking Log', toolbar: `<button class="btn" data-action="updateBooking">Update Booking</button>` })}`;
  }

  /* ---------------- Reports ---------------- */
  function renderReport(type) {
    const f = ui.reportFilters[type] || {};
    let headers = [], rows = [];
    if (type === 'lapBooking') {
      headers = ['Booking ID','Status','Property','Room Type','Guest','Check In','Check Out','Night(s)','Room Rate','Komisi','Net Hotel','Point Used','Total Payment','Fee Payment','Net Recieved','Margin'];
      rows = state.bookings.filter(b => (!f.pID || b.prID === f.pID) && (!f.status || b.status === f.status) && (!f.tanggalAwal || b.start >= f.tanggalAwal) && (!f.tanggalAkhir || b.start <= f.tanggalAkhir))
        .map(b => [b.id, badge(b.status), esc(b.property), esc(b.roomType), esc(b.guest), esc(b.start), esc(b.end), b.nights, fmt(b.roomRate), fmt(b.commission), fmt(b.netHotel), b.pointUsed, fmt(b.totalPayment), fmt(b.feePayment), fmt(b.netReceived), fmt(b.margin)]);
    } else if (type === 'lapRoom') {
      headers = ['Property','Room Type','Room','Status','Check In','Check Out','Guest','Total'];
      rows = state.bookings.filter(b => (!f.pID || b.prID === f.pID) && (!f.roomTypeID || b.tkID === f.roomTypeID) && (!f.tanggalAwal || b.start >= f.tanggalAwal) && (!f.tanggalAkhir || b.start <= f.tanggalAkhir))
        .map(b => [esc(b.property), esc(b.roomType), esc(b.rID || '-'), badge(b.status), esc(b.start), esc(b.end), esc(b.guest), fmt(b.totalPayment)]);
    } else if (type === 'lapMember') {
      headers = ['Nama','Email','Mobile','Level','Point','Status','Joined'];
      rows = state.members.filter(m => !f.value || String(m[f.criteria || 'fullname'] || '').toLowerCase().includes(String(f.value).toLowerCase())).map(m => [esc(m.fullname), esc(m.email), esc(m.mobile), badge(m.memberType), fmt(m.point), badge(m.status), esc(m.joined)]);
    } else if (type === 'lapMerchant') {
      headers = ['Nama','Email','Phone','Type','Address'];
      rows = state.merchants.filter(m => !f.value || String(m[f.criteria || 'name'] || '').toLowerCase().includes(String(f.value).toLowerCase())).map(m => [esc(m.name), esc(m.email), esc(m.phone), esc(m.type), esc(m.address)]);
    } else if (type === 'lapVoucher') {
      headers = ['Title','Merchant','Start','End','Minimum','Disc Guest','Disc OS','Status'];
      rows = state.vouchers.filter(v => !f.value || String(v[f.criteria || 'title'] || '').toLowerCase().includes(String(f.value).toLowerCase())).map(v => [esc(v.title), esc(byId(state.merchants, v.mID) ? byId(state.merchants, v.mID).name : '-'), esc(v.start), esc(v.end), fmt(v.minimum), v.discount + '%', v.discountOrange + '%', badge(v.status)]);
    } else if (type === 'lapVoucherRevenue') {
      headers = ['Created Date','Voucher Title','Merchant Name','Guest','Amount','Discount','Discount Orange','Revenue'];
      rows = state.bookings.filter(b => b.start >= (f.tanggalAwal || '0000-01-01') && b.start <= (f.tanggalAkhir || '9999-12-31') && (!f.mID || b.prID === f.mID))
        .slice(0, 30).map((b, i) => {
          const v = state.vouchers[i % state.vouchers.length];
          const disc = Math.round(b.totalPayment * v.discount / 100);
          const discO = Math.round(b.totalPayment * v.discountOrange / 100);
          return [esc(b.created), esc(v.title), esc(byId(state.merchants, v.mID) ? byId(state.merchants, v.mID).name : '-'), esc(b.guest), fmt(b.totalPayment), fmt(disc), fmt(discO), fmt(b.totalPayment - disc - discO)];
        });
    }
    ui.reportRows[type] = { headers: headers.map(h => h.replace(/<[^>]+>/g, '')), rows: rows.map(r => r.map(c => String(c).replace(/<[^>]+>/g, ''))) };

    let form = '';
    if (type === 'lapBooking' || type === 'lapRoom') {
      form = `<div class="field"><label>PROPERTY</label><select class="input" name="pID">${selectOptions(state.properties.map(p => [p.id, p.name]), f.pID, type === 'lapBooking' ? 'All Property' : 'Pilih Property')}</select></div>
        ${type === 'lapBooking' ? `<div class="field"><label>STATUS</label><select class="input" name="status">${selectOptions(['Waiting','Completed','Expired'], f.status, 'All Status')}</select></div>` : `<div class="field"><label>Room Type</label><select class="input" name="roomTypeID">${selectOptions(state.roomTypes.filter(x => !f.pID || x.prID === f.pID).map(x => [x.id, x.name]), f.roomTypeID, 'Semua')}</select></div>`}
        <div class="field"><label>PERIODE</label><div style="display:flex;gap:6px"><input class="input" type="date" name="tanggalAwal" value="${esc(f.tanggalAwal || today())}"><input class="input" type="date" name="tanggalAkhir" value="${esc(f.tanggalAkhir || today())}"></div></div>`;
    } else if (type === 'lapVoucherRevenue') {
      form = `<div class="field"><label>MERCHANT</label><select class="input" name="mID">${selectOptions(state.merchants.map(m => [m.id, m.name]), f.mID, 'Semua Merchant')}</select></div>
        <div class="field"><label>PERIODE</label><div style="display:flex;gap:6px"><input class="input" type="date" name="tanggalAwal" value="${esc(f.tanggalAwal || today())}"><input class="input" type="date" name="tanggalAkhir" value="${esc(f.tanggalAkhir || today())}"></div></div>`;
    } else {
      const crit = type === 'lapMember' ? [['fullname','Fullname'],['mobile','Mobile Number'],['email','Email']] : type === 'lapMerchant' ? [['name','Name'],['email','Email'],['phone','Phone']] : [['title','Title'],['mID','Merchant ID']];
      form = `<div class="field"><label>Criteria</label><select class="input" name="criteria">${selectOptions(crit, f.criteria)}</select></div><div class="field search-field"><label>Search Value</label><input class="input" name="value" value="${esc(f.value)}" placeholder="Please input"></div>`;
    }

    return `<div class="page-head"><div><h2>${esc(TITLES[type])}</h2></div><button class="btn btn-info" data-action="exportReport" data-type="${type}">Export Excel (CSV)</button></div>
      <div class="card"><form class="toolbar" data-form="report" data-type="${type}">${form}<div class="toolbar-actions"><button class="btn" type="submit">Search</button></div></form></div>
      ${tableHTML('report' + type, headers, rows)}`;
  }

  /* ---------------- Ganti password ---------------- */
  function renderGantiPass() {
    return `<div class="page-head"><div><h2>GANTI PASSWORD</h2></div><a class="btn btn-light" href="#/m/dashboard">Back</a></div>
      <div class="card" style="max-width:620px"><form data-form="gantiPass" class="form-grid">
        <div class="field full"><label>OLD PASSWORD</label><input class="input" type="password" name="pass_lama" placeholder="Enter Old Password" required></div>
        <div class="field full"><label>NEW PASSWORD</label><input class="input" type="password" name="pass_baru" placeholder="Enter New Password" required></div>
        <div class="field full"><label>CONFIRM PASSWORD</label><input class="input" type="password" name="pass_confirm" placeholder="Enter Confirm Password" required></div>
        <div class="form-actions full"><button class="btn" type="submit">Change Password</button><a class="btn btn-light" href="#/m/dashboard">Back</a></div>
      </form></div>`;
  }

  function renderContent(menu, id) {
    switch (menu) {
      case 'dashboard': return renderDashboard();
      case 'bookingKeyword': case 'bookingDate': return renderBookingSearch(menu);
      case 'property': return renderPropertyList();
      case 'propertyNew': return renderPropertyForm('');
      case 'propertyEdit': return renderPropertyForm(id);
      case 'roomType': return renderRoomType(id);
      case 'room': return renderRoom(id);
      case 'gallery': return renderGallery(id);
      case 'facility': return renderFacility();
      case 'ratePlans': return renderRatePlans();
      case 'member': return renderMember();
      case 'merchant': return renderMerchantList();
      case 'merchantNew': return renderMerchantForm('');
      case 'merchantEdit': return renderMerchantForm(id);
      case 'voucher': return renderVoucherList();
      case 'voucherNew': return renderVoucherForm('');
      case 'voucherEdit': return renderVoucherForm(id);
      case 'user': return renderUserList();
      case 'userNew': return renderUserForm('');
      case 'userEdit': return renderUserForm(id);
      case 'userProperty': return renderUserProperty(id);
      case 'checkBookingPayment': return renderCheckPayment();
      case 'updateMemberPoint': return renderUpdatePoint();
      case 'lapBooking': case 'lapRoom': case 'lapMember': case 'lapMerchant': case 'lapVoucher': case 'lapVoucherRevenue': return renderReport(menu);
      case 'gantiPass': return renderGantiPass();
      default: return renderDashboard();
    }
  }

  /* ---------------- Events ---------------- */
  document.addEventListener('click', function (e) {
    if (e.target.classList && e.target.classList.contains('modal-backdrop')) { closeModal(); return; }
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;
    const id = el.dataset.id || '';

    if (a === 'backdrop') return;
    if (a === 'toggleGroup') { el.parentElement.classList.toggle('open'); return; }
    if (a === 'toggleSidebar') { document.getElementById('sidebar').classList.toggle('show'); return; }
    if (a === 'toggleUserMenu') { document.getElementById('userDropdown').classList.toggle('show'); return; }
    if (a === 'togglePassword') {
      const input = el.parentElement.querySelector('input');
      input.type = input.type === 'password' ? 'text' : 'password';
      el.textContent = input.type === 'password' ? '👁' : '🙈';
      return;
    }
    if (a === 'closeModal') { closeModal(); return; }
    if (a === 'confirmYes') { const cb = ui.confirmCb; ui.confirmCb = null; closeModal(); if (cb) cb(); return; }
    if (a === 'tablePage') { ui.tablePage[el.dataset.table] = Number(el.dataset.page); applyTable(el.dataset.table); return; }
    if (a === 'logout') {
      state.session = null; save(); ui.otp = null; location.hash = '#/login'; return;
    }
    if (a === 'submitOtp') {
      const vals = [...document.querySelectorAll('.otp-input')].map(x => x.value).join('');
      if (vals === ui.otp.code) {
        const u = state.users.find(x => x.uname === ui.otp.uname);
        state.session = { uname: u.uname, name: u.name, email: u.email, role: u.type, userID: u.id };
        save(); closeModal(); location.hash = '#/m/dashboard'; notify('Login berhasil. Selamat datang, ' + u.name, 'ok');
      } else notify('Kode OTP salah', 'err');
      return;
    }
    if (a === 'delete') {
      const key = el.dataset.type;
      confirmDialog('Yakin ingin menghapus data ini?', () => {
        state[key] = state[key].filter(x => x.id !== id);
        save(); render(); notify('Data dihapus', 'ok');
      });
      return;
    }
    if (a === 'editProperty') { go('propertyEdit', id); return; }
    if (a === 'goRoomType') { go('roomType', id); return; }
    if (a === 'goRoom') { go('room', id); return; }
    if (a === 'goGallery') { go('gallery', id); return; }
    if (a === 'editMerchant') { go('merchantEdit', id); return; }
    if (a === 'editVoucher') { go('voucherEdit', id); return; }
    if (a === 'editUser') { go('userEdit', id); return; }
    if (a === 'userProperty') { go('userProperty', id); return; }
    if (a === 'memberDetail') { memberDetailModal(id); return; }
    if (a === 'memberUpgrade') { memberUpgradeModal(id); return; }
    if (a === 'memberLog') { memberLogModal(id); return; }
    if (a === 'memberShowAll') { ui.filters.member = { kriteria: 'fullname', value: '' }; render(); return; }
    if (a === 'submitMemberUpgrade') {
      const form = document.querySelector('[data-form="memberUpgrade"]');
      const d = Object.fromEntries(new FormData(form));
      const m = byId(state.members, d.id);
      if (m) { m.memberType = d.memberType; save(); closeModal(); render(); notify('Level member diperbarui', 'ok'); }
      return;
    }
    if (a === 'calPrev') { ui.cal.m--; if (ui.cal.m < 0) { ui.cal.m = 11; ui.cal.y--; } render(); return; }
    if (a === 'calNext') { ui.cal.m++; if (ui.cal.m > 11) { ui.cal.m = 0; ui.cal.y++; } render(); return; }
    if (a === 'calDay') {
      showModal('Tambah Rate Plan', `<form data-form="ratePlan"><input type="hidden" name="date" value="${esc(el.dataset.date)}"><div class="kv"><dt>Tanggal</dt><dd>${esc(el.dataset.date)}</dd><dt>Room Type</dt><dd>${esc(byId(state.roomTypes, ui.rate.tkID) ? byId(state.roomTypes, ui.rate.tkID).name : '-')}</dd></div><div class="divider"></div><div class="field"><label>Rate (Rp)</label><input class="input" type="number" name="rate" value="650000"></div><div class="field" style="margin-top:12px"><label>Availability</label><input class="input" type="number" name="availability" value="5"></div></form>`, `<button class="btn btn-light" data-action="closeModal">Batal</button><button class="btn" data-action="submitRatePlan">Save</button>`);
      return;
    }
    if (a === 'calEvent') {
      const ev = byId(state.ratePlans, id);
      if (!ev) return;
      showModal('Edit Rate Plan', `<form data-form="ratePlanEdit"><input type="hidden" name="id" value="${ev.id}"><div class="field"><label>Tanggal</label><input class="input" value="${esc(ev.date)}" disabled></div><div class="field"><label>Rate (Rp)</label><input class="input" type="number" name="rate" value="${ev.rate}"></div><div class="field"><label>Availability</label><input class="input" type="number" name="availability" value="${ev.availability}"></div></form>`, `<button class="btn btn-danger" data-action="deleteRatePlan" data-id="${ev.id}">Delete</button><button class="btn btn-light" data-action="closeModal">Batal</button><button class="btn" data-action="submitRatePlanEdit">Save</button>`);
      return;
    }
    if (a === 'submitRatePlan' || a === 'submitRatePlanEdit') {
      const form = document.querySelector(a === 'submitRatePlan' ? '[data-form="ratePlan"]' : '[data-form="ratePlanEdit"]');
      const d = Object.fromEntries(new FormData(form));
      if (d.id) {
        const ev = byId(state.ratePlans, d.id);
        ev.rate = Number(d.rate); ev.availability = Number(d.availability);
      } else {
        state.ratePlans.push({ id: uid('rp'), tkID: ui.rate.tkID, rID: ui.rate.rID, date: d.date, rate: Number(d.rate), availability: Number(d.availability) });
      }
      save(); closeModal(); render(); notify('Rate plan disimpan', 'ok'); return;
    }
    if (a === 'deleteRatePlan') {
      state.ratePlans = state.ratePlans.filter(x => x.id !== id); save(); closeModal(); render(); notify('Rate plan dihapus', 'ok'); return;
    }
    if (a === 'bulkRate') {
      showModal('Bulk Edit Rate Plan', `<form data-form="bulkRate"><div class="field"><label>Start Date</label><input class="input" type="date" name="start" value="${today()}"></div><div class="field" style="margin-top:12px"><label>End Date</label><input class="input" type="date" name="end" value="${today()}"></div><div class="field" style="margin-top:12px"><label>Rate (Rp)</label><input class="input" type="number" name="rate" value="650000"></div><p class="note" style="margin-top:10px">Berlaku untuk tipe kamar terpilih: <b>${esc(byId(state.roomTypes, ui.rate.tkID) ? byId(state.roomTypes, ui.rate.tkID).name : '-')}</b></p></form>`, `<button class="btn btn-light" data-action="closeModal">Batal</button><button class="btn" data-action="submitBulkRate">Apply</button>`);
      return;
    }
    if (a === 'submitBulkRate') {
      const d = Object.fromEntries(new FormData(document.querySelector('[data-form="bulkRate"]')));
      let n = 0;
      state.ratePlans.forEach(ev => {
        if (ev.tkID === ui.rate.tkID && ev.date >= d.start && ev.date <= d.end) { ev.rate = Number(d.rate); n++; }
      });
      save(); closeModal(); render(); notify(`${n} rate plan diperbarui`, 'ok'); return;
    }
    if (a === 'verifyPayment') {
      const ids = [...document.querySelectorAll('.check-pay:checked')].map(x => x.value);
      if (!ids.length) { notify('Pilih minimal satu booking', 'err'); return; }
      ids.forEach(idB => {
        let p = state.payments.find(x => x.bookingID === idB);
        if (!p) { p = { id: uid('pay'), bookingID: idB, status: 'Pending', amount: 0, channel: 'Manual' }; state.payments.push(p); }
        p.status = 'Verified'; p.paidAt = today();
        const b = byId(state.bookings, idB); if (b) b.status = 'Completed';
      });
      save(); render(); notify(`${ids.length} pembayaran terverifikasi`, 'ok'); return;
    }
    if (a === 'updatePoint' || a === 'updateBooking') {
      const sel = a === 'updatePoint' ? '.check-point:checked' : '.check-booking:checked';
      const ids = [...document.querySelectorAll(sel)].map(x => x.value);
      if (!ids.length) { notify('Pilih minimal satu data', 'err'); return; }
      let total = 0;
      ids.forEach(logId => {
        const l = byId(state.memberLogs, logId);
        const m = byId(state.members, l.mID);
        if (m) { m.point += l.point; total += l.point; }
        l.status = 'Processed';
      });
      save(); render(); notify(`Point bertambah ${fmt(total)}`, 'ok'); return;
    }
    if (a === 'exportReport') {
      const data = ui.reportRows[el.dataset.type];
      if (!data) return;
      const csv = [data.headers, ...data.rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `${el.dataset.type}-${today()}.csv`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('Laporan diekspor', 'ok'); return;
    }
  });

  document.addEventListener('change', function (e) {
    const el = e.target;
    if (el.matches('[data-photo]') && el.files && el.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        ui.tempPhoto = reader.result;
        const img = document.getElementById('photoPreview');
        if (img) { img.src = ui.tempPhoto; img.style.display = 'block'; }
      };
      reader.readAsDataURL(el.files[0]);
      return;
    }
    if (!el.dataset || !el.dataset.action) return;
    if (el.dataset.action === 'rateProperty') { ui.rate.pID = el.value; ui.rate.tkID = ''; ui.rate.rID = ''; render(); }
    if (el.dataset.action === 'rateRoomType') { ui.rate.tkID = el.value; ui.rate.rID = ''; render(); }
    if (el.dataset.action === 'rateRoom') { ui.rate.rID = el.value; render(); }
  });

  document.addEventListener('input', function (e) {
    if (e.target.classList && e.target.classList.contains('otp-input')) {
      if (e.target.value && e.target.nextElementSibling) e.target.nextElementSibling.focus();
    }
  });

  document.addEventListener('submit', function (e) {
    const form = e.target;
    if (!form.dataset || !form.dataset.form) return;
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const f = form.dataset.form;

    if (f === 'login') {
      const u = state.users.find(x => x.uname === d.uname && x.pass === d.upass);
      if (!u) { notify('Username atau password salah', 'err'); return; }
      showOtpModal(u.uname); return;
    }
    if (f === 'property') {
      const photo = ui.tempPhoto || (byId(state.properties, d.id) || {}).photo || '';
      if (d.id) Object.assign(byId(state.properties, d.id), { name: d.name, telp: d.telp, email: d.email, city: d.city, address: d.address, photo });
      else state.properties.push({ id: uid('pr'), name: d.name, telp: d.telp, email: d.email, city: d.city, address: d.address, photo });
      ui.tempPhoto = ''; save(); go('property'); notify('Property disimpan', 'ok'); return;
    }
    if (f === 'roomType') {
      state.roomTypes.push({ id: uid('rt'), prID: d.prID, name: d.name, space: d.space, price: Number(d.price), upgrade: d.upgrade, status: 'Publish' });
      save(); render(); notify('Room type ditambahkan', 'ok'); return;
    }
    if (f === 'room') {
      state.rooms.push({ id: uid('r'), tkID: d.tkID, name: d.name, status: d.status, is_breakfast: d.is_breakfast, is_smoking: d.is_smoking, is_wifi: d.is_wifi, is_fitness: d.is_fitness, is_parking: d.is_parking, adult: d.adult, child: d.child, bed: d.bed, total: d.total, description: d.description, photo: '' });
      save(); render(); notify('Room ditambahkan', 'ok'); return;
    }
    if (f === 'gallery') {
      state.gallery.push({ id: uid('g'), tkID: d.tkID, caption: d.caption, url: ui.tempPhoto || '' }); ui.tempPhoto = '';
      save(); render(); notify('Foto ditambahkan', 'ok'); return;
    }
    if (f === 'facility') {
      state.facilities.push({ id: uid('f'), category: d.category, name: d.name }); save(); render(); notify('Facility ditambahkan', 'ok'); return;
    }
    if (f === 'merchant') {
      const photo = ui.tempPhoto || (byId(state.merchants, d.id) || {}).photo || '';
      if (d.id) Object.assign(byId(state.merchants, d.id), { name: d.name, email: d.email, phone: d.phone, type: d.type, address: d.address, pass: d.pass, photo });
      else state.merchants.push({ id: uid('mc'), name: d.name, email: d.email, phone: d.phone, type: d.type, address: d.address, pass: d.pass, photo });
      ui.tempPhoto = ''; save(); go('merchant'); notify('Merchant disimpan', 'ok'); return;
    }
    if (f === 'voucher') {
      const photo = ui.tempPhoto || (byId(state.vouchers, d.id) || {}).photo || '';
      const payload = { mID: d.mID, title: d.title, minimum: Number(d.minimum), discount: Number(d.discount), discountOrange: Number(d.discountOrange), start: d.start, end: d.end, status: d.status, description: d.description, photo };
      if (d.id) Object.assign(byId(state.vouchers, d.id), payload);
      else state.vouchers.push(Object.assign({ id: uid('v') }, payload));
      ui.tempPhoto = ''; save(); go('voucher'); notify('Voucher disimpan', 'ok'); return;
    }
    if (f === 'user') {
      const photo = ui.tempPhoto || (byId(state.users, d.id) || {}).photo || '';
      if (d.id) Object.assign(byId(state.users, d.id), { name: d.name, uname: d.uname, pass: d.pass, email: d.email, type: d.type, photo });
      else state.users.push({ id: uid('u'), name: d.name, uname: d.uname, pass: d.pass, email: d.email, type: d.type, photo, status: 'Active' });
      ui.tempPhoto = ''; save(); go('user'); notify('User disimpan', 'ok'); return;
    }
    if (f === 'userProperty') {
      const exists = state.userProperties.find(x => x.uID === d.uID && x.propertyID === d.propertyID);
      if (!exists) state.userProperties.push({ id: uid('up'), uID: d.uID, propertyID: d.propertyID });
      save(); go('user'); notify('Property ditugaskan', 'ok'); return;
    }
    if (f === 'bookingKeyword') { ui.filters.bookingKeyword = d; render(); return; }
    if (f === 'bookingDate') { ui.filters.bookingDate = d; render(); return; }
    if (f === 'member') { ui.filters.member = d; render(); return; }
    if (f === 'checkPayment') { ui.filters.checkPayment = d; render(); return; }
    if (f === 'report') { ui.reportFilters[form.dataset.type] = d; render(); return; }
    if (f === 'gantiPass') {
      const u = byId(state.users, state.session.userID);
      if (d.pass_lama !== u.pass) { notify('Password lama tidak sesuai', 'err'); return; }
      if (d.pass_baru !== d.pass_confirm) { notify('Konfirmasi password tidak cocok', 'err'); return; }
      u.pass = d.pass_baru; save(); form.reset(); notify('Password berhasil diubah', 'ok'); return;
    }
  });

  window.addEventListener('hashchange', render);
  window.addEventListener('resize', () => { if (state.session && getRoute().menu === 'dashboard') drawBookingChart(); });
  render();
})();
