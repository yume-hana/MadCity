<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

if (!isset($_GET['id'])) {
    sendResponse(400, "Missing complaint ID");
}

$complaintId = $_GET['id'];

// Get complaint details
$query = "SELECT p.*, 
                 u.full_name as citizen_name, u.phone as citizen_phone, u.email as citizen_email,
                 a.street_number, a.street_name, a.neighborhood, a.landmark,
                 t.full_name as technician_name
          FROM problem p
          JOIN users u ON p.citizen_id = u.id
          JOIN address a ON p.address_id = a.id
          LEFT JOIN users t ON p.assigned_to = t.id
          WHERE p.id = ?";

$stmt = $conn->prepare($query);
$stmt->execute([$complaintId]);
$complaint = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$complaint) {
    sendResponse(404, "Complaint not found");
}

// Check permission
$allowed = false;
if ($user['role'] == 'admin') {
    $allowed = true;
} elseif ($user['role'] == 'citizen' && $complaint['citizen_id'] == $user['id']) {
    $allowed = true;
} elseif ($user['role'] == 'technician' && $complaint['assigned_to'] == $user['id']) {
    $allowed = true;
}

if (!$allowed) {
    sendResponse(403, "Access denied");
}

// Get timeline
$timelineQuery = "SELECT pt.*, u.full_name as changed_by_name
                  FROM problem_timeline pt
                  JOIN users u ON pt.changed_by = u.id
                  WHERE pt.problem_id = ?
                  ORDER BY pt.changed_at ASC";
$timelineStmt = $conn->prepare($timelineQuery);
$timelineStmt->execute([$complaintId]);
$timeline = $timelineStmt->fetchAll(PDO::FETCH_ASSOC);

// Get comments
$commentsQuery = "SELECT c.*, u.full_name as user_name, u.role as user_role
                  FROM comments c
                  JOIN users u ON c.user_id = u.id
                  WHERE c.problem_id = ? AND (c.is_internal = FALSE OR (c.is_internal = TRUE AND ? IN ('admin', 'technician')))
                  ORDER BY c.created_at ASC";
$commentsStmt = $conn->prepare($commentsQuery);
$commentsStmt->execute([$complaintId, $user['role']]);
$comments = $commentsStmt->fetchAll(PDO::FETCH_ASSOC);

sendResponse(200, "Success", [
    "complaint" => $complaint,
    "timeline" => $timeline,
    "comments" => $comments
]);
?>