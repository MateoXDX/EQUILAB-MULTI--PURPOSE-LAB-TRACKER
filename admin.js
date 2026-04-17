// ════════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════════
let selectedRow      = null;
let selectedItemData = null;
let canEditQty       = true;
let currentEquipmentIDs = new Set();

// Inline edit state
let editingRow      = null;
let originalRowHTML = '';
let currentEditItem = null;

// ════════════════════════════════════════════════════════════════
// PASSWORD — always required every click, no sessionStorage cache
// ════════════════════════════════════════════════════════════════
// inventoryUnlocked is intentionally NEVER set to true permanently.
// Every click on Inventory will always open the password modal.
let inventoryUnlocked    = false;
window.inventoryUnlocked = false;

function openPasswordModal() {
  const input = document.getElementById('confirmPassword');
  const err   = document.getElementById('passwordError');
  if (input) input.value = '';
  if (err)   err.style.display = 'none';
  document.getElementById('passwordModal').style.display = 'flex';
}

function closePasswordModal() {
  document.getElementById('passwordModal').style.display = 'none';
  const input = document.getElementById('confirmPassword');
  const err   = document.getElementById('passwordError');
  if (input) input.value = '';
  if (err)   err.style.display = 'none';
}

function verifyPassword() {
  const password = document.getElementById('confirmPassword').value;
  fetch('inventory_password.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  .then(r => r.json())
  .then(data => {
    if (data.status === 'success') {
      closePasswordModal();
      navigateToSection('Inventory');
    } else {
      document.getElementById('passwordError').style.display = 'block';
    }
  })
  .catch(err => console.error('Error verifying password:', err));
}

// ════════════════════════════════════════════════════════════════
// SAVE EQUIPMENT LOG (PH time set server-side)
// ════════════════════════════════════════════════════════════════
function saveEquipmentLog(data, action) {
  const payload = {
    equipment_id:    data.equipment_id    || data.equipmentID    || '',
    equipment_name:  data.equipment_name  || data.equipmentName  || '',
    total_qty:       parseInt(data.total_qty       ?? data.totalQty)      || 0,
    working_qty:     parseInt(data.working_qty     ?? data.workingQty)    || 0,
    not_working_qty: parseInt(data.not_working_qty ?? data.notWorkingQty) || 0,
    account_person:  data.account_person  || data.accountablePerson || '',
    action:          action || 'Added'
  };

  if (!payload.equipment_id || !payload.equipment_name) {
    console.warn('saveEquipmentLog: missing required fields', payload);
    return;
  }

  fetch('save_equipment_log.php', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  })
  .then(r => r.json())
  .then(res => {
    if (!res.success) console.warn('Log save failed:', res.message);
    else refreshHistTabCount();
  })
  .catch(err => console.error('Log save error:', err));
}

// ════════════════════════════════════════════════════════════════
// INVENTORY TAB SWITCHER
// ════════════════════════════════════════════════════════════════
function switchInvTab(tab) {
  document.getElementById('invPanelList').classList.toggle('active',    tab === 'list');
  document.getElementById('invPanelHistory').classList.toggle('active', tab === 'history');
  document.getElementById('invTabListBtn').classList.toggle('active',   tab === 'list');
  document.getElementById('invTabHistBtn').classList.toggle('active',   tab === 'history');
  if (tab === 'history') loadHistoryTab();
}

// ════════════════════════════════════════════════════════════════
// HISTORY TAB — full-page table
// ════════════════════════════════════════════════════════════════
function refreshHistTabCount() {
  fetch('get_equipment_history.php?all=1')
    .then(r => r.json())
    .then(res => {
      const pill = document.getElementById('histTabCount');
      if (pill) pill.textContent = res.success ? res.data.length : '—';
    })
    .catch(() => {});
}

function loadHistoryTab() {
  const from  = document.getElementById('histFromDate')?.value || '';
  const to    = document.getElementById('histToDate')?.value   || '';
  let   url   = 'get_equipment_history.php?all=1';
  if (from) url += '&from=' + encodeURIComponent(from);
  if (to)   url += '&to='   + encodeURIComponent(to);

  const tbody = document.getElementById('histTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr class="hist-loading-row"><td colspan="8">Loading history…</td></tr>';

  fetch(url)
    .then(r => r.json())
    .then(res => {
      const pill = document.getElementById('histTabCount');
      if (pill) pill.textContent = res.success ? res.data.length : '—';

      if (!res.success || !res.data.length) {
        tbody.innerHTML = '<tr class="hist-empty-row"><td colspan="8">No equipment history recorded yet.</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      res.data.forEach((log, idx) => {
        const actionClass = (log.action || 'Added').toLowerCase();
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color:var(--text-3);font-size:11px;">${res.data.length - idx}</td>
          <td style="font-weight:500;">${escHtml(log.equipment_name || '—')}</td>
          <td style="font-family:var(--mono);font-size:12px;color:var(--text-2);">${escHtml(log.equipment_id || '—')}</td>
          <td>
            <span class="hist-qty">
              <span class="q-total">${log.total_qty ?? '—'}</span>
              <span class="q-sep">/</span>
              <span class="q-work">${log.working_qty ?? '—'}</span>
              <span class="q-sep">/</span>
              <span class="q-nowork">${log.not_working_qty ?? '—'}</span>
            </span>
          </td>
          <td style="font-size:12px;">${escHtml(log.account_person || '—')}</td>
          <td><span class="hist-badge ${actionClass}">${escHtml(log.action || 'Added')}</span></td>
          <td style="font-size:12px;color:var(--text-2);">${escHtml(log.added_by || 'Admin')}</td>
          <td>
            <div class="hist-ts">
              <span class="hist-ts-date">${escHtml(log.date_label || '—')}</span>
              <span class="hist-ts-time">${escHtml(log.time_label || '—')}</span>
              <span class="hist-ts-tz">PST · UTC+8</span>
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
    })
    .catch(() => {
      if (tbody) tbody.innerHTML = '<tr class="hist-empty-row"><td colspan="8">Error loading history.</td></tr>';
    });
}

function clearHistoryFilter() {
  const f = document.getElementById('histFromDate');
  const t = document.getElementById('histToDate');
  if (f) f.value = '';
  if (t) t.value = '';
  loadHistoryTab();
}

// ════════════════════════════════════════════════════════════════
// ADD EQUIPMENT MODAL
// ════════════════════════════════════════════════════════════════
function openAddEquipmentModal() {
  document.getElementById('addEquipmentModal').classList.add('is-open');
}
function closeAddEquipmentModal() {
  document.getElementById('addEquipmentModal').classList.remove('is-open');
}

// ════════════════════════════════════════════════════════════════
// HISTORY POPOVER (per-row clock button)
// ════════════════════════════════════════════════════════════════
let activeHistoryBtn = null;

function closeHistoryPopover() {
  const existing = document.getElementById('historyPopover');
  if (existing) existing.remove();
  if (activeHistoryBtn) {
    activeHistoryBtn.classList.remove('hist-btn-active');
    activeHistoryBtn = null;
  }
}

function openHistoryPopover(btn, equipmentId, equipmentName) {
  if (activeHistoryBtn === btn) { closeHistoryPopover(); return; }
  closeHistoryPopover();
  activeHistoryBtn = btn;
  btn.classList.add('hist-btn-active');

  const pop = document.createElement('div');
  pop.id        = 'historyPopover';
  pop.className = 'hist-popover';
  pop.innerHTML = `
    <div class="hist-pop-header">
      <div>
        <div class="hist-pop-title">History</div>
        <div class="hist-pop-sub">${escHtml(equipmentName)} · ${escHtml(equipmentId)}</div>
      </div>
      <button class="hist-pop-close" onclick="closeHistoryPopover()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="hist-pop-body" id="histPopBody">
      <div class="hist-loading">Loading…</div>
    </div>`;
  document.body.appendChild(pop);
  positionPopover(pop, btn);

  fetch(`get_equipment_history.php?equipment_id=${encodeURIComponent(equipmentId)}`)
    .then(r => r.json())
    .then(res => {
      const body = document.getElementById('histPopBody');
      if (!body) return;
      if (!res.success || !res.data.length) {
        body.innerHTML = '<div class="hist-empty">No history recorded yet.</div>';
        return;
      }
      body.innerHTML = renderHistoryEntries(res.data);
    })
    .catch(() => {
      const body = document.getElementById('histPopBody');
      if (body) body.innerHTML = '<div class="hist-empty">Failed to load history.</div>';
    });
}

function positionPopover(pop, btn) {
  const rect = btn.getBoundingClientRect();
  const popW = 340;
  let left = rect.right - popW;
  if (left < 8) left = 8;
  pop.style.left  = left + 'px';
  pop.style.top   = (rect.bottom + 8 + window.scrollY) + 'px';
  pop.style.width = popW + 'px';
}

function renderHistoryEntries(entries) {
  const groups = {};
  entries.forEach(e => {
    if (!groups[e.date_label]) groups[e.date_label] = [];
    groups[e.date_label].push(e);
  });
  let html = '';
  Object.entries(groups).forEach(([date, items]) => {
    html += `<div class="hist-date-group"><div class="hist-date-label">${escHtml(date)}</div>`;
    items.forEach(e => {
      if (e.action === 'Added') {
        html += `
        <div class="hist-entry hist-added">
          <div class="hist-entry-top">
            <span class="hist-badge added">Added</span>
            <span class="hist-time">${escHtml(e.time_label)}</span>
          </div>
          <div class="hist-entry-detail">Equipment added to inventory</div>
          ${renderSnapshot(e.snapshot)}
        </div>`;
      } else {
        html += `
        <div class="hist-entry hist-edited">
          <div class="hist-entry-top">
            <span class="hist-badge edited">Edited</span>
            <span class="hist-time">${escHtml(e.time_label)}</span>
          </div>
          <div class="hist-entry-detail">Equipment details updated</div>
          ${renderSnapshot(e.snapshot)}
        </div>`;
      }
    });
    html += '</div>';
  });
  return html;
}

function renderSnapshot(snap) {
  if (!snap || typeof snap !== 'object') return '';
  const labels = {
    equipment_name:  'Name',
    serial_number:   'SN',
    internal_sn:     'ISN',
    account_person:  'Acc. Person',
    total_qty:       'Total',
    working_qty:     'Working',
    not_working_qty: 'Not Working',
    description:     'Description',
  };
  let rows = '';
  Object.entries(labels).forEach(([key, label]) => {
    const val = snap[key];
    if (val !== undefined && val !== '') {
      rows += `<tr><td class="snap-label">${label}</td><td class="snap-val">${escHtml(String(val))}</td></tr>`;
    }
  });
  return rows ? `<table class="hist-snapshot">${rows}</table>` : '';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.addEventListener('click', function(e) {
  const pop = document.getElementById('historyPopover');
  if (!pop) return;
  if (!pop.contains(e.target) && !e.target.closest('.hist-btn')) closeHistoryPopover();
});

// ════════════════════════════════════════════════════════════════
// INLINE EDIT — sticky save bar
// ════════════════════════════════════════════════════════════════
function makeInlineInput(fieldName, type, value, disabled) {
  const isTextarea = type === 'textarea';
  const el = document.createElement(isTextarea ? 'textarea' : 'input');
  if (!isTextarea) el.type = type;
  el.value         = value ?? '';
  el.dataset.field = fieldName;
  el.disabled      = !!disabled;
  el.style.cssText = `
    width:100%;box-sizing:border-box;
    font-family:var(--font);font-size:12px;padding:4px 7px;
    border:1.5px solid ${disabled ? 'var(--border)' : 'var(--accent)'};
    border-radius:6px;
    background:${disabled ? 'var(--surface-2)' : 'var(--surface)'};
    color:${disabled ? 'var(--text-3)' : 'var(--text-1)'};
    outline:none;${disabled ? 'cursor:not-allowed;' : ''}
  `;
  if (isTextarea) el.rows = 2;
  if (type === 'number') el.min = 0;
  return el;
}

function createStickyActionBar(item) {
  const bar = document.createElement('div');
  bar.id = 'inlineEditBar';
  bar.style.cssText = `
    position:fixed;bottom:24px;right:32px;z-index:500;
    display:flex;align-items:center;gap:10px;
    background:var(--surface);border:1px solid var(--border);
    border-radius:var(--radius-lg);padding:10px 16px;
    box-shadow:0 4px 24px rgba(0,0,0,.13);
    animation:slideUpBar .2s cubic-bezier(.4,0,.2,1) both;
  `;

  const label = document.createElement('span');
  label.style.cssText = 'font-size:12px;color:var(--text-3);font-weight:500;margin-right:4px;';
  label.textContent   = `Editing: ${item.equipment_id}`;
  bar.appendChild(label);

  const borrowed = parseInt(item.available) !== parseInt(item.working_qty);
  if (borrowed) {
    const warn = document.createElement('span');
    warn.style.cssText = 'font-size:11px;color:var(--warn);margin-right:6px;';
    warn.textContent   = '⚠ Qty locked (borrowed)';
    bar.appendChild(warn);
  }

  const saveBtn = document.createElement('button');
  saveBtn.id = 'inlineEditSaveBtn';
  saveBtn.textContent = 'Save changes';
  saveBtn.style.cssText = `
    background:var(--accent);color:#fff;border:none;
    padding:7px 18px;border-radius:var(--radius);
    font-family:var(--font);font-size:13px;font-weight:600;
    cursor:pointer;white-space:nowrap;
  `;
  saveBtn.onmouseenter = () => { saveBtn.style.background = '#245A40'; };
  saveBtn.onmouseleave = () => { saveBtn.style.background = 'var(--accent)'; };

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = `
    background:var(--surface-2);color:var(--text-2);
    border:1px solid var(--border);padding:7px 14px;
    border-radius:var(--radius);font-family:var(--font);
    font-size:13px;cursor:pointer;white-space:nowrap;
  `;
  cancelBtn.onmouseenter = () => { cancelBtn.style.background = 'var(--border)'; };
  cancelBtn.onmouseleave = () => { cancelBtn.style.background = 'var(--surface-2)'; };

  bar.appendChild(saveBtn);
  bar.appendChild(cancelBtn);
  saveBtn.addEventListener('click',   saveInlineEdit);
  cancelBtn.addEventListener('click', cancelInlineEdit);
  return bar;
}

function removeStickyBar() {
  const b = document.getElementById('inlineEditBar');
  if (b) b.remove();
}

function enterInlineEdit(row, item) {
  if (editingRow && editingRow !== row) cancelInlineEdit();
  editingRow      = row;
  originalRowHTML = row.innerHTML;
  currentEditItem = item;

  const borrowed = parseInt(item.available) !== parseInt(item.working_qty);
  const fields = [
    [0, 'equipmentID',       'text',     item.equipment_id,    true],
    [1, 'equipmentName',     'text',     item.equipment_name,  false],
    [2, 'serialNumber',      'text',     item.serial_number,   false],
    [3, 'internalSN',        'text',     item.internal_sn,     false],
    [4, 'accountablePerson', 'text',     item.account_person,  false],
    [5, 'totalQty',          'number',   item.total_qty,       borrowed],
    [6, 'workingQty',        'number',   item.working_qty,     borrowed],
    [7, 'notWorkingQty',     'number',   item.not_working_qty, borrowed],
    [8, 'description',       'textarea', item.description,     false],
    // cell 9 is the history button — leave intact
  ];

  fields.forEach(([cellIdx, fieldName, type, value, dis]) => {
    const cell = row.cells[cellIdx];
    if (!cell) return;
    cell.innerHTML = '';
    cell.style.verticalAlign = 'top';
    cell.style.padding       = '6px 8px';
    cell.appendChild(makeInlineInput(fieldName, type, value, dis));
  });

  row.style.background = 'var(--accent-soft)';
  removeStickyBar();
  document.body.appendChild(createStickyActionBar(item));
}

function cancelInlineEdit() {
  removeStickyBar();
  if (!editingRow) return;
  editingRow.innerHTML        = originalRowHTML;
  editingRow.style.background = '';
  const histBtn = editingRow.querySelector('.hist-btn');
  if (histBtn && currentEditItem) {
    histBtn.onclick = () => openHistoryPopover(histBtn, currentEditItem.equipment_id, currentEditItem.equipment_name);
  }
  editingRow = null; originalRowHTML = ''; currentEditItem = null;
  loadInventory();
}

// FIX 1: saveInlineEdit — removed dataType:'json' so AJAX error handler
// won't fire on non-JSON responses; parse manually + call saveEquipmentLog
function saveInlineEdit() {
  if (!editingRow || !currentEditItem) return;

  function val(fieldName) {
    const el = editingRow.querySelector(`[data-field="${fieldName}"]`);
    return el ? el.value.trim() : '';
  }

  const equipmentID       = currentEditItem.equipment_id;
  const equipmentName     = val('equipmentName');
  const serialNumber      = val('serialNumber');
  const internalSN        = val('internalSN');
  const accountablePerson = val('accountablePerson');
  const totalQty          = val('totalQty')      || String(currentEditItem.total_qty);
  const workingQty        = val('workingQty')    || String(currentEditItem.working_qty);
  const notWorkingQty     = val('notWorkingQty') || String(currentEditItem.not_working_qty);
  const description       = val('description');

  if (!equipmentName || !accountablePerson) {
    alert('Equipment Name and Accountable Person are required.');
    return;
  }

  const saveBtn = document.getElementById('inlineEditSaveBtn');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

  $.ajax({
    url: 'edit_equipment.php', method: 'POST',
    // FIX: removed dataType:'json' — parse response manually to avoid error callback
    data: { equipmentID, equipmentName, serialNumber, internalSN,
            totalQty, workingQty, notWorkingQty, description, accountablePerson },
    success: function(rawRes) {
      let res;
      try { res = typeof rawRes === 'string' ? JSON.parse(rawRes) : rawRes; }
      catch(e) { res = { success: false, message: 'Invalid server response' }; }

      if (res.success) {
        // ── Record edit to history log ──
        saveEquipmentLog({
          equipment_id:    equipmentID,
          equipment_name:  equipmentName,
          total_qty:       totalQty,
          working_qty:     workingQty,
          not_working_qty: notWorkingQty,
          account_person:  accountablePerson
        }, 'Edited');

        removeStickyBar();
        editingRow = null; originalRowHTML = ''; currentEditItem = null;
        selectedRow = null; selectedItemData = null;
        loadInventory();
        loadInventoryPreview();
      } else {
        alert('Error saving: ' + (res.message || 'Unknown error'));
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save changes'; }
      }
    },
    error: function(xhr) {
      // FIX: show the actual server response in console so we can debug
      console.error('edit_equipment.php error:', xhr.status, xhr.responseText);
      alert('Save failed. Check console for details.');
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save changes'; }
    }
  });
}

// ════════════════════════════════════════════════════════════════
// DOCUMENT READY
// ════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // ── ADD button ──
  document.getElementById('addEquipmentBtn').onclick = () => {
    selectedItemData = null; canEditQty = true;
    ['equipmentID','equipmentName','serialNumber','internalSN',
     'accountablePerson','totalQty','workingQty','notWorkingQty','description']
      .forEach(id => { document.getElementById(id).value = ''; });
    ['equipmentID','totalQty','workingQty','notWorkingQty']
      .forEach(id => { document.getElementById(id).disabled = false; });
    openAddEquipmentModal();
  };

  window.addEventListener('click', function(e) {
    if (e.target === document.getElementById('addEquipmentModal')) closeAddEquipmentModal();
  });

  // ── EDIT button (null-guard so missing button won't crash DOMContentLoaded) ──
  const editBtn = document.getElementById('editEquipmentBtn');
  if (editBtn) {
    editBtn.onclick = () => {
      if (!selectedItemData || !selectedRow) {
        alert('Please click on an equipment row first to select it.');
        return;
      }
      if (editingRow === selectedRow) return;
      enterInlineEdit(selectedRow, selectedItemData);
    };
  }

  // FIX 2: SUBMIT ADD MODAL — after success, call saveEquipmentLog + loadInventory
  document.getElementById('submitEquipmentBtn').onclick = function(e) {
    e.preventDefault();
    const equipmentID       = document.getElementById('equipmentID').value.trim();
    const equipmentName     = document.getElementById('equipmentName').value.trim();
    const serialNumber      = document.getElementById('serialNumber').value.trim();
    const internalSN        = document.getElementById('internalSN').value.trim();
    const totalQty          = document.getElementById('totalQty').value.trim();
    const workingQty        = document.getElementById('workingQty').value.trim();
    const notWorkingQty     = document.getElementById('notWorkingQty').value.trim();
    const description       = document.getElementById('description').value.trim();
    const accountablePerson = document.getElementById('accountablePerson').value.trim();

    if (!equipmentID || !equipmentName || !totalQty || !workingQty || !notWorkingQty || !accountablePerson) {
      alert('Please fill in all required fields.'); return;
    }
    if (currentEquipmentIDs.has(equipmentID)) {
      alert('Equipment ID already exists. Please use a unique ID.'); return;
    }

    $.ajax({
      url: 'add_equipment.php', method: 'POST',
      data: { equipmentID, equipmentName, serialNumber, internalSN,
              totalQty, workingQty, notWorkingQty, description, accountablePerson },
      // FIX: removed dataType:'json' to avoid false error triggers
      success: function(rawData) {
        let data;
        try { data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData; }
        catch(e) { data = { success: false, message: 'Invalid response' }; }

        if (data.success) {
          alert('Equipment added successfully!');
          closeAddEquipmentModal();

          // ── Record to history log with PH timestamp ──
          saveEquipmentLog({
            equipment_id:    equipmentID,
            equipment_name:  equipmentName,
            total_qty:       totalQty,
            working_qty:     workingQty,
            not_working_qty: notWorkingQty,
            account_person:  accountablePerson
          }, 'Added');

          selectedRow = null; selectedItemData = null;
          ['equipmentID','equipmentName','serialNumber','internalSN','totalQty',
           'workingQty','notWorkingQty','description','accountablePerson']
            .forEach(id => { document.getElementById(id).value = ''; });

          // FIX 3: reload inventory immediately so new equipment shows without page refresh
          loadInventory();
          loadInventoryPreview();
        } else {
          alert('Error: ' + (data.message || 'Unknown error'));
        }
      },
      error: function(xhr) {
        console.error('add_equipment.php error:', xhr.status, xhr.responseText);
        alert('Add failed. Check console for details.');
      }
    });
  };

  // ── DELETE ──
  document.getElementById('deleteEquipmentBtn').onclick = function() {
    if (!selectedItemData) { alert('Please select an equipment item to delete.'); return; }
    fetch('fetch_equipment.php')
      .then(r => r.json())
      .then(data => {
        const eq = data.find(e => e.equipment_id === selectedItemData.equipment_id);
        if (!eq) { alert('Equipment not found.'); return; }
        if (parseInt(eq.available) !== parseInt(eq.working_qty)) {
          alert('This equipment is currently borrowed. It cannot be deleted.'); return;
        }
        if (confirm('Are you sure you want to delete this equipment?')) {
          $.ajax({
            url: 'delete_equipment.php', method: 'POST',
            data: { equipmentID: selectedItemData.equipment_id },
            success: function(res) {
              if (res.success) {
                alert('Equipment deleted successfully!');
                loadInventory(); loadInventoryPreview();
                selectedRow = null; selectedItemData = null;
              } else { alert('Error: ' + res.message); }
            }
          });
        }
      })
      .catch(() => alert('Failed to fetch equipment data.'));
  };

  // ── EXPORT / IMPORT ──
  document.getElementById('downloadExcelBtn').onclick = () => { window.location.href = 'export_equipment_excel.php'; };
  $('#uploadExcelBtn').on('click', function() { $('#uploadExcelInput').click(); });
  document.getElementById('uploadExcelInput').addEventListener('change', function() {
    const file = this.files[0];
    if (!file) { alert('Please select an Excel file first.'); return; }
    const formData = new FormData();
    formData.append('excelFile', file);
    $.ajax({
      url: 'import_equipment_excel.php', method: 'POST',
      data: formData, contentType: false, processData: false,
      success: function(res) {
        const r = typeof res === 'string' ? JSON.parse(res) : res;
        if (r.success) { alert('Equipment imported successfully!'); loadInventory(); }
        else alert('Import failed: ' + r.message);
        document.getElementById('uploadExcelInput').value = '';
      },
      error: function() { alert('Upload failed.'); document.getElementById('uploadExcelInput').value = ''; }
    });
  });

  // ── FILTER / SEARCH ──
  const categorySelect = document.getElementById('categorySelect');
  const searchInput    = document.getElementById('searchInput');

  function filterInventory() {
    const fv  = categorySelect.value.toLowerCase();
    const kw  = searchInput.value.toLowerCase();
    const map = { equipment:'e', measuring:'m', chemicals:'c', books:'b' };
    document.getElementById('equipmentList').querySelectorAll('tr').forEach(row => {
      if (!row.cells || row.cells.length < 8) return;
      const id   = row.cells[0].textContent.trim();
      const w    = parseInt(row.cells[6]?.textContent.trim(), 10);
      const nw   = parseInt(row.cells[7]?.textContent.trim(), 10);
      const text = row.textContent.toLowerCase();
      let show   = true;
      if (fv === 'working')         show = w  > 0;
      else if (fv === 'notworking') show = nw > 0;
      else if (fv !== 'all')        show = id.charAt(0).toLowerCase() === map[fv];
      row.style.display = (show && text.includes(kw)) ? '' : 'none';
    });
  }

  categorySelect.addEventListener('change', filterInventory);
  searchInput.addEventListener('input', filterInventory);

  loadInventory();
  refreshHistTabCount();
});

// ════════════════════════════════════════════════════════════════
// LOAD INVENTORY — click row = enter inline edit directly
// ════════════════════════════════════════════════════════════════
function loadInventory() {
  if (editingRow) {
    editingRow.innerHTML    = originalRowHTML;
    editingRow.style.background = '';
    editingRow = null; originalRowHTML = ''; currentEditItem = null;
  }
  closeHistoryPopover();

  const container = document.getElementById('equipmentList');
  if (!container) return;
  container.innerHTML = '';

  $.ajax({
    url: 'get_equipment.php', method: 'GET',
    success: function(data) {
      const items = typeof data === 'string' ? JSON.parse(data) : data;
      currentEquipmentIDs.clear();

      items.forEach(item => {
        currentEquipmentIDs.add(item.equipment_id);

        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.title = 'Click to select, then click Edit — or double-click to edit directly';
        row.innerHTML = `
          <td>${item.equipment_id}</td>
          <td>${item.equipment_name}</td>
          <td>${item.serial_number  ?? ''}</td>
          <td>${item.internal_sn   ?? ''}</td>
          <td>${item.account_person ?? ''}</td>
          <td>${item.total_qty     ?? 0}</td>
          <td>${item.working_qty   ?? 0}</td>
          <td>${item.not_working_qty ?? 0}</td>
          <td>${item.description   ?? ''}</td>
          <td class="hist-cell">
            <button class="hist-btn" title="View history"
              onclick="event.stopPropagation(); openHistoryPopover(this,
                '${item.equipment_id.replace(/'/g,"\\'")}',
                '${(item.equipment_name ?? '').replace(/'/g,"\\'")}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </button>
          </td>`;

        // Single click → select row (highlight)
        row.addEventListener('click', function(e) {
          if (e.target.closest('.hist-btn')) return;
          if (editingRow === row) return;
          if (editingRow && editingRow !== row) { cancelInlineEdit(); return; }

          if (selectedRow && selectedRow !== row) selectedRow.classList.remove('selected');
          row.classList.add('selected');
          selectedRow = row;
          selectedItemData = item;
        });

        // Double click → enter inline edit immediately
        row.addEventListener('dblclick', function(e) {
          if (e.target.closest('.hist-btn')) return;
          if (editingRow && editingRow !== row) cancelInlineEdit();
          enterInlineEdit(row, item);
        });

        container.appendChild(row);
      });

      // Re-apply current filter
      const fv  = document.getElementById('categorySelect')?.value.toLowerCase() || 'all';
      const kw  = document.getElementById('searchInput')?.value.toLowerCase() || '';
      const map = { equipment:'e', measuring:'m', chemicals:'c', books:'b' };
      container.querySelectorAll('tr').forEach(r => {
        if (!r.cells || r.cells.length < 8) return;
        const id   = r.cells[0].textContent.trim();
        const w    = parseInt(r.cells[6]?.textContent.trim(), 10);
        const nw   = parseInt(r.cells[7]?.textContent.trim(), 10);
        const text = r.textContent.toLowerCase();
        let show   = true;
        if (fv === 'working')         show = w  > 0;
        else if (fv === 'notworking') show = nw > 0;
        else if (fv !== 'all')        show = id.charAt(0).toLowerCase() === map[fv];
        r.style.display = (show && text.includes(kw)) ? '' : 'none';
      });
    },
    error: function() {
      container.innerHTML = '<tr><td colspan="10">Error loading inventory</td></tr>';
    }
  });
}

// ════════════════════════════════════════════════════════════════
// INVENTORY COUNT
// ════════════════════════════════════════════════════════════════
function updateInventoryCount() {
  $.ajax({
    url: 'get_equipment.php', method: 'GET',
    success: function(data) {
      const items = typeof data === 'string' ? JSON.parse(data) : data;
      const el = document.getElementById('inventoryCount');
      if (el) el.textContent = items.length;
    },
    error: function() {
      const el = document.getElementById('inventoryCount');
      if (el) el.textContent = 0;
    }
  });
}
updateInventoryCount();

// ════════════════════════════════════════════════════════════════
// LOGOUT / PAGE SHOW
// ════════════════════════════════════════════════════════════════
function logout() {
  window.location.href = 'logout.php';
}
window.addEventListener('pageshow', function(e) { if (e.persisted) window.location.reload(); });

// ════════════════════════════════════════════════════════════════
// NAVIGATION
// FIX 4: Inventory ALWAYS asks for password — no sessionStorage caching
// ════════════════════════════════════════════════════════════════
const sectionMap = {
  Dashboard:         'manageSection',
  Schedule:          'scheduleSection',
  'Borrow Requests': 'queueSection',
  Inventory:         'inventorySection',
  Reports:           'reportsSection'
};

function navigateToSection(sectionName) {
  Object.values(sectionMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  if (!sectionMap[sectionName]) sectionName = 'Dashboard';
  const el = document.getElementById(sectionMap[sectionName]);
  if (el) el.style.display = 'block';

  if (sectionName === 'Schedule') {
    if (typeof calendar !== 'undefined') calendar.render();
    else if (typeof initCalendar === 'function') initCalendar();
  } else if (sectionName === 'Borrow Requests') {
    if (typeof loadRequests === 'function') loadRequests();
  } else if (sectionName === 'Inventory') {
    loadInventory();
    refreshHistTabCount();
  } else if (sectionName === 'Reports') {
    if (typeof loadReports === 'function') loadReports();
  }
  setActiveSidebarItem(sectionName);
}

function setActiveSidebarItem(sectionName) {
  const target = sectionName.trim().toLowerCase();
  document.querySelectorAll('.sidebar .nav-item[data-section]').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-section')?.trim().toLowerCase() === target);
  });
}

document.addEventListener('DOMContentLoaded', () => { navigateToSection('Dashboard'); });

// FIX 4: ALWAYS open password modal for Inventory — no cache check
$('.nav-item').on('click', function() {
  const section = $(this).data('section');
  if (section === 'Inventory') {
    openPasswordModal(); // always ask, every single time
  } else if (section) {
    navigateToSection(section);
  }
});

document.getElementById('inventoryNav').addEventListener('click', e => {
  e.preventDefault();
  openPasswordModal(); // always ask, every single time
});

// ════════════════════════════════════════════════════════════════
// DASHBOARD SLIDER
// ════════════════════════════════════════════════════════════════
$(document).ready(function() {
  const $wrapper  = $('.slider-wrapper');
  const $slides   = $('.slide');
  const $dotsWrap = $('.dots-container');
  const count     = $slides.length;
  let   current   = 0, interval;
  const scheduleIndex = $slides.index($slides.filter('[data-target="Schedule"]'));

  for (let i = 0; i < count; i++)
    $dotsWrap.append($('<span>').addClass('dot' + (i === 0 ? ' active' : '')).attr('data-index', i));
  const $dots = $('.dot');

  function goTo(i) {
    if (i < 0) i = count - 1; if (i >= count) i = 0; current = i;
    $wrapper.css('transform', `translateX(-${i * 100}%)`);
    $dots.removeClass('active').eq(i).addClass('active');
    if (i === scheduleIndex && typeof miniCalendar !== 'undefined')
      setTimeout(() => { miniCalendar.render(); miniCalendar.updateSize(); }, 50);
  }
  function start() { interval = setInterval(() => goTo(current + 1), 5000); }
  function stop()  { clearInterval(interval); }
  $dots.on('click', function() { stop(); goTo($(this).data('index')); start(); });
  $slides.on('click', function() {
    const target = $(this).data('target'); if (!target) return; stop();
    if (target === 'Inventory') {
      openPasswordModal(); // always ask from dashboard slide too
    } else {
      navigateToSection(target); setActiveSidebarItem(target);
    }
  });
  goTo(0); start();
});

// ════════════════════════════════════════════════════════════════
// DATE / TODAY STATS
// ════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  const today    = new Date();
  const yyyyMmDd = today.toISOString().split('T')[0];
  const dateEl   = document.getElementById('currentDate');
  if (dateEl) dateEl.textContent = today.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  fetch(`fetch_borrow_stats.php?date=${yyyyMmDd}`).then(r => r.json()).then(data => {
    if (data.success) {
      const s = data.stats;
      document.getElementById('totalRequests').textContent    = s.total    || 0;
      document.getElementById('acceptedRequests').textContent = s.accepted || 0;
      document.getElementById('rejectedRequests').textContent = s.rejected || 0;
      document.getElementById('pendingRequests').textContent  = s.pending  || 0;
    }
  }).catch(err => console.error(err));
});

// ════════════════════════════════════════════════════════════════
// MINI CALENDAR
// ════════════════════════════════════════════════════════════════
let miniCalendar;
document.addEventListener('DOMContentLoaded', function() {
  const previewEl = document.getElementById('calendarPreview');
  if (!previewEl) return;
  miniCalendar = new FullCalendar.Calendar(previewEl, {
    initialView: 'dayGridMonth', headerToolbar: false, height: 280, fixedWeekCount: false, events: [],
    datesSet: function() { refreshCalendarStats('#calendarPreview'); }
  });
  miniCalendar.render();
});

// ════════════════════════════════════════════════════════════════
// FULL CALENDAR
// ════════════════════════════════════════════════════════════════
let calendar;
function initCalendar() {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: { left:'prev,next today', center:'title', right:'dayGridMonth,dayGridYear' },
    datesSet: function() { refreshCalendarStats('#calendar'); }
  });
  calendar.render(); refreshCalendarStats();
}

function refreshCalendarStats(containerSelector = '#calendar') {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.querySelectorAll('.custom-stats').forEach(el => el.remove());
  container.querySelectorAll('.fc-daygrid-day').forEach(dayCell => {
    const dateStr = dayCell.getAttribute('data-date');
    if (!dateStr) return;
    fetch(`fetch_borrow_stats.php?date=${dateStr}`).then(r => r.json()).then(data => {
      if (!data.success) return;
      const s = data.stats;
      if (!s.total && !s.accepted && !s.rejected && !s.pending) return;
      const isPreview = containerSelector === '#calendarPreview';
      const content = isPreview
        ? `<div class="custom-stats" style="display:flex;flex-direction:column;justify-content:center;align-items:center;font-size:.75em;height:100%;text-align:center;">
             <div style="font-weight:bold;margin-bottom:4px;">Total: ${s.total}</div>
             <div style="color:green;">Accepted: ${s.accepted}</div>
             <div style="color:red;">Rejected: ${s.rejected}</div>
             <div style="color:orange;">Pending: ${s.pending}</div></div>`
        : `<div class="custom-stats" style="font-size:.75em;margin-top:5px;line-height:1.2;">
             <div style="font-weight:bold;margin-bottom:4px;">Total: ${s.total}</div>
             <div style="color:green;">Accepted: ${s.accepted}</div>
             <div style="color:red;">Rejected: ${s.rejected}</div>
             <div style="color:orange;">Pending: ${s.pending}</div></div>`;
      const frame = dayCell.querySelector('.fc-daygrid-day-frame');
      if (frame && !frame.querySelector('.custom-stats')) frame.insertAdjacentHTML('beforeend', content);
    });
  });
}

// ════════════════════════════════════════════════════════════════
// INVENTORY PREVIEW (dashboard)
// ════════════════════════════════════════════════════════════════
function loadInventoryPreview() {
  $.ajax({ url: 'get_equipment.php', method: 'GET', success: function(data) {
    const items = typeof data === 'string' ? JSON.parse(data) : data;
    const body  = document.getElementById('inventoryPreviewBody');
    if (!body) return;
    body.innerHTML = '';
    items.slice(0, 10).forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="centered-cell">${item.equipment_id}</td>
        <td class="centered-cell">${item.equipment_name}</td>
        <td class="centered-cell">${item.serial_number   ?? ''}</td>
        <td class="centered-cell">${item.internal_sn     ?? ''}</td>
        <td class="centered-cell">${item.account_person  ?? ''}</td>
        <td class="centered-cell">${item.total_qty       ?? 0}</td>
        <td class="centered-cell">${item.working_qty     ?? 0}</td>
        <td class="centered-cell">${item.not_working_qty ?? 0}</td>
        <td class="centered-cell">${item.description     ?? ''}</td>`;
      body.appendChild(row);
    });
    const countEl = document.getElementById('inventoryCount');
    if (countEl) countEl.textContent = items.length;
  }});
}
document.addEventListener('DOMContentLoaded', () => { loadInventoryPreview(); });

// ════════════════════════════════════════════════════════════════
// BORROW REQUESTS
// ════════════════════════════════════════════════════════════════
function updateBorrowRequestsOverview() {
  fetch('fetch_borrow_requests.php').then(r => r.json()).then(json => {
    if (!json.success) return;
    const countEl = document.getElementById('totalRequestCount');
    if (countEl) countEl.textContent = json.data.length;
    const recentList = document.getElementById('recentBorrowRequests');
    if (recentList) {
      recentList.innerHTML = '';
      json.data.slice(0, 5).forEach(entry => {
        const req = entry.borrowRequest;
        const li  = document.createElement('li');
        li.textContent = `Guest #: ${req.guest_number} — ${req.borrower_name}`;
        recentList.appendChild(li);
      });
    }
  }).catch(err => console.error('Failed to load borrow requests overview:', err));
}
updateBorrowRequestsOverview();
document.addEventListener('DOMContentLoaded', () => { initCalendar(); });

document.addEventListener('DOMContentLoaded', () => {
  const dateSpan = document.getElementById('currentDate');
  if (dateSpan) dateSpan.textContent = new Date().toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });

  const previewDiv = document.getElementById('todayStatsPreview');
  if (previewDiv) {
    const t   = new Date();
    const str = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
    fetch(`fetch_borrow_stats.php?date=${str}`).then(r=>r.json()).then(data => {
      if (!data.success) { previewDiv.textContent = 'Failed to load today\'s stats.'; return; }
      const s = data.stats;
      if (s.total > 0 || s.accepted > 0 || s.rejected > 0 || s.pending > 0) {
        previewDiv.innerHTML = `
          <div><strong>Total:</strong> ${s.total}</div>
          <div style="color:green;"><strong>Accepted:</strong> ${s.accepted}</div>
          <div style="color:red;"><strong>Rejected:</strong> ${s.rejected}</div>
          <div style="color:orange;"><strong>Pending:</strong> ${s.pending}</div>`;
      } else {
        previewDiv.textContent = 'No borrow requests for today.';
      }
    }).catch(() => { previewDiv.textContent = 'Error loading today\'s stats.'; });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  fetch('fetch_stats.php').then(r=>r.json()).then(data => {
    if (!data.success) return;
    const w = data.weekly, m = data.monthly;
    const curr  = new Date();
    const first = curr.getDate() - curr.getDay();
    const last  = first + 6;
    const sun   = new Date(new Date(curr).setDate(first));
    const sat   = new Date(new Date(curr).setDate(last));
    const fmt   = d => `${d.getMonth()+1}/${d.getDate()}`;

    document.getElementById('weekLabel').textContent  = `${fmt(sun)} - ${fmt(sat)}`;
    document.getElementById('monthLabel').textContent = new Date().toLocaleString('default', { month:'long', year:'numeric' });
    document.getElementById('weeklyTotal').textContent    = w.total;
    document.getElementById('weeklyAccepted').textContent = w.accepted;
    document.getElementById('weeklyRejected').textContent = w.rejected;
    document.getElementById('weeklyTopItem').textContent  = w.topItem;
    document.getElementById('monthlyTotal').textContent    = m.total;
    document.getElementById('monthlyAccepted').textContent = m.accepted;
    document.getElementById('monthlyRejected').textContent = m.rejected;
    document.getElementById('monthlyTopItem').textContent  = m.topItem;

    function pie(id, title, acc, rej, colors) {
      const ctx = document.getElementById(id)?.getContext('2d'); if (!ctx) return;
      new Chart(ctx, { type:'doughnut',
        data: { labels:['Accepted','Rejected'], datasets:[{ data:[acc,rej], backgroundColor:colors }] },
        options: { responsive:true, plugins:{ title:{ display:true, text:title }, legend:{ position:'bottom' } } }
      });
    }
    pie('weeklyChart',  'Weekly Requests',  w.accepted, w.rejected, ['#4CAF50','#F44336']);
    pie('monthlyChart', 'Monthly Requests', m.accepted, m.rejected, ['#4CAF50','#F44336']);

    if (data.equipmentTrend) {
      const ctx = document.getElementById('equipmentTrendChart')?.getContext('2d'); if (!ctx) return;
      const months   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const datasets = Object.entries(data.equipmentTrend).map(([item, vals], i) => ({
        label: item, data: months.map(mo => vals[mo] || 0),
        borderColor: `hsl(${i*45},70%,50%)`, backgroundColor:'transparent', tension:0.3
      }));
      new Chart(ctx, { type:'line', data:{ labels:months, datasets },
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ title:{ display:true, text:'Monthly Borrowing Frequency' }, legend:{ position:'top' } },
          scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1, precision:0 }, title:{ display:true, text:'Times Borrowed' } } }
        }
      });
    }
  });
});

document.addEventListener('DOMContentLoaded', () => { if (typeof loadScheduleStats === 'function') loadScheduleStats(); });

// ════════════════════════════════════════════════════════════════
// BORROW QUEUE
// ════════════════════════════════════════════════════════════════
function loadBorrowRequests() {
  const startDate = document.getElementById('startDate')?.value;
  const endDate   = document.getElementById('endDate')?.value;
  let url = 'fetch_borrow_requests.php';
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate)   params.append('endDate',   endDate);
  if (params.toString()) url += '?' + params;

  fetch(url).then(r=>r.json()).then(json => {
    if (!json.success) return;
    const container = document.getElementById('borrowQueue');
    container.innerHTML = '';
    if (!json.data.length) {
      container.innerHTML = `<div style="text-align:left;color:#555;font-style:italic;margin-top:20px;font-size:1.1em;">No borrow requests are available at this time.</div>`;
      return;
    }
    json.data.forEach(entry => {
      const request = entry.borrowRequest, equipmentList = entry.equipmentList;
      borrowRequestMap[request.id] = { ...request, equipment: equipmentList };
      const div = document.createElement('div');
      div.className = 'borrow-request';
      div.innerHTML = `
        <strong>Guest Number:</strong> ${request.guest_number}<br/>
        <strong>Borrower's Name:</strong> ${request.borrower_name}<br/>
        <strong>Student ID:</strong> ${request.student_id}<br/>
        <button class="view-request-btn" data-id="${request.id}">View Request</button>
        <div class="action-buttons" style="margin-top:10px;">
          <button class="accept-btn" data-id="${request.id}">Accept</button>
          <button class="reject-btn" data-id="${request.id}">Reject</button>
        </div>
        <div id="borrowerFormSection-${request.id}" class="borrower-form-section" style="display:none;margin-top:20px;">
          <button onclick="closeBorrowerForm(${request.id})" style="float:right;margin-bottom:10px;background-color:#c62828;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">Close</button>
          <div class="form-container">
            <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
              <tr><td colspan="2" style="text-align:center;">
                <h4>EULOGIO "AMANG" RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY</h4>
                <h4>COLLEGE OF ARTS AND SCIENCES</h4><h4>APPLIED PHYSICS DEPARTMENT</h4>
                <h3>Equipment-borrowing Form</h3>
              </td></tr>
              <tr><td><strong>Guest Login Number:</strong> ${request.guest_number}</td><td><strong>Date:</strong> ${formatDateToDDMMYYYY(request.date)}</td></tr>
              <tr><td><strong>Borrower's Name:</strong> ${request.borrower_name}</td><td><strong>Instructor's Name:</strong> ${request.instructor_name}</td></tr>
              <tr><td><strong>Student ID:</strong> ${request.student_id}</td><td><strong>Subject Code:</strong> ${request.subject_code}</td></tr>
              <tr><td><strong>Date(s) of Usage:</strong> ${formatDateToDDMMYYYY(request.usage_date)}</td><td><strong>Room:</strong> ${request.room}</td></tr>
              <tr><td colspan="2" style="padding-top:15px;">
                <table style="width:100%;border-collapse:collapse;" border="1">
                  <thead><tr style="text-align:center;"><th>Equipment / Material</th><th>Quantity</th><th>Available in the lab?</th><th>Returned on</th><th>Remarks</th></tr></thead>
                  <tbody id="equipmentListInForm-${request.id}"></tbody>
                </table>
              </td></tr>
              <tr><td colspan="2" style="padding-top:20px;">
                <strong>Borrower's Declaration of Commitment:</strong><br/>
                <em>"I will be accountable to any damage incurred in the equipment and will return the equipment promptly and in the same working condition it was borrowed."</em>
              </td></tr>
              <tr>
                <td style="padding-top:30px;"><p>Approved by:<br><br>__________________________<br><em>Instructor's Name and Signature</em></p></td>
                <td style="text-align:right;padding-top:30px;"><p>_________________________________<br><em>Signature over Printed Name of Borrower</em></p></td>
              </tr>
            </table>
          </div>
        </div>`;
      container.appendChild(div);
    });
    attachActionHandlers();
  });
}

function clearFilters() {
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value   = '';
  loadBorrowRequests();
}

fetch('process_rejected_requests.php').then(r=>r.json()).then(data => {
  if (data.success) { refreshCalendarStats(); loadBorrowRequestsAndUpdateCount(); }
});

function attachActionHandlers() {
  document.querySelectorAll('.accept-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Are you sure you want to ACCEPT this borrow request?'))
        addToReports(btn.dataset.id, 'Accepted').then(() => { refreshCalendarStats(); loadBorrowRequestsAndUpdateCount(); });
    });
  });
  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Are you sure you want to REJECT this borrow request?'))
        addToReports(btn.dataset.id, 'Rejected').then(() => { refreshCalendarStats(); loadBorrowRequestsAndUpdateCount(); });
    });
  });
  document.querySelectorAll('.view-request-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id, data = borrowRequestMap[id]; if (!data) return;
      const formSection = document.getElementById(`borrowerFormSection-${id}`); if (!formSection) return;
      if (formSection.style.display === 'none' || !formSection.style.display) {
        formSection.style.display = 'block';
        const tbody = document.getElementById(`equipmentListInForm-${id}`);
        tbody.innerHTML = '';
        data.equipment.forEach(eq => {
          const row = document.createElement('tr');
          row.innerHTML = `<td>${eq.equipment_name}</td><td>${eq.quantity}</td><td>${eq.available}</td><td></td><td></td>`;
          tbody.appendChild(row);
        });
      } else { formSection.style.display = 'none'; }
    });
  });
}

function formatDateToDDMMYYYY(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr); if (isNaN(d)) return dateStr;
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}

const borrowRequestMap = {};

function loadBorrowRequestsDashboard() {
  fetch('fetch_borrow_requests.php').then(r => r.json()).then(json => {
    if (!json.success) return;
    const container = document.getElementById('recentBorrowRequests');
    if (!container) return;
    container.innerHTML = '';
    if (!json.data.length) {
      container.innerHTML = `<div style="color:#555;font-style:italic;">No borrow requests at the moment.</div>`;
      return;
    }
    json.data.slice(0, 5).forEach(entry => {
      const req = entry.borrowRequest;
      const li  = document.createElement('li');
      li.textContent = `Guest #: ${req.guest_number} — ${req.borrower_name}`;
      container.appendChild(li);
    });
  }).catch(err => console.error('Failed to load borrow requests overview:', err));
}

// ════════════════════════════════════════════════════════════════
// CHANGE CREDENTIALS
// ════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const showBtn    = document.getElementById('showChangeCredBtn');
  const currSec    = document.getElementById('currentPassSection');
  const changeSec  = document.getElementById('change-credentials');
  const verifyBtn  = document.getElementById('verifyCurrentPassBtn');
  const changeForm = document.getElementById('change-form');
  const currInput  = document.getElementById('currentPassword');
  const newUser    = document.getElementById('newUsername');
  const newPass    = document.getElementById('newPassword');

  if (!showBtn) return;

  showBtn.addEventListener('click', () => {
    showBtn.style.display = 'none';
    currSec.classList.remove('hidden');
    currInput.value = '';
  });
  document.getElementById('backFromVerifyBtn').addEventListener('click', () => {
    currSec.classList.add('hidden');
    showBtn.style.display = 'inline-block';
    currInput.value = '';
  });
  document.getElementById('backFromChangeBtn').addEventListener('click', () => {
    changeSec.classList.add('hidden');
    showBtn.style.display = 'inline-block';
    newUser.value = ''; newPass.value = '';
  });
  verifyBtn.addEventListener('click', () => {
    const pwd = currInput.value.trim();
    if (!pwd) { alert('Please enter your current password.'); return; }
    fetch('verify_password.php', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ password: pwd })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        currSec.classList.add('hidden');
        changeSec.classList.remove('hidden');
        newUser.value = ''; newPass.value = '';
      } else { alert(data.message || 'Incorrect password.'); }
    })
    .catch(() => alert('Error verifying password.'));
  });
  changeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = newUser.value.trim();
    const password = newPass.value.trim();
    if (!username || !password) { alert('Fields cannot be empty.'); return; }
    fetch('update_credentials.php', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        alert('Credentials updated!');
        changeSec.classList.add('hidden');
        showBtn.style.display = 'inline-block';
      } else { alert(data.message || 'Failed to update.'); }
    })
    .catch(() => alert('An error occurred.'));
  });
});
