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
let fulfilledTableInstance = null;
let completedTableInstance = null; // เพิ่มตัวแปรสำหรับตาราง Completed Order
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



// =========================================================================
// 🎯 ฟังก์ชันวาดตาราง Upcoming_Item (เวอร์ชันล้างบั๊ก Syntax Error '!')
// =========================================================================
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
    "scrollX": true,
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
                
                if (text.includes("กฟส.") || text.includes("กฟจ.")) { bgColor = "#1ed760"; textColor = "#ffffff"; icon = "fa-shopping-cart"; }
                else if (text.includes("กจล.")) { bgColor = "#2D5FF6"; textColor = "#ffffff"; icon = "fa-truck"; }
                else if (text.includes("ขอโอน")) { bgColor = "#F69D3C"; textColor = "#ffffff"; icon = "fa-sync-alt"; }
                
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
// ==================== Scoring Service ====================

// ==================== Allocation Service ====================
// ==================== Allocation Service (เวอร์ชันพ่น Log สรุปอันดับคิว) ====================
const  updateGraph = {
   


updateDashboardCharts: function(tableSelector) {
        // ตรวจสอบความปลอดภัย: หาก Element นั้นไม่ได้เป็นตาราง DataTables ให้เด้งออกทันที
        if (!$.fn.DataTable.isDataTable(tableSelector)) return;
        
        const tableApi = $(tableSelector).DataTable();
        const allRowsData = [];

        // วนลูปสแกนข้อมูลแถวในตารางรอบเดียว (เอาเฉพาะหน้าจอที่กำลังแสดงผล 'applied')
        tableApi.rows({ search: 'applied' }).nodes().to$().each(function() {
            const $row = $(this);
            
            // 📌 ดึงสถานะไฟสัญญาณจากคอลัมน์ที่ 2 (Index 1) และแปลงตัวอักษรให้เป็นพิมพ์เล็กทั้งหมด
            const tokenSpan = $row.find('td:eq(1) span').text();
            const currentStatus = tokenSpan.replace('status-', '').toLowerCase().trim();
            
            // 📌 ดึงชื่อการไฟฟ้าจากคอลัมน์ที่ 5 (Index 4) หากไม่มีให้ใส่ค่าตั้งต้น
            const peaName = $row.find('td:eq(4)').text().trim() || "ไม่ระบุการไฟฟ้า";
            
            // 📌 ดึงมูลค่างานดิบจากคอลัมน์ที่ 7 (Index 6) โดยอิงตาม data-order เพื่อความแม่นยำทางคณิตศาสตร์
            const rawMoney = parseFloat($row.find('td:eq(6)').attr('data-order')) || 0;

            // ยัดอ็อบเจกต์ที่สกัดเสร็จแล้วลงสู่อาเรย์หลัก
            allRowsData.push({ status: currentStatus, pea: peaName, money: rawMoney });
        });
// ====================================================================
    // 🔥 [จุดที่ต้องแปะเพิ่ม] ปล่อยพลัง Console Check ส่องข้อมูลก่อนวิ่งเข้ากราฟ
    // ====================================================================
        // 🚀 ส่งกองทัพข้อมูลก้อนเดียวกันนี้ แยกไปให้ฟังก์ชันย่อยของกราฟแต่ละตัวทำงานต่อ
        this.updatePieChart(allRowsData);
        this.updateBarChart(allRowsData);
    },

    /**
     * ==================================================================================
     * 🍕 [หัวข้อ 1.2] ฟังก์ชันย่อย: คำนวณสะสมและพ่นข้อมูลใส่กราฟวงกลม (Pie/Doughnut Chart)
     * ==================================================================================
     * ทำหน้าที่แยกนับจำนวนงาน (Count) และรวมเม็ดเงิน (Money) ของแต่ละสถานะแยกขาดจากกันเป็น 5 สาย
     */
    updatePieChart: function(cleanData) {
        // ประกาศตัวแปรนับจำนวนงานแยก 5 สถานะ
        let countGreen = 0; let countBlue = 0; let countYellow = 0; let countRed = 0; let countLock = 0;
        // ประกาศตัวแปรรวมมูลค่าเงินสะสมแยก 5 สถานะ
        let sumGreenMoney = 0; let sumBlueMoney = 0; let sumYellowMoney = 0; let sumRedMoney = 0; let sumLockMoney = 0;

        // วนลูปเช็คสถานะพัสดุรายชิ้นเพื่อสะสมค่าตัวเลข
        cleanData.forEach(item => {
            if (item.status === 'green' || item.status === 'match') { 
                countGreen += 1; sumGreenMoney += item.money;       // 🟢 กลุ่มของครบ
            } else if (item.status === 'blue') { 
                countBlue += 1; sumBlueMoney += item.money;         // 🔵 กลุ่มพัสดุหลักครบ
            } else if (item.status === 'yellow') { 
                countYellow += 1; sumYellowMoney += item.money;     // 🟡 กลุ่มได้ของบางส่วน
            } else if (item.status === 'red' || item.status === 'shortage') { 
                countRed += 1; sumRedMoney += item.money;           // 🔴 กลุ่มไม่ได้ของเลย
            } else if (item.status === 'lock'|| item.status.includes('lock')) {
                countLock += 1; sumLockMoney += item.money;         // 🔒 กลุ่มงานโดนล็อก (ล้าสมัย/เปลี่ยนรหัส)
            }
        });

        // หากตัวอินสแตนซ์ของกราฟวงกลมพร้อมใช้งาน ให้ทำการอัปเดตข้อมูลพิกัดภายในทันที
        if (GraphRender.myPieChart) {
            // อัปเดตอาเรย์จำนวนงาน เรียงลำดับตาม Index ของป้ายชื่อ (Labels) ที่ตั้งไว้
            GraphRender.myPieChart.data.datasets[0].data = [countGreen, countBlue, countYellow, countRed, countLock];
            // อัปเดตอาเรย์เงินสะสมเพื่อซ่อนไว้ดึงใช้งานตอนเมาส์ชี้ (Tooltip)
            GraphRender.myPieChart.data.datasets[0].customMoney = [sumGreenMoney, sumBlueMoney, sumYellowMoney, sumRedMoney, sumLockMoney];
            
            // สั่งให้กราฟวาดและเรนเดอร์ตัวเองใหม่แบบอนิเมชันเสี้ยววินาที
            GraphRender.myPieChart.update();
        }
    },

    /**
     * ==================================================================================
     * 📊 [หัวข้อ 1.3] ฟังก์ชันย่อย: คำนวณสะสมและพ่นข้อมูลใส่กราฟแท่ง (Bar Chart)
     * ==================================================================================
     * ทำหน้าที่จัดกลุ่มงานแยกตาม "รายชื่อการไฟฟ้า" ก่อน แล้วจึงแตกแขนงจำนวนชิ้นและเงินทุนในแต่ละสังกัด
     */
    updateBarChart: function(cleanData) {
        let peaGroup = {};

        // 📦 ขั้นตอนที่ 1: วนลูปจัดระเบียบข้อมูลดิบให้ไปกองอยู่ภายใต้ Key ของแต่ละการไฟฟ้า
        cleanData.forEach(item => {
            // ถ้าเป็นการไฟฟ้าใหม่ที่ระบบยังไม่เคยเจอ ให้สร้างโครงสร้างตรรกะว่างขึ้นมารองรับก่อน
            if (!peaGroup[item.pea]) {
                peaGroup[item.pea] = {
                    greenCount: 0, greenMoney: 0,
                    blueCount: 0, blueMoney: 0,
                    yellowCount: 0, yellowMoney: 0,
                    redCount: 0, redMoney: 0,
                    lockCount: 0, lockMoney: 0,
                    totalCount: 0 // เก็บลำดับยอดงานรวมทุกสีในสังกัดนั้นๆ
                };
            }

            // บวกรวมยอดงานรวมทั้งหมดของกฟฟ. นี้
            peaGroup[item.pea].totalCount += 1;

            // คัดแยกประเภทเพื่อสะสมจำนวนและเงินทุนลงสังกัดการไฟฟ้านั้น
            if (item.status === 'green' || item.status === 'match') { 
                peaGroup[item.pea].greenCount += 1; peaGroup[item.pea].greenMoney += item.money;
            } else if (item.status === 'blue') { 
                peaGroup[item.pea].blueCount += 1; peaGroup[item.pea].blueMoney += item.money;
            } else if (item.status === 'yellow') { 
                peaGroup[item.pea].yellowCount += 1; peaGroup[item.pea].yellowMoney += item.money;
            } else if (item.status === 'red' || item.status === 'shortage') { 
                peaGroup[item.pea].redCount += 1; peaGroup[item.pea].redMoney += item.money;
            } else if (item.status === 'lock'|| item.status.includes('lock')) {
                peaGroup[item.pea].lockCount += 1; peaGroup[item.pea].lockMoney += item.money;
            }
        });

        // 📦 ขั้นตอนที่ 2: แปลงโครงสร้างแบบกลุ่ม ยัดกลับเข้าสู่อาเรย์แนวดิ่ง เพื่อป้อนให้ Chart.js
        if (GraphRender.myBarChart) {
            // ดึงชื่อการไฟฟ้าทั้งหมดออกมาทำแกน X พร้อมเรียงตัวอักษร ก-ฮ จากน้อยไปมาก
            const peaLabels = Object.keys(peaGroup).sort();
            
            // เตรียมถังสำหรับสวมข้อมูล 5 สถานะ
            let barDataGreen = []; let barMoneyGreen = [];
            let barDataBlue = []; let barMoneyBlue = [];
            let barDataYellow = []; let barMoneyYellow = [];
            let barDataRed = []; let barMoneyRed = [];
            let barDataLock = []; let barMoneyLock = [];
            let barTotalCounts = []; // สำหรับโชว์ยอดรวมที่หัว Tooltip

            // แตกข้อมูลรายชื่อออกมาผลักลงอาเรย์ทีละตัว
            peaLabels.forEach(name => {
                barDataGreen.push(peaGroup[name].greenCount); barMoneyGreen.push(peaGroup[name].greenMoney);
                barDataBlue.push(peaGroup[name].blueCount); barMoneyBlue.push(peaGroup[name].blueMoney);
                barDataYellow.push(peaGroup[name].yellowCount); barMoneyYellow.push(peaGroup[name].yellowMoney);
                barDataRed.push(peaGroup[name].redCount); barMoneyRed.push(peaGroup[name].redMoney);
                barDataLock.push(peaGroup[name].lockCount); barMoneyLock.push(peaGroup[name].lockMoney);
                barTotalCounts.push(peaGroup[name].totalCount); 
            });

            // ดันป้ายแกน X และ ข้อมูลฝังซ่อนส่วนรวมเข้าสู่ชุด Config กราฟแท่ง
            GraphRender.myBarChart.data.labels = peaLabels;
            GraphRender.myBarChart.data.customTotalCounts = barTotalCounts;

            // ดันข้อมูลจำนวนและเงินทุนกลับสู่ตำแหน่ง Datasets แต่ละแท่ง (Index 0 ถึง 4)
            GraphRender.myBarChart.data.datasets[0].data = barDataGreen;
            GraphRender.myBarChart.data.datasets[0].customMoney = barMoneyGreen;
            
            GraphRender.myBarChart.data.datasets[1].data = barDataBlue;
            GraphRender.myBarChart.data.datasets[1].customMoney = barMoneyBlue;
            
            GraphRender.myBarChart.data.datasets[2].data = barDataYellow;
            GraphRender.myBarChart.data.datasets[2].customMoney = barMoneyYellow;
            
            GraphRender.myBarChart.data.datasets[3].data = barDataRed;
            GraphRender.myBarChart.data.datasets[3].customMoney = barMoneyRed;
            
            GraphRender.myBarChart.data.datasets[4].data = barDataLock;
            GraphRender.myBarChart.data.datasets[4].customMoney = barMoneyLock;
            
            // สั่งคำนวณและวาดกราฟแท่งใหม่บนหน้าจอ
            GraphRender.myBarChart.update();
        }
    }
};
const GraphRender = {
  // สแตนบายตัวแปรสำหรับเก็บสถานะอินสแตนซ์กราฟ ป้องกันขยะหน่วยความจำ (Memory Leak)
  myPieChart: null,
  myBarChart: null,

  /**
   * ==================================================================================
   * 🍕 [หัวข้อ 2.1] ฟังก์ชันขึ้นรูปโครงสร้างกราฟวงกลม (Doughnut Chart - 5 Segments)
   * ==================================================================================
   */
  Piegraph: function() {
    const canvasEl = document.getElementById('chartPieStatus');
    if (!canvasEl) return;
    
    // เคลียร์ขยะ Canvas เก่าด้วยการเขียนทับแท็ก HTML ใหม่ ป้องกันปัญหากราฟซ้อนทับเวลาเอาเมาส์ชี้
    const container = canvasEl.parentElement;
    container.innerHTML = '<canvas id="chartPieStatus"></canvas>';
    
    const ctxPie = document.getElementById('chartPieStatus').getContext('2d');
    this.myPieChart = new Chart(ctxPie, {
      type: 'doughnut', // กำหนดรูปแบบเป็นวงโดนัททรงกลม
      data: {
        // ป้ายชื่อกำกับสีกราฟทั้ง 5 ส่วนท้ายแผนภูมิ
        labels: ['งานที่มีพัสดุครบ', 'งานที่มีพัสดุหลักครบ', 'งานที่มีได้ของบางส่วน', 'งานที่ไม่ได้ของ', 'งานที่โดนล็อค 🔒'],
        datasets: [{
          data: [0, 0, 0, 0, 0],         // จำนวนชิ้นงานรอรับค่าจาก Controller
          customMoney: [0, 0, 0, 0, 0],  // ยอดงบสะสมรอรับค่าจาก Controller
          // รหัสสีประจำตัวสถานะ: [เขียว, น้ำเงิน, เหลืองทอง, แดงส้ม, เทากุญแจล็อก]
          backgroundColor: ['#2ed573', '#2152ff', '#f7d02c', '#eb4856', '#6c757d'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          // จัดแต่งตำแหน่งกล่องป้ายชื่อสถานะด้านล่างกราฟ
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
          
          // 🎯 ออกแบบตัว Tooltip ตอนผู้ใช้งานเลื่อนเมาส์ผ่านกราฟวงกลม
          tooltip: {
            callbacks: {
              // บรรทัดที่ 1: แสดงชื่อสีและจำนวนงานที่คำนวณได้
              label: function(context) {
                let label = context.label || '';
                let value = context.raw || 0;
                return `${label}: ${value} งาน`;
              },
              // บรรทัดที่ 2: ดึงจำนวนเงินรวมสะสมในตระกูลอาร์เรย์ customMoney ออกมาฟอร์แมตคอมมาคั่น
              afterLabel: function(context) {
                let moneyDataset = context.dataset.customMoney;
                let moneyValue = moneyDataset ? moneyDataset[context.dataIndex] : 0;
                
                let formattedMoney = moneyValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
                return `💰 มูลค่างานรวม: ${formattedMoney} บาท`;
              }
            }
          }
        },
        cutout: '70%' // เจาะรูตรงกลางโดนัทให้กว้าง 70% ดูสบายตาโมเดิร์น
      }
    });
  },

  /**
   * ==================================================================================
   * 📊 [หัวข้อ 2.2] ฟังก์ชันขึ้นรูปโครงสร้างกราฟแท่งแยกประเภท (Grouped Bar Chart - 5 Bars)
   * ==================================================================================
   */
  BarGraph: function() {
    const canvasEl = document.getElementById('chartBarPEA');
    if (!canvasEl) return;
    
    // ถอนรากถอนโคน Canvas เก่าเพื่อเคลียร์สิทธิ์ครอบครองก่อนเขียนซ้ำป้องกันหน้าเว็บบั๊ก
    const container = canvasEl.parentElement;
    container.innerHTML = '<canvas id="chartBarPEA"></canvas>';
    
    const ctxBar = document.getElementById('chartBarPEA').getContext('2d');
    
    this.myBarChart = new Chart(ctxBar, {
      type: 'bar', // กำหนดรูปแบบเป็นแผนภูมิแท่งแนวตั้ง
      data: {
        labels: [], // แกน X: ชื่อของแต่ละการไฟฟ้า (จะถูกยัดเข้ามาไดนามิกเมื่อรันคำสั่งสรุปผล)
        datasets: [
          {
            label: 'งานที่มีพัสดุครบ',
            data: [], customMoney: [], backgroundColor: '#2ed573'
          },
          {
            label: 'งานที่มีพัสดุหลักครบ',
            data: [], customMoney: [], backgroundColor: '#2152ff' // 🔵 แท่งสีน้ำเงินอิสระ
          },
          {
            label: 'งานที่มีได้ของบางส่วน',
            data: [], customMoney: [], backgroundColor: '#f7d02c' // 🟡 แท่งสีเหลืองอิสระ
          },
          {
            label: 'งานที่ไม่ได้ของ',
            data: [], customMoney: [], backgroundColor: '#eb4856'
          },
          {
            label: 'งานที่โดนล็อค 🔒',
            data: [], customMoney: [], backgroundColor: '#6c757d' // 🔒 แท่งสีกุญแจล็อกโลหะเพิ่มใหม่
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false } }, // ปิดเส้นตารางแนวดิ่งแกน X เพื่อความคลีนของกราฟ
          y: { 
            beginAtZero: true, // บังคับให้แกน Y สตาร์ทนับจากเลข 0 เสมอ
            title: { display: true, text: 'จำนวนงาน (งาน)', font: { size: 11 } }
          }
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
          
          // 🎯 ออกแบบตัว Tooltip ตอนผู้ใช้งานเลื่อนเมาส์ผ่านเสากราฟแท่ง
          tooltip: {
            callbacks: {
              // บรรทัดส่วนหัว (Header): แสดงชื่อกฟฟ. และส่องหาค่าผลรวมทั้งหมดของสถานีนั้นมาแสดงพ่วงท้าย
              title: function(context) {
                let peaName = context[0].label || ''; 
                let dataIndex = context[0].dataIndex;
                
                // เอื้อมไปหยิบอาร์เรย์สรุปยอดรวมแอบซ่อน (customTotalCounts) ออกมาส่องดูค่าตาม Index การไฟฟ้า
                let chartConfig = context[0].chart;
                let totalCountsArray = chartConfig.data.customTotalCounts;
                let totalJobs = totalCountsArray ? totalCountsArray[dataIndex] : 0;
                
                return `${peaName} (รวม ${totalJobs} งาน)`;
              },
              
              // บรรทัดที่ 2: พ่นประเภทแท่งไฟที่เรากำลังชี้อยู่และแสดงจำนวนงานย่อยในกลุ่มสีนั้น
              label: function(context) {
                let datasetLabel = context.dataset.label || '';
                let value = context.raw || 0;
                return `${datasetLabel}: ${value} งาน`;
              },
              
              // บรรทัดที่ 3: แสวงหาค่าเงินดิบสะสมของสีนั้นจัดรูปแบบทศนิยม 2 ตำแหน่งให้สวยงาม
              afterLabel: function(context) {
                let moneyDataset = context.dataset.customMoney;
                let moneyValue = moneyDataset ? moneyDataset[context.dataIndex] : 0;
                let formattedMoney = moneyValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2, maximumFractionDigits: 2
                });
                return `💰 มูลค่างานรวม: ${formattedMoney} บาท`;
              }
            }
          }
        }
      }
    });
  }
};

// ====== คำนวณและอัปเดตข้อมูลใน Dashboard Cards (เช่น จำนวนงานทั้งหมด, มูลค่างานรวม) ทุกครั้งที่มีการกรองข้อมูลในตาราง ======
function updateDashboardCards(tableSelector,compTableSelector) {
    // ส่งตาราง Instance เข้าไปตรงๆ เพื่อให้ฟังก์ชันย่อยเอาไปจัดการฟิลเตอร์ต่อได้
    const table = $(tableSelector).DataTable();
    ShowTotalJobs(table);

    // 2. จัดการตารางที่เสร็จแล้ว (Completed)
    // if ($(compTableSelector).length) {
    //     const compTable = $(compTableSelector).DataTable();
    //     ShowCompletedStats(compTable); // ฟังก์ชันใหม่สำหรับตารางที่เสร็จแล้ว
    // }

    // // 3. (Optional) สั่งอัปเดตผลรวมใหญ่ในกรณีที่ต้องการคำนวณจากยอดที่คำนวณเสร็จแล้ว
    // UpdateGrandTotal();
}

function updateDashboardCardsDebounced(tableSelector) {
    debounce('updateCards', () => updateDashboardCards(tableSelector), 250);
}
// function UpdateGrandTotal() {
//     // ดึงตัวเลขจากหน้าจอ (หรือถ้ามีตัวแปร Global ก็ใช้ตัวแปรนั้น)
//     const reqCount = parseInt($('#total-jobs-count').text().replace(/,/g, '')) || 0;
//     const compCount = parseInt($('#total-completed-count').text().replace(/,/g, '')) || 0;
    
//     const grandTotal = reqCount + compCount;
    
//     // แสดงผลรวมที่จุดที่คุณต้องการ
//     $('#grand-total-count').text(grandTotal.toLocaleString());
// }
// function ShowCompletedStats(table) {
//     const count = table.rows({ search: 'applied' }).count();
//     $('#total-completed-count').text(count.toLocaleString());
    
//     // สำคัญ: เรียกฟังก์ชันรวมยอดทุกครั้งที่ตารางนี้อัปเดต
//     UpdateGrandTotal();
// }

function ShowTotalJobs(tableInstance) {
    // ✨ แก้จุดที่ 1: นับจำนวนเฉพาะงานที่ผ่านการฟิลเตอร์แล้วเท่านั้น ({ search: 'applied' })
    const totalCount = tableInstance.rows({ search: 'applied' }).count();
    $('#total-jobs-count').text(totalCount.toLocaleString());

    // --- ส่วนที่เพิ่มเข้ามาใหม่ต่อท้ายฟังก์ชัน ShowTotalJobs เดิมของคุณ ---

   
       // 1. ดึงจำนวนจากตารางที่สอง (Completed) มาด้วย
    const completedTable = $('#tableCompletedOrder').DataTable(); // เปลี่ยน ID ให้ตรงกับตารางของคุณ
    const completedCount = completedTable.rows({ search: 'applied' }).count();


    let totalCIPCount = 0;
    let total022Count = 0;
    let totalValueAllSum = 0; 
    let totalValueCIPSum = 0; 
    let totalGreenCount = 0;
    let totalValueGreenSum = 0; 
    let totalBlueCount = 0;
    let totalValueBlueSum = 0; 
    let total022green_count = 0; 
    let totalCgreen_count = 0; 
    let totalIgreen_count = 0; 
    let totaPgreen_count = 0; 
    let total022Blue_count = 0; 
    let totalCBlue_count = 0; 
    let totalIBlue_count = 0; 
    let totaPBlue_count = 0; 

    // ✨ แก้จุดที่ 2: เปลี่ยนมาลูปเฉพาะแถวที่โชว์อยู่หลังฟิลเตอร์สำเร็จด้วย { search: 'applied' }
    tableInstance.rows({ search: 'applied' }).nodes().each(function(rowNode) {
        const $tds = $(rowNode).find('td');
        
        const cellProject = $tds.eq(10).text().trim(); // การกำหนดโครงการ
        const rawValue = $tds.eq(6).text().trim();     // มูลค่างาน (Index 6)
        const statusHTML = $tds.eq(1).html() || "";    // สัญญาณไฟ (Index 1)
        
        // แปลงค่าเงินเป็นตัวเลข
        const numericValue = parseFloat(rawValue.replace(/,/g, '')) || 0;
        totalValueAllSum += numericValue;
         
        // เช็คสัญญาณไฟสีเขียว
        const isGreen = statusHTML.includes('status-green');
        const projectUpper = cellProject.toUpperCase();
        if (isGreen) {
            totalGreenCount++;
            totalValueGreenSum += numericValue; 
            
            if (projectUpper.includes('C-')) {
               totalCgreen_count++;
            }
            if (projectUpper.includes('I-') || projectUpper.includes('งานปรับปรุงมิเตอร์') || projectUpper.includes('งานภัยธรรมชาติ')) {
                totalIgreen_count++;
            }
            if (projectUpper.includes('P-')) {
                totaPgreen_count++;
            }
            if (projectUpper.includes('งาน 02.2')) {
                total022green_count++;
            }
        }
      
        // เช็คสัญญาณไฟสีน้ำเงิน
        const isBlue = statusHTML.includes('status-blue');
        if (isBlue) {
            totalBlueCount++;
            totalValueBlueSum += numericValue; 
            if (projectUpper.includes('C-')) {
               totalCBlue_count++;
            }
            if (projectUpper.includes('I-') || projectUpper.includes('งานปรับปรุงมิเตอร์') || projectUpper.includes('งานภัยธรรมชาติ')) {
                totalIBlue_count++;
            }
            if (projectUpper.includes('P-')) {
                totaPBlue_count++;
            }
            if (projectUpper.includes('งาน 02.2')) {
                total022Blue_count++;
            }
        }

        // แยกนับจำนวนและมูลค่าตามเงื่อนไขการกำหนดโครงการ
        if (!cellProject.includes('งาน 02.2')) {
            totalCIPCount++;
            totalValueCIPSum += numericValue;
        } else {
            total022Count++;
        }
    });
   // --- ⚡ ส่วนที่เพิ่ม: ลูปตารางที่สอง (Completed) เพื่อรวมเงิน ---
    completedTable.rows({ search: 'applied' }).nodes().each(function(rowNode) {
        const $tds = $(rowNode).find('td');
        const rawValue = $tds.eq(6).text().trim(); // ดึงคอลัมน์ Index 6 เหมือนกัน
        totalValueAllSum += parseFloat(rawValue.replace(/,/g, '')) || 0;
        
    });
    const valueInMillions = totalValueAllSum / 1000000;
    
    // ฟอร์แมตทศนิยม 0 ตำแหน่ง
    const formattedAll = valueInMillions.toLocaleString(undefined, {
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0
    });  
  
    // อัปเดตตัวเลขลง HTML
    $('#total-CIP-count').text(totalCIPCount.toLocaleString());
    $('#total-022-count').text(total022Count.toLocaleString());
    $('#total-green-count').text(totalGreenCount.toLocaleString());
    $('#total-blue-count').text(totalBlueCount.toLocaleString());
    
    $('#total-022Green-count').text(total022green_count.toLocaleString());
    $('#total-Cgreen-count').text(totalCgreen_count.toLocaleString());
    $('#total-Igreen-count').text(totalIgreen_count.toLocaleString());
    $('#total-Pgreen-count').text(totaPgreen_count.toLocaleString());

    $('#total-022Blue-count').text(total022Blue_count.toLocaleString());
    $('#total-CBlue-count').text(totalCBlue_count.toLocaleString());
    $('#total-IBlue-count').text(totalIBlue_count.toLocaleString());
    $('#total-PBlue-count').text(totaPBlue_count.toLocaleString());

    // อัปเดตมูลค่ารวมทั้งหมด (ล้านบาท)
    $('#total-valueAll-count').text(formattedAll);

    // อัปเดตมูลค่ารวม CIP
    $('#total-valueCIP-count').text(totalValueCIPSum.toLocaleString(undefined, {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    }));

    // อัปเดตมูลค่ารวมงานสีเขียว
    $('#total-valueGreen-count').text(totalValueGreenSum.toLocaleString(undefined, {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    }));

    // อัปเดตมูลค่ารวมงานสีน้ำเงิน
    $('#total-valueBlue-count').text(totalValueBlueSum.toLocaleString(undefined, {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    }));

  

    // 2. อัปเดตช่องจำนวนของตารางที่ 2 ที่หน้าจอ (ถ้ามี)
    $('#total-completed-count').text(completedCount.toLocaleString());

    // 3. รวมยอด (จำนวนงานค้าง + จำนวนงานเสร็จ)
    const grandTotal = totalCount + completedCount;
    // 4. แสดงผลรวมในจุดที่คุณต้องการ (สร้าง Span หรือ Div มารับค่านี้)
    $('#grand-total-count').text(grandTotal.toLocaleString());
}
// ============== คำนวณความพร้อมพัสดุและงาน ==============//

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
// function getWBSProgressMap(allocatedData) {
//     const stats = {};
//     allocatedData.forEach(res => {
//         if (!stats[res.wbs]) stats[res.wbs] = { total: 0, count: 0 };
        
//         // ดึงค่า res.calcPercent ที่คำนวณไว้ในข้อ 1 มาใช้
//         stats[res.wbs].total += res.calcPercent; 
//         stats[res.wbs].count += 1;
//     });
    
//     const map = {};
//     for (let wbs in stats) {
//         map[wbs] = stats[wbs].total / stats[wbs].count;
//     }
//     return map;
// }

// function getWBSProgressMap(allocatedData) {
//     const stats = {};
    
//     // รวมข้อมูลตาม WBS
//     allocatedData.forEach(res => {
//         if (!stats[res.wbs]) stats[res.wbs] = { totalMatches: 0, totalItems: 0 };
        
//         stats[res.wbs].totalItems += 1;
        
//         // เงื่อนไข: รายการที่แมทช์แล้ว (assigned > 0) OR รายการที่เบิกครบ (pending == 0)
//         // หมายเหตุ: ปรับ logic ตรงนี้ตามฟิลด์ที่คุณเก็บข้อมูล
//         const isMatched = (parseFloat(res.assigned) || 0) > 0;
//         const isFulfilled = (parseFloat(res.pending) || 0) === 0;
        
//         if (isMatched || isFulfilled) {
//             stats[res.wbs].totalMatches += 1;
//         }
//     });
    
//     const map = {};
//     for (let wbs in stats) {
//         // คำนวณ % ความพร้อม
//         map[wbs] = (stats[wbs].totalMatches / stats[wbs].totalItems) * 100;
//     }
//     return map;
// }



function getWBSProgressMap(allocatedData) {
    const stats = {};
    
    allocatedData.forEach(res => {
        if (!stats[res.wbs]) {
            stats[res.wbs] = { completedItems: 0, totalItems: 0 };
        }
        
        // 1. นับจำนวนรายการทั้งหมดของ WBS นั้น
        stats[res.wbs].totalItems += 1;
        
        // 2. เช็คเงื่อนไขความพร้อม (Item-based)
        // รายการที่ถือว่า "พร้อม" คือ: เบิกครบ (pending == 0) OR แมทช์แล้ว (assigned > 0)
        const isMatched = (parseFloat(res.assigned) || 0) > 0;
        const isFulfilled = (parseFloat(res.pending) || 0) === 0;
        
        if (isMatched || isFulfilled) {
            stats[res.wbs].completedItems += 1;
        }
    });
    
    // 3. คำนวณ % ความพร้อมราย WBS
    const map = {};
    for (let wbs in stats) {
        const s = stats[wbs];
        map[wbs] = (s.totalItems > 0) ? (s.completedItems / s.totalItems) * 100 : 0;
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
            { label: "สต็อก<br>ทั้งหมด" },
            { label: "ที่ได้/ค้างเบิก" },
            { label: "ค้างเบิก" },
            { label: "จำนวนที่ได้" },
            { label: "สต็อก<br>คงเหลือ" },
            
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
          const materialInfo = materialTypeMap[partID] || { type: "-", cost: 0 };
        const matType = materialInfo.type;

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
    "pageLength":20,
    "autoWidth": true, // ให้ปิดอันนี้เพื่อให้ตารางกางเต็ม 100%
    "responsive": true, // ปิด responsive ของ DT ไปเลย
    "scrollX": false,
    
    "order": [[0, "asc"]],
    "buttons": [
        {
            extend: 'excel',
            text: '<i class="fas fa-file-excel mr-1"></i> Export',
            filename: 'R2C_InStock_Report',
            className: 'border px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 text-center text-slate-500  bg-white rounded-lg cursor-pointer  hover:scale-102 active:opacity-85',
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
                else if (data === 'ผลิตภัณฑ์คอนกรีต') { bgColor = "#f3d5ff"; textColor = "#a821a1"; }

                return `<span class="inline-flex items-center" style="font-size: 13px !important; padding: 4px 16px !important; border-radius: 20px !important; background-color: ${bgColor} !important; color: ${textColor} !important; display: inline-flex !important; justify-content: center; align-items: center; ">
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
        const incompleteWBS = new Set();
        data.rows.forEach(r => { if(parseFloat(getCellValue(r.c[14])) > 0) incompleteWBS.add(getCellValue(r.c[0]).toString().trim()); });
        
        const filteredRows = data.rows.filter(row => incompleteWBS.has(getCellValue(row.c[0]).toString().trim()));
        const filteredData = { ...data, rows: filteredRows };

        let html = this._buildTableHTML(filteredData, vvipData, peaNameMapping, finalScores, wbsStatusMap, budgetMapping, wbsProgressMap);
    $el.html(html);

   // 🎯 1. ประกาศตัวแปรรับค่าตาราง (เปลี่ยนจาก return เป็น const ตัวแปรไว้ก่อนเพื่อเอาไปสั่งย้ายปุ่ม)
const RequirementTable = $el.DataTable({
    "deferRender": true,
    "pageLength": 10,
    "responsive": true,
    "scrollX": true,
    "scrollX": true,
    "order": [[0, "asc"]],
    "buttons": [
        {
            extend: 'excel',
            text: '<i class="fas fa-file-excel mr-1"></i> Export',
            filename: 'R2C_Report',
            className: 'border px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 text-center text-slate-500  bg-white rounded-lg cursor-pointer  hover:scale-102 active:opacity-85'
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
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">ค้างเบิก(รายการ)</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">คะแนนสะสม</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center d-none">การกำหนดโครงการ</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center ">% ความพร้อม</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center d-none">งบ</th>`;
        html += '</tr></thead><tbody>';

        const uniqueMap = new Map();
        const countMap = new Map();
        const incompleteWBS = new Set();
        data.rows.forEach(row => {
            if (!row || !row.c) return;
            let valA = getCellValue(row.c[0]).toString().trim();
            let pending = parseFloat(getCellValue(row.c[14])) || 0;
           if (valA !== "") {
                // 🎯 นับจำนวนเฉพาะที่ pending > 0 เพื่อเอาไว้แสดงในช่อง "ค้างเบิก"
                if (pending > 0) {
                  
                    countMap.set(valA, (countMap.get(valA) || 0) + 1);
                }
             
                // 🎯 เก็บรายการเข้า uniqueMap เพื่อแสดงในตาราง (เอาทุกรายการ ไม่ต้องสน pending > 0)
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
        // sortedWBSList.sort((a, b) => {
        //     if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        //     if (a.rowCount !== b.rowCount) return a.rowCount - b.rowCount;
        //     return b.budget - a.budget;
        // });

        const rankMap = window.GLOBAL_RANK_MAP || {};

        sortedWBSList.sort((a, b) => {
            // ดึงอันดับที่ RankingService คำนวณไว้แล้วมาเรียง
            let rankA = rankMap[a.valA] || 9999;
            let rankB = rankMap[b.valA] || 9999;
            return rankA - rankB;
        });
        // 🎯 ส่วนที่เพิ่ม 1: ตัวแปรเก็บสถิติส่งหากราฟ
        const activeRowsDataForChart = [];

        // ================================================================================================
        // 🎯 เปลี่ยนมาวิ่งลูปผ่านข้อมูลที่ผ่านการจัดอันดับถูกต้องแล้ว (โค้ดดึงค่าและโครงสร้างตารางด้านในคงเดิม)
        // ================================================================================================
        // 1. สร้างสมุดจด (Object) ไว้ข้างนอกลูป
        // const rankMap = {}; 
        // const rankMap = window.GLOBAL_RANK_MAP || {};
        sortedWBSList.forEach((item, index) => {
            // const rank = index + 1; // 🔢 คำนวณอันดับที่ถูกต้อง (เริ่มจาก 1)
            // // 2. บันทึกอันดับลงสมุด โดยใช้ WBS (item.valA) เป็นกุญแจ (Key)
            // rankMap[item.valA] = rank;
            // if (!incompleteWBS.has(item.valA)) return;
            // if (mode === 'incomplete' && !incompleteWBS.has(item.valA)) return;
            // if (mode === 'completed' && incompleteWBS.has(item.valA)) return;

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
             const wbsKey = item.valA ? item.valA.toString().trim() : "";
             const rank = rankMap[wbsKey] || "-"; // จะได้อันดับทันทีโดยไม่ต้องรอ localStorage
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
            let displayProgress = progress;
            // ถ้าสถานะเป็นเขียว (Green) ให้แสดง 100% เพราะถือว่าพัสดุที่ต้องจัดสรรได้รับครบแล้ว
            if (status === 'green') {
                displayProgress = 100;
            }
           const barColor = displayProgress >= 80 
            ? 'bg-gradient-to-tl from-green-600 to-lime-400' 
            : (displayProgress >= 50 
                ? 'bg-gradient-to-tl from-blue-600 to-cyan-400' 
                : 'bg-gradient-to-tl from-red-600 to-rose-400');

            const progressHTML = `
                <div class="flex items-center justify-center">
                    <span class="mr-2 text-xs font-semibold leading-tight">${displayProgress.toFixed(0)}%</span>
                    <div>
                        <div class="text-xs h-0.75 w-30 m-0 flex overflow-visible rounded-lg bg-gray-200">
                            <div 
                                class="duration-600 ease-soft ${barColor} -mt-0.38 -ml-px flex h-1.5 flex-col justify-center overflow-hidden whitespace-nowrap rounded text-center text-white transition-all" 
                                style="width: ${displayProgress}%"
                                role="progressbar" 
                                aria-valuenow="${displayProgress.toFixed(0)}" 
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
        //ให้บันทึก Rank ลง localStorage เพื่อให้หน้า Warehouse มาอ่าน
        localStorage.setItem('wbsRankMap', JSON.stringify(rankMap));
        html += '</tbody>';
        // 🎯 ส่วนที่เพิ่ม 3: ส่งข้อมูลสรุปให้กราฟวงกลมทำงานทันทีหลังสร้างตารางเสร็จ
        updateGraph.updatePieChart(activeRowsDataForChart);
        return html;
    },

    //=========== ตาราง NoStock พัสดุที่ไม่ได้รับการจัดสรร ===========//
/**
 * แสดงตารางพัสดุที่ไม่ได้รับการจัดสรร (assigned = 0)
 * @param {Array} allocatedData - ข้อมูลการจัดสรร
 * @param {Object} materialTypeMap - ประเภทพัสดุ
 */
 // ให้เอาฟังก์ชันนี้ไปวางไว้ใน Object TableRenderer ของคุณครับ
// renderCompletedOrderTable: function(selector, data, vvipData, peaNameMapping, finalScores, wbsStatusMap, budgetMapping, wbsProgressMap) {
//     const $el = $(selector);
    
//     // 1. สร้าง Set ของงานที่ยังไม่เสร็จ (ค้างเบิก > 0)
//     const incompleteWBS = new Set();
//     data.rows.forEach(row => {
//         let pending = parseFloat(getCellValue(row.c[14])) || 0;
//         if (pending > 0) {
//             let valA = getCellValue(row.c[0]).toString().trim();
//             incompleteWBS.add(valA);
//         }
//     });

//     // 2. กรองข้อมูล: เก็บเฉพาะงานที่ "ไม่อยู่ใน" Set งานที่ค้างเบิก
//     // สำคัญ: วิธีนี้จะได้เฉพาะงานที่ทุกรายการ pending = 0
//     const completedRows = data.rows.filter(row => {
//         let valA = getCellValue(row.c[0]).toString().trim();
//         return !incompleteWBS.has(valA) && valA !== ""; 
//     });

//     // 3. ตรวจสอบว่ามีข้อมูลเหลือไหม?
//     if (completedRows.length === 0) {
//         console.warn("⚠️ CompletedOrderTable: ไม่พบงานที่เสร็จสมบูรณ์");
//     }
//     const completedData = {
//         ...data,
//         rows: completedRows
//     };

//     // 3. ทำลายตารางเก่า
//     if ($.fn.DataTable.isDataTable(selector)) {
//         $el.DataTable().destroy();
//         $el.empty();
//     }

//     // 4. วาดตารางด้วยข้อมูลที่กรองมาแล้ว
//     let html = this._buildTableHTML(completedData, vvipData, peaNameMapping, finalScores, wbsStatusMap, budgetMapping, wbsProgressMap);
//     $el.html(html);
// renderCompletedOrderTable: function(selector, data, vvipData, peaNameMapping, finalScores, wbsStatusMap, budgetMapping, wbsProgressMap) {
//     const $el = $(selector);

//     // 1. หา WBS ที่ยังมีรายการค้าง (Pending > 0)
//     const incompleteWBS = new Set();
//     data.rows.forEach(row => {
//         let valA = getCellValue(row.c[0]).toString().trim();
//         let pending = parseFloat(getCellValue(row.c[14])) || 0;
//         if (pending > 0) incompleteWBS.add(valA);
//     });

//     // 2. กรอง: เอาเฉพาะแถวที่ WBS นั้น "ไม่อยู่ในกลุ่มค้างเบิก"
//     const completedRows = data.rows.filter(row => {
//         let valA = getCellValue(row.c[0]).toString().trim();
//         return valA !== "" && !incompleteWBS.has(valA);
//     });

//     // 3. เตรียมข้อมูล (ระวัง: ถ้า completedRows ว่างเปล่า ให้ส่ง Array ว่าง)
//     const completedData = { ...data, rows: completedRows };

//     // 4. วาดตาราง (ใช้ _buildTableHTML ชุดเดิม)
//     if ($.fn.DataTable.isDataTable(selector)) {
//         $el.DataTable().destroy();
//         $el.empty();
//     }

//     let html = this._buildTableHTML(completedData, vvipData, peaNameMapping, finalScores, wbsStatusMap, budgetMapping, wbsProgressMap);
//     $el.html(html);

renderCompletedOrderTable(selector, data, vvipData, peaNameMapping, finalScores, wbsStatusMap, budgetMapping, wbsProgressMap) {
    const $el = $(selector);
    
    // หา WBS ที่ยังไม่เสร็จ (ที่มี pending > 0)
    const incompleteWBS = new Set();
    data.rows.forEach(r => { if(parseFloat(getCellValue(r.c[14])) > 0) incompleteWBS.add(getCellValue(r.c[0]).toString().trim()); });

    // กรองเอาเฉพาะ WBS ที่ "ไม่อยู่" ในกลุ่มงานค้าง (คือเสร็จแล้ว)
    const completedRows = data.rows.filter(r => !incompleteWBS.has(getCellValue(r.c[0]).toString().trim()));
    const completedData = { ...data, rows: completedRows };

    let html = this._buildTableHTML(completedData, vvipData, peaNameMapping, finalScores, wbsStatusMap, budgetMapping, wbsProgressMap);
    $el.html(html);
    // 5. สร้าง DataTable
    return $el.DataTable({
        "deferRender": true,
        "pageLength": 10,
        "responsive": true,
        "scrollX": true,
        "order": [[0, "asc"]],
        "dom": '<"d-flex justify-content-end align-items-center gap-2 mb-3"fl>rt<"row mt-3"<"col-md-6"i><"col-md-6"p>>',
        "initComplete": function() {
            this.api().columns.adjust();
            const $wrapper = $el.parent().css({ 'overflow-x': 'auto' });
            $('<style>').text(`#${$wrapper.attr('id')}::-webkit-scrollbar { display: none !important; }`).appendTo('head');
        }
    });
},
    renderNoStockTable(allocatedData, materialTypeMap) {
    if (!allocatedData || !Array.isArray(allocatedData)) return null;
    
    const EXCLUDED_TYPES = ["พัสดุล้าสมัย", "เปลี่ยนรหัสพัสดุ", "พัสดุไม่เบิกจากคลัง"];

    // 1. ปรับ Filter: ใช้ materialInfo ในการเช็คเงื่อนไข
    const noStockData = allocatedData.filter(res => {
        const assigned = res.assigned || 0;
        const pending = res.pending || 0;
        
        const partID = res.partID?.toString().trim();
        const materialInfo = materialTypeMap[partID] || { type: "-", cost: 0 };
        
        // กรองเอาเฉพาะที่ของยังไม่ครบ และไม่ถูกยกเว้น
        return (assigned < pending) && !EXCLUDED_TYPES.includes(materialInfo.type);
    });

    if (noStockData.length === 0) return null;

    const $el = $('#tableNoStock');
    if ($.fn.DataTable.isDataTable('#tableNoStock')) {
        $el.DataTable().destroy();
        $el.empty();
    }

    const colHeaders = [
        { title: "หมายเลขงาน" },
        { title: "รหัสพัสดุ" },
        { title: "ชื่อพัสดุ" },
        { title: "ประเภท" },
        { title: "ที่ได้ / ค้างเบิก" },
        { title: "ค้างเบิก" },
        { title: "จำนวนที่ได้" }
    ];

    const dataSet = noStockData.map(res => {
        const partID = res.partID?.toString().trim();
        // ดึงข้อมูลตามโครงสร้างเดิมที่ต้องการ
        const materialInfo = materialTypeMap[partID] || { type: "-", cost: 0 };
        
        const assigned = res.assigned || 0;
        const pending = res.pending || 0;
        const remaining = pending - assigned;
        
        return [
            res.wbs        || "-",
            res.partID     || "-",
            res.partName   || "-",
            materialInfo.type, // แก้ไขให้ดึงจาก .type เหมือนโค้ดส่วนแรก
            { assigned: 0, pending: remaining },
            remaining, 
            0 
        ];
    });

    // ต่อด้วยส่วนการ initialize DataTable ต่อได้เลยครับ

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
            className: 'border px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 text-center text-slate-500  bg-white rounded-lg cursor-pointer  hover:scale-102 active:opacity-85',
            
            exportOptions: {
                    columns: [0, 1, 2, 3, 5, 6]
                }
        }
    ],
    
    "dom": '<"flex justify-between items-center mb-4"<"flex items-center gap-2"fB><"flex items-center"l>>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
          
    "columnDefs": [
        // col 0, 1: หมายเลขงาน, รหัสพัสดุ - บังคับแถวเดียว ไม่ตัดบรรทัด
        {
            "targets": [0, 1],
            "className": "py-3 px-3 border-b border-gray-100 text-slate-600 font-normal",
            "createdCell": function (td) {
                $(td).css({ 'white-space': 'nowrap', 'word-break': 'keep-all' });
            }
        },
        { "targets": 0, "className": "font-bold text-blue-700" },
 
        // col 2: ชื่อพัสดุ
        { "targets": 2, "className": "py-3 px-3 border-b border-gray-100 text-slate-600 font-normal" },
 
        // col 3: ประเภท (เพิ่มใหม่) - badge สีเทาเหมือนตาราง StockMatch
        // {
        //     "targets": 3,
        //     "className": "py-3 px-3 border-b border-gray-100 font-normal text-center whitespace-nowrap",
        //     "render": function(data) {
        //         if (!data || data === "-") return '<span class="text-gray-400">-</span>';
        //         const color = data === "พัสดุหลัก" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600";
        //         return `<span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${color}">${data}</span>`;
        //     }
        // },
        { 
            "targets": 3, 
            "render": function(data, type, row) {
                let bgColor = "#e5e7eb";
                let textColor = "#374151";
                if (data === 'พัสดุหลัก') { bgColor = "#e9d5ff"; textColor = "#6b21a8"; } 
                else if (data === 'พัสดุรอง') { bgColor = "#d5d8ff"; textColor = "#214ca8"; } 
                else if (data === 'ผลิตภัณฑ์คอนกรีต') { bgColor = "#f3d5ff"; textColor = "#a821a1"; }

                return `<span class="inline-flex items-center" style="font-size: 13px !important; padding: 4px 16px !important; border-radius: 50px !important; background-color: ${bgColor} !important; color: ${textColor} !important; display: inline-flex !important; justify-content: center; align-items: center; white-space: nowrap;">
                        ${data || '-'}
                        </span>`;
            },
            "className": "py-3 px-3 border-r border-l border-gray-200 text-center" 
        },
        // col 4: ค้างเบิก
        {
                "targets": 4,
                "className": "py-3 px-3 border-b border-gray-100 text-center whitespace-nowrap text-base",
                "render": function(data, type, row) {
                    // ป้องกันความผิดพลาดของข้อมูล
                    if (!data || typeof data !== 'object') return '0 / 0';
                    
                    const assignedFormated = data.assigned.toLocaleString();
                    const pendingFormated = data.pending.toLocaleString();
                    
                    // แสดงผลในสไตล์: จำนวนที่ได้ (สีเขียวหรือสีปกติ) / ค้างเบิก (สีแดงโดดเด่น)
                    return ` <span class="font-bold text-red-600" style=" font-weight: bold; margin-right: 5px; font-size: 16px;">✗</span>
                    <span class="font-bold text-red-600 ">${assignedFormated}</span> 
                            <span class="text-slate-700">/</span> 
                            <span class="font-bold text-slate-700">${pendingFormated}</span>`;


                        //     `<div class="text-center whitespace-nowrap">
                        // <span lass="font-bold" style="color: rgb(199, 68, 68); font-weight: bold; margin-right: 5px; font-size: 16px;">✗</span>
                        //     <span class="text-red-600 font-bold">${assignedFormated}</span>
                        //     <span class="text-slate-700">/</span>
                        //     <span class="text-slate-700 font-bold">${pendingFormated}</span>
                        // </div>`;
                }
            },
            { "targets": [5, 6], "visible": false },
        
    ],
   "headerCallback": function (thead) {
    $(thead).find('th')
        .removeClass() // ล้างคลาสสีเดิมออก
        .addClass('font-bold py-3 px-4 text-left') // ใส่คลาสที่จำเป็น
        .css({
            'background-color': 'transparent', // ทำให้หัวตารางโปร่งใส
            'border-bottom': '2px solid #e9d5ff', // ใช้สีเส้นคั่นที่คุณชอบ
            'white-space': 'nowrap'
        });
},
    
    // 🎯 3. สั่งครอบตัวอุ้มตาราง คัดสไตล์สกรอลบาร์ออก (ในคอมไม่มีแถบวิ่ง แต่ในมือถือปัดขวาได้สวยๆ)
    "initComplete": function() {
        this.api().columns.adjust();
        updateDashboardCounts();
        // เจาะจงที่ parent wrapper ของตารางนี้โดยตรง
        const $wrapper = $('#tableNoStock').parent().css({ 'overflow-x': 'auto' });
        
        $('<style>').text(`
            #${$wrapper.attr('id')}::-webkit-scrollbar { display: none !important; }
            #${$wrapper.attr('id')} { scrollbar-width: none !important; }
        `).appendTo('head');
    }
});
 
 
 
// 🎯 4. [บรรทัดเด็ด] สั่งย้ายปุ่มวาร์ปไปที่กล่อง ID ขวาสุดบนแถวหัวข้อสีเขียวทันที
NoStockTable.buttons().container().appendTo('#export-NoStock');
 noStockTableInstance = NoStockTable;
// 🎯 5. รีเทิร์นตัวแปรตารางออกไปใช้งานต่อตามปกติ
return NoStockTable;
}, // 👈 เช็กดูว่ามีปีกกาปิดตัวนี้ครบถ้วนไหม

    //=========== ตาราง Obsolete พัสดุล้าสมัย/เปลี่ยนแปลงรหัส ===========//
renderObsoleteTable(allocatedData, materialTypeMap, materialNoteMap) {
    if (!allocatedData || !Array.isArray(allocatedData)) return null;

    const OBSOLETE_TYPES = ["พัสดุล้าสมัย", "เปลี่ยนรหัสพัสดุ","พัสดุไม่เบิกจากคลัง"];
    
    // กรองเฉพาะ assigned === 0 และประเภทที่ต้องการ
    const obsoleteData = allocatedData.filter(res => {
        // if (res.assigned !== 0) return false;
        if (res.assigned !== 0 || res.pending <= 0) return false;
        const partID = res.partID?.toString().trim();
        const materialInfo = materialTypeMap[partID] || { type: "-", cost: 0 };
        
        return OBSOLETE_TYPES.includes(materialInfo.type);
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
       const materialInfo = materialTypeMap[partID] || { type: "-", cost: 0 };
        const partNote = materialNoteMap[partID] || "-";
        return [
            res.wbs      || "-",  
            res.partID   || "-",  
            res.partName || "-",  
            materialInfo.type,             
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
            className: 'border px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 text-center text-slate-500  bg-white rounded-lg cursor-pointer  hover:scale-102 active:opacity-85',
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
                    return `<span >${data}</span>`;
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
}, // <--- จบฟังก์ชันพอดีเป๊ะ โครงสร้างไม่พังแน่นอนครับ,

/**
 * renderFulfilledTable
 * ดึงข้อมูลจาก rawDatabase โดยตรงเพื่อแสดงรายการที่ pending เป็น 0 (ไม่มีความต้องการ)
 */
renderFulfilledTable(rawDatabase, materialTypeMap) {
    if (!rawDatabase || !rawDatabase.rows) return null;
    const allRows = rawDatabase.rows || [];
    // 1. กรองเอาเฉพาะรายการที่ค้างเบิก (column 14) เป็น 0
    const fulfilledData = allRows.filter(row => {
        const pending = parseFloat(getCellValue(row.c[14])) || 0;
        return pending === 0;
    });

    if (fulfilledData.length === 0) return null;

    const $el = $('#tableFulfilled');
    if ($.fn.DataTable.isDataTable('#tableFulfilled')) {
        $el.DataTable().destroy();
        $el.empty();
    }

    const colHeaders = [
        { title: "หมายเลขงาน" },
        { title: "รหัสพัสดุ" },
        { title: "ชื่อพัสดุ" },
        { title: "ประเภท" },
        { title: "สถานะการเบิก" }
    ];

    const dataSet = fulfilledData.map(row => {
        const partID = getCellValue(row.c[3])?.toString().trim();
        const materialInfo = materialTypeMap[partID] || { type: "-", cost: 0 };
        
        return [
            getCellValue(row.c[0]) || "-", // WBS
            partID || "-",                 // PartID
            getCellValue(row.c[4]) || "-", // PartName
            materialInfo.type,             // Type
            { assigned: 0, pending: 0 }    // สื่อว่าครบแล้ว (Pending 0)
        ];
    });

    const FulfilledTable = $el.DataTable({
        "data": dataSet,
        "columns": colHeaders,
        "deferRender": true,
        "pageLength": 20,
        "responsive": true,
        // "scrollX": true,
        "order": [[0, "asc"]],
        "buttons": [
            {
                extend: 'excel',
                text: '<i class="fas fa-file-excel mr-1"></i> Export',
                filename: 'R2C_Fulfilled_report',
                className: 'border px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 text-center text-slate-500 bg-white rounded-lg cursor-pointer hover:scale-102 active:opacity-85'
                
            }
        ],
        "dom": '<"flex justify-between items-center mb-4"<"flex items-center gap-2"fB><"flex items-center"l>>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
        "columnDefs": [
            { "targets": [0, 1], "className": "py-3 px-3 border-b border-gray-100  text-blue-700 whitespace-nowrap" },
            
            { "targets": 2, "className": "py-3 px-3 border-b border-gray-100 text-slate-600 " },
             { 
            "targets": 3, 
            "render": function(data, type, row) {
                let bgColor = "#e5e7eb";
                let textColor = "#374151";
                if (data === 'พัสดุหลัก') { bgColor = "#e9d5ff"; textColor = "#6b21a8"; } 
                else if (data === 'พัสดุรอง') { bgColor = "#d5d8ff"; textColor = "#214ca8"; } 
                else if (data === 'ผลิตภัณฑ์คอนกรีต') { bgColor = "#f3d5ff"; textColor = "#a821a1"; }

                return `<span class="inline-flex items-center" style="font-size: 13px !important; padding: 4px 16px !important; border-radius: 20px !important; background-color: ${bgColor} !important; color: ${textColor} !important; display: inline-flex !important; justify-content: center; align-items: center; ">
                        ${data || '-'}
                        </span>`;
            },
            "className": "py-3 px-3 border-r border-l border-gray-200 text-center" 
        },
            {
                "targets": 4,
                "className": "text-center whitespace-nowrap",
                "render": function() {
                    return `<span class="text-green-600 font-bold"><i class="fas fa-check-circle mr-1"></i> ไม่มีความต้องการ</span>`;
                }
            }
        ],
        "initComplete": function() {
            const $wrapper = $('#tableFulfilled').parent().css({ 'overflow-x': 'auto' });
            $('<style>').text(`
                #${$wrapper.attr('id')}::-webkit-scrollbar { display: none !important; }
                #${$wrapper.attr('id')} { scrollbar-width: none !important; }
            `).appendTo('head');
        }
    });

    FulfilledTable.buttons().container().appendTo('#export-Fulfilled');
    return FulfilledTable;
}

};


// =================================================================
// 🌟 ฟังก์ชันสำหรับนับจำนวนแถวในตาราง NoStock, Obsolete, Fulfilled และ Stock (Match) แสดง
// =================================================================
// function getTableCounts(allocatedData, rawDatabase, stockData, materialTypeMap) {
//     // 1. นับ NoStock
//     const EXCLUDED_TYPES = ["พัสดุล้าสมัย", "เปลี่ยนรหัสพัสดุ", "พัสดุไม่เบิกจากคลัง"];
//     const noStockCount = (allocatedData || []).filter(res => {
//         const partID = res.partID?.toString().trim();
//         const materialInfo = materialTypeMap[partID] || { type: "-" };
//         return (res.assigned || 0) < (res.pending || 0) && !EXCLUDED_TYPES.includes(materialInfo.type);
//     }).length;

//     // 2. นับ Obsolete
//     const OBSOLETE_TYPES = ["พัสดุล้าสมัย", "เปลี่ยนรหัสพัสดุ", "พัสดุไม่เบิกจากคลัง"];
//     const obsoleteCount = (allocatedData || []).filter(res => {
//         if (res.assigned !== 0 || res.pending <= 0) return false;
//         const partID = res.partID?.toString().trim();
//         const materialInfo = materialTypeMap[partID] || { type: "-" };
//         return OBSOLETE_TYPES.includes(materialInfo.type);
//     }).length;

//     // 3. นับ Fulfilled (จาก rawDatabase)
//     let fulfilledCount = 0;
//     if (rawDatabase && rawDatabase.rows) {
//         fulfilledCount = rawDatabase.rows.filter(row => {
//             const pending = parseFloat(getCellValue(row.c[14])) || 0;
//             return pending === 0;
//         }).length;
//     }

//  // 4. นับ Match Stock (ต้องนับจาก allocatedData ตัวเดียวกันกับที่ส่งไป renderInitialStockMatch)
//     // ตรงนี้คือจุดที่ทำให้ค่าไม่ขึ้น เพราะคุณไปนับจากที่อื่น
//     const matchStockCount = (allocatedData || []).filter(res => {
//         const assignedValue = parseFloat(res.assigned) || 0;
//         return assignedValue > 0;
//     }).length;

//     return {
//         noStock: noStockCount,
//         obsolete: obsoleteCount,
//         fulfilled: fulfilledCount,
//         matchStock: matchStockCount,
//         totalStockcount: noStockCount + obsoleteCount + fulfilledCount + matchStockCount
//     };
// }

// function updateDashboardCounts(allocatedData, rawDatabase, stockData, materialTypeMap) {
//     // 1. คำนวณข้อมูลจากฟังก์ชันที่ทำไว้ก่อนหน้า
//     const counts = getTableCounts(allocatedData, rawDatabase, stockData, materialTypeMap);

//     // 2. อัปเดตค่าลงใน element ตาม ID ที่กำหนดไว้
//     document.getElementById('count-fulfilled').innerText = counts.fulfilled.toLocaleString();
//     document.getElementById('count-matchStock').innerText = counts.matchStock.toLocaleString();
//     document.getElementById('count-noStock').innerText = counts.noStock.toLocaleString();
//     document.getElementById('count-obsolete').innerText = counts.obsolete.toLocaleString();
//     document.getElementById('count-totalStockcount').innerText = counts.totalStockcount.toLocaleString();

// }

function getTableCounts() {
    // ฟังก์ชันย่อยสำหรับนับข้อมูลจาก DataTable Instance
    const getCount = (instance) => {
        if (!instance) return 0;
        // ถ้ามีการค้นหาใน column 0 (WBS) ให้เลือกนับเฉพาะข้อมูลที่กรองแล้ว
        const searchVal = instance.column(0).search();
        return searchVal ? instance.rows({ filter: 'applied' }).count() : instance.rows().count();
    };

    const noStock = getCount(noStockTableInstance);
    const obsolete = getCount(obsoleteTableInstance);
    const fulfilled = getCount(fulfilledTableInstance);
    const matchStock = getCount(stockMatchTableInstance);

    return {
        noStock,
        obsolete,
        fulfilled,
        matchStock,
        totalStockcount: noStock + obsolete + fulfilled + matchStock
    };
}

function updateDashboardCounts() {
    const counts = getTableCounts();

    document.getElementById('count-fulfilled').innerText = counts.fulfilled.toLocaleString();
    document.getElementById('count-matchStock').innerText = counts.matchStock.toLocaleString();
    document.getElementById('count-noStock').innerText = counts.noStock.toLocaleString();
    document.getElementById('count-obsolete').innerText = counts.obsolete.toLocaleString();
    document.getElementById('count-totalStockcount').innerText = counts.totalStockcount.toLocaleString();
}


// วิธีเรียกใช้: ให้เรียกฟังก์ชันนี้หลังจากข้อมูลโหลดเสร็จแล้ว
// updateDashboardCounts(allocatedData, rawDatabase, stockData, materialTypeMap);
 // =================================================================
// 🌟 ฟังก์ชันตัวกลางสำหรับแชร์การซิงค์ Cross-Filter ไปยังทุกตารางย่อย
// =================================================================
function syncAllTables(mainTable) {
    if (!mainTable) return;
    
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

     // 3. ซิงค์ตาราง Obsolete (คอลัมน์ 0)
    if (typeof fulfilledTableInstance !== 'undefined' && fulfilledTableInstance) {
        fulfilledTableInstance.column(0).search(stockRegex, true, false).draw();
    }

        
       // 3. ซิงค์ตาราง Obsolete (คอลัมน์ 0)
   
    updateDashboardCardsDebounced('#tableRequirement_Data');
    // updateDashboardCountsBasedOnFiltered(filteredRows);
}
// ==================== Filter Module ====================
const FilterModule = {
// =================================================================
// [0/5 แถม] ฟังก์ชันกรองสัญญาณไฟ (คอลัมน์ที่ 1 ในตารางหลัก)
// =================================================================
// setupFilterLight(tableInstance, rawData) {
//     const $dropdownMenu = $('#dropdownSearchLight'), $searchContainer = $dropdownMenu.find('ul'), $clearButton = $('#clearLightFilter'); 
//     $searchContainer.empty(); 

//     const statusItems = [
//         { value: 'status-green', text: '🟢 ของครบ' },
//         { value: 'status-blue', text: '🔵 พัสดุหลักครบ' },
//         { value: 'status-yellow', text: '🟡 ได้ของบางส่วน' },
//         { value: 'status-red', text: '🔴 ไม่ได้ของเลย' },
//         { value: 'status-lock', text: '🔒 ล็อค (พัสดุล้าสมัย/เปลี่ยนรหัส)' }
//     ];

//     statusItems.forEach((item, index) => {
//         $searchContainer.append(`
//             <li class="w-full flex items-center p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded light-filter-item">
//                 <label for="dropdown-light-${index}" class="w-full flex items-center justify-between cursor-pointer m-0 w-full">
//                     <div class="inline-flex items-center font-medium text-heading text-sm">${item.text}</div>
//                     <input id="dropdown-light-${index}" type="checkbox" value="${item.value}" class="light-checkbox w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong">
//                 </label>
//             </li>
//         `);
//     });

//     $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(fn => fn.name !== 'lightFilter');

//     const applyFilter = () => {
//         let selected = [];
//         $searchContainer.find('.light-checkbox:checked').each(function () { selected.push($(this).val()); });
//         const regex = selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|');
//         tableInstance.column(1).search(regex, true, false).draw();
//         syncAllTables(tableInstance); // ⚡ ซิงค์ตารางย่อยทั้งหมด
//     };

//     $searchContainer.off('change', '.light-checkbox').on('change', '.light-checkbox', applyFilter);
//     $clearButton.off('click').on('click', function() {
//         $searchContainer.find('.light-checkbox').prop('checked', false); 
//         applyFilter();
//     });
// },
setupFilterLight(tableInstance, rawData, wbsStatusMap) {
    const $dropdownMenu = $('#dropdownSearchLight');
    const $searchContainer = $dropdownMenu.find('ul');
    const $clearButton = $('#clearLightFilter');
    
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
                <label for="dropdown-light-${index}" class="w-full flex items-center justify-between cursor-pointer m-0">
                    <div class="inline-flex items-center font-medium text-heading text-sm">${item.text}</div>
                    <input id="dropdown-light-${index}" type="checkbox" value="${item.value}" class="light-checkbox w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong">
                </label>
            </li>
        `);
    });

    // ล้างตัวกรองเก่าทิ้งก่อนเพื่อป้องกันการซ้อนทับ
    $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(fn => fn.name !== 'lightFilter');

    const applyFilter = () => {
        let selected = [];
        $searchContainer.find('.light-checkbox:checked').each(function () { 
            selected.push($(this).val()); 
        });
        
        const regex = selected.length > 0 
            ? selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|') 
            : '';

        // 1. กรองตารางหลัก (parcelTable)
        tableInstance.column(1).search(regex, true, false).draw();

        // 2. กรองตาราง Completed Order (ถ้าตัวแปรนี้ถูกประกาศไว้ใน scope)
        if (typeof completedTableInstance !== 'undefined' && completedTableInstance) {
            completedTableInstance.column(1).search(regex, true, false).draw();
        }

        // ซิงค์ตารางย่อยทั้งหมด
        syncAllTables(tableInstance); 
    };

    // Event Listeners
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
    const $dropdownMenu = $('#dropdownSearchWBS'), 
          $searchContainer = $dropdownMenu.find('ul'), 
          $searchInput = $('#searchWBS'), 
          $clearButton = $('#clearWBSFilter'); 
    
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
        $searchContainer.find('.wbs-filter-item').each(function () { 
            $(this).toggle($(this).text().toLowerCase().includes(text)); 
        });
    });

    const applyFilter = () => {
        let selected = [];
        $searchContainer.find('.wbs-checkbox:checked').each(function () { 
            selected.push($(this).val()); 
        });
        
        const regex = selected.length > 0 
            ? selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|') 
            : '';

        // 1. กรองตารางหลัก
        table.column(2).search(regex, true, false).draw();

        // 2. กรองตาราง renderCompletedOrderTable (ใช้ตัวแปรเดียวกันกับตอนทำ filter light)
        if (typeof completedTableInstance !== 'undefined' && completedTableInstance) {
            completedTableInstance.column(2).search(regex, true, false).draw();
        }

        syncAllTables(table);
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
    const $dropdownMenu = $('#dropdownSearchTypeWBS'), 
          $searchContainer = $dropdownMenu.find('ul'), 
          $searchInput = $('#searchTypeWBS'), 
          $clearButton = $('#clearTypeWBSFilter'); 
    
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
        $searchContainer.find('.typewbs-filter-item').each(function () { 
            $(this).toggle($(this).text().toLowerCase().includes(text)); 
        });
    });

    const applyFilter = () => {
        let selected = [];
        $searchContainer.find('.typewbs-checkbox:checked').each(function () { 
            selected.push($(this).val()); 
        });
        
        const regex = selected.length > 0 
            ? selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|') 
            : '';

        // 1. กรองตารางหลัก (คอลัมน์ 5)
        table.column(5).search(regex, true, false).draw();

        // 2. กรองตาราง Completed Order (คอลัมน์ 5)
        if (typeof completedTableInstance !== 'undefined' && completedTableInstance) {
            completedTableInstance.column(5).search(regex, true, false).draw();
        }

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
// [3/5] กรอง PEA Name
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
        const regex = selected.length > 0 ? selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|') : '';
        
        table.column(4).search(regex, true, false).draw();
        if (typeof completedTableInstance !== 'undefined' && completedTableInstance) {
            completedTableInstance.column(4).search(regex, true, false).draw();
        }
        syncAllTables(table);
    };

    $searchContainer.off('change', '.peawbs-checkbox').on('change', '.peawbs-checkbox', applyFilter);
    $clearButton.off('click').on('click', function() {
        $searchContainer.find('.peawbs-checkbox').prop('checked', false); 
        $searchInput.val('').trigger('input');
        applyFilter();
    });
},

// [4/5] กรอง Project Group
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
        const regex = selected.length > 0 ? selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|') : '';
        
        table.column(10).search(regex, true, false).draw();
        if (typeof completedTableInstance !== 'undefined' && completedTableInstance) {
            completedTableInstance.column(10).search(regex, true, false).draw();
        }
        syncAllTables(table);
    };

    $searchContainer.off('change', '.projgroup-checkbox').on('change', '.projgroup-checkbox', applyFilter);
    $clearButton.off('click').on('click', function() {
        $searchContainer.find('.projgroup-checkbox').prop('checked', false); 
        $searchInput.val('').trigger('input');
        applyFilter();
    });
},

// [5/5] กรอง Budget CIP
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
        const regex = selected.length > 0 ? selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|') : '';
        
        table.column(12).search(regex, true, false).draw();
        if (typeof completedTableInstance !== 'undefined' && completedTableInstance) {
            completedTableInstance.column(12).search(regex, true, false).draw();
        }
        syncAllTables(table);
    };

    $searchContainer.off('change', '.budget-checkbox').on('change', '.budget-checkbox', applyFilter);
    $clearButton.off('click').on('click', function() {
        $searchContainer.find('.budget-checkbox').prop('checked', false); 
        $searchInput.val('').trigger('input');
        applyFilter();
    });
},

// =================================================================
// [ุ6] ฟังก์ชันกรองงบประมาณ Budget CIP (คอลัมน์ที่ 12 ในตารางหลัก)
// =================================================================

setupFilterBudgetProject(table) {
    const $dropdownMenu = $('#dropdownSearchBudgetProject');
    const $searchContainer = $dropdownMenu.find('ul');
    const $clearButton = $('#clearBudgetFilterProject');

    const ranges = [
        { label: "ไม่เกิน 500,000 บาท", min: 0, max: 500000 },
        { label: "500,000 ถึง 4,999,999 บาท", min: 500000, max: 4999999 },
        { label: "5,000,000 ถึง 49,999,999 บาท", min: 5000000, max: 49999999 },
        { label: "ตั้งแต่ 50,000,000 บาทขึ้นไป", min: 50000000, max: Infinity }
    ];

    $searchContainer.empty();
    ranges.forEach((range) => {
        $searchContainer.append(`
            <li class="w-full flex items-center p-2 hover:bg-neutral-tertiary-medium rounded budget-project-item">
                <label class="w-full flex items-center justify-between cursor-pointer m-0">
                    <span class="text-sm">${range.label}</span>
                    <input type="checkbox" class="budget-project-checkbox w-4 h-4" 
                           data-min="${range.min}" data-max="${range.max}">
                </label>
            </li>
        `);
    });

    // 1. ล้างฟิลเตอร์เก่าออกเสมอ เพื่อป้องกันการสะสม
    $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(func => !func.isBudgetFilter);

    // 2. สร้างฟิลเตอร์ใหม่
    const budgetSearchFunc = function(settings, data, dataIndex) {
        // กรองเฉพาะตารางหลัก หรือ ตาราง completed (ถ้ามีตัวตน)
        const isMainTable = settings.nTable === table.table().node();
        const isCompletedTable = typeof completedTableInstance !== 'undefined' && settings.nTable === completedTableInstance.table().node();
        
        if (!isMainTable && !isCompletedTable) return true;

        const selectedCheckboxes = $searchContainer.find('.budget-project-checkbox:checked');
        if (selectedCheckboxes.length === 0) return true;

        let rawValue = data[6] || "";
        let cleanText = rawValue.replace(/<[^>]*>/g, '').trim(); 
        if (cleanText === '-') cleanText = '0';

        const budgetValue = parseFloat(cleanText.replace(/,/g, '')) || 0;

        let isMatch = false;
        selectedCheckboxes.each(function() {
            const min = parseFloat($(this).data('min'));
            const max = parseFloat($(this).data('max'));
            if (budgetValue >= min && budgetValue <= max) isMatch = true;
        });
        return isMatch;
    };
    budgetSearchFunc.isBudgetFilter = true;
    $.fn.dataTable.ext.search.push(budgetSearchFunc);

    // 3. ปรับปรุง applyFilter
    const applyFilter = () => {
        table.draw(); // วาดตารางหลัก
        if (typeof completedTableInstance !== 'undefined' && completedTableInstance) {
            completedTableInstance.draw(); // วาดตาราง Completed Order
        }
        syncAllTables(table); // ⚡ ซิงค์ตารางย่อยทั้งหมด
    };

    $searchContainer.off('change', '.budget-project-checkbox').on('change', '.budget-project-checkbox', applyFilter);
    $clearButton.off('click').on('click', function() {
        $searchContainer.find('.budget-project-checkbox').prop('checked', false);
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



function toggleInfoTab(tabName) {
    const tableMap = {
        'MatchStock': '#tableStockMatch',
        'Fulfilled': '#tableFulfilled'
    };
    
    const tableId = tableMap[tabName];
    const $table = $(tableId);
    
    // ตรวจสอบก่อนว่าตารางเป็น DataTable แล้วหรือยัง
    if ($.fn.DataTable.isDataTable($table)) {
        const dt = $table.DataTable();
        // บังคับให้คำนวณใหม่ทันที
        dt.columns.adjust().responsive.recalc();
    }
}
// ===== tab รายการงานตามสัญญาณไฟ ============//
function toggleInfoOrderTab(tabName) {
    console.log("Switching to tab:", tabName);
    
    const tableMap = {
        'InfoPendingOrder': '#tableRequirement_Data',
        'InfoCompletedOrder': '#tableCompletedOrder',
       
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

function setupRowClickEvent() {
    $(document).off('click', 'tr.clickable-requirement').on('click', 'tr.clickable-requirement', function () {
        const selectedWBS = $(this).data('wbs');

        if (!selectedWBS) {
            return;
        }

        $('#tableRequirement_Data tbody tr').removeClass('table-primary selected-row');
        $(this).addClass('table-primary selected-row');

        if (stockMatchTableInstance) {
            stockMatchTableInstance.column(0).search('^' + selectedWBS + '$', true, false).draw();
        }

        if (noStockTableInstance) {
            noStockTableInstance.column(0).search('^' + selectedWBS + '$', true, false).draw();
        }

        if (obsoleteTableInstance) {
            obsoleteTableInstance.column(0).search('^' + selectedWBS + '$', true, false).draw();
        }

          if (fulfilledTableInstance) {
            fulfilledTableInstance.column(0).search('^' + selectedWBS + '$', true, false).draw();
            
        }

        // ✨ ดักฟังหลังจากคลิกแถวแล้ว: สั่งให้อัปเดต Dashboard ของตารางนั้นๆ ทันที
        // สมมติว่าตารางที่คุณใช้คือ #tableRequirement_Data ให้ส่ง Selector ของตารางนั้นเข้าไปครับ
        updateDashboardCardsDebounced('#tableRequirement_Data'); 
        setTimeout(() => {
            updateDashboardCounts();
        }, 100);
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
        // if (fulfilledTableInstance) fulfilledTableInstance.search('').columns().search('').draw();
        if (fulfilledTableInstance) {
        // 1. ล้าง filter WBS ที่เคยคลิกเลือกไว้
        fulfilledTableInstance.column(0).search('').draw(); 
        
        // 2. ถ้าคุณอยากให้มันมั่นใจว่าโชว์แค่ pending === 0 (รายการที่ค้างเบิก = 0)
        // คุณต้องสั่ง filter คอลัมน์ที่เก็บค่า pending ด้วย (สมมติ pending อยู่คอลัมน์ 4 หรือตามที่คุณ map ไว้)
        // ถ้าคอลัมน์ที่เช็คค้างเบิกไม่ได้อยู่ในตาราง ให้ข้ามข้อนี้ไปครับ
    }
        if (mb52Table) mb52Table.search('').draw();
        // if (mb52Table) mb52Table.search('').draw();
        console.log("สถานะ rawDatabase ตอนกด Reset:", rawDatabase.rows.length);
        // ====================================================================
        // 🎯 เคลียร์ 6 ตัวกรองหลักตามโครงสร้างและเงื่อนไขของคุณเป๊ะๆ
        // ====================================================================

        // 2. เคลียร์ข้อความในช่องพิมพ์ค้นหา (Dropdown) ทั้งหมดให้กลับเป็นค่าว่าง
        $(
            '#searchTypeWBS, #searchWBS, #searchPEAWBS, ' +
            '#searchProjGroup, #searchBudget'
        ).val('');
        // หมายเหตุ: หากตัวกรอง Light มีไอดีช่องเสิร์ช สามารถนำมาใส่เพิ่มในกลุ่มด้านบนนี้ได้เลยครับ
        $('#dropdownSearchBudgetProject').find('.budget-project-checkbox').prop('checked', false);
        if (parcelTable) parcelTable.draw();
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
        updateDashboardCardsDebounced('#tableRequirement_Data'); 
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

// === Info Card Pop-up Ready-to-close Functions === //
function showR2CCardInfo() {
    Swal.fire({
        title: 'Ready-to-Close คืออะไร?',
        html: `<div style="text-align: left; font-size: 15px; color: #475569; line-height: 1.6;">
                <p>การ์ดนี้ใช้แสดงข้อมูลสรุปของงานที่อยู่ในสถานะ <b>"พร้อมปิดงาน"</b> โดยระบบจะคำนวณและแสดงผลแยกตามกลุ่มงานย่อยดังนี้:</p>
                <ul style="margin-top: 8px; padding-left: 20px;">
                    <li><b>C :</b> จำนวนงานประเภทคอมพิวเตอร์/ระบบ</li>
                    <li><b>I :</b> จำนวนงานประเภทโครงสร้างพื้นฐาน</li>
                    <li><b>P :</b> จำนวนงานประเภทจัดซื้อจัดจ้างทั่วไป</li>
                    <li><b>C02.2 :</b> จำนวนงานในส่วนรหัสพิเศษเดี่ยว</li>
                </ul>
                <p style="margin-top: 10px; font-size: 13px; color: #94a3b8;">*แถวมูลค่าด้านล่างจะไม่ถูกนำไปคำนวณรวมกับงาน C02.2</p>
               </div>`,
        icon: 'info',
        confirmButtonText: 'รับทราบ',
        confirmButtonColor: '#8a73cd', // ใช้โทนสีม่วงให้เข้ากับ Card ของคุณ
        customClass: {
             popup: 'rounded-2xl', // ทำมุมกล่องให้มนเข้ากับดีไซน์เดิม
            confirmButton: 'swal-purple-btn'
        }
    });
}

// === Info Card Pop-up Ready-to-work Functions === //
function showR2WCardInfo() {
    Swal.fire({
        title: 'Ready-to-Work คืออะไร?',
        html: `<div style="text-align: left; font-size: 15px; color: #475569; line-height: 1.6;">
                <p>การ์ดนี้ใช้แสดงข้อมูลสรุปของงานที่อยู่ในสถานะ <b>"พร้อมทำงาน"</b> โดยระบบจะคำนวณและแสดงผลแยกตามกลุ่มงานย่อยดังนี้:</p>
                <ul style="margin-top: 8px; padding-left: 20px;">
                    <li><b>C :</b> จำนวนงานประเภทคอมพิวเตอร์/ระบบ</li>
                    <li><b>I :</b> จำนวนงานประเภทโครงสร้างพื้นฐาน</li>
                    <li><b>P :</b> จำนวนงานประเภทจัดซื้อจัดจ้างทั่วไป</li>
                    <li><b>C02.2 :</b> จำนวนงานในส่วนรหัสพิเศษเดี่ยว</li>
                </ul>
               </div>`,
        icon: 'info',
        confirmButtonText: 'รับทราบ',
        confirmButtonColor: '#8a73cd', // ใช้โทนสีม่วงให้เข้ากับ Card ของคุณ
        customClass: {
            popup: 'rounded-2xl', // ทำมุมกล่องให้มนเข้ากับดีไซน์เดิม
            confirmButton: 'swal-purple-btn'
        }
    });
}
// ==================== Main Initialization ====================



async function initDashboard() {
    const startTime = performance.now();
    
    // เริ่มต้น Render โครงร่างกราฟล่วงหน้า
    if (typeof GraphRender !== 'undefined') {
        GraphRender.Piegraph();
        GraphRender.BarGraph();
    }
    
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
        // const wbsProgressMap = getWBSProgressMap(processedAllocData);
        // ต้องส่งข้อมูล stockData (ถ้ามี) เข้าไปด้วยเพื่อให้ฟังก์ชันนับได้ครบ
const stockDataForCount = dataMap['Stock_Data'] || { rows: [] }; 
updateDashboardCounts(
    alloc.allocatedResults, 
    rawRequirementDatabase, 
    stockDataForCount, 
    materialTypeMap
);
        const wbsProgressMap = getWBSProgressMap(alloc.allocatedResults);
        //   const globalRankMap = RankingService.calculateAllWbsRanks(
        //     dataMap['Requirement_Data'].rows, 
        //     budgetMapping, 
        //     alloc.finalWbsScores
        // );
 
        // // เอาไปแปะไว้ใน window หรือตัวแปร Global เพื่อให้ตารางต่างๆ ดึงไปใช้ได้ทันที
        // window.GLOBAL_RANK_MAP = globalRankMap;

        const globalRankMap = (alloc && alloc.finalWbsScores) 
    ? RankingService.calculateAllWbsRanks(
        dataMap['Requirement_Data'].rows, 
        budgetMapping, 
        alloc.finalWbsScores, 
        alloc.wbsStatusMap || new Map() // ถ้า wbsStatusMap เป็น undefined ให้ส่ง Map ว่างไปแทน
      ) 
    : {}; // ถ้า alloc พัง ให้เป็น Object ว่าง

window.GLOBAL_RANK_MAP = globalRankMap;
        // ================= วาดตาราง ================= //
        config.forEach(sheet => {
            const data = dataMap[sheet.name];
            if (!data) return;

            if (sheet.name === 'Requirement_Data') {
                // parcelTable = TableRenderer.renderRequirementTable(
                //     sheet.target, data, globalVVIP, peaNameMapping,
                //     alloc.finalWbsScores, alloc.wbsStatusMap, budgetMapping, wbsProgressMap
                // );

            // ตารางที่ 1: งานค้างเบิก
parcelTable = TableRenderer.renderRequirementTable(
    '#tableRequirement_Data', 
    rawRequirementDatabase, 
    globalVVIP, peaNameMapping, alloc.finalWbsScores, alloc.wbsStatusMap, budgetMapping, wbsProgressMap
);

// ตารางที่ 2: งานที่เบิกครบแล้ว
completedTableInstance = TableRenderer.renderCompletedOrderTable(
    '#tableCompletedOrder', 
    rawRequirementDatabase, 
    globalVVIP, peaNameMapping, alloc.finalWbsScores, alloc.wbsStatusMap, budgetMapping, wbsProgressMap
);
                renderInitialStockMatch(processedAllocData, materialTypeMap);
                updateDashboardCards(sheet.target); 

                $(sheet.target).on('draw.dt search.dt', function(e) {
                    updateDashboardCardsDebounced(sheet.target);
                    if (e.type === 'search') updateGraph.updateDashboardCharts(sheet.target);
                });                

                noStockTableInstance = TableRenderer.renderNoStockTable(alloc.allocatedResults, materialTypeMap);
                obsoleteTableInstance = TableRenderer.renderObsoleteTable(alloc.allocatedResults, materialTypeMap, materialNoteMap);
                // แนะนำให้เปลี่ยนชื่อตัวแปรให้ตรงกับสถานะของข้อมูล
                 fulfilledTableInstance = TableRenderer.renderFulfilledTable(rawRequirementDatabase, materialTypeMap);
                // 🎯 3. สั่ง Render ตาราง Warehouse (ส่งค่าผ่านตัวแปร)
                if (typeof WarehouseService !== 'undefined') {
                    WarehouseService.renderNoStock_warehouse(processedAllocData, materialTypeMap);
                }
                // เพิ่มบรรทัดนี้ลงไปเพื่อให้ Sync ตลอดเวลาไม่ว่าจะกรองด้วยวิธีไหน
                parcelTable.on('draw', function () {
                    syncAllTables(parcelTable);
                });

                   

                FilterModule.setupFilterID_WBS(parcelTable, data);
                FilterModule.setupFilterType_WBS(parcelTable, data);
                FilterModule.setupFilterPEA_WBS(parcelTable, peaNameMapping);
                FilterModule.setupFilterLight(parcelTable, data, alloc.wbsStatusMap);
                FilterModule.setupFilterProjectGroup(parcelTable, data);
                FilterModule.setupFilterBudgetCIP(parcelTable, data);
                FilterModule.setupFilterBudgetProject(parcelTable, data);
                updateGraph.updateDashboardCharts(sheet.target);

            } else if (sheet.name === 'Stock_Data') {
                mb52Table = TableRenderer.renderStockTable(sheet.target, data, materialTypeMap, "stock");
            } else if (sheet.name !== 'Material_Master') {
                TableRenderer.renderGenericTable(sheet.target, data);
            }
        });
        setTimeout(() => {
            updateDashboardCounts(); // เรียกครั้งแรกเพื่อให้แสดงยอดรวมทั้งหมด
        }, 500); 

        // และเพิ่ม Listener ให้ตารางย่อยด้วยเพื่อความแม่นยำ
        [stockMatchTableInstance, noStockTableInstance, obsoleteTableInstance, fulfilledTableInstance].forEach(table => {
            if (table) {
                table.on('draw', () => updateDashboardCounts());
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
   // ใน initDashboard()
// ใน initDashboard() หลังจบการ Render ตารางหลัก

        setupGlobalEvents();
        $('#main-page-loader').fadeOut(100, function() { $(this).remove(); });

        const processEnd = performance.now();
        console.log(`⏱️ 2. Processing & Rendering Time: ${((processEnd - processStart) / 1000).toFixed(2)} seconds`);
        console.log(`🚀 Total Execution Time: ${((processEnd - startTime) / 1000).toFixed(2)} seconds`);
        console.groupEnd();
      
    } catch (err) {
        console.error("❌ Dashboard Initialization Error:", err);
        $('#main-page-loader').remove();
    }
}

$(document).ready(() => initDashboard());