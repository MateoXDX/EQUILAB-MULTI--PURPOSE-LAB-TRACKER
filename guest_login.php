<?php
session_start();
require 'db.php';

$date = new DateTime();
$month = $date->format("m"); 
$year = $date->format("y");  
$prefix = $month . $year;    

$sql = "SELECT guest_number FROM guests WHERE guest_number LIKE ? ORDER BY guest_number DESC LIMIT 1";
$stmt = $conn->prepare($sql);
$like_param = $prefix . "%";
$stmt->bind_param("s", $like_param);
$stmt->execute();
$result = $stmt->get_result();
$lastGuestNumber = $result->fetch_assoc()['guest_number'] ?? null;

if ($lastGuestNumber) {
    $lastSequential = (int)substr($lastGuestNumber, 4); 
    $newSequential = str_pad($lastSequential + 1, 3, '0', STR_PAD_LEFT);
} else {
    $newSequential = "001"; 
}

$guestNumber = $prefix . $newSequential;

$sql = "INSERT INTO guests (guest_number) VALUES (?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $guestNumber);
if ($stmt->execute()) {
    $_SESSION["guest_id"] = $guestNumber;
    echo json_encode(["status" => "success", "guest_id" => $guestNumber]);
} else {
    echo json_encode(["status" => "error", "message" => "Error generating guest number."]);
}

$stmt->close();
?>