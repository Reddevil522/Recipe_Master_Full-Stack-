<?php
require_once 'config.php';

try {
    // Get all recipes
    $sql = "SELECT * FROM recipes ORDER BY created_at DESC";
    $result = $conn->query($sql);
    
    $recipes = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $recipes[] = [
                'id' => (int)$row['id'],
                'title' => $row['title'],
                'image_url' => $row['image_url'],
                'ingredients' => $row['ingredients'],
                'instructions' => $row['instructions'],
                'prep_time' => (int)$row['prep_time'],
                'cook_time' => (int)$row['cook_time'],
                'servings' => (int)$row['servings'],
                'difficulty' => $row['difficulty'],
                'cuisine_type' => $row['cuisine_type'],
                'created_at' => $row['created_at']
            ];
        }
    }
    
    echo json_encode($recipes);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching recipes: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
