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
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Prepare data
    $title = $conn->real_escape_string($input['title']);
    $image_url = isset($input['image_url']) ? $conn->real_escape_string($input['image_url']) : '';
    $ingredients = $conn->real_escape_string($input['ingredients']);
    $instructions = $conn->real_escape_string($input['instructions']);
    $prep_time = isset($input['prep_time']) ? (int)$input['prep_time'] : 0;
    $cook_time = isset($input['cook_time']) ? (int)$input['cook_time'] : 0;
    $servings = isset($input['servings']) ? (int)$input['servings'] : 1;
    $difficulty = isset($input['difficulty']) ? $conn->real_escape_string($input['difficulty']) : 'Easy';
    $cuisine_type = isset($input['cuisine_type']) ? $conn->real_escape_string($input['cuisine_type']) : '';
    
    // Update recipe
    $sql = "UPDATE recipes SET 
            title = '$title',
            image_url = '$image_url',
            ingredients = '$ingredients',
            instructions = '$instructions',
            prep_time = $prep_time,
            cook_time = $cook_time,
            servings = $servings,
            difficulty = '$difficulty',
            cuisine_type = '$cuisine_type'
            WHERE id = $id";
    
    if ($conn->query($sql)) {
        // Fetch updated recipe
        $result = $conn->query("SELECT * FROM recipes WHERE id = $id");
        $recipe = $result->fetch_assoc();
        
        if ($recipe) {
            echo json_encode([
                'id' => (int)$recipe['id'],
                'title' => $recipe['title'],
                'image_url' => $recipe['image_url'],
                'ingredients' => $recipe['ingredients'],
                'instructions' => $recipe['instructions'],
                'prep_time' => (int)$recipe['prep_time'],
                'cook_time' => (int)$recipe['cook_time'],
                'servings' => (int)$recipe['servings'],
                'difficulty' => $recipe['difficulty'],
                'cuisine_type' => $recipe['cuisine_type']
            ]);
        } else {
            throw new Exception('Recipe not found after update');
        }
    } else {
        throw new Exception($conn->error);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error updating recipe: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
