<?php
require_once '../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->full_name) || !isset($data->email) || !isset($data->password) || !isset($data->phone)) {
    sendResponse(400, "Missing required fields: full_name, email, password, phone");
}

// Check if email exists
$checkQuery = "SELECT id FROM users WHERE email = ?";
$checkStmt = $conn->prepare($checkQuery);
$checkStmt->execute([$data->email]);

if ($checkStmt->rowCount() > 0) {
    sendResponse(409, "Email already exists");
}

// Hash password
$passwordHash = password_hash($data->password, PASSWORD_BCRYPT);

// Insert user as citizen only (can't register as admin or technician)
$query = "INSERT INTO users (full_name, email, password_hash, role, phone, is_active) VALUES (?, ?, ?, 'citizen', ?, TRUE)";
$stmt = $conn->prepare($query);

if ($stmt->execute([$data->full_name, $data->email, $passwordHash, $data->phone])) {
    $userId = $conn->lastInsertId();
    
    sendResponse(201, "User registered successfully", [
        "id" => $userId,
        "full_name" => $data->full_name,
        "email" => $data->email,
        "role" => "citizen"
    ]);
} else {
    sendResponse(500, "Registration failed");
}
?>