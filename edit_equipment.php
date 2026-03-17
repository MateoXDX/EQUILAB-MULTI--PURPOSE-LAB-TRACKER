<?php

header("Content-Type: application/json");
require 'db.php';

$equipmentID      = $conn->real_escape_string($_POST['equipmentID']);
$equipmentName    = $conn->real_escape_string($_POST['equipmentName']);
$serialNumber     = $conn->real_escape_string($_POST['serialNumber']);
$internalSN       = $conn->real_escape_string($_POST['internalSN']);
$totalQty         = intval($_POST['totalQty']);
$workingQty       = intval($_POST['workingQty']);
$notWorkingQty    = intval($_POST['notWorkingQty']);
$description      = $conn->real_escape_string($_POST['description']);
$accountablePerson= $conn->real_escape_string($_POST['accountablePerson']);

if (
    empty($equipmentID) || empty($equipmentName) || 
    empty($accountablePerson)
) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit;
}

$sql = "UPDATE equipment SET 
            equipment_name = '$equipmentName',
            serial_number = '$serialNumber',
            internal_sn = '$internalSN',
            account_person = '$accountablePerson',
            total_qty = $totalQty,
            working_qty = $workingQty,
            not_working_qty = $notWorkingQty,
            available = $workingQty,
            description = '$description'
        WHERE equipment_id = '$equipmentID'";

if ($conn->query($sql) === TRUE) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Error: " . $conn->error]);
}

$conn->close();
?>
