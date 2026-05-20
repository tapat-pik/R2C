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
        "dom": '<"flex justify-end items-center gap-4 mb-4"fl>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
        "columnDefs": [
            // บังคับสีฟอนต์เนื้อหาทุกคอลัมน์เป็น #67748E ผ่าน CSS inline style
            { 
                "targets": "_all", 
                "className": "py-3 px-3 border-b border-gray-100 font-normal align-middle",
                "createdCell": function (td) {
                    $(td).css('color', '#67748E');
                }
            },
            
            // คอลัมน์ 0 (วัสดุ) - ใช้สี #67748E ตัวหนา และทำไฮไลท์พื้นหลังอ่อน ๆ 
            { 
                "targets": 0, 
                "className": "font-bold font-mono",
                "render": function(data) {
                    return `<span class="bg-slate-50 px-2 py-1 rounded font-semibold" style="color: #67748E;">${data}</span>`;
                }
            },
            
            // คอลัมน์ 1 (ข้อความสั้น)
            { "targets": 1, "className": "font-medium" },

            // คอลัมน์ 3 (เอกสารการจัดซื้อ)
            { "targets": 3, "className": "font-bold font-mono text-sm" },
            
            // คอลัมน์ 5 (องค์ประกอบ WBS) - แก้ไขจุดเสี่ยงใช้ == null แทน !
            { 
                "targets": 5, 
                "className": "font-normal font-mono text-xs",
                "render": function(data) {
                    if (data == null || data === "-") return "-";
                    return `<span class="inline-block bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-medium" style="color: #67748E;">${data}</span>`;
                }
            },
            
            // คอลัมน์ 7 (ปริมาณที่สั่ง) - เว้นวรรคเงื่อนไขให้เคลียร์โค้ดอ่านง่ายขึ้น
            {
                "targets": 7,
                "className": "text-right font-semibold font-mono",
                "render": function(data) {
                    const num = parseFloat(data);
                    return isNaN(num) ? data : num.toLocaleString(undefined, {minimumFractionDigits: 0});
                }
            },

            // คอลัมน์ 8 (หน่วยที่สั่ง)
            { "targets": 8, "className": "text-center font-medium text-xs" }
        ],
        // บังคับสีข้อความหัวคอลัมน์เป็น #344767 ตัวหนาจัดปั้ก
        "headerCallback": function (thead) {
            $(thead).find('th')
                .removeClass() 
                .addClass('bg-slate-50/80 font-extrabold text-sm py-3 px-3 text-left border-b border-gray-200 uppercase tracking-wider whitespace-nowrap')
                .css('color', '#344767');
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
    },

// 🎯 1. ฟังก์ชันหลัก: สแกนตารางรอบเดียวจบ แล้วกระจายงานให้กราฟแต่ละตัว
  updateDashboardCharts: function(tableSelector) {
    if (!$.fn.DataTable.isDataTable(tableSelector)) return;
    
    const tableApi = $(tableSelector).DataTable();
    const allRowsData = [];

    // วนลูปสแกนตารางรอบเดียว เพื่อเก็บ "ข้อมูลดิบที่จำเป็น" ออกมาทั้งหมด
    tableApi.rows({ search: 'applied' }).nodes().to$().each(function() {
        const $row = $(this);
        
        const tokenSpan = $row.find('td:first-child span').text();
        const currentStatus = tokenSpan.replace('status-', '').toLowerCase().trim();
        const peaName = $row.find('td:eq(3)').text().trim() || "ไม่ระบุการไฟฟ้า";
        const rawMoney = parseFloat($row.find('td:eq(5)').attr('data-order')) || 0;

        allRowsData.push({ status: currentStatus, pea: peaName, money: rawMoney });
    });

    // 🚀 ส่งข้อมูลก้อนเดียวกันนี้ แยกไปให้ฟังก์ชันย่อยของกราฟแต่ละตัวจัดการต่อ
    this.updatePieChart(allRowsData);
    this.updateBarChart(allRowsData);
  },

  // 🍕 2. ฟังก์ชันย่อย: คำนวณและพ่นข้อมูลใส่กราฟวงกลม (ใช้ชื่อเดิมของคุณบิ๊ก)
  updatePieChart: function(cleanData) {
    let countGreen = 0; let countBlueYellow = 0; let countRed = 0;
    let sumGreenMoney = 0; let sumBlueYellowMoney = 0; let sumRedMoney = 0;

    cleanData.forEach(item => {
        if (item.status === 'green' || item.status === 'match') { 
            countGreen += 1; sumGreenMoney += item.money;
        } else if (item.status === 'blue' || item.status === 'yellow') { 
            countBlueYellow += 1; sumBlueYellowMoney += item.money;
        } else if (item.status === 'red' || item.status === 'shortage') { 
            countRed += 1; sumRedMoney += item.money;
        }
    });

    if (GraphRender.myPieChart) {
        GraphRender.myPieChart.data.datasets[0].data = [countGreen, countBlueYellow, countRed];
        GraphRender.myPieChart.data.datasets[0].customMoney = [sumGreenMoney, sumBlueYellowMoney, sumRedMoney];
        GraphRender.myPieChart.update();
    }
  },

  // 📊 3. ฟังก์ชันย่อย: คำนวณและพ่นข้อมูลใส่กราฟแท่ง (แยกชื่อใหม่ตามที่คุณบิ๊กต้องการ)
 updateBarChart: function(cleanData) {
    let peaGroup = {};

    cleanData.forEach(item => {
        if (!peaGroup[item.pea]) {
            peaGroup[item.pea] = {
                greenCount: 0, greenMoney: 0,
                yellowCount: 0, yellowMoney: 0,
                redCount: 0, redMoney: 0,
                totalCount: 0 // 🎯 [เพิ่ม] ตัวนับงานรวมทุกสีของการไฟฟ้านี้
            };
        }

        // ทุกครั้งที่มีงานหลุดเข้ามา ไม่ว่าสีอะไร ให้บวกยอดรวมของการไฟฟ้านี้เพิ่ม 1 เสมอ
        peaGroup[item.pea].totalCount += 1;

        if (item.status === 'green' || item.status === 'match') { 
            peaGroup[item.pea].greenCount += 1; peaGroup[item.pea].greenMoney += item.money;
        } else if (item.status === 'blue' || item.status === 'yellow') { 
            peaGroup[item.pea].yellowCount += 1; peaGroup[item.pea].yellowMoney += item.money;
        } else if (item.status === 'red' || item.status === 'shortage') { 
            peaGroup[item.pea].redCount += 1; peaGroup[item.pea].redMoney += item.money;
        }
    });

    if (GraphRender.myBarChart) {
        const peaLabels = Object.keys(peaGroup).sort();
        let barDataGreen = []; let barMoneyGreen = [];
        let barDataYellow = []; let barMoneyYellow = [];
        let barDataRed = []; let barMoneyRed = [];
        let barTotalCounts = []; // 🎯 [เพิ่ม] อาเรย์เก็บยอดรวมเพื่อส่งให้กราฟ

        peaLabels.forEach(name => {
            barDataGreen.push(peaGroup[name].greenCount); barMoneyGreen.push(peaGroup[name].greenMoney);
            barDataYellow.push(peaGroup[name].yellowCount); barMoneyYellow.push(peaGroup[name].yellowMoney);
            barDataRed.push(peaGroup[name].redCount); barMoneyRed.push(peaGroup[name].redMoney);
            barTotalCounts.push(peaGroup[name].totalCount); // 🎯 ดึงยอดรวมยัดใส่สระเก็บข้อมูล
        });

        GraphRender.myBarChart.data.labels = peaLabels;
        
        // 🎯 ฝังตัวแปร barTotalCounts ซ่อนเอาไว้ในตัวกราฟแท่ง เพื่อเอาไว้เรียกใช้ตอนเมาส์ชี้
        GraphRender.myBarChart.data.customTotalCounts = barTotalCounts;

        GraphRender.myBarChart.data.datasets[0].data = barDataGreen;
        GraphRender.myBarChart.data.datasets[0].customMoney = barMoneyGreen;
        GraphRender.myBarChart.data.datasets[1].data = barDataYellow;
        GraphRender.myBarChart.data.datasets[1].customMoney = barMoneyYellow;
        GraphRender.myBarChart.data.datasets[2].data = barDataRed;
        GraphRender.myBarChart.data.datasets[2].customMoney = barMoneyRed;
        GraphRender.myBarChart.update();
    }
  }
};


const GraphRender = {
  myPieChart: null,
  myBarChart: null,

 Piegraph: function() {
    const canvasEl = document.getElementById('chartPieStatus');
    if (!canvasEl) return;
    
    const container = canvasEl.parentElement;
    container.innerHTML = '<canvas id="chartPieStatus"></canvas>';
    
    const ctxPie = document.getElementById('chartPieStatus').getContext('2d');
    this.myPieChart = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: ['งานที่มีไฟเขียว', 'งานที่มีไฟน้ำเงิน/เหลือง', 'งานที่มีไฟแดง'],
        datasets: [{
          data: [0, 0, 0], // จำนวนงาน
          customMoney: [0, 0, 0], // [เพิ่มเข้ามา] ยอดเงินรวมสะสม
          backgroundColor: ['#2ed573', '#9333ea', '#ff4757'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
          
          // 🎯 [ไฮไลท์จุดสำคัญ] ปรับแต่ง Tooltip ตอนเมาส์ชี้กราฟวงกลม
          tooltip: {
            callbacks: {
              // 1. บรรทัดแรก: โชว์จำนวนงานปกติ
              label: function(context) {
                let label = context.label || '';
                let value = context.raw || 0;
                return `${label}: ${value} งาน`;
              },
              // 2. บรรทัดที่สอง: ดึงค่าเงินที่ฝังไว้มาจัดฟอร์แมตโชว์ต่อท้าย
              afterLabel: function(context) {
                // ดึงค่าอาเรย์เงินที่เราฝังซ่อนไว้ตามตำแหน่ง Index ที่เมาส์ชี้
                let moneyDataset = context.dataset.customMoney;
                let moneyValue = moneyDataset ? moneyDataset[context.dataIndex] : 0;
                
                // แปลงตัวเลขให้มีคอมมาคั่น และทศนิยม 2 ตำแหน่ง
                let formattedMoney = moneyValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
                return `💰 มูลค่างานรวม: ${formattedMoney} บาท`;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  },


  BarGraph: function() {
    const canvasEl = document.getElementById('chartBarPEA');
    if (!canvasEl) return;
    
    // ล้างพิกัด ID กราฟเก่าถอนรากถอนโคน ป้องกัน Error Canvas ตัวเดิมซ้ำซ้อน
    const container = canvasEl.parentElement;
    container.innerHTML = '<canvas id="chartBarPEA"></canvas>';
    
    const ctxBar = document.getElementById('chartBarPEA').getContext('2d');
    
    this.myBarChart = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: [], // แกน X: ชื่อการไฟฟ้า (จะถูกยัดเข้ามาทีหลังแบบไดนามิก)
        datasets: [
          {
            label: 'งานที่มีไฟเขียว',
            data: [], // จำนวนงานไฟเขียว
            customMoney: [], // ยอดเงินรวมไฟเขียว
            backgroundColor: '#2ed573'
          },
          {
            label: 'งานที่มีไฟน้ำเงิน/เหลือง',
            data: [], // จำนวนงานไฟเหลือง
            customMoney: [], // ยอดเงินรวมไฟเหลือง
            backgroundColor: '#9333ea'
          },
          {
            label: 'งานที่มีไฟแดง',
            data: [], // จำนวนงานไฟแดง
            customMoney: [], // ยอดเงินรวมไฟแดง
            backgroundColor: '#ff4757'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false } },
       y: { 
            beginAtZero: true,
            title: { display: true, text: 'จำนวนงาน (งาน)', font: { size: 11 } }
          }
        },
       plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
          
          // 🎯 [แก้ไขจุดนี้] เพื่อโมดิฟายหน้าตาตอนเมาส์ชี้กราฟแท่ง
          tooltip: {
            callbacks: {
              // 1. หัวข้อด้านบนสุด: เอาชื่อการไฟฟ้ามาพ่น พร้อมส่องหายอดงานรวมทั้งหมดมาใส่ข้างๆ
              title: function(context) {
                // context[0].label คือชื่อการไฟฟ้า (เช่น กฟฟ.เชียงใหม่)
                let peaName = context[0].label || ''; 
                let dataIndex = context[0].dataIndex;
                
                // ดึงอาเรย์ยอดรวมที่เราฝังแอบไว้ในขั้นตอนคำนวณออกมาตามดัชนีของการไฟฟ้านั้น
                let chartConfig = context[0].chart;
                let totalCountsArray = chartConfig.data.customTotalCounts;
                let totalJobs = totalCountsArray ? totalCountsArray[dataIndex] : 0;
                
                // 🎯 คืนค่ากลับไปพ่นบนหน้าจอ "ชื่อการไฟฟ้า (รวม XX งาน)" ตามบรีฟคุณบิ๊กเป๊ะๆ!
                return `${peaName} (รวม ${totalJobs} งาน)`;
              },
              
              // 2. บรรทัดแสดงจำนวนงานแยกสี (เหมือนเดิม)
              label: function(context) {
                let datasetLabel = context.dataset.label || '';
                let value = context.raw || 0;
                return `${datasetLabel}: ${value} งาน`;
              },
              
              // 3. บรรทัดแสดงมูลค่าเงินรวมแยกสี (เหมือนเดิม)
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
// 🎯 สั่งสร้างตารางปกติ
const matchTable = $el.DataTable({
    "data": dataSet,
    "columns": colHeaders,
    "pageLength": 10,
    "responsive": true,
    "autoWidth": false,
    "buttons": [
        {
            extend: 'excel',
            text: '<i class="fas fa-file-excel mr-1"></i> Export',
            filename: 'R2C_InStock_report',
            className: 'px-3 py-2 mb-0  text-center text-green-600 uppercase align-middle bg-white rounded-lg cursor-pointer text-xs shadow-soft-md hover:scale-102 active:opacity-85'
        }
    ],
    // 🚀 ล็อก B ไว้ใน dom เพื่อให้ตารางปั้นปุ่มขึ้นมาให้ก่อน
    "dom": '<"flex justify-between items-center mb-4"<"flex items-center gap-2"fB><"flex items-center"l>>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
    "columnDefs": [
        { "targets": "_all", "className": "py-3 px-3 border-b border-gray-100 text-slate-600 font-normal" },
        { "targets": [0, 1], "className": "font-bold text-blue-700 whitespace-nowrap" },
        { "targets": [-1, -2, -3, -4], "className": "text-right whitespace-nowrap", "style": { "width": "max-content" } }
    ],
    "headerCallback": function (thead) {
        $(thead).find('th').addClass('bg-gray-50 text-gray-700 font-bold text-base py-3 px-4 text-left border-b-2 border-gray-200');
        $(thead).find('th').slice(-4).removeClass('text-left').addClass('text-right whitespace-nowrap').css('width', 'max-content');
    }
});

// 🎯 [โค้ดบรรทัดสำคัญ] เขียนต่อท้ายคำสั่งสร้างตารางเสร็จ สั่งวาร์ปย้ายปุ่มไปโผล่ที่ id ข้างบนทันที!
matchTable.buttons().container().appendTo('#my-export-space');
return matchTable;
    },

    renderRequirementTable(selector, data, vvipData, peaNameMapping, finalScores, wbsStatusMap, budgetMapping = {}) {
        const $el = $(selector);
        if ($.fn.DataTable.isDataTable(selector)) {
            $el.DataTable().destroy();
            $el.empty();
        }

        let html = this._buildTableHTML(data, vvipData, peaNameMapping, finalScores, wbsStatusMap, budgetMapping);
        $el.html(html);

   // 🎯 1. ประกาศตัวแปรรับค่าตาราง (เปลี่ยนจาก return เป็น const ตัวแปรไว้ก่อนเพื่อเอาไปสั่งย้ายปุ่ม)
const RequirementTable = $el.DataTable({
    "pageLength": 10,
    "responsive": true,
    "order": [[6, "desc"]],
    "buttons": [
        {
            extend: 'excel',
            text: '<i class="fas fa-file-excel mr-1"></i> Export',
            filename: 'R2C_Report',
            className: 'px-3 py-2 mb-0  text-center text-white uppercase align-middle bg-purple rounded-lg cursor-pointer text-xs shadow-soft-md hover:scale-102 active:opacity-85'
        }
    ],
    "columnDefs": [
        {
            "targets": 0,
            "orderable": false,
            "render": function (data, type, row) { return data; }
        },
        { "targets": 5, "type": "num" }
    ],
    // 🚀 ล็อก B ไว้ใน dom เพื่อให้ตารางปั้นปุ่มรอไว้ในระบบหลังบ้านก่อน
    "dom": '<"d-flex justify-content-end align-items-center gap-2 mb-3"fl>rt<"row mt-3"<"col-md-6"i><"col-md-6"p>>'
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

    _buildTableHTML(data, vvipData, peaNameMapping = {}, finalScores = null, wbsStatusMap = new Map(), budgetMapping = {}) {
        const headerStyle = `style="${TABLE_STYLES.headerStyle}"`;
        const textStyle = `class="mb-0 text-m leading-tight" style="${TABLE_STYLES.textStyle}"`;
        const textBoldStyle = `class="mb-0 font-bold text-m leading-tight" style="${TABLE_STYLES.textBoldStyle}"`;

        let html = '<thead class="table-light"><tr>';
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">สัญญาณไฟ</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass}">หมายเลขงาน</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass}">ชื่องาน</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass}">การไฟฟ้า</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass}">สถานะงาน</th>`;
        html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-right">มูลค่างานตามแผน</th>`;
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
        // 🎯 ส่วนที่เพิ่ม 1: ตัวแปรเก็บสถิติส่งหากราฟ
         const activeRowsDataForChart = [];
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
            const searchToken = status ? `status-${status}` : 'status-yellow'; // จะได้เป็น status-green, status-red ฯลฯ
            let rawBudget = budgetMapping[valA];
            let budgetDisplay = (rawBudget !== undefined) ? rawBudget.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "-";
            let budgetOrderValue = (rawBudget !== undefined) ? rawBudget : 0;
            // 🎯 ส่วนที่เพิ่ม 2: ยัดข้อมูลแถวนี้ลงถังเก็บ
             activeRowsDataForChart.push({ status: status, qty: rowCount });


            html += `<tr class="clickable-requirement" data-wbs="${valA}" style="cursor: pointer;">
                <td class="${TABLE_STYLES.cellClass} text-center "><span style="display: none;">${searchToken}</span>${lightHTML}</td>
                <td class="${TABLE_STYLES.cellClass}"><div class="px-3 py-1"><h6 class="mb-0 text-sm leading-normal" ${headerStyle}>${valA}</h6></div></td>
                <td class="${TABLE_STYLES.cellClass}"><p ${textStyle}>${valT}</p></td>
                <td class="${TABLE_STYLES.cellClass}"><span ${textStyle}>${peaName}</span></td>
                <td class="${TABLE_STYLES.cellClass}"><span ${textStyle}>${valY}</span></td>
                <td class="${TABLE_STYLES.cellClass} text-right" data-order="${budgetOrderValue}"><span ${textBoldStyle} class="text-dark font-mono">${budgetDisplay}</span></td>
                <td class="${TABLE_STYLES.cellClass}"><span class="text-m font-bold leading-tight ${dayClass}">${dayDisplay}</span></td>
                <td class="${TABLE_STYLES.cellClass}"><span ${textBoldStyle}>${totalScore.toLocaleString()}</span></td>
                <td class="${TABLE_STYLES.cellClass}"><span class="badge rounded-pill  text-right bg-purple ">${rowCount} รายการ</span></td>
            </tr>`;
        });

        html += '</tbody>';
        // 🎯 ส่วนที่เพิ่ม 3: ส่งข้อมูลสรุปให้กราฟวงกลมทำงานทันทีหลังสร้างตารางเสร็จ
        AllocationService.updatePieChart(activeRowsDataForChart);
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

const currentTable = $el.DataTable({
    "data": dataSet,
    "columns": colHeaders,
    "pageLength": 10,
    "responsive": true,
    
    // 🎯 2. เพิ่มออปชันปุ่ม Export สไตล์ปุ่มสีขาว ตัวหนังสือสีเขียว สวยเนี๊ยบ
    "buttons": [
        {
            extend: 'excel',
            text: '<i class="fas fa-file-excel mr-1"></i> Export',
            filename: 'R2C_NoStock_report',
            className: 'px-3 py-2 mb-0  text-center text-green-600 uppercase align-middle bg-white rounded-lg cursor-pointer text-xs shadow-soft-md hover:scale-102 active:opacity-85'
        }
    ],
    
    // 🎯 3. ยัดตัวอักษร B เข้าไปใน dom (ต่อท้าย f) เพื่อให้เปิดระบบสร้างปุ่มของ DataTable
    "dom": '<"flex justify-between items-center mb-4"<"flex items-center gap-2"fB><"flex items-center"l>>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
          
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
        $(thead).find('th').addClass('bg-red-50 text-red-700 font-bold py-3 px-4 text-left border-b-2 border-red-200');
    }
});

// 🎯 4. [บรรทัดเด็ด] สั่งย้ายปุ่มวาร์ปไปที่กล่อง ID ขวาสุดบนแถวหัวข้อสีเขียวทันที
currentTable.buttons().container().appendTo('#export-NoStock');

// 🎯 5. รีเทิร์นตัวแปรตารางออกไปใช้งานต่อตามปกติ
return currentTable;
}, // 👈 เช็กดูว่ามีปีกกาปิดตัวนี้ครบถ้วนไหม



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
    },

setupFilterLight(tableInstance, rawData) {
        // 1. ชี้เป้าตัว Select
        const $filter = $('#setupFilterLight');
        if ($filter.length === 0) return;

        // 2. ยัด Option แบบที่ Select2 ชอบ (ตัวแรกสุดต้องว่างโล่ง 100%)
        const optionsHTML = `
            <option value=""></option>
            <option value="status-green">🟢 ของครบ (สีเขียว)</option>
            <option value="status-blue">🔵 พัสดุหลักครบ (สีน้ำเงิน)</option>
            <option value="status-yellow">🟡 ได้ของบางส่วน (สีเหลือง)</option>
            <option value="status-red">🔴 ไม่ได้ของเลย (สีแดง)</option>
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
                placeholder: 'ทั้งหมด (ไฟสัญญาณ)', // ข้อความจะโชว์ตรงนี้แทนตัวเลือกแรก
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

            // ค้นหาเฉพาะในคอลัมน์ที่ 0 (คอลัมน์สัญญาณไฟ)
            tableInstance.column(0).search(selectedSearchToken, false, false).draw();
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

        //--------------วาดตาราง-------------------
        config.forEach(sheet => {
            const data = dataMap[sheet.name];
            if (!data) return;

            if (sheet.name === 'Requirement_Data') {
                parcelTable = TableRenderer.renderRequirementTable(
                    sheet.target, data, globalVVIP, peaNameMapping,
                    alloc.finalWbsScores, alloc.wbsStatusMap, budgetMapping
                );
                renderInitialStockMatch(alloc.allocatedResults, materialTypeMap);
                                // หลังจาก renderInitialStockMatch เพิ่มบรรทัด
                noStockTableInstance = TableRenderer.renderNoStockTable(alloc.allocatedResults, materialTypeMap);
                FilterModule.setupFilterID_WBS(parcelTable, data);
                FilterModule.setupFilterType_WBS(parcelTable, data);
                FilterModule.setupFilterPEA_WBS(parcelTable, peaNameMapping);
                FilterModule.setupFilterLight(parcelTable, data, alloc.wbsStatusMap);

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
                renderUpcomingTable(upcomingData);
                console.log("📦 Upcoming Item Table Rendered successfully!");
            } else {
                console.warn("⚠️ No rows found in Upcoming_Item data");
            }
        setupGlobalEvents();

        console.log(`⚙️ Processing: ${((performance.now() - processStart) / 1000).toFixed(2)}s`);
     $('#main-page-loader').fadeOut(300, function() {
            $(this).remove(); // สั่งทำลาย Element ทิ้งไปเลยไม่ให้โผล่มาหลอนซ้ำสอง
        });

      
    } catch (err) {
        console.error("❌ Error:", err);
        // หากระบบพัง ดึงข้อมูลไม่ได้ ให้เอาม่านออกทันทีหน้าจอจะได้ไม่ขาวค้าง
        $('#main-page-loader').remove();
    }

    console.log(`✅ Ready in ${((performance.now() - startTime) / 1000).toFixed(2)}s`);
}

// Document Ready
$(document).ready(() => initDashboard());
