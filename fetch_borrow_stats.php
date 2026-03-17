<?php
require 'db.php'; 

header('Content-Type: application/json');

if (!isset($_GET['date'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Date is missing',
        'debug' => $_GET
    ]);
    exit;
}

$date = $_GET['date']; 

$sql = "SELECT status, COUNT(*) AS count
        FROM borrow_requests
        WHERE DATE(created_at) = ?
        GROUP BY status";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $date);
$stmt->execute();
$result = $stmt->get_result();

$stats = [
    "total" => 0,
    "accepted" => 0,
    "rejected" => 0,
    "pending" => 0
];

while ($row = $result->fetch_assoc()) {
    $stats["total"] += $row['count'];
    $status = strtolower($row['status']);
    if (array_key_exists($status, $stats)) {
        $stats[$status] = $row['count'];
    }
}

echo json_encode([
    "success" => true,
    "stats" => $stats
]);
?>
