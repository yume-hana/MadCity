<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

if ($user['role'] != 'citizen') {
    sendResponse(403, "Only citizens can support complaints");
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->complaint_id)) {
    sendResponse(400, "Missing complaint_id");
}

// Check if already supported
$checkQuery = "SELECT id FROM supports WHERE problem_id = ? AND citizen_id = ?";
$checkStmt = $conn->prepare($checkQuery);
$checkStmt->execute([$data->complaint_id, $user['id']]);

if ($checkStmt->rowCount() > 0) {
    sendResponse(409, "You have already supported this complaint");
}

// Add support
$insertQuery = "INSERT INTO supports (problem_id, citizen_id) VALUES (?, ?)";
$insertStmt = $conn->prepare($insertQuery);
$insertStmt->execute([$data->complaint_id, $user['id']]);

// Update support count and check priority
$updateQuery = "UPDATE problem SET support_count = support_count + 1 WHERE id = ?";
$updateStmt = $conn->prepare($updateQuery);
$updateStmt->execute([$data->complaint_id]);

// Get current support count
$countQuery = "SELECT support_count FROM problem WHERE id = ?";
$countStmt = $conn->prepare($countQuery);
$countStmt->execute([$data->complaint_id]);
$supportCount = $countStmt->fetch(PDO::FETCH_ASSOC)['support_count'];

// Update priority based on support count
if ($supportCount >= 10) {
    $priorityQuery = "UPDATE problem SET priority = 'urgent' WHERE id = ? AND priority != 'urgent'";
    $priorityStmt = $conn->prepare($priorityQuery);
    $priorityStmt->execute([$data->complaint_id]);
} elseif ($supportCount >= 5) {
    $priorityQuery = "UPDATE problem SET priority = 'high' WHERE id = ? AND priority NOT IN ('urgent', 'high')";
    $priorityStmt = $conn->prepare($priorityQuery);
    $priorityStmt->execute([$data->complaint_id]);
}

sendResponse(200, "Complaint supported successfully", ["support_count" => $supportCount]);
?>