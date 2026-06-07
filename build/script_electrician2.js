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
let parcelTable, mb52Table;
let globalVVIP = [];
let rawRequirementDatabase = null;
let peaNameMapping = {};
let totalStockSummary = {};

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
    green: { gradient: 'linear-gradient(310deg, #17ad37 0%, #98ec2d 100%)', shadow: 'rgba(23, 173, 55, 0.3)', title: 'ของครบ' },
    red: { gradient: 'linear-gradient(310deg, #ea0606 0%, #ff667c 100%)', shadow: 'rgba(234, 6, 6, 0.3)', title: 'ไม่ได้ของเลย' },
    blue: { gradient: 'linear-gradient(310deg, #2152ff 0%, #21d4fd 100%)', shadow: 'rgba(33, 82, 255, 0.3)', title: 'พัสดุหลักครบ' },
    yellow: { gradient: 'linear-gradient(310deg, #f7d02c 0%, #fde08d 100%)', shadow: 'rgba(247, 208, 44, 0.3)', title: 'ได้ของบางส่วน' },
    lock: { gradient: 'linear-gradient(310deg, #343a40 0%, #6c757d 100%)', shadow: 'rgba(52, 58, 64, 0.3)', title: 'ล็อค (พัสดุล้าสมัย/เปลี่ยนรหัส)' }
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

function getCellValue(cell) {
    if (!cell) return '';
    return cell.f ? cell.f : (cell.v !== null ? cell.v : '');
}

function createStatusCircle(status) {
    const color = STATUS_COLORS[status] || STATUS_COLORS.yellow;
    if (status === "lock") {
        return `<span class="ml-2 mr-1" style="display: inline-block; font-size: 20px; vertical-align: middle; line-height: 1;" title="\${color.title}">🔒</span>`;
    }
    return `<span class="ml-2 mr-1" style="display: inline-block; width: 12px; height: 12px; background: \${color.gradient}; border-radius: 50%; box-shadow: 0 3px 5px \${color.shadow}; vertical-align: middle;" title="\${color.title}"></span>`;
}

// ==================== Data Service ====================
const DataService = {
    async fetchSheetData(sheetName) {
        const spreadsheetId = '1zhp1OMsuil2DhjttNGRpvi1SOPlbT5FLGRYqOMruIN4';
        const url = `https://docs.google.com/spreadsheets/d/\${spreadsheetId}/gviz/tq?sheet=\${encodeURIComponent(sheetName)}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Network response was not ok (Status: \${response.status})`);
            const textData = await response.text();
            
            const jsonStart = textData.indexOf('{');
            const jsonEnd = textData.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('Invalid JSONP response format from Google Sheets');
            }
            
            const rawJsonStr = textData.substring(jsonStart, jsonEnd + 1);
            const parsedData = JSON.parse(rawJsonStr);
            const rawTable = parsedData.table;
            if (!rawTable) return { cols: [], rows: [] };

            const formattedCols = (rawTable.cols || []).map(col => ({ label: col.label || "" }));
            const formattedRows = (rawTable.rows || []).map(row => {
                if (!row || !row.c) return { c: [] };
                const formattedCells = row.c.map(cell => {
                    return { v: cell !== null && cell.v !== null && cell.v !== undefined ? cell.v : "" };
                });
                while (formattedCells.length < formattedCols.length) {
                    formattedCells.push({ v: "" });
                }
                return { c: formattedCells };
            });

            return { cols: formattedCols, rows: formattedRows };
        } catch (err) {
            console.error(`❌ Fetch Error [\${sheetName}]:`, err);
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

    async fetchUpcomingItemData() {
        return await this.fetchSheetData('Upcoming_Item');
    },

    async fetchBudgetData() {
        const data = await this.fetchSheetData('Budget_Data');
        const mapping = {};
        if (data && data.rows) {
            data.rows.forEach(row => {
                if (!row || !row.c) return;
                const wbs = getCellValue(row.c[2])?.toString().trim();
                const rawValue = getCellValue(row.c[19])?.toString() || "0";
                const cleanValue = rawValue.replace(/[^0-9.]/g, ''); 
                const budgetVal = parseFloat(cleanValue) || 0;
                if (wbs) {
                    mapping[wbs] = budgetVal;
                }
            });
        }
        return mapping;
    }
};

// ==================== Scoring Service ====================
const ScoringService = {
    matchedWBSCache: new Set(),
    clearCache() { this.matchedWBSCache.clear(); },
    updateMatchedWBS(wbs) { if (wbs) this.matchedWBSCache.add(wbs.toString().trim()); },

    calculateScoreDetails(valA, valY, valX, rowCount, vvipMap, isFullyAllocated = false, valOpenDate = "", isFinalCalc = false) {
        let score = 0;
        const currentWBS = valA ? valA.toString().trim() : "";
        const strY = valY ? valY.toString().trim() : "";
        const strX = valX ? valX.toString().trim() : "";
        const strOpenDate = valOpenDate ? valOpenDate.toString().trim() : "";

        const diffDays = this._calculateDaysRemaining(strX);
        
        let strategicPoints = 1000;
        if (currentWBS !== "" && vvipMap && vvipMap.has && vvipMap.has(currentWBS)) {
            strategicPoints += 4000;
        }

        const timingPoints = this._calculateTimingPoints(strY, diffDays, strX);
        const agingDays = this._calculateAgingDays(strOpenDate);
        const agingPoints = agingDays > 0 ? (agingDays / 10000) : 0;
        const readinessPoints = isFullyAllocated ? 2000 : (rowCount <= 5 ? 1800 : 500);

        score = strategicPoints + timingPoints + agingPoints + readinessPoints;
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

    _calculateTimingPoints(strY, diffDays, strX) {
        const accumulationDays = Math.abs(diffDays || 0);
        if (strY === "งาน 02.2") return 3000;
        if (strY === "เกินกำหนด") return 2000 + (accumulationDays * 2);
        if (diffDays !== null && diffDays >= 0 && diffDays <= 30) return 1000 + (accumulationDays * 20);
        if (diffDays !== null && diffDays > 30) return 500;
        if (strY === "ไม่เกินกำหนด" && strX === "") return 500;
        return 0;
    }
};

// ==================== Allocation Service ====================
const AllocationService = {
    calculateAllocation(rawDatabase, vvipData, totalStock, materialTypeMap = {}, budgetMapping = {}) {
        if (!rawDatabase || !rawDatabase.rows) {
            return { allocatedResults: [], finalWbsScores: new Map(), wbsStatusMap: new Map() };
        }

        const currentStock = { ...totalStock };
        const finalWbsScores = new Map();
        const wbsStatusMap = new Map();

        const vvipMap = new Set();
        if (Array.isArray(vvipData)) {
            vvipData.forEach(row => {
                const val = (row.c && row.c[1] && row.c[1].v) ? row.c[1].v.toString().trim() : "";
                if(val) vvipMap.add(val);
            });
        }

        const uniqueWBSSet = new Set();
        const rowsByWBS = new Map();
        
        rawDatabase.rows.forEach(row => {
            const wbs = getCellValue(row.c[0]).toString().trim();
            uniqueWBSSet.add(wbs);
            if (!rowsByWBS.has(wbs)) {
                rowsByWBS.set(wbs, []);
            }
            rowsByWBS.get(wbs).push(row);
        });
        const uniqueWBS = Array.from(uniqueWBSSet);

        const queue = rawDatabase.rows.map(row => {
            const wbs = getCellValue(row.c[0]).toString().trim();
            const rowsOfWbs = rowsByWBS.get(wbs) || [];
            const openDateValue = getCellValue(row.c[26]);
            const wbsBudget = budgetMapping[wbs] || 0;

            const info = ScoringService.calculateScoreDetails(
                wbs, getCellValue(row.c[24]), getCellValue(row.c[23]),
                rowsOfWbs.length, vvipMap, false, openDateValue, false
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

        queue.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (a.rowCount !== b.rowCount) return a.rowCount - b.rowCount;
            return b.budget - a.budget;
        });

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

        const allocatedByWBS = new Map();
        allocatedResults.forEach(item => {
            if (!allocatedByWBS.has(item.wbs)) allocatedByWBS.set(item.wbs, []);
            allocatedByWBS.get(item.wbs).push(item);
        });

        uniqueWBS.forEach(wbs => {
            const items = allocatedByWBS.get(wbs) || [];
            let hasLockedMaterial = false;
            
            const normalItems = items.filter(i => {
                const currentID = i.partID?.toString().trim();
                const type = materialTypeMap[currentID];
                if (type === "พัสดุล้าสมัย" || type === "เปลี่ยนรหัสพัสดุ") {
                    hasLockedMaterial = true;
                }
                return type !== "พัสดุล้าสมัย" && type !== "เปลี่ยนรหัสพัสดุ";
            });

            let status = "yellow";
            let isGreen = false;

            if (hasLockedMaterial) {
                status = "lock";
            } else if (normalItems.length > 0) {
                const mainItems = normalItems.filter(i => materialTypeMap[i.partID?.toString().trim()] === "พัสดุหลัก");
                const isMainCompleted = mainItems.length > 0 && mainItems.every(i => i.assigned >= i.pending);
                const isAllCompleted = normalItems.every(i => {
                    if (materialTypeMap[i.partID?.toString().trim()] === "พัสดุไม่เบิกจากคลัง") return true; 
                    return i.pending > 0 && i.assigned >= i.pending;
                });
                const isRed = normalItems.every(i => i.assigned === 0);

                if (isMainCompleted) {
                    status = "blue";
                    if (isAllCompleted) {
                        status = "green";
                        isGreen = true;
                    }
                } else if (isAllCompleted) {
                    status = "green";
                    isGreen = true;
                } else if (isRed) {
                    status = "red";
                } else {
                    status = "yellow";
                }
            }

            const firstItem = items[0];
            if (firstItem) {
                const final = ScoringService.calculateScoreDetails(
                    firstItem.raw.valA, firstItem.raw.valY, firstItem.raw.valX,
                    firstItem.rowCount, vvipMap, isGreen, firstItem.raw.valOpenDate, false
                );
                finalWbsScores.set(wbs, final.totalScore);
                wbsStatusMap.set(wbs, status);
                items.forEach(it => it.score = final.totalScore);
            }
        });

        return { allocatedResults, finalWbsScores, wbsStatusMap };
    }
};

// ==================== Render Upcoming Table ====================
function renderUpcomingTable(data) {
    if (data == null || data.rows == null) return null;

    const targetSel = '#tableUpcoming';
    const $el = $(targetSel);
    if ($.fn.DataTable.isDataTable(targetSel)) {
        $el.DataTable().destroy();
        $el.empty();
    }

    const colHeaders = [
        { title: "รหัสพัสดุ" }, { title: "ชื่อพัสดุ" }, { title: "กลุ่มการจัดซื้อ" },
        { title: "เอกสารการจัดซื้อ" }, { title: "วันที่เอกสาร" }, { title: "องค์ประกอบ WBS" },
        { title: "ชื่อผู้ขาย" }, { title: "ปริมาณที่สั่ง" }, { title: "หน่วยที่สั่ง" }
    ];

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
        "dom": '<"flex justify-end items-center gap-4 mb-4"fl>rt<"flex justify-between items-center mt-4"<"text-base text-gray-600 font-medium"i><"pagination-normal"p>>',
        "columnDefs": [
            { 
                "targets": "_all", 
                "className": "py-3 px-3 border-b border-gray-100 font-normal align-middle",
                "createdCell": function (td) { $(td).css('color', '#67748E'); }
            },
            { 
                "targets": 0, 
                "className": "font-bold font-mono text-left",
                "render": function(data) { return `<span class="px-2 py-1 rounded font-semibold" style="color: #67748E;">\${data}</span>`; }
            },
            { "targets": 1, "className": "font-medium" },
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
                    return `<span class="inline-flex items-center px-4 py-2" style="font-size: 13px !important; border-radius: 50px !important; background-color: \${bgColor} !important; color: \${textColor} !important;"><i class="fas \${icon} me-2" style="color: \${textColor} !important;"></i>\${data}</span>`;
                }
            },
            { "targets": 3, "className": "font-bold font-mono text-sm" },
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
                        dateStr = `\${parseInt(parts[2])} \${monthsTh[parseInt(parts[1])] || "เม.ย."} \${parseInt(parts[0])}`;
                    }
                    return `<span><i class="far fa-calendar-alt text-slate-500 me-2"></i>\${dateStr}</span>`;
                }
            },
            { 
                "targets": 5, 
                "className": "font-normal font-mono text-xs",
                "render": function(data) { return (data == null || data === "-") ? "-" : `<span class="inline-block bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-medium" style="color: #67748E;">\${data}</span>`; }
            },
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
            $(thead).find('th').removeClass().addClass('font-extrabold text-sm py-3 px-3 border-b border-gray-200 uppercase tracking-wider whitespace-nowrap').css({ 'background-color': 'transparent', 'color': '#344767' });
            $(thead).find('th').eq(2).addClass('text-center');
            $(thead).find('th').eq(8).addClass('text-center');
        }
    });
    return upcomingTableInstance;
}

// ==================== Initialize & Lifecycle ====================
async function initializeDashboard() {
    console.group("🚀 Starting Optimized Dashboard Initialization...");
    const startTime = performance.now();

    try {
        const [
            vvipData,
            peaNameMap,
            upcomingData,
            budgetMap,
            materialMasterData,
            stockData,
            requirementData
        ] = await Promise.all([
            DataService.fetchVVIPData(),
            DataService.fetchPEANameData(),
            DataService.fetchUpcomingItemData(),
            DataService.fetchBudgetData(),
            DataService.fetchSheetData('Material_Master'),
            DataService.fetchSheetData('Stock_Data'),
            DataService.fetchSheetData('Requirement_Data')
        ]);

        globalVVIP = vvipData;
        peaNameMapping = peaNameMap;
        rawRequirementDatabase = requirementData;

        const materialTypeMap = {};
        if (materialMasterData && materialMasterData.rows) {
            materialMasterData.rows.forEach(row => {
                const id = getCellValue(row.c[0])?.toString().trim();
                const type = getCellValue(row.c[2])?.toString().trim();
                if (id) materialTypeMap[id] = type;
            });
        }

        totalStockSummary = {};
        if (stockData && stockData.rows) {
            stockData.rows.forEach(row => {
                const id = getCellValue(row.c[0])?.toString().trim();
                const qty = parseFloat(getCellValue(row.c[4])) || 0;
                if (id) {
                    totalStockSummary[id] = (totalStockSummary[id] || 0) + qty;
                }
            });
        }

        const allocation = AllocationService.calculateAllocation(
            rawRequirementDatabase, globalVVIP, totalStockSummary, materialTypeMap, budgetMap
        );

        console.log("⚡ Allocation calculation completed successfully.");

        if (upcomingData && upcomingData.rows && upcomingData.rows.length > 0) {
            renderUpcomingTable(upcomingData);
        }

        $('#main-page-loader').fadeOut(300, function() {
            $(this).remove();
        });

        const endTime = performance.now();
        console.log(`⏱️ Execution Time: \${((endTime - startTime) / 1000).toFixed(2)} seconds`);
        console.groupEnd();
    } catch (error) {
        console.error("❌ Dashboard Error:", error);
        $('#main-page-loader').html('<div class="text-red-500 font-bold p-4">เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณารีเฟรชใหม่อีกครั้ง</div>');
    }
}

$(document).ready(function() {
    initializeDashboard();
});
