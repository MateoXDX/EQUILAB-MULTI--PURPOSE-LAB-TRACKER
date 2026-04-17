<?php
header('Content-Type: application/json');
require 'db.php';

try {
    $stmt = $pdo->prepare("SELECT * FROM borrowed_equipment");
    $stmt->execute();
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $response = [];

    foreach ($requests as $req) {
        $borrowRequestId = $req['id'];

        $eqStmt = $pdo->prepare("SELECT * FROM borrowed_equipment WHERE borrow_request_id = ?");
        $eqStmt->execute([$borrowRequestId]);
        $items = $eqStmt->fetchAll(PDO::FETCH_ASSOC);

        $equipmentList = array_map(function ($item) {
            return [
                'equipment_id' => $item['equipment_id'],
                'equipment_name' => $item['equipment_name'],
                'quantity' => $item['quantity'],
                'available' => $item['available'],
                'returned_on' => $item['returned_on'],
                'remarks' => $item['remarks']
            ];
        }, $items);

        $response[$borrowRequestId] = [
            'id' => $req['id'],
            'guest_number' => $req['guest_number'],
            'borrower_name' => $req['borrower_name'],
            'student_id' => $req['student_id'],
            'instructor_name' => $req['instructor_name'],
            'subject_code' => $req['subject_code'],
            'date' => $req['date'],
            'room' => $req['room'],
            'usage_date' => $req['usage_date'],
            'status' => $req['status'],
            'is_returned' => !empty($req['returned_on']),
            'equipment' => $equipmentList
        ];
    }

    echo json_encode($response);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
