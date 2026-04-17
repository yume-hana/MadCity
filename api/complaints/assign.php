<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

if ($user['role'] != 'admin') {
    sendResponse(403, "Only admin can assign technicians");
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->complaint_id) || !isset($data->technician_id)) {
    sendResponse(400, "Missing complaint_id or technician_id");
}

// Check if technician exists
$techQuery = "SELECT id FROM users WHERE id = ? AND role = 'technician'";
$techStmt = $conn->prepare($techQuery);
$techStmt->execute([$data->technician_id]);

if ($techStmt->rowCount() == 0) {
    sendResponse(404, "Technician not found");
}

// Assign technician and change status to in_progress
$updateQuery = "UPDATE problem SET assigned_to = ?, state = 'in_progress', updated_at = NOW() WHERE id = ?";
$updateStmt = $conn->prepare($updateQuery);
$updateStmt->execute([$data->technician_id, $data->complaint_id]);

// Add to timeline
$timelineQuery = "INSERT INTO problem_timeline (problem_id, changed_by, old_state, new_state, note) VALUES (?, ?, 'pending', 'in_progress', ?)";
$timelineStmt = $conn->prepare($timelineQuery);
$timelineStmt->execute([$data->complaint_id, $user['id'], "Assigned to technician ID: " . $data->technician_id]);

sendResponse(200, "Technician assigned successfully");
?>