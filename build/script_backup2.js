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
// ==================== Constants ====================
const TABLE_STYLES = {
    headerStyle: 'color: #344767 !important;',
    textStyle: 'color: #67748E !important;',
    textBoldStyle: 'color: #1f5dda !important;',
    headerClass: 'px-6 py-3 font-bold text-left uppercase align-middle bg-transparent border-b border-gray-200 shadow-none text-m border-b-solid tracking-none whitespace-nowrap',
    cellClass: 'p-2 text-center align-middle bg-transparent border-b whitespace-nowrap shadow-transparent'
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
    return `
        <span class="ml-2 mr-1" style="
            display: inline-block;
            width: 12px;
            height: 12px;
            background: ${color.gradient};
            border-radius: 50%;
            box-shadow: 0 3px 5px ${color.shadow};
        " title="${color.title}"></span>
    `;
}

// ==================== Data Service ====================
const DataService = {
    async fetchSheetData(sheetName) {
        const url = `api/get_data.php?sheet=${encodeURIComponent(sheetName)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');

            const jsonData = await response.json();
            return jsonData.table;

        } catch (err) {
            console.error(`❌ Error fetching table ${sheetName}:`, err);
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
    }
};

// ==================== Scoring Service ====================
const ScoringService = {
    matchedWBSCache: new Set(),

    clearCache() {
        this.matchedWBSCache.clear();
    },

    updateMatchedWBS(wbs) {
        if (wbs) this.matchedWBSCache.add(wbs.toString().trim());
    },

    calculateScoreDetails(valA, valY, valX, rowCount, vvipData, isFullyAllocated = false) {
        let score = 0;
        let diffDays = null;

        const currentWBS = valA ? valA.toString().trim() : "";
        const strY = valY ? valY.toString().trim() : "";
        const strX = valX ? valX.toString().trim() : "";

        diffDays = this._calculateDaysRemaining(strX);
        score += this._calculateStrategicPoints(currentWBS, vvipData);
        score += this._calculateTimingPoints(strY, diffDays, strX);

        if (isFullyAllocated === true) {
            score += 2000;
        } else {
            score += this._calculateReadinessPoints(rowCount);
        }

        return { totalScore: score, daysRemaining: diffDays };
    },

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

    _calculateTimingPoints(strY, diffDays, strX) {
        const accumulationDays = Math.abs(diffDays || 0);

        if (strY === "งาน 02.2") {
            return 3000;
        } else if (strY === "เกินกำหนด") {
            return 2000 + (accumulationDays * 2);
        } else if (diffDays !== null && diffDays >= 0 && diffDays <= 30) {
            return 1000 + (accumulationDays * 20);
        } else if (diffDays !== null && diffDays > 30) {
            return 500;
        } else if (strY === "ไม่เกินกำหนด" && strX === "") {
            return 500;
        }
        return 0;
    },

    _calculateReadinessPoints(rowCount) {
        if (rowCount === undefined || rowCount === null) return 0;
        return rowCount <= 5 ? 1800 : 500;
    }
};

// ==================== Allocation Service ====================
const AllocationService = {
    calculateAllocation(rawDatabase, vvipData, totalStock, materialTypeMap = {}) {
        if (!rawDatabase || !rawDatabase.rows) {
            return { allocatedResults: [], finalWbsScores: new Map(), wbsStatusMap: new Map() };
        }

        const currentStock = { ...totalStock };
        const finalWbsScores = new Map();
        const wbsStatusMap = new Map();

        // สร้าง Unique WBS โดยใช้ Set (เร็วกว่า)
        const uniqueWBSSet = new Set(
            rawDatabase.rows.map(r => getCellValue(r.c[0]).toString().trim())
        );
        const uniqueWBS = Array.from(uniqueWBSSet);

        // STEP 1-2: สร้างคิว
        const queue = rawDatabase.rows.map(row => {
            const wbs = getCellValue(row.c[0]).toString().trim();
            const rowsOfWbs = rawDatabase.rows.filter(
                r => getCellValue(r.c[0]).toString().trim() === wbs
            );

            const info = ScoringService.calculateScoreDetails(
                wbs, getCellValue(row.c[24]), getCellValue(row.c[23]),
                rowsOfWbs.length, vvipData, false
            );

            return {
                wbs,
                partID: getCellValue(row.c[3])?.toString().trim(),
                partName: getCellValue(row.c[4]),
                pending: parseFloat(getCellValue(row.c[14])) || 0,
                score: info.totalScore,
                rowCount: rowsOfWbs.length,
                raw: { valA: getCellValue(row.c[0]), valY: getCellValue(row.c[24]), valX: getCellValue(row.c[23]) }
            };
        });

        // เรียงลำดับ
        queue.sort((a, b) => b.score - a.score || a.rowCount - b.rowCount);

        // STEP 3: จัดสรร
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

        // STEP 4: กำหนดสถานะสี
        uniqueWBS.forEach(wbs => {
            const items = allocatedResults.filter(r => r.wbs === wbs);

            const isGreen = items.length > 0 && items.every(i => i.pending > 0 && i.assigned >= i.pending);
            const isRed = items.length > 0 && items.every(i => i.assigned === 0);

            const mainItems = items.filter(i => {
                const currentID = i.partID?.toString().trim();
                const type = materialTypeMap[currentID];
                return type === "พัสดุหลัก";
            });
            const isBlue = mainItems.length > 0 && mainItems.every(i => i.assigned >= i.pending);

            const firstItem = items[0];
            if (firstItem) {
                const final = ScoringService.calculateScoreDetails(
                    firstItem.raw.valA, firstItem.raw.valY, firstItem.raw.valX,
                    firstItem.rowCount, vvipData, isGreen
                );

                finalWbsScores.set(wbs, final.totalScore);

                let status = "yellow";
                if (isGreen) {
                    status = "green";
                } else if (isBlue) {
                    status = "blue";
                } else if (isRed) {
                    status = "red";
                }
                wbsStatusMap.set(wbs, status);

                items.forEach(it => it.score = final.totalScore);
            }
        });

        return { allocatedResults, finalWbsScores, wbsStatusMap };
    }
};

// ==================== Table Renderer ====================
const TableRenderer = {
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
            const valAt4 = parseFloat(row[4]) || 0;
            const valAt5 = parseFloat(row[5]) || 0;
            
            // ตรวจสอบข้อมูลดิบในคอลัมน์ที่ 5 แบบละเอียด (ลบช่องว่างออก)
            const rawVal5 = row[5] ? row[5].toString().trim() : "0";

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
        return $el.DataTable({
            "data": dataSet,
            "columns": colHeaders,
            "pageLength": 10,
            "responsive": true,
            "dom": '<"flex justify-between items-center mb-4"<"flex items-center"f><"flex items-center"l>>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
            "columnDefs": [
                { "targets": "_all", "className": "py-3 px-3 border-b border-gray-100 text-slate-600 font-normal" },
                { "targets": 0, "className": "font-bold text-blue-700" },
                ...(dataSet[0] && dataSet[0].length > 3 ? [
                    { "targets": (mode === "match" ? 3 : 2), "className": "font-medium text-emerald-600" },
                    {
                        "targets": (mode === "match" ? 4 : 3),
                        "className": "text-red-600 text-base",
                        "render": $.fn.dataTable.render.number(',', '.', 0)
                    }
                ] : [])
            ],
            "headerCallback": function (thead) {
                $(thead).find('th').addClass('bg-gray-50 text-gray-700 font-bold text-base py-3 px-4 text-left border-b-2 border-gray-200');
            }
        });
    },

    renderRequirementTable(selector, data, vvipData, peaNameMapping, finalScores, wbsStatusMap) {
        const $el = $(selector);
        if ($.fn.DataTable.isDataTable(selector)) {
            $el.DataTable().destroy();
            $el.empty();
        }

        let html = this._buildTableHTML(data, vvipData, peaNameMapping, finalScores, wbsStatusMap);
        $el.html(html);

        return $el.DataTable({
            "pageLength": 10,
            "responsive": true,
            "order": [[6, "desc"]],
            "columnDefs": [
                {
                    "targets": 0,
                    "orderable": false,
                    "render": function (data, type, row) {
                        return data;
                    }
                }
            ],
            "dom": '<"d-flex justify-content-end align-items-center gap-2 mb-3"fl>rt<"row mt-3"<"col-md-6"i><"col-md-6"p>>'
        });
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

    _buildTableHTML(data, vvipData, peaNameMapping = {}, finalScores = null, wbsStatusMap = new Map()) {
        const headerStyle = `style="${TABLE_STYLES.headerStyle}"`;
        const textStyle = `class="mb-0 text-m leading-tight" style="${TABLE_STYLES.textStyle}"`;
        const textBoldStyle = `class="mb-0 font-bold text-m leading-tight" style="${TABLE_STYLES.textBoldStyle}"`;

        let html = '<thead class="table-light"><tr>';
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">สัญญาณไฟ</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass}">หมายเลขงาน</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass}">ชื่องาน</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass}">การไฟฟ้า</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass}">สถานะงาน</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass}">จำนวนวันคงเหลือ</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-right">คะแนนสะสม</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">จำนวนรายการ</th>`;
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

        // สร้างแถว
        Array.from(uniqueMap.values()).forEach(row => {
            let valA = getCellValue(row.c[0]).toString().trim();
            let valT = getCellValue(row.c[19]);
            let valW = getCellValue(row.c[22]) || "";
            let valX = getCellValue(row.c[23]);
            let valY = getCellValue(row.c[24]);

            let peaName = peaNameMapping[valW] || valW || "-";
            let rowCount = countMap.get(valA) || 0;

            let result = ScoringService.calculateScoreDetails(valA, valY, valX, rowCount, vvipData);
            let totalScore = (finalScores && finalScores.has(valA))
                ? finalScores.get(valA)
                : result.totalScore;

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

            html += `<tr class="clickable-requirement" data-wbs="${valA}" style="cursor: pointer;">
                <td class="${TABLE_STYLES.cellClass} text-center">${lightHTML}</td>
                <td class="${TABLE_STYLES.cellClass}"><div class="px-3 py-1"><h6 class="mb-0 text-sm leading-normal" ${headerStyle}>${valA}</h6></div></td>
                <td class="${TABLE_STYLES.cellClass}"><p ${textStyle}>${valT}</p></td>
                <td class="${TABLE_STYLES.cellClass}"><span ${textStyle}>${peaName}</span></td>
                <td class="${TABLE_STYLES.cellClass}"><span ${textStyle}>${valY}</span></td>
                <td class="${TABLE_STYLES.cellClass}"><span class="text-m font-bold leading-tight ${dayClass}">${dayDisplay}</span></td>
                <td class="${TABLE_STYLES.cellClass}"><span ${textBoldStyle}>${totalScore.toLocaleString()}</span></td>
                <td class="${TABLE_STYLES.cellClass}"><span class="badge rounded-pill bg-secondary">${rowCount} รายการ</span></td>
            </tr>`;
        });

        html += '</tbody>';
        return html;
    },

/**
 * แสดงตารางพัสดุที่ไม่ได้รับการจัดสรร (assigned = 0)
 * @param {Array} allocatedData - ข้อมูลการจัดสรร
 * @param {Object} materialTypeMap - ประเภทพัสดุ
 */
 renderNoStockTable(allocatedData, materialTypeMap) {
    if (!allocatedData || !Array.isArray(allocatedData)) return null;
    
    const noStockData = allocatedData.filter(res => res.assigned === 0);
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
    
        { title: "ค้างเบิก" }, 
        { title: "จำนวนที่ได้" }
    ];

    const dataSet = noStockData.map(res => [
        res.wbs || "-",
         res.partID || "-",
          res.partName || "-",

         res.pending || 0,
          res.assigned || 0
    ]);

return $el.DataTable({
    "data": dataSet,
    "columns": colHeaders,
    "pageLength": 10,
    "responsive": true,
    // ใช้คลาสครอบแบบมินิที่คุ้นเคยเพื่อเปิดใช้งานกล่องใน CSS
    "dom": '<"flex justify-between items-center mb-4"<"flex items-center"f><"flex items-center"l>>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
          
    "columnDefs": [
        { "targets": "_all", "className": "py-3 px-3 border-b border-gray-100 text-slate-600 font-normal" },
        { "targets": 0, "className": "font-bold text-blue-700" },
        
       
        {
            "targets": 3,
            "className": "text-red-600 text-base",
            "render": $.fn.dataTable.render.number(',', '.', 0)
        },
        {
            "targets": 4,
            "className": "text-red-600 font-bold text-base",
            "render": $.fn.dataTable.render.number(',', '.', 0)
        }
    ],
    "headerCallback": function (thead) {
        // แปะคลาสสีของหัวตารางตามธีมแจ้งเตือนเดิมของคุณบิ๊ก
        $(thead).find('th').addClass('bg-red-50 text-red-700 font-bold py-3 px-4 text-left border-b-2 border-red-200');
    }
    // สลัด initComplete และ drawCallback ออกไปได้เลย! ระบบเบาขึ้นเยอะครับ
});
} // 👈 เช็กดูว่ามีปีกกาปิดตัวนี้ครบถ้วนไหม


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
            allowClear: true
        });

        $filter.on('change', function () {
            const val = $(this).val();
            table.column(1).search(val ? '^' + val + '$' : '', true, false).draw();
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
            placeholder: 'ค้นหาสถานะงาน...',
            allowClear: true
        });

        $filter.on('change', function () {
            const val = $(this).val();
            table.column(4).search(val ? '^' + val + '$' : '', true, false).draw();
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
            placeholder: 'เลือกการไฟฟ้า...',
            allowClear: true
        });

        $filter.on('change', function () {
            const val = $(this).val();
            table.column(3).search(val ? '^' + val + '$' : '', true, false).draw();
        });
    }
};

// ==================== Event Handlers ====================
function renderInitialStockMatch(allocatedData, materialTypeMap) {
    if (!allocatedData || !Array.isArray(allocatedData)) {
        console.warn("⚠️ No allocated data provided");
        return;
    }

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
            { label: "ค้างเบิก" },
            { label: "จำนวนที่ได้" },
            { label: "คงเหลือ" },
            { label: "ทั้งหมด" }
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
                    { v: res.pending || 0 },
                    { v: res.assigned || 0 },
                    { v: safeRemaining },
                    { v: safeTotal }
                ]
            };
        })
    };

    stockMatchTableInstance = TableRenderer.renderStockTable('#tableStockMatch', tableContent, materialTypeMap, "match");
}



 

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
    });
}

function setupGlobalEvents() {
    $('#resetMB52').on('click', function () {
        if (parcelTable) parcelTable.search('').columns().search('').draw();
        if (stockMatchTableInstance) stockMatchTableInstance.search('').columns().search('').draw();
        // 🎯 3. ล้างค่าการค้นหาของตารางพัสดุไม่มีของเมื่อกดปุ่ม Reset
        if (noStockTableInstance) noStockTableInstance.search('').columns().search('').draw();
        if (mb52Table) mb52Table.search('').draw();
        $('#tableRequirement_Data tbody tr').removeClass('table-primary selected-row');
        $('.filter-select').val('');
        console.log("✅ All filters cleared");
    });

    setupRowClickEvent();
}

// ==================== Main Initialization ====================
async function initDashboard() {
    const startTime = performance.now();
    console.log("🚀 Starting dashboard...");

    try {
        const fetchStart = performance.now();

        // ดึงข้อมูล Parallel
        const vvipPromise = DataService.fetchVVIPData();
        const peaPromise = DataService.fetchPEANameData();
        const sheetPromises = config.map(async (sheet) => {
            const data = await DataService.fetchSheetData(sheet.name);
            return { sheet, data };
        });

        const [vvipData, peaMapping, ...results] = await Promise.all([
            vvipPromise,
            peaPromise,
            ...sheetPromises
        ]);

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

        if (masterData && masterData.rows) {
            const idIdx = masterData.cols.findIndex(c => c.label.includes("รหัสพัสดุ") || c.label.includes("Part"));
            const typeIdx = masterData.cols.findIndex(c => c.label.includes("ประเภทพัสดุ") || c.label.includes("Type"));

            const finalIdIdx = idIdx !== -1 ? idIdx : 0;
            const finalTypeIdx = typeIdx !== -1 ? typeIdx : 2;

            masterData.rows.forEach(row => {
                const partID = getCellValue(row.c[finalIdIdx])?.toString().trim();
                const matType = getCellValue(row.c[finalTypeIdx])?.toString().trim();

                if (partID) {
                    materialTypeMap[partID] = matType;
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
            materialTypeMap
        );

        // วาดตาราง
        config.forEach(sheet => {
            const data = dataMap[sheet.name];
            if (!data) return;

            if (sheet.name === 'Requirement_Data') {
                parcelTable = TableRenderer.renderRequirementTable(
                    sheet.target, data, globalVVIP, peaNameMapping,
                    alloc.finalWbsScores, alloc.wbsStatusMap
                );
                renderInitialStockMatch(alloc.allocatedResults, materialTypeMap);
                                // หลังจาก renderInitialStockMatch เพิ่มบรรทัด
                noStockTableInstance = TableRenderer.renderNoStockTable(alloc.allocatedResults, materialTypeMap);
                FilterModule.setupFilterID_WBS(parcelTable, data);
                FilterModule.setupFilterType_WBS(parcelTable, data);
                FilterModule.setupFilterPEA_WBS(parcelTable, peaNameMapping);

            } else if (sheet.name === 'Stock_Data') {
                mb52Table = TableRenderer.renderStockTable(sheet.target, data, materialTypeMap, "stock");

            } else if (sheet.name !== 'Material_Master') {
                TableRenderer.renderGenericTable(sheet.target, data);
            }
        });

        setupGlobalEvents();

        console.log(`⚙️ Processing: ${((performance.now() - processStart) / 1000).toFixed(2)}s`);

    } catch (err) {
        console.error("❌ Error:", err);
    }

    console.log(`✅ Ready in ${((performance.now() - startTime) / 1000).toFixed(2)}s`);
}

// Document Ready
$(document).ready(() => initDashboard());
