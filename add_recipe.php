<?php
require_once 'config.php';

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (empty($input['title']) || empty($input['ingredients']) || empty($input['instructions'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Title, ingredients, and instructions are required'
        ]);
        exit;
    }
    
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
    
    // Insert recipe
    $sql = "INSERT INTO recipes (title, image_url, ingredients, instructions, prep_time, cook_time, servings, difficulty, cuisine_type) 
            VALUES ('$title', '$image_url', '$ingredients', '$instructions', $prep_time, $cook_time, $servings, '$difficulty', '$cuisine_type')";
    
    if ($conn->query($sql)) {
        $recipe_id = $conn->insert_id;
        
        // Fetch the newly created recipe
        $result = $conn->query("SELECT * FROM recipes WHERE id = $recipe_id");
        $recipe = $result->fetch_assoc();
        
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
        throw new Exception($conn->error);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error adding recipe: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
