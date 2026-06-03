/**
 * Dashboard Single File - Optimized & Clean
 * All functionality in one file with optimizations
 */


// ==================== Configuration ====================
const config = [
    { name: 'Material_Master', target: '#tableParcel' },
    { name: 'Stock_Data', target: '#tableMB52' },
    { name: 'Requirement_Data', target: '#tableRequirement_Data' },
    { name: 'Upcoming_Item', target: '#tableUpcoming_Item' },
    { name: 'Budget_Data', target: '#tableUBudget_Data' },
    { name: 'VVIP_Data', target: '#tableVVIP_Data' }
];

// ==================== Global State ====================
let stockMatchTableInstance = null;
let parcelTable, mb52Table;
let globalVVIP = [];
let rawRequirementDatabase = null;
let peaNameMapping = {};
let totalStockSummary = {};
// ประกาศเพิ่มคู่กับพวก parcelTable, stockMatchTableInstance
let noStockTableInstance = null;
let obsoleteTableInstance = null;
let myPieChart = null;
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
const DataService = {
    
    //============== ดึงจาก mysql ======================//
//    async fetchSheetData(sheetName) {
//         const url = `api/get_data.php?sheet=${encodeURIComponent(sheetName)}`;

//         // 🔗 log บอกเมื่อระบบฝั่ง JavaScript เริ่มทำการเชื่อมต่อไปยัง API เพื่อดึงข้อมูลจาก MySQL
//         console.log(`🌐 [MySQL DB] Connecting to API for table: "${sheetName}"...`);

//         try {
//             const response = await fetch(url);
//             if (!response.ok) throw new Error(`Network response was not ok (Status: ${response.status})`);

//             const jsonData = await response.json();
            
//             // ✅ log บอกเมื่อดึงข้อมูลสำเร็จจาก MySQL พร้อมบอกจำนวนแถวข้อมูลที่ได้กลับมา
//             const rowCount = (jsonData.table && jsonData.table.rows) ? jsonData.table.rows.length : 0;
//             console.log(`✅ [MySQL DB] Successfully connected to "${sheetName}". Fetched ${rowCount} rows.`);
            
//             return jsonData.table;

//         } catch (err) {
//             // ❌ log แจ้งเตือนกรณีที่ระบบเกิด Error หรือติดต่อ API ของ MySQL ไม่สำเร็จ
//             console.error(`❌ [MySQL DB] Failed to connect or fetch table "${sheetName}":`, err);
//             return { cols: [], rows: [] };
//         }
//     },

    //============== ดึงจาก google sheet ======================//
        async fetchSheetData(sheetName) {
        const spreadsheetId = '1zhp1OMsuil2DhjttNGRpvi1SOPlbT5FLGRYqOMruIN4';
        
        // ดึงข้อมูลผ่าน Google Endpoint ที่ให้โครงสร้างข้อมูลแบบตารางมาประมวลผลต่อได้ง่าย
        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}`;

        // 🔗 log บอกเมื่อระบบเริ่มทำการยิงไปเชื่อมต่อกับ Google Sheet
        console.log(`🌐 [Google Sheet DB] Connecting to table: "${sheetName}"...`);

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Network response was not ok (Status: ${response.status})`);

            const textData = await response.text();
            
            // ตัดเอาเฉพาะก้อนเนื้อหาข้อมูล JSON ที่อยู่ระหว่างวงเล็บ { ... }
            const jsonStart = textData.indexOf('{');
            const jsonEnd = textData.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('Invalid JSONP response format from Google Sheets');
            }
            
            const rawJsonStr = textData.substring(jsonStart, jsonEnd + 1);
            const parsedData = JSON.parse(rawJsonStr);
            
            const rawTable = parsedData.table;
            if (!rawTable) return { cols: [], rows: [] };

            // 🎯 จัดฟอร์แมตหัวคอลัมน์ (cols) ให้เหมือนกับของเดิมที่มาจาก MySQL
            const formattedCols = (rawTable.cols || []).map(col => ({
                label: col.label || ""
            }));

            // 🎯 จัดฟอร์แมตข้อมูลในตาราง (rows) ให้คงโครงสร้าง "c" -> "v" เอาไว้เหมือนเดิมเป๊ะ
            const formattedRows = (rawTable.rows || []).map(row => {
                if (!row || !row.c) return { c: [] };
                
                const formattedCells = row.c.map(cell => {
                    if (!cell) return { v: "" };
                    // ดึงค่า v จากเซลล์ออกมา หากค่าเป็น null หรือ undefined ให้เซ็ตเป็นสตริงว่าง
                    return { v: cell.v !== null && cell.v !== undefined ? cell.v : "" };
                });

                // ตรวจเช็กและเติมเซลล์ว่างให้ครบตามจำนวนคอลัมน์ ป้องกันระบบ JavaScript ประมวลผลพลาด
                while (formattedCells.length < formattedCols.length) {
                    formattedCells.push({ v: "" });
                }

                return { c: formattedCells };
            });

            // ✅ log บอกเมื่อเชื่อมต่อสำเร็จและแปลงข้อมูลเสร็จเรียบร้อย พร้อมบอกจำนวนแถวที่ได้มา
            console.log(`✅ [Google Sheet DB] Successfully connected to "${sheetName}". Fetched ${formattedRows.length} rows.`);

            // ส่งข้อมูลกลับไปในโครงสร้างแบบเดิมที่โค้ดเก่าต้องการ
            return {
                cols: formattedCols,
                rows: formattedRows
            };

        } catch (err) {
            // ❌ log แจ้งเตือนกรณีที่การเชื่อมต่อเกิดการพังหรือดึงข้อมูลไม่ได้
            console.error(`❌ [Google Sheet DB] Failed to connect or parse table "${sheetName}":`, err);
            return { cols: [], rows: [] };
        }
    },

    async fetchVVIPData() {
        const data = await this.fetchSheetData('VVIP_Data');
        return data.rows || [];
    },

    async fetchPEANameData() {
        const data = await this.fetchSheetData('PEAName_data');
        const mapping = {};

        if (data && data.rows) {
            data.rows.forEach(row => {
                if (!row || !row.c) return;
                const peaCode = getCellValue(row.c[0])?.toString().trim();
                const peaName = getCellValue(row.c[1])?.toString().trim();
                if (peaCode && peaName) {
                    mapping[peaCode] = peaName;
                }
            });
        }
        return mapping;
    },
    // 🎯 อันนี้คือฟังก์ชันใหม่ที่คุณบิ๊กสั่งเพิ่มเข้าไปครับ!
    async fetchUpcomingItemData() {
        // ดึงข้อมูลทั้งก้อน (มีทั้ง cols และ rows) เพื่อเอาไปจัดคอลัมน์ต่อ
        const data = await this.fetchSheetData('Upcoming_Item');
        return data; 
    },
  async  fetchBudgetData() {
    const data = await this.fetchSheetData('Budget_Data');
    const mapping = {};
    if (data && data.rows) {
        data.rows.forEach(row => {
            if (!row || !row.c) return;
            
            const wbs = getCellValue(row.c[2])?.toString().trim();
            
            // 🎯 1. ดึงค่าจาก JSON ออกมาเป็น String ดิบก่อน
            const rawValue = getCellValue(row.c[19])?.toString() || "0";
            
            // 🎯 2. ใช้ Regex ตัวนี้เคลียร์ทุกอย่างที่ไม่ใช่ ตัวเลข และ จุดทศนิยม ทิ้งให้เกลี้ยง (ลบคอมมา, ลบช่องว่าง)
            const cleanValue = rawValue.replace(/[^0-9.]/g, ''); 
            
            // 🎯 3. แปลงร่างเป็นตัวเลขทศนิยม (Float) ของ JavaScript เพื่อใช้คำนวณและแสดงผล
            const budgetVal = parseFloat(cleanValue) || 0;
            
            if (wbs) {
                // เก็บค่าเข้าไปในรูปแบบตัวเลขจำนวนเงินสุทธิ
                mapping[wbs] = budgetVal;
            }
        });
    }
    console.log(`💰 [Budget Data] Mapped ${Object.keys(mapping).length} WBS codes. Sample:`, Object.entries(mapping).slice(0, 3));
    return mapping;
}
    
};



// =========================================================================
// 🎯 ฟังก์ชันวาดตาราง Upcoming_Item (เวอร์ชันล้างบั๊ก Syntax Error '!')
// =========================================================================
function renderUpcomingTable(data) {
    // แก้ไขจุดเสี่ยงที่ 1: ใช้ == null แทนการใช้เครื่องหมาย !
    if (data == null || data.rows == null) {
        console.warn("⚠️ No rows for Upcoming_Item table");
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

    
    return $el.DataTable({
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
}
// ==================== Scoring Service ====================
const ScoringService = {
    matchedWBSCache: new Set(),

    clearCache() {
        this.matchedWBSCache.clear();
    },

    updateMatchedWBS(wbs) {
        if (wbs) this.matchedWBSCache.add(wbs.toString().trim());
    },

    // ⚙️ เรียงลำดับพารามิเตอร์ให้ชัดเจน: ตัวที่ 6 = isFullyAllocated, ตัวที่ 7 = valOpenDate, ตัวที่ 8 = isFinalCalc
    calculateScoreDetails(valA, valY, valX, rowCount, vvipData, isFullyAllocated = false, valOpenDate = "", isFinalCalc = false) {
        let score = 0;
        let diffDays = null;

        const currentWBS = valA ? valA.toString().trim() : "";
        const strY = valY ? valY.toString().trim() : "";
        const strX = valX ? valX.toString().trim() : "";
        const strOpenDate = valOpenDate ? valOpenDate.toString().trim() : "";

        // คำนวณคะแนนแต่ละส่วน
        diffDays = this._calculateDaysRemaining(strX);
        const strategicPoints = this._calculateStrategicPoints(currentWBS, vvipData);
        const timingPoints = this._calculateTimingPoints(strY, diffDays, strX);
        const agingDays = this._calculateAgingDays(strOpenDate);
        const agingPoints = agingDays > 0 ? (agingDays / 10000) : 0;

        // 🎯 เช็กเงื่อนไข +2000 แต้มตรงนี้: ถ้าได้ของครบ (isFullyAllocated = true) ปรับเป็น 2000 แต้มเต็มทันที
        const readinessPoints = isFullyAllocated ? 2000 : this._calculateReadinessPoints(rowCount);

        // รวมคะแนนสุทธิ
        score = strategicPoints + timingPoints + agingPoints + readinessPoints;

        // 📢 [CONSOLE LOG] จะแสดงผลที่นี่ที่เดียวเมื่อมีการสั่งเปิดระบบ Log (isFinalCalc = true)
      if (isFinalCalc) {
            let timingDetail = '';
            if (strY === "งาน 02.2") timingDetail = 'งาน 02.2 (Fix 3,000)';
            else if (strY === "เกินกำหนด") timingDetail = `เกินกำหนด (${Math.abs(diffDays)} วัน)`;
            else if (diffDays !== null && diffDays >= 0 && diffDays <= 30) timingDetail = `ใกล้กำหนดใน 30 วัน (เหลือ ${diffDays} วัน)`;
            else if (diffDays !== null && diffDays > 30) timingDetail = `เกิน 30 วัน (Fix 500)`;
            else timingDetail = 'เงื่อนไขอื่นๆ / ไม่ระบุวัน';

            console.log(`     ↳ 📋 [รายละเอียดคะแนน]`);
            console.log(`        👉 กลยุทธ์: +${strategicPoints} | เวลา [${timingDetail}]: +${timingPoints} | ค้างระบบ (${agingDays} วัน): +${agingPoints.toFixed(4)}`);
            console.log(`        👉 ความพร้อม: +${readinessPoints} แต้ม ${isFullyAllocated ? '➔ 🟢 [ได้รับพัสดุครบถ้วน Fully Allocated โบนัสบวกเต็ม 2,000]' : `[คำนวณจากปริมาณพัสดุ ${rowCount} ชิ้น]`}`);
            console.log(`     ---------------------------------------------------------------------------------------------------------------------------`);
        }
        return { totalScore: score, daysRemaining: diffDays };
    },

    _calculateDaysRemaining(dateStr) {
        if (!dateStr) return null;
        let day, month, yearCE;
        const googleDateMatch = dateStr.match(/Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\)/);
        if (googleDateMatch) {
            yearCE = parseInt(googleDateMatch[1]);
            month = parseInt(googleDateMatch[2]);
            day = parseInt(googleDateMatch[3]);
        } else {
            const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (!dateMatch) return null;
            day = parseInt(dateMatch[1]);
            month = parseInt(dateMatch[2]) - 1;
            yearCE = parseInt(dateMatch[3]);
        }
        if (yearCE > 2500) yearCE -= 543;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(yearCE, month, day);
        if (isNaN(deadline.getTime())) return null;
        return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    },

    _calculateAgingDays(dateStr) {
        if (!dateStr) return 0;
        let day, month, yearCE;
        const googleDateMatch = dateStr.match(/Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\)/);
        if (googleDateMatch) {
            yearCE = parseInt(googleDateMatch[1]);
            month = parseInt(googleDateMatch[2]); 
            day = parseInt(googleDateMatch[3]);
        } else {
            const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (!dateMatch) return 0;
            day = parseInt(dateMatch[1]);
            month = parseInt(dateMatch[2]) - 1; 
            yearCE = parseInt(dateMatch[3]);
        }
        if (yearCE > 2500) yearCE -= 543;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const openDate = new Date(yearCE, month, day);
        if (isNaN(openDate.getTime())) return 0;
        const diffTime = today - openDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    },

    _calculateStrategicPoints(strA, vvipData) {
        if (strA === "") return 0;
        let points = 1000;
        if (vvipData && Array.isArray(vvipData)) {
            const isVVIP = vvipData.some(row => {
                const vvipVal = (row.c && row.c[1] && row.c[1].v) ? row.c[1].v.toString().trim() : "";
                return vvipVal === strA;
            });
            if (isVVIP) points += 4000;
        }
        return points;
    },

    _calculateTimingPoints(strY, diffDays, strX) {
        const accumulationDays = Math.abs(diffDays || 0);
        if (strY === "งาน 02.2") return 3000;
        if (strY === "เกินกำหนด") return 2000 + (accumulationDays * 2);
        if (diffDays !== null && diffDays >= 0 && diffDays <= 30) return 1000 + (accumulationDays * 20);
        if (diffDays !== null && diffDays > 30) return 500;
        if (strY === "ไม่เกินกำหนด" && strX === "") return 500;
        return 0;
    },

    _calculateReadinessPoints(rowCount) {
        if (rowCount === undefined || rowCount === null) return 0;
        return rowCount <= 5 ? 1800 : 500;
    }
};
// ==================== Allocation Service ====================
// ==================== Allocation Service (เวอร์ชันพ่น Log สรุปอันดับคิว) ====================
const AllocationService = {
    calculateAllocation(rawDatabase, vvipData, totalStock, materialTypeMap = {}, budgetMapping = {}) {
        if (!rawDatabase || !rawDatabase.rows) {
            return { allocatedResults: [], finalWbsScores: new Map(), wbsStatusMap: new Map() };
        }

        const currentStock = { ...totalStock };
        const finalWbsScores = new Map();
        const wbsStatusMap = new Map();

        const uniqueWBSSet = new Set(
            rawDatabase.rows.map(r => getCellValue(r.c[0]).toString().trim())
        );
        const uniqueWBS = Array.from(uniqueWBSSet);

        // ================================================================================================
        // STEP 1: เตรียมคิวงานรอบแรก (ใช้คะแนนตั้งต้นก่อนแจกของเพื่อจัดลำดับความสำคัญ)
        // ================================================================================================
        const queue = rawDatabase.rows.map(row => {
            const wbs = getCellValue(row.c[0]).toString().trim();
            const rowsOfWbs = rawDatabase.rows.filter(
                r => getCellValue(r.c[0]).toString().trim() === wbs
            );

            const openDateValue = getCellValue(row.c[26]);
            const wbsBudget = budgetMapping[wbs] || 0;

            const info = ScoringService.calculateScoreDetails(
                wbs, getCellValue(row.c[24]), getCellValue(row.c[23]),
                rowsOfWbs.length, vvipData, false, openDateValue, false
            );

            return {
                wbs,
                partID: getCellValue(row.c[3])?.toString().trim(),
                partName: getCellValue(row.c[4]),
                pending: parseFloat(getCellValue(row.c[14])) || 0,
                score: info.totalScore,
                rowCount: rowsOfWbs.length,
                budget: wbsBudget,
                raw: { 
                    valA: getCellValue(row.c[0]), 
                    valY: getCellValue(row.c[24]), 
                    valX: getCellValue(row.c[23]),
                    valOpenDate: openDateValue
                }
            };
        });

        // จัดเรียงคิว 3 ชั้นเพื่อเข้าคิวตัดสต็อก
        queue.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (a.rowCount !== b.rowCount) return a.rowCount - b.rowCount;
            return b.budget - a.budget;
        });

        // ================================================================================================
        // STEP 2: ดำเนินการจัดสรรพัสดุตามคิวจริง
        // ================================================================================================
        let allocatedResults = queue.map(item => {
            const available = currentStock[item.partID] || 0;
            const assigned = Math.min(available, item.pending);
            currentStock[item.partID] -= assigned;

            let remain = currentStock[item.partID];
            if (isNaN(remain) || remain < 0) remain = 0;

            return {
                ...item,
                assigned,
                remainingAfter: remain,
                totalStock: totalStock[item.partID] || 0
            };
        });

        // ================================================================================================
        // STEP 3: สรุปผลลัพธ์และบันทึกข้อมูลเพื่อเตรียมจัดอันดับสุดท้าย
        // ================================================================================================
        const finalRankPrepList = [];

        uniqueWBS.forEach(wbs => {
            const items = allocatedResults.filter(r => r.wbs === wbs);
            
            // 1. แยกกลุ่มตรวจสอบพัสดุตามประเภทก่อนคิดไฟจราจร
            let hasLockedMaterial = false;
            
            // กรองเอาเฉพาะพัสดุปกติ (ที่ไม่ใช่ พัสดุล้าสมัย และ ไม่ใช่ เปลี่ยนรหัสพัสดุ) เอาไว้คิดไฟจราจร
            const normalItems = items.filter(i => {
                const currentID = i.partID?.toString().trim();
                const type = materialTypeMap[currentID];
                
                if (type === "พัสดุล้าสมัย" || type === "เปลี่ยนรหัสพัสดุ") {
                    hasLockedMaterial = true;
                }
                return type !== "พัสดุล้าสมัย" && type !== "เปลี่ยนรหัสพัสดุ";
            });

            let status = "yellow"; // ค่าเริ่มต้นกรณีไม่เข้าเงื่อนไขอื่น (ไฟเหลือง)
            let isGreen = false;

            // 🔒 ชั้นที่ 1: ตรวจสอบเงื่อนไขล็อกขั้นสูงสุด (ถ้าเจอล้าสมัย/เปลี่ยนรหัส ต้องเป็นกุญแจเท่านั้น)
            if (hasLockedMaterial) {
                status = "lock";
            } else if (normalItems.length > 0) {
                // 🔵 🟢 🔴 🟡 ชั้นที่ 2: งานปกติที่ไม่มีพัสดุล้าสมัย/เปลี่ยนรหัสพัสดุ

                // กรองเฉพาะกลุ่มพัสดุหลัก
                const mainItems = normalItems.filter(i => {
                    const currentID = i.partID?.toString().trim();
                    const type = materialTypeMap[currentID];
                    return type === "พัสดุหลัก";
                });
                
                // 🔵 เช็คเงื่อนไขไฟสีน้ำเงิน: พัสดุหลักมีอยู่ในงาน และทุกรายการพัสดุหลักได้ครบ (ไม่สนใจพัสดุประเภทอื่น)
                const isMainCompleted = mainItems.length > 0 && mainItems.every(i => i.assigned >= i.pending);

                // 🟢 เช็คเงื่อนไขไฟสีเขียว: พัสดุทุกรายการได้ครบ (โดยมองข้ามประเภท "พัสดุไม่เบิกจากคลัง")
                const isAllCompleted = normalItems.every(i => {
                    const currentID = i.partID?.toString().trim();
                    const type = materialTypeMap[currentID];
                    if (type === "พัสดุไม่เบิกจากคลัง") {
                        return true; 
                    }
                    return i.pending > 0 && i.assigned >= i.pending;
                });

                // 🔴 เช็คเงื่อนไขไฟสีแดง: ทุกรายการปกติได้ของรวมเป็น 0
                const isRed = normalItems.every(i => i.assigned === 0);

                // 🎯 ตัดสินสัญญาณไฟตามเกณฑ์ความสำคัญของพัสดุ
                if (isMainCompleted) {
                    status = "blue"; // พัสดุหลักครบ ยืนพื้นด้วยไฟน้ำเงินก่อน
                    
                    // 🟢 แต่ถ้าตรวจสอบแล้ว พัสดุประเภทอื่นๆ ครบหมดด้วย (หรือไม่มีประเภทอื่นอยู่เลย) ให้ปรับเป็นไฟเขียว
                    if (isAllCompleted) {
                        status = "green";
                        isGreen = true; // เปิด Flag ไปรับโบนัส +2000 แต้ม
                    }
                } else if (isAllCompleted) {
                    // เคสยกเว้น: งานนั้นไม่มีพัสดุหลักเลย แต่รายการประเภทอื่นๆ ที่มี ดันได้ครบทั้งหมด
                    status = "green";
                    isGreen = true;
                } else if (isRed) {
                    status = "red";
                } else {
                    status = "yellow"; // พัสดุหลักไม่ครบ และยอดไม่เป็น 0 ทั้งหมด (ได้ของบางส่วน)
                }
            }

            const firstItem = items[0];
            if (firstItem) {
                // คำนวณคะแนนสุทธิสุดท้ายหลังแจกของ (ใส่ค่า isGreen เพื่อลุ้นโบนัส +2000)
                const final = ScoringService.calculateScoreDetails(
                    firstItem.raw.valA, firstItem.raw.valY, firstItem.raw.valX,
                    firstItem.rowCount, vvipData, isGreen, firstItem.raw.valOpenDate, false
                );

                finalWbsScores.set(wbs, final.totalScore);
                wbsStatusMap.set(wbs, status);
                
                // อัปเดตคะแนนกลับไปที่รายการพัสดุ
                items.forEach(it => it.score = final.totalScore);

                // เก็บลงอาร์เรย์ชั่วคราวเพื่อนำไปเรียงลำดับพิมพ์ออกรายงาน
                finalRankPrepList.push({
                    wbs: wbs,
                    finalScore: final.totalScore,
                    rowCount: firstItem.rowCount,
                    budget: firstItem.budget,
                    status: status,
                    raw: firstItem.raw,
                    isFullyAllocated: isGreen
                });
            }
        });

        // ================================================================================================
        // 🏆 🧾 [FINAL RANKING REPORT] พ่นตัวเลขคะแนนสุทธิเรียงตามอันดับ 1 ถึงสุดท้าย
        // ================================================================================================
        finalRankPrepList.sort((a, b) => {
            if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
            if (a.rowCount !== b.rowCount) return a.rowCount - b.rowCount;
            return b.budget - a.budget;
        });

        console.log("================================================================================================================================================");
        console.log(`🏆 [FINAL RANKING REPORT] รายงานสรุปคะแนนสุทธิและจัดอันดับงาน (WBS) เรียงจากอันดับ 1 ถึงสุดท้าย (${finalRankPrepList.length} รายการ)`);
        console.log("👉 เกณฑ์การจัดอันดับ: 1. คะแนนสุทธิสูงสุด ➔ 2. รายการพัสดุน้อยที่สุด ➔ 3. มูลค่างานสูงสุด");
        console.log("================================================================================================================================================");

        finalRankPrepList.forEach((item, index) => {
            const rank = index + 1;
            const statusLabel = item.status === "lock" ? "🔒 LOCKED " : 
                                item.status === "green" ? "🟢 FULLY  " : 
                                (item.status === "blue" ? "🔵 MAIN   " : 
                                (item.status === "yellow" ? "🟡 PARTIAL" : "🔴 NONE   "));
                                
            const budgetStr = item.budget.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            
            console.log(
                `อันดับที่ ${rank.toString().padEnd(2)} | ` +
                `WBS: ${item.wbs.padEnd(15)} | ` +
                `สถานะ: [${statusLabel}] | ` +
                `คะแนนสุทธิสุดท้าย: ${item.finalScore.toFixed(4).padStart(10)} แต้ม | ` +
                `จำนวนพัสดุ: ${item.rowCount.toString().padStart(2)} รายการ | ` +
                `มูลค่างาน: ${budgetStr.padStart(14)} บาท`
            );

            // แสดงรายละเอียด Breakdown รายบรรทัด
            ScoringService.calculateScoreDetails(
                item.raw.valA, item.raw.valY, item.raw.valX,
                item.rowCount, vvipData, item.isFullyAllocated, item.raw.valOpenDate, true
            );
        });

        console.log("================================================================================================================================================");
        return { allocatedResults, finalWbsScores, wbsStatusMap };
    },


    updatePieChart(data) {
        if (typeof updatePieChart === 'function') {
            updatePieChart(data);
        }
    },


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
    console.log("=== 📊 ตรวจสอบข้อมูลดิบที่กวาดได้จากตาราง ===");
    console.log("จำนวนแถวทั้งหมดที่กวาดเจอ:", allRowsData.length);
    console.log("รายการสถานะทั้งหมดในตาราง ณ ตอนนี้:", allRowsData.map(d => d.status));
    console.log("มีคำว่า lock ปรากฏในระบบบ้างไหม?:", allRowsData.some(d => d.status === 'lock'));
    console.log("=================================================");
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
function updateDashboardCards(tableSelector) {
    const table = $(tableSelector).DataTable();
    const filteredData = table.rows({ search: 'applied' }).data();

    // เรียกฟังก์ชันย่อยเพื่ออัปเดตข้อมูลแต่ละส่วน
    ShowTotalJobs(filteredData);
    // ในอนาคตสามารถเพิ่ม ShowTotalBudget(filteredData) ได้ที่นี่
}
function ShowTotalJobs(tableInstance) {
    // 1. นับจำนวนงานทั้งหมด
    const totalCount = tableInstance.rows().count();
    $('#total-jobs-count').text(totalCount.toLocaleString());

    let totalCIPCount = 0;
    let total022Count = 0;
    let totalValueAllSum = 0; 
    let totalValueCIPSum = 0; 
    let totalGreenCount = 0;
    let totalValueGreenSum = 0; // ตัวแปรเก็บมูลค่ารวมของงานสีเขียว
    let totalBlueCount = 0;
    let totalValueBlueSum = 0; // ตัวแปรเก็บมูลค่ารวมของงานสีน้ำเงิน
    let total022green_count = 0; 
    let totalCgreen_count = 0; 
    let totalIgreen_count = 0; 
    let totaPgreen_count = 0; 
    let total022Blue_count = 0; 
    let totalCBlue_count = 0; 
    let totalIBlue_count = 0; 
     let totaPBlue_count = 0; 


    // 2. ลูปผ่านแต่ละแถว
    tableInstance.rows().nodes().each(function(rowNode) {
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
            totalValueGreenSum += numericValue; // สะสมมูลค่างานสีเขียว
            
            if (projectUpper.includes('C-')) {

               totalCgreen_count++;
            //    console.log(`📊 Green Value Sum C: ${cellProject.toLocaleString()}`);
            }
             if (projectUpper.includes('I-') || projectUpper.includes('งานปรับปรุงมิเตอร์') || projectUpper.includes('งานภัยธรรมชาติ')) {
                totalIgreen_count++;
                // console.log(`📊 Green Value Sum I: ${cellProject.toLocaleString()}`);
            }
             if (projectUpper.includes('P-')) {
                totaPgreen_count++;
                //  console.log(`📊 Green Value Sum P: ${cellProject.toLocaleString()}`);
            }
             if (projectUpper.includes('งาน 02.2')) {
                total022green_count++;
                // console.log(`📊 Green Value Sum 02.2: ${cellProject.toLocaleString()}`);
            }
            // console.log(`📊 Green Value Sum C: ${totalCgreen_count.toLocaleString()}`);
            
        }
      

        const isBlue = statusHTML.includes('status-blue');
        if (isBlue) {
            totalBlueCount++;
            totalValueBlueSum += numericValue; // สะสมมูลค่างานสีน้ำเงิน
            if (projectUpper.includes('C-')) {

               totalCBlue_count++;
            //    console.log(`📊 Blue Value Sum C: ${cellProject.toLocaleString()}`);
            }
             if (projectUpper.includes('I-') || projectUpper.includes('งานปรับปรุงมิเตอร์') || projectUpper.includes('งานภัยธรรมชาติ')) {
                totalIBlue_count++;
                // console.log(`📊 Blue Value Sum I: ${cellProject.toLocaleString()}`);
            }
             if (projectUpper.includes('P-')) {
                totaPBlue_count++;
                //  console.log(`📊 Blue Value Sum P: ${cellProject.toLocaleString()}`);
            }
             if (projectUpper.includes('งาน 02.2')) {
                total022Blue_count++;
                // console.log(`📊 Green Value Sum 02.2: ${cellProject.toLocaleString()}`);
            }
        }

        // แยกนับจำนวนและมูลค่าตามเงื่อนไขการกำหนดโครงการ
        if (!cellProject.includes('งาน 02.2')) {
            totalCIPCount++;
            totalValueCIPSum += numericValue;

        } else  {
            total022Count++;
        }

         

    });
   
        const valueInMillions = totalValueAllSum / 1000000;
        
        // ฟอร์แมตทศนิยม 2 ตำแหน่ง
        const formattedAll = valueInMillions.toLocaleString(undefined, {
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0
        });  
        
        console.log(`📊 Green Value Sum C: ${totalCgreen_count.toLocaleString()}`);
         console.log(`📊 Green Value Sum I: ${totalIgreen_count.toLocaleString()}`);
         console.log(`📊 Green Value Sum P: ${totaPgreen_count.toLocaleString()}`);
         console.log(`📊 Green Value Sum 02.2: ${total022green_count.toLocaleString()}`);
    // 3. อัปเดตตัวเลขลง HTML
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

    
  // อัปเดตมูลค่ารวม CIP
    $('#total-valueAll-count').text(formattedAll );

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

    // อัปเดตมูลค่ารวมงานสีเขียว
    

    console.log(`📊 Green Value Sum: ${totalValueGreenSum.toLocaleString()}`);
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
        console.warn("⚠️ No allocated data provided");
        return;
    }
// 1. สั่งคำนวณ % พัสดุรายตัวให้ครบทุกแถว
    allocatedData = updateProgressData(allocatedData, materialTypeMap);
    // 🎯 [จุดแก้ไข] กรองเฉพาะข้อมูลที่ตัวแปร assigned มีค่ามากกว่า 0 เท่านั้น
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
}
// ==================== Table Renderer ====================
const TableRenderer = {

    //===== ตาราง match stock=============//
    renderStockTable(target, tableData, materialTypeMap = {}, mode = "stock") {
        if (!tableData || !tableData.rows || !tableData.cols) {
            console.warn("⚠️ No data for table:", target);
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
    "pageLength": 25,
    "responsive": true,
    "autoWidth": false,
    "order": [[0, "asc"]],
    "buttons": [
        {
            extend: 'excel',
            text: '<i class="fas fa-file-excel mr-1"></i> Export',
            filename: 'R2C_InStock_Report',
            className: 'px-3 py-2 mb-0 text-center text-slate-500 uppercase align-middle bg-white rounded-lg cursor-pointer text-xs shadow-soft-md hover:scale-102 active:opacity-85'
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

        // นับรายการ
        data.rows.forEach(row => {
            if (!row || !row.c) return;
            let valA = getCellValue(row.c[0]).toString().trim();
            if (valA !== "") {
                countMap.set(valA, (countMap.get(valA) || 0) + 1);
            }
        });

        // Unique map
        data.rows.forEach(row => {
            if (!row || !row.c) return;
            let valA = getCellValue(row.c[0]).toString().trim();
            if (valA !== "" && !uniqueMap.has(valA)) {
                uniqueMap.set(valA, row);
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
        AllocationService.updatePieChart(activeRowsDataForChart);
        return html;
    },

    //=========== ตาราง NoStock พัสดุที่ไม่ได้รับการจัดสรร ===========//
/**
 * แสดงตารางพัสดุที่ไม่ได้รับการจัดสรร (assigned = 0)
 * @param {Array} allocatedData - ข้อมูลการจัดสรร
 * @param {Object} materialTypeMap - ประเภทพัสดุ
 */
renderNoStockTable(allocatedData, materialTypeMap) {
    if (!allocatedData || !Array.isArray(allocatedData)) return null;
    
    // ประเภทพัสดุที่ไม่ต้องการแสดงในตาราง
    const EXCLUDED_TYPES = ["พัสดุล้าสมัย", "เปลี่ยนรหัสพัสดุ", "พัสดุไม่เบิกจากคลัง"];
 
    const noStockData = allocatedData.filter(res => {
        if (res.assigned !== 0) return false;
        const partType = materialTypeMap[res.partID?.toString().trim()] || "";
        return !EXCLUDED_TYPES.includes(partType);
    });

    if (noStockData.length === 0) return null;
 
    const $el = $('#tableNoStock');
    if ($.fn.DataTable.isDataTable('#tableNoStock')) {
        $el.DataTable().destroy();
        $el.empty();
    }
 
    const colHeaders = [
        { title: "หมายเลขงาน" },   // index 0
        { title: "รหัสพัสดุ" },     // index 1
        { title: "ชื่อพัสดุ" },     // index 2
        { title: "ประเภท" },        // index 3 (เพิ่มใหม่ ก่อนค้างเบิก)
        { title: "ที่ได้ / ค้างเบิก" }
    ];
 
    const dataSet = noStockData.map(res => {
        const partType = materialTypeMap[res.partID?.toString().trim()] || "-";
        return [
            res.wbs     || "-",   // 0
            res.partID  || "-",   // 1
            res.partName|| "-",   // 2
            partType,             // 3 ประเภท
           { assigned: res.assigned || 0, pending: res.pending || 0 }
        ];
    });
 
const NoStockTable = $el.DataTable({
    "data": dataSet,
    "columns": colHeaders,
    "pageLength": 10,
    "responsive": true,
    "order": [[0, "asc"]], // เรียงตามรหัสพัสดุ (col 1) จากน้อยไปมาก
    
    "buttons": [
        {
            extend: 'excel',
            text: '<i class="fas fa-file-excel mr-1"></i> Export',
            filename: 'R2C_NoStock_report',
            className: 'px-3 py-2 mb-0 text-center text-green-600 uppercase align-middle bg-white rounded-lg cursor-pointer text-xs shadow-soft-md hover:scale-102 active:opacity-85'
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
                else if (data === 'ผลิตภัณฑ์คอนกรีต') { bgColor = "#d5fff9"; textColor = "#2189a8"; }

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
            }
        
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
 
// 🎯 5. รีเทิร์นตัวแปรตารางออกไปใช้งานต่อตามปกติ
return NoStockTable;
}, // 👈 เช็กดูว่ามีปีกกาปิดตัวนี้ครบถ้วนไหม



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
        { title: "Note", width: "44%" }       
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
        "pageLength": 10,
        "responsive": true,
        "autoWidth": false, 
        "order": [[0, "asc"]], 
        "buttons": [
            {
                extend: 'excel',
                text: '<i class="fas fa-file-excel mr-1"></i> Export',
                filename: 'R2C_Obsolete_report',
                className: 'px-3 py-2 mb-0 text-center text-green-600 uppercase align-middle bg-white rounded-lg cursor-pointer text-xs shadow-soft-md hover:scale-102 active:opacity-85'
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
    return ObsoleteTable;
} // <--- จบฟังก์ชันพอดีเป๊ะ โครงสร้างไม่พังแน่นอนครับ,



};

// ==================== Filter Module ====================
const FilterModule = {
    setupFilterID_WBS(table, data) {
        const $filter = $('#FilterID_WBS');
        $filter.empty().append('<option value="">ทั้งหมด (หมายเลขงาน)</option>');

        let list = [];
        data.rows.forEach(row => {
            if (!row || !row.c) return;
            let val = getCellValue(row.c[0]);
            if (val && !list.includes(val)) {
                list.push(val);
            }
        });

        list.sort().forEach(item => {
            $filter.append(`<option value="${item}">${item}</option>`);
        });

        $filter.select2({
            theme: 'bootstrap-5',
            placeholder: 'ค้นหาหมายเลขงาน...',
            width: '100%',
            closeOnSelect: false,
            allowClear: true
        });

        $filter.on('change', function () {
            const val = $(this).val();
            table.column(2).search(val ? '^' + val + '$' : '', true, false).draw();
        });
    },
setupFilterType_WBS(table, data) {
    const $filter = $('#FilterType_WBS');
    $filter.empty().append('<option value="">ทั้งหมด (สถานะงาน)</option>');

    let list = [];
    data.rows.forEach(row => {
        if (!row || !row.c) return;
        let val = getCellValue(row.c[24]);
        if (val && !list.includes(val)) {
            list.push(val);
        }
    });

    list.sort().forEach(item => {
        $filter.append(`<option value="${item}">${item}</option>`);
    });

    $filter.select2({
        theme: 'bootstrap-5',
        width: '100%',
        closeOnSelect: false,
        placeholder: 'ค้นหาสถานะงาน...',
        allowClear: true
    });

    $filter.on('change', function () {
        const val = $(this).val();
        // 🎯 แก้ไขตรงนี้: ปรับมาใช้คำสั่งค้นหาข้อความปกติ (ไม่ต้องใช้ ^ และ $) ในคอลัมน์ Index 5
        table.column(5).search(val ? val : '').draw();
    });
},

    setupFilterPEA_WBS(table, peaNameMapping) {
        const $filter = $('#FilterPEA_WBS');
        if ($filter.length === 0) return;

        $filter.empty().append('<option value="">ทั้งหมด (การไฟฟ้า)</option>');

        const peaNames = Object.values(peaNameMapping);
        let list = [];

        peaNames.forEach(name => {
            if (name && name !== "ชื่อ" && !list.includes(name)) {
                list.push(name);
            }
        });

        list.sort().forEach(item => {
            $filter.append(`<option value="${item}">${item}</option>`);
        });

        $filter.select2({
            theme: 'bootstrap-5',
            width: '100%',
            closeOnSelect: false,
            placeholder: 'ค้นหาการไฟฟ้า...',
            allowClear: true
        });

        $filter.on('change', function () {
            const val = $(this).val();
            table.column(4).search(val ? '^' + val + '$' : '', true, false).draw();
        });
    },

setupFilterLight(tableInstance, rawData) {
        // 1. ชี้เป้าตัว Select
        const $filter = $('#setupFilterLight');
        if ($filter.length === 0) return;

        // 2. ยัด Option แบบที่ Select2 ชอบ (เพิ่มตัวกุญแจล็อค status-lock เข้าไป)
        const optionsHTML = `
            <option value=""></option>
            <option value="status-green">🟢 ของครบ</option>
            <option value="status-blue">🔵 พัสดุหลักครบ </option>
            <option value="status-yellow">🟡 ได้ของบางส่วน </option>
            <option value="status-red">🔴 ไม่ได้ของเลย </option>
            <option value="status-lock">🔒 ล็อค (พัสดุล้าสมัย/เปลี่ยนรหัส)</option>
        `;
        $filter.html(optionsHTML);

        // 3. 🎯 ดักทำลาย Select2 ตัวเก่า (ถ้ามีค้างอยู่) แล้วชุบชีวิตใหม่ด้วยแท็กหน่วงเวลาเสี้ยววินาทีเพื่อให้หน้าเว็บพร้อม
        if ($filter.hasClass("select2-hidden-accessible")) {
            $filter.select2('destroy');
        }

        setTimeout(() => {
            $filter.select2({
                theme: 'bootstrap-5',
                width: '100%',
                closeOnSelect: true,
                placeholder: 'ทั้งหมด (ไฟสัญญาณ/สถานะ)', // ข้อความจะโชว์ตรงนี้แทนตัวเลือกแรก
                allowClear: true // เปิดปุ่มกากบาทล้างค่า
            });
        }, 100);

        // 4. ล้างระบบ Custom Search เก่าออกไป (โค้ดเดิม)
        $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(function(fn) {
            return fn.name !== 'lightFilter';
        });

        // 5. ผูกคำสั่งค้นหาของ DataTables (โค้ดเดิม)
        $filter.off('change').on('change', function () {
            const selectedSearchToken = $(this).val() || ''; // ดึงค่าสี (ถ้ากดกากบาทจะได้ความว่างเปล่า)

            // ค้นหาเฉพาะในคอลัมน์ที่ 1 (คอลัมน์สัญญาณไฟ)
            tableInstance.column(1).search(selectedSearchToken, false, false).draw();
        });
    },

    setupFilterProjectGroup(table, data) {
    const $filter = $('#FilterProjectGroup');
    $filter.empty().append('<option value="">ทั้งหมด (กลุ่มโครงการ)</option>');

    let list = [];
    data.rows.forEach(row => {
        if (!row || !row.c) return;
        let val = getCellValue(row.c[12]);
        if (val && !list.includes(val)) {
            list.push(val);
        }
    });

    list.sort().forEach(item => {
        $filter.append(`<option value="${item}">${item}</option>`);
    });

    $filter.select2({
        theme: 'bootstrap-5',
        width: '100%',
        closeOnSelect: false,
        placeholder: 'ค้นหากลุ่มโครงการ...',
        allowClear: true
    });

    $filter.on('change', function () {
        const val = $(this).val();
        // 🎯 แก้ไขตรงนี้: ปรับมาใช้คำสั่งค้นหาข้อความปกติ (ไม่ต้องใช้ ^ และ $) ในคอลัมน์ Index 5
        table.column(10).search(val ? val : '').draw();
    });
},
 setupFilterBudgetCIP(table, data) {
    const $filter = $('#FilterBudgetCIP');
    $filter.empty().append('<option value="">ทั้งหมด (งบ)</option>');

    let list = [];
    data.rows.forEach(row => {
        if (!row || !row.c) return;
        let val = getCellValue(row.c[18]);
        if (val && !list.includes(val)) {
            list.push(val);
        }
    });

    list.sort().forEach(item => {
        $filter.append(`<option value="${item}">${item}</option>`);
    });

    $filter.select2({
        theme: 'bootstrap-5',
        width: '100%',
        closeOnSelect: false,
        placeholder: 'ค้นหางบ...',
        allowClear: true
    });

    $filter.on('change', function () {
        const val = $(this).val();
        // 🎯 แก้ไขตรงนี้: ปรับมาใช้คำสั่งค้นหาข้อความปกติ (ไม่ต้องใช้ ^ และ $) ในคอลัมน์ Index 5
        table.column(12).search(val ? val : '').draw();
    });
},


// =========== filter ตัวใหม่ล่าสุดสำหรับตารางพัสดุที่กำลังจะมาถึง (Upcoming Material) =========== //
// setupFilterUpcoming_MaterialID(table, data) {
//     // 1. กำหนด Selector ของ Element Select HTML สำหรับรหัสพัสดุ
//     const $filter = $('#FilterUpcoming_Material'); 
//     $filter.empty().append('<option value="">ทั้งหมด (รหัสพัสดุ)</option>');

//     let list = [];
//     data.rows.forEach(row => {
//         if (!row || !row.c) return;
        
//         // 2. ดึงข้อมูลจากช่อง Index 0 (รหัสพัสดุ) ของข้อมูลดิบ
//         // (ตรวจสอบการใช้ฟังก์ชัน getCellValue หรือตรวจสอบค่า cell.v แบบเดียวกับฟังก์ชัน render)
//         let cell = row.c[0];
//         let val = (cell && cell.v !== undefined) ? cell.v.toString().trim() : "";
        
//         if (val && val !== "-" && !list.includes(val)) {
//             list.push(val);
//         }
//     });

//     // 3. เรียงลำดับข้อมูลพัสดุและใส่เข้าไปใน Dropdown
//     list.sort().forEach(item => {
//         $filter.append(`<option value="${item}">${item}</option>`);
//     });

//     // 4. เปิดใช้งาน Select2
//     $filter.select2({
//         theme: 'bootstrap-5',
//         width: '100%',
//         closeOnSelect: true, // รหัสพัสดุส่วนใหญ่มักเลือกทีละรายการ ถ้าอยากให้เลือกได้หลายอันค่อยเปลี่ยนเป็น false
//         placeholder: 'ค้นหารหัสพัสดุ...',
//         allowClear: true
//     });

//     // 5. ดักจับเหตุการณ์เมื่อมีการเปลี่ยนค่า เพื่อกรองข้อมูลใน DataTable คอลัมน์ที่ 0
//     $filter.on('change', function () {
//         const val = $(this).val();
//         // 🎯 กรองในคอลัมน์ Index 0 (รหัสพัสดุ)
//         // ใช้คำสั่งค้นหาข้อความปกติ (ถ้าต้องการให้ตรงเป๊ะเป๊ะ สามารถเปลี่ยนเป็น table.column(0).search(val ? '^' + val + '$' : '', true, false).draw(); ได้ครับ)
//         table.column(0).search(val ? val : '').draw();
//     });
// },

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
    // 1. กำหนด Selector ของ Element Select HTML สำหรับชื่อพัสดุ
    const $filter = $('#FilterUpcoming_MaterialName'); 
    $filter.empty().append('<option value="">ทั้งหมด (ชื่อพัสดุ)</option>');

    let list = [];
    data.rows.forEach(row => {
        if (!row || !row.c) return;
        
        // 2. ดึงข้อมูลจากช่อง Index 1 (ชื่อพัสดุ) ของข้อมูลดิบ
        // (ตรวจสอบการใช้ฟังก์ชัน getCellValue หรือตรวจสอบค่า cell.v แบบเดียวกับฟังก์ชัน render)
        let cell = row.c[1];
        let val = (cell && cell.v !== undefined) ? cell.v.toString().trim() : "";
        
        if (val && val !== "-" && !list.includes(val)) {
            list.push(val);
        }
    });

    // 3. เรียงลำดับข้อมูลพัสดุและใส่เข้าไปใน Dropdown
    list.sort().forEach(item => {
        $filter.append(`<option value="${item}">${item}</option>`);
    });

    // 4. เปิดใช้งาน Select2
    $filter.select2({
        theme: 'bootstrap-5',
        width: '100%',
        closeOnSelect: true, // รหัสพัสดุส่วนใหญ่มักเลือกทีละรายการ ถ้าอยากให้เลือกได้หลายอันค่อยเปลี่ยนเป็น false
        placeholder: 'ค้นหาชื่อพัสดุ...',
        allowClear: true
    });

    // 5. ดักจับเหตุการณ์เมื่อมีการเปลี่ยนค่า เพื่อกรองข้อมูลใน DataTable คอลัมน์ที่ 1
    $filter.on('change', function () {
        const val = $(this).val();
        // 🎯 กรองในคอลัมน์ Index 1 (ชื่อพัสดุ)
        // ใช้คำสั่งค้นหาข้อความปกติ (ถ้าต้องการให้ตรงเป๊ะเป๊ะ สามารถเปลี่ยนเป็น table.column(1).search(val ? '^' + val + '$' : '', true, false).draw(); ได้ครับ)
        table.column(1).search(val ? val : '').draw();
    });
},
setupFilterUpcoming_PurchaseGroup(table, data) {
    // 1. กำหนด Selector ของ Element Select HTML สำหรับกลุ่มการจัดซื้อ
    const $filter = $('#FilterUpcoming_PurchaseGroup'); 
    $filter.empty().append('<option value="">ทั้งหมด (กลุ่มการจัดซื้อ)</option>');

    let list = [];
    data.rows.forEach(row => {
        if (!row || !row.c) return;
        
        // 2. ดึงข้อมูลจากช่อง Index 2 (กลุ่มการจัดซื้อ) ของข้อมูลดิบ
        // (ตรวจสอบการใช้ฟังก์ชัน getCellValue หรือตรวจสอบค่า cell.v แบบเดียวกับฟังก์ชัน render)
        let cell = row.c[2];
        let val = (cell && cell.v !== undefined) ? cell.v.toString().trim() : "";
        
        if (val && val !== "-" && !list.includes(val)) {
            list.push(val);
        }
    });

    // 3. เรียงลำดับข้อมูลพัสดุและใส่เข้าไปใน Dropdown
    list.sort().forEach(item => {
        $filter.append(`<option value="${item}">${item}</option>`);
    });

    // 4. เปิดใช้งาน Select2
    $filter.select2({
        theme: 'bootstrap-5',
        width: '100%',
        closeOnSelect: true, // รหัสพัสดุส่วนใหญ่มักเลือกทีละรายการ ถ้าอยากให้เลือกได้หลายอันค่อยเปลี่ยนเป็น false
        placeholder: 'ค้นหาชื่อพัสดุ...',
        allowClear: true
    });

    // 5. ดักจับเหตุการณ์เมื่อมีการเปลี่ยนค่า เพื่อกรองข้อมูลใน DataTable คอลัมน์ที่ 2
    $filter.on('change', function () {
        const val = $(this).val();
        // 🎯 กรองในคอลัมน์ Index 2 (กลุ่มการจัดซื้อ)
        // ใช้คำสั่งค้นหาข้อความปกติ (ถ้าต้องการให้ตรงเป๊ะเป๊ะ สามารถเปลี่ยนเป็น table.column(2).search(val ? '^' + val + '$' : '', true, false).draw(); ได้ครับ)
        table.column(2).search(val ? val : '').draw();
    });
}


};





 

function setupRowClickEvent() {
    $(document).off('click', 'tr.clickable-requirement').on('click', 'tr.clickable-requirement', function () {
        const selectedWBS = $(this).data('wbs');

        if (!selectedWBS) {
            console.warn("⚠️ WBS not found");
            return;
        }

        $('#tableRequirement_Data tbody tr').removeClass('table-primary selected-row');
        $(this).addClass('table-primary selected-row');

        // 1. ค้นหาในตารางจับคู่สต็อกหลัก (คอลัมน์ 0)
        if (stockMatchTableInstance) {
            stockMatchTableInstance.column(0).search('^' + selectedWBS + '$', true, false).draw();
        }

        // 🎯 2. ค้นหาในตารางพัสดุไม่มีของ (คอลัมน์ 0 ซึ่งเป็นหมายเลขงานเช่นกัน)
        if (noStockTableInstance) {
            noStockTableInstance.column(0).search('^' + selectedWBS + '$', true, false).draw();
        }

        if (obsoleteTableInstance) {
            obsoleteTableInstance.column(0).search('^' + selectedWBS + '$', true, false).draw();
        }
    });
}

function setupGlobalEvents() {
    $('#resetMB52').on('click', function () {
        if (parcelTable) parcelTable.search('').columns().search('').draw();
        if (stockMatchTableInstance) stockMatchTableInstance.search('').columns().search('').draw();
        // 🎯 3. ล้างค่าการค้นหาของตารางพัสดุไม่มีของเมื่อกดปุ่ม Reset
        if (noStockTableInstance) noStockTableInstance.search('').columns().search('').draw();
        if (obsoleteTableInstance) obsoleteTableInstance.search('').columns().search('').draw();
        if (mb52Table) mb52Table.search('').draw();
        $('#tableRequirement_Data tbody tr').removeClass('table-primary selected-row');
        $('.filter-select').val('');
        console.log("✅ All filters cleared");
    });

    setupRowClickEvent();
}
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
            popup: 'rounded-2xl' // ทำมุมกล่องให้มนเข้ากับดีไซน์เดิม
        }
    });
}
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
            popup: 'rounded-2xl' // ทำมุมกล่องให้มนเข้ากับดีไซน์เดิม
        }
    });
}
// ==================== Main Initialization ====================
async function initDashboard() {
    const startTime = performance.now();
    console.log("🚀 Starting dashboard...");
    GraphRender.Piegraph();
    GraphRender.BarGraph();
    try {
        const fetchStart = performance.now();

        // ดึงข้อมูล Parallel
        const vvipPromise = DataService.fetchVVIPData();
        const peaPromise = DataService.fetchPEANameData();
        const budgetPromise = DataService.fetchBudgetData();
        const sheetPromises = config.map(async (sheet) => {
            const data = await DataService.fetchSheetData(sheet.name);
            return { sheet, data };
        });

      // ดึงข้อมูล Upcoming ควบคู่ไปด้วย
        const upcomingPromise = DataService.fetchUpcomingItemData(); 

        // รอมัดรวมพร้อมกัน โดยเอา upcomingPromise ไว้ตูดสุดเพื่อไม่ให้ลำดับ config เพี้ยน
        const [vvipData, peaMapping, budgetMapping, ...restWithUpcoming] = await Promise.all([
            vvipPromise,
            peaPromise,
            budgetPromise,
            ...sheetPromises,
            upcomingPromise 
        ]);

        // ดึงเอาตัวแปรตัวสุดท้าย (Upcoming) แยกออกมาเก็บไว้
        const upcomingData = restWithUpcoming.pop(); 
        const results = restWithUpcoming;

        globalVVIP = vvipData;
        peaNameMapping = peaMapping;

        console.log(`📡 Data loaded: ${((performance.now() - fetchStart) / 1000).toFixed(2)}s`);

        const processStart = performance.now();

        // สร้าง Map ข้อมูล
        const dataMap = results.reduce((acc, curr) => {
            acc[curr.sheet.name] = curr.data;
            return acc;
        }, {});

        // เตรียม Material Master Map
        let materialTypeMap = {};
        const masterKey = Object.keys(dataMap).find(key => key.toLowerCase().includes('material_master'));
        const masterData = dataMap[masterKey];

        let materialNoteMap = {};
        if (masterData && masterData.rows) {
            const idIdx = masterData.cols.findIndex(c => c.label.includes("รหัสพัสดุ") || c.label.includes("Part"));
            const typeIdx = masterData.cols.findIndex(c => c.label.includes("ประเภทพัสดุ") );
            const noteIdx = masterData.cols.findIndex(c => c.label === "Not");

            const finalIdIdx = idIdx !== -1 ? idIdx : 0;
            const finalTypeIdx = typeIdx !== -1 ? typeIdx : 2;
            const finalNoteIdx = noteIdx !== -1 ? noteIdx : 7;

            masterData.rows.forEach(row => {
                const partID = getCellValue(row.c[finalIdIdx])?.toString().trim();
                const matType = getCellValue(row.c[finalTypeIdx])?.toString().trim();
                const matNote = getCellValue(row.c[finalNoteIdx])?.toString().trim();

                if (partID) {
                    materialTypeMap[partID] = matType;
                    materialNoteMap[partID] = matNote || "";
                }
            });
        }

        // คำนวณ Stock
        totalStockSummary = {};
        if (dataMap['Stock_Data']?.rows) {
            dataMap['Stock_Data'].rows.forEach(row => {
                let partID = getCellValue(row.c[0])?.toString().trim();
                let quantity = parseFloat(getCellValue(row.c[8])) || 0;
                if (partID) {
                    totalStockSummary[partID] = (totalStockSummary[partID] || 0) + quantity;
                }
            });
        }

        // จัดสรร
        rawRequirementDatabase = dataMap['Requirement_Data'];
        const alloc = AllocationService.calculateAllocation(
            rawRequirementDatabase,
            globalVVIP,
            totalStockSummary,
            materialTypeMap,
            budgetMapping
        );
        const processedAllocData = updateProgressData(alloc.allocatedResults, materialTypeMap);
        const wbsProgressMap = getWBSProgressMap(processedAllocData);
        //================วาดตาราง เรียกฟังก์ชันมาใช้งาน=================//
        config.forEach(sheet => {
            const data = dataMap[sheet.name];
            if (!data) return;

            if (sheet.name === 'Requirement_Data') {
                parcelTable = TableRenderer.renderRequirementTable(
                    sheet.target, data, globalVVIP, peaNameMapping,
                    alloc.finalWbsScores, alloc.wbsStatusMap, budgetMapping, wbsProgressMap
                );
                renderInitialStockMatch(alloc.allocatedResults, materialTypeMap);
                                // หลังจาก renderInitialStockMatch เพิ่มบรรทัด
                // --- [เพิ่มจุดที่ 1] เรียกอัปเดต Card ทันทีหลังจากตารางถูกสร้างเสร็จ ---
                updateDashboardCards(sheet.target); 

                // --- [เพิ่มจุดที่ 2] ผูก Event ให้ทำงานเมื่อมีการค้นหาหรือเปลี่ยนหน้า ---
                $(sheet.target).on('draw.dt search.dt', function() {
                    updateDashboardCards(sheet.target);
                });                
                noStockTableInstance = TableRenderer.renderNoStockTable(alloc.allocatedResults, materialTypeMap);
                obsoleteTableInstance = TableRenderer.renderObsoleteTable(alloc.allocatedResults, materialTypeMap, materialNoteMap);
                FilterModule.setupFilterID_WBS(parcelTable, data);
                FilterModule.setupFilterType_WBS(parcelTable, data);
                FilterModule.setupFilterPEA_WBS(parcelTable, peaNameMapping);
                FilterModule.setupFilterLight(parcelTable, data, alloc.wbsStatusMap);
                FilterModule.setupFilterProjectGroup(parcelTable, data);
                FilterModule.setupFilterBudgetCIP(parcelTable, data);

                // 🎯 [จุดที่เพิ่มคำสั่ง 1] สั่งอัปเดตกราฟวงกลมทันทีหลังสร้างตารางนี้เสร็จ
                // โดยใช้ตัวแปร sheet.target ซึ่งเป็น ID ตารางพัสดุหลัก
                AllocationService.updateDashboardCharts(sheet.target);

                // ตอนพิมพ์ค้นหา (Search) ก็สั่งรันตัวแม่ตัวเดียวเหมือนกัน
                $(sheet.target).on('search.dt', function() {
                    AllocationService.updateDashboardCharts(sheet.target);
                });

            } else if (sheet.name === 'Stock_Data') {
                mb52Table = TableRenderer.renderStockTable(sheet.target, data, materialTypeMap, "stock");

            } else if (sheet.name !== 'Material_Master') {
                TableRenderer.renderGenericTable(sheet.target, data);
            }
        });
            if (upcomingData && upcomingData.rows && upcomingData.rows.length > 0) {
                // 1. ส่งข้อมูลไป render ตาราง และรับค่า DataTable Instance กลับมาเก็บไว้ในตัวแปร
                const upcomingTableInstance = renderUpcomingTable(upcomingData);
                // 2. ตรวจสอบว่ามี Instance ของตารางจริง และข้อมูลถูกต้อง จึงจะเริ่มผูกตัวกรอง (Filter)
                if (upcomingTableInstance) {
                    // เรียกฟังก์ชันฟิลเตอร์สถานะงาน (ตัวเดิมที่คุณมี)
                    FilterModule.setupFilterUpcoming_MaterialID(upcomingTableInstance, upcomingData);
                    // เรียกฟังก์ชันฟิลเตอร์รหัสพัสดุ (ตัวใหม่ที่สร้างขึ้น)
                    FilterModule.setupFilterUpcoming_MaterialName(upcomingTableInstance, upcomingData);
                    FilterModule.setupFilterUpcoming_PurchaseGroup(upcomingTableInstance, upcomingData);
                
                console.log("🔍 Filters for Upcoming Table initialized!");
                 }
                console.log("📦 Upcoming Item Table Rendered successfully!");
            } else {
                console.warn("⚠️ No rows found in Upcoming_Item data");
            }
        setupGlobalEvents();

        console.log(`⚙️ Processing: ${((performance.now() - processStart) / 1000).toFixed(2)}s`);
     $('#main-page-loader').fadeOut(300, function() {
            $(this).remove(); // สั่งทำลาย Element ทิ้งไปเลยไม่ให้โผล่มาหลอนซ้ำสอง
        });
//==============================  end code===============================//
      
    } catch (err) {
        console.error("❌ Error:", err);
        // หากระบบพัง ดึงข้อมูลไม่ได้ ให้เอาม่านออกทันทีหน้าจอจะได้ไม่ขาวค้าง
        $('#main-page-loader').remove();
    }

    console.log(`✅ Ready in ${((performance.now() - startTime) / 1000).toFixed(2)}s`);
}

// Document Ready
$(document).ready(() => initDashboard());