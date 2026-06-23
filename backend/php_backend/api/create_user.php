<?php
/**
 * ════════════════════════════════════════════════════════════════════════════
 * Smart Library — Create Test User
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Access: http://localhost:8000/api/create_user.php
 * 
 * POST parameters:
 *   - student_id: (required) e.g., "S12346"
 *   - full_name: (required) e.g., "Test User"
 *   - email: (required) e.g., "test@example.com"
 *   - password: (required) e.g., "password123"
 * ════════════════════════════════════════════════════════════════════════════
 */

require_once __DIR__ . '/db_connect.php';

header('Content-Type: application/json; charset=UTF-8');

// ── Allow setup without API key ──
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Show form for manual user creation
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>Create Test User</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #0F172A; color: white; }
            .container { max-width: 500px; margin: 0 auto; background: #1E293B; padding: 20px; border-radius: 8px; }
            h1 { color: #06B6D4; }
            label { display: block; margin-top: 15px; font-weight: bold; }
            input { width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #06B6D4; border-radius: 4px; box-sizing: border-box; }
            button { margin-top: 20px; width: 100%; padding: 12px; background: #06B6D4; color: black; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }
            button:hover { background: #0891b2; }
            .info { background: #334155; padding: 15px; border-radius: 4px; margin-top: 20px; }
            .success { background: #10B981; padding: 10px; border-radius: 4px; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>✨ Create Test User</h1>
            
            <form method="POST">
                <label>Student ID (e.g., S12346)</label>
                <input type="text" name="student_id" required>
                
                <label>Full Name</label>
                <input type="text" name="full_name" placeholder="John Test" required>
                
                <label>Email</label>
                <input type="email" name="email" placeholder="john@test.com" required>
                
                <label>Password</label>
                <input type="password" name="password" placeholder="password123" required>
                
                <button type="submit">Create User</button>
            </form>

            <div class="info">
                <h3>📝 Pre-filled Test Credentials:</h3>
                <ul>
                    <li><strong>Student ID:</strong> S54321</li>
                    <li><strong>Full Name:</strong> Test User 2</li>
                    <li><strong>Email:</strong> test2@example.com</li>
                    <li><strong>Password:</strong> password123</li>
                </ul>
                <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">Fill the form above with these values or create your own!</p>
            </div>
        </div>
    </body>
    </html>
    <?php
    exit();
}

// ── Handle POST request to create user ──
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = $_POST;
        
        $studentId = trim($data['student_id'] ?? '');
        $fullName = trim($data['full_name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        
        // Validate inputs
        if (empty($studentId) || empty($fullName) || empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'All fields are required'
            ]);
            exit();
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid email format'
            ]);
            exit();
        }
        
        // Hash password
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        
        // Insert user
        $stmt = $pdo->prepare("
            INSERT INTO users (student_id, full_name, email, password_hash, account_status)
            VALUES (:student_id, :full_name, :email, :password_hash, 'active')
        ");
        
        $stmt->execute([
            ':student_id' => $studentId,
            ':full_name' => $fullName,
            ':email' => $email,
            ':password_hash' => $passwordHash
        ]);
        
        $userId = $pdo->lastInsertId();
        
        http_response_code(201);
        echo json_encode([
            'status' => 'success',
            'message' => 'User created successfully!',
            'user' => [
                'user_id' => (int) $userId,
                'student_id' => $studentId,
                'full_name' => $fullName,
                'email' => $email,
                'password' => $password,  // Show for testing only
                'account_status' => 'active'
            ]
        ]);
        
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            http_response_code(409);
            echo json_encode([
                'status' => 'error',
                'message' => 'Student ID or Email already exists'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
    exit();
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
