<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

if ($user['role'] != 'technician') {
    sendResponse(403, "Access denied. Technician only.");
}

$query = "SELECT p.id, p.title, p.description, p.category, p.state, p.priority, p.image_url, 
                 p.created_at, p.support_count,
                 a.street_number, a.street_name, a.neighborhood, a.landmark,
                 u.full_name as citizen_name, u.phone as citizen_phone
          FROM problem p
          JOIN address a ON p.address_id = a.id
          JOIN users u ON p.citizen_id = u.id
          WHERE p.assigned_to = ? AND p.state IN ('pending', 'in_progress')
          ORDER BY p.priority = 'urgent' DESC, p.priority = 'high' DESC, p.created_at ASC";

$stmt = $conn->prepare($query);
$stmt->execute([$user['id']]);
$tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendResponse(200, "Success", $tasks);
?>