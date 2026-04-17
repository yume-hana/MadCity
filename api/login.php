<?php
require_once '../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    sendResponse(400, "Missing email or password");
}

// Check for static admin first
$staticAdminEmail = 'admin@madcity.dz';
$staticAdminPassword = 'Admin@123';

if ($data->email === $staticAdminEmail && $data->password === $staticAdminPassword) {
    // Check if admin exists in database, if not create him
    $checkQuery = "SELECT id, full_name, email, role FROM users WHERE email = ? AND role = 'admin'";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->execute([$staticAdminEmail]);
    
    if ($checkStmt->rowCount() == 0) {
        // Create admin account
        $passwordHash = password_hash($staticAdminPassword, PASSWORD_BCRYPT);
        $insertQuery = "INSERT INTO users (full_name, email, password_hash, role, phone, is_active) VALUES ('Administrator', ?, ?, 'admin', '0000000000', TRUE)";
        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->execute([$staticAdminEmail, $passwordHash]);
        $adminId = $conn->lastInsertId();
    } else {
        $admin = $checkStmt->fetch(PDO::FETCH_ASSOC);
        $adminId = $admin['id'];
    }
    
    sendResponse(200, "Login successful", [
        "token" => $adminId,
        "user" => [
            "id" => $adminId,
            "full_name" => "Administrator",
            "email" => $staticAdminEmail,
            "role" => "admin"
        ]
    ]);
}

// Normal user login (citizens and technicians)
$query = "SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = ?";
$stmt = $conn->prepare($query);
$stmt->execute([$data->email]);

if ($stmt->rowCount() == 0) {
    sendResponse(401, "Invalid email or password");
}

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user['is_active']) {
    sendResponse(403, "Please verify your email first");
}

if (!password_verify($data->password, $user['password_hash'])) {
    sendResponse(401, "Invalid email or password");
}

// Return user data
sendResponse(200, "Login successful", [
    "token" => $user['id'],
    "user" => [
        "id" => $user['id'],
        "full_name" => $user['full_name'],
        "email" => $user['email'],
        "role" => $user['role']
    ]
]);
?>