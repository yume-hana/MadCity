<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

if ($user['role'] != 'admin') {
    sendResponse(403, "Only admin can assign technicians");
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->complaint_id) || !isset($data->technician_ids) || !is_array($data->technician_ids)) {
    sendResponse(400, "Missing complaint_id or technician_ids array");
}

if (count($data->technician_ids) == 0) {
    sendResponse(400, "Must assign at least one technician");
}

$techList = implode(',', $data->technician_ids);

// Assign technicians and change status to in_progress
$updateQuery = "UPDATE problem SET assigned_to = ?, state = 'in_progress', updated_at = NOW() WHERE id = ?";
$updateStmt = $conn->prepare($updateQuery);
$updateStmt->execute([$techList, $data->complaint_id]);

// Add to timeline
$timelineQuery = "INSERT INTO problem_timeline (problem_id, changed_by, old_state, new_state, note) VALUES (?, ?, 'pending', 'in_progress', ?)";
$timelineStmt = $conn->prepare($timelineQuery);
$timelineStmt->execute([$data->complaint_id, $user['id'], "Assigned to team: " . $techList]);

sendResponse(200, "Team assigned successfully");
?>