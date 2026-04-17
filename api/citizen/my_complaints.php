<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

if ($user['role'] != 'citizen') {
    sendResponse(403, "Access denied");
}

$query = "SELECT p.id, p.title, p.description, p.category, p.state, p.priority, p.image_url, 
                 p.created_at, p.solved_at, p.rating, p.support_count,
                 a.street_number, a.street_name, a.neighborhood, a.landmark,
                 (SELECT COUNT(*) FROM supports s WHERE s.problem_id = p.id) as supports_count
          FROM problem p
          JOIN address a ON p.address_id = a.id
          WHERE p.citizen_id = ?
          ORDER BY p.created_at DESC";

$stmt = $conn->prepare($query);
$stmt->execute([$user['id']]);
$complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendResponse(200, "Success", $complaints);
?>