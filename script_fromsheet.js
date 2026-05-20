// ==================== Configuration ====================
const SPREADSHEET_ID = '1zhp1OMsuil2DhjttNGRpvi1SOPlbT5FLGRYqOMruIN4';

const config = [
    { name: 'Material_Master', target: '#tableParcel' },
    { name: 'Stock_Data', target: '#tableMB52' },
    { name: 'Requirement_Data', target: '#tableRequirement_Data' },
    { name: 'Upcoming_Item', target: '#tableUpcoming_Item' },
    { name: 'Budget_Data', target: '#tableUBudget_Data' },
    { name: 'VVIP_Data', target: '#tableVVIP_Data' }
];

// ==================== Global Variables ====================
let stockTableInstance = null;
let parcelTable, mb52Table;
let globalVVIP = [];
let rawRequirementDatabase = null;
let peaNameMapping = {}; // ผูก PEA Code (Column A) -> PEA Name (Column B)
// เพิ่มตัวแปร Global ไว้ด้านบนสุดของไฟล์
let totalStockSummary = {};

// ==================== Data Service Module ====================
// นำเข้าข้อมูลจาก Google Sheets
// สามารถแทนที่ได้ด้วยฟังก์ชัน MySQL ในอนาคต

const DataService = {
    /**
     * ดึงข้อมูล VVIP จาก Google Sheets
     * @returns {Promise<Array>} รายการ VVIP
     */
    async fetchVVIPData() {
        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=VVIP_Data`;
        try {
            const response = await fetch(url);
            const text = await response.text();
            const jsonData = JSON.parse(text.substring(47).slice(0, -2));
            return jsonData.table.rows;
        } catch (err) {
            console.error("Error fetching VVIP data:", err);
            return [];
        }
    },

    /**
     * ดึงข้อมูล PEA Name จาก Google Sheets
     * สร้าง mapping จาก PEA Code (Column A) -> PEA Name (Column B)
     * @returns {Promise<Object>} mapping object {peaCode: peaName}
     */
    async fetchPEANameData() {
        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=PEAName_data`;
        try {
            const response = await fetch(url);
            const text = await response.text();
            const jsonData = JSON.parse(text.substring(47).slice(0, -2));
            
            const mapping = {};
            jsonData.table.rows.forEach(row => {
                if (!row || !row.c) return;
                const peaCode = getCellValue(row.c[0])?.toString().trim();
                const peaName = getCellValue(row.c[1])?.toString().trim();
                if (peaCode && peaName) {
                    mapping[peaCode] = peaName;
                }
            });
            
            return mapping;
        } catch (err) {
            console.error("Error fetching PEA Name data:", err);
            return {};
        }
    },



    /**
     * ดึงข้อมูลจาก Google Sheets ตามชื่อ Sheet
     * @param {string} sheetName - ชื่อของ Sheet
     * @returns {Promise<Object>} ข้อมูลตารางใน format Google Sheets
     */
    async fetchSheetData(sheetName) {
        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
        try {
            const response = await fetch(url);
            const text = await response.text();
            const jsonData = JSON.parse(text.substring(47).slice(0, -2));
            return jsonData.table;
        } catch (err) {
            console.error(`Error fetching sheet ${sheetName}:`, err);
            return { cols: [], rows: [] };
        }
    }
};

// ==================== Utility Functions ====================

/**
 * ดึงค่าจาก Cell (ใช้ .f สำหรับข้อความที่จัดรูปแบบแล้ว)
 * @param {Object} cell - Object ของ Cell จาก Google Sheets
 * @returns {*} ค่าของ Cell
 */
function getCellValue(cell) {
    if (!cell) return '';
    return cell.f ? cell.f : (cell.v !== null ? cell.v : '');
}

// ==================== Scoring Module ====================
// คำนวณคะแนนสำหรับงาน Requirement

const ScoringService = {
    /**
     * คำนวณคะแนนและจำนวนวันคงเหลือ
     * @param {string} valA - หมายเลขงาน
     * @param {string} valY - สถานะงาน
     * @param {string} valX - วันสิ้นสุด
     * @param {number} rowCount - จำนวนรายการงาน
     * @param {Array} vvipData - ข้อมูล VVIP
     * @returns {Object} {totalScore, daysRemaining}
     */
    calculateScoreDetails(valA, valY, valX, rowCount, vvipData) {
        let score = 0;
        let diffDays = null;
        
        const strA = valA ? valA.toString().trim() : "";
        const strY = valY ? valY.toString().trim() : "";
        const strX = valX ? valX.toString().trim() : "";

        // คำนวณวันคงเหลือ
        diffDays = this._calculateDaysRemaining(strX);

        // P1: Strategic Points
        score += this._calculateStrategicPoints(strA, vvipData);

        // P2: Timing Points
        score += this._calculateTimingPoints(strY, diffDays, strX);

        // P3: Readiness Points
        score += this._calculateReadinessPoints(rowCount);

        return { totalScore: score, daysRemaining: diffDays };
    },

    /**
     * คำนวณจำนวนวันคงเหลือจากวันปัจจุบัน
     * @private
     */
    _calculateDaysRemaining(dateStr) {
        if (!dateStr) return null;

        const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (!dateMatch) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1;
        const yearCE = parseInt(dateMatch[3]) - 543;
        const deadline = new Date(yearCE, month, day);

        if (isNaN(deadline.getTime())) return null;

        return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    },

    /**
     * P1: Strategic Points (1,000 หรือ 5,000 แต้ม)
     * @private
     */
    _calculateStrategicPoints(strA, vvipData) {
        if (strA === "") return 0;

        let points = 1000;
        
        if (vvipData && Array.isArray(vvipData)) {
            const isVVIP = vvipData.some(row => {
                const vvipVal = (row.c && row.c[1] && row.c[1].v) 
                    ? row.c[1].v.toString().trim() 
                    : "";
                return vvipVal === strA;
            });
            if (isVVIP) points += 4000;
        }

        return points;
    },

    /**
     * P2: Timing Points (0-3,000 แต้ม)
     * @private
     */
    _calculateTimingPoints(strY, diffDays, strX) {
        if (strY === "งาน 02.2") {
            return 3000;
        } else if (strY === "เกินกำหนด") {
            return 2000;
        } else if (diffDays !== null) {
            return diffDays <= 30 ? 1500 : 500;
        } else if (strY === "ไม่เกินกำหนด" && strX === "") {
            return 500;
        }
        return 0;
    },

    /**
     * P3: Readiness Points (500-1,800 แต้ม)
     * @private
     */
    _calculateReadinessPoints(rowCount) {
        if (rowCount === undefined || rowCount === null) return 0;
        return rowCount <= 5 ? 1800 : 500;
    }
};
const AllocationService = {
    /**
     * คำนวณการจัดสรรพัสดุตามลำดับความสำคัญ
     * @returns {Array} รายการที่จัดสรรแล้วทั้งหมด
     */
    calculateAllocation(rawDatabase, vvipData, totalStock) {
        if (!rawDatabase || !rawDatabase.rows) return [];

        // 1. หา Unique WBS เพื่อคำนวณคะแนนและลำดับความสำคัญ
        const wbsScoringMap = new Map();
        const uniqueWBS = [...new Set(rawDatabase.rows.map(r => getCellValue(r.c[0]).toString().trim()))];

        uniqueWBS.forEach(wbs => {
            const rows = rawDatabase.rows.filter(r => getCellValue(r.c[0]).toString().trim() === wbs);
            if (rows.length > 0) {
                const firstRow = rows[0];
                const rowCount = rows.length;
                const scoreDetails = ScoringService.calculateScoreDetails(
                    getCellValue(firstRow.c[0]), 
                    getCellValue(firstRow.c[24]), 
                    getCellValue(firstRow.c[23]), 
                    rowCount, 
                    vvipData
                );
                wbsScoringMap.set(wbs, { score: scoreDetails.totalScore, count: rowCount });
            }
        });

        // 2. สร้างรายการพัสดุทั้งหมด (Flat List) และเรียงลำดับ
        const queue = rawDatabase.rows.map(row => {
            const wbs = getCellValue(row.c[0]).toString().trim();
            const info = wbsScoringMap.get(wbs);
            return {
                wbs: wbs,
                partID: getCellValue(row.c[3])?.toString().trim(),
                partName: getCellValue(row.c[4]),
                pending: parseFloat(getCellValue(row.c[14])) || 0,
                score: info.score,
                rowCount: info.count
            };
        });

        // เรียง: คะแนนมากไปน้อย -> จำนวนรายการน้อยไปมาก
        queue.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.count - b.count;
        });

        // 3. เริ่มการจัดสรร (Allocation Logic)
        const currentStock = { ...totalStock }; // Copy เพื่อไม่ให้กระทบค่าหลัก
        return queue.map(item => {
            const stockAvailable = currentStock[item.partID] || 0;
            const assigned = Math.min(stockAvailable, item.pending); // ได้ไม่เกินที่ค้าง และไม่เกินที่มี

            currentStock[item.partID] = stockAvailable - assigned;

            return {
                ...item,
                assigned: assigned,
                remainingAfter: currentStock[item.partID],
                totalStock: totalStock[item.partID] || 0
            };
        });
    }
};
// ==================== Table Rendering Module ====================
function renderInitialStockMatch() {
    // ใช้ AllocationService ตัวเดิมที่คุณปิ๊กมีอยู่แล้ว
    const allData = AllocationService.calculateAllocation(
        rawRequirementDatabase, 
        globalVVIP, 
        totalStockSummary
    );

    const tableContent = {
        cols: [
            { label: "หมายเลขงาน" }, // เพิ่มเพื่อรองรับการ Filter ทีหลัง
            { label: "รหัสพัสดุ" },
            { label: "ชื่อพัสดุ" },
            { label: "ค่าค้างเบิก" },
            { label: "จำนวนที่ได้" },
            { label: "สต็อกคงเหลือ" },
            { label: "สต็อกทั้งหมด" }
        ],
        rows: allData.map(res => ({
            c: [
                { v: res.wbs },
                { v: res.partID },
                { v: res.partName },
                { v: res.pending },
                { v: res.assigned },
                { v: res.remainingAfter },
                { v: res.totalStock }
            ]
        }))
    };

    // เก็บ Instance ไว้ใช้งาน Search
    stockMatchTableInstance = TableRenderer.renderStockTable('#tableStockMatch', tableContent);
}
const TableRenderer = {
    /**
     * วาด Stock Table
     */
renderStockTable(target, tableData) {
    const $el = $(target);
    const colHeaders = tableData.cols.map(col => ({ title: col.label || "" }));
    
    const dataSet = tableData.rows.map(row => row.c.map((cell, idx) => {
        let val = cell ? cell.v : "";
        if (idx >= 2 && !isNaN(val) && val !== "" && val !== null) {
            return parseFloat(val);
        }
        return val;
    }));

    if ($.fn.DataTable.isDataTable(target)) {
        $el.DataTable().destroy();
        $el.empty();
    }

    const table = $el.DataTable({
        "data": dataSet,
        "columns": colHeaders,
        "pageLength": 10,
        "responsive": true,
        // ปรับแต่งสไตล์ Wrapper ของ DataTable ด้วย Tailwind
    "dom": '<"flex justify-between items-center mb-4"<"flex items-center"f><"flex items-center"l>>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
    "columnDefs": [
    { 
        "targets": "_all", 
        // ปรับ px-4 เป็น px-2 หรือ px-3 เพื่อให้ประหยัดพื้นที่แนวนอนใน Card
        "className": "py-3 px-3 border-b border-gray-100 text-slate-600 font-normal" 
    },
            { "targets": 0, "visible": (target === '#tableMB52') },
            { 
                "targets": 2, 
                "className": "  text-red-600 text-base", 
                "render": $.fn.dataTable.render.number(',', '.', 0)
            },
            { 
                "targets": 3, 
                "className": "text-end  text-blue-600 text-base", 
                "render": $.fn.dataTable.render.number(',', '.', 0)
            },
            { "targets": [4, 5], "className": "text-end text-medium text-gray-500" }
        ],
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.13.4/i18n/th.json",
            "search": "", // ลบ text "ค้นหา" ออกเพื่อใช้ placeholder แทน
            "searchPlaceholder": "ค้นหาพัสดุ..."
        },
        // ปรับแต่งหัวตารางด้วย Tailwind
        "headerCallback": function(thead) {
            $(thead).find('th').addClass('bg-gray-50 text-gray-700 font-bold text-base py-3 px-4 text-left border-b-2 border-gray-200');
        }
    });

    // ตกแต่งช่อง Search Input ด้วย Tailwind เพิ่มเติมหลังวาดเสร็จ
    $(`${target}_filter input`).addClass('border border-gray-300 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent');

    return table; 
},

    /**
     * วาด Requirement Data Table
     */
    renderRequirementTable(selector, data, vvipData, peaNameMapping) {
        const $el = $(selector);
        
        if ($.fn.DataTable.isDataTable(selector)) {
            $el.DataTable().destroy();
            $el.empty();
        }

        let html = this._buildTableHTML(data, vvipData, peaNameMapping);
        $el.html(html);

        const tableInstance = $el.DataTable({
            "language": { "url": "//cdn.datatables.net/plug-ins/1.13.4/i18n/th.json" },
            "pageLength": 10,
            "responsive": true,
            "order": [[4, "desc"]], 
            "dom": '<"d-flex justify-content-end align-items-center gap-2 mb-3"fl>rt<"row mt-3"<"col-md-6"i><"col-md-6"p>>'
        });

        return tableInstance;
    },

    /**
     * วาด Generic Table (สำหรับ Sheet อื่นๆ)
     * @private
     */
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

        const tableInstance = $el.DataTable({
            "language": { "url": "//cdn.datatables.net/plug-ins/1.13.4/i18n/th.json" },
            "pageLength": 10,
            "responsive": true
        });

        return tableInstance;
    },

    /**
     * สร้าง HTML ของตาราง Requirement
     * @private
     */
    _buildTableHTML(data, vvipData, peaNameMapping = {}) {
        const headerStyle = `style="color: #344767 !important;"`;
        const textStyle = `style="color: #67748E !important;"`;
        const headerClass = `px-6 py-3 font-bold text-left uppercase align-middle bg-transparent border-b border-gray-200 shadow-none text-xs border-b-solid tracking-none whitespace-nowrap`;

        let html = '<thead class="table-light"><tr>';
        html += `<th ${headerStyle} class="${headerClass}">หมายเลขงาน</th>`;
        html += `<th ${headerStyle} class="${headerClass}">ชื่องาน</th>`;
        html += `<th ${headerStyle} class="${headerClass}">การไฟฟ้า</th>`;
        html += `<th ${headerStyle} class="${headerClass}">สถานะงาน</th>`;
        html += `<th ${headerStyle} class="${headerClass}">จำนวนวันคงเหลือ</th>`;
        html += `<th ${headerStyle} class="${headerClass} text-right">คะแนนสะสม</th>`;
        html += `<th ${headerStyle} class="${headerClass} text-center">จำนวนรายการ</th>`;
        html += '</tr></thead><tbody>';

        const uniqueMap = new Map();
        const countMap = new Map();

        // นับจำนวนงาน (Count) ของแต่ละ WBS
        data.rows.forEach(row => {
            if (!row || !row.c) return;
            let valA = getCellValue(row.c[0]).toString().trim();
            if (valA !== "") {
                countMap.set(valA, (countMap.get(valA) || 0) + 1);
            }
        });

        // จัดการ Group ข้อมูลให้เหลือ Unique หมายเลขงาน
        data.rows.forEach(row => {
            if (!row || !row.c) return;
            let valA = getCellValue(row.c[0]).toString().trim();
            if (valA !== "" && !uniqueMap.has(valA)) {
                uniqueMap.set(valA, row);
            }
        });

        // วนลูปสร้างแถว
        Array.from(uniqueMap.values()).forEach(row => {
            let valA = getCellValue(row.c[0]).toString().trim();
            let valD = getCellValue(row.c[3]) || "";
            let valE = getCellValue(row.c[4]) || "";
            let valO = getCellValue(row.c[14]) || 0;
            let valT = getCellValue(row.c[19]);
            let valW = getCellValue(row.c[22]) || "";  // PEA Code (Column W)
            let valX = getCellValue(row.c[23]);
            let valY = getCellValue(row.c[24]);

            // ค้นหาชื่อการไฟฟ้าจาก mapping
            let peaName = peaNameMapping[valW] || valW || "-";

            let rowCount = countMap.get(valA) || 0;
            let result = ScoringService.calculateScoreDetails(valA, valY, valX, rowCount, vvipData);
            
            let dayDisplay = "-";
            let dayClass = "";
            if (result.daysRemaining !== null) {
                dayDisplay = result.daysRemaining + " วัน";
                if (result.daysRemaining < 0) dayClass = "text-danger fw-bold";
            } else if (valY === "ไม่เกินกำหนด" && valY !== "งาน 02.2") {
                dayDisplay = "ยังไม่เกิด AUC";
                dayClass = "text-muted small";
            }

            html += `<tr class="clickable-requirement" data-partid="${valD}" data-partname="${valE}" data-pending="${valO}" style="cursor: pointer;">`;
            html += `<td ${textStyle}>${valA}</td>`;
            html += `<td ${textStyle}>${valT}</td>`;
            html += `<td ${textStyle}><strong>${peaName}</strong></td>`;
            html += `<td ${textStyle}>${valY}</td>`;
            html += `<td ${textStyle} class="${dayClass}">${dayDisplay}</td>`;
            html += `<td class="fw-bold text-primary text-end">${result.totalScore.toLocaleString()}</td>`;
            html += `<td ${textStyle} class="text-center"><span class="badge rounded-pill bg-secondary">${rowCount} รายการ</span></td>`;
            html += '</tr>';
        });

        html += '</tbody>';
        return html;
    }
};

// ==================== Filter Module ====================

const FilterModule = {
    /**
     * สร้าง Filter สำหรับหมายเลขงาน
     */
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
            allowClear: true 
        });

        $filter.on('change', function() {
            const val = $(this).val();
            table.column(0).search(val ? '^' + val + '$' : '', true, false).draw();
        });
    },

    /**
     * สร้าง Filter สำหรับสถานะงาน
     */
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
            placeholder: 'ค้นหาสถานะงาน...', 
            allowClear: true 
        });

        $filter.on('change', function() {
            const val = $(this).val();
            table.column(3).search(val ? '^' + val + '$' : '', true, false).draw();
        });
    },



setupFilterPEA_WBS(table, peaNameMapping) {
        const $filter = $('#FilterPEA_WBS'); // <--- เช็ก ID นี้ใน HTML ด้วย
        if ($filter.length === 0) return; // ป้องกัน Error ถ้าหา Element ไม่เจอ

        $filter.empty().append('<option value="">ทั้งหมด (การไฟฟ้า)</option>');

        const peaNames = Object.values(peaNameMapping);
        let list = [];

        peaNames.forEach(name => {
            // ดักคำว่า "ชื่อ" ที่เป็นหัวคอลัมน์ออก
            if (name && name !== "ชื่อ") { 
                if (!list.includes(name)) {
                    list.push(name);
                }
            }
        });

        list.sort().forEach(item => {
            $filter.append(`<option value="${item}">${item}</option>`);
        });

        $filter.select2({ 
            theme: 'bootstrap-5', 
            width: '100%',
            placeholder: 'เลือกการไฟฟ้า...', 
            allowClear: true 
        });

        $filter.on('change', function() {
            const val = $(this).val();
            // ค้นหาในคอลัมน์ Index 2 (การไฟฟ้า) ของตารางหลัก
            table.column(2).search(val ? '^' + val + '$' : '', true, false).draw();
        });
    }



};

// ==================== Event Handlers ====================


function setupRowClickEvent() {
    $(document).off('click', 'tr.clickable-requirement').on('click', 'tr.clickable-requirement', function() {
        // ดึงหมายเลข WBS จากคอลัมน์แรก
        const selectedWBS = $(this).find('td:first').text().trim();

        // ใส่สีแถวที่เลือก
        $('#tableRequirement_Data tbody tr').removeClass('table-primary selected-row');
        $(this).addClass('table-primary selected-row');

        // กรองตารางรอง (stockMatchTableInstance) ให้แสดงเฉพาะหมายเลขงานที่เลือก
        // หมายเหตุ: คอลัมน์ 0 ในตารางรองเราเก็บหมายเลขงานไว้ (แต่ซ่อนไว้)
        if (stockMatchTableInstance) {
            stockMatchTableInstance.column(0).search('^' + selectedWBS + '$', true, false).draw();
        }
    });
}

function setupGlobalEvents() {
    // เลือก ID ปุ่มที่ต้องการใช้เป็นปุ่ม Clear Filter
    $('#resetMB52').on('click', function() {
        // --- 1. ล้าง Filter ตารางหลัก (Requirement) ---
        if (parcelTable) {
            // ล้างการค้นหาทุกคอลัมน์ และล้างช่อง Search หลัก
            parcelTable.search('').columns().search('').draw();
        }

        // --- 2. ล้าง Filter ตารางรอง (Stock Match) ---
        if (stockMatchTableInstance) {
            // ล้างการกรอง WBS (คอลัมน์ 0) และล้างช่อง Search ที่เพิ่งเพิ่มเข้าไปใหม่
            stockMatchTableInstance.search('').columns().search('').draw();
        }

        // --- 3. ล้าง Filter ตาราง Stock (MB52) ---
        if (mb52Table) {
            mb52Table.search('').draw();
        }

        // --- 4. ล้างการเลือกแถว (UI) ---
        // ลบสี Highlight ในตารางหลัก
        $('#tableRequirement_Data tbody tr').removeClass('table-primary selected-row');

        // (Optional) ล้างพวก Dropdown Filter ถ้ามี
        $('.filter-select').val(''); 

        console.log("All filters cleared.");
    });

    // เรียกฟังก์ชันจัดการการคลิกแถว
    setupRowClickEvent();
}

// ==================== Dashboard Initialization ====================

/**
 * เริ่มต้น Dashboard และโหลดข้อมูลทั้งหมด
 */
async function initDashboard() {
    try {
        // โหลด VVIP Data และ PEA Name Data พร้อมกัน
        globalVVIP = await DataService.fetchVVIPData();
        peaNameMapping = await DataService.fetchPEANameData();

        // โหลดข้อมูลจากทุก Sheet พร้อมกัน
        const sheetDataPromises = config.map(async (sheet) => {
            const data = await DataService.fetchSheetData(sheet.name);
            return { sheet, data };
        });

        const results = await Promise.all(sheetDataPromises);

        // ประมวลผลและแสดงข้อมูล
        results.forEach(({ sheet, data }) => {
            if (sheet.name === 'Requirement_Data') {
                rawRequirementDatabase = data;
                parcelTable = TableRenderer.renderRequirementTable(sheet.target, data, globalVVIP, peaNameMapping);
                
                // เรียกฟังก์ชันเพื่อแสดงข้อมูลทั้งหมดทันที
                    renderInitialStockMatch();
                
                FilterModule.setupFilterID_WBS(parcelTable, data);
                FilterModule.setupFilterType_WBS(parcelTable, data);
                FilterModule.setupFilterPEA_WBS(parcelTable, peaNameMapping);
            } else if (sheet.name === 'Stock_Data') {
                // --- ส่วนที่เพิ่มเข้ามาใหม่สำหรับ Group By สต็อก ---
                totalStockSummary = {}; // Reset ข้อมูลก่อนเริ่มประมวลผล
                
                data.rows.forEach(row => {
                    if (!row || !row.c) return;
                    
                    // รหัสพัสดุ (Index 0)
                    let partID = getCellValue(row.c[0])?.toString().trim();
                    // จำนวนพัสดุ คอลัมน์ I (Index 8)
                    let quantity = parseFloat(getCellValue(row.c[8])) || 0; 
                    
                    if (partID) {
                        // ถ้ามีรหัสนี้อยู่แล้วให้บวกเพิ่ม ถ้าไม่มีให้เริ่มที่ค่าใหม่
                        totalStockSummary[partID] = (totalStockSummary[partID] || 0) + quantity;
                    }
                });
                // ----------------------------------------------

                // วาดตาราง Stock (MB52) ปกติ
                mb52Table = TableRenderer.renderStockTable(sheet.target, data);
            }
            
            else {
                TableRenderer.renderGenericTable(sheet.target, data);
            }
        });

        setupGlobalEvents();
    } catch (err) {
        console.error("Error initializing dashboard:", err);
    }
}

// ==================== Document Ready ====================
$(document).ready(() => initDashboard());
