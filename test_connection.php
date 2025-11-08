<?php
// Simple test file to check if backend is working

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'success' => true,
    'message' => '✅ Backend is working!',
    'php_version' => phpversion(),
    'server_time' => date('Y-m-d H:i:s'),
    'server_info' => $_SERVER['SERVER_SOFTWARE']
]);

// Test database connection
require_once 'config.php';

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => '❌ Database connection failed',
        'error' => $conn->connect_error
    ]);
} else {
    // Check if tables exist
    $tables = [];
    $result = $conn->query("SHOW TABLES");
    while ($row = $result->fetch_array()) {
        $tables[] = $row[0];
    }
    
    echo json_encode([
        'success' => true,
        'message' => '✅ Database connected successfully!',
        'database' => DB_NAME,
        'tables' => $tables,
        'php_version' => phpversion()
    ]);
}

$conn->close();
?>
