<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$query = "SELECT r.stars, r.comment, r.rated_at, u.full_name as user_name, u.role, p.title as complaint_title
          FROM ratings r
          JOIN users u ON r.citizen_id = u.id
          JOIN problem p ON r.problem_id = p.id
          ORDER BY r.rated_at DESC LIMIT 10";

$stmt = $conn->prepare($query);
$stmt->execute();
$ratings = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendResponse(200, "Success", $ratings);
?>
