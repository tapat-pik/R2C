<?php
// api/db_connect.php
// $servername = "localhost";
// $username = "root";
// $password = "";
// $dbname = "r2c";

// $conn = new mysqli($servername, $username, $password, $dbname);

// if ($conn->connect_error) {
//     die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
// }

// // ตั้งค่าภาษาไทย
// $conn->set_charset("utf8");



// api/db_connect.php

// ตั้งค่าให้ mysqli โยน Exception เมื่อเกิด Error เพื่อจัดการได้ง่ายขึ้น
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$servername = "localhost";
$username   = "root";
$password   = "";
$dbname     = "r2c";

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    // ตั้งค่า Charset เป็น utf8mb4 (มาตรฐานระดับมืออาชีพ)
    $conn->set_charset("utf8mb4");

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Database connection error",
        "details" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}