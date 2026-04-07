<?php
session_start();

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header("Location: login.php");
    exit();
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EQUILAB — Admin</title>
  <link rel="stylesheet" href="dashboard.css" />
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>

<body>

  <!-- ── SIDEBAR ── -->
  <div class="sidebar">
    <div class="logo">
      <h2>⬡ EQUILAB</h2>
    </div>
    <nav>
      <a href="#" class="nav-item active" data-section="Dashboard">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        Dashboard
      </a>
      <a href="#" class="nav-item" data-section="Schedule">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        Schedule
      </a>
      <a href="#" class="nav-item" data-section="Borrow Requests">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
        Borrow Requests
        <span id="borrowQueueCount" class="queue-count">0</span>
      </a>
      <a href="#" class="nav-item" data-section="Inventory" id="inventoryNav">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        Inventory
      </a>
      <a href="#" class="nav-item" data-section="Reports">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        Reports
      </a>
    </nav>
    <div class="logout">
      <a href="#" onclick="logout()" class="nav-item">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/></svg>
        Log Out
      </a>
    </div>
  </div>

  <!-- ── MAIN ── -->
  <div class="main-content">

    <!-- ═══════════════════ DASHBOARD ═══════════════════ -->
    <div id="manageSection">

      <div class="page-header">
        <h1>Dashboard</h1>
        <p id="currentDate" style="color:var(--text-3);font-size:13px;"></p>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="label">Total Today</div>
          <div class="value" id="totalRequests">0</div>
        </div>
        <div class="stat-card green">
          <div class="label">Accepted</div>
          <div class="value" id="acceptedRequests">0</div>
        </div>
        <div class="stat-card red">
          <div class="label">Rejected</div>
          <div class="value" id="rejectedRequests">0</div>
        </div>
        <div class="stat-card orange">
          <div class="label">Pending</div>
          <div class="value" id="pendingRequests">0</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:24px; max-width:440px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
          <span style="font-weight:600; font-size:14px;">Admin Credentials</span>
          <button id="showChangeCredBtn" class="primary-btn">Change</button>
        </div>
        <p style="font-size:12px;color:var(--text-3);">Update your username and password.</p>
      </div>

      <div id="currentPassSection" class="form-section hidden" style="margin-bottom:16px;">
        <label style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-2);display:block;margin-bottom:6px;">Current Password</label>
        <input type="password" id="currentPassword" placeholder="Enter current password" />
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button id="verifyCurrentPassBtn" class="secondary-btn">Verify</button>
          <button type="button" id="backFromVerifyBtn" class="back-btn">Back</button>
        </div>
        <p id="verifyMessage" class="message-text"></p>
      </div>

      <div id="change-credentials" class="form-section hidden" style="margin-bottom:24px;">
        <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;">New Credentials</h3>
        <form id="change-form">
          <label style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-2);display:block;margin-bottom:4px;">New Username</label>
          <input type="text" id="newUsername" placeholder="Username" required style="margin-bottom:10px;"/>
          <label style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-2);display:block;margin-bottom:4px;">New Password</label>
          <input type="password" id="newPassword" placeholder="Password" required style="margin-bottom:10px;"/>
          <div style="display:flex;gap:8px;">
            <button type="submit" id="submitChangeCredentialsBtn" class="primary-btn">Update</button>
            <button type="button" id="backFromChangeBtn" class="back-btn">Back</button>
          </div>
          <p id="change-message" class="message-text"></p>
        </form>
      </div>

      <!-- Slider -->
      <div class="slider-container">
        <div class="slider-wrapper">

          <div class="slide" data-target="Schedule">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <span style="width:8px;height:8px;border-radius:50%;background:var(--accent);display:inline-block;"></span>
              <h3 style="margin:0;">Schedule</h3>
            </div>
            <p>Today's borrow request statistics at a glance.</p>
            <div id="dailyStats" style="margin-top:14px;">
              <p>Total: <strong id="totalReq2">—</strong> &nbsp;·&nbsp; Accepted: <strong style="color:var(--accent)" id="accReq2">—</strong> &nbsp;·&nbsp; Rejected: <strong style="color:var(--danger)" id="rejReq2">—</strong> &nbsp;·&nbsp; Pending: <strong style="color:var(--warn)" id="penReq2">—</strong></p>
              <p class="click-instruction">Click to open the Schedule section →</p>
            </div>
          </div>

          <div class="slide" data-target="Borrow Requests">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <span style="width:8px;height:8px;border-radius:50%;background:#E67E22;display:inline-block;"></span>
              <h3 style="margin:0;">Borrow Requests</h3>
            </div>
            <p>Total: <strong><span id="totalRequestCount">0</span></strong></p>
            <div id="borrowQueueDashboard" style="margin-top:12px;"></div>
          </div>

          <div class="slide" data-target="Inventory">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <span style="width:8px;height:8px;border-radius:50%;background:#1A6FB5;display:inline-block;"></span>
              <h3 style="margin:0;">Inventory</h3>
            </div>
            <p>Total items: <strong><span id="inventoryCount">0</span></strong></p>
            <div class="inventory-preview-container" style="margin-top:12px;">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Equipment</th><th>SN</th><th>ISN</th>
                    <th>Acc Person</th><th>T</th><th>W</th><th>NW</th><th>Desc</th>
                  </tr>
                </thead>
                <tbody id="inventoryPreviewBody"></tbody>
              </table>
            </div>
            <p class="preview-note">Preview only — click to view full inventory.</p>
          </div>

          <div class="slide" data-target="Reports">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <span style="width:8px;height:8px;border-radius:50%;background:var(--danger);display:inline-block;"></span>
              <h3 style="margin:0;">Reports</h3>
            </div>
            <p>Total entries: <strong><span id="reportCount">0</span></strong></p>
            <ul id="recentReportsList" class="recent-reports">
              <li style="color:var(--text-3);">Loading…</li>
            </ul>
          </div>

        </div>
        <div class="dots-container"></div>
      </div>

    </div><!-- /manageSection -->

    <!-- ═══════════════════ INVENTORY ═══════════════════ -->
    <div id="inventorySection" style="display:none;">
      <div class="page-header">
        <h1>Inventory</h1>
      </div>

      <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap;">
        <select id="categorySelect">
          <optgroup label="Category">
            <option value="all">All Categories</option>
            <option value="equipment">Equipment</option>
            <option value="measuring">Measuring Tools</option>
            <option value="chemicals">Chemicals</option>
            <option value="books">Books</option>
          </optgroup>
          <optgroup label="Condition">
            <option value="working">Working</option>
            <option value="notWorking">Not Working</option>
          </optgroup>
        </select>
        <div class="search-bar">
          <input type="text" placeholder="Search equipment…" id="searchInput">
        </div>
      </div>

      <!-- ── TOOLBAR: Edit button REMOVED, only Add / Delete / Export / Import ── -->
      <div class="btn-group">
        <div class="left-buttons">
          <button id="addEquipmentBtn">+ Add</button>
          <button id="deleteEquipmentBtn" class="danger">Delete</button>
        </div>
        <div class="right-buttons" style="margin-left:auto;">
          <button id="downloadExcelBtn">↓ Export</button>
          <input type="file" id="uploadExcelInput" accept=".xlsx" style="display:none;" />
          <button id="uploadExcelBtn">↑ Import</button>
        </div>
      </div>

      <!-- ── CLICK-TO-EDIT HINT ── -->
      <div id="editHintBanner" style="
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--accent-soft);
        border: 1px solid #a8d5b5;
        border-radius: var(--radius);
        padding: 10px 16px;
        margin-bottom: 14px;
        font-size: 13px;
        color: var(--accent);
      ">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"
          viewBox="0 0 24 24" style="flex-shrink:0;">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4m0 4h.01"/>
        </svg>
        <span>Click any row in the table below to edit that equipment.</span>
      </div>

      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow);">
        <table id="equipmentTable">
          <thead>
            <tr>
              <th rowspan="2" class="small-column">ID</th>
              <th rowspan="2">Equipment</th>
              <th rowspan="2">SN</th>
              <th rowspan="2">ISN</th>
              <th rowspan="2">Acc Person</th>
              <th colspan="3">Condition</th>
              <th rowspan="2">Description</th>
            </tr>
            <tr>
              <th title="Total">T</th>
              <th title="Working">W</th>
              <th title="Not Working">NW</th>
            </tr>
          </thead>
          <tbody id="equipmentList"></tbody>
        </table>
      </div>

    </div>

    <!-- ═══════════════════ SCHEDULE ═══════════════════ -->
    <div id="scheduleSection" style="display:none;">
      <div class="page-header"><h1>Schedule</h1></div>
      <div id="calendar"></div>

      <div id="statsSummary" style="margin-top:28px;">
        <h2 style="font-size:16px;font-weight:600;margin-bottom:16px;">Summary</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">

          <div class="card" style="text-align:center;">
            <p style="font-size:12px;color:var(--text-3);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Month — <span id="monthLabel">—</span></p>
            <div style="display:flex;justify-content:space-around;margin-bottom:12px;">
              <div><div style="font-size:22px;font-weight:600;font-family:var(--mono);" id="monthlyTotal">0</div><div style="font-size:11px;color:var(--text-3);">Total</div></div>
              <div><div style="font-size:22px;font-weight:600;font-family:var(--mono);color:var(--accent);" id="monthlyAccepted">0</div><div style="font-size:11px;color:var(--text-3);">Accepted</div></div>
              <div><div style="font-size:22px;font-weight:600;font-family:var(--mono);color:var(--danger);" id="monthlyRejected">0</div><div style="font-size:11px;color:var(--text-3);">Rejected</div></div>
            </div>
            <p style="font-size:12px;color:var(--text-3);">Top: <strong id="monthlyTopItem">N/A</strong></p>
            <div style="width:180px;height:180px;margin:12px auto 0;"><canvas id="monthlyChart"></canvas></div>
          </div>

          <div class="card" style="text-align:center;">
            <p style="font-size:12px;color:var(--text-3);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Week — <span id="weekLabel">—</span></p>
            <div style="display:flex;justify-content:space-around;margin-bottom:12px;">
              <div><div style="font-size:22px;font-weight:600;font-family:var(--mono);" id="weeklyTotal">0</div><div style="font-size:11px;color:var(--text-3);">Total</div></div>
              <div><div style="font-size:22px;font-weight:600;font-family:var(--mono);color:var(--accent);" id="weeklyAccepted">0</div><div style="font-size:11px;color:var(--text-3);">Accepted</div></div>
              <div><div style="font-size:22px;font-weight:600;font-family:var(--mono);color:var(--danger);" id="weeklyRejected">0</div><div style="font-size:11px;color:var(--text-3);">Rejected</div></div>
            </div>
            <p style="font-size:12px;color:var(--text-3);">Top: <strong id="weeklyTopItem">N/A</strong></p>
            <div style="width:180px;height:180px;margin:12px auto 0;"><canvas id="weeklyChart"></canvas></div>
          </div>

        </div>

        <div class="card">
          <p style="font-size:13px;font-weight:600;margin-bottom:14px;">Monthly Borrowing Trend</p>
          <div style="height:280px;"><canvas id="equipmentTrendChart" height="280"></canvas></div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════ BORROW REQUESTS ═══════════════════ -->
    <div id="queueSection" style="display:none;">
      <div class="page-header"><h1>Borrow Requests</h1></div>

      <div style="display:flex;align-items:flex-end;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
        <div>
          <label style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin-bottom:4px;">Start Date</label>
          <input type="date" id="startDate">
        </div>
        <div>
          <label style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin-bottom:4px;">End Date</label>
          <input type="date" id="endDate">
        </div>
        <button onclick="loadBorrowRequests()" class="primary" style="background:var(--accent);color:#fff;border-color:var(--accent);">Filter</button>
        <button onclick="clearFilters()" style="background:var(--surface-2);">Clear</button>
      </div>

      <div id="borrowQueue" style="display:flex;flex-direction:column;gap:8px;"></div>
    </div>

    <!-- ═══════════════════ REPORTS ═══════════════════ -->
    <div id="reportsSection" style="display:none;">
      <div class="page-header"><h1>Reports</h1></div>
      <div id="reportsList" style="display:flex;flex-direction:column;gap:10px;"></div>
    </div>

  </div><!-- /main-content -->

  <!-- ── ADD / EDIT EQUIPMENT MODAL (shared) ── -->
  <div id="addEquipmentModal" class="modal">
    <div class="modal-content" style="position:relative; max-width:500px;">
      <span class="close" onclick="closeAddEquipmentModal()">&times;</span>
      <h2 id="equipmentModalTitle">Equipment</h2>

      <label>Equipment ID</label>
      <input type="text" id="equipmentID" required />

      <label>Equipment Name</label>
      <input type="text" id="equipmentName" required />

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label>Serial Number</label>
          <input type="text" id="serialNumber" />
        </div>
        <div>
          <label>Internal SN</label>
          <input type="text" id="internalSN" />
        </div>
      </div>

      <label>Accountable Person</label>
      <input type="text" id="accountablePerson" />

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
        <div>
          <label>Total Qty</label>
          <input type="number" id="totalQty" />
        </div>
        <div>
          <label>Working</label>
          <input type="number" id="workingQty" />
        </div>
        <div>
          <label>Not Working</label>
          <input type="number" id="notWorkingQty" />
        </div>
      </div>

      <label>Description</label>
      <textarea id="description"></textarea>

      <button id="submitEquipmentBtn" style="width:100%;margin-top:16px;padding:10px;justify-content:center;">Submit</button>
    </div>
  </div>

  <div id="passwordModal" style="display:none;">
    <div class="modal-content" style="position:relative;text-align:center;">
      <span class="close" onclick="closePasswordModal()">&times;</span>
      <h3>Confirm Password</h3>
      <p style="font-size:13px;color:var(--text-3);margin-bottom:16px;">Enter your password to access Inventory</p>
      <input type="password" id="confirmPassword" placeholder="Password" style="width:100%;font-family:var(--font);font-size:13px;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg);outline:none;margin-bottom:12px;box-sizing:border-box;" />
      <button onclick="verifyPassword()" style="width:100%;background:var(--accent);color:#fff;border-color:var(--accent);justify-content:center;padding:10px;">Confirm</button>
      <p id="passwordError" style="color:var(--danger);display:none;font-size:12px;margin-top:8px;">Incorrect password. Try again.</p>
    </div>
  </div>

  <script src="admin.js"></script>
</body>
</html>