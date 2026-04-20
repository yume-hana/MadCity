<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

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

$query = "SELECT * FROM site_reviews ORDER BY created_at DESC LIMIT 10";
$stmt = $conn->prepare($query);
$stmt->execute();
$reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendResponse(200, "Success", $reviews);
?>
