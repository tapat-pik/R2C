<?php
// api/get_data.php
// header('Content-Type: application/json');
// header('Access-Control-Allow-Origin: *');

// // --- 1. ดึงไฟล์เชื่อมต่อ DB มาใช้ ---
// include 'db_connect.php'; 

// $sheetName = isset($_GET['sheet']) ? $_GET['sheet'] : '';
// $allowedTables = ['Material_Master', 'Stock_Data', 'Requirement_Data', 'Upcoming_Item', 'Budget_Data', 'VVIP_Data', 'PEAName_data', 'n2po_data','stockn2_data'];

// $rows = []; 
// $cols = []; // เตรียมตัวแปรสำหรับหัวตาราง

// if (in_array($sheetName, $allowedTables)) {
//     $sql = "SELECT * FROM $sheetName";
//     $result = $conn->query($sql);
    
//     if ($result) {
//         // --- ส่วนที่เพิ่ม: สร้างหัวคอลัมน์ (cols) ---
//         // ดึงรายชื่อ Field จาก MySQL มาทำเป็น label
//         while ($finfo = $result->fetch_field()) {
//             $cols[] = ["label" => $finfo->name];
//         }

//         // --- ส่วนข้อมูล (rows) เหมือนเดิม ---
//         while($row = $result->fetch_row()) {
//             $formattedCells = [];
//             foreach($row as $val) {
//                 $formattedCells[] = ["v" => $val];
//             }
//             $rows[] = ["c" => $formattedCells];
//         }
//     }
// }

// // ส่งออก JSON ที่มีทั้ง cols และ rows
// echo json_encode([
//     "table" => [
//         "cols" => $cols, // ตอนนี้มี cols แล้ว JavaScript จะไม่พัง
//         "rows" => $rows
//     ]
// ], JSON_UNESCAPED_UNICODE);

// $conn->close();


// api/get_data.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once 'db_connect.php'; 

$sheetName = $_GET['sheet'] ?? '';

// Whitelist ตารางที่อนุญาต (ป้องกัน SQL Injection)
$allowedTables = [
    'Material_Master', 'Stock_Data', 'Requirement_Data', 
    'Upcoming_Item', 'Budget_Data', 'VVIP_Data', 
    'PEAName_data', 'N2PO_Data', 'StockN2_Data'
];

$rows = []; 
$cols = []; 

if (in_array($sheetName, $allowedTables, true)) {
    try {
        // ใช้ชื่อตารางแบบปลอดภัย
        $sql = "SELECT * FROM `$sheetName`";
        $result = $conn->query($sql);
        
        if ($result) {
            // 1. ดึงข้อมูล Metadata ของคอลัมน์ และเก็บชนิดข้อมูล (Type)
            $fields = $result->fetch_fields();
            foreach ($fields as $field) {
                $cols[] = ["label" => $field->name];
            }

            // 2. ดึงข้อมูลแบบรวดเร็ว และแปลง Type Casting ตัวเลขให้อัตโนมัติ
            while ($row = $result->fetch_row()) {
                $formattedCells = [];
                
                foreach ($row as $idx => $val) {
                    if ($val === null) {
                        $typedVal = "";
                    } elseif (is_numeric($val)) {
                        // แปลง String ตัวเลขจาก DB ให้เป็น Int/Float ตามจริง
                        $typedVal = $val + 0; 
                    } else {
                        $typedVal = $val;
                    }

                    $formattedCells[] = ["v" => $typedVal];
                }

                $rows[] = ["c" => $formattedCells];
            }
            $result->free();
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Query execution failed", "details" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        exit;
    }
} else {
    http_response_code(400);
    echo json_encode(["error" => "Invalid or unallowed sheet name"], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. ปิดการเชื่อมต่อ DB ทันทีที่ไม่ใช้แล้ว
$conn->close();

// 4. ส่งออก JSON แบบใช้ Flag เพิ่มประสิทธิภาพ
echo json_encode([
    "table" => [
        "cols" => $cols,
        "rows" => $rows
    ]
], JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);