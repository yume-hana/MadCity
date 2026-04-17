<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

if ($user['role'] != 'admin') {
    sendResponse(403, "Access denied. Admin only.");
}

// Get filters
$state = $_GET['state'] ?? null;
$category = $_GET['category'] ?? null;
$neighborhood = $_GET['neighborhood'] ?? null;
$priority = $_GET['priority'] ?? null;
$limit = $_GET['limit'] ?? 50;

$query = "SELECT p.id, p.title, p.description, p.category, p.state, p.priority, p.created_at, p.support_count, p.rating,
                 u.full_name as citizen_name, u.phone as citizen_phone, u.email as citizen_email,
                 a.street_number, a.street_name, a.neighborhood, a.landmark,
                 t.full_name as technician_name
          FROM problem p
          JOIN users u ON p.citizen_id = u.id
          JOIN address a ON p.address_id = a.id
          LEFT JOIN users t ON p.assigned_to = t.id
          WHERE 1=1";

$params = [];

if ($state) {
    $query .= " AND p.state = ?";
    $params[] = $state;
}
if ($category) {
    $query .= " AND p.category = ?";
    $params[] = $category;
}
if ($neighborhood) {
    $query .= " AND a.neighborhood = ?";
    $params[] = $neighborhood;
}
if ($priority) {
    $query .= " AND p.priority = ?";
    $params[] = $priority;
}

$query .= " ORDER BY 
            CASE p.priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
            END ASC,
            p.created_at DESC
            LIMIT " . intval($limit);

$stmt = $conn->prepare($query);
$stmt->execute($params);
$complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendResponse(200, "Success", $complaints);
?>