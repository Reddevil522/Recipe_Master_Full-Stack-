<?php
require_once 'config.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Login or Register
    $input = json_decode(file_get_contents('php://input'), true);
    $action = isset($input['action']) ? $input['action'] : '';
    
    if ($action === 'login') {
        handleLogin($conn, $input);
    } elseif ($action === 'register') {
        handleRegister($conn, $input);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} elseif ($method === 'GET') {
    // Get current user or all users
    if (isset($_GET['action']) && $_GET['action'] === 'get_users') {
        getAllUsers($conn);
    }
}

function handleLogin($conn, $input) {
    $email = $conn->real_escape_string($input['email']);
    $password = $input['password'];
    
    $sql = "SELECT * FROM users WHERE email = '$email'";
    $result = $conn->query($sql);
    
    if ($result && $result->num_rows > 0) {
        $user = $result->fetch_assoc();
        
        // Verify password (using base64 for demo - matches frontend)
        if ($user['password'] === base64_encode($password)) {
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'isSuperAdmin' => (bool)$user['is_super_admin']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
}

function handleRegister($conn, $input) {
    $name = $conn->real_escape_string($input['name']);
    $email = $conn->real_escape_string($input['email']);
    $password = base64_encode($input['password']); // Using base64 for demo
    
    // Check if user exists
    $check = $conn->query("SELECT id FROM users WHERE email = '$email'");
    if ($check && $check->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        return;
    }
    
    // Generate ID
    $id = 'u_' . time() . '_' . rand(1000, 9999);
    
    // Insert user
    $sql = "INSERT INTO users (id, name, email, password, role, is_super_admin) 
            VALUES ('$id', '$name', '$email', '$password', 'user', FALSE)";
    
    if ($conn->query($sql)) {
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $id,
                'name' => $name,
                'email' => $email,
                'role' => 'user',
                'isSuperAdmin' => false
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Registration failed']);
    }
}

function getAllUsers($conn) {
    $sql = "SELECT id, name, email, role, is_super_admin FROM users";
    $result = $conn->query($sql);
    
    $users = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $users[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'role' => $row['role'],
                'isSuperAdmin' => (bool)$row['is_super_admin']
            ];
        }
    }
    
    echo json_encode($users);
}

$conn->close();
?>
