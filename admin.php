<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all admins
    getAdmins($conn);
} elseif ($method === 'POST') {
    // Add new admin
    addAdmin($conn);
} elseif ($method === 'DELETE') {
    // Delete admin
    deleteAdmin($conn);
}

function getAdmins($conn) {
    $sql = "SELECT id, name, email, role, is_super_admin, created_at 
            FROM users 
            WHERE role IN ('admin', 'superadmin') 
            ORDER BY is_super_admin DESC, created_at ASC";
    
    $result = $conn->query($sql);
    
    $admins = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $admins[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'role' => $row['role'],
                'isSuperAdmin' => (bool)$row['is_super_admin'],
                'created_at' => $row['created_at']
            ];
        }
    }
    
    echo json_encode($admins);
}

function addAdmin($conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = $conn->real_escape_string($input['name']);
    $email = $conn->real_escape_string($input['email']);
    $password = base64_encode($input['password']); // Using base64 for demo
    
    // Check if user exists
    $check = $conn->query("SELECT id FROM users WHERE email = '$email'");
    if ($check && $check->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Username already exists']);
        return;
    }
    
    // Generate ID
    $id = 'admin_' . time() . '_' . rand(1000, 9999);
    
    // Insert admin
    $sql = "INSERT INTO users (id, name, email, password, role, is_super_admin) 
            VALUES ('$id', '$name', '$email', '$password', 'admin', FALSE)";
    
    if ($conn->query($sql)) {
        echo json_encode([
            'success' => true,
            'admin' => [
                'id' => $id,
                'name' => $name,
                'email' => $email,
                'role' => 'admin',
                'isSuperAdmin' => false
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create admin']);
    }
}

function deleteAdmin($conn) {
    $id = isset($_GET['id']) ? $_GET['id'] : '';
    $id = $conn->real_escape_string($id);
    
    // Check if it's super admin
    $check = $conn->query("SELECT is_super_admin FROM users WHERE id = '$id'");
    if ($check && $check->num_rows > 0) {
        $user = $check->fetch_assoc();
        if ($user['is_super_admin']) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Cannot delete super admin']);
            return;
        }
    }
    
    // Delete admin
    $sql = "DELETE FROM users WHERE id = '$id' AND role = 'admin'";
    
    if ($conn->query($sql)) {
        if ($conn->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Admin deleted successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Admin not found']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete admin']);
    }
}

$conn->close();
?>
