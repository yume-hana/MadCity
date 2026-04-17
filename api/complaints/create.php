<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

// Validate token
$user = validateToken($conn);

if ($user['role'] != 'citizen') {
    sendResponse(403, "Only citizens can create complaints");
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->title) || !isset($data->description) || !isset($data->category) || 
    !isset($data->neighborhood) || !isset($data->street_name)) {
    sendResponse(400, "Missing required fields: title, description, category, neighborhood, street_name");
}

// Create address first
$addressQuery = "INSERT INTO address (street_number, street_name, neighborhood, landmark) VALUES (?, ?, ?, ?)";
$addressStmt = $conn->prepare($addressQuery);
$addressStmt->execute([
    $data->street_number ?? null,
    $data->street_name,
    $data->neighborhood,
    $data->landmark ?? null
]);
$addressId = $conn->lastInsertId();

// Create complaint
$query = "INSERT INTO problem (title, description, category, citizen_id, address_id, image_url) VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($query);

$imageUrl = $data->image_url ?? null;

if ($stmt->execute([$data->title, $data->description, $data->category, $user['id'], $addressId, $imageUrl])) {
    $complaintId = $conn->lastInsertId();
    
    // Add to timeline
    $timelineQuery = "INSERT INTO problem_timeline (problem_id, changed_by, old_state, new_state, note) VALUES (?, ?, NULL, 'pending', 'Complaint submitted')";
    $timelineStmt = $conn->prepare($timelineQuery);
    $timelineStmt->execute([$complaintId, $user['id']]);
    
    sendResponse(201, "Complaint created successfully", [
        "complaint_id" => $complaintId
    ]);
} else {
    sendResponse(500, "Failed to create complaint");
}
?>