<?php
require 'db.php';

header('Content-Type: application/json');

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit();
}


$equipmentID = trim($_POST['equipmentID'] ?? '');
$equipmentName = trim($_POST['equipmentName'] ?? '');
$serialNumber = trim($_POST['serialNumber'] ?? '');
$internalSN = trim($_POST['internalSN'] ?? '');
$totalQty = trim($_POST['totalQty'] ?? '');
$workingQty = trim($_POST['workingQty'] ?? '');
$notWorkingQty = trim($_POST['notWorkingQty'] ?? '');
$description = trim($_POST['description'] ?? '');
$accountablePerson = trim($_POST['accountablePerson'] ?? '');


if (
    $equipmentID === '' ||
    $equipmentName === '' ||
    $totalQty === '' ||
    $workingQty === '' ||
    $notWorkingQty === '' ||
    $accountablePerson === ''
) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit();
}


$totalQty = (int)$totalQty;
$workingQty = (int)$workingQty;
$notWorkingQty = (int)$notWorkingQty;
$available = $workingQty; 


$stmt = $conn->prepare("INSERT INTO equipment (equipment_id, equipment_name, serial_number, internal_sn, total_qty, working_qty, not_working_qty, description, account_person, available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'SQL prepare failed: ' . $conn->error]);
    exit();
}

$stmt->bind_param(
    "ssssiiissi",
    $equipmentID,
    $equipmentName,
    $serialNumber,
    $internalSN,
    $totalQty,
    $workingQty,
    $notWorkingQty,
    $description,
    $accountablePerson,
    $available
);


if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Equipment added successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Insert failed: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
