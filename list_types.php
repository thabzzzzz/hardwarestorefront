<?php
try {
    $dsn = "pgsql:host=127.0.0.1;port=5432;dbname=homestead";
    $user = "homestead";
    $password = "change_this_now";

    $pdo = new PDO($dsn, $user, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $stmt = $pdo->query("SELECT DISTINCT product_type FROM products ORDER BY product_type");
    $types = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode($types, JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
