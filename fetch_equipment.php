<?php

include 'db.php';

$query = "SELECT equipment_id, equipment_name, account_person, total_qty, working_qty, not_working_qty, available FROM equipment";
$result = mysqli_query($conn, $query);

$equipment = [];

while ($row = mysqli_fetch_assoc($result)) {
    $equipment[] = $row;
}

echo json_encode($equipment);
?>
