<?php
/**
 * instructor_login.php
 *
 * Authenticates an instructor and starts their session.
 * Instructors have their own credentials stored in `instructor_credentials`.
 *
 * If your project only stores instructors in the `instructors` table
 * (name only, no password), this file also supports a simple
 * PIN / password column added to that table – see README note.
 */

session_start();
require 'db_pdo.php';

header('Content-Type: application/json');

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

if (!$username || !$password) {
    echo json_encode(['status' => 'error', 'message' => 'Username and password required.']);
    exit;
}

/*
 * We look up in `instructor_credentials` first.
 * Fallback: if that table doesn't exist yet, use the `instructors` table
 *           with a `password_hash` column.
 *
 * Run this DDL once to create the credentials table:
 *
 *   CREATE TABLE IF NOT EXISTS instructor_credentials (
 *       id            INT AUTO_INCREMENT PRIMARY KEY,
 *       instructor_id INT NOT NULL,
 *       username      VARCHAR(80) NOT NULL UNIQUE,
 *       password      VARCHAR(255) NOT NULL,
 *       created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 *   );
 */
try {
    $stmt = $pdo->prepare(
        "SELECT ic.*, i.instructor_name
         FROM instructor_credentials ic
         JOIN instructors i ON i.id = ic.instructor_id
         WHERE ic.username = ?
         LIMIT 1"
    );
    $stmt->execute([$username]);
    $instructor = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (\PDOException $e) {
    /* Table may not exist yet – graceful error */
    echo json_encode(['status' => 'error', 'message' => 'Instructor login not configured. Contact administrator.']);
    exit;
}

if ($instructor && password_verify($password, $instructor['password'])) {
    $_SESSION['instructor_id']         = $instructor['id'];
    $_SESSION['instructor_name']       = $instructor['instructor_name'];
    $_SESSION['instructor_username']   = $instructor['username'];
    $_SESSION['instructor_logged_in']  = true;

    echo json_encode([
        'status'          => 'success',
        'instructor_name' => $instructor['instructor_name'],
    ]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid credentials.']);
}
