let allEquipmentData = [];
let selectedEquipment = [];

$(document).ready(function() {
    getGuestNumber();
    setCurrentDate();
    fetchEquipment();
    loadInstructorList();
  });
  
  function getGuestNumber() {
    $.ajax({
        url: 'get_guest_number.php',
        method: 'GET',
        success: function(response) {
            const data = JSON.parse(response);
            $("#guestNumber").val(data.guest_number); 
            $("#guestLoginNumber").text("Login Number: " + data.guest_number); 
            $("#borrowerGuestNumber").text(data.guest_number); 
        },
        error: function(xhr, status, error) {
            console.error("Error loading guest number:", error);
        }
    });
}

function setCurrentDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    const displayDate = `${day}-${month}-${year}`;   
    const dbDate = `${year}-${month}-${day}`;          

    $("#borrowDate").text(displayDate);             
    $("#borrowDateForDB").val(dbDate);                  
}

$(document).ready(function() {
    setCurrentDate();
});


$(document).ready(function () {
  $.ajax({
      url: 'fetch_instructors.php',
      method: 'GET',
      success: function (data) {
          const instructors = JSON.parse(data);
          instructors.forEach(function (instructor) {
              $('#instructorName').append(new Option(instructor.instructor_name, instructor.name));
          });
      },
      error: function () {
          alert('Failed to load instructors.');
      }
  });

  $.ajax({
      url: 'fetch_rooms.php',
      method: 'GET',
      success: function (data) {
          const rooms = JSON.parse(data);
          rooms.forEach(function (room) {
              $('#roomSelect').append(new Option(room.room_number, room.room_number));
          });
      },
      error: function () {
          alert('Failed to load rooms.');
      }
  });
});

function showConfirmationModal() {
  const last = $('#lastName').val().trim().toUpperCase();
  const first = $('#firstName').val().trim().toUpperCase();
  const mi = $('#middleInitial').val().trim().toUpperCase();

  if (!last || !first || !mi) {
      alert('Please complete the borrower\'s full name: Last, First, and Middle Initial.');
      return;
  }

  // Combine name and store in hidden input
  const fullName = `${last}, ${first} ${mi}.`;
  $('#borrowerName').val(fullName);

  const borrowerName = $('#borrowerName').val();
  const studentID = $('#studentID').val();
  const subjectCode = $('#subjectCode').val();
  const usageDate = $('#usageDate').val();
  const roomSelect = $('#roomSelect').val();
  const instructorSelect = $('#instructorName').val();
  const hasEquipment = $('#equipmentListInForm tr').length > 0;

  if (!borrowerName || !studentID || !subjectCode || !usageDate || !roomSelect || !instructorSelect) {
      alert('Please fill out all fields before submitting, including selecting a room and instructor.');
      return;  
  }

  if (!hasEquipment) {
      alert('Please select at least one equipment/material before submitting.');
      return;
  }

  $('#confirmationModal').fadeIn();
}


function closeConfirmationModal() {
  $('#confirmationModal').fadeOut();
}

$(document).ready(function () {
    fetchEquipment();

    $('#categorySelect').on('change', function () {
        filterAndDisplayEquipment(); 
    });

    $('#searchInput').on('input', function () {
        const searchValue = this.value.toLowerCase();
        const rows = document.querySelectorAll('#equipmentTable tbody tr');

        rows.forEach(row => {
            const id = row.cells[1].textContent.toLowerCase();
            const name = row.cells[2].textContent.toLowerCase();

            if (id.includes(searchValue) || name.includes(searchValue)) {
                row.style.display = ''; 
            } else {
                row.style.display = 'none'; 
            }
        });
    });
});

function fetchEquipment() {
    $.ajax({
        url: "fetch_equipment.php",
        method: "GET",
        dataType: "json",
        success: function (data) {
            allEquipmentData = data;
            filterAndDisplayEquipment();
        },
        error: function (xhr, status, error) {
            console.error("Error fetching equipment data:", error);
        }
    });
}

function filterAndDisplayEquipment() {
    const category = $('#categorySelect').val();
    const keyword = $('#searchInput').val().toLowerCase();

    const filteredData = allEquipmentData.filter(item => {
        const matchesSearch =
            item.equipment_id.toLowerCase().includes(keyword) ||
            item.equipment_name.toLowerCase().includes(keyword);

        const prefix = item.equipment_id.charAt(0).toUpperCase();
        let matchesCategory = true;

        if (category !== 'all') {
            if (category === 'equipment') matchesCategory = prefix === 'E';
            else if (category === 'books') matchesCategory = prefix === 'B';
            else if (category === 'chemicals') matchesCategory = prefix === 'C';
            else if (category === 'measuring') matchesCategory = prefix === 'M';
        }

        return matchesSearch && matchesCategory;
    });

    populateEquipmentTable(filteredData);
}


function populateEquipmentTable(equipmentData) {
    const equipmentList = $("#equipmentList");
    equipmentList.empty(); 

    equipmentData.forEach(item => {
        const checkbox = $(`<input type="checkbox" class="equipment-checkbox" data-id="${item.equipment_id}">`);

        if (Number(item.available) === 0) {
            checkbox.prop('disabled', true).prop('title', 'Not Available');
        }

        checkbox.on("change", function () {
            const isChecked = $(this).is(':checked');
            const equipmentId = $(this).data('id');
            
            if (isChecked) {
                // Find the equipment in allEquipmentData
                const equipment = allEquipmentData.find(eq => eq.equipment_id === equipmentId);
                if (equipment) {
                    toggleEquipmentSelection(equipment, true);
                }
            } else {
                const equipment = allEquipmentData.find(eq => eq.equipment_id === equipmentId);
                if (equipment) {
                    toggleEquipmentSelection(equipment, false);
                }
            }
        });

        const row = $("<tr>");
        row.append($("<td>").append(checkbox));
        row.append(`<td>${item.equipment_id}</td>`);
        row.append(`<td>${item.equipment_name}</td>`);
        row.append(`<td>${item.available}</td>`);

        equipmentList.append(row);
    });

    // Re-attach search functionality
    $('#searchInput').on('input', function () {
        const searchValue = this.value.toLowerCase();
        const rows = document.querySelectorAll('#equipmentTable tbody tr');

        rows.forEach(row => {
            const id = row.cells[1].textContent.toLowerCase();
            const name = row.cells[2].textContent.toLowerCase();

            if (id.includes(searchValue) || name.includes(searchValue)) {
                row.style.display = ''; 
            } else {
                row.style.display = 'none'; 
            }
        });
    });
}


  
  $(document).ready(function () {
    $('#rulesModal').fadeIn();

    const $openBtn = $('#openBorrowerFormBtn');
const $modal = $('#borrowerFormModal');
const $closeBtn = $('#closeBorrowerFormBtn');

function updateOpenFormButton() {
    const anyChecked = $('.equipment-checkbox:checked').length > 0;
    const $openBtn = $('#openBorrowerFormBtn');
    const $modal = $('#borrowerFormModal');
    
    if (anyChecked) {
        $openBtn.show();
    } else {
        $openBtn.hide();
        $modal.hide();
        $('body').css('overflow', ''); 
    }
}

updateOpenFormButton();

$('#equipmentList').on('change', 'input[type=checkbox]', function() {
    updateOpenFormButton();
});

$openBtn.on('click', function() {
    updateBorrowerFormList();
    $modal.show();
    $openBtn.hide();             
    $('body').css('overflow', 'hidden'); 
});

$closeBtn.on('click', function() {
    $modal.hide();
    $('body').css('overflow', ''); 
    updateOpenFormButton();       
});

$modal.on('click', function(e) {
    if (e.target === this) {
        $modal.hide();
        $('body').css('overflow', '');
        updateOpenFormButton();    
    }
});

    $('#agreeCheckbox').on('change', function () {
        $('#agreeBtn').prop('disabled', !this.checked);
    });
  
    $('#agreeBtn').on('click', function () {
        $('#rulesModal').fadeOut();
    });
  });
  
function toggleEquipmentSelection(equipment, checked) {
    if (checked) {
        const existingIndex = selectedEquipment.findIndex(item => item.equipment_id === equipment.equipment_id);
        
        if (existingIndex === -1) {
            selectedEquipment.push({
                ...equipment,
                selected_quantity: 1 
            });
        }
    } else {
        selectedEquipment = selectedEquipment.filter(item => item.equipment_id !== equipment.equipment_id);
    }
    
    updateBorrowerFormList();
    updateOpenFormButton();
}

function updateBorrowerFormList() {
    const list = $("#equipmentListInForm");
    list.empty();

    selectedEquipment.forEach((item, index) => {
        const row = $(`
            <tr>
                <td>${item.equipment_name}</td>
                <td>
                    <input type="number" min="1" max="${item.available}" 
                        step="1" value="${item.selected_quantity}" data-index="${index}" 
                        style="width:60px;">
                </td>
                <td>YES</td>
                <td>___________</td>
                <td>______________</td>
            </tr>
        `);

        let typingTimer;
        const doneTypingInterval = 400;

        const input = row.find("input");

        input.on("input", function () {
            clearTimeout(typingTimer);

            typingTimer = setTimeout(() => {
                const i = $(this).data("index");
                let val = parseFloat(this.value);

                if (isNaN(val) || val < 1) {
                    val = 1;
                } else if (val > selectedEquipment[i].available) {
                    val = selectedEquipment[i].available;
                }

                val = Math.floor(val);
                this.value = val;
                selectedEquipment[i].selected_quantity = val;
            }, doneTypingInterval);
        });

        list.append(row);
    });
}

  function showEquipment() {
      document.getElementById("equipmentSection").style.display = "block";
      document.getElementById("borrowerFormSection").style.display = "none";
      document.getElementById("topBar").style.display = "block"; 
  }

  function showBorrowerForm() {
      document.getElementById("equipmentSection").style.display = "none";
      document.getElementById("borrowerFormSection").style.display = "block";
      document.getElementById("topBar").style.display = "none"; 
  }

  function submitBorrowRequest() {
    const confirmGuestNumber = $('#confirmGuestNumber').val();
    const borrowerGuestNumber = $('#borrowerGuestNumber').text().trim();


    if (confirmGuestNumber !== borrowerGuestNumber) {
        alert('Guest number does not match.');
        return;
    }

    const data = {
        guestNumber: borrowerGuestNumber,
        date: $('#borrowDateForDB').val(),  
        borrowerName: $('#borrowerName').val(),
        instructorName: $('#instructorName').val(),
        studentID: $('#studentID').val(),
        subjectCode: $('#subjectCode').val(),
        usageDate: $('#usageDate').val(),
        room: $('#roomSelect').val(),
        equipmentList: []
    };

    $('#confirmationModal').appendTo('body'); 
    $('#borrowerFormModal').css('z-index', 1000); 
    $('#confirmationModal').css({
        'z-index': 1100,
        'position': 'fixed'
    }).fadeIn();

    $('#equipmentListInForm tr').each(function () {
        const equipmentName = $(this).find('td:eq(0)').text();
        const quantity = $(this).find('td:eq(1) input').val();

        data.equipmentList.push({
            equipmentName,
            quantity,
            available: "YES"
        });
    });

    console.log(data);

    $.ajax({
    url: 'submit_borrow_request.php',
    method: 'POST',
    data: { data: JSON.stringify(data) },
    success: function (res) {
        console.log("Success response:", res);
        if (res.success) {
            showFinalConfirmationModal(data);
            closeConfirmationModal(); 
            fetchEquipment(); 
            selectedEquipment = []; 
            updateBorrowerFormList(); 
        } else {
            alert('Server Error: ' + res.message);
        }
    },
    error: function (xhr, status, error) {
        console.error("AJAX error:", status, error);
        console.error("Server response:", xhr.responseText);  
        alert("An error occurred. Check console for server response.");
    }
});
}

  function loadInstructorList() {
    $.ajax({
        url: 'get_instructors.php',
        method: 'GET',
        success: function(response) {
            const instructors = JSON.parse(response);
            const select = $("#instructorName");
            instructors.forEach(name => {
                select.append(`<option value="${name}">${name}</option>`);
            });
        },
        error: function(xhr, status, error) {
            console.error("Error loading instructor list:", error);
        }
    });
}

function getRooms() {
  $.ajax({
      url: 'get_rooms.php',
      method: 'GET',
      success: function(response) {
          const rooms = JSON.parse(response);
          const roomSelect = $('#roomSelect');

          rooms.forEach(room => {
              const option = $('<option>', {
                  value: room.room_number, 
                  text: room.room_number
              });
              roomSelect.append(option);
          });
      },
      error: function(xhr, status, error) {
          console.error("Error loading room data:", error);
      }
  });
}

function setUsageDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;  
    $('#usageDate').val(formattedDate);
}

$(document).ready(function() {
    setUsageDate();
});

$(document).ready(function() {
  getRooms();
});

$('#borrowerForm').submit(function(e) {
  e.preventDefault(); 
  $.ajax({
    url: 'submit_borrow_request.php',  
    method: 'POST',
    data: $(this).serialize(),
    success: function(response) {
      if (response === 'success') {
        window.location.href = 'logout.php';
      } else {
        alert('Error: Could not submit the form');
      }
    }
  });
});

function showFinalConfirmationModal(data) {
    const originalForm = document.getElementById('borrowerForm');
    if (!originalForm) {
      alert('Borrower form not found!');
      return;
    }

    const clonedForm = originalForm.cloneNode(true);

    clonedForm.querySelector('#instructorName').value = data.instructorName || '';
    clonedForm.querySelector('#roomSelect').value = data.room || '';

    const fields = clonedForm.querySelectorAll('input, select, textarea, button');
    fields.forEach(field => {
        field.disabled = true;
        field.readOnly = true;
        if (field.type === 'submit' || field.type === 'button') {
            field.style.display = 'none';
        }
    });

    const container = document.getElementById('finalFormData');
    container.innerHTML = '';
    container.appendChild(clonedForm);

    $('#finalConfirmationModal').fadeIn();
}

$(document).ready(function () {
    $("#closeFinalModalBtn").on("click", function () {
        alert("Form submitted successfully!");
        window.location.href = "logout.php"; 
    });
});


function combineBorrowerName() {
    const last = document.getElementById("lastName").value.trim().toUpperCase();
    const first = document.getElementById("firstName").value.trim().toUpperCase();
    const mi = document.getElementById("middleInitial").value.trim().toUpperCase();

    const fullName = `${last}, ${first} ${mi}.`;
    document.getElementById("borrowerName").value = fullName;
}


window.logout = function () {
  window.location.href = "logout.php";
};
