<?php
/**
 * instructor.php
 *
 * Instructor-facing dashboard.
 * - Session-guarded (must be logged in via instructor_login.php)
 * - Manual borrow entry (walk-in / Others field for non-registered equipment)
 * - Own borrow-history view
 */

session_start();

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if (empty($_SESSION['instructor_logged_in'])) {
    header('Location: login.php');
    exit;
}

$instructorName = htmlspecialchars($_SESSION['instructor_name'] ?? 'Instructor');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>EQUILAB — Instructor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <style>
    /* ── Reset & Tokens ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:         #F8F6F2;
      --surface:    #FFFFFF;
      --surface-2:  #F0EDE7;
      --border:     #E4E0D8;
      --accent:     #1B4F72;   /* deep navy for instructor */
      --accent-lt:  #2E86C1;
      --accent-soft:#D6EAF8;
      --gold:       #B7860B;
      --gold-soft:  #FEF9E7;
      --danger:     #C0392B;
      --danger-soft:#FDECEA;
      --text-1:     #1A1A18;
      --text-2:     #5C5C52;
      --text-3:     #9C9C8C;
      --radius:     10px;
      --radius-lg:  18px;
      --shadow:     0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
      --shadow-md:  0 2px 12px rgba(0,0,0,.09), 0 8px 28px rgba(0,0,0,.06);
      --font:       'DM Sans', sans-serif;
      --mono:       'DM Mono', monospace;
      --display:    'Playfair Display', serif;
      --sidebar-w:  240px;
    }

    body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text-1);
      min-height: 100vh;
      font-size: 14px;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: var(--sidebar-w);
      height: 100vh;
      background: var(--accent);
      position: fixed;
      top: 0; left: 0;
      display: flex;
      flex-direction: column;
      z-index: 100;
    }

    .sidebar .logo {
      padding: 28px 24px 22px;
      border-bottom: 1px solid rgba(255,255,255,0.12);
    }

    .sidebar .logo h2 {
      font-family: var(--display);
      font-size: 14px;
      color: #fff;
      letter-spacing: .03em;
    }

    .sidebar .logo p {
      font-size: 11px;
      color: rgba(255,255,255,0.6);
      margin-top: 3px;
      font-weight: 300;
    }

    .sidebar nav {
      flex: 1;
      padding: 18px 12px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: var(--radius);
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 400;
      cursor: pointer;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
      transition: background .18s, color .18s;
    }

    .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }

    .nav-item.active {
      background: rgba(255,255,255,0.18);
      color: #fff;
      font-weight: 500;
    }

    .sidebar .logout {
      padding: 12px;
      border-top: 1px solid rgba(255,255,255,0.12);
    }

    .sidebar .logout .nav-item { color: rgba(255,255,255,0.55); }
    .sidebar .logout .nav-item:hover { color: #fff; background: rgba(255,255,255,0.1); }

    /* ── Main ── */
    .main {
      margin-left: var(--sidebar-w);
      padding: 36px 40px;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 28px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }

    .page-header h1 {
      font-family: var(--display);
      font-size: 26px;
      color: var(--accent);
      letter-spacing: -.01em;
    }

    .page-header p {
      font-size: 13px;
      color: var(--text-3);
      margin-top: 2px;
    }

    /* ── Sections ── */
    .section { display: none; }
    .section.active { display: block; }

    /* ── Cards ── */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px 28px;
      box-shadow: var(--shadow);
      margin-bottom: 20px;
    }

    .card h3 {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-1);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* ── Form elements ── */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 20px;
    }

    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-group.span-2 { grid-column: 1 / -1; }

    label.field-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .07em;
      text-transform: uppercase;
      color: var(--text-3);
    }

    input[type="text"],
    input[type="number"],
    input[type="date"],
    select,
    textarea {
      font-family: var(--font);
      font-size: 13.5px;
      padding: 9px 13px;
      border: 1.5px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg);
      color: var(--text-1);
      outline: none;
      width: 100%;
      transition: border-color .18s, box-shadow .18s;
    }

    input:focus, select:focus, textarea:focus {
      border-color: var(--accent-lt);
      box-shadow: 0 0 0 3px rgba(46,134,193,0.12);
      background: var(--surface);
    }

    textarea { resize: vertical; min-height: 72px; }

    /* ── Equipment table in form ── */
    .eq-table-wrap {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      margin-top: 8px;
    }

    .eq-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .eq-table thead th {
      background: var(--surface-2);
      padding: 9px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: var(--text-3);
      border-bottom: 1px solid var(--border);
    }

    .eq-table tbody td {
      padding: 9px 12px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    .eq-table tbody tr:last-child td { border-bottom: none; }

    .eq-table input[type="text"],
    .eq-table input[type="number"] {
      padding: 6px 9px;
      font-size: 13px;
    }

    /* ── Buttons ── */
    .btn {
      font-family: var(--font);
      font-size: 13px;
      font-weight: 500;
      padding: 9px 18px;
      border-radius: var(--radius);
      border: 1.5px solid var(--border);
      background: var(--surface);
      color: var(--text-1);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background .18s, border-color .18s, color .18s, box-shadow .18s;
      white-space: nowrap;
    }

    .btn:hover { background: var(--surface-2); }

    .btn-primary {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }

    .btn-primary:hover { background: #154360; border-color: #154360; color: #fff; }

    .btn-danger {
      background: var(--danger-soft);
      color: var(--danger);
      border-color: #f0c0bc;
    }

    .btn-danger:hover { background: var(--danger); color: #fff; }

    .btn-sm { padding: 5px 11px; font-size: 12px; }

    .btn-add-row {
      background: var(--accent-soft);
      color: var(--accent);
      border-color: #a8cce8;
      margin-top: 10px;
    }

    .btn-add-row:hover { background: var(--accent); color: #fff; }

    /* ── History list ── */
    .history-entry {
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent-lt);
      border-radius: var(--radius-lg);
      padding: 16px 20px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: box-shadow .18s;
    }

    .history-entry:hover { box-shadow: var(--shadow); }

    .history-entry .he-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6px;
    }

    .history-entry .he-name {
      font-weight: 600;
      font-size: 14px;
    }

    .he-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: .05em;
    }

    .he-badge.accepted  { background: #d4edda; color: #2e7d32; }
    .he-badge.rejected  { background: var(--danger-soft); color: var(--danger); }
    .he-badge.pending   { background: var(--gold-soft); color: var(--gold); }
    .he-badge.returned  { background: var(--accent-soft); color: var(--accent); }

    .he-detail {
      font-size: 12.5px;
      color: var(--text-2);
      line-height: 1.6;
    }

    /* ── Confirmation overlay ── */
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(26,26,24,.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1200;
      padding: 24px;
      opacity: 0;
      visibility: hidden;
      transition: opacity .28s, visibility .28s;
    }

    .overlay.open {
      opacity: 1;
      visibility: visible;
    }

    .overlay-panel {
      background: var(--surface);
      border-radius: var(--radius-lg);
      padding: 32px 36px;
      width: min(640px, 100%);
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border);
      transform: translateY(20px);
      transition: transform .3s cubic-bezier(.4,0,.2,1);
    }

    .overlay.open .overlay-panel { transform: translateY(0); }

    .overlay-panel h2 {
      font-family: var(--display);
      font-size: 20px;
      color: var(--accent);
      margin-bottom: 6px;
    }

    .overlay-panel p.sub {
      font-size: 13px;
      color: var(--text-3);
      margin-bottom: 20px;
    }

    /* ── Receipt table ── */
    .receipt-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 20px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .receipt-table thead th {
      background: var(--accent);
      color: #fff;
      padding: 9px 13px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .06em;
    }

    .receipt-table tbody td {
      padding: 9px 13px;
      border-bottom: 1px solid var(--border);
    }

    .receipt-table tbody tr:last-child td { border-bottom: none; }

    .receipt-table tbody tr:nth-child(even) { background: var(--bg); }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

    /* ── Animations ── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: none; }
    }

    .section.active > * { animation: fadeUp .22s ease both; }

    /* ── Toast ── */
    #toast {
      position: fixed;
      bottom: 28px;
      right: 28px;
      background: var(--text-1);
      color: #fff;
      font-size: 13px;
      padding: 12px 20px;
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      z-index: 9999;
      opacity: 0;
      transform: translateY(12px);
      transition: opacity .25s, transform .25s;
      pointer-events: none;
    }

    #toast.show { opacity: 1; transform: none; }
    #toast.success { background: #1B5E20; }
    #toast.error   { background: var(--danger); }

    /* ── Others text row ── */
    .others-note {
      font-size: 11.5px;
      color: var(--text-3);
      font-style: italic;
      margin-top: 2px;
    }
  </style>
</head>
<body>

<!-- ── SIDEBAR ── -->
<div class="sidebar">
  <div class="logo">
    <h2>⬡ EQUILAB</h2>
    <p>Instructor Portal</p>
  </div>
  <nav>
    <button class="nav-item active" data-section="borrowSection">
      <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
      New Borrow Entry
    </button>
    <button class="nav-item" data-section="historySection">
      <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
      Borrow History
    </button>
  </nav>
  <div class="logout">
    <a href="logout.php" class="nav-item">
      <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/></svg>
      Log Out
    </a>
  </div>
</div>

<!-- ── MAIN ── -->
<div class="main">

  <!-- ═══ NEW BORROW ENTRY ═══ -->
  <div id="borrowSection" class="section active">
    <div class="page-header">
      <div>
        <h1>New Borrow Entry</h1>
        <p>Manual walk-in equipment request — <?= $instructorName ?></p>
      </div>
      <span id="todayDate" style="font-size:13px;color:var(--text-3);font-family:var(--mono);"></span>
    </div>

    <form id="borrowForm" novalidate>
      <!-- Borrower info -->
      <div class="card">
        <h3>
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          Borrower Information
        </h3>
        <div class="form-grid">
          <div class="form-group">
            <label class="field-label">Last Name <span style="color:var(--danger)">*</span></label>
            <input type="text" id="lastName" placeholder="e.g. DELA CRUZ" required/>
          </div>
          <div class="form-group">
            <label class="field-label">First Name <span style="color:var(--danger)">*</span></label>
            <input type="text" id="firstName" placeholder="e.g. JUAN" required/>
          </div>
          <div class="form-group">
            <label class="field-label">Middle Initial <span style="color:var(--danger)">*</span></label>
            <input type="text" id="middleInitial" placeholder="A" maxlength="1"/>
          </div>
          <div class="form-group">
            <label class="field-label">Student ID <span style="color:var(--danger)">*</span></label>
            <input type="text" id="studentID" placeholder="e.g. 2021-00001" required/>
          </div>
          <div class="form-group">
            <label class="field-label">Subject Code <span style="color:var(--danger)">*</span></label>
            <input type="text" id="subjectCode" placeholder="e.g. PHYS 301L" required/>
          </div>
          <div class="form-group">
            <label class="field-label">Usage Date <span style="color:var(--danger)">*</span></label>
            <input type="date" id="usageDate" required/>
          </div>
          <div class="form-group">
            <label class="field-label">Room <span style="color:var(--danger)">*</span></label>
            <select id="roomSelect" required>
              <option value="" disabled selected>Select Room</option>
            </select>
          </div>
          <div class="form-group">
            <label class="field-label">Instructor's Name</label>
            <input type="text" id="instructorDisplay" value="<?= $instructorName ?>" readonly
              style="background:var(--surface-2);color:var(--text-2);cursor:default;"/>
          </div>
        </div>
      </div>

      <!-- Equipment list -->
      <div class="card">
        <h3>
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          Equipment / Materials
        </h3>
        <p style="font-size:12.5px;color:var(--text-3);margin-bottom:14px;">
          Select from the registered inventory <strong>or</strong> type a custom name under "Others" for items not in the system.
        </p>

        <div class="eq-table-wrap">
          <table class="eq-table">
            <thead>
              <tr>
                <th>Equipment / Material</th>
                <th style="width:90px;">Qty</th>
                <th style="width:130px;">Source</th>
                <th style="width:60px;"></th>
              </tr>
            </thead>
            <tbody id="eqRows">
              <!-- rows injected by JS -->
            </tbody>
          </table>
        </div>

        <button type="button" class="btn btn-add-row" id="addRowBtn">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Add row
        </button>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button type="button" class="btn" id="clearFormBtn">Clear</button>
        <button type="submit" class="btn btn-primary" id="submitBtn">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Preview & Submit
        </button>
      </div>
    </form>
  </div><!-- /borrowSection -->

  <!-- ═══ HISTORY ═══ -->
  <div id="historySection" class="section">
    <div class="page-header">
      <div>
        <h1>Borrow History</h1>
        <p>Requests submitted by <?= $instructorName ?></p>
      </div>
      <button class="btn" id="refreshHistoryBtn">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Refresh
      </button>
    </div>

    <div id="historyList">
      <p style="color:var(--text-3);font-style:italic;">Loading history…</p>
    </div>
  </div>

</div><!-- /main -->

<!-- ═══ CONFIRMATION OVERLAY ═══ -->
<div id="confirmOverlay" class="overlay">
  <div class="overlay-panel">
    <h2>Review & Confirm</h2>
    <p class="sub">Please verify the details before submitting the borrow request.</p>

    <div id="confirmDetails"></div>

    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
      <button class="btn" id="backBtn">← Edit</button>
      <button class="btn btn-primary" id="confirmSubmitBtn">
        Confirm &amp; Submit
      </button>
    </div>
  </div>
</div>

<!-- ═══ SUCCESS RECEIPT OVERLAY ═══ -->
<div id="receiptOverlay" class="overlay">
  <div class="overlay-panel">
    <div style="text-align:center;margin-bottom:20px;">
      <svg width="48" height="48" fill="none" stroke="#1B4F72" stroke-width="1.6" viewBox="0 0 24 24" style="display:block;margin:0 auto 10px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <h2 style="font-family:var(--display);font-size:22px;color:var(--accent);">Request Submitted</h2>
      <p style="color:var(--text-3);font-size:13px;margin-top:4px;">Please take a photo of this receipt for your records.</p>
    </div>

    <div id="receiptContent"></div>

    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">
      <button class="btn" id="printReceiptBtn">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Print
      </button>
      <button class="btn btn-primary" id="closeReceiptBtn">Done</button>
    </div>
  </div>
</div>

<!-- ── Toast ── -->
<div id="toast"></div>

<script>
/* ═══════════════════════════════════════════════
   Instructor Dashboard JS
   ═══════════════════════════════════════════════ */

const INSTRUCTOR_NAME = <?= json_encode($instructorName) ?>;

/* ── Navigation ── */
document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(btn.dataset.section).classList.add('active');
    btn.classList.add('active');

    if (btn.dataset.section === 'historySection') loadHistory();
  });
});

/* ── Today's date ── */
(function () {
  const d = new Date();
  document.getElementById('todayDate').textContent = d.toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById('usageDate').value = d.toISOString().slice(0, 10);
})();

/* ── Load rooms ── */
fetch('get_rooms.php')
  .then(r => r.json())
  .then(rooms => {
    const sel = document.getElementById('roomSelect');
    rooms.forEach(room => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = room.room_number;
      sel.appendChild(opt);
    });
  });

/* ── Equipment rows ── */
let inventoryData = [];
let rowCount = 0;

fetch('get_equipment.php')
  .then(r => r.json())
  .then(data => {
    inventoryData = data;
    addRow(); // start with one row
  });

function addRow() {
  rowCount++;
  const idx = rowCount;
  const tbody = document.getElementById('eqRows');
  const tr = document.createElement('tr');
  tr.id = 'eqRow-' + idx;
  tr.innerHTML = `
    <td>
      <select class="eq-source" data-idx="${idx}" onchange="onSourceChange(${idx})">
        <option value="inventory">From Inventory</option>
        <option value="others">Others (manual)</option>
      </select>
      <div class="eq-name-wrap" style="margin-top:6px;">
        <select class="eq-inv-sel" data-idx="${idx}">
          <option value="" disabled selected>Select equipment…</option>
          ${inventoryData.map(e => `<option value="${e.equipment_name}" data-avail="${e.available}">${e.equipment_name} (avail: ${e.available})</option>`).join('')}
        </select>
        <input type="text" class="eq-others-input" data-idx="${idx}" placeholder="Describe item (brand, model, etc.)" style="display:none;margin-top:6px;"/>
        <p class="others-note" id="othersNote-${idx}" style="display:none;">
          Items entered here are not deducted from inventory — they are manually provided by the instructor.
        </p>
      </div>
    </td>
    <td>
      <input type="number" class="eq-qty" data-idx="${idx}" value="1" min="1" style="width:70px;"/>
    </td>
    <td>
      <span class="eq-source-label" id="srcLabel-${idx}" style="font-size:12px;color:var(--text-3);">Inventory</span>
    </td>
    <td>
      ${idx > 1 ? `<button type="button" class="btn btn-danger btn-sm" onclick="removeRow(${idx})">✕</button>` : ''}
    </td>
  `;
  tbody.appendChild(tr);
}

function onSourceChange(idx) {
  const src = document.querySelector(`.eq-source[data-idx="${idx}"]`).value;
  const invSel   = document.querySelector(`.eq-inv-sel[data-idx="${idx}"]`);
  const otherInp = document.querySelector(`.eq-others-input[data-idx="${idx}"]`);
  const othNote  = document.getElementById('othersNote-' + idx);
  const srcLabel = document.getElementById('srcLabel-' + idx);

  if (src === 'others') {
    invSel.style.display    = 'none';
    otherInp.style.display  = '';
    othNote.style.display   = '';
    srcLabel.textContent    = 'Manual / Others';
    srcLabel.style.color    = 'var(--gold)';
  } else {
    invSel.style.display    = '';
    otherInp.style.display  = 'none';
    othNote.style.display   = 'none';
    srcLabel.textContent    = 'Inventory';
    srcLabel.style.color    = 'var(--text-3)';
  }
}

function removeRow(idx) {
  const row = document.getElementById('eqRow-' + idx);
  if (row) row.remove();
}

document.getElementById('addRowBtn').addEventListener('click', addRow);

document.getElementById('clearFormBtn').addEventListener('click', () => {
  if (!confirm('Clear the form?')) return;
  document.getElementById('lastName').value = '';
  document.getElementById('firstName').value = '';
  document.getElementById('middleInitial').value = '';
  document.getElementById('studentID').value = '';
  document.getElementById('subjectCode').value = '';
  document.getElementById('roomSelect').value = '';
  document.getElementById('eqRows').innerHTML = '';
  rowCount = 0;
  addRow();
});

/* ── Collect form data ── */
function collectFormData() {
  const last = document.getElementById('lastName').value.trim().toUpperCase();
  const first = document.getElementById('firstName').value.trim().toUpperCase();
  const mi = document.getElementById('middleInitial').value.trim().toUpperCase();

  if (!last || !first) return null;

  const borrowerName = `${last}, ${first}${mi ? ' ' + mi + '.' : ''}`;

  const equipmentList = [];
  let valid = true;

  document.querySelectorAll('#eqRows tr').forEach(tr => {
    const idx  = tr.id.replace('eqRow-', '');
    const src  = tr.querySelector('.eq-source')?.value;
    const qty  = parseInt(tr.querySelector('.eq-qty')?.value) || 1;

    let name = '';
    let source = 'inventory';

    if (src === 'others') {
      name = tr.querySelector('.eq-others-input')?.value.trim();
      source = 'others';
    } else {
      name = tr.querySelector('.eq-inv-sel')?.value;
      source = 'inventory';
    }

    if (!name) { valid = false; return; }
    equipmentList.push({ equipmentName: name, quantity: qty, source, available: 'YES' });
  });

  if (!valid || !equipmentList.length) return null;

  return {
    borrowerName,
    studentID:    document.getElementById('studentID').value.trim(),
    subjectCode:  document.getElementById('subjectCode').value.trim(),
    usageDate:    document.getElementById('usageDate').value,
    room:         document.getElementById('roomSelect').value,
    instructorName: INSTRUCTOR_NAME,
    guestNumber:  'INST-' + Date.now(),     // instructor entries flagged with INST prefix
    date:         new Date().toISOString().slice(0, 10),
    equipmentList,
  };
}

/* ── Confirmation overlay ── */
let pendingData = null;

document.getElementById('borrowForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = collectFormData();
  if (!data) {
    toast('Please fill in all required fields and add at least one equipment row.', 'error');
    return;
  }
  pendingData = data;
  renderConfirmation(data);
  document.getElementById('confirmOverlay').classList.add('open');
});

function renderConfirmation(data) {
  const eqRows = data.equipmentList.map(eq => `
    <tr>
      <td>${escHtml(eq.equipmentName)}</td>
      <td>${eq.quantity}</td>
      <td><span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${eq.source === 'others' ? 'var(--gold-soft)' : 'var(--accent-soft)'};color:${eq.source === 'others' ? 'var(--gold)' : 'var(--accent)'};">${eq.source === 'others' ? 'Manual' : 'Inventory'}</span></td>
    </tr>
  `).join('');

  document.getElementById('confirmDetails').innerHTML = `
    <table class="receipt-table" style="margin-bottom:16px;">
      <tbody>
        <tr><td style="color:var(--text-3);font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Borrower</td><td><strong>${escHtml(data.borrowerName)}</strong></td></tr>
        <tr><td style="color:var(--text-3);font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Student ID</td><td>${escHtml(data.studentID)}</td></tr>
        <tr><td style="color:var(--text-3);font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Subject</td><td>${escHtml(data.subjectCode)}</td></tr>
        <tr><td style="color:var(--text-3);font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Room</td><td>${escHtml(data.room)}</td></tr>
        <tr><td style="color:var(--text-3);font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Usage Date</td><td>${formatDate(data.usageDate)}</td></tr>
        <tr><td style="color:var(--text-3);font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Instructor</td><td>${escHtml(data.instructorName)}</td></tr>
      </tbody>
    </table>

    <h4 style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text-2);">Equipment List</h4>
    <table class="receipt-table">
      <thead>
        <tr><th>Equipment / Material</th><th>Qty</th><th>Source</th></tr>
      </thead>
      <tbody>${eqRows}</tbody>
    </table>
  `;
}

document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('confirmOverlay').classList.remove('open');
});

document.getElementById('confirmSubmitBtn').addEventListener('click', () => {
  if (!pendingData) return;
  const btn = document.getElementById('confirmSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Submitting…';

  fetch('submit_borrow_request.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(JSON.stringify(pendingData)),
  })
  .then(r => r.json())
  .then(res => {
    btn.disabled = false;
    btn.innerHTML = 'Confirm &amp; Submit';

    if (res.success) {
      document.getElementById('confirmOverlay').classList.remove('open');
      showReceipt(pendingData, res);
      resetForm();
    } else {
      toast('Submission failed: ' + res.message, 'error');
    }
  })
  .catch(() => {
    btn.disabled = false;
    btn.innerHTML = 'Confirm &amp; Submit';
    toast('Network error. Please try again.', 'error');
  });
});

/* ── Receipt ── */
function showReceipt(data, res) {
  const d = new Date();
  const eqRows = data.equipmentList.map(eq => `
    <tr>
      <td>${escHtml(eq.equipmentName)}</td>
      <td>${eq.quantity}</td>
      <td>${eq.source === 'others' ? 'Manual / Others' : 'Inventory'}</td>
      <td style="color:var(--text-3);">___________</td>
      <td style="color:var(--text-3);">_______________</td>
    </tr>
  `).join('');

  document.getElementById('receiptContent').innerHTML = `
    <div style="text-align:center;margin-bottom:16px;">
      <p style="font-size:12px;font-weight:600;color:var(--text-2);">EULOGIO "AMANG" RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY</p>
      <p style="font-size:12px;color:var(--text-2);">COLLEGE OF ARTS AND SCIENCES — APPLIED PHYSICS DEPARTMENT</p>
      <p style="font-size:13px;font-weight:600;margin-top:6px;">Equipment-borrowing Form</p>
    </div>

    <table class="receipt-table" style="margin-bottom:14px;">
      <tbody>
        <tr><td style="color:var(--text-3);font-size:11px;font-weight:600;text-transform:uppercase;">Date</td><td>${formatDate(data.date)}</td><td style="color:var(--text-3);font-size:11px;font-weight:600;text-transform:uppercase;">Usage Date</td><td>${formatDate(data.usageDate)}</td></tr>
        <tr><td style="color:var(--text-3);font-size:11px;font-weight:600;text-transform:uppercase;">Borrower</td><td>${escHtml(data.borrowerName)}</td><td style="color:var(--text-3);font-size:11px;font-weight:600;text-transform:uppercase;">Student ID</td><td>${escHtml(data.studentID)}</td></tr>
        <tr><td style="color:var(--text-3);font-size:11px;font-weight:600;text-transform:uppercase;">Subject</td><td>${escHtml(data.subjectCode)}</td><td style="color:var(--text-3);font-size:11px;font-weight:600;text-transform:uppercase;">Room</td><td>${escHtml(data.room)}</td></tr>
        <tr><td style="color:var(--text-3);font-size:11px;font-weight:600;text-transform:uppercase;">Instructor</td><td colspan="3">${escHtml(data.instructorName)}</td></tr>
      </tbody>
    </table>

    <table class="receipt-table">
      <thead>
        <tr><th>Equipment / Material</th><th>Qty</th><th>Source</th><th>Returned On</th><th>Remarks</th></tr>
      </thead>
      <tbody>${eqRows}</tbody>
    </table>

    <div style="margin-top:18px;font-size:12px;color:var(--text-2);font-style:italic;border-top:1px solid var(--border);padding-top:12px;">
      <strong>Borrower's Declaration:</strong><br>
      "I will be accountable to any damage incurred in the equipment and will return the equipment promptly and in the same working condition it was borrowed."
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;font-size:12px;color:var(--text-2);">
      <div>Approved by:<br><br>__________________________<br><em>Instructor's Name and Signature</em></div>
      <div style="text-align:right;">_________________________________<br><em>Signature over Printed Name of Borrower</em></div>
    </div>
  `;

  document.getElementById('receiptOverlay').classList.add('open');
}

document.getElementById('closeReceiptBtn').addEventListener('click', () => {
  document.getElementById('receiptOverlay').classList.remove('open');
  toast('Request recorded successfully.', 'success');
});

document.getElementById('printReceiptBtn').addEventListener('click', () => {
  window.print();
});

/* ── History ── */
function loadHistory() {
  const container = document.getElementById('historyList');
  container.innerHTML = '<p style="color:var(--text-3);font-style:italic;">Loading…</p>';

  fetch('fetch_borrow_reports.php')
    .then(r => r.json())
    .then(json => {
      if (!json.success || !json.data.length) {
        container.innerHTML = '<p style="color:var(--text-3);font-style:italic;">No borrow records yet.</p>';
        return;
      }

      container.innerHTML = '';
      [...json.data].reverse().forEach(entry => {
        const req = entry.borrowRequest;
        const eqList = (entry.equipmentList || []).map(e => `${e.equipment_name} ×${e.quantity}`).join(', ');
        const status = (req.status || 'pending').toLowerCase();

        const div = document.createElement('div');
        div.className = 'history-entry';
        div.innerHTML = `
          <div class="he-meta">
            <span class="he-name">${escHtml(req.borrower_name || '—')}</span>
            <span class="he-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
          <div class="he-detail">
            <strong>ID:</strong> ${escHtml(req.student_id)} &nbsp;·&nbsp;
            <strong>Subject:</strong> ${escHtml(req.subject_code)} &nbsp;·&nbsp;
            <strong>Room:</strong> ${escHtml(req.room)} &nbsp;·&nbsp;
            <strong>Date:</strong> ${formatDate(req.usage_date)}
            <br><strong>Equipment:</strong> ${escHtml(eqList)}
          </div>
        `;
        container.appendChild(div);
      });
    })
    .catch(() => {
      container.innerHTML = '<p style="color:var(--danger);">Failed to load history.</p>';
    });
}

document.getElementById('refreshHistoryBtn').addEventListener('click', loadHistory);

/* ── Helpers ── */
function resetForm() {
  ['lastName','firstName','middleInitial','studentID','subjectCode'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('roomSelect').value = '';
  document.getElementById('eqRows').innerHTML = '';
  rowCount = 0;
  addRow();
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' });
}

function toast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  setTimeout(() => { t.className = ''; }, 3400);
}
</script>
</body>
</html>
