let canEditQty = true;

function openAddEquipmentModal() {
  document.getElementById("addEquipmentModal").classList.add("is-open");
}

function closeAddEquipmentModal() {
  document.getElementById("addEquipmentModal").classList.remove("is-open");
}

document.addEventListener("DOMContentLoaded", () => {

  // ── ADD button — blank form ──
  document.getElementById("addEquipmentBtn").onclick = () => {
    selectedItemData = null;
    canEditQty = true;

    document.getElementById("equipmentModalTitle").textContent = "Add Equipment";
    document.getElementById("equipmentID").value = '';
    document.getElementById("equipmentName").value = '';
    document.getElementById("serialNumber").value = '';
    document.getElementById("internalSN").value = '';
    document.getElementById("accountablePerson").value = '';
    document.getElementById("totalQty").value = '';
    document.getElementById("workingQty").value = '';
    document.getElementById("notWorkingQty").value = '';
    document.getElementById("description").value = '';

    document.getElementById("equipmentID").disabled = false;
    document.getElementById("totalQty").disabled = false;
    document.getElementById("workingQty").disabled = false;
    document.getElementById("notWorkingQty").disabled = false;

    openAddEquipmentModal();
  };

  window.addEventListener("click", function (event) {
    if (event.target === document.getElementById("addEquipmentModal")) {
      closeAddEquipmentModal();
    }
  });

  // ── SUBMIT (Add or Edit) ──
  document.getElementById("submitEquipmentBtn").onclick = function (event) {
    event.preventDefault();

    const equipmentID      = document.getElementById("equipmentID").value.trim();
    const equipmentName    = document.getElementById("equipmentName").value.trim();
    const serialNumber     = document.getElementById("serialNumber").value.trim();
    const internalSN       = document.getElementById("internalSN").value.trim();
    const totalQty         = document.getElementById("totalQty").value.trim();
    const workingQty       = document.getElementById("workingQty").value.trim();
    const notWorkingQty    = document.getElementById("notWorkingQty").value.trim();
    const description      = document.getElementById("description").value.trim();
    const accountablePerson = document.getElementById("accountablePerson").value.trim();

    if (!equipmentID || !equipmentName || !totalQty || !workingQty || !notWorkingQty || !accountablePerson) {
      alert("Please fill in all required fields.");
      return;
    }

    const isEditing = selectedItemData && selectedItemData.equipment_id === equipmentID;

    if (!isEditing && currentEquipmentIDs.has(equipmentID)) {
      alert("Equipment ID already exists. Please use a unique ID.");
      return;
    }

    $.ajax({
      url: isEditing ? "edit_equipment.php" : "add_equipment.php",
      method: "POST",
      data: { equipmentID, equipmentName, serialNumber, internalSN, totalQty, workingQty, notWorkingQty, description, accountablePerson },
      dataType: "json",
      success: function (data) {
        if (data.success) {
          alert(isEditing ? "Equipment updated successfully!" : "Equipment added successfully!");
          closeAddEquipmentModal();

          selectedRow = null;
          selectedItemData = null;

          document.getElementById("equipmentID").value = '';
          document.getElementById("equipmentName").value = '';
          document.getElementById("serialNumber").value = '';
          document.getElementById("internalSN").value = '';
          document.getElementById("totalQty").value = '';
          document.getElementById("workingQty").value = '';
          document.getElementById("notWorkingQty").value = '';
          document.getElementById("description").value = '';
          document.getElementById("accountablePerson").value = '';

          loadInventory();
          loadInventoryPreview();
        } else {
          alert("Error: " + data.message);
        }
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
      }
    });
  };

  // ── DELETE button ──
  document.getElementById("deleteEquipmentBtn").onclick = function () {
    if (!selectedItemData) {
      alert("Please click on an equipment row first to select it, then click Delete.");
      return;
    }

    fetch("fetch_equipment.php")
      .then(response => response.json())
      .then(data => {
        const equipment = data.find(eq => eq.equipment_id === selectedItemData.equipment_id);
        if (!equipment) { alert("Equipment not found."); return; }

        const available = parseInt(equipment.available);
        const working   = parseInt(equipment.working_qty);

        if (available !== working) {
          alert("This equipment is currently borrowed. It cannot be deleted.");
          return;
        }

        if (confirm("Are you sure you want to delete this equipment?")) {
          $.ajax({
            url: "delete_equipment.php",
            method: "POST",
            data: { equipmentID: selectedItemData.equipment_id },
            success: function (response) {
              if (response.success) {
                alert("Equipment deleted successfully!");
                loadInventory();
                loadInventoryPreview();
                selectedRow = null;
                selectedItemData = null;
              } else {
                alert("Error: " + response.message);
              }
            },
            error: function (xhr, status, error) { console.error("Error:", error); }
          });
        }
      })
      .catch(err => { console.error("Fetch error:", err); alert("Failed to fetch equipment data."); });
  };

  // ── EXPORT / IMPORT ──
  document.getElementById("downloadExcelBtn").onclick = () => {
    window.location.href = "export_equipment_excel.php";
  };

  $('#uploadExcelBtn').on('click', function () {
    $('#uploadExcelInput').click();
  });

  document.getElementById("uploadExcelInput").addEventListener('change', function () {
    const fileInput = this;
    const file = fileInput.files[0];
    if (!file) { alert("Please select an Excel file first."); return; }

    const formData = new FormData();
    formData.append("excelFile", file);

    $.ajax({
      url: "import_equipment_excel.php",
      method: "POST",
      data: formData,
      contentType: false,
      processData: false,
      success: function (res) {
        const response = typeof res === "string" ? JSON.parse(res) : res;
        if (response.success) { alert("Equipment imported successfully!"); loadInventory(); }
        else alert("Import failed: " + response.message);
        fileInput.value = "";
      },
      error: function (xhr, status, error) {
        console.error("Upload error:", error);
        alert("Upload failed, please try again.");
        fileInput.value = "";
      },
    });
  });

  // ── FILTER ──
  const categorySelect = document.getElementById("categorySelect");
  const searchInput    = document.getElementById("searchInput");
  const equipmentList  = document.getElementById("equipmentList");

  function filterInventory() {
    const filterValue = categorySelect.value.toLowerCase();
    const searchText  = searchInput.value.toLowerCase();
    const rows = equipmentList.querySelectorAll("tr");

    rows.forEach(row => {
      const equipmentID   = row.children[0].textContent.trim();
      const firstChar     = equipmentID.charAt(0).toLowerCase();
      const rowText       = row.textContent.toLowerCase();
      const workingQty    = parseInt(row.children[6].textContent.trim(), 10);
      const notWorkingQty = parseInt(row.children[7].textContent.trim(), 10);

      const categoryMap = { "equipment": "e", "measuring": "m", "chemicals": "c", "books": "b" };
      let show = true;

      if (filterValue === "working") show = workingQty > 0;
      else if (filterValue === "notworking") show = notWorkingQty > 0;
      else if (filterValue !== "all") show = firstChar === categoryMap[filterValue];

      row.style.display = (show && rowText.includes(searchText)) ? "" : "none";
    });
  }

  categorySelect.addEventListener("change", filterInventory);
  searchInput.addEventListener("input", filterInventory);

  let selectedRow = null;
  let selectedItemData = null;
  let currentEquipmentIDs = new Set();

  // ── LOAD INVENTORY — clicking a row opens Edit modal directly ──
  window.loadInventory = function () {
    const container = equipmentList;
    container.innerHTML = "";

    $.ajax({
      url: "get_equipment.php",
      method: "GET",
      success: function (data) {
        const items = typeof data === "string" ? JSON.parse(data) : data;
        currentEquipmentIDs.clear();

        items.forEach((item) => {
          currentEquipmentIDs.add(item.equipment_id);

          const row = document.createElement("tr");
          // Add pointer cursor hint via title so user knows it's clickable
          row.title = "Click to edit this equipment";
          row.style.cursor = "pointer";
          row.innerHTML = `
            <td>${item.equipment_id}</td>
            <td>${item.equipment_name}</td>
            <td>${item.serial_number}</td>
            <td>${item.internal_sn}</td>
            <td>${item.account_person}</td>
            <td>${item.total_qty}</td>
            <td>${item.working_qty}</td>
            <td>${item.not_working_qty}</td>
            <td>${item.description}</td>
          `;

          // ── ROW CLICK → open Edit modal ──
          row.addEventListener("click", () => {
            // Highlight selected row
            if (selectedRow) selectedRow.classList.remove("selected");
            row.classList.add("selected");
            selectedRow = row;
            selectedItemData = item;

            // Fetch latest data to check borrow status before opening
            fetch("fetch_equipment.php")
              .then(response => response.json())
              .then(fetchedData => {
                const equipment = fetchedData.find(eq => eq.equipment_id === item.equipment_id);
                if (!equipment) { alert("Equipment not found."); return; }

                const available = parseInt(equipment.available);
                const working   = parseInt(equipment.working_qty);
                canEditQty = (available === working);

                // Fill form
                document.getElementById("equipmentModalTitle").textContent = "Edit Equipment";
                document.getElementById("equipmentID").value          = item.equipment_id;
                document.getElementById("equipmentName").value        = item.equipment_name;
                document.getElementById("serialNumber").value         = item.serial_number;
                document.getElementById("internalSN").value           = item.internal_sn;
                document.getElementById("accountablePerson").value    = item.account_person;
                document.getElementById("totalQty").value             = item.total_qty;
                document.getElementById("workingQty").value           = item.working_qty;
                document.getElementById("notWorkingQty").value        = item.not_working_qty;
                document.getElementById("description").value          = item.description;

                // Lock Equipment ID when editing
                document.getElementById("equipmentID").disabled = true;

                // Lock qty fields if borrowed
                document.getElementById("totalQty").disabled      = !canEditQty;
                document.getElementById("workingQty").disabled    = !canEditQty;
                document.getElementById("notWorkingQty").disabled = !canEditQty;

                if (!canEditQty) {
                  alert("Note: This equipment is currently borrowed. Quantity fields are locked.");
                }

                openAddEquipmentModal();
              })
              .catch(err => {
                console.error("Fetch error:", err);
                alert("Failed to fetch equipment data.");
              });
          });

          container.appendChild(row);
        });

        filterInventory();
      },
      error: function (xhr, status, error) {
        console.error("Error loading inventory:", error);
        container.innerHTML = '<tr><td colspan="9">Error loading inventory</td></tr>';
      }
    });
  };

  loadInventory();
});

// ── INVENTORY COUNT ──
function updateInventoryCount() {
  $.ajax({
    url: "get_equipment.php",
    method: "GET",
    success: function (data) {
      const items = typeof data === "string" ? JSON.parse(data) : data;
      document.getElementById("inventoryCount").textContent = items.length;
    },
    error: function () {
      document.getElementById("inventoryCount").textContent = 0;
    }
  });
}

updateInventoryCount();

function logout() {
  sessionStorage.removeItem('inventoryUnlocked');
  window.location.href = 'logout.php';
}

window.addEventListener('pageshow', function (event) {
  if (event.persisted) window.location.reload();
});

// ── PASSWORD: always required, no caching ──
let inventoryUnlocked = false;
window.inventoryUnlocked = false;

const sectionMap = {
  "Dashboard": "manageSection",
  "Schedule": "scheduleSection",
  "Borrow Requests": "queueSection",
  "Inventory": "inventorySection",
  "Reports": "reportsSection"
};

function navigateToSection(sectionName) {
  for (const key in sectionMap) {
    const el = document.getElementById(sectionMap[key]);
    if (el) el.style.display = "none";
  }

  if (!sectionMap.hasOwnProperty(sectionName)) sectionName = "Dashboard";

  const targetEl = document.getElementById(sectionMap[sectionName]);
  if (targetEl) targetEl.style.display = "block";

  if (sectionName === "Schedule") {
    if (typeof calendar !== "undefined") calendar.render();
    else if (typeof initCalendar === "function") initCalendar();
  } else if (sectionName === "Inventory") {
    if (typeof loadInventory === "function") loadInventory();
  }

  setActiveSidebarItem(sectionName);
}

function setActiveSidebarItem(sectionName) {
  const navItems = document.querySelectorAll(".sidebar .nav-item[data-section]");
  const target = sectionName.trim().toLowerCase();
  navItems.forEach(item => {
    const itemSection = item.getAttribute("data-section")?.trim().toLowerCase();
    item.classList.toggle("active", itemSection === target);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  navigateToSection("Dashboard");
});

$('.nav-item').on('click', function () {
  const section = $(this).data('section');
  if (section === 'Inventory') openPasswordModal();
  else if (section) navigateToSection(section);
});

document.getElementById("inventoryNav").addEventListener("click", e => {
  e.preventDefault();
  openPasswordModal();
});

$(document).ready(function () {
  const $sliderWrapper  = $('.slider-wrapper');
  const $slides         = $('.slide');
  const $dotsContainer  = $('.dots-container');
  const slideCount      = $slides.length;
  let currentIndex = 0;
  let interval;

  const scheduleIndex = $slides.index($slides.filter('[data-target="Schedule"]'));

  for (let i = 0; i < slideCount; i++) {
    const dot = $('<span>').addClass('dot').attr('data-index', i);
    if (i === 0) dot.addClass('active');
    $dotsContainer.append(dot);
  }

  const $dots = $('.dot');

  function goToSlide(index) {
    if (index < 0) index = slideCount - 1;
    if (index >= slideCount) index = 0;
    currentIndex = index;
    $sliderWrapper.css('transform', `translateX(${-index * 100}%)`);
    $dots.removeClass('active');
    $dots.eq(index).addClass('active');

    if (index === scheduleIndex && typeof miniCalendar !== 'undefined') {
      setTimeout(() => { miniCalendar.render(); miniCalendar.updateSize(); }, 50);
    }
  }

  function startAutoSlide() { interval = setInterval(() => goToSlide(currentIndex + 1), 5000); }
  function stopAutoSlide()  { clearInterval(interval); }

  $dots.on('click', function () {
    stopAutoSlide();
    goToSlide($(this).data('index'));
    startAutoSlide();
  });

  $slides.on('click', function () {
    const target = $(this).data('target');
    if (!target) return;
    stopAutoSlide();
    if (target === "Inventory") openPasswordModal();
    else { navigateToSection(target); setActiveSidebarItem(target); }
  });

  goToSlide(0);
  startAutoSlide();
});

document.addEventListener("DOMContentLoaded", function () {
  const today    = new Date();
  const yyyyMmDd = today.toISOString().split("T")[0];
  document.getElementById("currentDate").textContent = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  fetch(`fetch_borrow_stats.php?date=${yyyyMmDd}`)
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        const s = data.stats;
        document.getElementById("totalRequests").textContent    = s.total    || 0;
        document.getElementById("acceptedRequests").textContent = s.accepted || 0;
        document.getElementById("rejectedRequests").textContent = s.rejected || 0;
        document.getElementById("pendingRequests").textContent  = s.pending  || 0;
      }
    })
    .catch(err => console.error("Fetch error:", err));
});

let miniCalendar;

document.addEventListener('DOMContentLoaded', function () {
  const previewEl = document.getElementById('calendarPreview');
  if (previewEl) {
    miniCalendar = new FullCalendar.Calendar(previewEl, {
      initialView: 'dayGridMonth', headerToolbar: false, height: 280, fixedWeekCount: false, events: [],
      datesSet: function () { refreshCalendarStats("#calendarPreview"); }
    });
    miniCalendar.render();
  }
});

let calendar;
function initCalendar() {
  const calendarEl = document.getElementById("calendar");
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridYear' },
    datesSet: function () { refreshCalendarStats("#calendar"); }
  });
  calendar.render();
  refreshCalendarStats();
}

function refreshCalendarStats(containerSelector = "#calendar") {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.querySelectorAll('.custom-stats').forEach(el => el.remove());

  container.querySelectorAll('.fc-daygrid-day').forEach(dayCell => {
    const dateStr = dayCell.getAttribute('data-date');
    if (!dateStr) return;

    fetch(`fetch_borrow_stats.php?date=${dateStr}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const s = data.stats;
          if (s.total > 0 || s.accepted > 0 || s.rejected > 0 || s.pending > 0) {
            const isPreview = containerSelector === "#calendarPreview";
            const content = isPreview
              ? `<div class="custom-stats" style="display:flex;flex-direction:column;justify-content:center;align-items:center;font-size:0.75em;height:100%;text-align:center;">
                   <div style="font-weight:bold;">Total: ${s.total}</div>
                   <div style="color:green;">Accepted: ${s.accepted}</div>
                   <div style="color:red;">Rejected: ${s.rejected}</div>
                   <div style="color:orange;">Pending: ${s.pending}</div>
                 </div>`
              : `<div class="custom-stats" style="font-size:0.75em;margin-top:5px;line-height:1.2;">
                   <div style="font-weight:bold;">Total: ${s.total}</div>
                   <div style="color:green;">Accepted: ${s.accepted}</div>
                   <div style="color:red;">Rejected: ${s.rejected}</div>
                   <div style="color:orange;">Pending: ${s.pending}</div>
                 </div>`;
            const cellFrame = dayCell.querySelector('.fc-daygrid-day-frame');
            if (cellFrame && !cellFrame.querySelector('.custom-stats')) {
              cellFrame.insertAdjacentHTML('beforeend', content);
            }
          }
        }
      })
      .catch(err => console.error('Failed to fetch borrow stats:', err));
  });
}

function loadInventoryPreview() {
  $.ajax({
    url: 'get_equipment.php', method: 'GET',
    success: function (data) {
      const items = typeof data === "string" ? JSON.parse(data) : data;
      const previewBody = document.getElementById('inventoryPreviewBody');
      previewBody.innerHTML = "";
      items.slice(0, 10).forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="centered-cell">${item.equipment_id}</td>
          <td class="centered-cell">${item.equipment_name}</td>
          <td class="centered-cell">${item.serial_number || ""}</td>
          <td class="centered-cell">${item.internal_sn || ""}</td>
          <td class="centered-cell">${item.account_person || ""}</td>
          <td class="centered-cell">${item.total_qty || 0}</td>
          <td class="centered-cell">${item.working_qty || 0}</td>
          <td class="centered-cell">${item.not_working_qty || 0}</td>
          <td class="centered-cell">${item.description || ""}</td>
        `;
        previewBody.appendChild(row);
      });
      document.getElementById('inventoryCount').textContent = items.length;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => { loadInventoryPreview(); });

function updateBorrowRequestsOverview() {
  fetch("fetch_borrow_requests.php")
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        document.getElementById("totalRequestCount").textContent = json.data.length;
        const recentList = document.getElementById("recentBorrowRequests");
        if (recentList) {
          recentList.innerHTML = "";
          json.data.slice(0, 5).forEach(entry => {
            const li = document.createElement("li");
            li.textContent = `Guest #: ${entry.borrowRequest.guest_number} — ${entry.borrowRequest.borrower_name}`;
            recentList.appendChild(li);
          });
        }
      }
    })
    .catch(err => console.error("Failed to load borrow requests overview:", err));
}

updateBorrowRequestsOverview();

document.addEventListener("DOMContentLoaded", () => { initCalendar(); });

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  const year  = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day   = today.getDate().toString().padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const previewDiv = document.getElementById('todayStatsPreview');

  fetch(`fetch_borrow_stats.php?date=${dateStr}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const s = data.stats;
        if (s.total > 0 || s.accepted > 0 || s.rejected > 0 || s.pending > 0) {
          previewDiv.innerHTML = `
            <div><strong>Total:</strong> ${s.total}</div>
            <div style="color:green;"><strong>Accepted:</strong> ${s.accepted}</div>
            <div style="color:red;"><strong>Rejected:</strong> ${s.rejected}</div>
            <div style="color:orange;"><strong>Pending:</strong> ${s.pending}</div>
          `;
        } else {
          previewDiv.textContent = "No borrow requests for today.";
        }
      }
    })
    .catch(() => { previewDiv.textContent = "Error loading today's stats."; });
});

document.addEventListener("DOMContentLoaded", () => {
  fetch("fetch_stats.php")
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;
      const w = data.weekly, m = data.monthly;

      document.getElementById("weekLabel").textContent   = getCurrentWeekRange();
      document.getElementById("monthLabel").textContent  = getCurrentMonth();
      document.getElementById("weeklyTotal").textContent     = w.total;
      document.getElementById("weeklyAccepted").textContent  = w.accepted;
      document.getElementById("weeklyRejected").textContent  = w.rejected;
      document.getElementById("weeklyTopItem").textContent   = w.topItem;
      document.getElementById("monthlyTotal").textContent    = m.total;
      document.getElementById("monthlyAccepted").textContent = m.accepted;
      document.getElementById("monthlyRejected").textContent = m.rejected;
      document.getElementById("monthlyTopItem").textContent  = m.topItem;

      renderPieChart("weeklyChart",  "Weekly Requests",  w.accepted, w.rejected, ["#4CAF50","#F44336"]);
      renderPieChart("monthlyChart", "Monthly Requests", m.accepted, m.rejected, ["#4CAF50","#F44336"]);
      if (data.equipmentTrend) renderTrendChart(data.equipmentTrend);
    });

  function getCurrentMonth() {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  function getCurrentWeekRange() {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay();
    const sunday   = new Date(new Date(curr).setDate(first));
    const saturday = new Date(new Date(curr).setDate(first + 6));
    const fmt = d => `${d.getMonth()+1}/${d.getDate()}`;
    return `${fmt(sunday)} - ${fmt(saturday)}`;
  }

  function renderPieChart(canvasId, title, accepted, rejected, colors) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: { labels: ["Accepted","Rejected"], datasets: [{ data: [accepted,rejected], backgroundColor: colors }] },
      options: { responsive: true, plugins: { title: { display: true, text: title }, legend: { position: "bottom" } } }
    });
  }

  function renderTrendChart(trendData) {
    const ctx    = document.getElementById("equipmentTrendChart").getContext("2d");
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const datasets = Object.entries(trendData).map(([item, values], i) => ({
      label: item,
      data: months.map(m => values[m] || 0),
      borderColor: `hsl(${i * 45}, 70%, 50%)`,
      backgroundColor: 'transparent',
      tension: 0.3
    }));
    new Chart(ctx, {
      type: "line",
      data: { labels: months, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { title: { display: true, text: "Monthly Borrowing Frequency" }, legend: { position: "top" } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, title: { display: true, text: "Times Borrowed" } } }
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", () => { loadScheduleStats(); });

function loadBorrowRequests() {
  const startDate = document.getElementById("startDate")?.value;
  const endDate   = document.getElementById("endDate")?.value;

  let url = "fetch_borrow_requests.php";
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate)   params.append("endDate", endDate);
  if (params.toString()) url += `?${params.toString()}`;

  fetch(url)
    .then(res => res.json())
    .then(json => {
      if (!json.success) return;
      const requests  = json.data;
      const container = document.getElementById("borrowQueue");
      container.innerHTML = "";

      if (requests.length === 0) {
        container.innerHTML = `<div style="text-align:left;color:#555;font-style:italic;margin-top:20px;font-size:1.1em;">No borrow requests are available at this time.</div>`;
        return;
      }

      requests.forEach(entry => {
        const request       = entry.borrowRequest;
        const equipmentList = entry.equipmentList;
        borrowRequestMap[request.id] = { ...request, equipment: equipmentList };

        const div = document.createElement("div");
        div.className = "borrow-request";
        div.innerHTML = `
          <strong>Guest Number:</strong> ${request.guest_number}<br />
          <strong>Borrower's Name:</strong> ${request.borrower_name}<br />
          <strong>Student ID:</strong> ${request.student_id}<br />
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
                  <h4 style="margin:4px 0;">EULOGIO "AMANG" RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY</h4>
                  <h4 style="margin:4px 0;">COLLEGE OF ARTS AND SCIENCES</h4>
                  <h4 style="margin:4px 0;">APPLIED PHYSICS DEPARTMENT</h4>
                  <h3 style="margin:10px 0;">Equipment-borrowing Form</h3>
                </td></tr>
                <tr>
                  <td style="padding:5px;text-align:left;"><strong>Guest Login Number:</strong> ${request.guest_number}</td>
                  <td style="padding:5px;text-align:left;"><strong>Date:</strong> ${formatDateToDDMMYYYY(request.date)}</td>
                </tr>
                <tr>
                  <td style="padding:5px;text-align:left;"><strong>Borrower's Name:</strong> ${request.borrower_name}</td>
                  <td style="padding:5px;text-align:left;"><strong>Instructor's Name:</strong> ${request.instructor_name}</td>
                </tr>
                <tr>
                  <td style="padding:5px;text-align:left;"><strong>Student ID:</strong> ${request.student_id}</td>
                  <td style="padding:5px;text-align:left;"><strong>Subject Code:</strong> ${request.subject_code}</td>
                </tr>
                <tr>
                  <td style="padding:5px;text-align:left;"><strong>Date(s) of Usage:</strong> ${formatDateToDDMMYYYY(request.usage_date)}</td>
                  <td style="padding:5px;text-align:left;"><strong>Room:</strong> ${request.room}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:15px;">
                    <table style="width:100%;border-collapse:collapse;" border="1">
                      <thead>
                        <tr style="text-align:center;">
                          <th>Equipment / Material</th><th>Quantity</th><th>Available in the lab?</th><th>Returned on</th><th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody id="equipmentListInForm-${request.id}"></tbody>
                    </table>
                  </td>
                </tr>
                <tr><td colspan="2" style="padding-top:20px;">
                  <strong>Borrower's Declaration of Commitment:</strong><br />
                  <em>"I will be accountable to any damage incurred in the equipment and will return the equipment promptly and in the same working condition it was borrowed."</em>
                </td></tr>
                <tr>
                  <td style="padding-top:30px;text-align:left"><p>Approved by:<br><br>__________________________<br><em>Instructor's Name and Signature</em></p></td>
                  <td style="text-align:right;padding-top:30px;"><p>_________________________________<br><em>Signature over Printed Name of Borrower</em></p></td>
                </tr>
              </table>
            </div>
          </div>
        `;
        container.appendChild(div);
      });

      attachActionHandlers();
    });
}

function clearFilters() {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value   = "";
  loadBorrowRequests();
}

fetch("process_rejected_requests.php")
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      refreshCalendarStats();
      loadBorrowRequestsAndUpdateCount();
    }
  });

function attachActionHandlers() {
  document.querySelectorAll(".accept-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (confirm("Are you sure you want to ACCEPT this borrow request?")) {
        addToReports(id, "Accepted").then(() => { refreshCalendarStats(); loadBorrowRequestsAndUpdateCount(); });
      }
    });
  });

  document.querySelectorAll(".reject-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (confirm("Are you sure you want to REJECT this borrow request?")) {
        addToReports(id, "Rejected").then(() => { refreshCalendarStats(); loadBorrowRequestsAndUpdateCount(); });
      }
    });
  });

  document.querySelectorAll(".view-request-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id   = btn.dataset.id;
      const data = borrowRequestMap[id];
      if (!data) return;

      const formSection = document.getElementById(`borrowerFormSection-${id}`);
      if (!formSection) return;

      if (formSection.style.display === "none" || formSection.style.display === "") {
        formSection.style.display = "block";
        const equipList = document.getElementById(`equipmentListInForm-${id}`);
        equipList.innerHTML = "";
        data.equipment.forEach(eq => {
          const row = document.createElement("tr");
          row.innerHTML = `<td>${eq.equipment_name}</td><td>${eq.quantity}</td><td>${eq.available}</td><td></td><td></td>`;
          equipList.appendChild(row);
        });
      } else {
        formSection.style.display = "none";
      }
    });
  });
}

function formatDateToDDMMYYYY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
}

const borrowRequestMap = {};

function loadBorrowRequestsDashboard() {
  fetch("fetch_borrow_requests.php")
    .then(res => res.json())
    .then(json => {
      if (!json.success) return;
      const requests  = json.data;
      const container = document.getElementById("borrowQueueDashboard");
      container.innerHTML = "";
      document.getElementById("totalRequestCount").textContent = requests.length;

      if (requests.length === 0) {
        container.innerHTML = `<div style="color:#666;font-style:italic;">No borrow requests at the moment.</div>`;
        return;
      }

      const lastEntry     = requests[requests.length - 1];
      const request       = lastEntry.borrowRequest;
      const equipmentList = lastEntry.equipmentList;

      const div = document.createElement("div");
      div.className  = "borrow-request";
      div.dataset.id = request.id;
      div.innerHTML  = `
        <strong>Guest Number:</strong> ${request.guest_number} <br />
        <strong>Borrower's Name:</strong> ${request.borrower_name} <br />
        <div class="borrower-form-section" style="display:block;">
          <table>
            <tr><th>Equipment</th><th>Quantity</th></tr>
            ${equipmentList.map(eq => `<tr><td>${eq.equipment_name}</td><td>${eq.quantity}</td></tr>`).join('')}
          </table>
        </div>
        <div class="click-message">Click the slide to view the full request form.</div>
      `;
      container.appendChild(div);
    });
}

loadBorrowRequestsDashboard();

function addToReports(id, status) {
  const data = borrowRequestMap[id.toString()];
  if (!data) { console.error("No data found for ID", id); return Promise.resolve(); }

  return fetch("update_borrow_status.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `id=${encodeURIComponent(id)}&status=${encodeURIComponent(status)}`
  })
  .then(res => res.json())
  .then(response => {
    if (!response.success) { alert("Failed to update status: " + response.message); return; }

    const reportContainer = document.getElementById("reportsList");
    if (document.getElementById(`borrowRequest-${id}`)) return;

    const div        = document.createElement("div");
    div.className    = "report-entry";
    div.style.border = "1px solid #ccc";
    div.id           = `borrowRequest-${id}`;
    div.style.padding = "10px";
    div.style.margin  = "10px 0";

    const isReturned = data.is_returned || false;

    div.innerHTML = `
      <strong>Status:</strong>
      <span style="color:${isReturned ? "blue" : (status === "Accepted" ? "green" : "red")}">
        ${isReturned ? "Returned" : status}
      </span><br>
      <strong>Guest Number:</strong> ${data.guest_number}<br>
      <strong>Borrower's Name:</strong> ${data.borrower_name}<br>
      <strong>Student ID:</strong> ${data.student_id}<br>
      <button class="view-report-request-btn" data-id="${id}">View Request</button>
      ${isReturned
        ? `<button class="saveReturnInfoBtn" data-id="${id}" disabled style="background-color:#ccc;cursor:not-allowed;">Already Returned</button>`
        : (status === "Accepted" ? `<button class="saveReturnInfoBtn" data-id="${id}">Save Return Info</button>` : '')
      }
      ${isReturned ? `<div class="returned-label" style="color:green;font-weight:bold;margin-top:10px;">✔ Equipment Returned</div>` : ''}
      <div id="reportBorrowerFormSection-${id}" class="borrower-form-section" style="display:none;margin-top:20px;">
        <button class="pdf-hide" onclick="closeBorrowerForm(${id})" style="float:right;margin-bottom:10px;background-color:#c62828;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">Close</button>
        <div class="form-container">
          <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
            <tr><td colspan="2" style="text-align:center;">
              <h4 style="margin:4px 0;">EULOGIO "AMANG" RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY</h4>
              <h4 style="margin:4px 0;">COLLEGE OF ARTS AND SCIENCES</h4>
              <h4 style="margin:4px 0;">APPLIED PHYSICS DEPARTMENT</h4>
              <h3 style="margin:10px 0;">Equipment-borrowing Form</h3>
            </td></tr>
            <tr>
              <td style="padding:5px;text-align:left;"><strong>Guest Login Number:</strong> ${data.guest_number}</td>
              <td style="padding:5px;text-align:left;"><strong>Date:</strong> ${formatDateToDDMMYYYY(data.date)}</td>
            </tr>
            <tr>
              <td style="padding:5px;text-align:left;"><strong>Borrower's Name:</strong> ${data.borrower_name}</td>
              <td style="padding:5px;text-align:left;"><strong>Instructor's Name:</strong> ${data.instructor_name || ""}</td>
            </tr>
            <tr>
              <td style="padding:5px;text-align:left;"><strong>Student ID:</strong> ${data.student_id}</td>
              <td style="padding:5px;text-align:left;"><strong>Subject Code:</strong> ${data.subject_code || ""}</td>
            </tr>
            <tr>
              <td style="padding:5px;text-align:left;"><strong>Date(s) of Usage:</strong> ${formatDateToDDMMYYYY(data.usage_date)}</td>
              <td style="padding:5px;text-align:left;"><strong>Room:</strong> ${data.room || ""}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:15px;">
                <table style="width:100%;border-collapse:collapse;" border="1">
                  <thead>
                    <tr style="text-align:center;">
                      <th>Equipment / Material</th><th>Quantity</th><th>Available in the lab?</th><th>Returned on</th><th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.equipment.map(eq => `
                      <tr>
                        <td>${eq.equipment_name}</td><td>${eq.quantity}</td><td>${eq.available}</td>
                        <td>${status === "Accepted" ? `<input type="date" class="returnedOnInput" value="${eq.returned_on || ''}">` : (eq.returned_on || '')}</td>
                        <td>${status === "Accepted" ? `<input type="text" class="remarksInput" value="${eq.remarks || ''}" placeholder="Enter remarks">` : (eq.remarks || '')}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </td>
            </tr>
            <tr><td colspan="2" style="padding-top:20px;">
              <strong>Borrower's Declaration of Commitment:</strong><br />
              <em>"I will be accountable to any damage incurred in the equipment and will return the equipment promptly and in the same working condition it was borrowed."</em>
            </td></tr>
            <tr>
              <td style="padding-top:30px;text-align:left"><p>Approved by:<br><br>__________________________<br><em>Instructor's Name and Signature</em></p></td>
              <td style="text-align:right;padding-top:30px;"><p>_________________________________<br><em>Signature over Printed Name of Borrower</em></p></td>
            </tr>
          </table>
        </div>
      </div>
    `;

    reportContainer.appendChild(div);

    const recentList = document.getElementById("recentReportsList");
    if (recentList) {
      const li = document.createElement("li");
      li.className   = `status-${(isReturned ? "returned" : status).toLowerCase()}`;
      li.textContent = `${data.guest_number} - ${isReturned ? "Returned" : status}`;
      recentList.prepend(li);
      while (recentList.children.length > 10) recentList.removeChild(recentList.lastChild);
    }

    const reportCountEl = document.getElementById("reportCount");
    if (reportCountEl) reportCountEl.textContent = reportContainer.querySelectorAll(".report-entry").length;

    div.querySelector(".view-report-request-btn").addEventListener("click", () => {
      const formSection = div.querySelector(`#reportBorrowerFormSection-${id}`);
      if (formSection) formSection.style.display = formSection.style.display === "none" ? "block" : "none";
    });

    const saveBtn = div.querySelector(".saveReturnInfoBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const formSection = div.querySelector(`#reportBorrowerFormSection-${id}`);
        if (formSection.style.display === "none") formSection.style.display = "block";

        const firstReturnedOnInput = formSection.querySelector(".returnedOnInput");
        const firstRemarksInput    = formSection.querySelector(".remarksInput");
        let inputToFocus = null;
        if (firstReturnedOnInput && !firstReturnedOnInput.value.trim()) inputToFocus = firstReturnedOnInput;
        else if (firstRemarksInput && !firstRemarksInput.value.trim()) inputToFocus = firstRemarksInput;

        if (inputToFocus) {
          inputToFocus.scrollIntoView({ behavior: "smooth", block: "center" });
          inputToFocus.focus();
          inputToFocus.style.border = "2px solid red";
          setTimeout(() => { inputToFocus.style.border = ""; }, 3000);
        }

        const returnedData = [];
        let hasDataToSave = false;
        formSection.querySelectorAll("tbody tr").forEach(tr => {
          const equipmentName = tr.children[0]?.textContent.trim();
          if (!equipmentName) return;
          const returnedOn = tr.querySelector(".returnedOnInput")?.value.trim() || "";
          const remarks    = tr.querySelector(".remarksInput")?.value.trim()    || "";
          if (returnedOn || remarks) hasDataToSave = true;
          returnedData.push({ equipment_name: equipmentName, returned_on: returnedOn, remarks });
        });

        if (!hasDataToSave) { alert("Please enter return date or remarks before saving."); return; }

        fetch("update_return_info.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ borrow_request_id: id, returned_items: returnedData })
        })
        .then(res => res.json())
        .then(response => {
          if (response.success) {
            alert("Return info saved successfully!");
            const statusSpan = div.querySelector("span");
            if (statusSpan) { statusSpan.textContent = "Returned"; statusSpan.style.color = "blue"; }
            saveBtn.disabled = true; saveBtn.textContent = "Already Returned";
            saveBtn.style.backgroundColor = "#ccc"; saveBtn.style.cursor = "not-allowed";
            const lbl = document.createElement("div");
            lbl.textContent = "✔ Equipment Returned"; lbl.style.color = "green";
            lbl.style.fontWeight = "bold"; lbl.style.marginTop = "10px";
            div.appendChild(lbl);
          } else {
            alert("Failed to save return info: " + response.message);
          }
        })
        .catch(() => alert("Error saving return info."));
      });
    }

    const requestEl = document.querySelector(`.borrow-request button[data-id="${id}"]`)?.closest(".borrow-request");
    if (requestEl) requestEl.remove();

    const borrowQueue        = document.getElementById("borrowQueue");
    const borrowQueueCountEl = document.getElementById("borrowQueueCount");
    if (borrowQueueCountEl && borrowQueue) {
      borrowQueueCountEl.textContent = borrowQueue.querySelectorAll(".borrow-request").length;
    }
  });
}

function updateReportCount() {
  const reportList    = document.getElementById('reportList');
  const pendingCountEl = document.getElementById('pendingRequestCount');
  if (reportList && pendingCountEl) pendingCountEl.textContent = reportList.querySelectorAll('.report-item').length;
}

updateReportCount();

function applyReturnStatusUpdates() {
  fetch("fetch_return_status.php")
    .then(res => res.json())
    .then(data => {
      data.forEach(item => {
        const requestDiv = document.querySelector(`#borrowRequest-${item.borrow_request_id}`);
        if (!requestDiv) return;
        const formSection = requestDiv.querySelector(`#reportBorrowerFormSection-${item.borrow_request_id}`);
        if (!formSection) return;

        formSection.querySelectorAll("tbody tr").forEach(tr => {
          const eqName = tr.children[0]?.textContent.trim().toLowerCase();
          const dbName = item.equipment_name?.trim().toLowerCase();
          if (eqName !== dbName) return;
          const ri = tr.querySelector(".returnedOnInput"); if (ri) ri.value = item.returned_on;
          const rm = tr.querySelector(".remarksInput");    if (rm) rm.value = item.remarks;
        });

        if (!requestDiv.querySelector(".returnedLabel")) {
          const sp = requestDiv.querySelector("span");
          if (sp) { sp.textContent = "Returned"; sp.style.color = "blue"; }
          const sb = requestDiv.querySelector(".saveReturnInfoBtn");
          if (sb) { sb.disabled = true; sb.textContent = "Already Returned"; sb.style.backgroundColor = "#ccc"; sb.style.cursor = "not-allowed"; }
          const lbl = document.createElement("div");
          lbl.className = "returnedLabel"; lbl.textContent = "✔ Equipment Returned";
          lbl.style.color = "green"; lbl.style.fontWeight = "bold"; lbl.style.marginTop = "10px";
          requestDiv.appendChild(lbl);
        }

        if (!requestDiv.querySelector(".downloadPdfBtn")) {
          const pdfBtn = document.createElement("button");
          pdfBtn.textContent = "Download PDF"; pdfBtn.className = "downloadPdfBtn";
          pdfBtn.style.cssText = "margin-top:10px;background-color:#1976d2;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;";
          pdfBtn.onclick = () => generatePDF(formSection);
          requestDiv.appendChild(pdfBtn);
        }
      });
    })
    .catch(err => console.error("Error fetching return status:", err));
}

function generatePDF(container) {
  if (!container) return;
  const wasHidden = container.style.display === "none";
  if (wasHidden) container.style.display = "block";
  const clone   = container.cloneNode(true);
  const closeBtn = clone.querySelector('button[onclick^="closeBorrowerForm"]');
  if (closeBtn) closeBtn.style.display = "none";
  clone.querySelectorAll("input, textarea, select").forEach(input => {
    const span = document.createElement("span");
    span.textContent = input.type === "checkbox" ? (input.checked ? "✔️" : "✖️") : input.value;
    span.style.cssText = "display:inline-block;padding:2px 4px;margin-left:4px;border-radius:3px;";
    input.parentNode.replaceChild(span, input);
  });
  html2pdf().from(clone).set({
    margin: 0.5, filename: 'borrow_form.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
  }).save().then(() => { if (wasHidden) container.style.display = "none"; });
}

function loadReportsFromDatabase() {
  fetch("fetch_borrow_reports.php")
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        json.data.forEach(entry => {
          const request = entry.borrowRequest;
          borrowRequestMap[request.id] = { ...request, equipment: entry.equipmentList };
          addToReports(request.id, request.status);
        });
        applyReturnStatusUpdates();
      }
    });
}

function closeBorrowerForm(id) {
  const f1 = document.getElementById(`borrowerFormSection-${id}`);
  const f2 = document.getElementById(`reportBorrowerFormSection-${id}`);
  if (f1) f1.style.display = "none";
  if (f2) f2.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  loadBorrowRequests();
  loadReportsFromDatabase();
});

const showChangeCredBtn        = document.getElementById('showChangeCredBtn');
const currentPassSection       = document.getElementById('currentPassSection');
const changeCredentialsSection = document.getElementById('change-credentials');
const verifyCurrentPassBtn     = document.getElementById('verifyCurrentPassBtn');
const changeForm               = document.getElementById('change-form');
const currentPasswordInput     = document.getElementById('currentPassword');
const newUsernameInput         = document.getElementById('newUsername');
const newPasswordInput         = document.getElementById('newPassword');
const verifyMessage            = document.getElementById('verifyMessage');
const changeMessage            = document.getElementById('change-message');

showChangeCredBtn.addEventListener('click', () => {
  showChangeCredBtn.style.display = 'none';
  currentPassSection.classList.remove('hidden');
  currentPasswordInput.value = '';
  verifyMessage.textContent  = '';
});

document.getElementById('backFromVerifyBtn').addEventListener('click', () => {
  currentPassSection.classList.add('hidden');
  showChangeCredBtn.style.display = 'inline-block';
  currentPasswordInput.value = '';
  verifyMessage.textContent  = '';
});

document.getElementById('backFromChangeBtn').addEventListener('click', () => {
  changeCredentialsSection.classList.add('hidden');
  showChangeCredBtn.style.display = 'inline-block';
  newUsernameInput.value = '';
  newPasswordInput.value = '';
  changeMessage.textContent = '';
});

verifyCurrentPassBtn.addEventListener('click', () => {
  const password = currentPasswordInput.value.trim();
  if (!password) { alert('Please enter your current password.'); return; }

  fetch('verify_password.php', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('Password verified! You can now change your credentials.');
      currentPassSection.classList.add('hidden');
      changeCredentialsSection.classList.remove('hidden');
      newUsernameInput.value = '';
      newPasswordInput.value = '';
    } else {
      alert(data.message || 'Incorrect password. Please try again.');
    }
  })
  .catch(() => { alert('Error verifying password. Please try again later.'); });
});

changeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newUsername = newUsernameInput.value.trim();
  const newPassword = newPasswordInput.value.trim();
  if (!newUsername || !newPassword) { alert('Username and password cannot be empty.'); return; }

  fetch('update_credentials.php', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: newUsername, password: newPassword })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('Credentials updated successfully!');
      changeCredentialsSection.classList.add('hidden');
      showChangeCredBtn.style.display = 'inline-block';
      currentPasswordInput.value = '';
    } else {
      alert(data.message || 'Failed to update credentials.');
    }
  })
  .catch(() => { alert('An error occurred while updating credentials.'); });
});

// ── PASSWORD MODAL ──
function openPasswordModal() {
  document.getElementById("confirmPassword").value     = '';
  document.getElementById("passwordError").style.display = 'none';
  document.getElementById("passwordModal").style.display = "flex";
}

function closePasswordModal() {
  document.getElementById("passwordModal").style.display = "none";
  document.getElementById("confirmPassword").value     = '';
  document.getElementById("passwordError").style.display = 'none';
}

function verifyPassword() {
  const password = document.getElementById("confirmPassword").value;

  fetch('inventory_password.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === 'success') {
      closePasswordModal();
      navigateToSection("Inventory");
    } else {
      document.getElementById("passwordError").style.display = 'block';
    }
  })
  .catch(err => { console.error("Error verifying password:", err); });
}

fetch("fetch_borrow_requests.php")
  .then(res => res.json())
  .then(json => {
    if (json.success) document.getElementById("borrowQueueCount").textContent = json.data.length;
  })
  .catch(err => console.error("Error fetching borrow requests count:", err));