<?php
require_once 'config.php';

try {
    // Get recipe ID from URL
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid recipe ID'
        ]);
        exit;
    }
    
    // Delete recipe
    $sql = "DELETE FROM recipes WHERE id = $id";
    
    if ($conn->query($sql)) {
        if ($conn->affected_rows > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Recipe deleted successfully'
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Recipe not found'
            ]);
        }
    } else {
        throw new Exception($conn->error);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error deleting recipe: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
