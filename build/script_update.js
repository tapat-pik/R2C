/**
 * Dashboard Initialization Script
 * Main orchestration file for the R2C Dashboard
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

// ==================== Utility Functions ====================
function renderInitialStockMatch(allocatedData, materialTypeMap) {
    if (!allocatedData || !Array.isArray(allocatedData)) {
        console.warn("⚠️ No allocated data provided to renderInitialStockMatch");
        return;
    }

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

/**
 * แสดงตารางพัสดุที่ไม่ได้รับการจัดสรร (assigned = 0)
 * @param {Array} allocatedData - ข้อมูลการจัดสรร
 * @param {Object} materialTypeMap - ประเภทพัสดุ
 */
function renderNoStockTable(allocatedData, materialTypeMap) {
    if (!allocatedData || !Array.isArray(allocatedData)) {
        console.warn("⚠️ No allocated data provided to renderNoStockTable");
        return;
    }

    // ฟิลเตอร์เฉพาะที่ assigned = 0
    const noStockData = allocatedData.filter(res => res.assigned === 0);

    if (noStockData.length === 0) {
        console.log("ℹ️ ไม่มีพัสดุที่ไม่ได้รับการจัดสรร");
        return;
    }

    const tableContent = {
        cols: [
            { label: "หมายเลขงาน" },
            { label: "รหัสพัสดุ" },
            { label: "ชื่อพัสดุ" },
            { label: "ประเภท" },
            { label: "ค้างเบิก" },
            { label: "จำนวนที่ได้" }
        ],
        rows: noStockData.map(res => {
            return {
                c: [
                    { v: res.wbs },
                    { v: res.partID },
                    { v: res.partName },
                    { v: 0 }, // เว้นช่องไว้ให้ renderer ใส่ประเภท
                    { v: res.pending || 0 },
                    { v: res.assigned || 0 }
                ]
            };
        })
    };

    console.log(`📊 พบพัสดุที่ไม่ได้รับการจัดสรร: ${noStockData.length} รายการ`);
    return TableRenderer.renderStockTable('#tableNoStock', tableContent, materialTypeMap, "no-stock");
}

// ==================== Event Handlers ====================
function setupRowClickEvent() {
    $(document).off('click', 'tr.clickable-requirement').on('click', 'tr.clickable-requirement', function () {
        const selectedWBS = $(this).data('wbs');

        if (!selectedWBS) {
            console.warn("⚠️ ไม่พบหมายเลข WBS ในแถวที่คลิก");
            return;
        }

        $('#tableRequirement_Data tbody tr').removeClass('table-primary selected-row');
        $(this).addClass('table-primary selected-row');

        if (stockMatchTableInstance) {
            stockMatchTableInstance.column(0).search('^' + selectedWBS + '$', true, false).draw();
        }
    });
}

function setupGlobalEvents() {
    $('#resetMB52').on('click', function () {
        // ล้าง Filter ตารางหลัก
        if (parcelTable) {
            parcelTable.search('').columns().search('').draw();
        }

        // ล้าง Filter ตารางรอง
        if (stockMatchTableInstance) {
            stockMatchTableInstance.search('').columns().search('').draw();
        }

        // ล้าง Filter ตาราง Stock
        if (mb52Table) {
            mb52Table.search('').draw();
        }

        // ล้างการเลือกแถว
        $('#tableRequirement_Data tbody tr').removeClass('table-primary selected-row');
        $('.filter-select').val('');

        console.log("✅ All filters cleared.");
    });

    setupRowClickEvent();
}

// ==================== Dashboard Initialization ====================
async function initDashboard() {
    const startTime = performance.now();
    console.log("🚀 Starting dashboard initialization...");

    try {
        const fetchStart = performance.now();

        // 1. ดึงข้อมูลแบบ Parallel
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

        console.log(`📡 Data loaded in: ${((performance.now() - fetchStart) / 1000).toFixed(2)}s`);

        // ==================== เริ่มต้นการประมวลผล ====================
        const processStart = performance.now();

        // 2. แปลงเป็น Map
        const dataMap = results.reduce((acc, curr) => {
            acc[curr.sheet.name] = curr.data;
            return acc;
        }, {});

        // 3. เตรียม Material Master Map
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

        console.log(`✅ Material items mapped: ${Object.keys(materialTypeMap).length}`);

        // 4. คำนวณ Stock Summary
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

        // 5. คำนวณการจัดสรร
        rawRequirementDatabase = dataMap['Requirement_Data'];
        const alloc = AllocationService.calculateAllocation(
            rawRequirementDatabase,
            globalVVIP,
            totalStockSummary,
            materialTypeMap
        );

        console.log(`🔍 Main items checked and status colors assigned`);

        // 6. วาดตารางตาม Config
        config.forEach(sheet => {
            const data = dataMap[sheet.name];
            if (!data) return;

            if (sheet.name === 'Requirement_Data') {
                parcelTable = TableRenderer.renderRequirementTable(
                    sheet.target, data, globalVVIP, peaNameMapping,
                    alloc.finalWbsScores, alloc.wbsStatusMap
                );
                renderInitialStockMatch(alloc.allocatedResults, materialTypeMap);

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

        console.log(`⚙️ Processing completed in: ${((performance.now() - processStart) / 1000).toFixed(2)}s`);

    } catch (err) {
        console.error("❌ Dashboard initialization error:", err);
    }

    console.log(`✅ Dashboard ready in: ${((performance.now() - startTime) / 1000).toFixed(2)}s`);
}

// ==================== Document Ready ====================
$(document).ready(() => initDashboard());
