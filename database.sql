-- Recipe Master Database Schema
-- Run this SQL in phpMyAdmin or MySQL command line

CREATE DATABASE IF NOT EXISTS recipe_master CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE recipe_master;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'superadmin') DEFAULT 'user',
    is_super_admin BOOLEAN DEFAULT FALSE,
    remember_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    image_url TEXT,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    prep_time INT DEFAULT 0,
    cook_time INT DEFAULT 0,
    servings INT DEFAULT 1,
    difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Easy',
    cuisine_type VARCHAR(100),
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_title (title),
    INDEX idx_cuisine (cuisine_type),
    INDEX idx_difficulty (difficulty),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recipe suggestions table
CREATE TABLE IF NOT EXISTS recipe_suggestions (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    image_url TEXT,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    prep_time INT DEFAULT 0,
    cook_time INT DEFAULT 0,
    servings INT DEFAULT 1,
    difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Easy',
    cuisine_type VARCHAR(100),
    notes TEXT,
    submitted_by VARCHAR(50),
    submitted_by_name VARCHAR(100),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    INDEX idx_status (status),
    INDEX idx_submitted_by (submitted_by),
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default Super Admin (Gopal Kumar)
-- Password: Army@522 (base64 encoded for demo)
-- First delete any old admin entries to avoid conflicts
DELETE FROM users WHERE email = 'admin' OR email = 'Gopal522';

-- Insert Gopal Kumar as Super Admin
INSERT INTO users (id, name, email, password, role, is_super_admin) 
VALUES (
    'superadmin_001',
    'Gopal Kumar',
    'Gopal522',
    'QXJteUA1MjI=',
    'superadmin',
    TRUE
);

-- Verify Super Admin was created
SELECT id, name, email, role, is_super_admin FROM users WHERE role = 'superadmin';

-- Sample recipes (optional)
INSERT INTO recipes (title, ingredients, instructions, prep_time, cook_time, servings, difficulty, cuisine_type, image_url) VALUES
('Veg Biryani', 'Rice, vegetables, spices, yogurt', 'Soak rice\nCook vegetables\nLayer rice and vegetables\nDum cook for 30 minutes', 30, 60, 4, 'Medium', 'Indian', ''),
('Aloo Gobi', 'Potato, cauliflower, spices', 'Cut vegetables\nFry spices\nAdd vegetables\nCook till tender', 15, 25, 3, 'Easy', 'Indian', ''),
('Paneer Tikka', 'Paneer, yogurt, spices, bell peppers', 'Marinate paneer\nSkewer with vegetables\nGrill or bake\nServe hot', 20, 15, 4, 'Easy', 'Indian', '');
