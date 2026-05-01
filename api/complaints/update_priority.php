<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->complaint_id) || !isset($data->priority)) {
    sendResponse(400, "Missing complaint_id or priority");
}

// Only admin can change priority
if ($user['role'] != 'admin') {
    sendResponse(403, "Only admins can change priority");
}

$updateQuery = "UPDATE problem SET priority = ?, updated_at = NOW() WHERE id = ?";
$updateStmt = $conn->prepare($updateQuery);

if ($updateStmt->execute([$data->priority, $data->complaint_id])) {
    sendResponse(200, "Priority updated successfully");
} else {
    sendResponse(500, "Failed to update priority");
}
?>
