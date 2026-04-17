<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

if ($user['role'] != 'citizen') {
    sendResponse(403, "Only citizens can rate complaints");
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->complaint_id) || !isset($data->stars)) {
    sendResponse(400, "Missing complaint_id or stars");
}

if ($data->stars < 1 || $data->stars > 5) {
    sendResponse(400, "Stars must be between 1 and 5");
}

// Check if complaint exists and is solved
$checkQuery = "SELECT id, citizen_id, state FROM problem WHERE id = ?";
$checkStmt = $conn->prepare($checkQuery);
$checkStmt->execute([$data->complaint_id]);
$complaint = $checkStmt->fetch(PDO::FETCH_ASSOC);

if (!$complaint) {
    sendResponse(404, "Complaint not found");
}

if ($complaint['citizen_id'] != $user['id']) {
    sendResponse(403, "You can only rate your own complaints");
}

if ($complaint['state'] != 'solved') {
    sendResponse(400, "Can only rate solved complaints");
}

// Check if already rated
$checkRatingQuery = "SELECT id FROM ratings WHERE problem_id = ? AND citizen_id = ?";
$checkRatingStmt = $conn->prepare($checkRatingQuery);
$checkRatingStmt->execute([$data->complaint_id, $user['id']]);

if ($checkRatingStmt->rowCount() > 0) {
    sendResponse(409, "You have already rated this complaint");
}

// Add rating
$insertQuery = "INSERT INTO ratings (problem_id, citizen_id, stars, comment) VALUES (?, ?, ?, ?)";
$insertStmt = $conn->prepare($insertQuery);
$insertStmt->execute([$data->complaint_id, $user['id'], $data->stars, $data->comment ?? null]);

// Update problem rating
$updateQuery = "UPDATE problem SET rating = ? WHERE id = ?";
$updateStmt = $conn->prepare($updateQuery);
$updateStmt->execute([$data->stars, $data->complaint_id]);

sendResponse(201, "Rating submitted successfully");
?>