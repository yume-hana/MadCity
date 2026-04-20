<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

// Create table if it doesn't exist
$createTableQuery = "CREATE TABLE IF NOT EXISTS site_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'مواطن',
    stars INT NOT NULL,
    comment TEXT NOT NULL,
    avatar_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";
$conn->exec($createTableQuery);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->stars) || !isset($data->comment) || !isset($data->user_name)) {
    sendResponse(400, "Missing required fields");
}

$insertQuery = "INSERT INTO site_reviews (user_name, role, stars, comment, avatar_id) VALUES (?, ?, ?, ?, ?)";
$stmt = $conn->prepare($insertQuery);
if ($stmt->execute([$data->user_name, 'مواطن', $data->stars, $data->comment, rand(1, 70)])) {
    sendResponse(201, "Review added successfully");
} else {
    sendResponse(500, "Failed to add review");
}
?>
