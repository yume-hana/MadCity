<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->complaint_id) || !isset($data->content)) {
    sendResponse(400, "Missing complaint_id or content");
}

// Check if user has access to this complaint
$checkQuery = "SELECT p.id, p.citizen_id, p.assigned_to 
               FROM problem p 
               WHERE p.id = ?";
$checkStmt = $conn->prepare($checkQuery);
$checkStmt->execute([$data->complaint_id]);
$complaint = $checkStmt->fetch(PDO::FETCH_ASSOC);

if (!$complaint) {
    sendResponse(404, "Complaint not found");
}

$isInternal = ($data->is_internal ?? false) && $user['role'] == 'admin';

$query = "INSERT INTO comments (problem_id, user_id, content, is_internal) VALUES (?, ?, ?, ?)";
$stmt = $conn->prepare($query);
$stmt->execute([$data->complaint_id, $user['id'], $data->content, $isInternal]);

sendResponse(201, "Comment added successfully");
?>