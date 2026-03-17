<?php
session_start();

?>
            <!DOCTYPE html>
            <html lang="en">

            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Guest Dashboard</title>
                <link rel="stylesheet" href="dashboard.css">
                <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
            </head>

            <body>
                <div class="sidebar">
                    <div class="logo">
                        <h2>Laboratory Tracker</h2>
                    </div>
                    <nav>
                        <a href="#" class="nav-item" onclick="showEquipment()">Equipment</a>          
                    </nav>
                    <div class="logout">
                        <a href="logout.php" class="nav-item">Log Out</a>
                    </div>
                </div>

                <div class="main-content">
                    <div id="topBar" class="top-bar">
                        <header>
                            <h1>Guest</h1>
                            <div class="guest-number-display">
                                <p id="guestLoginNumber" style="font-size: 1rem; color: #555;"></p>
                            </div>
                        </header>
                    </div>        


                    <div class="dashboard-container">
                        <div id="equipmentSection">
                            <div class="category-dropdown">
                                <select id="categorySelect">
                                    <option value="all">All</option>
                                    <option value="equipment">Equipment</option>
                                    <option value="measuring">Measuring Tools</option>
                                    <option value="chemicals">Chemicals</option>
                                    <option value="books">Books</option>
                                </select>
                            </div>           

                            <div class="search-bar">
                                <input type="text" placeholder="Search" id="searchInput">
                            </div>

                            <h1>Equipment</h1>

                            <table id="equipmentTable">
                                <thead>
                                    <th>Select</th>
                                    <th>Equipment ID</th>
                                    <th>Equipment Name</th>
                                    <th>Available</th>
                                </thead>                      
                                <tbody id="equipmentList">
                                </tbody>
                            </table>
                    </div>

                <button id="openBorrowerFormBtn" style="display:none; position:fixed; bottom:20px; right:20px; padding:12px 24px; font-size:16px; background-color:#28a745; color:white; border:none; border-radius:5px; cursor:pointer; z-index:1001;">
                    Open Borrower Form
                </button>

                <div id="borrowerFormModal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.6); z-index:1000; overflow-y:auto; padding:40px 20px;">
                    <div style="background:white; max-width:900px; margin:0 auto; border-radius:8px; padding:20px; position:relative; box-shadow:0 2px 10px rgba(0,0,0,0.3);">
                        <button id="closeBorrowerFormBtn" style="position:absolute; top:15px; right:15px; background:transparent; border:none; font-size:24px; font-weight:bold; cursor:pointer;">×</button>
                        <form id="borrowerForm" class="form-container">
                            <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif;">
                                <tr>
                                    <td colspan="2" style="text-align:center;">
                                        <h4 style="margin: 4px 0;">EULOGIO “AMANG” RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY</h4>
                                        <h4 style="margin: 4px 0;">COLLEGE OF ARTS AND SCIENCES</h4>
                                        <h4 style="margin: 4px 0;">APPLIED PHYSICS DEPARTMENT</h4>
                                        <h3 style="margin: 10px 0;">Equipment-borrowing Form</h3>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding: 5px; text-align: left;">
                                        <strong>Guest Login Number:</strong> 
                                        <span id="borrowerGuestNumber">________________________</span>
                                    </td>
                                    <td style="padding: 5px; text-align: left;">
                                        <strong>Date:</strong> 
                                        <span id="borrowDate">________________________</span><input type="hidden" id="borrowDateForDB" name="borrowDateForDB" />
                                    </td>
                                    
                                </tr>
                                <tr>
                                    <td style="padding: 5px; text-align: left;">
                                        <strong>Borrower's Name:</strong>
                                        <span style="display: inline-flex; align-items: center; gap: 4px; margin-left: 6px;">
                                            <input type="text" id="lastName" placeholder="Last Name" style="width: 80px;">
                                            <input type="text" id="firstName" placeholder="First Name" style="width: 80px;">
                                            <input type="text" id="middleInitial" placeholder="M.I." maxlength="1" style="width: 30px;">
                                        </span>
                                        <input type="hidden" id="borrowerName" name="borrowerName">
                                    </td>
                                    <td style="padding: 5px; text-align: left;">
                                        <strong>Instructor's Name:</strong>
                                        <select id="instructorName" style="width: 200px;">
                                            <option value="" disabled selected>Select Instructor</option>
                                        </select>
                                    </td>
                                    
                                </tr>
                                <tr>
                                    <td style="padding: 5px; text-align: left;">
                                        <strong>Student ID:</strong>
                                        <input type="text" id="studentID" style="width: 200px;" placeholder="Enter Student ID">
                                    </td>
                                    <td style="padding: 5px; text-align: left;">
                                        <strong>Subject Code:</strong>
                                        <input type="text" id="subjectCode" style="width: 200px;" placeholder="Enter Subject Code">
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px; text-align: left;">
                                        <strong>Date(s) of Usage of Equipment:</strong>
                                        <input type="date" id="usageDate" style="width: px;">
                                    </td>
                                    <td style="padding: 5px; text-align: left;">
                                        <strong>Room:</strong>
                                        <select id="roomSelect">
                                            <option value="" disabled selected>Select Room</option>
                                        </select>
                                    </td>
                                </tr>

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
                                            <tbody id="equipmentListInForm">
                                            </tbody>
                                        </table>

                                <tr>
                                    <td colspan="2" style="padding-top: 20px;">
                                        <strong>Borrower’s Declaration of Commitment:</strong><br>
                                        <em>“I will be accountable to any damage incurred in the equipment and will return the equipment promptly and in the same working condition it was borrowed.”</em>
                                    </td>
                                </tr>

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
                
                            <div style="text-align: center; padding-top: 20px;">
                                <button id="submitButton" type="button" onclick="combineBorrowerName(); showConfirmationModal()">Submit Borrow Request</button>
                            </div>
                    </form>
                    </div>
                </div>

                    <div id="confirmationModal" class="modal">
                        <div class="modal-content">
                            <h2>Confirm Borrowing Request</h2>
                            <p>Please re-enter your Guest Login Number to confirm:</p>
                            <input type="text" id="confirmGuestNumber" placeholder="Enter Guest Login Number">
                            <button id="confirmBtn" onclick="submitBorrowRequest()">Confirm</button>
                            <button id="cancelBtn" onclick="closeConfirmationModal()">Cancel</button>
                        </div>
                    </div>

                        <div id="rulesModal" class="modal">
                            <div class="modal-content">
                                <h2 class="modal-title">Borrowing Rules & Regulations</h2>
                                <div class="rules-text">
                                    <ol>
                                        <li>Equipment must be returned in good condition.</li>
                                        <li>Borrowing is only allowed during lab operating hours.</li>
                                        <li>Report any damage or issues immediately to the lab technician.</li>
                                        <li>Late returns may result in borrowing suspension.</li>
                                        <li>Only registered guests are allowed to borrow equipment.</li>
                                    </ol>
                                </div>
                                <label class="agree-label">
                                    <input type="checkbox" id="agreeCheckbox"> I agree to follow the rules and regulations.
                                </label>
                                <button id="agreeBtn" disabled>Agree & Continue</button>
                            </div>
                        </div>       
                        
                        <div id="finalConfirmationModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%;  
                            background: rgba(0,0,0,0.6); z-index: 9999; overflow:auto; padding: 20px;">

                        <div style="background:#fff; width:90%; max-width:900px; height:90vh; margin:40px auto; padding:20px; 
                            border-radius:8px; position:relative; display: flex; flex-direction: column;">
                            
                            <h2>Please Take a Picture of This Form</h2>
                            <p>Make sure to capture this confirmation for your records.</p>

                            <div id="finalFormData" style="border:1px solid #ccc; padding:15px; background:#f9f9f9; 
                                flex-grow: 1; overflow-y:auto;">
                            </div>

                            <button id="closeFinalModalBtn" style="margin-top:15px; padding:10px 20px; align-self: flex-end;">Close</button>
                        </div>

                        </div>


                        <body>
                            <script src="guest.js"></script>
                        </body>

            </html>