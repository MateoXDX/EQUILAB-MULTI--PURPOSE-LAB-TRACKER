<?php
session_start();
require 'db.php';

$date   = new DateTime();
$month  = $date->format("m");
$year   = $date->format("y");
$prefix = $month . $year;

// Get the most recent guest number for this month/year prefix
$sql  = "SELECT guest_number FROM guests WHERE guest_number LIKE ? ORDER BY guest_number DESC LIMIT 1";
$stmt = $conn->prepare($sql);
$like = $prefix . "%";
$stmt->bind_param("s", $like);
$stmt->execute();
$result          = $stmt->get_result();
$lastGuestNumber = $result->fetch_assoc()['guest_number'] ?? null;
$stmt->close();

if ($lastGuestNumber) {
    // Check if this last guest number has ever submitted a borrow request.
    // If NOT, reuse it — do not generate a new number and do not insert a new row.
    $check = $conn->prepare("SELECT id FROM borrow_requests WHERE guest_number = ? LIMIT 1");
    $check->bind_param("s", $lastGuestNumber);
    $check->execute();
    $check->store_result();
    $hasBorrow = $check->num_rows > 0;
    $check->close();

    if (!$hasBorrow) {
        // Reuse the existing guest number — no INSERT, no increment
        $_SESSION['guest_id'] = $lastGuestNumber;
        echo json_encode(["status" => "success", "guest_id" => $lastGuestNumber]);
        exit;
    }

    // Last guest did borrow — generate the next sequential number
    $lastSeq = (int) substr($lastGuestNumber, 4);
    $newSeq  = str_pad($lastSeq + 1, 3, '0', STR_PAD_LEFT);
} else {
    $newSeq = "001";
}

$guestNumber = $prefix . $newSeq;

$sql  = "INSERT INTO guests (guest_number) VALUES (?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $guestNumber);

if ($stmt->execute()) {
    $_SESSION['guest_id'] = $guestNumber;
    echo json_encode(["status" => "success", "guest_id" => $guestNumber]);
} else {
    echo json_encode(["status" => "error", "message" => "Error generating guest number."]);
}

$stmt->close();
?>