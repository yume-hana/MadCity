<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

if ($user['role'] != 'admin') {
    sendResponse(403, "Access denied. Admin only.");
}

$query = "SELECT id, full_name, email, phone, created_at FROM users WHERE role = 'technician' ORDER BY full_name ASC";
$stmt = $conn->prepare($query);
$stmt->execute();
$technicians = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendResponse(200, "Success", $technicians);
?>