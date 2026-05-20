<?php
// api/db_connect.php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "r2c";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// ตั้งค่าภาษาไทย
$conn->set_charset("utf8");