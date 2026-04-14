/* ============================================================
   GROUNDNUT TRADE LEDGER - Application Logic
   ============================================================ */

'use strict';

// ===== STATE =====
let transactions  = [];
let currentUser   = null; // { role, name, username }
let deleteTargetId = null;
let editingId      = null;

// ===== LOCAL STORAGE KEYS =====
const STORAGE_KEY = 'groundnut_ledger_v1';
const USERS_KEY   = 'groundnut_users_v1';

// ===== USER ACCOUNT HELPERS =====
function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
}
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function findUser(username, role) {
  return loadUsers().find(u => u.username.toLowerCase() === username.toLowerCase() && u.role === role);
}

// ===== TRANSACTION STORAGE =====
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); }
function loadData() {
  try { transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { transactions = []; }
  if (!transactions.length) seedSampleData();
}
function seedSampleData() {
  const today = new Date();
  const d = (n) => { const x = new Date(today); x.setDate(x.getDate() - n); return x.toISOString().split('T')[0]; };
  transactions = [
    { id: uid(), date: d(0), customer: 'Ramesh Kumar', type: 'Buying',  rate: 88, weight: 150, total: 13200, notes: 'Morning batch' },
    { id: uid(), date: d(0), customer: 'Suresh Patel', type: 'Selling', rate: 95, weight: 120, total: 11400, notes: '' },
    { id: uid(), date: d(1), customer: 'Ramesh Kumar', type: 'Selling', rate: 92, weight: 80,  total: 7360,  notes: 'Premium quality' },
    { id: uid(), date: d(2), customer: 'Mahesh Yadav', type: 'Buying',  rate: 85, weight: 200, total: 17000, notes: '' },
    { id: uid(), date: d(2), customer: 'Suresh Patel', type: 'Buying',  rate: 86, weight: 100, total: 8600,  notes: 'Afternoon batch' },
    { id: uid(), date: d(3), customer: 'Anita Sharma', type: 'Selling', rate: 94, weight: 60,  total: 5640,  notes: 'Special order' },
  ];
  saveData();
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ===== ROLE TAB (Businessman / Customer) =====
function switchLoginTab(tab) {
  ['business','customer'].forEach(r => {
    document.getElementById(r + 'Tab').classList.toggle('active', tab === r);
    document.getElementById(r === 'business' ? 'businessLogin' : 'customerLogin').classList.toggle('active', tab === r);
  });
  hideLoginError();
}

// ===== SIGN IN / SIGN UP SUB-TABS =====
function switchBizTab(mode) {
  document.getElementById('bizSignInTab').classList.toggle('active', mode === 'signin');
  document.getElementById('bizSignUpTab').classList.toggle('active', mode === 'signup');
  document.getElementById('bizSignInForm').classList.toggle('hidden', mode !== 'signin');
  document.getElementById('bizSignUpForm').classList.toggle('hidden', mode !== 'signup');
  hideLoginError();
}
function switchCustTab(mode) {
  document.getElementById('custSignInTab').classList.toggle('active', mode === 'signin');
  document.getElementById('custSignUpTab').classList.toggle('active', mode === 'signup');
  document.getElementById('custSignInForm').classList.toggle('hidden', mode !== 'signin');
  document.getElementById('custSignUpForm').classList.toggle('hidden', mode !== 'signup');
  hideLoginError();
}

// ===== PASSWORD TOGGLE =====
function togglePw(fieldId, btn) {
  const inp = document.getElementById(fieldId);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '\uD83D\uDC41\uFE0F' : '\uD83D\uDE48';
}

// ===== SIGN UP =====
function registerBusiness() {
  const name     = val('bizRegName');
  const username = val('bizRegUsername');
  const password = document.getElementById('bizRegPassword').value;
  const confirm  = document.getElementById('bizRegConfirm').value;
  if (!name)            { showLoginError('\u26A0\uFE0F Please enter your business name.'); return; }
  if (!username)        { showLoginError('\u26A0\uFE0F Please choose a username.'); return; }
  if (password.length < 4) { showLoginError('\u26A0\uFE0F Password must be at least 4 characters.'); return; }
  if (password !== confirm) { showLoginError('\u26A0\uFE0F Passwords do not match.'); return; }
  const users = loadUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.role === 'business')) {
    showLoginError('\u274C Username already taken. Choose another.'); return;
  }
  users.push({ role: 'business', name, username, password });
  saveUsers(users);
  showLoginSuccess('\u2705 Business account created! Please Sign In.');
  setTimeout(() => switchBizTab('signin'), 1800);
}

function registerCustomer() {
  const name     = val('custRegName');
  const username = val('custRegUsername');
  const mobile   = val('custRegMobile');
  const password = document.getElementById('custRegPassword').value;
  const confirm  = document.getElementById('custRegConfirm').value;
  if (!name)            { showLoginError('\u26A0\uFE0F Please enter your full name.'); return; }
  if (!username)        { showLoginError('\u26A0\uFE0F Please choose a username.'); return; }
  if (password.length < 4) { showLoginError('\u26A0\uFE0F Password must be at least 4 characters.'); return; }
  if (password !== confirm) { showLoginError('\u26A0\uFE0F Passwords do not match.'); return; }
  const users = loadUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.role === 'customer')) {
    showLoginError('\u274C Username already taken. Choose another.'); return;
  }
  users.push({ role: 'customer', name, username, password, mobile });
  saveUsers(users);
  showLoginSuccess('\u2705 Account created! Please Sign In.');
  setTimeout(() => switchCustTab('signin'), 1800);
}

// ===== SIGN IN =====
function loginBusiness() {
  const username = val('bizUsername');
  const password = document.getElementById('bizPassword').value;
  if (!username || !password) { showLoginError('\u26A0\uFE0F Enter username and password.'); return; }
  const user = findUser(username, 'business');
  if (!user || user.password !== password) { showLoginError('\u274C Invalid username or password.'); return; }
  currentUser = { role: 'business', name: user.name, username };
  showScreen('businessDashboard');
  initBusinessDashboard();
}

function loginCustomer() {
  const username = val('custUsername');
  const password = document.getElementById('custPassword').value;
  if (!username || !password) { showLoginError('\u26A0\uFE0F Enter username and password.'); return; }
  const user = findUser(username, 'customer');
  if (!user || user.password !== password) { showLoginError('\u274C Invalid username or password.'); return; }
  currentUser = { role: 'customer', name: user.name, username };
  showScreen('customerDashboard');
  initCustomerDashboard();
}

// ===== AUTH MESSAGES =====
let authMsgTimer;
function showLoginError(msg) {
  clearTimeout(authMsgTimer);
  const el = document.getElementById('loginError');
  el.textContent = msg;
  el.style.cssText = '';                // reset to red (default CSS)
  el.classList.remove('hidden');
  authMsgTimer = setTimeout(() => el.classList.add('hidden'), 4500);
}
function showLoginSuccess(msg) {
  clearTimeout(authMsgTimer);
  const el = document.getElementById('loginError');
  el.textContent = msg;
  el.style.cssText = 'background:rgba(34,197,94,0.08);border-color:rgba(34,197,94,0.4);color:#4ade80;';
  el.classList.remove('hidden');
  authMsgTimer = setTimeout(() => el.classList.add('hidden'), 4500);
}
function hideLoginError() { document.getElementById('loginError').classList.add('hidden'); }

// ===== LOGOUT =====
function logout() {
  currentUser = null; editingId = null;
  clearForm();
  showScreen('loginScreen');
}

// ===== SCREEN SYSTEM =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ===== BUSINESS DASHBOARD INIT =====
function initBusinessDashboard() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('entryDate').value = today;
  document.getElementById('todayDate').textContent = formatDate(today);
  if (currentUser) {
    const el = document.getElementById('bizLoggedInUser');
    if (el) el.textContent = '\uD83D\uDC64 ' + currentUser.name;
  }
  updateCustomerDropdowns();
  renderTable();
  updateStats();
}

function updateRateLabel() {
  const type = document.getElementById('entryType').value;
  document.getElementById('rateLabel').textContent =
    type === 'Buying' ? '\uD83D\uDCB5 Buying Rate (per kg)' : '\uD83D\uDCB5 Selling Rate (per kg)';
}

function calcTotal() {
  const rate   = parseFloat(document.getElementById('entryRate').value)   || 0;
  const weight = parseFloat(document.getElementById('entryWeight').value) || 0;
  document.getElementById('calcDisplay').textContent = '\u20B9 ' + fmt(rate * weight);
}

function addTransaction() {
  const date     = document.getElementById('entryDate').value;
  const customer = val('entryCustomer');
  const type     = document.getElementById('entryType').value;
  const rate     = parseFloat(document.getElementById('entryRate').value);
  const weight   = parseFloat(document.getElementById('entryWeight').value);
  const notes    = val('entryNotes');

  if (!date)          { showToast('Please select a date.', true); return; }
  if (!customer)      { showToast('Please enter customer name.', true); return; }
  if (!rate || rate <= 0)   { showToast('Please enter a valid rate.', true); return; }
  if (!weight || weight <= 0) { showToast('Please enter a valid weight.', true); return; }

  const total = +(rate * weight).toFixed(2);
  if (editingId) {
    const idx = transactions.findIndex(t => t.id === editingId);
    if (idx !== -1) transactions[idx] = { id: editingId, date, customer, type, rate, weight, total, notes };
    editingId = null;
    document.querySelector('.btn-add span').textContent = '\u2705 Add Transaction';
    showToast('\u270F\uFE0F Transaction updated!');
  } else {
    transactions.unshift({ id: uid(), date, customer, type, rate, weight, total, notes });
    showToast('\u2705 Transaction added!');
  }
  saveData(); clearForm(); updateCustomerDropdowns(); renderTable(); updateStats();
}

function clearForm() {
  document.getElementById('entryDate').value     = new Date().toISOString().split('T')[0];
  document.getElementById('entryCustomer').value = '';
  document.getElementById('entryType').value     = 'Buying';
  document.getElementById('entryRate').value     = '';
  document.getElementById('entryWeight').value   = '';
  document.getElementById('entryNotes').value    = '';
  document.getElementById('calcDisplay').textContent = '\u20B9 0.00';
  document.getElementById('rateLabel').textContent = '\uD83D\uDCB5 Buying Rate (per kg)';
  editingId = null;
  document.querySelector('.btn-add span').textContent = '\u2705 Add Transaction';
}

function applyTodayRates() {
  const buyRate  = document.getElementById('todayBuyRate').value;
  const sellRate = document.getElementById('todaySellRate').value;
  const type     = document.getElementById('entryType').value;
  if (type === 'Buying' && buyRate)   document.getElementById('entryRate').value = buyRate;
  if (type === 'Selling' && sellRate) document.getElementById('entryRate').value = sellRate;
  calcTotal(); showToast('\uD83D\uDCCA Rate applied!');
}

// ===== TABLE =====
function getFilteredTransactions() {
  const search   = (document.getElementById('searchFilter')?.value || '').toLowerCase();
  const typeF    = document.getElementById('typeFilter')?.value    || '';
  const custF    = document.getElementById('customerFilter')?.value || '';
  const dateFrom = document.getElementById('dateFromFilter')?.value || '';
  const dateTo   = document.getElementById('dateToFilter')?.value   || '';
  return transactions.filter(t => {
    if (search   && !t.customer.toLowerCase().includes(search)) return false;
    if (typeF    && t.type !== typeF)                            return false;
    if (custF    && t.customer !== custF)                        return false;
    if (dateFrom && t.date < dateFrom)                           return false;
    if (dateTo   && t.date > dateTo)                             return false;
    return true;
  });
}

function renderTable() {
  const filtered = getFilteredTransactions();
  const tbody = document.getElementById('tableBody');
  document.getElementById('recordCount').textContent = filtered.length + ' records';
  if (!filtered.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="9">No transactions match your filters. \uD83E\uDD5C</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map((t, i) => `
    <tr>
      <td class="row-num">${i + 1}</td>
      <td>${formatDate(t.date)}</td>
      <td style="font-weight:600;">${esc(t.customer)}</td>
      <td><span class="badge ${t.type === 'Buying' ? 'badge-buy' : 'badge-sell'}">${t.type === 'Buying' ? '\uD83D\uDCE5' : '\uD83D\uDCE4'} ${t.type}</span></td>
      <td>\u20B9${fmt(t.rate)}</td>
      <td>${fmt(t.weight)} kg</td>
      <td class="amount-cell">\u20B9${fmt(t.total)}</td>
      <td style="color:var(--text-muted);font-size:12px;">${esc(t.notes || '\u2014')}</td>
      <td>
        <button class="action-btn btn-edit-row" onclick="editTransaction('${t.id}')">&#x270F;&#xFE0F; Edit</button>
        <button class="action-btn btn-del-row"  onclick="requestDelete('${t.id}')">&#x1F5D1;&#xFE0F;</button>
      </td>
    </tr>`).join('');
}

function editTransaction(id) {
  const t = transactions.find(x => x.id === id);
  if (!t) return;
  editingId = id;
  document.getElementById('entryDate').value     = t.date;
  document.getElementById('entryCustomer').value = t.customer;
  document.getElementById('entryType').value     = t.type;
  document.getElementById('entryRate').value     = t.rate;
  document.getElementById('entryWeight').value   = t.weight;
  document.getElementById('entryNotes').value    = t.notes;
  calcTotal(); updateRateLabel();
  document.querySelector('.btn-add span').textContent = '\uD83D\uDCBE Update Transaction';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function requestDelete(id) {
  deleteTargetId = id;
  document.getElementById('confirmOverlay').classList.remove('hidden');
}
function confirmDelete() {
  if (deleteTargetId) {
    transactions = transactions.filter(t => t.id !== deleteTargetId);
    saveData(); renderTable(); updateStats(); updateCustomerDropdowns();
    showToast('\uD83D\uDDD1\uFE0F Transaction deleted.');
  }
  cancelDelete();
}
function cancelDelete() {
  deleteTargetId = null;
  document.getElementById('confirmOverlay').classList.add('hidden');
}

// ===== STATS =====
function updateStats() {
  const buy     = transactions.filter(t => t.type === 'Buying').reduce((s, t) => s + t.total, 0);
  const sell    = transactions.filter(t => t.type === 'Selling').reduce((s, t) => s + t.total, 0);
  const profit  = sell - buy;
  const custCnt = new Set(transactions.map(t => t.customer)).size;
  document.getElementById('statTotalBuy').textContent  = '\u20B9' + fmtLakh(buy);
  document.getElementById('statTotalSell').textContent = '\u20B9' + fmtLakh(sell);
  document.getElementById('statProfit').textContent    = (profit >= 0 ? '\u20B9' : '-\u20B9') + fmtLakh(Math.abs(profit));
  document.getElementById('statProfit').style.color    = profit >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('statCustomers').textContent = custCnt;
}

function updateCustomerDropdowns() {
  const names = [...new Set(transactions.map(t => t.customer))].sort();
  const dl1 = document.getElementById('existingCustomers');
  if (dl1) dl1.innerHTML = names.map(n => `<option value="${esc(n)}"/>`).join('');
  const dl2 = document.getElementById('customerList');
  if (dl2) dl2.innerHTML = names.map(n => `<option value="${esc(n)}"/>`).join('');
  const sel = document.getElementById('customerFilter');
  if (sel) {
    const cur = sel.value;
    sel.innerHTML = '<option value="">All Customers</option>' +
      names.map(n => `<option value="${esc(n)}"${n===cur?' selected':''}>${esc(n)}</option>`).join('');
  }
}

// ===== CUSTOMER DASHBOARD =====
function initCustomerDashboard() {
  const name = currentUser.name;
  document.getElementById('customerWelcome').textContent = 'Welcome, ' + name;
  document.getElementById('customerDateBadge').textContent = formatDate(new Date().toISOString().split('T')[0]);
  const myTx  = transactions.filter(t => t.customer.toLowerCase() === name.toLowerCase());
  const buy   = myTx.filter(t => t.type === 'Buying').reduce((s, t) => s + t.total, 0);
  const sell  = myTx.filter(t => t.type === 'Selling').reduce((s, t) => s + t.total, 0);
  const wt    = myTx.reduce((s, t) => s + t.weight, 0);
  document.getElementById('custStatBuy').textContent    = '\u20B9' + fmtLakh(buy);
  document.getElementById('custStatSell').textContent   = '\u20B9' + fmtLakh(sell);
  document.getElementById('custStatWeight').textContent = fmt(wt) + ' kg';
  document.getElementById('custStatCount').textContent  = myTx.length;
  const tbody = document.getElementById('customerTableBody');
  if (!myTx.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No transactions found for "${esc(name)}".</td></tr>`;
    return;
  }
  tbody.innerHTML = [...myTx].sort((a, b) => b.date.localeCompare(a.date)).map((t, i) => `
    <tr>
      <td class="row-num">${i + 1}</td>
      <td>${formatDate(t.date)}</td>
      <td><span class="badge ${t.type === 'Buying' ? 'badge-buy' : 'badge-sell'}">${t.type === 'Buying' ? '\uD83D\uDCE5' : '\uD83D\uDCE4'} ${t.type}</span></td>
      <td>\u20B9${fmt(t.rate)}</td>
      <td>${fmt(t.weight)} kg</td>
      <td class="amount-cell">\u20B9${fmt(t.total)}</td>
      <td style="color:var(--text-muted);font-size:12px;">${esc(t.notes || '\u2014')}</td>
    </tr>`).join('');
}

// ===== CSV EXPORT =====
function exportToCSV()     { csvDownload('Groundnut_Ledger_All', getFilteredTransactions(), true); }
function exportCustomerCSV() {
  const name = currentUser.name;
  csvDownload('Statement_' + name, transactions.filter(t => t.customer.toLowerCase() === name.toLowerCase()), false);
}
function csvDownload(fn, rows, inclCust) {
  const h = inclCust
    ? ['#','Date','Customer','Type','Rate (INR/kg)','Weight (kg)','Total Amount (INR)','Notes']
    : ['#','Date','Type','Rate (INR/kg)','Weight (kg)','Total Amount (INR)','Notes'];
  const lines = [h.join(',')];
  rows.forEach((t, i) => {
    const r = inclCust
      ? [i+1, t.date, t.customer, t.type, t.rate, t.weight, t.total, t.notes||'']
      : [i+1, t.date, t.type, t.rate, t.weight, t.total, t.notes||''];
    lines.push(r.map(v => `"${v}"`).join(','));
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
  a.download = fn + '.csv'; a.click();
  showToast('\uD83D\uDCE5 CSV downloaded!');
}

// ===== TOAST =====
let toastTimer;
function showToast(msg, isError = false) {
  clearTimeout(toastTimer);
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (isError ? ' error' : '');
  t.classList.remove('hidden');
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}

// ===== FORMATTERS =====
function val(id) { return (document.getElementById(id)?.value || '').trim(); }
function fmt(n) {
  return parseFloat(n||0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtLakh(n) {
  if (n >= 1e7) return (n/1e7).toFixed(2) + 'Cr';
  if (n >= 1e5) return (n/1e5).toFixed(2) + 'L';
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
function formatDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m-1]} ${y}`;
}
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') cancelDelete();
});

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateCustomerDropdowns();
});
