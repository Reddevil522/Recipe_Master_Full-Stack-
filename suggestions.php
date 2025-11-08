<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all suggestions
    getSuggestions($conn);
} elseif ($method === 'POST') {
    // Add new suggestion
    addSuggestion($conn);
} elseif ($method === 'PUT') {
    // Update suggestion status (approve/reject)
    updateSuggestion($conn);
}

function getSuggestions($conn) {
    $status = isset($_GET['status']) ? $_GET['status'] : 'pending';
    $status = $conn->real_escape_string($status);
    
    $sql = "SELECT * FROM recipe_suggestions WHERE status = '$status' ORDER BY submitted_at DESC";
    $result = $conn->query($sql);
    
    $suggestions = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $suggestions[] = [
                'id' => $row['id'],
                'title' => $row['title'],
                'image_url' => $row['image_url'],
                'ingredients' => $row['ingredients'],
                'instructions' => $row['instructions'],
                'prep_time' => (int)$row['prep_time'],
                'cook_time' => (int)$row['cook_time'],
                'servings' => (int)$row['servings'],
                'difficulty' => $row['difficulty'],
                'cuisine_type' => $row['cuisine_type'],
                'notes' => $row['notes'],
                'submittedBy' => $row['submitted_by_name'],
                'submittedAt' => $row['submitted_at'],
                'status' => $row['status']
            ];
        }
    }
    
    echo json_encode($suggestions);
}

function addSuggestion($conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $id = 's_' . time() . '_' . rand(1000, 9999);
    $title = $conn->real_escape_string($input['title']);
    $image_url = isset($input['image_url']) ? $conn->real_escape_string($input['image_url']) : '';
    $ingredients = $conn->real_escape_string($input['ingredients']);
    $instructions = $conn->real_escape_string($input['instructions']);
    $prep_time = isset($input['prep_time']) ? (int)$input['prep_time'] : 0;
    $cook_time = isset($input['cook_time']) ? (int)$input['cook_time'] : 0;
    $servings = isset($input['servings']) ? (int)$input['servings'] : 1;
    $difficulty = isset($input['difficulty']) ? $conn->real_escape_string($input['difficulty']) : 'Easy';
    $cuisine_type = isset($input['cuisine_type']) ? $conn->real_escape_string($input['cuisine_type']) : '';
    $notes = isset($input['notes']) ? $conn->real_escape_string($input['notes']) : '';
    $submitted_by = isset($input['submitted_by']) ? $conn->real_escape_string($input['submitted_by']) : NULL;
    $submitted_by_name = isset($input['submitted_by_name']) ? $conn->real_escape_string($input['submitted_by_name']) : 'Anonymous';
    
    $sql = "INSERT INTO recipe_suggestions 
            (id, title, image_url, ingredients, instructions, prep_time, cook_time, servings, difficulty, cuisine_type, notes, submitted_by, submitted_by_name, status) 
            VALUES ('$id', '$title', '$image_url', '$ingredients', '$instructions', $prep_time, $cook_time, $servings, '$difficulty', '$cuisine_type', '$notes', " . 
            ($submitted_by ? "'$submitted_by'" : "NULL") . ", '$submitted_by_name', 'pending')";
    
    if ($conn->query($sql)) {
        echo json_encode([
            'success' => true,
            'id' => $id,
            'message' => 'Suggestion submitted successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to submit suggestion']);
    }
}

function updateSuggestion($conn) {
    $id = isset($_GET['id']) ? $_GET['id'] : '';
    $input = json_decode(file_get_contents('php://input'), true);
    $status = isset($input['status']) ? $input['status'] : 'pending';
    
    $id = $conn->real_escape_string($id);
    $status = $conn->real_escape_string($status);
    
    $sql = "UPDATE recipe_suggestions SET status = '$status', reviewed_at = NOW() WHERE id = '$id'";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true, 'message' => 'Suggestion updated']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update suggestion']);
    }
}

$conn->close();
?>
