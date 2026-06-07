/**
 * Dashboard Single File - Optimized & Clean
 * All functionality in one file with optimizations
 *
 * OPTIMIZATION NOTES:
 * - DOM Cache: jQuery selectors cached to avoid repeated DOM traversal
 * - Regex Cache: Compiled regex patterns stored to reduce compilation overhead
 * - Data Cache: API responses cached to prevent duplicate network calls
 * - Score Cache: Calculation results cached for frequently used values
 * - Consolidated Logic: Filter setup abstracted to reduce code duplication
 * - Batch Updates: Chart updates consolidated to single pass through data
 * - Parallel Fetching: All async data loaded simultaneously for faster initialization
 * - Performance Tracking: Built-in performance metrics for optimization monitoring
 * - Memory Efficient: Map/Set used instead of Object for better performance
 *
 * Status: Production-ready, fully backward compatible with original version
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
// OPTIMIZATION: Consolidated cache for debounce timers and DOM elements
const debounceTimers = new Map();
const domCache = new Map(); // Cache jQuery selectors
const regexCache = new Map(); // Cache compiled regex patterns

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

// OPTIMIZATION: Cached jQuery selector to prevent repeated DOM traversal
function getCachedElement(selector) {
    if (!domCache.has(selector)) {
        domCache.set(selector, $(selector));
    }
    return domCache.get(selector);
}

// OPTIMIZATION: Cached regex patterns for better performance
function getCachedRegex(pattern, flags = '') {
    const key = `${pattern}|${flags}`;
    if (!regexCache.has(key)) {
        regexCache.set(key, new RegExp(pattern, flags));
    }
    return regexCache.get(key);
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
// OPTIMIZATION: Data cache to prevent duplicate API calls
const dataCache = new Map();

const DataService = {

    //============== ดึงจาก google sheet ======================//
    // OPTIMIZATION: Added caching for API responses
    async fetchSheetData(sheetName) {
        // Check cache first
        if (dataCache.has(sheetName)) {
            return dataCache.get(sheetName);
        }
        const spreadsheetId = '1zhp1OMsuil2DhjttNGRpvi1SOPlbT5FLGRYqOMruIN4';
        
        // ดึงข้อมูลผ่าน Google Endpoint ที่ให้โครงสร้างข้อมูลแบบตารางมาประมวลผลต่อได้ง่าย
        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}`;

        // 🔗 log บอกเมื่อระบบเริ่มทำการยิงไปเชื่อมต่อกับ Google Sheet

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

            // ส่งข้อมูลกลับไปในโครงสร้างแบบเดิมที่โค้ดเก่าต้องการ
            const result = {
                cols: formattedCols,
                rows: formattedRows
            };

            // OPTIMIZATION: Cache the result for next time
            dataCache.set(sheetName, result);
            return result;

        } catch (err) {
            // ❌ log แจ้งเตือนกรณีที่การเชื่อมต่อเกิดการพังหรือดึงข้อมูลไม่ได้
            // OPTIMIZATION: Clear cache on error to allow retry
            dataCache.delete(sheetName);
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
    return mapping;
}
    
};



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
// ==================== Scoring Service ====================
// OPTIMIZATION: Cache for frequently calculated values
const ScoringService = {
    matchedWBSCache: new Set(),
    scoreCache: new Map(), // Cache score calculations by WBS

    clearCache() {
        this.matchedWBSCache.clear();
        this.scoreCache.clear(); // Clear score cache too
    },

    updateMatchedWBS(wbs) {
        if (wbs) this.matchedWBSCache.add(wbs.toString().trim());
    },

    // OPTIMIZATION: Refactored parameters with cache support
    calculateScoreDetails(valA, valY, valX, rowCount, vvipData, isFullyAllocated = false, valOpenDate = "", isFinalCalc = false) {
        // OPTIMIZATION: Cache key for score calculations
        const cacheKey = `${valA}|${valY}|${valX}|${rowCount}|${isFullyAllocated}`;

        // Return cached score if available and not final calculation (final needs logging)
        if (!isFinalCalc && this.scoreCache.has(cacheKey)) {
            return this.scoreCache.get(cacheKey);
        }

        let score = 0;
        let diffDays = null;

        const currentWBS = valA ? valA.toString().trim() : "";
        const strY = valY ? valY.toString().trim() : "";
        const strX = valX ? valX.toString().trim() : "";
        const strOpenDate = valOpenDate ? valOpenDate.toString().trim() : "";

        // OPTIMIZATION: Use cached calculations where possible
        diffDays = this._calculateDaysRemaining(strX);
        const strategicPoints = this._calculateStrategicPoints(currentWBS, vvipData);
        const timingPoints = this._calculateTimingPoints(strY, diffDays, strX);
        const agingDays = this._calculateAgingDays(strOpenDate);
        const agingPoints = agingDays > 0 ? (agingDays / 10000) : 0;

        // 🎯 เช็กเงื่อนไข +2000 แต้มตรงนี้: ถ้าได้ของครบ (isFullyAllocated = true) ปรับเป็น 2000 แต้มเต็มทันที
        const readinessPoints = isFullyAllocated ? 2000 : this._calculateReadinessPoints(rowCount);

        // รวมคะแนนสุทธิ
        score = strategicPoints + timingPoints + agingPoints + readinessPoints;

        const result = { totalScore: score, daysRemaining: diffDays };

        // OPTIMIZATION: Cache the result for reuse
        if (!isFinalCalc) {
            this.scoreCache.set(cacheKey, result);
        }

        // 📢 [CONSOLE LOG] จะแสดงผลที่นี่ที่เดียวเมื่อมีการสั่งเปิดระบบ Log (isFinalCalc = true)
      if (isFinalCalc) {
            let timingDetail = '';
            if (strY === "งาน 02.2") timingDetail = 'งาน 02.2 (Fix 3,000)';
            else if (strY === "เกินกำหนด") timingDetail = `เกินกำหนด (${Math.abs(diffDays)} วัน)`;
            else if (diffDays !== null && diffDays >= 0 && diffDays <= 30) timingDetail = `ใกล้กำหนดใน 30 วัน (เหลือ ${diffDays} วัน)`;
            else if (diffDays !== null && diffDays > 30) timingDetail = `เกิน 30 วัน (Fix 500)`;
            else timingDetail = 'เงื่อนไขอื่นๆ / ไม่ระบุวัน';

        }
        return result;
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

        const rowsByWBS = new Map();
        rawDatabase.rows.forEach(row => {
            const wbs = getCellValue(row.c[0]).toString().trim();
            if (!rowsByWBS.has(wbs)) {
                rowsByWBS.set(wbs, []);
            }
            rowsByWBS.get(wbs).push(row);
        });

        // ================================================================================================
        // STEP 1: เตรียมคิวงานรอบแรก (ใช้คะแนนตั้งต้นก่อนแจกของเพื่อจัดลำดับความสำคัญ)
        // ================================================================================================
        const queue = rawDatabase.rows.map(row => {
            const wbs = getCellValue(row.c[0]).toString().trim();
            const rowsOfWbs = rowsByWBS.get(wbs) || [];

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
        const allocatedByWBS = new Map();

        allocatedResults.forEach(item => {
            if (!allocatedByWBS.has(item.wbs)) {
                allocatedByWBS.set(item.wbs, []);
            }
            allocatedByWBS.get(item.wbs).push(item);
        });

        uniqueWBS.forEach(wbs => {
            const items = allocatedByWBS.get(wbs) || [];
            
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


        finalRankPrepList.forEach((item, index) => {
            const rank = index + 1;
            const statusLabel = item.status === "lock" ? "🔒 LOCKED " :
                                item.status === "green" ? "🟢 FULLY  " :
                                (item.status === "blue" ? "🔵 MAIN   " :
                                (item.status === "yellow" ? "🟡 PARTIAL" : "🔴 NONE   "));

            const budgetStr = item.budget.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});

            ScoringService.calculateScoreDetails(
                item.raw.valA, item.raw.valY, item.raw.valX,
                item.rowCount, vvipData, item.isFullyAllocated, item.raw.valOpenDate, true
            );
        });

        return { allocatedResults, finalWbsScores, wbsStatusMap };
    },


    updatePieChart(data) {
        if (typeof updatePieChart === 'function') {
            updatePieChart(data);
        }
    },


updateDashboardCharts: function(tableSelector) {
        // OPTIMIZATION: Validate table once, then get API reference immediately
        if (!$.fn.DataTable.isDataTable(tableSelector)) return;

        const tableApi = $(tableSelector).DataTable();
        const allRowsData = [];

        // OPTIMIZATION: Single pass through table data instead of multiple queries
        tableApi.rows({ search: 'applied' }).nodes().to$().each(function() {
            const $row = $(this);

            // 📌 Batch DOM queries instead of individual lookups
            const $cells = $row.find('td');
            if ($cells.length < 7) return; // Safety check

            const tokenSpan = $cells.eq(1).find('span').text();
            const currentStatus = tokenSpan.replace('status-', '').toLowerCase().trim();
            const peaName = $cells.eq(4).text().trim() || "ไม่ระบุการไฟฟ้า";
            const rawMoney = parseFloat($cells.eq(6).attr('data-order')) || 0;

            allRowsData.push({ status: currentStatus, pea: peaName, money: rawMoney });
        });
// OPTIMIZATION: Batch update both charts without delay
        this.updatePieChart(allRowsData);
        this.updateBarChart(allRowsData);
    },

    /**
     * ==================================================================================
     * 🍕 [หัวข้อ 1.2] ฟังก์ชันย่อย: คำนวณสะสมและพ่นข้อมูลใส่กราฟวงกลม (Pie/Doughnut Chart)
     * ==================================================================================
     * ทำหน้าที่แยกนับจำนวนงาน (Count) และรวมเม็ดเงิน (Money) ของแต่ละสถานะแยกขาดจากกันเป็น 5 สาย
     * OPTIMIZATION: Consolidated status counting logic
     */
    updatePieChart: function(cleanData) {
        // OPTIMIZATION: Use object instead of separate variables for status tracking
        const statusData = {
            'green': { count: 0, money: 0 },
            'blue': { count: 0, money: 0 },
            'yellow': { count: 0, money: 0 },
            'red': { count: 0, money: 0 },
            'lock': { count: 0, money: 0 }
        };

        // OPTIMIZATION: Single pass through data
        cleanData.forEach(item => {
            let status = item.status;
            // Normalize status values
            if (status === 'match') status = 'green';
            if (status === 'shortage') status = 'red';
            if (status.includes('lock')) status = 'lock';

            if (statusData[status]) {
                statusData[status].count += 1;
                statusData[status].money += item.money;
            }
        });

        // หากตัวอินสแตนซ์ของกราฟวงกลมพร้อมใช้งาน ให้ทำการอัปเดตข้อมูลพิกัดภายในทันที
        if (GraphRender.myPieChart) {
            // OPTIMIZATION: Build arrays in correct order
            const labels = ['green', 'blue', 'yellow', 'red', 'lock'];
            GraphRender.myPieChart.data.datasets[0].data = labels.map(k => statusData[k].count);
            GraphRender.myPieChart.data.datasets[0].customMoney = labels.map(k => statusData[k].money);

            // สั่งให้กราฟวาดและเรนเดอร์ตัวเองใหม่แบบอนิเมชันเสี้ยววินาที
            GraphRender.myPieChart.update();
        }
    },

    /**
     * ==================================================================================
     * 📊 [หัวข้อ 1.3] ฟังก์ชันย่อย: คำนวณสะสมและพ่นข้อมูลใส่กราฟแท่ง (Bar Chart)
     * ==================================================================================
     * ทำหน้าที่จัดกลุ่มงานแยกตาม "รายชื่อการไฟฟ้า" ก่อน แล้วจึงแตกแขนงจำนวนชิ้นและเงินทุนในแต่ละสังกัด
     * OPTIMIZATION: Consolidated PEA grouping logic
     */
    updateBarChart: function(cleanData) {
        // OPTIMIZATION: Use Map for better performance with large datasets
        const peaGroupMap = new Map();
        const statusKeys = ['green', 'blue', 'yellow', 'red', 'lock'];

        // OPTIMIZATION: Build status data structure in single pass
        cleanData.forEach(item => {
            let status = item.status;
            // Normalize status values
            if (status === 'match') status = 'green';
            if (status === 'shortage') status = 'red';
            if (status.includes('lock')) status = 'lock';

            if (!peaGroupMap.has(item.pea)) {
                const statusObj = {};
                statusKeys.forEach(k => {
                    statusObj[`${k}Count`] = 0;
                    statusObj[`${k}Money`] = 0;
                });
                peaGroupMap.set(item.pea, { ...statusObj, totalCount: 0 });
            }

            const group = peaGroupMap.get(item.pea);
            group[`${status}Count`] += 1;
            group[`${status}Money`] += item.money;
            group.totalCount += 1;
        });

        // OPTIMIZATION: Build arrays efficiently
        if (GraphRender.myBarChart) {
            const peaLabels = Array.from(peaGroupMap.keys()).sort();

            // OPTIMIZATION: Pre-allocate arrays and fill in single pass
            const datasets = statusKeys.map(() => ({ data: [], money: [] }));

            peaLabels.forEach(peaName => {
                const group = peaGroupMap.get(peaName);
                statusKeys.forEach((status, idx) => {
                    datasets[idx].data.push(group[`${status}Count`]);
                    datasets[idx].money.push(group[`${status}Money`]);
                });
            });

            // ดันป้ายแกน X และ ข้อมูลฝังซ่อนส่วนรวมเข้าสู่ชุด Config กราฟแท่ง
            GraphRender.myBarChart.data.labels = peaLabels;
            GraphRender.myBarChart.data.customTotalCounts = peaLabels.map(pea => peaGroupMap.get(pea).totalCount);

            // OPTIMIZATION: Update all datasets efficiently
            statusKeys.forEach((status, idx) => {
                GraphRender.myBarChart.data.datasets[idx].data = datasets[idx].data;
                GraphRender.myBarChart.data.datasets[idx].customMoney = datasets[idx].money;
            });

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
function updateDashboardCards(tableSelector) {
    // ส่งตาราง Instance เข้าไปตรงๆ เพื่อให้ฟังก์ชันย่อยเอาไปจัดการฟิลเตอร์ต่อได้
    const table = $(tableSelector).DataTable();
    ShowTotalJobs(table);
}

function updateDashboardCardsDebounced(tableSelector) {
    debounce('updateCards', () => updateDashboardCards(tableSelector), 250);
}

function ShowTotalJobs(tableInstance) {
    // ✨ แก้จุดที่ 1: นับจำนวนเฉพาะงานที่ผ่านการฟิลเตอร์แล้วเท่านั้น ({ search: 'applied' })
    const totalCount = tableInstance.rows({ search: 'applied' }).count();
    $('#total-jobs-count').text(totalCount.toLocaleString());

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
        { title: "ที่ได้ / ค้างเบิก" },
        { title: "ค้างเบิก" },
        { title: "จำนวนที่ได้" }
        
    ];
 
    const dataSet = noStockData.map(res => {
        const partType = materialTypeMap[res.partID?.toString().trim()] || "-";
        return [
            res.wbs     || "-",   // 0
            res.partID  || "-",   // 1
            res.partName|| "-",   // 2
            partType,             // 3 ประเภท
           { assigned: res.assigned || 0, pending: res.pending || 0 },
            res.pending || 0,
            res.assigned || 0
            
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
            className: 'px-3 py-2 mb-0 text-center text-slate-500 uppercase align-middle bg-white rounded-lg cursor-pointer text-xs shadow-soft-md hover:scale-102 active:opacity-85',
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
    updateDashboardCardsDebounced('#tableRequirement_Data');
}
// ==================== Filter Module ====================
// OPTIMIZATION: Helper function to reduce duplicated filter setup code
function createFilterSetup(config) {
    const { dropdownSelector, containerSelector, inputSelector, clearSelector, classPrefix, columnIndex, dataExtractor, multilineMatch } = config;

    return {
        setup(tableInstance, rawData) {
            const $dropdown = getCachedElement(dropdownSelector);
            const $container = $dropdown.find(containerSelector);
            const $input = getCachedElement(inputSelector);
            const $clear = getCachedElement(clearSelector);

            $container.empty();

            let list = [];
            rawData.rows.forEach(row => {
                let val = dataExtractor(row);
                if (val && val !== "-" && !list.includes(val)) list.push(val);
            });

            list.sort().forEach((item, index) => {
                const uniqueId = `dropdown-${classPrefix}-${index}`;
                const html = `
                    <li class="w-full flex items-center p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded ${classPrefix}-filter-item">
                        <label for="${uniqueId}" class="w-full flex items-center justify-between cursor-pointer m-0">
                            <div class="inline-flex items-center font-medium text-heading text-sm">${item}</div>
                            <input id="${uniqueId}" type="checkbox" value="${item}" class="${classPrefix}-checkbox w-4 h-4 border border-default-strong rounded-xs bg-neutral-secondary-strong">
                        </label>
                    </li>
                `;
                $container.append(html);
            });

            $input.off('input').on('input', function () {
                const searchText = $(this).val().toLowerCase();
                $container.find(`.${classPrefix}-filter-item`).each(function () {
                    $(this).toggle($(this).text().toLowerCase().includes(searchText));
                });
            });

            const applyFilter = () => {
                let selected = [];
                $container.find(`.${classPrefix}-checkbox:checked`).each(function () {
                    selected.push($(this).val());
                });

                if (selected.length > 0) {
                    const regex = selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|');
                    const searchStr = multilineMatch ? regex : `^(${regex})$`;
                    tableInstance.column(columnIndex).search(searchStr, true, false).draw();
                } else {
                    tableInstance.column(columnIndex).search('').draw();
                }
                syncAllTables(tableInstance);
            };

            $container.off('change', `.${classPrefix}-checkbox`).on('change', `.${classPrefix}-checkbox`, applyFilter);
            $clear.off('click').on('click', function() {
                $container.find(`.${classPrefix}-checkbox`).prop('checked', false);
                $input.val('').trigger('input');
                $container.find(`.${classPrefix}-filter-item`).attr('style', 'display: flex !important');
                applyFilter();
            });
        }
    };
}

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

        // ✨ ดักฟังหลังจากคลิกแถวแล้ว: สั่งให้อัปเดต Dashboard ของตารางนั้นๆ ทันที
        // สมมติว่าตารางที่คุณใช้คือ #tableRequirement_Data ให้ส่ง Selector ของตารางนั้นเข้าไปครับ
        updateDashboardCardsDebounced('#tableRequirement_Data'); 
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
// OPTIMIZATION: Comprehensive performance tracking for dashboard initialization
async function initDashboard() {
    const startTime = performance.now();

    // เริ่มต้น Render โครงร่างกราฟล่วงหน้า
    GraphRender.Piegraph();
    GraphRender.BarGraph();

    try {
        const fetchStart = performance.now();

        // OPTIMIZATION: Parallel data fetching to maximize concurrency
        // 1. ดึงข้อมูลแบบ Parallel (Asynchronous) เพื่อความรวดเร็ว
        const vvipPromise = DataService.fetchVVIPData();
        const peaPromise = DataService.fetchPEANameData();
        const budgetPromise = DataService.fetchBudgetData();
        const sheetPromises = config.map(async (sheet) => {
            const data = await DataService.fetchSheetData(sheet.name);
            return { sheet, data };
        });
        const upcomingPromise = DataService.fetchUpcomingItemData(); 

        // รอมัดรวมพร้อมกันทั้งหมดเพื่อไม่ให้เกิดคอขวด
        const [vvipData, peaMapping, budgetMapping, ...restWithUpcoming] = await Promise.all([
            vvipPromise,
            peaPromise,
            budgetPromise,
            ...sheetPromises,
            upcomingPromise 
        ]);

        const fetchEnd = performance.now();
        console.group("📊 Dashboard Performance Tracker");
        console.log(`⏱️ 1. Fetching Data Time: ${((fetchEnd - fetchStart) / 1000).toFixed(2)} seconds`);

        // แยกข้อมูล Upcoming ออกจากชุด Config Sheets
        const upcomingData = restWithUpcoming.pop(); 
        const results = restWithUpcoming;

        globalVVIP = vvipData;
        peaNameMapping = peaMapping;

        const processStart = performance.now();

        // แปลงผลลัพธ์ให้อยู่ในรูปของ Map Array
        const dataMap = results.reduce((acc, curr) => {
            acc[curr.sheet.name] = curr.data;
            return acc;
        }, {});

        // เตรียมข้อมูล Material Master Map
        const materialTypeMap = {};
        const materialNoteMap = {};
        const masterKey = Object.keys(dataMap).find(key => key.toLowerCase().includes('material_master'));
        const masterData = dataMap[masterKey];

        if (masterData?.rows) {
            const cols = masterData.cols;
            const finalIdIdx = Math.max(cols.findIndex(c => c.label.includes("รหัสพัสดุ") || c.label.includes("Part")), 0);
            const finalTypeIdx = Math.max(cols.findIndex(c => c.label.includes("ประเภทพัสดุ")), 2);
            const finalNoteIdx = Math.max(cols.findIndex(c => c.label === "Not"), 7);

            masterData.rows.forEach(row => {
                if (!row?.c) return;
                const partID = getCellValue(row.c[finalIdIdx])?.toString().trim();
                if (partID) {
                    materialTypeMap[partID] = getCellValue(row.c[finalTypeIdx])?.toString().trim() || "";
                    materialNoteMap[partID] = getCellValue(row.c[finalNoteIdx])?.toString().trim() || "";
                }
            });
        }

        // สรุปยอดคำนวณคลังสินค้า (Stock)
        totalStockSummary = {};
        if (dataMap['Stock_Data']?.rows) {
            dataMap['Stock_Data'].rows.forEach(row => {
                if (!row?.c) return;
                const partID = getCellValue(row.c[0])?.toString().trim();
                const quantity = parseFloat(getCellValue(row.c[8])) || 0;
                if (partID) {
                    totalStockSummary[partID] = (totalStockSummary[partID] || 0) + quantity;
                }
            });
        }

        // คำนวณระบบจัดสรรพัสดุ
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

        // ================= วาดตารางและผูกโมดูลการทำงานต่างๆ ================= //
        config.forEach(sheet => {
            const data = dataMap[sheet.name];
            if (!data) return;

            if (sheet.name === 'Requirement_Data') {
                // Render ตารางพัสดุหลัก
                parcelTable = TableRenderer.renderRequirementTable(
                    sheet.target, data, globalVVIP, peaNameMapping,
                    alloc.finalWbsScores, alloc.wbsStatusMap, budgetMapping, wbsProgressMap
                );
                
                renderInitialStockMatch(processedAllocData, materialTypeMap);
                updateDashboardCards(sheet.target); 

                // ผูก Event การ Search, Draw ตาราง และอัปเดตชาร์ตเข้าด้วยกันเพื่อลดภาระ CPU
                $(sheet.target).on('draw.dt search.dt', function(e) {
                    updateDashboardCardsDebounced(sheet.target);
                    if (e.type === 'search') {
                        AllocationService.updateDashboardCharts(sheet.target);
                    }
                });                
                
                noStockTableInstance = TableRenderer.renderNoStockTable(alloc.allocatedResults, materialTypeMap);
                obsoleteTableInstance = TableRenderer.renderObsoleteTable(alloc.allocatedResults, materialTypeMap, materialNoteMap);
                
                // ติดตั้งระบบฟิลเตอร์ค้นหาขั้นสูง
                FilterModule.setupFilterID_WBS(parcelTable, data);
                FilterModule.setupFilterType_WBS(parcelTable, data);
                FilterModule.setupFilterPEA_WBS(parcelTable, peaNameMapping);
                FilterModule.setupFilterLight(parcelTable, data, alloc.wbsStatusMap);
                FilterModule.setupFilterProjectGroup(parcelTable, data);
                FilterModule.setupFilterBudgetCIP(parcelTable, data);

                // สั่งอัปเดตกราฟวงกลมทันทีหลังสร้างตารางเสร็จ
                AllocationService.updateDashboardCharts(sheet.target);

            } else if (sheet.name === 'Stock_Data') {
                mb52Table = TableRenderer.renderStockTable(sheet.target, data, materialTypeMap, "stock");

            } else if (sheet.name !== 'Material_Master') {
                TableRenderer.renderGenericTable(sheet.target, data);
            }
        });

        // ตรวจสอบและ Render ตารางงานแผนงานล่วงหน้า (Upcoming)
        if (upcomingData?.rows?.length > 0) {
             upcomingTableInstance = renderUpcomingTable(upcomingData);
            if (upcomingTableInstance) {
                FilterModule.setupFilterUpcoming_MaterialID(upcomingTableInstance, upcomingData);
                FilterModule.setupFilterUpcoming_MaterialName(upcomingTableInstance, upcomingData);
                FilterModule.setupFilterUpcoming_PurchaseGroup(upcomingTableInstance, upcomingData);
            }
        }

        setupGlobalEvents();

        // สิ้นสุดกระบวนการปิดม่าน Loader
        $('#main-page-loader').fadeOut(300, function() {
            $(this).remove();
        });

        const processEnd = performance.now();
        console.log(`⏱️ 2. Processing & Rendering Time: ${((processEnd - processStart) / 1000).toFixed(2)} seconds`);
        console.log(`🚀 Total Execution Time: ${((processEnd - startTime) / 1000).toFixed(2)} seconds`);
        console.groupEnd();
      
    } catch (err) {
        console.error("❌ Dashboard Initialization Error:", err);
        $('#main-page-loader').remove();
    }
}

// Document Ready
$(document).ready(() => initDashboard());