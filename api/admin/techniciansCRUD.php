<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

if ($user['role'] != 'admin') {
    sendResponse(403, "Access denied. Admin only.");
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - List all technicians
if ($method === 'GET') {
    $query = "SELECT id, full_name, email, phone, created_at FROM users WHERE role = 'technician' ORDER BY full_name ASC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $technicians = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(200, "Success", $technicians);
}

// POST - Create new technician
if ($method === 'POST') {
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
    
    $passwordHash = password_hash($data->password, PASSWORD_BCRYPT);
    
    $query = "INSERT INTO users (full_name, email, password_hash, role, phone, is_active) VALUES (?, ?, ?, 'technician', ?, TRUE)";
    $stmt = $conn->prepare($query);
    
    if ($stmt->execute([$data->full_name, $data->email, $passwordHash, $data->phone])) {
        sendResponse(201, "Technician created successfully", ["id" => $conn->lastInsertId()]);
    } else {
        sendResponse(500, "Failed to create technician");
    }
}

// DELETE - Remove technician
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->id)) {
        sendResponse(400, "Missing technician id");
    }
    
    // Check if technician has assigned tasks
    $checkQuery = "SELECT id FROM problem WHERE assigned_to = ? AND state != 'solved'";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->execute([$data->id]);
    
    if ($checkStmt->rowCount() > 0) {
        sendResponse(400, "Cannot delete technician with pending tasks");
    }
    
    $query = "DELETE FROM users WHERE id = ? AND role = 'technician'";
    $stmt = $conn->prepare($query);
    
    if ($stmt->execute([$data->id])) {
        sendResponse(200, "Technician deleted successfully");
    } else {
        sendResponse(500, "Failed to delete technician");
    }
}

sendResponse(405, "Method not allowed");
?>