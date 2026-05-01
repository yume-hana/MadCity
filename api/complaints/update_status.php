<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->complaint_id) || !isset($data->new_state)) {
    sendResponse(400, "Missing complaint_id or new_state");
}

// Check if user has permission
$checkQuery = "SELECT state, assigned_to, citizen_id FROM problem WHERE id = ?";
$checkStmt = $conn->prepare($checkQuery);
$checkStmt->execute([$data->complaint_id]);
$complaint = $checkStmt->fetch(PDO::FETCH_ASSOC);

if (!$complaint) {
    sendResponse(404, "Complaint not found");
}

$allowed = false;
if ($user['role'] == 'admin') {
    $allowed = true;
} elseif ($user['role'] == 'technician') {
    $assignedTechs = explode(',', $complaint['assigned_to']);
    if (in_array($user['id'], $assignedTechs)) {
        $allowed = true;
    }
}

if (!$allowed) {
    sendResponse(403, "You don't have permission to update this complaint");
}

// Update status
$oldState = $complaint['state'];
$updateQuery = "UPDATE problem SET state = ?, updated_at = NOW()";
$params = [$data->new_state];

if ($data->new_state == 'solved') {
    $updateQuery .= ", solved_at = NOW()";
}

$updateQuery .= " WHERE id = ?";
$params[] = $data->complaint_id;

$updateStmt = $conn->prepare($updateQuery);
$updateStmt->execute($params);

// Add to timeline
$timelineQuery = "INSERT INTO problem_timeline (problem_id, changed_by, old_state, new_state, note) VALUES (?, ?, ?, ?, ?)";
$timelineStmt = $conn->prepare($timelineQuery);
$timelineStmt->execute([$data->complaint_id, $user['id'], $oldState, $data->new_state, $data->note ?? null]);

sendResponse(200, "Status updated successfully");
?>