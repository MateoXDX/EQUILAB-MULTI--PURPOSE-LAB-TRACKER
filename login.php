<?php
session_start();
session_unset();
session_destroy();
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Lab Inventory Login</title>
  <link href="login.css" rel="stylesheet" type="text/css" />
</head>

<body>

  <div class="login-container">
    <div class="login-box">
      <div class="header">
        <h1>Welcome to <span>EQUILAB</span></h1>
        <p>Please log in as Admin or Guest to access your respective dashboard.</p>
      </div>

      <div id="recent-guests-box" style="margin-top: 15px;">
        <h3>Recent Guests</h3>
        <ul id="recent-guests-list">
        </ul>
      </div>

      <form id="login-form" style="display: none;">
        <h2>Login</h2>
        <div class="input-group">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" placeholder="Enter Username" required />
        </div>
        <div class="input-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" placeholder="Enter Password" required />
        </div>
        <button type="submit">Login</button>
        <p id="error-message"></p>
      </form>

      <div id="guest-section" style="display: none;">
        <button id="guestLoginBtn" class="guest-button">Login as Guest</button>
      </div>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.js"></script>
  <script src="login.js"></script>
</body>

</html>
