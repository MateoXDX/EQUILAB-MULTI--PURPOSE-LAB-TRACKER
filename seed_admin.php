<?php
require 'db_pdo.php'; 
$defaultUsername = 'Admin';
$defaultPassword = password_hash('Admin', PASSWORD_DEFAULT);

$stmt = $pdo->prepare("INSERT INTO admin_credentials (username, password) VALUES (?, ?)");
$stmt->execute([$defaultUsername, $defaultPassword]);
?>