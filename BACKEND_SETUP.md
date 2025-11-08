# 🚀 Recipe Master - Backend Setup Guide

## 📋 Prerequisites

### Required Software:
1. **XAMPP** / **WAMP** / **MAMP** (includes Apache, PHP, MySQL)
   - Download: https://www.apachefriends.org/
2. **PHP 7.4+**
3. **MySQL 5.7+**

---

## 🔧 Installation Steps

### Step 1: Install XAMPP

1. Download XAMPP from official website
2. Install XAMPP (default location: `C:\xampp`)
3. Start **Apache** and **MySQL** from XAMPP Control Panel

### Step 2: Setup Project Files

1. Copy your project folder to XAMPP's `htdocs`:
   ```
   C:\xampp\htdocs\recipe-master\
   ```

2. Your folder structure should be:
   ```
   recipe-master/
   ├── index.html
   ├── Script.js
   ├── Style.css
   └── api/
       ├── config.php
       ├── database.sql
       ├── get_recipes.php
       ├── add_recipe.php
       ├── update_recipe.php
       └── delete_recipe.php
   ```

### Step 3: Create Database

#### Option 1: Using phpMyAdmin (Recommended)

1. Open browser: `http://localhost/phpmyadmin`
2. Click **"New"** in left sidebar
3. Database name: `recipe_master`
4. Collation: `utf8mb4_unicode_ci`
5. Click **"Create"**
6. Click **"Import"** tab
7. Choose file: `api/database.sql`
8. Click **"Go"**

#### Option 2: Using MySQL Command Line

```bash
# Open XAMPP Shell or Command Prompt
cd C:\xampp\mysql\bin

# Login to MySQL
mysql -u root -p
# (Press Enter if no password)

# Run SQL file
source C:/xampp/htdocs/recipe-master/api/database.sql
```

### Step 4: Configure Database Connection

Edit `api/config.php` if needed:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // Your MySQL password (default is empty)
define('DB_NAME', 'recipe_master');
```

### Step 5: Test Backend

Open browser and test:

1. **Get Recipes:**
   ```
   http://localhost/recipe-master/api/get_recipes.php
   ```
   Should return JSON array of recipes

2. **Test with Postman/Browser:**
   - GET: `http://localhost/recipe-master/api/get_recipes.php`
   - Should see sample recipes

---

## 🧪 Testing API Endpoints

### 1. Get All Recipes
```
Method: GET
URL: http://localhost/recipe-master/api/get_recipes.php
Response: Array of recipe objects
```

### 2. Add Recipe
```
Method: POST
URL: http://localhost/recipe-master/api/add_recipe.php
Headers: Content-Type: application/json
Body:
{
  "title": "Test Recipe",
  "ingredients": "Ingredient 1, Ingredient 2",
  "instructions": "Step 1\nStep 2",
  "prep_time": 10,
  "cook_time": 20,
  "servings": 4,
  "difficulty": "Easy",
  "cuisine_type": "Indian",
  "image_url": ""
}
```

### 3. Update Recipe
```
Method: PUT
URL: http://localhost/recipe-master/api/update_recipe.php?id=1
Headers: Content-Type: application/json
Body: (same as add recipe)
```

### 4. Delete Recipe
```
Method: DELETE
URL: http://localhost/recipe-master/api/delete_recipe.php?id=1
```

---

## 🔗 Connect Frontend to Backend

Your `Script.js` already has the API base URL:

```javascript
const API_BASE = 'http://localhost/recipe-master/api';
```

Make sure this matches your project location!

---

## 🐛 Troubleshooting

### Issue 1: "Connection Refused"
**Solution:**
- Make sure Apache and MySQL are running in XAMPP
- Check if URL is correct: `http://localhost/recipe-master/`

### Issue 2: "Database connection failed"
**Solution:**
- Verify MySQL is running
- Check credentials in `config.php`
- Make sure database `recipe_master` exists

### Issue 3: "404 Not Found"
**Solution:**
- Check project is in `htdocs` folder
- Verify file paths are correct
- Check Apache is running

### Issue 4: "CORS Error"
**Solution:**
- Already handled in `config.php`
- If still issues, add to Apache config:
  ```apache
  Header set Access-Control-Allow-Origin "*"
  ```

### Issue 5: "JSON Parse Error"
**Solution:**
- Check PHP error logs: `C:\xampp\apache\logs\error.log`
- Enable error display in PHP:
  ```php
  ini_set('display_errors', 1);
  error_reporting(E_ALL);
  ```

---

## 📊 Database Structure

### Users Table
```sql
- id (VARCHAR 50) - Primary Key
- name (VARCHAR 100)
- email (VARCHAR 100) - Unique
- password (VARCHAR 255) - Hashed
- role (ENUM: user, admin, superadmin)
- is_super_admin (BOOLEAN)
- created_at (TIMESTAMP)
```

### Recipes Table
```sql
- id (INT) - Auto Increment Primary Key
- title (VARCHAR 200)
- image_url (TEXT)
- ingredients (TEXT)
- instructions (TEXT)
- prep_time (INT)
- cook_time (INT)
- servings (INT)
- difficulty (ENUM: Easy, Medium, Hard)
- cuisine_type (VARCHAR 100)
- created_at (TIMESTAMP)
```

### Recipe Suggestions Table
```sql
- id (VARCHAR 50) - Primary Key
- title, ingredients, instructions, etc.
- submitted_by (VARCHAR 50) - Foreign Key to users
- status (ENUM: pending, approved, rejected)
- submitted_at (TIMESTAMP)
```

---

## 🔒 Security Notes

### Current Implementation (Demo):
- ⚠️ Basic security for development
- ⚠️ No authentication tokens
- ⚠️ Simple SQL escaping

### For Production:
1. **Use Prepared Statements:**
   ```php
   $stmt = $conn->prepare("SELECT * FROM recipes WHERE id = ?");
   $stmt->bind_param("i", $id);
   ```

2. **Add Authentication:**
   - JWT tokens
   - Session management
   - Password hashing (bcrypt)

3. **Input Validation:**
   - Sanitize all inputs
   - Validate data types
   - Check permissions

4. **HTTPS:**
   - Use SSL certificate
   - Secure connections

---

## 🎯 Quick Start Checklist

- [ ] XAMPP installed
- [ ] Apache running (port 80)
- [ ] MySQL running (port 3306)
- [ ] Project in `htdocs/recipe-master/`
- [ ] Database `recipe_master` created
- [ ] SQL file imported
- [ ] `config.php` configured
- [ ] Test URL: `http://localhost/recipe-master/`
- [ ] API test: `http://localhost/recipe-master/api/get_recipes.php`
- [ ] Frontend connected

---

## 📞 Support

### Check Logs:
- **Apache Error Log:** `C:\xampp\apache\logs\error.log`
- **PHP Error Log:** `C:\xampp\php\logs\php_error_log`
- **MySQL Error Log:** `C:\xampp\mysql\data\mysql_error.log`

### Common URLs:
- **Project:** `http://localhost/recipe-master/`
- **phpMyAdmin:** `http://localhost/phpmyadmin`
- **XAMPP Dashboard:** `http://localhost/dashboard`

---

**Backend Ready! 🎉**

Now your Recipe Master app will save data to MySQL database instead of localStorage!
