<?php
require 'vendor/autoload.php';
use PhpOffice\PhpSpreadsheet\IOFactory;

header("Content-Type: application/json");
include 'db.php';

if (isset($_FILES['excelFile']) && $_FILES['excelFile']['error'] === UPLOAD_ERR_OK) {
    $spreadsheet = IOFactory::load($_FILES['excelFile']['tmp_name']);
    $sheet = $spreadsheet->getActiveSheet();
    $rows = $sheet->toArray();

    $excelIds = [];
    for ($i = 1; $i < count($rows); $i++) {
        $id = trim($rows[$i][0]);
        if ($id !== '') {
            $excelIds[] = $id;
        }
    }

    if (count($excelIds) === 0) {
        echo json_encode(["success" => false, "message" => "No equipment IDs found in Excel file."]);
        exit;
    }

    $placeholders = implode(',', array_fill(0, count($excelIds), '?'));
    $types = str_repeat('s', count($excelIds)); 

    $sql = "SELECT equipment_id FROM equipment WHERE equipment_id IN ($placeholders)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$excelIds);
    $stmt->execute();
    $result = $stmt->get_result();

    $existingIds = [];
    while ($row = $result->fetch_assoc()) {
        $existingIds[] = $row['equipment_id'];
    }

    if (count($existingIds) > 0) {
        echo json_encode([
            "success" => false,
            "message" => "Duplicate equipment IDs found in database: " . implode(", ", $existingIds)
        ]);
        exit;
    }

    $stmt = $conn->prepare("
        INSERT INTO equipment 
        (equipment_id, equipment_name, serial_number, internal_sn, account_person, total_qty, working_qty, not_working_qty, available, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    for ($i = 1; $i < count($rows); $i++) {
        list($id, $name, $serial, $internal, $account, $total, $working, $notWorking, $desc) = $rows[$i];

        if (empty($id)) continue;

        $total = (int)$total;
        $working = (int)$working;
        $notWorking = (int)$notWorking;
        $available = $working; 

        $stmt->bind_param("sssssiisis", $id, $name, $serial, $internal, $account, $total, $working, $notWorking, $available, $desc);
        $stmt->execute();
    }

    echo json_encode(["success" => true]);

} else {
    echo json_encode(["success" => false, "message" => "Upload error"]);
}
