<?php
// api/get_data.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// --- 1. ดึงไฟล์เชื่อมต่อ DB มาใช้ ---
include 'db_connect.php'; 

$sheetName = isset($_GET['sheet']) ? $_GET['sheet'] : '';
$allowedTables = ['Material_Master', 'Stock_Data', 'Requirement_Data', 'Upcoming_Item', 'Budget_Data', 'VVIP_Data', 'PEAName_data'];

$rows = []; 
$cols = []; // เตรียมตัวแปรสำหรับหัวตาราง

if (in_array($sheetName, $allowedTables)) {
    $sql = "SELECT * FROM $sheetName";
    $result = $conn->query($sql);
    
    if ($result) {
        // --- ส่วนที่เพิ่ม: สร้างหัวคอลัมน์ (cols) ---
        // ดึงรายชื่อ Field จาก MySQL มาทำเป็น label
        while ($finfo = $result->fetch_field()) {
            $cols[] = ["label" => $finfo->name];
        }

        // --- ส่วนข้อมูล (rows) เหมือนเดิม ---
        while($row = $result->fetch_row()) {
            $formattedCells = [];
            foreach($row as $val) {
                $formattedCells[] = ["v" => $val];
            }
            $rows[] = ["c" => $formattedCells];
        }
    }
}

// ส่งออก JSON ที่มีทั้ง cols และ rows
echo json_encode([
    "table" => [
        "cols" => $cols, // ตอนนี้มี cols แล้ว JavaScript จะไม่พัง
        "rows" => $rows
    ]
], JSON_UNESCAPED_UNICODE);

$conn->close();