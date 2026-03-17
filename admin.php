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
        <title>Admin Dashboard</title>
        <link rel="stylesheet" href="dashboard.css" />
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>

    <body>
        <div class="sidebar">
            <div class="logo">
                <h2>Laboratory Tracker</h2>
            </div>
            <nav>
                <a href="#" class="nav-item active" data-section="Dashboard">Dashboard</a>
                <a href="#" class="nav-item" data-section="Schedule">Schedule</a>
                <a href="#" class="nav-item" data-section="Borrow Requests">
                Borrow Requests <span id="borrowQueueCount" class="queue-count">0</span>
                </a>
                <a href="#" class="nav-item" data-section="Inventory" id="inventoryNav">Inventory</a>
                <a href="#" class="nav-item" data-section="Reports">Reports</a>

            </nav>
            <div class="logout">
                <a href="#" onclick="logout()" class="nav-item">Log Out</a>
            </div>
        </div>

        <div class="main-content">
            <div class="top-bar">
            </div>

            <div id="manageSection">
                <h1>Dashboard</h1>

                <div class="card">
                    <button id="showChangeCredBtn" class="primary-btn">Change Credentials</button>
                </div>

                <div id="currentPassSection" class="form-section hidden">
                    <label for="currentPassword">Enter Current Password:</label>
                    <input type="password" id="currentPassword" placeholder="Current Password" required />
                    <button id="verifyCurrentPassBtn" class="secondary-btn">Verify</button>
                    <button type="button" id="backFromVerifyBtn" class="back-btn">Back</button>
                    <p id="verifyMessage" class="message-text"></p>
                </div>

                <div id="change-credentials" class="form-section hidden">
                    <h3>Change Admin Credentials</h3>
                    <form id="change-form">
                        <input type="text" id="newUsername" placeholder="New Username" required />
                        <input type="password" id="newPassword" placeholder="New Password" required />
                        <button type="submit" id="submitChangeCredentialsBtn" class="primary-btn">Update</button>
                        <button type="button" id="backFromChangeBtn" class="back-btn">Back</button>
                        <p id="change-message" class="message-text"></p>
                    </form>
                </div>

                <div class="slider-container">
                    <div class="slider-wrapper">
                    <div class="slide" data-target="Schedule">
                    <h3>Schedule</h3>
                    <p>View today's equipment borrow request statistics.</p>
                    <p><strong>Today:</strong> <span id="currentDate"></span></p>

                    <div id="dailyStats" class="stats-container">
                        <p><strong>Total Requests:</strong> <span id="totalRequests">0</span></p>
                        <p><strong>Accepted:</strong> <span id="acceptedRequests">0</span></p>
                        <p><strong>Rejected:</strong> <span id="rejectedRequests">0</span></p>
                        <p><strong>Pending:</strong> <span id="pendingRequests">0</span></p>
                        <p class="click-instruction">Click this slide to go to the Schedule tab.</p>
                    </div>
                    </div>

                    <div class="slide" data-target="Borrow Requests" id="borrowRequestsSlide" style="max-width: 700px; margin: 0 auto; font-family: Arial, sans-serif; cursor: pointer;">
                    <h3>Borrow Requests</h3>
                    <p>Review and approve or reject borrow requests submitted by users.</p>
                    <p><strong>Total Requests:</strong> <span id="totalRequestCount">0</span></p>
                    <h4>Recent Request</h4>

                    <div id="borrowQueueDashboard" style="border: 1px solid #ccc; border-radius: 8px; background: #fff; padding: 15px; max-height: 300px; overflow-y: auto;">

                    </div>
                    </div>

                    <div class="slide" data-target="Inventory">
                        <h3>Inventory</h3>
                        <p>Manage equipment items including adding, editing, deleting, and importing/exporting data.</p>
                        <p><strong>Total Items:</strong> <span id="inventoryCount">0</span></p>

                        <div class="inventory-preview-container">
                            <table class="preview-table">
                                <thead>
                                <tr>
                                    <th style="text-align: center">Equipment ID</th>
                                    <th style="text-align: center">Equipment</th>
                                    <th style="text-align: center">SN</th>
                                    <th style="text-align: center">ISN</th>
                                    <th style="text-align: center">ACC Person</th>
                                    <th style="text-align: center">Total</th>
                                    <th style="text-align: center">Working</th>
                                    <th style="text-align: center">Not Working</th>
                                    <th style="text-align: center">Description</th>
                                </tr>
                                </thead>
                                <tbody id="inventoryPreviewBody">
                                </tbody>
                            </table>
                        </div>
                        <p class="preview-note">Showing preview only — click to view full inventory.</p>
                    </div>


                    <div class="slide" data-target="Reports">
                        <h3>Reports</h3>
                        <p>View reports and analytics based on borrow history and equipment usage.</p>
                        <p><strong>Total Entries:</strong> <span id="reportCount">0</span></p>
                        <ul id="recentReportsList" class="recent-reports">
                        <li>Loading recent reports...</li>
                        </ul>
                    </div>
                    </div>

                    <div class="dots-container"></div>
                </div>
                </div>

            <div id="inventorySection" style="display: none">
                <h1>Inventory</h1>

                <select id="categorySelect">
                    <optgroup label="Category">
                        <option value="all">All</option>
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
                    <input type="text" placeholder="Search" id="searchInput">
                </div>

                <div class="btn-group" style="justify-content: space-between; align-items: center;">
                <div class="left-buttons" style="display: flex; gap: 10px;">
                    <button id="addEquipmentBtn">Add</button>
                    <button id="editEquipmentBtn">Edit</button>
                    <button id="deleteEquipmentBtn">Delete</button>
                </div>

                <div class="right-buttons" style="display: flex; gap: 10px;">
                    <button id="downloadExcelBtn">📥 Download Excel</button>
                    <input type="file" id="uploadExcelInput" accept=".xlsx" style="display:none;" />
                    <button id="uploadExcelBtn">📤 Upload Excel</button>
                </div>
                </div>

                <div id="addEquipmentModal" class="modal">
                    <div class="modal-content">
                        <span class="close" onclick="document.getElementById('addEquipmentModal').style.display='none'">&times;</span>
                        <h2>Add Equipment</h2>
                        <label for="equipmentID">Equipment ID:</label>
                        <input type="text" id="equipmentID" required />
                        <label for="equipmentName">Equipment Name:</label>
                        <input type="text" id="equipmentName" required />
                        <label for="serialNumber">SN:</label>
                        <input type="text" id="serialNumber" />
                        <label for="internalSN">ISN:</label>
                        <input type="text" id="internalSN" />
                        <label for="accountablePerson">Accountable Person:</label>
                        <input type="text" id="accountablePerson" />
                        <label for="totalQty">Total Quantity:</label>
                        <input type="number" id="totalQty" />
                        <label for="workingQty">Working:</label>
                        <input type="number" id="workingQty"/>
                        <label for="notWorkingQty">Not Working:</label>
                        <input type="number" id="notWorkingQty" />
                        <label for="description">Description:</label>
                        <textarea id="description"></textarea>
                        <button id="submitEquipmentBtn">Submit</button>
                    </div>
                </div>

                <table id="equipmentTable">
                    <thead>
                        <tr>
                          <th rowspan="2" class="small-column">Equipment ID</th>
                          <th rowspan="2">Equipment</th>
                          <th rowspan="2">SN</th>
                          <th rowspan="2">ISN</th>
                          <th rowspan="2">ACC Person</th>
                          <th colspan="3">Condition</th> 
                          <th rowspan="2">Description</th>
                        </tr>
                        <tr>
                          <th title="Total">T</th>      
                          <th title="Working">W</th>
                          <th title="Not Working">NW</th>
                        </tr>            
                    
                    <tbody id="equipmentList">
                    </tbody>
                </table>
            </div>

            <div id="scheduleSection" style="display: none;">
            <h1>Schedule</h1>

            <div id="calendar" style="margin-top: 30px;"></div>

            <div id="statsSummary" style="margin-top: 20px;">
                <h2>Borrow Request Summary</h2>

                <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: space-between;">

                <div style="flex: 1; min-width: 280px; border: 1px solid #ccc; padding: 15px; border-radius: 10px; text-align: center;">
                    <p><strong>Month:</strong> <span id="monthLabel">--</span></p>
                    <p>Total Requests: <span id="monthlyTotal">0</span></p>
                    <p>Accepted: <span id="monthlyAccepted">0</span></p>
                    <p>Rejected: <span id="monthlyRejected">0</span></p>
                    <p>Most Frequently Borrowed Item: <span id="monthlyTopItem">N/A</span></p>
                    <div style="width: 100%; display: flex; justify-content: center; align-items: center; margin-top: 10px;">
                        <div style="width: 220px; height: 220px; position: relative;">
                        <canvas id="monthlyChart" width="220" height="220"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Weekly -->
                <div style="flex: 1; min-width: 280px; border: 1px solid #ccc; padding: 15px; border-radius: 10px; text-align: center;">
                    <p><strong>Week:</strong> <span id="weekLabel">--</span></p>
                    <p>Total Requests: <span id="weeklyTotal">0</span></p>
                    <p>Accepted: <span id="weeklyAccepted">0</span></p>
                    <p>Rejected: <span id="weeklyRejected">0</span></p>
                    <p>Most Frequently Borrowed Item: <span id="weeklyTopItem">N/A</span></p>
                    <div style="width: 100%; display: flex; justify-content: center; align-items: center; margin-top: 10px;">
                        <div style="width: 220px; height: 220px; position: relative;">
                                <canvas id="weeklyChart" width="220" height="220"></canvas>
                        </div>
                    </div>
                </div>
                </div>

<div style="margin-top: 30px; border: 1px solid #ccc; padding: 20px; border-radius: 10px;">
  <h3 style="text-align: center;">Equipment Borrowing Trend</h3>
  <p style="text-align: center;">Monthly frequency of borrowed equipment</p>
  <div style="width: 100%; max-width: 800px; margin: 0 auto;">
    <canvas id="equipmentTrendChart" height="300"></canvas>
  </div>
</div>


            </div>
            </div>


            <div id="queueSection" style="display: none">
                <h1>Borrow Requests</h1>
               <!-- Filter Section (horizontal layout) -->
                <div style="display: flex; flex-wrap: wrap; align-items: flex-end; gap: 20px; margin: 20px 0;">
                    <div>
                    <label for="startDate" style="font-weight: bold;">Start Date:</label><br>
                    <input type="date" id="startDate" style="padding: 6px 12px; border-radius: 5px; border: 1px solid #ccc;">
                    </div>

                    <div>
                    <label for="endDate" style="font-weight: bold;">End Date:</label><br>
                    <input type="date" id="endDate" style="padding: 6px 12px; border-radius: 5px; border: 1px solid #ccc;">
                    </div>

                   <div style="display: flex; gap: 10px;">
                    <button onclick="loadBorrowRequests()" style="
                        padding: 8px 20px;
                        background-color: rgb(6, 169, 25);
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    ">Filter</button>

                    <button onclick="clearFilters()" style="
                        padding: 8px 20px;
                        background-color: #9e9e9e;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    ">Clear</button>
                    </div>
                </div>

                <div id="borrowQueue" style="display: flex; flex-direction: column;">
                </div>
            </div>

            <div id="reportsSection" style="display: none">
                <h1>Reports</h1>
                <div id="reportsList">
                </div>
            </div>

            <div id="passwordModal" style="display:none;" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closePasswordModal()">&times;</span>
                <h3>Confirm Password</h3>
                <input type="password" id="confirmPassword" placeholder="Enter current password" required>
                <button onclick="verifyPassword()">Confirm</button>
                <p id="passwordError" style="color:red; display:none;">Incorrect password. Try again.</p>
            </div>
            </div>


        <script src="admin.js"></script>
    </body>
</html>
