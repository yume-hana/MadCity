<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

if ($user['role'] != 'admin') {
    sendResponse(403, "Access denied. Admin only.");
}

$query = "SELECT u.id, u.full_name, u.email, u.phone, u.created_at, 
          COUNT(p.id) as total_complaints
          FROM users u
          LEFT JOIN problem p ON u.id = p.citizen_id
          WHERE u.role = 'citizen'
          GROUP BY u.id
          ORDER BY u.created_at DESC";

$stmt = $conn->prepare($query);
$stmt->execute();
$citizens = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendResponse(200, "Success", $citizens);
?>
