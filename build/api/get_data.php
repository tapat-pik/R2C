<?php
// api/get_data.php

// 1. เพิ่ม memory limit และ execution time สำหรับงานใหญ่
ini_set('memory_limit', '1024M');
set_time_limit(120);

// ปิด Error/Warning ไม่ให้พ่น HTML แทรก JSON
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

include 'db_connect.php'; 

if ($conn->connect_error) {
    echo json_encode(["table" => ["cols" => [], "rows" => []]]);
    exit();
}

$sheetName = isset($_GET['sheet']) ? $_GET['sheet'] : '';

$allowedTables = [
    'Material_Master', 
    'Stock_Data', 
    'Requirement_Data', 
    'Upcoming_Item', 
    'Budget_Data', 
    'VVIP_Data', 
    'PEAName_data',
    'StockN2_Data', 
    'N2PO_Data'
];

if (!in_array($sheetName, $allowedTables)) {
    echo json_encode(["table" => ["cols" => [], "rows" => []]]);
    $conn->close();
    exit();
}

$sql = "SELECT * FROM `$sheetName`";
$result = $conn->query($sql);

if (!$result) {
    echo json_encode(["table" => ["cols" => [], "rows" => []]]);
    $conn->close();
    exit();
}

// 🚀 เทคนิคประหยัด RAM: พ่น Output สตรีมออกไปตรงๆ ไม่สร้าง Array มหาศาลไว้ใน RAM
echo '{"table":{"cols":[';

// 1. พ่น Cols
$cols = [];
while ($finfo = $result->fetch_field()) {
    $cols[] = json_encode(["label" => $finfo->name], JSON_UNESCAPED_UNICODE);
}
echo implode(',', $cols);
echo '],"rows":[';

// 2. พ่น Rows ทีละแถว (Loop เสร็จแล้วเคลียร์ทันที)
$firstRow = true;
while ($row = $result->fetch_row()) {
    if (!$firstRow) {
        echo ',';
    }
    $firstRow = false;

    $formattedCells = [];
    foreach ($row as $val) {
        $formattedCells[] = ["v" => ($val !== null) ? $val : ""];
    }
    
    // พ่น JSON ของแถวนี้ออกไปทันที
    echo json_encode(["c" => $formattedCells], JSON_UNESCAPED_UNICODE);
    
    // ล้าง Output Buffer เพื่อส่งข้อมูลออกไปเรื่อยๆ RAM จะไม่สะสม
    if (ob_get_level() > 0) ob_flush();
    flush();
}

echo ']}}';

// เคลียร์ Memory DB
$result->free();
$conn->close();
?>