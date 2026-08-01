/**
 * ============================================================================
 *  Dashboard พัสดุ/คลังสินค้า - script_technician.js
 * ============================================================================
 * ไฟล์นี้รวมโค้ด Frontend ทั้งหมดของหน้า Dashboard: ดึงข้อมูลจาก Google Sheet,
 * คำนวณการจัดสรรพัสดุ, วาดตาราง (DataTables), กราฟ (Chart.js), และตัวกรองต่างๆ
 *
 * สารบัญ (เรียงตามลำดับในไฟล์):
 *   1. Configuration        - หมายเหตุ dependency จากไฟล์ภายนอก (config, *Service ต่างๆ)
 *   2. Global State          - ตัวแปรสถานะรวมของแอป (instance ตาราง, ข้อมูล cache)
 *   3. Constants              - ค่าคงที่ที่ใช้ร่วมกัน (สไตล์ตาราง, สีสถานะ, รายการฟิลเตอร์)
 *   4. Utility Functions      - ฟังก์ชันช่วยเหลือทั่วไป (debounce, getCellValue, createStatusCircle)
 *   5. renderUpcomingTable()  - วาดตารางพัสดุที่กำลังจะเข้า (Upcoming_Item)
 *   6. updateGraph            - อัปเดตข้อมูลกราฟ Pie/Bar จากตารางที่ถูกกรอง
 *   7. GraphRender            - สร้าง instance กราฟ Pie/Bar ครั้งแรก (Chart.js)
 *   8. Dashboard Cards        - อัปเดตตัวเลขสรุปบนการ์ด (ShowTotalJobs, updateDashboardCards)
 *   9. Progress / WBS Utils   - คำนวณ % ความพร้อมของงานและ WBS
 *  10. Event Handlers         - renderInitialStockMatch และจุดเริ่ม cross-filter sync
 *  11. TableRenderer          - วาดตาราง DataTables ทุกตารางในหน้า (ตัวใหญ่ที่สุดในไฟล์)
 *  12. getTableCounts / updateDashboardCounts - นับจำนวนแถวในตารางย่อยแต่ละสถานะ
 *  13. syncAllTables()        - ซิงค์ตัวกรอง (search) จากตารางหลักไปยังตารางย่อยทั้งหมด
 *  14. Filter Helpers         - ฟังก์ชันช่วยสร้าง/ผูก dropdown checkbox filter (ใช้ร่วมกันหลายจุด)
 *  15. FilterModule           - ตัวกรองเฉพาะของแต่ละคอลัมน์/ตาราง (WBS, ประเภท, PEA, สถานะไฟ ฯลฯ)
 *  16. UI Helpers             - toggleInfoTab, setupRowClickEvent, SweetAlert card info popups
 *  17. setupGlobalEvents()    - ผูก event ระดับหน้าเว็บที่ไม่ผูกกับตารางใดตารางหนึ่งโดยเฉพาะ
 *  18. Main Initialization    - initDashboard() จุดเริ่มต้นการทำงานทั้งหมด + $(document).ready
 * ============================================================================
 */


// ==================== Configuration ====================
// หมายเหตุ: ตัวแปร/อ็อบเจกต์ต่อไปนี้ "ไม่ได้" ประกาศอยู่ในไฟล์นี้ แต่มาจากไฟล์ภายนอกที่ต้องโหลดมาก่อนไฟล์นี้เสมอ:
//   - config              : รายการชีตที่ต้องดึงข้อมูล พร้อม selector ตารางปลายทาง (ตัวอย่างโครงสร้างด้านล่าง)
//   - CommonService       : ดึงข้อมูล/แปลงข้อมูลดิบจาก Google Sheet (fetchMultipleSheets, getCellValue, buildMaterialTypeMap)
//   - AllocationService   : คำนวณการจัดสรรพัสดุ (calculateAllocation)
//   - RankingService      : คำนวณอันดับ WBS (calculateAllWbsRanks)
//   - WarehouseService    : เรนเดอร์ตารางคลังสินค้า (renderNoStock_warehouse) — ใช้แบบ optional (มีการเช็ก typeof ก่อนเรียก)
//
// ตัวอย่างโครงสร้างของ config:
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

const LIGHT_STATUS_FILTER_ITEMS = [
    { value: 'status-green', text: '🟢 ของครบ' },
    { value: 'status-blue', text: '🔵 พัสดุหลักครบ' },
    { value: 'status-yellow', text: '🟡 ได้ของบางส่วน' },
    { value: 'status-red', text: '🔴 ไม่ได้ของเลย' },
    { value: 'status-lock', text: '🔒 ล็อค (พัสดุล้าสมัย/เปลี่ยนรหัส)' }
];

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
// ==================== Chart / Graph Update Service ====================
// อัปเดตข้อมูลกราฟวงกลม (Pie) และกราฟแท่ง (Bar) จากข้อมูลที่กรองอยู่ในตารางหลัก ณ ขณะนั้น
/**
 * @namespace updateGraph
 * ดึงข้อมูลจากแถวที่ถูกกรอง (search: 'applied') ในตาราง DataTables แล้วนับ/รวมยอดแยกตามสถานะ (สี)
 * เพื่อส่งต่อให้ GraphRender อัปเดตกราฟ Pie และ Bar
 */
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

/**
 * @namespace GraphRender
 * สร้าง (render) Instance ของกราฟวงกลม (Chart.js Doughnut) และกราฟแท่ง (Chart.js Bar) ครั้งแรกตอนเปิดหน้า
 * ส่วนการอัปเดตข้อมูลกราฟหลังจากนั้นเป็นหน้าที่ของ `updateGraph` ด้านบน
 */
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
function updateDashboardCards(tableSelector, compTableSelector) {
    const table = $(tableSelector).DataTable();
    ShowTotalJobs(table);
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

function normalizeNumericValue(value) {
    const normalized = String(value ?? '')
        .replace(/,/g, '')
        .trim();

    if (!normalized || normalized === '-') {
        return 0;
    }

    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

// ⚡ Cache selector การ์ดสรุปยอด: element พวกนี้เป็น static DOM ที่ไม่ถูกสร้างใหม่ระหว่างการใช้งาน
// จึงไม่จำเป็นต้อง $(...) ค้นหาใหม่ทุกครั้งที่ ShowTotalJobs() ถูกเรียก (ซึ่งอาจถี่มากตอนกรอง/ค้นหาตาราง)
let _dashboardCardMapCache = null;
function getDashboardCardMap() {
    if (!_dashboardCardMapCache) {
        _dashboardCardMapCache = {
            totalJobs: $('#total-jobs-count'),
            totalCIP: $('#total-CIP-count'),
            total022: $('#total-022-count'),
            totalGreen: $('#total-green-count'),
            totalBlue: $('#total-blue-count'),
            total022Green: $('#total-022Green-count'),
            totalCGreen: $('#total-Cgreen-count'),
            totalIGreen: $('#total-Igreen-count'),
            totalPGreen: $('#total-Pgreen-count'),
            total022Blue: $('#total-022Blue-count'),
            totalCBlue: $('#total-CBlue-count'),
            totalIBlue: $('#total-IBlue-count'),
            totalPBlue: $('#total-PBlue-count'),
            totalValueAll: $('#total-valueAll-count'),
            totalValueCIP: $('#total-valueCIP-count'),
            totalValueGreen: $('#total-valueGreen-count'),
            totalValueBlue: $('#total-valueBlue-count'),
            totalCompleted: $('#total-completed-count'),
            grandTotal: $('#grand-total-count')
        };
    }
    return _dashboardCardMapCache;
}

function ShowTotalJobs(tableInstance) {
    const filteredMainRows = tableInstance.rows({ search: 'applied' }).data().toArray();
    const totalCount = filteredMainRows.length;

    const completedTable = completedTableInstance || ($('#tableCompletedOrder').length ? $('#tableCompletedOrder').DataTable() : null);
    const completedRows = completedTable ? completedTable.rows({ search: 'applied' }).data().toArray() : [];
    const completedCount = completedRows.length;

    const cardMap = getDashboardCardMap();

    let totalCIPCount = 0;
    let total022Count = 0;
    let totalValueAllSum = 0;
    let totalValueCIPSum = 0;
    let totalGreenCount = 0;
    let totalValueGreenSum = 0;
    let totalBlueCount = 0;
    let totalValueBlueSum = 0;
    let total022greenCount = 0;
    let totalCgreenCount = 0;
    let totalIgreenCount = 0;
    let totaPgreenCount = 0;
    let total022BlueCount = 0;
    let totalCBlueCount = 0;
    let totalIBlueCount = 0;
    let totaPBlueCount = 0;

    for (let i = 0; i < filteredMainRows.length; i++) {
        const row = filteredMainRows[i];
        const cellProject = String(row[10] || '').trim();
        const rawValue = String(row[6] || '').trim();
        const statusHTML = String(row[1] || '');
        const numericValue = normalizeNumericValue(rawValue);
        const projectUpper = cellProject.toUpperCase();
        const isGreen = statusHTML.includes('status-green');
        const isBlue = statusHTML.includes('status-blue');

        totalValueAllSum += numericValue;

        if (isGreen) {
            totalGreenCount++;
            totalValueGreenSum += numericValue;

            if (projectUpper.includes('C-')) totalCgreenCount++;
            if (projectUpper.includes('I-') || projectUpper.includes('งานปรับปรุงมิเตอร์') || projectUpper.includes('งานภัยธรรมชาติ')) totalIgreenCount++;
            if (projectUpper.includes('P-')) totaPgreenCount++;
            if (projectUpper.includes('งาน 02.2')) total022greenCount++;
        }

        if (isBlue) {
            totalBlueCount++;
            totalValueBlueSum += numericValue;

            if (projectUpper.includes('C-')) totalCBlueCount++;
            if (projectUpper.includes('I-') || projectUpper.includes('งานปรับปรุงมิเตอร์') || projectUpper.includes('งานภัยธรรมชาติ')) totalIBlueCount++;
            if (projectUpper.includes('P-')) totaPBlueCount++;
            if (projectUpper.includes('งาน 02.2')) total022BlueCount++;
        }

        if (!cellProject.includes('งาน 02.2')) {
            totalCIPCount++;
            totalValueCIPSum += numericValue;
        } else {
            total022Count++;
        }
    }

    for (let i = 0; i < completedRows.length; i++) {
        totalValueAllSum += normalizeNumericValue(completedRows[i][6]);
    }

    const formattedAll = (totalValueAllSum / 1000000).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    cardMap.totalJobs.text(totalCount.toLocaleString());
    cardMap.totalCIP.text(totalCIPCount.toLocaleString());
    cardMap.total022.text(total022Count.toLocaleString());
    cardMap.totalGreen.text(totalGreenCount.toLocaleString());
    cardMap.totalBlue.text(totalBlueCount.toLocaleString());
    cardMap.total022Green.text(total022greenCount.toLocaleString());
    cardMap.totalCGreen.text(totalCgreenCount.toLocaleString());
    cardMap.totalIGreen.text(totalIgreenCount.toLocaleString());
    cardMap.totalPGreen.text(totaPgreenCount.toLocaleString());
    cardMap.total022Blue.text(total022BlueCount.toLocaleString());
    cardMap.totalCBlue.text(totalCBlueCount.toLocaleString());
    cardMap.totalIBlue.text(totalIBlueCount.toLocaleString());
    cardMap.totalPBlue.text(totaPBlueCount.toLocaleString());
    cardMap.totalValueAll.text(formattedAll);
    cardMap.totalValueCIP.text(totalValueCIPSum.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }));
    cardMap.totalValueGreen.text(totalValueGreenSum.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }));
    cardMap.totalValueBlue.text(totalValueBlueSum.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }));
    cardMap.totalCompleted.text(completedCount.toLocaleString());
    cardMap.grandTotal.text((totalCount + completedCount).toLocaleString());
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
/**
 * @namespace TableRenderer
 * รวมฟังก์ชันสร้าง/วาดตาราง DataTables ทุกตารางในหน้า Dashboard:
 *   - renderStockTable          : ตาราง Stock (MB52) และตาราง Stock Match
 *   - renderRequirementTable    : ตารางงานค้างเบิกหลัก (Requirement_Data)
 *   - renderCompletedOrderTable : ตารางงานที่เบิกครบแล้ว
 *   - renderNoStockTable / renderObsoleteTable / renderFulfilledTable : ตารางสรุปย่อยตามสถานะพัสดุ
 *   - renderGenericTable        : ตารางทั่วไปที่ไม่ต้องมี logic พิเศษ
 *   - _buildTableHTML           : ฟังก์ชันภายใน สร้าง HTML <table> ดิบก่อนส่งให้ DataTables ครอบ
 * ทุกฟังก์ชัน render จะ destroy() ตารางเก่าก่อนเสมอ เพื่อป้องกัน DataTables ซ้อนกันตอน re-render
 */
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

        // 🎯 เรียงลำดับ WBS ตามอันดับที่ RankingService คำนวณไว้ล่วงหน้าแล้ว (เก็บไว้ที่ window.GLOBAL_RANK_MAP)
        // หมายเหตุ: ถ้า WBS ใดไม่มีอันดับ ให้ไปต่อท้ายสุด (fallback = 9999)
        const rankMap = window.GLOBAL_RANK_MAP || {};

        sortedWBSList.sort((a, b) => {
            const rankA = rankMap[a.valA] || 9999;
            const rankB = rankMap[b.valA] || 9999;
            return rankA - rankB;
        });

        // เก็บสถิติของแถวที่ยังแสดงผลอยู่ ไว้ส่งต่อให้กราฟสรุปผล
        const activeRowsDataForChart = [];

        // วนลูปตามลำดับ WBS ที่จัดอันดับแล้ว เพื่อสร้างแถวของตาราง
        sortedWBSList.forEach((item, index) => {
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
 
        // col 3: ประเภท (badge สีตามประเภทพัสดุ เหมือนตาราง StockMatch)
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
// ==== Show จำนวนพัสดุ แยกตาราง =====//
function getTableCounts() {
    const tableCountSources = [
        { key: 'noStock', instance: noStockTableInstance },
        { key: 'obsolete', instance: obsoleteTableInstance },
        { key: 'fulfilled', instance: fulfilledTableInstance },
        { key: 'matchStock', instance: stockMatchTableInstance }
    ];

    const counts = {};
    tableCountSources.forEach(({ key, instance }) => {
        if (!instance) {
            counts[key] = 0;
            return;
        }

        const searchVal = instance.column(0).search();
        counts[key] = searchVal ? instance.rows({ filter: 'applied' }).count() : instance.rows().count();
    });

    counts.totalStockcount = counts.noStock + counts.obsolete + counts.fulfilled + counts.matchStock;
    return counts;
}

function updateDashboardCounts() {
    const counts = getTableCounts();

    document.getElementById('count-fulfilled').innerText = counts.fulfilled.toLocaleString();
    document.getElementById('count-matchStock').innerText = counts.matchStock.toLocaleString();
    document.getElementById('count-noStock').innerText = counts.noStock.toLocaleString();
    document.getElementById('count-obsolete').innerText = counts.obsolete.toLocaleString();
    document.getElementById('count-totalStockcount').innerText = counts.totalStockcount.toLocaleString();
}


// วิธีเรียกใช้: เรียก updateDashboardCounts() เฉยๆ (ไม่ต้องส่ง parameter) หลังจากตารางย่อยทั้ง 4 ถูกสร้างแล้ว
// updateDashboardCounts();
 // =================================================================
// 🌟 ฟังก์ชันตัวกลางสำหรับแชร์การซิงค์ Cross-Filter ไปยังทุกตารางย่อย
// =================================================================
// ⚡ Cache ผลลัพธ์ตัวกรอง WBS ที่เคย sync ไปแล้ว เพื่อข้ามการ .search().draw() ซ้ำเมื่อผู้ใช้กรองด้วยเงื่อนไขเดิม
// (Key = regex ตัวกรอง + id ของตารางต้นทาง) — cache นี้จะโตขึ้นเรื่อยๆ ตามจำนวนชุดตัวกรองที่ผู้ใช้เคยเลือกในเซสชันนั้น
// แต่ในทางปฏิบัติมีขนาดเล็กมาก (จำกัดด้วยจำนวนค่า WBS ที่เป็นไปได้) จึงไม่กระทบหน่วยความจำอย่างมีนัยสำคัญ
const SYNC_TABLE_CACHE = new Map();

function syncAllTables(mainTable) {
    if (!mainTable) return;

    const activeWBS = new Set();
    const sourceRows = mainTable.rows({ search: 'applied' }).data().toArray();

    for (let i = 0; i < sourceRows.length; i++) {
        const rowValue = sourceRows[i] && sourceRows[i][2];
        const wbsValue = String(rowValue || '').replace(/<[^>]*>/g, '').trim();
        if (wbsValue) {
            activeWBS.add(wbsValue);
        }
    }

    const stockRegex = activeWBS.size > 0
        ? Array.from(activeWBS).map(v => $.fn.dataTable.util.escapeRegex(v)).join('|')
        : '^$|🚫';

    const cacheKey = `${stockRegex}|${mainTable.table().node().id}`;
    if (SYNC_TABLE_CACHE.get(cacheKey)) {
        updateDashboardCardsDebounced('#tableRequirement_Data');
        return;
    }

    SYNC_TABLE_CACHE.set(cacheKey, true);

    const syncedTableInstances = [
        stockMatchTableInstance,
        noStockTableInstance,
        obsoleteTableInstance,
        fulfilledTableInstance
    ];

    for (let i = 0; i < syncedTableInstances.length; i++) {
        const tableInstance = syncedTableInstances[i];
        if (!tableInstance) continue;
        tableInstance.column(0).search(stockRegex, true, false).draw();
    }

    updateDashboardCardsDebounced('#tableRequirement_Data');
}
function getCheckedValues($container, selector) {
    const selected = [];
    $container.find(selector).each(function () {
        const value = $(this).val();
        if (value !== undefined && value !== '') {
            selected.push(value);
        }
    });
    return selected;
}

function buildSelectionRegex(selected) {
    return selected.length > 0
        ? selected.map(value => $.fn.dataTable.util.escapeRegex(String(value))).join('|')
        : '';
}

function bindSearchInput($searchInput, $searchContainer, itemSelector) {
    $searchInput.off('input').on('input', function () {
        const text = $(this).val().toLowerCase();
        $searchContainer.find(itemSelector).each(function () {
            $(this).toggle($(this).text().toLowerCase().includes(text));
        });
    });
}

function applyCheckboxFilter(table, columnIndex, selected, completedColumnIndex) {
    const regex = buildSelectionRegex(selected);

    table.column(columnIndex).search(regex, true, false).draw();

    if (typeof completedTableInstance !== 'undefined' && completedTableInstance && Number.isInteger(completedColumnIndex)) {
        completedTableInstance.column(completedColumnIndex).search(regex, true, false).draw();
    }

    syncAllTables(table);
}

function applyExactColumnSearch(table, columnIndex, selectedValues) {
    const regex = selectedValues.length > 0
        ? `^(${buildSelectionRegex(selectedValues)})$`
        : '';

    table.column(columnIndex).search(regex, true, false).draw();
}

function resetTableColumnSearch(table, columnIndex) {
    table.column(columnIndex).search('').draw();
}

function buildUniqueOptionList(rows, cellIndex) {
    const list = [];

    rows.forEach((row) => {
        if (!row || !row.c) return;

        const value = row.c[cellIndex] && row.c[cellIndex].v !== undefined
            ? String(row.c[cellIndex].v).trim()
            : '';

        if (value && value !== '-' && !list.includes(value)) {
            list.push(value);
        }
    });

    return list.sort();
}

function setupUpcomingDropdownFilter(config) {
    const {
        table,
        data,
        dropdownSelector,
        searchInputSelector,
        clearButtonSelector,
        itemClass,
        checkboxClass,
        itemLabelPrefix,
        cellIndex,
        columnIndex,
        exactMatch = false
    } = config;

    const $dropdownMenu = $(dropdownSelector);
    const $searchContainer = $dropdownMenu.find('ul');
    const $searchInput = $(searchInputSelector);
    const $clearButton = $(clearButtonSelector);

    if (!$dropdownMenu.length || !$searchContainer.length || !$searchInput.length || !$clearButton.length) {
        return;
    }

    const valueList = buildUniqueOptionList(data.rows || [], cellIndex);
    $searchContainer.empty();

    valueList.forEach((item, index) => {
        const uniqueId = `${itemLabelPrefix}-${index}`;
        $searchContainer.append(`
            <li class="w-full flex items-center p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded ${itemClass}">
                <label for="${uniqueId}" class="w-full flex items-center justify-between cursor-pointer m-0">
                    <div class="inline-flex items-center font-medium text-heading text-sm">${item}</div>
                    <input id="${uniqueId}" type="checkbox" value="${item}" class="${checkboxClass} w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong focus:ring-2 focus:ring-brand-soft">
                </label>
            </li>
        `);
    });

    bindSearchInput($searchInput, $searchContainer, `.${itemClass}`);

    const applyFilter = () => {
        const selectedValues = getCheckedValues($searchContainer, `.${checkboxClass}:checked`);
        if (exactMatch) {
            applyExactColumnSearch(table, columnIndex, selectedValues);
        } else {
            applyCheckboxFilter(table, columnIndex, selectedValues, columnIndex);
        }
    };

    $searchContainer.off('change', `.${checkboxClass}`).on('change', `.${checkboxClass}`, applyFilter);
    $clearButton.off('click').on('click', function () {
        $searchContainer.find(`.${checkboxClass}`).prop('checked', false);
        $searchInput.val('').trigger('input');
        $searchContainer.find(`.${itemClass}`).attr('style', 'display: flex !important');
        resetTableColumnSearch(table, columnIndex);
        syncAllTables(table);
    });
}

function setupGenericCheckboxFilter(config) {
    const {
        table,
        data,
        dropdownSelector,
        searchInputSelector,
        clearButtonSelector,
        itemClass,
        checkboxClass,
        itemLabelPrefix,
        columnIndex,
        valueExtractor,
        completedColumnIndex = columnIndex,
        exactMatch = false
    } = config;

    const $dropdownMenu = $(dropdownSelector);
    const $searchContainer = $dropdownMenu.find('ul');
    const $searchInput = $(searchInputSelector);
    const $clearButton = $(clearButtonSelector);

    if (!$dropdownMenu.length || !$searchContainer.length || !$searchInput.length || !$clearButton.length) {
        return;
    }

    const valueList = [...new Set((data.rows || [])
        .map(valueExtractor)
        .filter(value => value && value !== '-'))].sort();

    $searchContainer.empty();
    valueList.forEach((item, index) => {
        const uniqueId = `${itemLabelPrefix}-${index}`;
        $searchContainer.append(`
            <li class="w-full flex items-center p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded ${itemClass}">
                <label for="${uniqueId}" class="w-full flex items-center justify-between cursor-pointer m-0">
                    <div class="inline-flex items-center font-medium text-heading text-sm">${item}</div>
                    <input id="${uniqueId}" type="checkbox" value="${item}" class="${checkboxClass} w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong">
                </label>
            </li>
        `);
    });

    bindSearchInput($searchInput, $searchContainer, `.${itemClass}`);

    const applyFilter = () => {
        const selectedValues = getCheckedValues($searchContainer, `.${checkboxClass}:checked`);
        if (exactMatch) {
            applyExactColumnSearch(table, columnIndex, selectedValues);
        } else {
            applyCheckboxFilter(table, columnIndex, selectedValues, completedColumnIndex);
        }
    };

    $searchContainer.off('change', `.${checkboxClass}`).on('change', `.${checkboxClass}`, applyFilter);
    $clearButton.off('click').on('click', function () {
        $searchContainer.find(`.${checkboxClass}`).prop('checked', false);
        $searchInput.val('').trigger('input');
        $searchContainer.find(`.${itemClass}`).attr('style', 'display: flex !important');
        resetTableColumnSearch(table, columnIndex);
    });
}

// ==================== Filter Module ====================
/**
 * @namespace FilterModule
 * รวมฟังก์ชันตั้งค่าตัวกรอง (dropdown checkbox filter) ทุกตัวของตาราง Requirement_Data และ Upcoming_Item
 * เช่น กรองตาม WBS, ประเภทงาน, การไฟฟ้า (PEA), สถานะไฟสัญญาณ, กลุ่มโครงการ, งบประมาณ ฯลฯ
 * ทุกฟังก์ชันจะ bind event 'change' ให้ checkbox แล้วเรียก syncAllTables() เพื่อซิงค์ตารางย่อยทั้งหมดให้ตรงกับตัวกรอง
 */
const FilterModule = {
// =================================================================
// [0/5 แถม] ฟังก์ชันกรองสัญญาณไฟ (คอลัมน์ที่ 1 ในตารางหลัก)
// =================================================================
setupFilterLight(tableInstance, rawData, wbsStatusMap) {
    const $dropdownMenu = $('#dropdownSearchLight');
    const $searchContainer = $dropdownMenu.find('ul');
    const $clearButton = $('#clearLightFilter');
    
    $searchContainer.empty();

    LIGHT_STATUS_FILTER_ITEMS.forEach((item, index) => {
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
        const selected = getCheckedValues($searchContainer, '.light-checkbox:checked');
        applyCheckboxFilter(tableInstance, 1, selected, 1);
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
    setupGenericCheckboxFilter({
        table,
        data,
        dropdownSelector: '#dropdownSearchWBS',
        searchInputSelector: '#searchWBS',
        clearButtonSelector: '#clearWBSFilter',
        itemClass: 'wbs-filter-item',
        checkboxClass: 'wbs-checkbox',
        itemLabelPrefix: 'dropdown-wbs',
        columnIndex: 2,
        valueExtractor: (row) => row?.c?.[0] ? getCellValue(row.c[0]).toString().trim() : '',
        completedColumnIndex: 2
    });
},
// =================================================================
// [2/5] ฟังก์ชันกรอง ประเภทงาน Type WBS (คอลัมน์ที่ 5 ในตารางหลัก)
// =================================================================
setupFilterType_WBS(table, data) {
    setupGenericCheckboxFilter({
        table,
        data,
        dropdownSelector: '#dropdownSearchTypeWBS',
        searchInputSelector: '#searchTypeWBS',
        clearButtonSelector: '#clearTypeWBSFilter',
        itemClass: 'typewbs-filter-item',
        checkboxClass: 'typewbs-checkbox',
        itemLabelPrefix: 'dropdown-typewbs',
        columnIndex: 5,
        valueExtractor: (row) => row?.c?.[24] ? getCellValue(row.c[24]).toString().trim() : '',
        completedColumnIndex: 5
    });
},

// =================================================================
// [3/5] ฟังก์ชันกรอง PEA WBS (คอลัมน์ที่ 4 ในตารางหลัก)
// =================================================================
// [3/5] กรอง PEA Name
setupFilterPEA_WBS(table, peaNameMapping) {
    const data = {
        rows: Object.values(peaNameMapping || {}).map(name => ({ c: [{ v: name }] }))
    };

    setupGenericCheckboxFilter({
        table,
        data,
        dropdownSelector: '#dropdownSearchPEAWBS',
        searchInputSelector: '#searchPEAWBS',
        clearButtonSelector: '#clearPEAWBSFilter',
        itemClass: 'peawbs-filter-item',
        checkboxClass: 'peawbs-checkbox',
        itemLabelPrefix: 'dropdown-peawbs',
        columnIndex: 4,
        valueExtractor: (row) => row?.c?.[0] ? getCellValue(row.c[0]).toString().trim() : '',
        completedColumnIndex: 4
    });
},

// [4/5] กรอง Project Group
setupFilterProjectGroup(table, data) {
    setupGenericCheckboxFilter({
        table,
        data,
        dropdownSelector: '#dropdownSearchProjGroup',
        searchInputSelector: '#searchProjGroup',
        clearButtonSelector: '#clearProjGroupFilter',
        itemClass: 'projgroup-filter-item',
        checkboxClass: 'projgroup-checkbox',
        itemLabelPrefix: 'dropdown-projgroup',
        columnIndex: 10,
        valueExtractor: (row) => row?.c?.[12] ? getCellValue(row.c[12]).toString().trim() : '',
        completedColumnIndex: 10
    });
},

// [5/5] กรอง Budget CIP
setupFilterBudgetCIP(table, data) {
    setupGenericCheckboxFilter({
        table,
        data,
        dropdownSelector: '#dropdownSearchBudget',
        searchInputSelector: '#searchBudget',
        clearButtonSelector: '#clearBudgetFilter',
        itemClass: 'budget-filter-item',
        checkboxClass: 'budget-checkbox',
        itemLabelPrefix: 'dropdown-budget',
        columnIndex: 12,
        valueExtractor: (row) => row?.c?.[18] ? getCellValue(row.c[18]).toString().trim() : '',
        completedColumnIndex: 12
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
    setupUpcomingDropdownFilter({
        table,
        data,
        dropdownSelector: '#dropdownSearch',
        searchInputSelector: '#search',
        clearButtonSelector: '#clearMaterialFilter',
        itemClass: 'material-filter-item',
        checkboxClass: 'material-checkbox',
        itemLabelPrefix: 'dropdown-material',
        cellIndex: 0,
        columnIndex: 0,
        exactMatch: true
    });
},

setupFilterUpcoming_MaterialName(table, data) {
    setupUpcomingDropdownFilter({
        table,
        data,
        dropdownSelector: '#dropdownSearchName',
        searchInputSelector: '#searchMaterialName',
        clearButtonSelector: '#clearMaterialNameFilter',
        itemClass: 'matname-filter-item',
        checkboxClass: 'matname-checkbox',
        itemLabelPrefix: 'dropdown-matname',
        cellIndex: 1,
        columnIndex: 1,
        exactMatch: true
    });
},

setupFilterUpcoming_PurchaseGroup(table, data) {
    setupUpcomingDropdownFilter({
        table,
        data,
        dropdownSelector: '#dropdownSearchGroup',
        searchInputSelector: '#searchPurchaseGroup',
        clearButtonSelector: '#clearPurchaseGroupFilter',
        itemClass: 'purgroup-filter-item',
        checkboxClass: 'purgroup-checkbox',
        itemLabelPrefix: 'dropdown-purgroup',
        cellIndex: 2,
        columnIndex: 2,
        exactMatch: false
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
     if (completedTableInstance) completedTableInstance.search('').columns().search('').draw();
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

/**
 * initDashboard
 * จุดเริ่มต้นการทำงานทั้งหมดของ Dashboard เมื่อโหลดหน้าเสร็จ ($(document).ready ด้านล่างสุดของไฟล์)
 * ลำดับการทำงาน:
 *   1. Render โครงร่างกราฟเปล่าล่วงหน้า (ให้ผู้ใช้เห็น canvas ทันทีระหว่างรอข้อมูล)
 *   2. ดึงข้อมูลทุกชีตที่ต้องใช้แบบขนาน (Promise.all ผ่าน CommonService.fetchMultipleSheets) ในคำขอเดียว
 *   3. แปลง/สรุปข้อมูลดิบเป็น Map ที่ใช้งานง่าย (PEA mapping, Budget mapping, Material type/note map, Stock summary)
 *   4. คำนวณการจัดสรรพัสดุ (AllocationService) และอันดับ WBS (RankingService)
 *   5. วาดตารางทั้งหมด ผูก event ตัวกรอง (FilterModule) และอัปเดตกราฟ/การ์ดสรุปยอด
 * มีการวัดเวลา performance.now() แยกระหว่างขั้นตอนดึงข้อมูล กับขั้นตอนประมวลผล/วาดผล เพื่อ log ไว้ debug ประสิทธิภาพ
 */
async function initDashboard() {
    const startTime = performance.now();
    
    // เริ่มต้น Render โครงร่างกราฟล่วงหน้า
    if (typeof GraphRender !== 'undefined') {
        GraphRender.Piegraph();
        GraphRender.BarGraph();
    }
    
    try {
        const fetchStart = performance.now();

        // 🚀 [จุดที่แก้]: มัดรวมรายชื่อ Sheet ทั้งหมดแล้วยิงด้วย fetchMultipleSheets เพียงครั้งเดียว
        const sheetNamesToFetch = [
            'VVIP_Data',
            'PEAName_data',
            'Budget_Data',
            'Upcoming_Item',
            ...config.map(s => s.name)
        ];

        // กรองชื่อ Sheet ซ้ำออกเพื่อไม่ให้ยิง API ซ้ำ
        const uniqueSheetNames = [...new Set(sheetNamesToFetch)];

        // ⚡ ยิงดึงข้อมูลแบบ Parallel ใน HTTP Request ชุดเดียว (< 1 วินาที)
        const dataMap = await CommonService.fetchMultipleSheets(uniqueSheetNames);

        const fetchEnd = performance.now();
        console.group("📊 Dashboard Performance Tracker");
        console.log(`⏱️ 1. Fetching Data Time: ${((fetchEnd - fetchStart) / 1000).toFixed(2)} seconds`);

        // 🚀 [แกะข้อมูลจาก Memory] ไม่ต้องยิง Fetch ใหม่
        
        // 1. VVIP Data
        const vvipData = dataMap['VVIP_Data']?.rows || [];

        // 2. PEA Name Mapping
        const peaMapping = {};
        if (dataMap['PEAName_data']?.rows) {
            const peaRows = dataMap['PEAName_data'].rows;
            for (let i = 0; i < peaRows.length; i++) {
                const peaCode = CommonService.getCellValue(peaRows[i].c[0])?.toString().trim();
                const peaName = CommonService.getCellValue(peaRows[i].c[1])?.toString().trim();
                if (peaCode && peaName) peaMapping[peaCode] = peaName;
            }
        }

        // 3. Budget Mapping
        const budgetMapping = {};
        if (dataMap['Budget_Data']?.rows) {
            const budgetRows = dataMap['Budget_Data'].rows;
            for (let i = 0; i < budgetRows.length; i++) {
                const wbs = CommonService.getCellValue(budgetRows[i].c[2])?.toString().trim();
                const rawValue = CommonService.getCellValue(budgetRows[i].c[19])?.toString() || "0";
                const cleanValue = rawValue.replace(/[^0-9.]/g, ''); 
                if (wbs) budgetMapping[wbs] = parseFloat(cleanValue) || 0;
            }
        }

        // 4. Upcoming Data
        const upcomingData = dataMap['Upcoming_Item'] || { cols: [], rows: [] };

        // 5. Material Map & Note Map
        const masterKey = Object.keys(dataMap).find(key => key.toLowerCase().includes('material_master'));
        const materialTypeMap = CommonService.buildMaterialTypeMap(dataMap[masterKey]);
        
        const materialNoteMap = {};
        if (dataMap[masterKey]?.rows) {
            const cols = dataMap[masterKey].cols;
            const finalNoteIdx = Math.max(cols.findIndex(c => c.label === "Not"), 7);
            const masterRows = dataMap[masterKey].rows;
            for (let i = 0; i < masterRows.length; i++) {
                const partID = CommonService.getCellValue(masterRows[i].c[0])?.toString().trim();
                if (partID) materialNoteMap[partID] = CommonService.getCellValue(masterRows[i].c[finalNoteIdx])?.toString().trim() || "";
            }
        }

        globalVVIP = vvipData;
        peaNameMapping = peaMapping;

        const processStart = performance.now();

        // 6. สรุปยอดคำนวณคลังสินค้า (Stock)
        totalStockSummary = {};
        if (dataMap['Stock_Data']?.rows) {
            const stockRows = dataMap['Stock_Data'].rows;
            for (let i = 0; i < stockRows.length; i++) {
                const row = stockRows[i];
                if (!row?.c) continue;
                const partID = CommonService.getCellValue(row.c[0])?.toString().trim();
                const quantity = parseFloat(CommonService.getCellValue(row.c[8])) || 0;
                if (partID) totalStockSummary[partID] = (totalStockSummary[partID] || 0) + quantity;
            }
        }

        // 7. คำนวณระบบจัดสรรพัสดุ (Logic เดิมครบถ้วน)
        rawRequirementDatabase = dataMap['Requirement_Data'];
        const alloc = AllocationService.calculateAllocation(
            rawRequirementDatabase, globalVVIP, totalStockSummary, materialTypeMap, budgetMapping
        );
        
        const processedAllocData = updateProgressData(alloc.allocatedResults, materialTypeMap);

        const stockDataForCount = dataMap['Stock_Data'] || { rows: [] }; 
        updateDashboardCounts(
            alloc.allocatedResults, 
            rawRequirementDatabase, 
            stockDataForCount, 
            materialTypeMap
        );

        const wbsProgressMap = getWBSProgressMap(alloc.allocatedResults);

        const globalRankMap = (alloc && alloc.finalWbsScores) 
            ? RankingService.calculateAllWbsRanks(
                dataMap['Requirement_Data'].rows, 
                budgetMapping, 
                alloc.finalWbsScores, 
                alloc.wbsStatusMap || new Map()
              ) 
            : {};

        window.GLOBAL_RANK_MAP = globalRankMap;

        // ================= วาดตาราง ================= //
        config.forEach(sheet => {
            const data = dataMap[sheet.name];
            if (!data) return;

            if (sheet.name === 'Requirement_Data') {
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
                fulfilledTableInstance = TableRenderer.renderFulfilledTable(rawRequirementDatabase, materialTypeMap);

                if (typeof WarehouseService !== 'undefined') {
                    WarehouseService.renderNoStock_warehouse(processedAllocData, materialTypeMap);
                }

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
            updateDashboardCounts();
        }, 500); 

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