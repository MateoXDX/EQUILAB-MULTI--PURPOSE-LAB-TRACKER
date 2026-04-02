function openAddEquipmentModal() {
  document.getElementById("addEquipmentModal").classList.add("is-open");
}

function closeAddEquipmentModal() {
  document.getElementById("addEquipmentModal").classList.remove("is-open");
}

document.addEventListener("DOMContentLoaded", () => {

document.getElementById("addEquipmentBtn").onclick = () => {
 
  selectedItemData = null;
  canEditQty = true;

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


      document.getElementById("editEquipmentBtn").onclick = () => {
    if (!selectedItemData) {
      alert("Please select an equipment item to edit.");
      return;
    }

    fetch("fetch_equipment.php")
      .then(response => response.json())
      .then(data => {
        const equipment = data.find(eq => eq.equipment_id === selectedItemData.equipment_id);
        if (!equipment) {
          alert("Equipment not found.");
          return;
        }

        const available = parseInt(equipment.available);
        const working = parseInt(equipment.working_qty);
        canEditQty = (available === working);

        document.getElementById("equipmentID").value = selectedItemData.equipment_id;
        document.getElementById("equipmentName").value = selectedItemData.equipment_name;
        document.getElementById("serialNumber").value = selectedItemData.serial_number;
        document.getElementById("internalSN").value = selectedItemData.internal_sn;
        document.getElementById("accountablePerson").value = selectedItemData.account_person;
        document.getElementById("totalQty").value = selectedItemData.total_qty;
        document.getElementById("workingQty").value = selectedItemData.working_qty;
        document.getElementById("notWorkingQty").value = selectedItemData.not_working_qty;
        document.getElementById("description").value = selectedItemData.description;

        if (!canEditQty) {
          alert("This equipment is still borrowed. Quantity fields cannot be edited.");
        }

        document.getElementById("totalQty").disabled = !canEditQty;
        document.getElementById("workingQty").disabled = !canEditQty;
        document.getElementById("notWorkingQty").disabled = !canEditQty;

        openAddEquipmentModal();
      })
      .catch(err => {
        console.error("Fetch error:", err);
        alert("Failed to fetch equipment data.");
      });
  };

    document.getElementById("submitEquipmentBtn").onclick = function (event) {
      event.preventDefault();
    
      const equipmentID = document.getElementById("equipmentID").value.trim();
      const equipmentName = document.getElementById("equipmentName").value.trim();
      const serialNumber = document.getElementById("serialNumber").value.trim();
      const internalSN = document.getElementById("internalSN").value.trim();
      const totalQty = document.getElementById("totalQty").value.trim();
      const workingQty = document.getElementById("workingQty").value.trim();
      const notWorkingQty = document.getElementById("notWorkingQty").value.trim();
      const description = document.getElementById("description").value.trim();
      const accountablePerson = document.getElementById("accountablePerson").value.trim();
    
      if (
        equipmentID === '' ||
        equipmentName === '' ||
        totalQty === '' ||
        workingQty === '' ||
        notWorkingQty === '' ||
        accountablePerson === ''
      ) {
        alert("Please fill in all required fields.");
        return;
      }
    
      const isEditing = selectedItemData && selectedItemData.equipment_id === equipmentID;
      
      if (!isEditing && currentEquipmentIDs.has(equipmentID)) {
        alert("Equipment ID already exists. Please use a unique ID.");
        return;
      }

      if (isEditing && equipmentID !== selectedItemData.equipment_id && currentEquipmentIDs.has(equipmentID)) {
        alert("Cannot change Equipment ID to an existing one. Please use a unique ID.");
        return;
      }
    
      $.ajax({
        url: isEditing ? "edit_equipment.php" : "add_equipment.php",
        method: "POST",
        data: {
          equipmentID,
          equipmentName,
          serialNumber,
          internalSN,
          totalQty,
          workingQty,
          notWorkingQty,
          description,
          accountablePerson
        },
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
            loadInventoryPreview()
          } else {
            alert("Error: " + data.message);
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        }
      });
    };

document.getElementById("deleteEquipmentBtn").onclick = function() {
  if (!selectedItemData) {
    alert("Please select an equipment item to delete.");
    return;
  }

  fetch("fetch_equipment.php")
    .then(response => response.json())
    .then(data => {
      const equipment = data.find(eq => eq.equipment_id === selectedItemData.equipment_id);
      if (!equipment) {
        alert("Equipment not found.");
        return;
      }

      const available = parseInt(equipment.available);
      const working = parseInt(equipment.working_qty);

      if (available !== working) {
        alert("This equipment is currently borrowed. It cannot be deleted.");
        return;
      }

      if (confirm("Are you sure you want to delete this equipment?")) {
        $.ajax({
          url: "delete_equipment.php",
          method: "POST",
          data: { equipmentID: selectedItemData.equipment_id },
          success: function(response) {
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
          error: function(xhr, status, error) {
            console.error("Error:", error);
          }
        });
      }
    })
    .catch(err => {
      console.error("Fetch error:", err);
      alert("Failed to fetch equipment data.");
    });
};


document.getElementById("downloadExcelBtn").onclick = () => {
  window.location.href = "export_equipment_excel.php";
};

$('#uploadExcelBtn').on('click', function() {
  $('#uploadExcelInput').click();
});

document.getElementById("uploadExcelInput").addEventListener('change', function() {
  const fileInput = this;
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select an Excel file first.");
    return;
  }

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
      if (response.success) {
        alert("Equipment imported successfully!");
        loadInventory(); 
      } else {
        alert("Import failed: " + response.message);
      }
      fileInput.value = "";
    },
    error: function (xhr, status, error) {
      console.error("Upload error:", error);
      alert("Upload failed, please try again.");
      fileInput.value = "";
    },
  });
});


  const categorySelect = document.getElementById("categorySelect");
  const searchInput = document.getElementById("searchInput");
  const equipmentList = document.getElementById("equipmentList");
  
function filterInventory() {
  const filterValue = categorySelect.value.toLowerCase();
  const searchText = searchInput.value.toLowerCase();

  const rows = equipmentList.querySelectorAll("tr");

  rows.forEach(row => {
    const equipmentID = row.children[0].textContent.trim();
    const firstChar = equipmentID.charAt(0).toLowerCase();
    const rowText = row.textContent.toLowerCase();

    const workingQty = parseInt(row.children[6].textContent.trim(), 10);
    const notWorkingQty = parseInt(row.children[7].textContent.trim(), 10);

    const categoryMap = {
      "equipment": "e",
      "measuring": "m",
      "chemicals": "c",
      "books": "b"
    };

    let show = true;

    if (filterValue === "working") {
      show = workingQty > 0;
    } else if (filterValue === "notworking") {
      show = notWorkingQty > 0;
    } else if (filterValue !== "all") {
      const expectedChar = categoryMap[filterValue];
      show = firstChar === expectedChar;
    }

    const searchMatch = rowText.includes(searchText);
    row.style.display = (show && searchMatch) ? "" : "none";
  });
}


  categorySelect.addEventListener("change", filterInventory);
  searchInput.addEventListener("input", filterInventory);
      
    let selectedRow = null;
    let selectedItemData = null;
    
let currentEquipmentIDs = new Set();

function loadInventory() {
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
        row.setAttribute("data-category", item.category);
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

        row.addEventListener("click", () => {
          if (selectedRow) selectedRow.classList.remove("selected");
          row.classList.add("selected");
          selectedRow = row;
          selectedItemData = item;
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
}

  loadInventory();
});

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


window.addEventListener('pageshow', function(event) {
  if (event.persisted) {
    window.location.reload();
  }
});
let inventoryUnlocked = sessionStorage.getItem('inventoryUnlocked') === 'true';
window.inventoryUnlocked = inventoryUnlocked;


const sectionMap = {
  "Dashboard": "manageSection",
  "Schedule": "scheduleSection",
  "Borrow Requests": "queueSection",
  "Inventory": "inventorySection",
  "Reports": "reportsSection"
};

function navigateToSection(sectionName) {
  for (const key in sectionMap) {
    const sectionId = sectionMap[key];
    const el = document.getElementById(sectionId);
    if (el) el.style.display = "none";
  }

  if (!sectionMap.hasOwnProperty(sectionName)) {
    console.warn(`Unknown section: ${sectionName}, defaulting to Dashboard`);
    sectionName = "Dashboard";
  }

  const targetId = sectionMap[sectionName];
  const targetEl = document.getElementById(targetId);
  if (targetEl) targetEl.style.display = "block";

  if (sectionName === "Schedule") {
    if (typeof calendar !== "undefined") {
      calendar.render();
    } else if (typeof initCalendar === "function") {
      initCalendar();
    }
  } else if (sectionName === "Borrow Requests") {
    if (typeof loadRequests === "function") loadRequests();
  } else if (sectionName === "Inventory") {
    if (typeof loadInventory === "function") loadInventory();
  } else if (sectionName === "Reports") {
    if (typeof loadReports === "function") loadReports();
  }

  setActiveSidebarItem(sectionName);
}

function setActiveSidebarItem(sectionName) {
  const navItems = document.querySelectorAll(".sidebar .nav-item[data-section]");
  const target = sectionName.trim().toLowerCase();

  navItems.forEach(item => {
    const itemSection = item.getAttribute("data-section")?.trim().toLowerCase();
    if (itemSection === target) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  navigateToSection("Dashboard");
});


$('.nav-item').on('click', function (e) {
  const section = $(this).data('section');
  if (section === 'Inventory') {
    if (window.inventoryUnlocked) {
      navigateToSection('Inventory');
    } else {
      openPasswordModal();
    }
  } else {
    navigateToSection(section);
  }
});


document.getElementById("inventoryNav").addEventListener("click", e => {
  e.preventDefault();

  if (inventoryUnlocked) {
    navigateToSection("Inventory");
  } else {
    openPasswordModal(); 
  }
});


function resetInventoryAccess() {
  inventoryUnlocked = false;
}

$(document).ready(function () {
  const $sliderWrapper = $('.slider-wrapper');
  const $slides = $('.slide');
  const $dotsContainer = $('.dots-container');
  const slideCount = $slides.length;
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

    const translateX = -index * 100;
    $sliderWrapper.css('transform', `translateX(${translateX}%)`);

    $dots.removeClass('active');
    $dots.eq(index).addClass('active');

    if (index === scheduleIndex && typeof miniCalendar !== 'undefined') {
      setTimeout(() => {
        miniCalendar.render();
        miniCalendar.updateSize();
      }, 50);
    }
  }

  function startAutoSlide() {
    interval = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 5000);
  }

  function stopAutoSlide() {
    clearInterval(interval);
  }

  $dots.on('click', function () {
    stopAutoSlide();
    const index = $(this).data('index');
    goToSlide(index);
    startAutoSlide();
  });

$slides.on('click', function () {
  const target = $(this).data('target');
  if (!target) return;

  stopAutoSlide();

  if (target === "Inventory") {
    if (window.inventoryUnlocked) {
      navigateToSection("Inventory");
      setActiveSidebarItem("Inventory"); 
    } else {
      openPasswordModal();
    }
  } else {
    navigateToSection(target);
    setActiveSidebarItem(target);
  }
});



  goToSlide(0);
  startAutoSlide();
});

document.addEventListener("DOMContentLoaded", function () {
  const today = new Date();
  const yyyyMmDd = today.toISOString().split("T")[0];
  const formatted = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  document.getElementById("currentDate").textContent = formatted;

  fetch(`fetch_borrow_stats.php?date=${yyyyMmDd}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const stats = data.stats;
        document.getElementById("totalRequests").textContent = stats.total || 0;
        document.getElementById("acceptedRequests").textContent = stats.accepted || 0;
        document.getElementById("rejectedRequests").textContent = stats.rejected || 0;
        document.getElementById("pendingRequests").textContent = stats.pending || 0;
      } else {
        console.error("Failed to fetch stats:", data.message);
      }
    })
    .catch(err => console.error("Fetch error:", err));
});

let miniCalendar; 

document.addEventListener('DOMContentLoaded', function () {
  const previewEl = document.getElementById('calendarPreview');

  if (previewEl) {
    miniCalendar = new FullCalendar.Calendar(previewEl, {
      initialView: 'dayGridMonth',
      headerToolbar: false,
      height: 280,
      fixedWeekCount: false,
      events: [],
      datesSet: function () {
        refreshCalendarStats("#calendarPreview");
      }
    });

    miniCalendar.render();
  }
});


let calendar;
function initCalendar() {
  const calendarEl = document.getElementById("calendar");

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridYear'
    },

    datesSet: function(info) {
    refreshCalendarStats("#calendar");
    }
  });

  calendar.render();
  refreshCalendarStats();
}

function refreshCalendarStats(containerSelector = "#calendar") {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.querySelectorAll('.custom-stats').forEach(el => el.remove());

  const dayCells = container.querySelectorAll('.fc-daygrid-day');

  dayCells.forEach(dayCell => {
    const dateStr = dayCell.getAttribute('data-date');
    if (!dateStr) return;

    fetch(`fetch_borrow_stats.php?date=${dateStr}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const stats = data.stats;
          if (stats.total > 0 || stats.accepted > 0 || stats.rejected > 0 || stats.pending > 0) {
            let content = "";
          if (containerSelector === "#calendarPreview") {
            content = `
              <div class="custom-stats" style="
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                font-size: 0.75em;
                height: 100%;
                text-align: center;
              ">
                <div style="font-weight: bold; margin-bottom: 4px;">Total: ${stats.total}</div>
                <div style="color: green;">Accepted: ${stats.accepted}</div>
                <div style="color: red;">Rejected: ${stats.rejected}</div>
                <div style="color: orange;">Pending: ${stats.pending}</div>
              </div>
            `;
          }
          else {
              content = `
                <div class="custom-stats" style="font-size: 0.75em; margin-top: 5px; line-height: 1.2;">
                  <div style="font-weight: bold; margin-bottom: 4px;">Total: ${stats.total}</div>
                  <div style="color: green;">Accepted: ${stats.accepted}</div>
                  <div style="color: red;">Rejected: ${stats.rejected}</div>
                  <div style="color: orange;">Pending: ${stats.pending}</div>
                </div>
              `;
            }

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
        url: 'get_equipment.php',
        method: 'GET',
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

document.addEventListener("DOMContentLoaded", () => {
    loadInventoryPreview();
});

function updateBorrowRequestsOverview() {
  fetch("fetch_borrow_requests.php")
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        const requests = json.data;
        const totalCountElem = document.getElementById("totalRequestCount");
        const recentList = document.getElementById("recentBorrowRequests");

        totalCountElem.textContent = requests.length;
        recentList.innerHTML = ""; 

        requests.slice(0, 5).forEach(entry => {
          const request = entry.borrowRequest;
          const li = document.createElement("li");
          li.textContent = `Guest #: ${request.guest_number} — ${request.borrower_name}`;
          recentList.appendChild(li);
        });
      }
    })
    .catch(err => {
      console.error("Failed to load borrow requests overview:", err);
    });
}

updateBorrowRequestsOverview();

document.addEventListener("DOMContentLoaded", () => {
  initCalendar();
});

document.addEventListener("DOMContentLoaded", () => {
  const dateSpan = document.getElementById('currentDate');
  const today = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  dateSpan.textContent = today.toLocaleDateString(undefined, options);

  const previewDiv = document.getElementById('todayStatsPreview');

  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  fetch(`fetch_borrow_stats.php?date=${dateStr}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const stats = data.stats;
        if (stats.total > 0 || stats.accepted > 0 || stats.rejected > 0 || stats.pending > 0) {
          previewDiv.innerHTML = `
            <div><strong>Total:</strong> ${stats.total}</div>
            <div style="color: green;"><strong>Accepted:</strong> ${stats.accepted}</div>
            <div style="color: red;"><strong>Rejected:</strong> ${stats.rejected}</div>
            <div style="color: orange;"><strong>Pending:</strong> ${stats.pending}</div>
          `;
        } else {
          previewDiv.textContent = "No borrow requests for today.";
        }
      } else {
        previewDiv.textContent = "Failed to load today's stats.";
      }
    })
    .catch(() => {
      previewDiv.textContent = "Error loading today's stats.";
    });
});

document.addEventListener("DOMContentLoaded", () => {
  fetch("fetch_stats.php")
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;

      const w = data.weekly;
      const m = data.monthly;

      document.getElementById("weekLabel").textContent = getCurrentWeekRange();
      document.getElementById("monthLabel").textContent = getCurrentMonth();

      document.getElementById("weeklyTotal").textContent = w.total;
      document.getElementById("weeklyAccepted").textContent = w.accepted;
      document.getElementById("weeklyRejected").textContent = w.rejected;
      document.getElementById("weeklyTopItem").textContent = w.topItem;

      document.getElementById("monthlyTotal").textContent = m.total;
      document.getElementById("monthlyAccepted").textContent = m.accepted;
      document.getElementById("monthlyRejected").textContent = m.rejected;
      document.getElementById("monthlyTopItem").textContent = m.topItem;

      renderPieChart("weeklyChart", "Weekly Requests", w.accepted, w.rejected, ["#4CAF50", "#F44336"]);
      renderPieChart("monthlyChart", "Monthly Requests", m.accepted, m.rejected, ["#4CAF50", "#F44336"]);

      if (data.equipmentTrend) {
        renderTrendChart(data.equipmentTrend);
      }
    });

  function getCurrentMonth() {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  function getCurrentWeekRange() {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay(); // Sunday
    const last = first + 6; // Saturday
    const sunday = new Date(curr.setDate(first));
    const saturday = new Date(curr.setDate(last));

    const format = d => `${d.getMonth() + 1}/${d.getDate()}`;
    return `${format(sunday)} - ${format(saturday)}`;
  }

  function renderPieChart(canvasId, title, accepted, rejected, colors) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Accepted", "Rejected"],
        datasets: [{
          data: [accepted, rejected],
          backgroundColor: colors
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title
          },
          legend: {
            position: "bottom"
          }
        }
      }
    });
  }

  function renderTrendChart(trendData) {
    const ctx = document.getElementById("equipmentTrendChart").getContext("2d");
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
      data: {
        labels: months,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Monthly Borrowing Frequency"
          },
          legend: {
            position: "top"
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0
            },
            title: {
              display: true,
              text: "Times Borrowed"
            }
          }
        }
      }
    });
  }
});

// Call this when the schedule section is shown
document.addEventListener("DOMContentLoaded", () => {
  loadScheduleStats();
});

function loadBorrowRequests() {
  const startDate = document.getElementById("startDate")?.value;
  const endDate = document.getElementById("endDate")?.value;

  let url = "fetch_borrow_requests.php";
  const params = new URLSearchParams();

  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  fetch(url)
    .then((res) => res.json())
    .then((json) => {
      if (json.success) {
        const requests = json.data;
        const container = document.getElementById("borrowQueue");
        container.innerHTML = ""; 

        if (requests.length === 0) {
          container.innerHTML = `
            <div style="
              text-align: left; 
              color: #555; 
              font-style: italic; 
              margin-top: 20px; 
              font-size: 1.1em;
            ">
              No borrow requests are available at this time. Please check back later for updates.
            </div>
          `;
          return; 
        }

        requests.forEach((entry) => {
          const request = entry.borrowRequest;
          const equipmentList = entry.equipmentList;

          borrowRequestMap[request.id] = {
            ...request,
            equipment: equipmentList,
          };

          const div = document.createElement("div");
          div.className = "borrow-request";
          div.innerHTML = `
            <strong>Guest Number:</strong> ${request.guest_number}<br />
            <strong>Borrower's Name:</strong> ${request.borrower_name}<br />
            <strong>Student ID:</strong> ${request.student_id}<br />
            <button class="view-request-btn" data-id="${request.id}">View Request</button>
            <div class="action-buttons" style="margin-top: 10px;">
              <button class="accept-btn" data-id="${request.id}" style="background-color: #2e7d32; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Accept</button>
              <button class="reject-btn" data-id="${request.id}" style="background-color: #c62828; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Reject</button>
            </div>
            <div id="borrowerFormSection-${request.id}" class="borrower-form-section" style="display: none; margin-top: 20px;">
              <button onclick="closeBorrowerForm(${request.id})" style="float: right; margin-bottom: 10px; background-color: #c62828; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Close</button>
              <div class="form-container">
                <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif;">
                  <!-- Header -->
                  <tr>
                    <td colspan="2" style="text-align:center;">
                      <h4 style="margin: 4px 0;">EULOGIO “AMANG” RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY</h4>
                      <h4 style="margin: 4px 0;">COLLEGE OF ARTS AND SCIENCES</h4>
                      <h4 style="margin: 4px 0;">APPLIED PHYSICS DEPARTMENT</h4>
                      <h3 style="margin: 10px 0;">Equipment-borrowing Form</h3>
                    </td>
                  </tr>

                  <!-- Borrower Details -->
                  <tr>
                    <td style="padding: 5px; text-align: left;">
                      <strong>Guest Login Number:</strong>
                      <span id="borrowerGuestNumber-${request.id}">${request.guest_number}</span>
                    </td>
                    <td style="padding: 5px; text-align: left">
                      <strong>Date:</strong>
                        <span id="borrowDate-${request.id}">${formatDateToDDMMYYYY(request.date)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 5px; text-align: left">
                      <strong>Borrower's Name:</strong>
                      <span id="borrowerName-${request.id}">${request.borrower_name}</span>
                    </td>
                    <td style="padding: 5px; text-align: left">
                      <strong>Instructor's Name:</strong>
                      <span id="instructorName-${request.id}">${request.instructor_name}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 5px; text-align: left">
                      <strong>Student ID:</strong>
                      <span id="studentID-${request.id}">${request.student_id}</span>
                    </td>
                    <td style="padding: 5px; text-align: left">
                      <strong>Subject Code:</strong>
                      <span id="subjectCode-${request.id}">${request.subject_code}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 5px; text-align: left">
                      <strong>Date(s) of Usage of Equipment:</strong>
                      <span id="usageDate-${request.id}">${formatDateToDDMMYYYY(request.usage_date)}</span>
                    </td>
                    <td style="padding: 5px; text-align: left">
                      <strong>Room:</strong>
                      <span id="room-${request.id}">${request.room}</span>
                    </td>
                  </tr>

                  <!-- Equipment Table Header -->
                  <tr>
                    <td colspan="2" style="padding-top: 15px;">
                      <table style="width:100%; border-collapse: collapse;" border="1">
                        <thead>
                          <tr style="text-align: center;">
                            <th>Equipment / Material</th>
                            <th>Quantity</th>
                            <th>Available in the lab?</th>
                            <th>Returned on</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>
                        <tbody id="equipmentListInForm-${request.id}">
                          <!-- Dynamically inserted equipment rows go here -->
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <!-- Declaration -->
                  <tr>
                    <td colspan="2" style="padding-top: 20px;">
                      <strong>Borrower’s Declaration of Commitment:</strong><br />
                      <em>“I will be accountable to any damage incurred in the equipment and will return the equipment promptly and in the same working condition it was borrowed.”</em>
                    </td>
                  </tr>

                  <!-- Signatures -->
                  <tr>
                    <td style="padding-top: 30px; text-align:left">
                      <p>Approved by:<br><br>__________________________<br>
                      <em>Instructor’s Name and Signature</em></p>
                    </td>
                    <td style="text-align:right; padding-top: 30px;">
                      <p>_________________________________<br>
                      <em>Signature over Printed Name of Borrower</em></p>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          `;
          container.appendChild(div);
        });

        attachActionHandlers(); 
      }
    });
}

function clearFilters() {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  loadBorrowRequests(); // reload all
}

fetch("process_rejected_requests.php")
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log(`${data.updated} item(s) updated from rejected borrow requests.`);
      refreshCalendarStats();
      loadBorrowRequestsAndUpdateCount(); 
    }
  });

  
function attachActionHandlers() {
  document.querySelectorAll(".accept-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const confirmAccept = confirm("Are you sure you want to ACCEPT this borrow request?");
      if (confirmAccept) {
        addToReports(id, "Accepted").then(() => {
          refreshCalendarStats();
          loadBorrowRequestsAndUpdateCount(); 
        });
      }
    });
  });

  document.querySelectorAll(".reject-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const confirmReject = confirm("Are you sure you want to REJECT this borrow request?");
      if (confirmReject) {
        addToReports(id, "Rejected").then(() => {
          refreshCalendarStats();
          loadBorrowRequestsAndUpdateCount(); 
        });
      }
    });
  });

  document.querySelectorAll(".view-request-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const data = borrowRequestMap[id];
      if (!data) return;

      const formSection = document.getElementById(`borrowerFormSection-${id}`);
      if (!formSection) return;

      if (formSection.style.display === "none" || formSection.style.display === "") {
        formSection.style.display = "block";

        const equipmentList = document.getElementById(`equipmentListInForm-${id}`);
        equipmentList.innerHTML = "";
        data.equipment.forEach((eq) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${eq.equipment_name}</td>
            <td>${eq.quantity}</td>
            <td>${eq.available}</td>
            <td></td>
            <td></td>
          `;
          equipmentList.appendChild(row);
        });
      } else {
        formSection.style.display = "none";
      }
    });
  });
}

function formatDateToDDMMYYYY(dateStr) {
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
}

  const borrowRequestMap = {};
function loadBorrowRequestsDashboard() {
  fetch("fetch_borrow_requests.php")
    .then(res => res.json())
    .then(json => {
      if (!json.success) return;

      const requests = json.data;
      const container = document.getElementById("borrowQueueDashboard");
      container.innerHTML = "";

      document.getElementById("totalRequestCount").textContent = requests.length;

      if (requests.length === 0) {
        container.innerHTML = `<div style="color: #666; font-style: italic;">No borrow requests at the moment.</div>`;
        return;
      }

      const lastEntry = requests[requests.length - 1];
      const request = lastEntry.borrowRequest;
      const equipmentList = lastEntry.equipmentList;

      const div = document.createElement("div");
      div.className = "borrow-request";
      div.dataset.id = request.id;

      div.innerHTML = `
        <strong>Guest Number:</strong> ${request.guest_number} <br />
        <strong>Borrower's Name:</strong> ${request.borrower_name} <br />
        <div class="borrower-form-section" style="display: block;">
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


function formatDateToDDMMYYYY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr; 

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

function addToReports(id, status) {
  const data = borrowRequestMap[id.toString()];
  if (!data) {
    console.error("No data found for ID", id);
    return;
  }

  fetch("update_borrow_status.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `id=${encodeURIComponent(id)}&status=${encodeURIComponent(status)}`
  })
  .then(res => res.json())
  .then(response => {
    if (response.success) {
      const reportContainer = document.getElementById("reportsList");

      const existingEntry = document.getElementById(`borrowRequest-${id}`);
    if (existingEntry) {
      console.warn(`Report entry for ID ${id} already exists.`);
      return; // Prevent duplicate entry
    }

    const div = document.createElement("div");
    div.className = "report-entry";
    div.style.border = "1px solid #ccc";
    div.id = `borrowRequest-${id}`; 
    div.style.padding = "10px";
    div.style.margin = "10px 0";

    const isReturned = data.is_returned || false;

      div.innerHTML = `
        <strong>Status:</strong> 
          <span style="color: ${isReturned ? "blue" : (status === "Accepted" ? "green" : "red")}">
            ${isReturned ? "Returned" : status}
          </span><br>
        <strong>Guest Number:</strong> ${data.guest_number}<br>
        <strong>Borrower's Name:</strong> ${data.borrower_name}<br>
        <strong>Student ID:</strong> ${data.student_id}<br>
        <button class="view-report-request-btn" data-id="${id}">View Request</button>
        ${isReturned ? 
          `<button class="saveReturnInfoBtn" data-id="${id}" disabled style="background-color:#ccc; cursor:not-allowed;">
            Already Returned
          </button>` : 
          (status === "Accepted" ? `<button class="saveReturnInfoBtn" data-id="${id}">Save Return Info</button>` : '')
        }
        ${isReturned ? `<div class="returned-label" style="color: green; font-weight: bold; margin-top: 10px;">
            ✔ Equipment Returned
          </div>` : ''}
        <div id="reportBorrowerFormSection-${id}" class="borrower-form-section" style="display: none; margin-top: 20px;">
        <button class="pdf-hide" onclick="closeBorrowerForm(${id})" style="float: right; margin-bottom: 10px; background-color: #c62828; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Close</button>
          <div class="form-container">
            <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif;">
              <!-- Header -->
              <tr>
                <td colspan="2" style="text-align:center;">
                  <h4 style="margin: 4px 0;">EULOGIO “AMANG” RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY</h4>
                  <h4 style="margin: 4px 0;">COLLEGE OF ARTS AND SCIENCES</h4>
                  <h4 style="margin: 4px 0;">APPLIED PHYSICS DEPARTMENT</h4>
                  <h3 style="margin: 10px 0;">Equipment-borrowing Form</h3>
                </td>
              </tr>
              <!-- Borrower Details -->
              <tr>
                <td style="padding: 5px; text-align: left;">
                  <strong>Guest Login Number:</strong>
                  <span id="borrowerGuestNumber-${id}">${data.guest_number}</span>
                </td>
                <td style="padding: 5px; text-align: left">
                  <strong>Date:</strong>
                  <span id="borrowDate-${id}">${formatDateToDDMMYYYY(data.date)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 5px; text-align: left">
                  <strong>Borrower's Name:</strong>
                  <span id="borrowerName-${id}">${data.borrower_name}</span>
                </td>
                <td style="padding: 5px; text-align: left">
                  <strong>Instructor's Name:</strong>
                  <span id="instructorName-${id}">${data.instructor_name || ""}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 5px; text-align: left">
                  <strong>Student ID:</strong>
                  <span id="studentID-${id}">${data.student_id}</span>
                </td>
                <td style="padding: 5px; text-align: left">
                  <strong>Subject Code:</strong>
                  <span id="subjectCode-${id}">${data.subject_code || ""}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 5px; text-align: left">
                  <strong>Date(s) of Usage of Equipment:</strong>
                    <span id="usageDate-${id}">${formatDateToDDMMYYYY(data.usage_date)}</span>
                </td>
                <td style="padding: 5px; text-align: left">
                  <strong>Room:</strong>
                  <span id="room-${id}">${data.room || ""}</span>
                </td>
              </tr>
              <!-- Equipment Table Header -->
              <tr>
                <td colspan="2" style="padding-top: 15px;">
                  <table style="width:100%; border-collapse: collapse;" border="1">
                    <thead>
                      <tr style="text-align: center;">
                        <th>Equipment / Material</th>
                        <th>Quantity</th>
                        <th>Available in the lab?</th>
                        <th>Returned on</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${data.equipment.map(eq => `
                        <tr> 
                          <td>${eq.equipment_name}</td>
                          <td>${eq.quantity}</td>
                          <td>${eq.available}</td>
                          <td>${status === "Accepted" ? `<input type="date" class="returnedOnInput" data-eq-id="${eq.equipment_id}" value="${eq.returned_on || ''}">` : (eq.returned_on || '')}</td>
                          <td> ${status === "Accepted" ? `<input type="text" class="remarksInput" data-eq-id="${eq.equipment_id}" value="${eq.remarks || ''}" placeholder="Enter remarks">` : (eq.remarks || '')}</td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </td>
              </tr>
              <!-- Declaration -->
              <tr>
                <td colspan="2" style="padding-top: 20px;">
                  <strong>Borrower’s Declaration of Commitment:</strong><br />
                  <em>“I will be accountable to any damage incurred in the equipment and will return the equipment promptly and in the same working condition it was borrowed.”</em>
                </td>
              </tr>
              <!-- Signatures -->
              <tr>
                <td style="padding-top: 30px; text-align:left">
                  <p>Approved by:<br><br>__________________________<br>
                  <em>Instructor’s Name and Signature</em></p>
                </td>
                <td style="text-align:right; padding-top: 30px;">
                  <p>_________________________________<br>
                  <em>Signature over Printed Name of Borrower</em></p>
                </td>
              </tr>
            </table>
          </div>
        </div>
      `;

      reportContainer.appendChild(div);

      const recentList = document.getElementById("recentReportsList");
      if (recentList) {
        const summaryItem = document.createElement("li");
        summaryItem.className = `status-${(isReturned ? "returned" : status).toLowerCase()}`;
        summaryItem.textContent = `${data.guest_number} - ${isReturned ? "Returned" : status}`;
        recentList.prepend(summaryItem);

        while (recentList.children.length > 10  ) {
          recentList.removeChild(recentList.lastChild);
        }
      }

      const reportCountEl = document.getElementById("reportCount");
      if (reportCountEl) {
        const currentCount = reportContainer.querySelectorAll(".report-entry").length;
        reportCountEl.textContent = currentCount;
      }

        div.querySelector(".view-report-request-btn").addEventListener("click", () => {
          const formSection = div.querySelector(`#reportBorrowerFormSection-${id}`);
          if (!formSection) return;
          formSection.style.display = formSection.style.display === "none" ? "block" : "none";
        });
        
        div.querySelector(".saveReturnInfoBtn").addEventListener("click", () => {
          const formSection = div.querySelector(`#reportBorrowerFormSection-${id}`);
          if (formSection.style.display === "none") {
            formSection.style.display = "block";
          }

          const firstReturnedOnInput = formSection.querySelector(".returnedOnInput");
          const firstRemarksInput = formSection.querySelector(".remarksInput");
          
          let inputToFocus = null;
          if (firstReturnedOnInput && firstReturnedOnInput.value.trim() === "") {
            inputToFocus = firstReturnedOnInput;
          } else if (firstRemarksInput && firstRemarksInput.value.trim() === "") {
            inputToFocus = firstRemarksInput;
          }

          if (inputToFocus) {
            inputToFocus.scrollIntoView({ behavior: "smooth", block: "center" });
            inputToFocus.focus();

            inputToFocus.style.border = "2px solid red";

            setTimeout(() => {
              inputToFocus.style.border = "";
            }, 3000);
          }

          const returnedData = [];
          let hasDataToSave = false;

          formSection.querySelectorAll("tbody tr").forEach(tr => {
            const equipmentName = tr.children[0]?.textContent.trim();
            if (!equipmentName) return;

            const returnedOn = tr.querySelector(".returnedOnInput")?.value.trim() || "";
            const remarks = tr.querySelector(".remarksInput")?.value.trim() || "";

            if (returnedOn !== "" || remarks !== "") {
              hasDataToSave = true;
            }

            returnedData.push({ equipment_name: equipmentName, returned_on: returnedOn, remarks });
          });

          if (!hasDataToSave) {
            alert("Please enter return date or remarks before saving.");
            return; 
          }

          fetch("update_return_info.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              borrow_request_id: id,
              returned_items: returnedData
            })
          })
          .then(res => res.json())
          .then(response => {
            if (response.success) {
              alert("Return info saved successfully!");
              

                const statusSpan = div.querySelector("span");
                if (statusSpan) {
                  statusSpan.textContent = "Returned";
                  statusSpan.style.color = "blue";
                }

                const saveBtn = div.querySelector(".saveReturnInfoBtn");
                if (saveBtn) {
                  saveBtn.disabled = true;
                  saveBtn.textContent = "Already Returned";
                  saveBtn.style.backgroundColor = "#ccc";
                  saveBtn.style.cursor = "not-allowed";
                }

                const returnedLabel = document.createElement("div");
                returnedLabel.textContent = "✔ Equipment Returned";
                returnedLabel.style.color = "green";
                returnedLabel.style.fontWeight = "bold";
                returnedLabel.style.marginTop = "10px";
                div.appendChild(returnedLabel);
                

            } else {
              alert("Failed to save return info: " + response.message);
            }
          })
          .catch(() => alert("Error saving return info."));
        });
        const requestEl = document.querySelector(`.borrow-request button[data-id="${id}"]`)?.closest(".borrow-request");
        if (requestEl) requestEl.remove();

        const borrowQueue = document.getElementById("borrowQueue");
        const borrowQueueCountEl = document.getElementById("borrowQueueCount");

        if (borrowQueueCountEl && borrowQueue) {
          const remainingRequests = borrowQueue.querySelectorAll(".borrow-request").length;
          borrowQueueCountEl.textContent = remainingRequests;
        }
    } else {
      alert("Failed to update status: " + response.message);
    }
  });
}

function updateReportCount() {
  const reportList = document.getElementById('reportList');
  const pendingCountEl = document.getElementById('pendingRequestCount');
  
  if (reportList && pendingCountEl) {
    const count = reportList.querySelectorAll('.report-item').length;
    pendingCountEl.textContent = count;
  }
}

updateReportCount();

function applyReturnStatusUpdates() {
  fetch("fetch_return_status.php")
    .then(res => res.json())
    .then(data => {
      console.log("Fetched return status data:", data);

      data.forEach(item => {
        const requestDiv = document.querySelector(`#borrowRequest-${item.borrow_request_id}`);
        if (!requestDiv) return;

        const formSection = requestDiv.querySelector(`#reportBorrowerFormSection-${item.borrow_request_id}`);
        if (!formSection) return;

        formSection.querySelectorAll("tbody tr").forEach(tr => {
          const equipmentName = tr.children[0]?.textContent.trim().toLowerCase();
          const dbName = item.equipment_name?.trim().toLowerCase();

          if (equipmentName !== dbName) return;

          const returnedInput = tr.querySelector(".returnedOnInput");
          const remarksInput = tr.querySelector(".remarksInput");

          if (returnedInput) returnedInput.value = item.returned_on;
          if (remarksInput) remarksInput.value = item.remarks;
        });

        // Avoid duplication
        if (!requestDiv.querySelector(".returnedLabel")) {
          const statusSpan = requestDiv.querySelector("span");
          if (statusSpan) {
            statusSpan.textContent = "Returned";
            statusSpan.style.color = "blue";
          }

          const saveBtn = requestDiv.querySelector(".saveReturnInfoBtn");
          if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = "Already Returned";
            saveBtn.style.backgroundColor = "#ccc";
            saveBtn.style.cursor = "not-allowed";
          }

          const returnedLabel = document.createElement("div");
          returnedLabel.className = "returnedLabel";
          returnedLabel.textContent = "✔ Equipment Returned";
          returnedLabel.style.color = "green";
          returnedLabel.style.fontWeight = "bold";
          returnedLabel.style.marginTop = "10px";
          requestDiv.appendChild(returnedLabel);
        }

        if (!requestDiv.querySelector(".downloadPdfBtn")) {
          const pdfBtn = document.createElement("button");
          pdfBtn.textContent = "Download PDF";
          pdfBtn.className = "downloadPdfBtn";
          pdfBtn.style.marginTop = "10px";
          pdfBtn.style.backgroundColor = "#1976d2";
          pdfBtn.style.color = "white";
          pdfBtn.style.border = "none";
          pdfBtn.style.padding = "5px 10px";
          pdfBtn.style.borderRadius = "5px";
          pdfBtn.style.cursor = "pointer";
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

  const clone = container.cloneNode(true);

  const closeBtn = clone.querySelector('button[onclick^="closeBorrowerForm"]');
  if (closeBtn) closeBtn.style.display = "none";

  const inputs = clone.querySelectorAll("input, textarea, select");
  inputs.forEach(input => {
    const span = document.createElement("span");
    span.textContent = input.type === "checkbox"
      ? (input.checked ? "✔️" : "✖️")
      : input.value;
    span.style.display = "inline-block";
    span.style.padding = "2px 4px";
    span.style.marginLeft = "4px";
    span.style.borderRadius = "3px";

    input.parentNode.replaceChild(span, input);
  });

  const opt = {
    margin: 0.5,
    filename: 'borrow_form.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
  };

  html2pdf().from(clone).set(opt).save().then(() => {
    if (wasHidden) container.style.display = "none";
  });
}


function loadReportsFromDatabase() {
  fetch("fetch_borrow_reports.php")
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        json.data.forEach(entry => {
          const request = entry.borrowRequest;
          const equipment = entry.equipmentList;

          borrowRequestMap[request.id] = {
            ...request,
            equipment: equipment
          };

          addToReports(request.id, request.status);
        });
        applyReturnStatusUpdates();
      }
    });
}

function openBorrowerForm(data, id) {
  const formSection = document.getElementById(`borrowerFormSection-${id}`);
  

  if (formSection) {
    formSection.style.display = formSection.style.display === 'none' ? 'block' : 'none';
    
    const equipmentList = document.getElementById(`equipmentListInForm-${id}`);
    equipmentList.innerHTML = ""; 
    data.equipment.forEach((eq) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${eq.equipment_name}</td>
        <td>${eq.quantity}</td>
        <td>${eq.available}</td>
        <td></td>
        <td></td>
      `;
      equipmentList.appendChild(row);
    });
  }
}

function closeBorrowerForm(id) {
  const formSection = document.getElementById(`borrowerFormSection-${id}`);
  const reportFormSection = document.getElementById(`reportBorrowerFormSection-${id}`);

  if (formSection) formSection.style.display = "none";
  if (reportFormSection) reportFormSection.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  loadBorrowRequests();
  loadReportsFromDatabase(); 
});



  document.getElementById("editEquipmentBtn").onclick = () => {
    if (!selectedItemData) {
      alert("Please select an equipment item to edit.");
      return;
    }

    document.getElementById("equipmentID").value = selectedItemData.equipment_id;
    document.getElementById("equipmentName").value = selectedItemData.equipment_name;
    document.getElementById("serialNumber").value = selectedItemData.serial_number;
    document.getElementById("internalSN").value = selectedItemData.internal_sn;
    document.getElementById("accountablePerson").value = selectedItemData.account_person;
    document.getElementById("totalQty").value = selectedItemData.total_qty;
    document.getElementById("workingQty").value = selectedItemData.working_qty;
    document.getElementById("notWorkingQty").value = selectedItemData.not_working_qty;
    document.getElementById("description").value = selectedItemData.description;

    openAddEquipmentModal();
  };

const showChangeCredBtn = document.getElementById('showChangeCredBtn');
const currentPassSection = document.getElementById('currentPassSection');
const changeCredentialsSection = document.getElementById('change-credentials');
const verifyCurrentPassBtn = document.getElementById('verifyCurrentPassBtn');
const changeForm = document.getElementById('change-form');
const currentPasswordInput = document.getElementById('currentPassword');
const newUsernameInput = document.getElementById('newUsername');
const newPasswordInput = document.getElementById('newPassword');
const verifyMessage = document.getElementById('verifyMessage');
const changeMessage = document.getElementById('change-message');

showChangeCredBtn.addEventListener('click', () => {
  showChangeCredBtn.style.display = 'none';
  currentPassSection.classList.remove('hidden');
  currentPasswordInput.value = '';
  verifyMessage.textContent = '';
});

document.getElementById('backFromVerifyBtn').addEventListener('click', () => {
  currentPassSection.classList.add('hidden');
  showChangeCredBtn.style.display = 'inline-block';
  currentPasswordInput.value = '';
  verifyMessage.textContent = '';
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

  if (!password) {
    alert('Please enter your current password.');
    return;
  }

  fetch('verify_password.php', {
    method: 'POST',
    credentials: 'include',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({password})
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
  .catch(() => {
    alert('Error verifying password. Please try again later.');
  });
});

changeForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newUsername = newUsernameInput.value.trim();
  const newPassword = newPasswordInput.value.trim();

  if (!newUsername || !newPassword) {
    alert('Username and password cannot be empty.');
    return;
  }

  fetch('update_credentials.php', {
    method: 'POST',
    credentials: 'include',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({username: newUsername, password: newPassword})
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
  .catch(() => {
    alert('An error occurred while updating credentials.');
  });
});

function openPasswordModal() {
    document.getElementById("passwordModal").style.display = "flex";
}

function closePasswordModal() {
    document.getElementById("passwordModal").style.display = "none";
    document.getElementById("confirmPassword").value = '';
    document.getElementById("passwordError").style.display = 'none';
}

function verifyPassword() {
    const password = document.getElementById("confirmPassword").value;

    fetch('inventory_password.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password }),
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
    .catch(err => {
        console.error("Error verifying password:", err);
    });
}
function verifyPassword() {
    const password = document.getElementById("confirmPassword").value;

    fetch('inventory_password.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password }),
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert("Password correct!");
            sessionStorage.setItem('inventoryUnlocked', 'true');
            inventoryUnlocked = true;
            window.inventoryUnlocked = true;

            closePasswordModal();
            navigateToSection("Inventory");
        } else {
            document.getElementById("passwordError").style.display = 'block';
        }
    })
    .catch(err => {
        console.error("Error verifying password:", err);
    });
}


fetch("fetch_borrow_requests.php")
  .then(res => res.json())
  .then(json => {
    if (json.success) {
      const pendingCount = json.data.length; 
      document.getElementById("borrowQueueCount").textContent = pendingCount;
    }
  })
  .catch(err => console.error("Error fetching borrow requests count:", err));
