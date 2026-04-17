<?php
require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

$user = validateToken($conn);

if ($user['role'] != 'admin') {
    sendResponse(403, "Access denied. Admin only.");
}

// Today's new complaints
$todayQuery = "SELECT COUNT(*) as count FROM problem WHERE DATE(created_at) = CURDATE()";
$todayStmt = $conn->prepare($todayQuery);
$todayStmt->execute();
$newToday = $todayStmt->fetch(PDO::FETCH_ASSOC)['count'];

// In progress
$inProgressQuery = "SELECT COUNT(*) as count FROM problem WHERE state = 'in_progress'";
$inProgressStmt = $conn->prepare($inProgressQuery);
$inProgressStmt->execute();
$inProgress = $inProgressStmt->fetch(PDO::FETCH_ASSOC)['count'];

// Solved this month
$solvedQuery = "SELECT COUNT(*) as count FROM problem WHERE state = 'solved' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())";
$solvedStmt = $conn->prepare($solvedQuery);
$solvedStmt->execute();
$solvedMonth = $solvedStmt->fetch(PDO::FETCH_ASSOC)['count'];

// Category distribution
$categoryQuery = "SELECT category, COUNT(*) as count FROM problem GROUP BY category";
$categoryStmt = $conn->prepare($categoryQuery);
$categoryStmt->execute();
$categories = $categoryStmt->fetchAll(PDO::FETCH_ASSOC);

// Top neighborhoods
$neighborhoodQuery = "SELECT a.neighborhood, COUNT(*) as count 
                      FROM problem p 
                      JOIN address a ON p.address_id = a.id 
                      GROUP BY a.neighborhood 
                      ORDER BY count DESC 
                      LIMIT 5";
$neighborhoodStmt = $conn->prepare($neighborhoodQuery);
$neighborhoodStmt->execute();
$topNeighborhoods = $neighborhoodStmt->fetchAll(PDO::FETCH_ASSOC);

// Average rating
$ratingQuery = "SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings FROM problem WHERE rating IS NOT NULL";
$ratingStmt = $conn->prepare($ratingQuery);
$ratingStmt->execute();
$ratings = $ratingStmt->fetch(PDO::FETCH_ASSOC);

sendResponse(200, "Success", [
    "today_new" => $newToday,
    "in_progress" => $inProgress,
    "solved_month" => $solvedMonth,
    "categories" => $categories,
    "top_neighborhoods" => $topNeighborhoods,
    "average_rating" => round($ratings['avg_rating'] ?? 0, 1),
    "total_ratings" => $ratings['total_ratings'] ?? 0
]);
?>