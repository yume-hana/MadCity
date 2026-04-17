<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class Database {
    private $host = "localhost";
    private $db_name = "MadCity";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo json_encode(["error" => "Connection error: " . $exception->getMessage()]);
            exit();
        }
        return $this->conn;
    }
}

function sendResponse($status, $message, $data = null) {
    http_response_code($status);
    echo json_encode([
        "status" => $status,
        "message" => $message,
        "data" => $data
    ]);
    exit();
}

function validateToken($conn) {
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        sendResponse(401, "Unauthorized - No token provided");
    }
    
    $token = str_replace('Bearer ', '', $headers['Authorization']);
    $query = "SELECT id, full_name, email, role FROM users WHERE id = ? AND is_active = TRUE";
    $stmt = $conn->prepare($query);
    $stmt->execute([$token]);
    
    if ($stmt->rowCount() == 0) {
        sendResponse(401, "Unauthorized - Invalid token");
    }
    
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
?>