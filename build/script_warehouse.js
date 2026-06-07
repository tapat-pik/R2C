/**
 * Dashboard Single File - Optimized & Clean
 * All functionality in one file with optimizations
 */


// ==================== Configuration ====================
// const config = [
//     { name: 'Material_Master', target: '#tableParcel' },
//     { name: 'Stock_Data', target: '#tableMB52' },
//     { name: 'Requirement_Data', target: '#tableRequirement_Data' },
//     { name: 'Upcoming_Item', target: '#tableUpcoming_Item' },
//     { name: 'Budget_Data', target: '#tableUBudget_Data' },
//     { name: 'VVIP_Data', target: '#tableVVIP_Data' }
// ];

// ==================== Global State ====================

let parcelTable, mb52Table;
let globalVVIP = [];
let rawRequirementDatabase = null;
let peaNameMapping = {};
let totalStockSummary = {};
// ประกาศเพิ่มคู่กับพวก parcelTable, stockMatchTableInstance

let myPieChart = null;
let upcomingTableInstance = null;
let stockMatchTableInstance = null;
let noStockTableInstance = null;
let obsoleteTableInstance = null;
let UpcomingTabInstance = null; // ตัวแปรเก็บอินสแตนซ์ของตาราง Upcoming (เพิ่มใหม่)
// ==================== Constants ====================
const TABLE_STYLES = {
    headerStyle: 'color: #344767 !important;',
    textStyle: 'color: #67748E !important;',
    textBoldStyle: 'color: #1f5dda !important;',
    headerClass: 'px-6 py-3 font-bold text-left uppercase align-middle bg-transparent border-b border-gray-200 shadow-none text-m border-b-solid tracking-none whitespace-nowrap',
    cellClass: 'p-2 text-left align-middle bg-transparent border-b whitespace-nowrap shadow-transparent'
};

const STATUS_COLORS = {
    green: {
        gradient: 'linear-gradient(310deg, #17ad37 0%, #98ec2d 100%)',
        shadow: 'rgba(23, 173, 55, 0.3)',
        title: 'ของครบ'
    },
    red: {
        gradient: 'linear-gradient(310deg, #ea0606 0%, #ff667c 100%)',
        shadow: 'rgba(234, 6, 6, 0.3)',
        title: 'ไม่ได้ของเลย'
    },
    blue: {
        gradient: 'linear-gradient(310deg, #2152ff 0%, #21d4fd 100%)',
        shadow: 'rgba(33, 82, 255, 0.3)',
        title: 'พัสดุหลักครบ'
    },
    yellow: {
        gradient: 'linear-gradient(310deg, #f7d02c 0%, #fde08d 100%)',
        shadow: 'rgba(247, 208, 44, 0.3)',
        title: 'ได้ของบางส่วน'
    },
    // 🔒 เพิ่มเฉดสีและสไตล์สำหรับสถานะกุญแจล็อค (ใช้โทนเทา-เข้มหรูๆ สไตล์กุญแจเมทัลลิก)
    lock: {
        gradient: 'linear-gradient(310deg, #343a40 0%, #6c757d 100%)',
        shadow: 'rgba(52, 58, 64, 0.3)',
        title: 'ล็อค (พัสดุล้าสมัย/เปลี่ยนรหัส)'
    }
};

// ==================== Utility Functions ====================
const debounceTimers = new Map();

function debounce(key, fn, delay = 300) {
    if (debounceTimers.has(key)) {
        clearTimeout(debounceTimers.get(key));
    }
    const timer = setTimeout(() => {
        fn();
        debounceTimers.delete(key);
    }, delay);
    debounceTimers.set(key, timer);
}

/**
 * ดึงค่าจาก Cell ของ Google Sheets
 */
function getCellValue(cell) {
    if (!cell) return '';
    return cell.f ? cell.f : (cell.v !== null ? cell.v : '');
}

/**
 * สร้าง HTML วงกลมสี
 */
function createStatusCircle(status) {
    const color = STATUS_COLORS[status] || STATUS_COLORS.yellow;
    
    // 🔒 ถ้าสถานะเป็น lock ให้แสดงผลเป็นไอคอนกุญแจแทนวงกลม
    if (status === "lock") {
        return `
            <span class="ml-2 mr-1" style="
                display: inline-block;
                font-size: 20px;
                vertical-align: middle;
                line-height: 1;
            " title="${color.title}">🔒</span>
        `;
    }

    // 🟢 🔵 🟡 🔴 ถ้าเป็นสถานะอื่น วาดวงกลมตามเดิม
    return `
        <span class="ml-2 mr-1" style="
            display: inline-block;
            width: 12px;
            height: 12px;
            background: ${color.gradient};
            border-radius: 50%;
            box-shadow: 0 3px 5px ${color.shadow};
            vertical-align: middle;
        " title="${color.title}"></span>
    `;
}
// ==================== Data Service ====================
// const DataService = {
    
    //============== ดึงจาก mysql ======================//
//    async fetchSheetData(sheetName) {
//         const url = `api/get_data.php?sheet=${encodeURIComponent(sheetName)}`;

//         // 🔗 log บอกเมื่อระบบฝั่ง JavaScript เริ่มทำการเชื่อมต่อไปยัง API เพื่อดึงข้อมูลจาก MySQL

//         try {
//             const response = await fetch(url);
//             if (!response.ok) throw new Error(`Network response was not ok (Status: ${response.status})`);

//             const jsonData = await response.json();
            
//             // ✅ log บอกเมื่อดึงข้อมูลสำเร็จจาก MySQL พร้อมบอกจำนวนแถวข้อมูลที่ได้กลับมา
//             const rowCount = (jsonData.table && jsonData.table.rows) ? jsonData.table.rows.length : 0;
            
//             return jsonData.table;

//         } catch (err) {
//             // ❌ log แจ้งเตือนกรณีที่ระบบเกิด Error หรือติดต่อ API ของ MySQL ไม่สำเร็จ
//             return { cols: [], rows: [] };
//         }
//     },

    //============== ดึงจาก google sheet ======================//
//         async fetchSheetData(sheetName) {
//         const spreadsheetId = '1zhp1OMsuil2DhjttNGRpvi1SOPlbT5FLGRYqOMruIN4';
        
//         // ดึงข้อมูลผ่าน Google Endpoint ที่ให้โครงสร้างข้อมูลแบบตารางมาประมวลผลต่อได้ง่าย
//         const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}`;

//         // 🔗 log บอกเมื่อระบบเริ่มทำการยิงไปเชื่อมต่อกับ Google Sheet

//         try {
//             const response = await fetch(url);
//             if (!response.ok) throw new Error(`Network response was not ok (Status: ${response.status})`);

//             const textData = await response.text();
            
//             // ตัดเอาเฉพาะก้อนเนื้อหาข้อมูล JSON ที่อยู่ระหว่างวงเล็บ { ... }
//             const jsonStart = textData.indexOf('{');
//             const jsonEnd = textData.lastIndexOf('}');
//             if (jsonStart === -1 || jsonEnd === -1) {
//                 throw new Error('Invalid JSONP response format from Google Sheets');
//             }
            
//             const rawJsonStr = textData.substring(jsonStart, jsonEnd + 1);
//             const parsedData = JSON.parse(rawJsonStr);
            
//             const rawTable = parsedData.table;
//             if (!rawTable) return { cols: [], rows: [] };

//             // 🎯 จัดฟอร์แมตหัวคอลัมน์ (cols) ให้เหมือนกับของเดิมที่มาจาก MySQL
//             const formattedCols = (rawTable.cols || []).map(col => ({
//                 label: col.label || ""
//             }));

//             // 🎯 จัดฟอร์แมตข้อมูลในตาราง (rows) ให้คงโครงสร้าง "c" -> "v" เอาไว้เหมือนเดิมเป๊ะ
//             const formattedRows = (rawTable.rows || []).map(row => {
//                 if (!row || !row.c) return { c: [] };
                
//                 const formattedCells = row.c.map(cell => {
//                     if (!cell) return { v: "" };
//                     // ดึงค่า v จากเซลล์ออกมา หากค่าเป็น null หรือ undefined ให้เซ็ตเป็นสตริงว่าง
//                     return { v: cell.v !== null && cell.v !== undefined ? cell.v : "" };
//                 });

//                 // ตรวจเช็กและเติมเซลล์ว่างให้ครบตามจำนวนคอลัมน์ ป้องกันระบบ JavaScript ประมวลผลพลาด
//                 while (formattedCells.length < formattedCols.length) {
//                     formattedCells.push({ v: "" });
//                 }

//                 return { c: formattedCells };
//             });

//             // ✅ log บอกเมื่อเชื่อมต่อสำเร็จและแปลงข้อมูลเสร็จเรียบร้อย พร้อมบอกจำนวนแถวที่ได้มา

//             // ส่งข้อมูลกลับไปในโครงสร้างแบบเดิมที่โค้ดเก่าต้องการ
//             return {
//                 cols: formattedCols,
//                 rows: formattedRows
//             };

//         } catch (err) {
//             // ❌ log แจ้งเตือนกรณีที่การเชื่อมต่อเกิดการพังหรือดึงข้อมูลไม่ได้
//             return { cols: [], rows: [] };
//         }
//     },

//     async fetchVVIPData() {
//         const data = await this.fetchSheetData('VVIP_Data');
//         return data.rows || [];
//     },

//     async fetchPEANameData() {
//         const data = await this.fetchSheetData('PEAName_data');
//         const mapping = {};

//         if (data && data.rows) {
//             data.rows.forEach(row => {
//                 if (!row || !row.c) return;
//                 const peaCode = getCellValue(row.c[0])?.toString().trim();
//                 const peaName = getCellValue(row.c[1])?.toString().trim();
//                 if (peaCode && peaName) {
//                     mapping[peaCode] = peaName;
//                 }
//             });
//         }
//         return mapping;
//     },
//     // 🎯 อันนี้คือฟังก์ชันใหม่ที่คุณบิ๊กสั่งเพิ่มเข้าไปครับ!
//     async fetchUpcomingItemData() {
//         // ดึงข้อมูลทั้งก้อน (มีทั้ง cols และ rows) เพื่อเอาไปจัดคอลัมน์ต่อ
//         const data = await this.fetchSheetData('Upcoming_Item');
//         return data; 
//     },
//   async  fetchBudgetData() {
//     const data = await this.fetchSheetData('Budget_Data');
//     const mapping = {};
//     if (data && data.rows) {
//         data.rows.forEach(row => {
//             if (!row || !row.c) return;
            
//             const wbs = getCellValue(row.c[2])?.toString().trim();
            
//             // 🎯 1. ดึงค่าจาก JSON ออกมาเป็น String ดิบก่อน
//             const rawValue = getCellValue(row.c[19])?.toString() || "0";
            
//             // 🎯 2. ใช้ Regex ตัวนี้เคลียร์ทุกอย่างที่ไม่ใช่ ตัวเลข และ จุดทศนิยม ทิ้งให้เกลี้ยง (ลบคอมมา, ลบช่องว่าง)
//             const cleanValue = rawValue.replace(/[^0-9.]/g, ''); 
            
//             // 🎯 3. แปลงร่างเป็นตัวเลขทศนิยม (Float) ของ JavaScript เพื่อใช้คำนวณและแสดงผล
//             const budgetVal = parseFloat(cleanValue) || 0;
            
//             if (wbs) {
//                 // เก็บค่าเข้าไปในรูปแบบตัวเลขจำนวนเงินสุทธิ
//                 mapping[wbs] = budgetVal;
//             }
//         });
//     }
//     return mapping;
// }
    
// };



function renderUpcomingTable(data) {
    // แก้ไขจุดเสี่ยงที่ 1: ใช้ == null แทนการใช้เครื่องหมาย !
    if (data == null || data.rows == null) {
        return null;
    }

    const targetSel = '#tableUpcoming'; // ไอดีตารางในหน้า HTML
    const $el = $(targetSel);
    if ($.fn.DataTable.isDataTable(targetSel)) {
        $el.DataTable().destroy();
        $el.empty();
    }

    const colHeaders = [
        { title: "รหัสพัสดุ" },
        { title: "ชื่อพัสดุ" },
        { title: "กลุ่มการจัดซื้อ" },
        { title: "เอกสารการจัดซื้อ" },
        { title: "วันที่เอกสาร" },
        { title: "องค์ประกอบ WBS" },
        { title: "ชื่อผู้ขาย" },
        { title: "ปริมาณที่สั่ง" },
        { title: "หน่วยที่สั่ง" }
    ];

    // ดึงข้อมูลตามเลขช่อง Index โดยตรง
    const dataSet = data.rows.map(row => {
        const rowCells = row.c.map(cell => (cell && cell.v !== undefined) ? cell.v : "");
        return [
            rowCells[0] !== undefined ? rowCells[0] : "-",   
            rowCells[1] !== undefined ? rowCells[1] : "-",   
            rowCells[2] !== undefined ? rowCells[2] : "-",   
            rowCells[5] !== undefined ? rowCells[5] : "-",   
            rowCells[6] !== undefined ? rowCells[6] : "-",   
            rowCells[9] !== undefined ? rowCells[9] : "-",   
            rowCells[10] !== undefined ? rowCells[10] : "-", 
            rowCells[12] !== undefined ? rowCells[12] : "-", 
            rowCells[13] !== undefined ? rowCells[13] : "-"  
        ];
    });

    
   upcomingTableInstance = $el.DataTable({
    "data": dataSet,
    "columns": colHeaders,
    "pageLength": 10,
    "responsive": true,
    // เปลี่ยน "text-sm" เป็น "text-base" (หรือถอดออก) และเอา "-sm" ออกจาก pagination
"dom": '<"flex justify-end items-center gap-4 mb-4"fl>rt<"flex justify-between items-center mt-4"<"text-base text-gray-600 font-medium"i><"pagination-normal"p>>',
    "columnDefs": [
        // บังคับสีฟอนต์เนื้อหาทุกคอลัมน์
        { 
            "targets": "_all", 
            "className": "py-3 px-3 border-b border-gray-100 font-normal align-middle",
            "createdCell": function (td) {
                $(td).css('color', '#67748E');
            }
        },
        // คอลัมน์ 0 (วัสดุ)
        { 
            "targets": 0, 
            "className": "font-bold font-mono text-left",
            "render": function(data) {
                return `<span class=" px-2 py-1 rounded font-semibold" style="color: #67748E;">${data}</span>`;
            }
        },
        // คอลัมน์ 1
        { "targets": 1, "className": "font-medium" },
        // คอลัมน์ 2 (กลุ่มการจัดซื้อ)
        { 
            "targets": 2, 
            "className": "py-3 px-3 border-b border-gray-100 text-center align-middle font-medium",
            "render": function(data) {
                if (!data || data === "-") return "-";
                const text = data.toString().trim();
                let bgColor = "#f3f4f6", textColor = "#374151", icon = "fa-tag";
                
                if (text.includes("กฟส.") || text.includes("กฟจ.")) { bgColor = "#d1fae5"; textColor = "#047857"; icon = "fa-shopping-cart"; }
                else if (text.includes("กจล.")) { bgColor = "#dbeafe"; textColor = "#1d4ed8"; icon = "fa-truck"; }
                else if (text.includes("ขอโอน")) { bgColor = "#ffedd5"; textColor = "#c2410c"; icon = "fa-sync-alt"; }
                
                return `<span class="inline-flex items-center px-4 py-2" 
                           style="font-size: 13px !important; border-radius: 50px !important; background-color: ${bgColor} !important; color: ${textColor} !important;">
                           <i class="fas ${icon} me-2" style="color: ${textColor} !important;"></i>${data}
                       </span>`;
            }
        },
        // คอลัมน์ 3
        { "targets": 3, "className": "font-bold font-mono text-sm" },
        // คอลัมน์ 4 (วันที่)
        {
            "targets": 4,
            "className": "py-3 px-3 border-b border-gray-100 font-normal align-middle whitespace-nowrap text-slate-600",
            "render": function(data) {
                if (!data || data === "-") return "-";
                let dateStr = data.toString().trim();
                const matches = dateStr.match(/\(([^)]+)\)/);
                if (matches && matches[1]) {
                    const parts = matches[1].split(',');
                    const monthsTh = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
                    dateStr = `${parseInt(parts[2])} ${monthsTh[parseInt(parts[1])] || "เม.ย."} ${parseInt(parts[0])}`;
                }
                return `<span><i class="far fa-calendar-alt text-slate-500 me-2"></i>${dateStr}</span>`;
            }
        },
        // คอลัมน์ 5
        { 
            "targets": 5, 
            "className": "font-normal font-mono text-xs",
            "render": function(data) {
                return (data == null || data === "-") ? "-" : `<span class="inline-block bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-medium" style="color: #67748E;">${data}</span>`;
            }
        },
        // คอลัมน์ 7
        {
            "targets": 7,
            "className": "text-right font-semibold font-mono",
            "render": function(data) {
                const num = parseFloat(data);
                return isNaN(num) ? data : num.toLocaleString(undefined, {minimumFractionDigits: 0});
            }
        },
        { "targets": 8, "className": "text-center font-medium text-xs" }
    ],
    "headerCallback": function (thead) {
        $(thead).find('th')
            .removeClass()
            .addClass('font-extrabold text-sm py-3 px-3 border-b border-gray-200 uppercase tracking-wider whitespace-nowrap')
            .css({
                'background-color': 'transparent', // หัวตารางโปร่งใส
                'color': '#344767'
            });

        $(thead).find('th').eq(2).addClass('text-center');
        $(thead).find('th').eq(8).addClass('text-center');
    }
});
return upcomingTableInstance;
}
// ==================== Allocation Service (เวอร์ชันพ่น Log สรุปอันดับคิว) ====================


// ฟังก์ชันคำนวณความพร้อมของงาน (ค่าเฉลี่ยราย WBS)
function updateProgressData(allocatedData, materialTypeMap) {
    allocatedData.forEach(res => {
        // 1. ดึงประเภทจาก Map (ตรวจสอบว่า partID นี้เป็นประเภทอะไร)
        const partID = res.partID;
        const matType = materialTypeMap[partID] || "";
        
        // 2. เช็กเงื่อนไข: ถ้าเป็นพัสดุที่ไม่เบิกจากคลัง ให้เป็น 100% ทันที
        // (ปรับคำว่า 'พัสดุไม่เบิกจากคลัง' ให้ตรงกับค่าในระบบของคุณนะครับ)
        if (matType === 'พัสดุไม่เบิกจากคลัง') { 
            res.calcPercent = 100;
        } 
        // 4. คำนวณปกติ
        else {
            const assigned = parseFloat(res.assigned) || 0;
            const pending = parseFloat(res.pending) || 0;
            res.calcPercent = (pending > 0) ? Math.min((assigned / pending) * 100, 100) : 0;
        }
    });
    return allocatedData;
}
function getWBSProgressMap(allocatedData) {
    const stats = {};
    allocatedData.forEach(res => {
        if (!stats[res.wbs]) stats[res.wbs] = { total: 0, count: 0 };
        
        // ดึงค่า res.calcPercent ที่คำนวณไว้ในข้อ 1 มาใช้
        stats[res.wbs].total += res.calcPercent; 
        stats[res.wbs].count += 1;
    });
    
    const map = {};
    for (let wbs in stats) {
        map[wbs] = stats[wbs].total / stats[wbs].count;
    }
    return map;
}
// ==================== Event Handlers ====================//
function renderInitialStockMatch(allocatedData, materialTypeMap) {
    if (!allocatedData || !Array.isArray(allocatedData)) {
        return;
    }
    const filteredAllocatedData = allocatedData.filter(res => {
        const assignedValue = parseFloat(res.assigned) || 0;
        return assignedValue > 0;
    });
    const tableContent = {
        cols: [
            { label: "หมายเลขงาน" },
            { label: "รหัสพัสดุ" },
            { label: "ชื่อพัสดุ" },
            { label: "ประเภท" },
            { label: "ทั้งหมด" },
            { label: "ที่ได้/ค้างเบิก" },
            { label: "ค้างเบิก" },
            { label: "จำนวนที่ได้" },
            { label: "คงเหลือ" },
            
        ],
        rows: allocatedData.map(res => {
            const safeRemaining = (isNaN(res.remainingAfter) || res.remainingAfter === null) ? 0 : res.remainingAfter;
            const safeTotal = (isNaN(res.totalStock) || res.totalStock === null) ? 0 : res.totalStock;
            
            return {
                c: [
                    { v: res.wbs },
                    { v: res.partID },
                    { v: res.partName },
                    { v: 0 },
                    { v: safeTotal },
                    { v: `${res.assigned || 0}/${res.pending || 0}` },
                    { v: res.pending || 0 },
                    { v: res.assigned || 0 },
                    { v: safeRemaining }
                    
                ]
            };
        })
    };

    stockMatchTableInstance = TableRenderer.renderStockTable('#tableStockMatch', tableContent, materialTypeMap, "match");
   // 🔥 วางโค้ดชุดใหม่นี้แทนที่เงื่อนไขเช็ก currentSelectedWBS อันเดิมได้เลยครับ
    const mainTable = $('#tableRequirement_Data').DataTable(); 
    if (mainTable && stockMatchTableInstance) {
        syncAllTables(mainTable); // ⚡ เรียกใช้ฟังก์ชันตัวกลางเพื่อสั่งซิงค์รวดเดียวทุกตาราง
    }
}
// ==================== Table Renderer ====================
const TableRenderer = {

    //===== ตาราง match stock=============//
    renderStockTable(target, tableData, materialTypeMap = {}, mode = "stock") {
        if (!tableData || !tableData.rows || !tableData.cols) {
            return null;
        }

        const $el = $(target);
        if ($.fn.DataTable.isDataTable(target)) {
            $el.DataTable().destroy();
            $el.empty();
        }

        const colHeaders = tableData.cols.map(col => ({ title: col.label || "" }));

         let dataSet = tableData.rows.map(row => {
            const rowCells = row.c.map(cell => (cell && cell.v !== undefined) ? cell.v : "");

            const partIDIndex = (mode === "match") ? 1 : 0;
            const partID = rowCells[partIDIndex]?.toString().trim();
            const matType = materialTypeMap[partID] || "-";

            const insertAt = (mode === "match") ? 3 : 2;

            let newRow = [...rowCells];
            if (newRow.length > insertAt) {
                newRow[insertAt] = matType;
            }
            return newRow;
        });


        // 🎯 2. [จุดที่เพิ่มเข้าไป] ดักจับฟิลเตอร์เฉพาะโหมด match ตรงนี้เลย!
   // 🎯 แก้ไขบล็อกเงื่อนไขนี้ใน renderStockTable 
    if (mode === "match") {
        dataSet = dataSet.filter(row => {
            // ดักจับทั้งคอลัมน์ที่ 4 และ 5 เผื่อมีการเลื่อนของตำแหน่งโครงสร้าง
            const valAt4 = parseFloat(row[6]) || 0;
            const valAt5 = parseFloat(row[7]) || 0;
            
            // ตรวจสอบข้อมูลดิบในคอลัมน์ที่ 5 แบบละเอียด (ลบช่องว่างออก)
            const rawVal5 = row[7] ? row[7].toString().trim() : "0";

            // 🔥 เงื่อนไข: ถ้าเป็นเลข 0 ตัวเปล่าๆ หรือช่องว่าง หรือแปลงเป็นตัวเลขแล้วได้ <= 0 จะไม่ให้ผ่าน!
            if (rawVal5 === "0" || rawVal5 === "" || valAt5 <= 0) {
                // แถมตัวช่วยเช็ก: ถ้าคอลัมน์ 4 ดันเป็นจำนวนที่ได้ (กรณีอินเด็กซ์เลื่อน) และเป็น 0 ก็ให้เอาออกด้วย
                if (valAt5 === 0 && valAt4 === 0) {
                    return false; 
                }
                return false; // ไม่ให้แสดงในตาราง
            }
            
            return true; // ยอมให้แสดงเฉพาะรายการที่มีตัวเลขมากกว่า 0 จริงๆ
        });
    }
// 🎯 สั่งสร้างตารางปกติ
const matchTable = $el.DataTable({
    "data": dataSet,
    "columns": colHeaders,
    "deferRender": true,
    "pageLength": 25,
    "responsive": true,
    "autoWidth": false,
    "order": [[0, "asc"]],
    "buttons": [
        {
            extend: 'excel',
            text: '<i class="fas fa-file-excel mr-1"></i> Export',
            filename: 'R2C_InStock_Report',
            className: 'px-3 py-2 mb-0 text-center text-slate-500 uppercase align-middle bg-white rounded-lg cursor-pointer text-xs shadow-soft-md hover:scale-102 active:opacity-85',
             exportOptions: {
                    columns: [0, 1, 2, 3, 4, 6,7,8]
                }
        }
    ],
    "dom": '<"flex justify-between items-center mb-4"<"flex items-center gap-2"fB><"flex items-center"l>>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
    
    "columnDefs": [
        { "targets": "_all", "className": "py-3 px-3 border-r border-l border-gray-200 text-centertext-slate-600 font-normal" },
        { "targets": [0, 1], "className": "font-bold text-violet-800 whitespace-nowrap border-l border-gray-200" },
        { 
            "targets": 3, 
            "render": function(data, type, row) {
                let bgColor = "#e5e7eb";
                let textColor = "#374151";
                if (data === 'พัสดุหลัก') { bgColor = "#e9d5ff"; textColor = "#6b21a8"; } 
                else if (data === 'พัสดุรอง') { bgColor = "#d5d8ff"; textColor = "#214ca8"; } 
                else if (data === 'ผลิตภัณฑ์คอนกรีต') { bgColor = "#d5fff9"; textColor = "#2189a8"; }

                return `<span class="inline-flex items-center" style="font-size: 13px !important; padding: 4px 16px !important; border-radius: 50px !important; background-color: ${bgColor} !important; color: ${textColor} !important; display: inline-flex !important; justify-content: center; align-items: center; white-space: nowrap;">
                        ${data || '-'}
                        </span>`;
            },
            "className": "py-3 px-3 border-r border-l border-gray-200 text-center" 
        },
         { 
        "targets": [4], 
        "render": function(data, type, row) {
            if (type === 'display' && typeof data === 'number') {
                // ใช้ toLocaleString เพื่อใส่คอมม่าและทศนิยม 2 ตำแหน่ง
                return data.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                });
            }
            return data; 
        },
        "className": "py-3 px-3 border-r border-l border-gray-200 text-right text-slate-600 font-normal"
    },
        { 
        "targets": 5, // คอลัมน์ที่รวมร่างไว้
        "render": function(data, type, row) {
            // ถ้าเป็นการแสดงผล (display) ให้โชว์แบบสวยงาม
            if (type === 'display') {
                const parts = data.split('/');
                return `<div class="text-center whitespace-nowrap">
                        <span lass="font-bold" style="color: rgb(76, 199, 68); font-weight: bold; margin-right: 8px; font-size: 16px;">✓</span>
                            <span class="text-green font-bold">${parts[0]}</span>
                            <span class="text-gray-400">/</span>
                            <span class="text-green-600 font-bold">${parts[1]}</span>
                        </div>`;
            }
            return data; // ถ้าเป็นค่าที่ใช้ Sort หรือ Filter ให้คืนค่าเดิม
        }
        },
        { "targets": [6, 7], "visible": false },
        { 
        "targets": [ 8], 
        "render": function(data, type, row) {
            if (type === 'display' && typeof data === 'number') {
                // ใช้ toLocaleString เพื่อใส่คอมม่าและทศนิยม 2 ตำแหน่ง
                return data.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                });
            }
            return data; 
        },
        "className": "py-3 px-3 border-r border-l border-gray-200 text-right font-semibold text-slate-600 font-normal"
    },
        { "targets": [-1], "className": "text-right whitespace-nowrap border-r border-gray-200" } 
    ],
    
    // ตั้งค่าหัวตารางเป็นโปร่งใส
    "headerCallback": function (thead) {
        $(thead).find('th')
            .removeClass()
            .addClass('text-violet-900 font-extrabold text-sm py-3 px-4 text-left border-b-2 border-violet-200 uppercase tracking-wider')
            .css({
                'background-color': 'transparent',
                'border-right': '1px solid #e2e8f0'
            });
    }
});

matchTable.buttons().container().appendTo('#my-export-space');
return matchTable;
    },

//===== ตาราง Requirement =============//

renderRequirementTable(selector, data, vvipData, peaNameMapping, finalScores, wbsStatusMap, budgetMapping = {}, wbsProgressMap = {}) {
        const $el = $(selector);
        if ($.fn.DataTable.isDataTable(selector)) {
            $el.DataTable().destroy();
            $el.empty();
        }

        let html = this._buildTableHTML(data, vvipData, peaNameMapping, finalScores, wbsStatusMap, budgetMapping, wbsProgressMap);
        $el.html(html);


   // 🎯 1. ประกาศตัวแปรรับค่าตาราง (เปลี่ยนจาก return เป็น const ตัวแปรไว้ก่อนเพื่อเอาไปสั่งย้ายปุ่ม)
const RequirementTable = $el.DataTable({
    "deferRender": true,
    "pageLength": 10,
    "responsive": true,
    "order": [[0, "asc"]],
    "buttons": [
        {
            extend: 'excel',
            text: '<i class="fas fa-file-excel mr-1"></i> Export',
            filename: 'R2C_Report',
            className: 'px-3 py-2 mb-0 text-center text-white uppercase align-middle bg-purple rounded-lg cursor-pointer text-xs shadow-soft-md hover:scale-102 active:opacity-85'
        }
    ],
    "dom": '<"d-flex justify-content-end align-items-center gap-2 mb-3"fl>rt<"row mt-3"<"col-md-6"i><"col-md-6"p>>',
    
    "columnDefs": [
        {
            "targets": 0,
            "orderable": false,
            "render": function (data, type, row) { return data; }
        },
        { "targets": 5, "type": "num" },
        {
            "targets": 10,
            // "visible": false,
            "searchable": true // สำคัญ: ตั้งเป็น true เพื่อให้ช่อง Search ของตารางค้นหาข้อมูลจากช่องนี้ได้
        },
        { 
        "targets": 11, // คอลัมน์ % ความพร้อม
        "type": "num", 
        "render": function(data, type, row) {
            // เพื่อให้ Sort ได้ถูกต้อง ต้องดึงค่าตัวเลขออกมาจาก HTML
            return type === 'sort' ? parseFloat(data) : data;
        }
    }
    ],
    
    // 🎯 แก้ไขฟังก์ชันตอนท้ายให้สั้นลงและซ่อนสกรอลบาร์สนิท
    "initComplete": function() {
        this.api().columns.adjust();
        
        // เปิดให้เลื่อนขวาได้เมื่อจอเล็ก + ยิงสไตล์สั้นๆ ไปซ่อนแถบสกรอลบาร์ไม่ให้เห็นในจอคอม
        const $wrapper = $('#tableRequirement_Data').parent().css({ 'overflow-x': 'auto' });
        
        $('<style>').text(`
            #${$wrapper.attr('id')}::-webkit-scrollbar { display: none !important; }
            #${$wrapper.attr('id')} { scrollbar-width: none !important; }
        `).appendTo('head');
    }
});
// 🎯 2. สั่งย้ายก้อนปุ่มจากตาราง วาร์ปไปลงที่ช่อง ID ของคุณบิ๊กทันที (สั้นๆ แค่นี้เลย)
RequirementTable.buttons().container().appendTo('#export-Require');

// 🎯 3. รีเทิร์นตัวแปรตารางออกไปใช้งานตามปกติ จบงาน!
return RequirementTable;
},

    renderGenericTable(selector, data) {
        const $el = $(selector);

        if ($.fn.DataTable.isDataTable(selector)) {
            $el.DataTable().destroy();
            $el.empty();
        }

        let head = '<thead class="table-light"><tr>';
        data.cols.forEach(col => head += `<th>${col.label || ''}</th>`);
        head += '</tr></thead><tbody>';

        data.rows.forEach(row => {
            head += '<tr>';
            row.c.forEach(cell => {
                let val = getCellValue(cell);
                if (typeof val === 'number') val = val.toLocaleString();
                head += `<td>${val !== null ? val : ''}</td>`;
            });
            head += '</tr>';
        });
        head += '</tbody>';

        $el.html(head);

        return $el.DataTable({
            "pageLength": 10,
            "responsive": true
        });
    },

    _buildTableHTML(data, vvipData, peaNameMapping = {}, finalScores = null, wbsStatusMap = new Map(), budgetMapping = {}, wbsProgressMap= {}) {
        
        
        const headerStyle = `style="${TABLE_STYLES.headerStyle}"`;
        const textStyle = `class="mb-0 text-m leading-tight" style="${TABLE_STYLES.textStyle}"`;
        const textBoldStyle = `class="mb-0 font-bold text-m leading-tight" style="${TABLE_STYLES.textBoldStyle}"`;

        let html = '<thead class="table-light"><tr>';
        // 🔢 เพิ่มหัวตาราง "อันดับ" เข้าไปที่คอลัมน์แรกสุด
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">อันดับ</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">สัญญาณไฟ</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">หมายเลขงาน</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">ชื่องาน</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">การไฟฟ้า</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">สถานะงาน</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">มูลค่างานตามแผน</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">จำนวนวันคงเหลือ</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">จำนวนรายการ</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">คะแนนสะสม</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center d-none">การกำหนดโครงการ</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center ">% ความพร้อม</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center d-none">งบ</th>`;
        html += '</tr></thead><tbody>';

        const uniqueMap = new Map();
        const countMap = new Map();

        data.rows.forEach(row => {
            if (!row || !row.c) return;
            let valA = getCellValue(row.c[0]).toString().trim();
            if (valA !== "") {
                countMap.set(valA, (countMap.get(valA) || 0) + 1);
                if (!uniqueMap.has(valA)) {
                    uniqueMap.set(valA, row);
                }
            }
        });

        // ================================================================================================
        // 🏆 [ขั้นตอนเพิ่มเพื่อการเรียงลำดับ] ดึงข้อมูลมาคำนวณและเก็บลง Array เพื่อเตรียม Sort ตามเกณฑ์ 3 ชั้น
        // ================================================================================================
        const sortedWBSList = [];
        uniqueMap.forEach((row, valA) => {
            let ProjectPlan = getCellValue(row.c[12]); //การกำหนดโครงการ
            let valX = getCellValue(row.c[23]);
            let valY = getCellValue(row.c[24]);
            let rowCount = countMap.get(valA) || 0;
            let valOpenDate = getCellValue(row.c[26]);
            let rawBudget = budgetMapping[valA] || 0;

            let result = ScoringService.calculateScoreDetails(
                valA, valY, valX, rowCount, vvipData, false, valOpenDate, false
            );

            let totalScore = (finalScores && finalScores.has(valA))
                ? finalScores.get(valA)
                : result.totalScore;

            sortedWBSList.push({
                valA: valA,
                row: row,
                rowCount: rowCount,
                totalScore: totalScore,
                budget: rawBudget,
                result: result
            });
        });

        // 🎯 จัดเรียงลำดับ 3 ชั้น: 1. คะแนนรวมสูงสุด -> 2. พัสดุน้อยสุด -> 3. มูลค่างานสูงสุด
        sortedWBSList.sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            if (a.rowCount !== b.rowCount) return a.rowCount - b.rowCount;
            return b.budget - a.budget;
        });

        // 🎯 ส่วนที่เพิ่ม 1: ตัวแปรเก็บสถิติส่งหากราฟ
        const activeRowsDataForChart = [];

        // ================================================================================================
        // 🎯 เปลี่ยนมาวิ่งลูปผ่านข้อมูลที่ผ่านการจัดอันดับถูกต้องแล้ว (โค้ดดึงค่าและโครงสร้างตารางด้านในคงเดิม)
        // ================================================================================================
        sortedWBSList.forEach((item, index) => {
            const rank = index + 1; // 🔢 คำนวณอันดับที่ถูกต้อง (เริ่มจาก 1)
            const valA = item.valA;
            const row = item.row;
            const rowCount = item.rowCount;
            const totalScore = item.totalScore;
            const result = item.result;
            let ProjectPlan = getCellValue(row.c[12]); //การกำหนดโครงการ
            let BudgetCIP = getCellValue(row.c[18]);
            let valT = getCellValue(row.c[19]);
            let valW = getCellValue(row.c[22]) || "";
            let valX = getCellValue(row.c[23]);
            let valY = getCellValue(row.c[24]);

            let peaName = peaNameMapping[valW] || valW || "-";

            // 2. 🎯 สำหรับแสดงผลหน้าจอ: ปัดเศษตัวเลขให้เป็นเลขถ้วน ไม่มีทศนิยม
            let displayScore = typeof totalScore === 'number' ? Math.round(totalScore).toLocaleString() : totalScore;
            
            let dayDisplay = "-";
            let dayClass = "";
            if (result.daysRemaining !== null) {
                dayDisplay = result.daysRemaining + " วัน";
                if (result.daysRemaining < 0) dayClass = "text-danger fw-bold";
            } else if (valY === "ไม่เกินกำหนด" && valY !== "งาน 02.2") {
                dayDisplay = "ยังไม่เกิด AUC";
                dayClass = "text-muted small";
            }

            const status = wbsStatusMap.get(valA);
            const lightHTML = createStatusCircle(status || 'yellow');
            const searchToken = status ? `status-${status}` : 'status-yellow';
            let rawBudget = budgetMapping[valA];
            let budgetDisplay = (rawBudget !== undefined) ? rawBudget.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "-";
            let budgetOrderValue = (rawBudget !== undefined) ? rawBudget : 0;
            const progress = wbsProgressMap[item.valA] || 0;
           const barColor = progress >= 80 
            ? 'bg-gradient-to-tl from-green-600 to-lime-400' 
            : (progress >= 50 
                ? 'bg-gradient-to-tl from-blue-600 to-cyan-400' 
                : 'bg-gradient-to-tl from-red-600 to-rose-400');

            const progressHTML = `
                <div class="flex items-center justify-center">
                    <span class="mr-2 text-xs font-semibold leading-tight">${progress.toFixed(0)}%</span>
                    <div>
                        <div class="text-xs h-0.75 w-30 m-0 flex overflow-visible rounded-lg bg-gray-200">
                            <div 
                                class="duration-600 ease-soft ${barColor} -mt-0.38 -ml-px flex h-1.5 flex-col justify-center overflow-hidden whitespace-nowrap rounded text-center text-white transition-all" 
                                style="width: ${progress}%"
                                role="progressbar" 
                                aria-valuenow="${progress.toFixed(0)}" 
                                aria-valuemin="0" 
                                aria-valuemax="100">
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 🎯 ส่วนที่เพิ่ม 2: ยัดข้อมูลแถวนี้ลงถังเก็บ
            activeRowsDataForChart.push({ status: status, qty: rowCount });

            // พ่น HTML พร้อมทั้งใส่ช่องอันดับ `${rank}` เพิ่มไว้ที่คอลัมน์แรกสุด
            html += `<tr class="clickable-requirement" data-wbs="${valA}" style="cursor: pointer;">
                <td class="${TABLE_STYLES.cellClass} text-center fw-bold" style="background-color: #f8f9fa;">${rank}</td>
                <td class="${TABLE_STYLES.cellClass} text-center "><span style="display: none;">${searchToken}</span>${lightHTML}</td>
                <td class="${TABLE_STYLES.cellClass} text-center"><div class="px-3 py-1"><h6 class="mb-0 text-sm leading-normal" ${headerStyle}>${valA}</h6></div></td>
                <td class="${TABLE_STYLES.cellClass} text-center"><p ${textStyle}>${valT}</p></td>
                <td class="${TABLE_STYLES.cellClass} text-center"><span ${textStyle}>${peaName}</span></td>
                <td class="${TABLE_STYLES.cellClass} text-center"><span ${textStyle}>${valY}</span></td>
                <td class="${TABLE_STYLES.cellClass} text-center" data-order="${budgetOrderValue}"><span ${textBoldStyle} class="text-dark font-mono">${budgetDisplay}</span></td>
                <td class="${TABLE_STYLES.cellClass} text-center"><span class="text-m font-bold leading-tight ${dayClass}">${dayDisplay}</span></td>
                <td class="${TABLE_STYLES.cellClass} text-center"><span class="badge rounded-pill  text-right bg-purple ">${rowCount} รายการ</span></td>
                <td class="${TABLE_STYLES.cellClass} text-center"><span ${textBoldStyle}>${displayScore}</span></td> 
                <td class="${TABLE_STYLES.cellClass} text-center d-none"><span ${textStyle}>${ProjectPlan}</span></td>
                <td class="${TABLE_STYLES.cellClass} text-center">${progressHTML}</td>
                <td class="${TABLE_STYLES.cellClass} text-center d-none "><span ${textStyle}>${BudgetCIP}</span></td>
            </tr>`;
        });

        html += '</tbody>';
        // 🎯 ส่วนที่เพิ่ม 3: ส่งข้อมูลสรุปให้กราฟวงกลมทำงานทันทีหลังสร้างตารางเสร็จ
       
        return html;
    },

    //=========== ตาราง NoStock พัสดุที่ไม่ได้รับการจัดสรร ===========//
/**
 * แสดงตารางพัสดุที่ไม่ได้รับการจัดสรร (assigned = 0)
 * @param {Array} allocatedData - ข้อมูลการจัดสรร
 * @param {Object} materialTypeMap - ประเภทพัสดุ
 */
renderNoStockTable(allocatedData, materialTypeMap, stockData,upcomingData = {}, stockN2Data) {
    if (!allocatedData || !Array.isArray(allocatedData)) return null;

    // 1. ประมวลผล Stock Map จาก stockData (Index 8)
    const stockMap = {};
    if (stockData && stockData.rows) {
        stockData.rows.forEach(row => {
            const partID = getCellValue(row.c[0])?.toString().trim();
            const qty = parseFloat(getCellValue(row.c[8])) || 0;
            if (partID) stockMap[partID] = (stockMap[partID] || 0) + qty;
        });
    }
    // 2. สร้าง StockN2 Map (คงคลังภายในเขต - ดึงจาก StockN2_Data)
   const stockN2Map = {};
    if (stockN2Data && stockN2Data.rows) {
        stockN2Data.rows.forEach(row => {
            const partID = getCellValue(row.c[2])?.toString().trim(); // รหัสพัสดุ
            const qty = parseFloat(getCellValue(row.c[10])) || 0;     // จำนวนที่ใช้ได้
            const location = getCellValue(row.c[0])?.toString().trim(); // location
            
            // ใช้การบวกสะสม (Sum) เข้าไปใน partID นั้นๆ
            if (partID && location !== 'คลังพัสดุ พิษณุโลก') {
                stockN2Map[partID] = (stockN2Map[partID] || 0) + qty;
            }
        });
    }
    // 3. สร้าง Upcoming Map (Index 12) 👈 เพิ่มส่วนนี้
    const upcomingMap = {};
    if (upcomingData && upcomingData.rows) {
        upcomingData.rows.forEach(row => {
            const partID = getCellValue(row.c[0])?.toString().trim();
            const qty = parseFloat(getCellValue(row.c[12])) || 0;
            if (partID) upcomingMap[partID] = (upcomingMap[partID] || 0) + qty;
        });
    }
    // 4. Group ข้อมูล allocatedData (กรองเฉพาะที่ assigned == 0)
    const EXCLUDED_TYPES = ["พัสดุล้าสมัย", "เปลี่ยนรหัสพัสดุ", "พัสดุไม่เบิกจากคลัง"];
    const groupedData = allocatedData.reduce((acc, res) => {
        if (res.assigned !== 0) return acc;
        
        const partID = res.partID?.toString().trim();
        const partType = materialTypeMap[partID] || "-";
        if (EXCLUDED_TYPES.includes(partType)) return acc;

        if (!acc[partID]) {
            acc[partID] = { partID: partID, partName: res.partName || "-", type: partType, totalPending: 0 };
        }
        acc[partID].totalPending += (res.pending || 0);
        return acc;
    }, {});

    const noStockData = Object.values(groupedData);
    if (noStockData.length === 0) return null;
   
    // 5. แยกส่วน Config หัวตาราง (ไว้ข้างนอก DataTable)
    const colHeaders = [
        { title: "รหัสพัสดุ" },
        { title: "ชื่อพัสดุ" },
        { title: "ประเภท" },
        { title: "รวมค้างเบิก" },
        { title: "ยอดคงคลัง" },
        { title: "ปริมาณที่สั่ง" },
        { title: "ความต้องการสุทธิ" },
        { title: "ยอดคงคลัง (น.2)" },
        { title: "สถานะ" }
    ];

    // 6. เตรียมข้อมูล Data สำหรับตาราง
    const dataSet = noStockData.map(res => {
        // 1. รวมของที่มีอยู่จริง (สต็อก + ของที่กำลังมา)
    const available = (stockMap[res.partID] || 0) + (upcomingMap[res.partID] || 0);

    // 2. คำนวณความต้องการ: ถ้ามีของ 100 ต้องการ 71 ก็จะเหลือติดลบ 29 
    // เราใช้ Math.abs เพื่อให้แสดงเป็นเลข 29 (แสดงว่าขาดอยู่ 29)
    const totalRequire = Math.abs(res.totalPending - available);
   
        return [
            res.partID, 
            res.partName, 
            res.type, 
            res.totalPending, 
            stockMap[res.partID] || 0,
            upcomingMap[res.partID] || 0,
            totalRequire || 0,
            stockN2Map[res.partID] || 0,
            ""
        ]
});
    // --- (โค้ดส่วน DataTable เริ่มต้น) ---
    const $el = $('#tableNoStock');
    if ($.fn.DataTable.isDataTable('#tableNoStock')) {
        $el.DataTable().destroy();
        $el.empty();
    }

    const NoStockTable = $el.DataTable({
      "data": dataSet,
    "columns": colHeaders,
    "deferRender": true,
    "pageLength": 10,
    "responsive": true,
    
    "order": [[0, "asc"]], // เรียงตามรหัสพัสดุ (col 1) จากน้อยไปมาก
    
    "buttons": [
        {
            extend: 'excel',
            text: '<i class="fas fa-file-excel mr-1"></i> Export',
            filename: 'R2C_NoStock_report',
            className: 'px-3 py-2 mb-0 text-center text-slate-500 uppercase align-middle bg-white rounded-lg cursor-pointer text-xs shadow-soft-md hover:scale-102 active:opacity-85',
            // exportOptions: {
            //         columns: [0, 1, 2, 3, 5]
            //     }
        }
    ],
      "dom": '<"d-flex justify-content-end align-items-center gap-2 mb-3"fl>rt<"row mt-3"<"col-md-6"i><"col-md-6"p>>',
   
        "columnDefs": [

              {
                "targets": 0,
                "className": "whitespace-nowrap",
                // "render": $.fn.dataTable.render.number(',', '.', 0)
            },
                { 
                "targets": [3, 4, 5, 6, 7], 
                "className": "text-center ",
                "render": function(data, type, row) {
                    // เช็คว่าเป็นตัวเลขหรือไม่ ถ้าใช่ให้ใส่ลูกน้ำ ถ้าไม่ใช่ให้แสดงค่าเดิม
                    return (typeof data === 'number') ? data.toLocaleString() : data;
                }
            },
             { 
            "targets": 2, 
            "render": function(data, type, row) {
                let bgColor = "#e5e7eb";
                let textColor = "#374151";
                if (data === 'พัสดุหลัก') { bgColor = "#e9d5ff"; textColor = "#6b21a8"; } 
                else if (data === 'พัสดุรอง') { bgColor = "#d5d8ff"; textColor = "#214ca8"; } 
                else if (data === 'ผลิตภัณฑ์คอนกรีต') { bgColor = "#d5fff9"; textColor = "#2189a8"; }

                return `<span class="inline-flex items-center" style="font-size: 13px !important; padding: 4px 16px !important; border-radius: 50px !important; background-color: ${bgColor} !important; color: ${textColor} !important; display: inline-flex !important; justify-content: center; align-items: center; white-space: nowrap;">
                        ${data || '-'}
                        </span>`;
            },
            "className": "py-3 px-3 border-r border-l border-gray-200 text-center" 
        },

       {
            "targets": 8,
            "render": function (data, type, row) {
                return `<select class="form-control" onchange="updateStatus(this, '${row[0]}')">
                    <option value="" ${data === "" ? "selected" : ""}>- เลือก -</option>
                    <option value="จัดซื้อใหม่" ${data === "จัดซื้อใหม่" ? "selected" : ""}>จัดซื้อใหม่</option>
                    <option value="ขอโอน" ${data === "ขอโอน" ? "selected" : ""}>ขอโอน</option>
                    <option value="Hold" ${data === "Hold" ? "selected" : ""}>Hold</option>
                </select>`;
            }
        }
        ],
        "createdRow": function(row, data, dataIndex) {
        $(row).addClass('clickable-requirement'); // class สำหรับใช้ใน setupRowClickEvent
        $(row).attr('data-material-code', data[0]); // เก็บ รหัสพัสดุ ไว้ใน data-attribute
    },
    });

    NoStockTable.buttons().container().appendTo('#export-NoStock');
    return NoStockTable;
},

renderUpcomingTab(upcomingData) {
    const $el = $('#tabUpcoming');
    
    // ทำลายตารางเก่าทิ้งก่อน (ถ้ามี) เพื่อป้องกัน Error การสร้างตารางซ้อน
    if ($.fn.DataTable.isDataTable($el)) {
        $el.DataTable().destroy();
    }

    // แปลงข้อมูลจาก Google Sheets Format (c[0], c[1]...) 
    // เป็น Array ของ Array สำหรับ DataTable
    const dataSet = upcomingData.rows.map(row => {
        const totalStock = parseFloat(getCellValue(row.c[12]) || 0).toLocaleString();
        const unit = getCellValue(row.c[13]) || "";
        const totalStockWithUnit = `${totalStock} ${unit}`;
        return [
            getCellValue(row.c[0],), // รหัสพัสดุ
            getCellValue(row.c[5]), // เอกสารการจัดซื้อ
            getCellValue(row.c[2]), // กลุ่มการจัดซื้อ
            totalStockWithUnit // ปริมาณที่สั่ง (ใส่ลูกน้ำ)
        ];
    });

    // สร้างตารางใหม่
    const table = $el.DataTable({
        "data": dataSet,
        "deferRender": true,
        "pageLength": 10,
        
        "dom": '<"flex justify-between items-center mb-4"<"flex items-center gap-2"f><"flex items-center"l>>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
        "columns": [
            { "title": "รหัสพัสดุ" },
            { "title": "เอกสารการจัดซื้อ" },
            { "title": "กลุ่มการจัดซื้อ" },
            { "title": "ปริมาณที่สั่ง" }
        ],
        
        "responsive": true,
        "language": { "emptyTable": "ไม่พบข้อมูลในตาราง" },
        "columnDefs": [
            { "targets": 0, "visible": false } // 🎯 3. ซ่อนคอลัมน์รหัสพัสดุไม่ให้ผู้ใช้เห็น แต่ยังใช้ Search ได้
        ],
        
        "drawCallback": function() {
            updateCounts(); 
        }
    });
    return table;
},
renderStockN2Tab(stockN2Data) {
    const $el = $('#tabStockN2');
    
    if ($.fn.DataTable.isDataTable($el)) {
        $el.DataTable().destroy();
    }

    // 1. Group และ Sum ข้อมูล
    const groupedData = stockN2Data.rows.reduce((acc, row) => {
        const location = getCellValue(row.c[0])?.toString().trim();
        if (location === 'คลังพัสดุ พิษณุโลก') return acc;

        const partID = getCellValue(row.c[2])?.toString().trim();
        const locName = getCellValue(row.c[1])?.toString().trim();
        const qty = parseFloat(getCellValue(row.c[10]) || 0);
        const unit = getCellValue(row.c[9]) || "";

        const groupKey = `${location}|${partID}`;

        if (partID) {
            if (!acc[groupKey]) {
                acc[groupKey] = { 
                    partID, 
                    location, 
                    locNames: new Set(), // ใช้ Set เพื่อไม่ให้ Loc ซ้ำ
                    totalQty: 0, 
                    unit 
                };
            }
            acc[groupKey].totalQty += qty;
            if (locName) acc[groupKey].locNames.add(locName);
        }
        return acc;
    }, {});

    // 2. แปลงเป็น Array 4 คอลัมน์
    const dataSet = Object.values(groupedData).map(item => {
        return [
            item.partID,                                     // 0: รหัสพัสดุ
            item.location,                                   // 1: คลังพัสดุ
            Array.from(item.locNames).join(", "),            // 2: รวม Loc.
            `${item.totalQty.toLocaleString()} ${item.unit}` // 3: รวมจำนวน
        ];
    });

    // 3. สร้างตาราง
    const table = $el.DataTable({
        "data": dataSet,
        "deferRender": true,
        "pageLength": 10,
        "dom": '<"flex justify-between items-center mb-4"<"flex items-center gap-2"f><"flex items-center"l>>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
        "columns": [
            { "title": "รหัสพัสดุ" },
            { "title": "คลังพัสดุ" },
            { "title": "Loc." },
            { "title": "จำนวนคงคลัง" }
        ],
        "responsive": true,
        "language": { "emptyTable": "ไม่พบข้อมูลในตาราง" },
        "columnDefs": [
            { "targets": 0, "visible": false } // ซ่อนรหัสพัสดุไว้สำหรับ Search
        ],
        "drawCallback": function() {
            if (typeof updateCounts === 'function') updateCounts();
        }
    });
    
    return table;
},
 renderN2POTab(n2poData) {
    const $el = $('#tabN2PO');
    
    if ($.fn.DataTable.isDataTable($el)) {
        $el.DataTable().destroy();
    }

    const dataSet = n2poData.rows.map(row => {
        const totalStock = parseFloat(getCellValue(row.c[7]) || 0).toLocaleString();
        const unit = getCellValue(row.c[8]) || "";
        const totalStockWithUnit = `${totalStock} ${unit}`;
            
        return [
            getCellValue(row.c[5]),// รหัสพัสดุ
            getCellValue(row.c[0]), // เอกสารการจัดซื้อ
            getCellValue(row.c[2]), // คลังพัสดุ
            getCellValue(row.c[3]), // รหัสคลังพัสดุ
            totalStockWithUnit // ปริมาณที่สั่ง (ใส่ลูกน้ำ)
        ];
    });

   const table = $el.DataTable({
        "data": dataSet,
        "deferRender": true,
        "pageLength": 10,
        "dom": '<"flex justify-between items-center mb-4"<"flex items-center gap-2"f><"flex items-center"l>>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
        "columns": [
            { "title": "รหัสพัสดุ" },
            { "title": "เอกสารการจัดซื้อ" },
            { "title": "คลังพัสดุ" },
            { "title": "Loc." },
            { "title": "ปริมาณที่สั่ง" }
           
        ],
        "responsive": true,
        "language": { "emptyTable": "ไม่พบข้อมูลในตาราง" },
        "columnDefs": [
            { "targets": 0, "visible": false } // 🎯 3. ซ่อนคอลัมน์รหัสพัสดุไม่ให้ผู้ใช้เห็น แต่ยังใช้ Search ได้
        ],
        
       "drawCallback": function() {
            updateCounts(); 
        }
    });
    return table;
},
    //=========== ตาราง Obsolete พัสดุล้าสมัย/เปลี่ยนแปลงรหัส ===========//
    //=========== ตาราง Obsolete พัสดุล้าสมัย/เปลี่ยนแปลงรหัส ===========//
renderObsoleteTable(allocatedData, materialTypeMap, materialNoteMap) {
    if (!allocatedData || !Array.isArray(allocatedData)) return null;

    const OBSOLETE_TYPES = ["พัสดุล้าสมัย", "เปลี่ยนรหัสพัสดุ","พัสดุไม่เบิกจากคลัง"];

    // กรองเฉพาะ assigned === 0 และประเภทที่ต้องการ
    const obsoleteData = allocatedData.filter(res => {
        if (res.assigned !== 0) return false;
        const partType = materialTypeMap[res.partID?.toString().trim()] || "";
        return OBSOLETE_TYPES.includes(partType);
    });

    if (obsoleteData.length === 0) return null;

    const $el = $('#tableObsolete');
    if ($.fn.DataTable.isDataTable('#tableObsolete')) {
        $el.DataTable().destroy();
        $el.empty();
    }

    // 🎯 กำหนดความกว้างคอลัมน์ล่วงหน้า คอลัมน์ไหนต้องการให้ชิด ใส่ 1% ไว้เลย
    const colHeaders = [
        { title: "หมายเลขงาน", width: "1%" },  
        { title: "รหัสพัสดุ", width: "1%" },   
        { title: "ชื่อพัสดุ", width: "52%" },  
        { title: "ประเภท", width: "1%" },      
        { title: "ค้างเบิก", width: "1%" },    
        { title: "หมายเหตุ", width: "44%" }       
    ];

    const dataSet = obsoleteData.map(res => {
        const partID = res.partID?.toString().trim();
        const partType = materialTypeMap[partID] || "-";
        const partNote = materialNoteMap[partID] || "-";
        return [
            res.wbs      || "-",  
            res.partID   || "-",  
            res.partName || "-",  
            partType,             
            res.pending  || 0,    
            partNote              
        ];
    });

    const ObsoleteTable = $el.DataTable({
        "data": dataSet,
        "columns": colHeaders,
        "deferRender": true,
        "pageLength": 10,
        "responsive": true,
        "autoWidth": false, 
        "order": [[0, "asc"]], 
        "buttons": [
            {
                extend: 'excel',
                text: '<i class="fas fa-file-excel mr-1"></i> Export',
                filename: 'R2C_Obsolete_report',
                className: 'px-3 py-2 mb-0 text-center text-slate-500 uppercase align-middle bg-white rounded-lg cursor-pointer text-xs shadow-soft-md hover:scale-102 active:opacity-85'
            }
        ],
        "dom": '<"flex justify-between items-center mb-4"<"flex items-center gap-2"fB><"flex items-center"l>>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
        "columnDefs": [
            // col 0, 1: หมายเลขงาน และ รหัสพัสดุ
            {
                "targets": [0, 1],
                "className": "py-3 px-3 border-b border-gray-100 text-slate-600 font-normal whitespace-nowrap",
                "createdCell": function(td) {
                    $(td).css({ 'white-space': 'nowrap', 'word-break': 'keep-all' });
                }
            },
            { 
            "targets": 3, 
            "render": function(data, type, row) {
                let bgColor = "#e5e7eb";
                let textColor = "#374151";
                if (data === 'พัสดุล้าสมัย') { bgColor = "#ffd5d5"; textColor = "#a82121"; } 
                else if (data === 'เปลี่ยนรหัสพัสดุ') { bgColor = "#ffe1d5"; textColor = "#a85221"; } 
                else if (data === 'พัสดุไม่เบิกจากคลัง') { bgColor = "#fffbd5"; textColor = "#a89b21"; }

                return `<span class="inline-flex items-center" style="font-size: 13px !important; padding: 4px 16px !important; border-radius: 50px !important; background-color: ${bgColor} !important; color: ${textColor} !important; display: inline-flex !important; justify-content: center; align-items: center; white-space: nowrap;">
                        ${data || '-'}
                        </span>`;
            },
            "className": "py-3 px-3 border-r border-l border-gray-200 text-center" 
        },
            { "targets": 0, "className": "font-bold text-blue-700 whitespace-nowrap" },

// 🎯 col 2: ชื่อพัสดุ -> ตัดเอาแค่ 60 ตัวอักษรดื้อๆ (เท่ากับ 2 บรรทัดพอดี) ห้ามงอกบรรทัด 3
{ 
    "targets": 2, 
    "className": "py-3 px-3 border-b border-gray-100 text-slate-600 font-normal",
    "render": function(data) {
        if (!data || data === "-") return '<span class="text-gray-400">-</span>';
        
        // ✂️ นับตัวอักษรรวม ถ้าเกิน 25 ตัว ค่อยสั่งหักข้อความลงบรรทัดที่สอง
        if (data.length > 20) {
            const firstLine = data.substring(0, 20);
            const secondLine = data.substring(20);
            
            // 🌟 บังคับใส่ font-size: inherit !important เพื่อให้ขนาดตัวหนังสือเท่าตัวอื่นเป๊ะๆ
            return `<span style="font-size: inherit !important; white-space: nowrap !important; word-break: keep-all !important;">${firstLine}</span><br><span style="font-size: inherit !important; display: inline-block; max-width: 100%; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; vertical-align: bottom;" title="${data}">${secondLine}</span>`;
        }
        
        // 🌟 บังคับใส่ font-size: inherit !important ตรงนี้ด้วย
        return `<span style="font-size: inherit !important; white-space: nowrap !important; word-break: keep-all !important;">${data}</span>`;
    }
},
            // col 3: ประเภท - badge สีแดงเสมอ
            {
                "targets": 3,
                "className": "py-3 px-3 border-b border-gray-100 font-normal text-center whitespace-nowrap",
                "render": function(data) {
                    if (!data || data === "-") return '<span class="text-gray-400">-</span>';
                    return `<span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600">${data}</span>`;
                }
            },

            // col 4: ค้างเบิก
            {
                "targets": 4,
                "className": "text-red-600 text-base text-end whitespace-nowrap",
                "render": $.fn.dataTable.render.number(',', '.', 0)
            },

            // 🎯 col 5: Note -> ล็อกความสูงไว้ไม่เกิน 2 บรรทัดด้วย line-clamp-2
         {
    "targets": 5,
    "className": "py-3 px-3 border-b border-gray-100 text-slate-500 text-sm",
    "render": function(data) {
        if (!data || data === "-") return '<span class="text-gray-400">-</span>';
        
        // ใช้ CSS สำหรับบังคับตัด 2 บรรทัดโดยเฉพาะ
        return `<div class="line-clamp-2" 
                     style="display: -webkit-box; 
                            -webkit-line-clamp: 2; 
                            -webkit-box-orient: vertical; 
                            overflow: hidden; 
                            max-width: 320px; 
                            min-width: 200px; 
                            word-break: break-word;" 
                     title="${data}">${data}</div>`;
    }
}
        ],
        "headerCallback": function(thead) {
            $(thead).find('th').addClass('bg-orange-50 text-orange-700 font-bold py-3 px-4 text-left border-b-2 border-orange-200').css('white-space', 'nowrap');
        },
        "initComplete": function() {
            this.api().columns.adjust();
            const $wrapper = $('#tableObsolete').parent().css({ 'overflow-x': 'auto' });
            $('<style>').text(`
                #${$wrapper.attr('id')}::-webkit-scrollbar { display: none !important; }
                #${$wrapper.attr('id')} { scrollbar-width: none !important; }
            `).appendTo('head');
        }
    });

    ObsoleteTable.buttons().container().appendTo('#export-Obsolete');
    obsoleteTableInstance = ObsoleteTable;
    return ObsoleteTable;
} // <--- จบฟังก์ชันพอดีเป๊ะ โครงสร้างไม่พังแน่นอนครับ,



};



function updateCounts() {
    // คำนวณจำนวนแถว
    const counts = {
        upcoming: $.fn.DataTable.isDataTable('#tabUpcoming') ? $('#tabUpcoming').DataTable().rows({filter: 'applied'}).count() : 0,
        stockN2: $.fn.DataTable.isDataTable('#tabStockN2') ? $('#tabStockN2').DataTable().rows({filter: 'applied'}).count() : 0,
        n2po: $.fn.DataTable.isDataTable('#tabN2PO') ? $('#tabN2PO').DataTable().rows({filter: 'applied'}).count() : 0
    };

    // ใช้ .toLocaleString() เพื่อเพิ่มคอมม่า (เช่น 1000 กลายเป็น 1,000)
    const elements = [
        { id: 'count-upcoming', val: counts.upcoming },
        { id: 'count-stockN2', val: counts.stockN2 },
        { id: 'count-n2po', val: counts.n2po }
    ];

    elements.forEach(el => {
        const target = document.getElementById(el.id);
        if (target) {
            target.innerText = el.val.toLocaleString(); 
        }
    });
}
// 3. ตามด้วยฟังก์ชันเดิมของคุณ เช่น setupRowClickEvent, initDashboard ฯลฯ
// วางไว้ด้านบนสุดของไฟล์ JS ของคุณ (ไม่ต้องอยู่ใน initDashboard)
function toggleTab(tabName) {
    console.log("Switching to tab:", tabName);
    
    const tableMap = {
        'Upcoming': '#tabUpcoming',
        'StockN2': '#tabStockN2',
        'N2PO': '#tabN2PO'
    };
    
    const tableId = tableMap[tabName];
    const $table = $(tableId);
    
    if ($.fn.DataTable.isDataTable($table)) {
        const dt = $table.DataTable();
        
        // ใช้ setTimeout เพื่อให้แน่ใจว่า DOM เปลี่ยน Tab เรียบร้อยก่อน
        setTimeout(() => {
            // ปรับขนาดคอลัมน์ก่อนเสมอ
            if (typeof dt.columns === 'function') {
                dt.columns.adjust();
            }
            
            // เช็คว่า .responsive มีอยู่จริงหรือไม่ก่อนเรียกใช้ .recalc()
            if (dt.responsive && typeof dt.responsive.recalc === 'function') {
                dt.responsive.recalc();
            } else {
                console.warn(`Responsive plugin not initialized for: ${tabName}`);
            }
        }, 200);
    }
}

function updateStatus_Nostock(selectEl, partID) {
    const selectedValue = selectEl.value;
    // เลือกค่าแล้วให้ค้างไว้
    selectEl.setAttribute('data-value', selectedValue);
    
    // หากต้องการบันทึกลงฐานข้อมูลหรือทำอย่างอื่นต่อ ทำที่นี่ได้เลย
    console.log("พัสดุ:", partID, "สถานะใหม่:", selectedValue);
}
 // =================================================================
// 🌟 ฟังก์ชันตัวกลางสำหรับแชร์การซิงค์ Cross-Filter ไปยังทุกตารางย่อย
// =================================================================
function syncAllTables(mainTable) {
    // ดึง WBS (คอลัมน์ 2) ที่รอดอยู่บนตารางหลักในปัจจุบัน
    const activeWBS = mainTable.rows({ search: 'applied' }).data().toArray().map(row => row[2].replace(/<[^>]*>/g, '').trim());
    const uniqueWBS = [...new Set(activeWBS)].filter(Boolean);
    const stockRegex = uniqueWBS.length > 0 ? uniqueWBS.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|') : '^$|🚫';

    // 1. ซิงค์ตาราง Stock Match (คอลัมน์ 0)
    if (typeof stockMatchTableInstance !== 'undefined' && stockMatchTableInstance) {
        stockMatchTableInstance.column(0).search(stockRegex, true, false).draw();
    }
    // 2. ซิงค์ตาราง No Stock (คอลัมน์ 0)
    if (typeof noStockTableInstance !== 'undefined' && noStockTableInstance) {
        noStockTableInstance.column(0).search(stockRegex, true, false).draw();
    }
    // 3. ซิงค์ตาราง Obsolete (คอลัมน์ 0)
    if (typeof obsoleteTableInstance !== 'undefined' && obsoleteTableInstance) {
        obsoleteTableInstance.column(0).search(stockRegex, true, false).draw();
    }
    
}
// ==================== Filter Module ====================
const FilterModule = {
// =================================================================
// [0/5 แถม] ฟังก์ชันกรองสัญญาณไฟ (คอลัมน์ที่ 1 ในตารางหลัก)
// =================================================================
setupFilterLight(tableInstance, rawData) {
    const $dropdownMenu = $('#dropdownSearchLight'), $searchContainer = $dropdownMenu.find('ul'), $clearButton = $('#clearLightFilter'); 
    $searchContainer.empty(); 

    const statusItems = [
        { value: 'status-green', text: '🟢 ของครบ' },
        { value: 'status-blue', text: '🔵 พัสดุหลักครบ' },
        { value: 'status-yellow', text: '🟡 ได้ของบางส่วน' },
        { value: 'status-red', text: '🔴 ไม่ได้ของเลย' },
        { value: 'status-lock', text: '🔒 ล็อค (พัสดุล้าสมัย/เปลี่ยนรหัส)' }
    ];

    statusItems.forEach((item, index) => {
        $searchContainer.append(`
            <li class="w-full flex items-center p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded light-filter-item">
                <label for="dropdown-light-${index}" class="w-full flex items-center justify-between cursor-pointer m-0 w-full">
                    <div class="inline-flex items-center font-medium text-heading text-sm">${item.text}</div>
                    <input id="dropdown-light-${index}" type="checkbox" value="${item.value}" class="light-checkbox w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong">
                </label>
            </li>
        `);
    });

    $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(fn => fn.name !== 'lightFilter');

    const applyFilter = () => {
        let selected = [];
        $searchContainer.find('.light-checkbox:checked').each(function () { selected.push($(this).val()); });
        const regex = selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|');
        tableInstance.column(1).search(regex, true, false).draw();
        syncAllTables(tableInstance); // ⚡ ซิงค์ตารางย่อยทั้งหมด
    };

    $searchContainer.off('change', '.light-checkbox').on('change', '.light-checkbox', applyFilter);
    $clearButton.off('click').on('click', function() {
        $searchContainer.find('.light-checkbox').prop('checked', false); 
        applyFilter();
    });
},
// =================================================================
// [1/5] ฟังก์ชันกรอง หมายเลขงาน WBS (คอลัมน์ที่ 2 ในตารางหลัก)
// =================================================================
setupFilterID_WBS(table, data) {
    const $dropdownMenu = $('#dropdownSearchWBS'), $searchContainer = $dropdownMenu.find('ul'), $searchInput = $('#searchWBS'), $clearButton = $('#clearWBSFilter'); 
    $searchContainer.empty(); 

    let list = [];
    data.rows.forEach(row => {
        let val = row?.c?.[0] ? getCellValue(row.c[0]).toString().trim() : '';
        if (val && val !== "-" && !list.includes(val)) list.push(val);
    });

    list.sort().forEach((item, index) => {
        $searchContainer.append(`
            <li class="w-full flex items-center p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded wbs-filter-item">
                <label for="dropdown-wbs-${index}" class="w-full flex items-center justify-between cursor-pointer m-0">
                    <div class="inline-flex items-center font-medium text-heading text-sm">${item}</div>
                    <input id="dropdown-wbs-${index}" type="checkbox" value="${item}" class="wbs-checkbox w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong">
                </label>
            </li>
        `);
    });

    $searchInput.off('input').on('input', function () {
        const text = $(this).val().toLowerCase();
        $searchContainer.find('.wbs-filter-item').each(function () { $(this).toggle($(this).text().toLowerCase().includes(text)); });
    });

    const applyFilter = () => {
        let selected = [];
        $searchContainer.find('.wbs-checkbox:checked').each(function () { selected.push($(this).val()); });
        const regex = selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|');
        table.column(2).search(regex, true, false).draw();
        syncAllTables(table); // ⚡ ซิงค์ตารางย่อยทั้งหมด
    };

    $searchContainer.off('change', '.wbs-checkbox').on('change', '.wbs-checkbox', applyFilter);
    $clearButton.off('click').on('click', function() {
        $searchContainer.find('.wbs-checkbox').prop('checked', false); 
        $searchInput.val('').trigger('input');
        applyFilter();
    });
},

// =================================================================
// [2/5] ฟังก์ชันกรอง ประเภทงาน Type WBS (คอลัมน์ที่ 5 ในตารางหลัก)
// =================================================================
setupFilterType_WBS(table, data) {
    const $dropdownMenu = $('#dropdownSearchTypeWBS'), $searchContainer = $dropdownMenu.find('ul'), $searchInput = $('#searchTypeWBS'), $clearButton = $('#clearTypeWBSFilter'); 
    $searchContainer.empty(); 

    let list = [];
    data.rows.forEach(row => {
        let val = row?.c?.[24] ? getCellValue(row.c[24]).toString().trim() : '';
        if (val && val !== "-" && !list.includes(val)) list.push(val);
    });

    list.sort().forEach((item, index) => {
        $searchContainer.append(`
            <li class="w-full flex items-center p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded typewbs-filter-item">
                <label for="dropdown-typewbs-${index}" class="w-full flex items-center justify-between cursor-pointer m-0">
                    <div class="inline-flex items-center font-medium text-heading text-sm">${item}</div>
                    <input id="dropdown-typewbs-${index}" type="checkbox" value="${item}" class="typewbs-checkbox w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong">
                </label>
            </li>
        `);
    });

    $searchInput.off('input').on('input', function () {
        const text = $(this).val().toLowerCase();
        $searchContainer.find('.typewbs-filter-item').each(function () { $(this).toggle($(this).text().toLowerCase().includes(text)); });
    });

    const applyFilter = () => {
        let selected = [];
        $searchContainer.find('.typewbs-checkbox:checked').each(function () { selected.push($(this).val()); });
        const regex = selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|');
        table.column(5).search(regex, true, false).draw();
        syncAllTables(table); // ⚡ ซิงค์ตารางย่อยทั้งหมด
    };

    $searchContainer.off('change', '.typewbs-checkbox').on('change', '.typewbs-checkbox', applyFilter);
    $clearButton.off('click').on('click', function() {
        $searchContainer.find('.typewbs-checkbox').prop('checked', false); 
        $searchInput.val('').trigger('input');
        applyFilter();
    });
},

// =================================================================
// [3/5] ฟังก์ชันกรอง PEA WBS (คอลัมน์ที่ 4 ในตารางหลัก)
// =================================================================
setupFilterPEA_WBS(table, peaNameMapping) {
    const $dropdownMenu = $('#dropdownSearchPEAWBS'), $searchContainer = $dropdownMenu.find('ul'), $searchInput = $('#searchPEAWBS'), $clearButton = $('#clearPEAWBSFilter'); 
    if ($dropdownMenu.length === 0) return;
    $searchContainer.empty(); 

    let list = [];
    Object.values(peaNameMapping).forEach(name => {
        if (name) {
            name = name.toString().trim();
            if (name !== "ชื่อ" && name !== "-" && !list.includes(name)) list.push(name);
        }
    });

    list.sort().forEach((item, index) => {
        $searchContainer.append(`
            <li class="w-full flex items-center p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded peawbs-filter-item">
                <label for="dropdown-peawbs-${index}" class="w-full flex items-center justify-between cursor-pointer m-0">
                    <div class="inline-flex items-center font-medium text-heading text-sm">${item}</div>
                    <input id="dropdown-peawbs-${index}" type="checkbox" value="${item}" class="peawbs-checkbox w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong">
                </label>
            </li>
        `);
    });

    $searchInput.off('input').on('input', function () {
        const text = $(this).val().toLowerCase();
        $searchContainer.find('.peawbs-filter-item').each(function () { $(this).toggle($(this).text().toLowerCase().includes(text)); });
    });

    const applyFilter = () => {
        let selected = [];
        $searchContainer.find('.peawbs-checkbox:checked').each(function () { selected.push($(this).val()); });
        const regex = selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|');
        table.column(4).search(regex, true, false).draw();
        syncAllTables(table); // ⚡ ซิงค์ตารางย่อยทั้งหมด
    };

    $searchContainer.off('change', '.peawbs-checkbox').on('change', '.peawbs-checkbox', applyFilter);
    $clearButton.off('click').on('click', function() {
        $searchContainer.find('.peawbs-checkbox').prop('checked', false); 
        $searchInput.val('').trigger('input');
        applyFilter();
    });
},

// =================================================================
// [4/5] ฟังก์ชันกรองกลุ่มโครงการ Project Group (คอลัมน์ที่ 10 ในตารางหลัก)
// =================================================================
setupFilterProjectGroup(table, data) {
    const $dropdownMenu = $('#dropdownSearchProjGroup'), $searchContainer = $dropdownMenu.find('ul'), $searchInput = $('#searchProjGroup'), $clearButton = $('#clearProjGroupFilter'); 
    $searchContainer.empty(); 

    let list = [];
    data.rows.forEach(row => {
        let val = row?.c?.[12] ? getCellValue(row.c[12]).toString().trim() : '';
        if (val && val !== "-" && !list.includes(val)) list.push(val);
    });

    list.sort().forEach((item, index) => {
        $searchContainer.append(`
            <li class="w-full flex items-center p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded projgroup-filter-item">
                <label for="dropdown-projgroup-${index}" class="w-full flex items-center justify-between cursor-pointer m-0">
                    <div class="inline-flex items-center font-medium text-heading text-sm">${item}</div>
                    <input id="dropdown-projgroup-${index}" type="checkbox" value="${item}" class="projgroup-checkbox w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong">
                </label>
            </li>
        `);
    });

    $searchInput.off('input').on('input', function () {
        const text = $(this).val().toLowerCase();
        $searchContainer.find('.projgroup-filter-item').each(function () { $(this).toggle($(this).text().toLowerCase().includes(text)); });
    });

    const applyFilter = () => {
        let selected = [];
        $searchContainer.find('.projgroup-checkbox:checked').each(function () { selected.push($(this).val()); });
        const regex = selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|');
        table.column(10).search(regex, true, false).draw();
        syncAllTables(table); // ⚡ ซิงค์ตารางย่อยทั้งหมด
    };

    $searchContainer.off('change', '.projgroup-checkbox').on('change', '.projgroup-checkbox', applyFilter);
    $clearButton.off('click').on('click', function() {
        $searchContainer.find('.projgroup-checkbox').prop('checked', false); 
        $searchInput.val('').trigger('input');
        applyFilter();
    });
},

// =================================================================
// [5/5] ฟังก์ชันกรองงบประมาณ Budget CIP (คอลัมน์ที่ 12 ในตารางหลัก)
// =================================================================
setupFilterBudgetCIP(table, data) {
    const $dropdownMenu = $('#dropdownSearchBudget'), $searchContainer = $dropdownMenu.find('ul'), $searchInput = $('#searchBudget'), $clearButton = $('#clearBudgetFilter'); 
    $searchContainer.empty(); 

    let list = [];
    data.rows.forEach(row => {
        let val = row?.c?.[18] ? getCellValue(row.c[18]).toString().trim() : '';
        if (val && val !== "-" && !list.includes(val)) list.push(val);
    });

    list.sort().forEach((item, index) => {
        $searchContainer.append(`
            <li class="w-full flex items-center p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded budget-filter-item">
                <label for="dropdown-budget-${index}" class="w-full flex items-center justify-between cursor-pointer m-0">
                    <div class="inline-flex items-center font-medium text-heading text-sm">${item}</div>
                    <input id="dropdown-budget-${index}" type="checkbox" value="${item}" class="budget-checkbox w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong">
                </label>
            </li>
        `);
    });

    $searchInput.off('input').on('input', function () {
        const text = $(this).val().toLowerCase();
        $searchContainer.find('.budget-filter-item').each(function () { $(this).toggle($(this).text().toLowerCase().includes(text)); });
    });

    const applyFilter = () => {
        let selected = [];
        $searchContainer.find('.budget-checkbox:checked').each(function () { selected.push($(this).val()); });
        const regex = selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|');
        table.column(12).search(regex, true, false).draw();
        syncAllTables(table); // ⚡ ซิงค์ตารางย่อยทั้งหมด
    };

    $searchContainer.off('change', '.budget-checkbox').on('change', '.budget-checkbox', applyFilter);
    $clearButton.off('click').on('click', function() {
        $searchContainer.find('.budget-checkbox').prop('checked', false); 
        $searchInput.val('').trigger('input');
        applyFilter();
    });
},




// =========== filter ตัวใหม่ล่าสุดสำหรับตารางพัสดุที่กำลังจะมาถึง (Upcoming Material) =========== //


setupFilterUpcoming_MaterialID(table, data) {
    // ==========================================
    // 1. กำหนดตัวแปรและดึง Element จาก HTML ใหม่
    // ==========================================
    const $dropdownMenu = $('#dropdownSearch');
    const $searchContainer = $dropdownMenu.find('ul'); // พื้นที่สอดแทรกรายการ <li>
    const $searchInput = $('#search');
    const $clearButton = $('#clearMaterialFilter');
    
    // เคลียร์รายการเก่าในดรอปดาวน์ออกก่อน เพื่อรองรับการอัปเดตข้อมูลใหม่
    $searchContainer.empty(); 

    // ==========================================
    // 2. ดึงข้อมูลและจัดการรหัสพัสดุไม่ให้ซ้ำ (ตรรกะเดิมของคุณ)
    // ==========================================
    let list = [];
    data.rows.forEach(row => {
        if (!row || !row.c) return;
        
        let cell = row.c[0];
        let val = (cell && cell.v !== undefined) ? cell.v.toString().trim() : "";
        
        if (val && val !== "-" && !list.includes(val)) {
            list.push(val);
        }
    });

    // ==========================================
    // 3. เรียงลำดับข้อมูลและสร้าง List Item (HTML) ยัดกลับเข้าไปในดรอปดาวน์
    // ==========================================
    list.sort().forEach((item, index) => {
        // สร้าง ID เฉพาะตัว (Unique ID) เพื่อให้ Tag Label ผูกกับ Checkbox ได้ถูกต้องเวลาคลิก
        const uniqueId = `dropdown-material-${index}`; 
        
        const listItemHtml = `
            <li class="w-full flex items-center p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded material-filter-item">
                <label for="${uniqueId}" class="w-full flex items-center justify-between cursor-pointer m-0">
                    <div class="inline-flex items-center font-medium text-heading text-sm">
                        ${item}
                    </div>
                    <input id="${uniqueId}" type="checkbox" value="${item}" class="material-checkbox w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong focus:ring-2 focus:ring-brand-soft">
                </label>
            </li>
        `;
        $searchContainer.append(listItemHtml);
    });

    // ==========================================
    // 4. ระบบพิมพ์ค้นหาในดรอปดาวน์ (Search Filter inside Dropdown)
    // ==========================================
    // เคลียร์ Event เก่าออกก่อน (.off) แล้วผูกใหม่ (.on) ป้องกันปัญหาสคริปต์ซ้อนกันเวลารันฟังก์ชันซ้ำ
    $searchInput.off('input').on('input', function () {
        const searchText = $(this).val().toLowerCase();
        
        $searchContainer.find('.material-filter-item').each(function () {
            const itemText = $(this).text().toLowerCase();
            
            // ถ้าคำค้นหาตรงกับชื่อพัสดุ ให้แสดงผล ถ้าไม่ตรงให้ซ่อน
            if (itemText.includes(searchText)) {
                $(this).attr('style', 'display: flex !important'); 
            } else {
                $(this).attr('style', 'display: none !important');  
            }
        });
    });

    // ==========================================
    // 5. ระบบดักจับการเลือก Checkbox และส่งค่าไปฟิลเตอร์ใน DataTable
    // ==========================================
    $searchContainer.off('change', '.material-checkbox').on('change', '.material-checkbox', function () {
        let selectedVals = [];
        
        // วนลูปหา Checkbox ทุกตัวในกล่องที่ถูกติ๊กเลือก (Checked) แล้วเก็บค่าเข้า Array
        $searchContainer.find('.material-checkbox:checked').each(function () {
            selectedVals.push($(this).val());
        });

        // ตรวจสอบเงื่อนไขแล้วส่งค่าไปกรองที่ตาราง DataTable
        if (selectedVals.length > 0) {
            // ทำการ Escape เครื่องหมายพิเศษ และเชื่อมข้อมูลด้วย | (แปลว่า "หรือ")
            const searchRegex = selectedVals.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|');
            // ทำการฟิลเตอร์ที่คอลัมน์ Index 0 แบบตรงตัวเป๊ะๆ (Exact Match) ด้วย Regex เช่น ^(M001|M002)$
            table.column(0).search(`^(${searchRegex})$`, true, false).draw();
        } else {
            // ถ้าไม่มีการติ๊กเลือกพัสดุเลยสักตัว ให้เคลียร์ฟิลเตอร์เพื่อให้แสดงข้อมูลตารางทั้งหมด
            table.column(0).search('').draw();
        }
    });

    // ==========================================
    // 6. ระบบปุ่มล้างค่าที่เลือกทั้งหมด (Clear Filters Button)
    // ==========================================
    $clearButton.off('click').on('click', function() {
        // 1. เอาเครื่องหมายติ๊กถูกออกจาก Checkbox ทุกตัวในรายการ
        $searchContainer.find('.material-checkbox').prop('checked', false); 
        // 2. ล้างช่องพิมพ์ค้นหาให้กลับมาเป็นค่าว่าง
        $searchInput.val('');
        // 3. แสดงรายการพัสดุทุกตัวใน List เผื่อมีบางตัวโดนซ่อนอยู่จากการค้นหาค้างไว้
        $searchContainer.find('.material-filter-item').attr('style', 'display: flex !important');
        // 4. สั่งสั่งตาราง DataTable รีเซ็ตกลับมาโชว์ข้อมูลพัสดุทั้งหมดเหมือนเดิม
        table.column(0).search('').draw(); 
    });
},

setupFilterUpcoming_MaterialName(table, data) {
    // ==========================================
    // 1. กำหนดตัวแปรและดึง Element จาก HTML 
    // ==========================================
    // แนะนำให้เช็ก ID ช่องค้นหาและปุ่มล้างค่าใน HTML ให้ตรงกันด้วยนะครับ
    const $dropdownMenu = $('#dropdownSearchName'); // ปรับแนะให้แยก ID เพื่อไม่ให้ชนกับรหัสพัสดุ
    const $searchContainer = $dropdownMenu.find('ul'); 
    const $searchInput = $('#searchMaterialName'); // ปรับแนะให้แยก ID
    const $clearButton = $('#clearMaterialNameFilter'); // ปรับแนะให้แยก ID
    
    // เคลียร์รายการเก่าในดรอปดาวน์ออกก่อน เพื่อรองรับการอัปเดตข้อมูลใหม่
    $searchContainer.empty(); 

    // ==========================================
    // 2. ดึงข้อมูลจาก Index 1 (ชื่อพัสดุ) และจัดการไม่ให้ซ้ำ
    // ==========================================
    let list = [];
    data.rows.forEach(row => {
        if (!row || !row.c) return;
        
        // ✨ เปลี่ยนมาดึงข้อมูลจากช่อง Index 1 (ชื่อพัสดุ)
        let cell = row.c[1]; 
        let val = (cell && cell.v !== undefined) ? cell.v.toString().trim() : "";
        
        if (val && val !== "-" && !list.includes(val)) {
            list.push(val);
        }
    });

    // ==========================================
    // 3. เรียงลำดับข้อมูลและสร้าง List Item (HTML) ยัดกลับเข้าไปในดรอปดาวน์
    // ==========================================
    list.sort().forEach((item, index) => {
        // เปลี่ยน prefix ID ป้องกันการซ้ำซ้อนกับของรหัสพัสดุ
        const uniqueId = `dropdown-matname-${index}`; 
        
        const listItemHtml = `
            <li class="w-full flex items-center p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded matname-filter-item">
                <label for="${uniqueId}" class="w-full flex items-center justify-between cursor-pointer m-0">
                    <div class="inline-flex items-center font-medium text-heading text-sm">
                        ${item}
                    </div>
                    <input id="${uniqueId}" type="checkbox" value="${item}" class="matname-checkbox w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong focus:ring-2 focus:ring-brand-soft">
                </label>
            </li>
        `;
        $searchContainer.append(listItemHtml);
    });

    // ==========================================
    // 4. ระบบพิมพ์ค้นหาในดรอปดาวน์ (Search Filter)
    // ==========================================
    $searchInput.off('input').on('input', function () {
        const searchText = $(this).val().toLowerCase();
        
        $searchContainer.find('.matname-filter-item').each(function () {
            const itemText = $(this).text().toLowerCase();
            
            if (itemText.includes(searchText)) {
                $(this).attr('style', 'display: flex !important'); 
            } else {
                $(this).attr('style', 'display: none !important');  
            }
        });
    });

    // ==========================================
    // 5. ระบบดักจับ Checkbox และส่งค่าไปฟิลเตอร์ใน DataTable คอลัมน์ที่ 1
    // ==========================================
    $searchContainer.off('change', '.matname-checkbox').on('change', '.matname-checkbox', function () {
        let selectedVals = [];
        
        $searchContainer.find('.matname-checkbox:checked').each(function () {
            selectedVals.push($(this).val());
        });

        // ส่งค่าไปค้นหาใน DataTable
        if (selectedVals.length > 0) {
            const searchRegex = selectedVals.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|');
            // ✨ เปลี่ยนไปค้นหาและฟิลเตอร์ที่คอลัมน์ Index 1 (ชื่อพัสดุ) แบบตรงตัวเป๊ะๆ ^(ชื่อA|ชื่อB)$
            table.column(1).search(`^(${searchRegex})$`, true, false).draw();
        } else {
            // ✨ เคลียร์ฟิลเตอร์ที่คอลัมน์ Index 1
            table.column(1).search('').draw();
        }
    });

    // ==========================================
    // 6. ระบบปุ่มล้างค่าที่เลือกทั้งหมด (Clear Filters)
    // ==========================================
    $clearButton.off('click').on('click', function() {
        // 1. เอาเครื่องหมายติ๊กถูกออกทั้งหมด
        $searchContainer.find('.matname-checkbox').prop('checked', false); 
        // 2. ล้างช่องพิมพ์ค้นหา
        $searchInput.val('');
        // 3. แสดงรายการทั้งหมดกลับมา
        $searchContainer.find('.matname-filter-item').attr('style', 'display: flex !important');
        // 4. ✨ รีเซ็ตตารางในคอลัมน์ Index 1 ให้กลับมาโชว์ข้อมูลทั้งหมด
        table.column(1).search('').draw(); 
    });
},

setupFilterUpcoming_PurchaseGroup(table, data) {
    // ==========================================
    // 1. กำหนดตัวแปรและดึง Element จาก HTML 
    // ==========================================
    const $dropdownMenu = $('#dropdownSearchGroup'); 
    const $searchContainer = $dropdownMenu.find('ul'); 
    const $searchInput = $('#searchPurchaseGroup'); 
    const $clearButton = $('#clearPurchaseGroupFilter'); 
    
    // เคลียร์รายการเก่าในดรอปดาวน์ออกก่อน
    $searchContainer.empty(); 

    // ==========================================
    // 2. ดึงข้อมูลจาก Index 2 (กลุ่มการจัดซื้อ) และจัดการไม่ให้ซ้ำ
    // ==========================================
    let list = [];
    data.rows.forEach(row => {
        if (!row || !row.c) return;
        
        let cell = row.c[2]; 
        let val = (cell && cell.v !== undefined) ? cell.v.toString().trim() : "";
        
        if (val && val !== "-" && !list.includes(val)) {
            list.push(val);
        }
    });

    // ==========================================
    // 3. เรียงลำดับข้อมูลและสร้าง List Item (HTML) ยัดกลับเข้าไปในดรอปดาวน์
    // ==========================================
    list.sort().forEach((item, index) => {
        const uniqueId = `dropdown-purgroup-${index}`; 
        
        const listItemHtml = `
            <li class="w-full flex items-center p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded purgroup-filter-item">
                <label for="${uniqueId}" class="w-full flex items-center justify-between cursor-pointer m-0">
                    <div class="inline-flex items-center font-medium text-heading text-sm">
                        ${item}
                    </div>
                    <input id="${uniqueId}" type="checkbox" value="${item}" class="purgroup-checkbox w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong focus:ring-2 focus:ring-brand-soft">
                </label>
            </li>
        `;
        $searchContainer.append(listItemHtml);
    });

    // ==========================================
    // 4. ระบบพิมพ์ค้นหาในดรอปดาวน์ (Search Filter)
    // ==========================================
    $searchInput.off('input').on('input', function () {
        const searchText = $(this).val().toLowerCase();
        
        $searchContainer.find('.purgroup-filter-item').each(function () {
            const itemText = $(this).text().toLowerCase();
            
            if (itemText.includes(searchText)) {
                $(this).attr('style', 'display: flex !important'); 
            } else {
                $(this).attr('style', 'display: none !important');  
            }
        });
    });

    // ==========================================
    // 5. ระบบดักจับ Checkbox และส่งค่าไปฟิลเตอร์ใน DataTable คอลัมน์ที่ 2
    // ==========================================
    $searchContainer.off('change', '.purgroup-checkbox').on('change', '.purgroup-checkbox', function () {
        let selectedVals = [];
        
        // วนลูปเก็บค่ากลุ่มการจัดซื้อจาก Checkbox ที่ถูกติ๊กเลือก
        $searchContainer.find('.purgroup-checkbox:checked').each(function () {
            selectedVals.push($(this).val());
        });

        if (selectedVals.length > 0) {
            // Escape เครื่องหมายพิเศษ และเชื่อมข้อมูลด้วย | (แปลว่า "หรือ")
            const searchRegex = selectedVals.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|');
            
            // ✨ แก้ไขจุดนี้: ถอดตัวบังคับหัวท้าย ^ และ $ ออก
            // เพื่อให้ DataTable ค้นหาคำแบบส่องเข้าไปเจอในก้อนแท็ก <span> สไตล์ของคุณได้ทันที
            table.column(2).search(searchRegex, true, false).draw();
        } else {
            // ถ้าไม่ได้ติ๊กอะไรเลย ให้แสดงข้อมูลทั้งหมดในคอลัมน์ที่ 2
            table.column(2).search('').draw();
        }
    });

    // ==========================================
    // 6. ระบบปุ่มล้างค่าที่เลือกทั้งหมด (Clear Filters)
    // ==========================================
    $clearButton.off('click').on('click', function() {
        $searchContainer.find('.purgroup-checkbox').prop('checked', false); 
        $searchInput.val('');
        $searchContainer.find('.purgroup-filter-item').attr('style', 'display: flex !important');
        // รีเซ็ตคอลัมน์ที่ 2 กลับมาโชว์ข้อมูลทั้งหมดเหมือนเดิม
        table.column(2).search('').draw(); 
    });
}
};





 
function setupRowClickEvent() {
    $(document).off('click', '#tableNoStock tbody tr.clickable-requirement').on('click', '#tableNoStock tbody tr.clickable-requirement', function () {
        const materialCode = $(this).data('material-code');
        console.log("กรองด้วยรหัส:", materialCode);

        // ดึง Instance ใหม่สดๆ จาก DOM
        const tables = ['#tabUpcoming', '#tabStockN2', '#tabN2PO'];
        
        tables.forEach(id => {
            if ($.fn.DataTable.isDataTable(id)) {
                $(id).DataTable().column(0).search(materialCode).draw();
            }
        });
        setTimeout(() => {
            updateTabCounts();
        }, 300);
    });
}

function setupGlobalEvents() {
   // 🎯 ปุ่มรีเซ็ตสำหรับตารางหลัก (ปรับโครงสร้างมัดรวมแบบเดียวกับ upcoming)
 $('#resetMB52').on('click', function () {
        // 1. ล้างการค้นหาและการกรองในตารางหลักทั้งหมดออก แล้ววาดตารางใหม่ (โค้ดดั้งเดิมของคุณ)
        if (parcelTable) parcelTable.search('').columns().search('').draw();
        if (stockMatchTableInstance) stockMatchTableInstance.search('').columns().search('').draw();
        if (noStockTableInstance) noStockTableInstance.search('').columns().search('').draw();
        if (obsoleteTableInstance) obsoleteTableInstance.search('').columns().search('').draw();
        if (mb52Table) mb52Table.search('').draw();
        
        // ====================================================================
        // 🎯 เคลียร์ 6 ตัวกรองหลักตามโครงสร้างและเงื่อนไขของคุณเป๊ะๆ
        // ====================================================================

        // 2. เคลียร์ข้อความในช่องพิมพ์ค้นหา (Dropdown) ทั้งหมดให้กลับเป็นค่าว่าง
        $(
            '#searchTypeWBS, #searchWBS, #searchPEAWBS, ' +
            '#searchProjGroup, #searchBudget'
        ).val('');
        // หมายเหตุ: หากตัวกรอง Light มีไอดีช่องเสิร์ช สามารถนำมาใส่เพิ่มในกลุ่มด้านบนนี้ได้เลยครับ
        
        // 3. รีเซ็ตข้อความบนหน้าปุ่มกดเลือกตัวกรองให้กลับเป็นสถานะเริ่มต้น
        $('#dropdownLightButton span').text('ทั้งหมด (สัญญาณไฟ)'); // ปรับเปลี่ยนข้อความเริ่มต้นตามจริงของคุณได้เลยครับ
        $('#dropdownTypeWBSButton span').text('ทั้งหมด (สถานะงาน)');
        $('#dropdownWBSButton span').text('ทั้งหมด (หมายเลขงาน)');
        $('#dropdownPEAWBSButton span').text('ทั้งหมด (การไฟฟ้า)');
        $('#dropdownProjGroupButton span').text('ทั้งหมด (กลุ่มโครงการ)');
        $('#dropdownBudgetButton span').text('ทั้งหมด (งบ)');

        // 🎯 สั่งเอาเครื่องหมายติ๊กถูก (Checkbox) ออกทั้งหมด! (ตามคลาสที่คุณระบุ)
        $('.typewbs-checkbox').prop('checked', false);
        $('.wbs-checkbox').prop('checked', false);
        $('.peawbs-checkbox').prop('checked', false);
        $('.projgroup-checkbox').prop('checked', false);
        $('.budget-checkbox').prop('checked', false);
        // สำหรับกล่องไฟ ใช้ ID คอนเทนเนอร์ในการล้าง checkbox ด้านใน
        $('#dropdownSearchLight input[type="checkbox"]').prop('checked', false);

        // 🎯 สั่งให้รายการตัวกรองที่เคยถูกซ่อนตอนพิมพ์ค้นหา กลับมาแสดงทั้งหมดด้วย (display: flex)
        $(
            '#dropdownSearchLight li, #dropdownSearchTypeWBS li, ' +
            '#dropdownSearchWBS li, #dropdownSearchPEAWBS li, ' +
            '#dropdownSearchProjGroup li, #dropdownSearchBudget li'
        ).attr('style', 'display: flex !important');

        // ====================================================================

        // 4. รีเซ็ตคลาสแถวตารางหลักและอัปเดตหน้า Dashboard (โค้ดดั้งเดิมของคุณ)
        $('#tableRequirement_Data tbody tr').removeClass('table-primary selected-row');
        $('.filter-select').val('');
       
    });
    // 🎯 ✨ จุดที่เพิ่มใหม่: เพิ่มฟังก์ชันรีเซ็ตแยกเฉพาะของตาราง Upcoming ล่วงหน้า
  // 🎯 ส่วนของปุ่มรีเซ็ตแยกเฉพาะของตาราง Upcoming
    $('#resetUpcoming').on('click', function () {
        if (upcomingTableInstance) {
            // 1. ล้างการค้นหาและการกรองทั้งหมดในตาราง Upcoming แล้ววาดใหม่
            upcomingTableInstance.search('').columns().search('').draw();
        }
        
        // 2. เคลียร์ข้อความในช่องค้นหา (Dropdown) ทั้ง 3 ช่องให้กลับเป็นค่าว่าง
        $('#search, #searchMaterialName, #searchPurchaseGroup').val('');
        
        // 3. รีเซ็ตข้อความบนหน้าปุ่มกดเลือกตัวกรองให้กลับเป็นสถานะเริ่มต้น
        $('#dropdownUsersSearchButton span').text('ทั้งหมด (รหัสพัสดุ)');
        $('#dropdownMaterialNameButton span').text('ทั้งหมด (ชื่อพัสดุ)');
        $('#dropdownPurchaseGroupButton span').text('ทั้งหมด (กลุ่มการจัดซื้อ)');

        // 🎯 ✨ จุดที่เพิ่มใหม่: สั่งเอาเครื่องหมายติ๊กถูก (Checkbox) ออกทั้งหมด!
        // ล้าง Checkbox ของรหัสพัสดุ (ถ้ามีคลาสเฉพาะ ให้เปลี่ยนตามจริง หรือใช้ตัวเลือกนี้ครอบคลุมทั้งหมด)
        $('#dropdownSearch input[type="checkbox"]').prop('checked', false);
        
        // ล้าง Checkbox ของชื่อพัสดุ (อ้างอิงจากคลาส .matname-checkbox ที่คุณเขียนไว้)
        $('.matname-checkbox').prop('checked', false);
        
        // ล้าง Checkbox ของกลุ่มการจัดซื้อ (ค้นหาอินพุตประเภท checkbox ทั้งหมดในดรอปดาวน์กลุ่มจัดซื้อ)
        $('#dropdownSearchGroup input[type="checkbox"]').prop('checked', false);

        // 🎯 ✨ แถมเพิ่มเติม: สั่งให้รายการตัวกรองที่เคยถูกซ่อนตอนพิมพ์ค้นหา กลับมาแสดงทั้งหมดด้วย
        $('.matname-filter-item').attr('style', 'display: flex !important');
        // (ถ้าของรหัสพัสดุและกลุ่มจัดซื้อมีคลาสคล้ายกัน สามารถใส่เพิ่มตรงนี้ได้เลยครับ)
        $('#dropdownSearch li, #dropdownSearchGroup li').attr('style', 'display: flex !important');
    });

    setupRowClickEvent();
}



async function initDashboard() {
    const startTime = performance.now();
    
 
    
    try {
        const fetchStart = performance.now();

        // 🎯 1. ดึงข้อมูลผ่าน CommonService ทั้งหมด (แทนที่ DataService เดิม)
        const [vvipData, peaMapping, budgetMapping, upcomingData] = await Promise.all([
            CommonService.fetchVVIPData(),
            CommonService.fetchPEANameData(),
            CommonService.fetchBudgetData(),
            CommonService.fetchUpcomingItemData()
        ]);

        // ดึงข้อมูล Sheet ตาม config ที่คุณมี
        const sheetPromises = config.map(async (sheet) => {
            const data = await CommonService.fetchSheetData(sheet.name);
            return { sheet, data };
        });

        const results = await Promise.all(sheetPromises);

        const fetchEnd = performance.now();
        console.group("📊 Dashboard Performance Tracker");
        console.log(`⏱️ 1. Fetching Data Time: ${((fetchEnd - fetchStart) / 1000).toFixed(2)} seconds`);

        // แยกข้อมูล
        const dataMap = results.reduce((acc, curr) => {
            acc[curr.sheet.name] = curr.data;
            return acc;
        }, {});

        // 🎯 2. สร้าง Material Map ผ่าน CommonService (จบปัญหา Not Defined)
        const masterKey = Object.keys(dataMap).find(key => key.toLowerCase().includes('material_master'));
        const materialTypeMap = CommonService.buildMaterialTypeMap(dataMap[masterKey]);
        
        // สำหรับ NoteMap (ยังคงใช้ Logic เดิมของคุณ)
        const materialNoteMap = {};
        if (dataMap[masterKey]?.rows) {
            const cols = dataMap[masterKey].cols;
            const finalNoteIdx = Math.max(cols.findIndex(c => c.label === "Not"), 7);
            dataMap[masterKey].rows.forEach(row => {
                const partID = CommonService.getCellValue(row.c[0])?.toString().trim();
                if (partID) materialNoteMap[partID] = CommonService.getCellValue(row.c[finalNoteIdx])?.toString().trim() || "";
            });
        }

        globalVVIP = vvipData;
        peaNameMapping = peaMapping;

        const processStart = performance.now();

        // สรุปยอดคำนวณคลังสินค้า (Stock)
        totalStockSummary = {};
        if (dataMap['Stock_Data']?.rows) {
            dataMap['Stock_Data'].rows.forEach(row => {
                const partID = CommonService.getCellValue(row.c[0])?.toString().trim();
                const quantity = parseFloat(CommonService.getCellValue(row.c[8])) || 0;
                if (partID) totalStockSummary[partID] = (totalStockSummary[partID] || 0) + quantity;
            });
        }

        // คำนวณระบบจัดสรรพัสดุ
        rawRequirementDatabase = dataMap['Requirement_Data'];
        const alloc = AllocationService.calculateAllocation(
            rawRequirementDatabase, globalVVIP, totalStockSummary, materialTypeMap, budgetMapping
        );
        
        const processedAllocData = updateProgressData(alloc.allocatedResults, materialTypeMap);
        const wbsProgressMap = getWBSProgressMap(processedAllocData);

        // ================= วาดตาราง ================= //
        config.forEach(sheet => {
            const data = dataMap[sheet.name];
            if (!data) return;

            if (sheet.name === 'Requirement_Data') {
                parcelTable = TableRenderer.renderRequirementTable(
                    sheet.target, data, globalVVIP, peaNameMapping,
                    alloc.finalWbsScores, alloc.wbsStatusMap, budgetMapping, wbsProgressMap
                );
                
                renderInitialStockMatch(processedAllocData, materialTypeMap);
               
                noStockTableInstance = TableRenderer.renderNoStockTable(alloc.allocatedResults, materialTypeMap,dataMap['Stock_Data'],upcomingData,dataMap['StockN2_Data']);
                obsoleteTableInstance = TableRenderer.renderObsoleteTable(alloc.allocatedResults, materialTypeMap, materialNoteMap);
                UpcomingTabInstance = TableRenderer.renderUpcomingTab(upcomingData);
                StockN2TabInstance =TableRenderer.renderStockN2Tab(dataMap['StockN2_Data']);
                N2POTabInstance =TableRenderer.renderN2POTab(dataMap['N2PO_Data']);

                // 🎯 3. สั่ง Render ตาราง Warehouse (ส่งค่าผ่านตัวแปร)
                if (typeof WarehouseService !== 'undefined') {
                    WarehouseService.renderNoStock_warehouse(processedAllocData, materialTypeMap);
                }

                FilterModule.setupFilterID_WBS(parcelTable, data);
                FilterModule.setupFilterType_WBS(parcelTable, data);
                FilterModule.setupFilterPEA_WBS(parcelTable, peaNameMapping);
                FilterModule.setupFilterLight(parcelTable, data, alloc.wbsStatusMap);
                FilterModule.setupFilterProjectGroup(parcelTable, data);
                FilterModule.setupFilterBudgetCIP(parcelTable, data);

             

            } else if (sheet.name === 'Stock_Data') {
                mb52Table = TableRenderer.renderStockTable(sheet.target, data, materialTypeMap, "stock");
            } else if (sheet.name !== 'Material_Master') {
                TableRenderer.renderGenericTable(sheet.target, data);
            }
        });

        if (upcomingData?.rows?.length > 0) {
             upcomingTableInstance = renderUpcomingTable(upcomingData);
             if (upcomingTableInstance) {
                FilterModule.setupFilterUpcoming_MaterialID(upcomingTableInstance, upcomingData);
                FilterModule.setupFilterUpcoming_MaterialName(upcomingTableInstance, upcomingData);
                FilterModule.setupFilterUpcoming_PurchaseGroup(upcomingTableInstance, upcomingData);
             }
        }
        updateCounts();
        setupGlobalEvents();
        $('#main-page-loader').fadeOut(100, function() { $(this).remove(); });

        const processEnd = performance.now();
        console.log(`⏱️ 2. Processing & Rendering Time: ${((processEnd - processStart) / 1000).toFixed(2)} seconds`);
        console.log(`🚀 Total Execution Time: ${((processEnd - startTime) / 1000).toFixed(2)} seconds`);
        console.groupEnd();
      
    } 
    
    
    
    catch (err) {
        console.error("❌ Dashboard Initialization Error:", err);
        $('#main-page-loader').remove();
    }


  
}

$(document).ready(() => initDashboard());