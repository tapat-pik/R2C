/**
 * Dashboard Single File - Optimized & Clean
 * All functionality in one file with optimizations
 */


window.DATA_STORE = {
    allocated: [],
    materialMap: {},
    stock: {},
    upcoming: {},
    stockN2: {}
};
// ==================== Global State ====================

let parcelTable, mb52Table;
let globalVVIP = [];
let rawRequirementDatabase = null;
let peaNameMapping = {};
let totalStockSummary = {};
// ประกาศเพิ่มคู่กับพวก parcelTable, stockMatchTableInstance

// let myPieChart = null;
// let upcomingTableInstance = null;
// let stockMatchTableInstance = null;
let noStockTableInstance = null;
// let obsoleteTableInstance = null;
let UpcomingTabInstance = null; // ตัวแปรเก็บอินสแตนซ์ของตาราง Upcoming (เพิ่มใหม่)
let StockN2TabInstance = null;
let N2POTabInstance = null;
let InfoPOTableInstance = null;
let HoleTableInstance = null;
// ==================== Constants ====================
// --- ส่วนที่ 1: ประกาศตัวแปรเก็บข้อมูล (Global) ---
let globalAllocatedResults = [];
let globalMaterialMap = {};
let globalStockData = {};
let globalUpcomingData = {};
let globalStockN2Data = {};


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



// function renderUpcomingTable(data) {
//     // แก้ไขจุดเสี่ยงที่ 1: ใช้ == null แทนการใช้เครื่องหมาย !
//     if (data == null || data.rows == null) {
//         return null;
//     }

//     const targetSel = '#tableUpcoming'; // ไอดีตารางในหน้า HTML
//     const $el = $(targetSel);
//     if ($.fn.DataTable.isDataTable(targetSel)) {
//         $el.DataTable().destroy();
//         $el.empty();
//     }

//     const colHeaders = [
//         { title: "รหัสพัสดุ" },
//         { title: "ชื่อพัสดุ" },
//         { title: "กลุ่มการจัดซื้อ" },
//         { title: "เอกสารการจัดซื้อ" },
//         { title: "วันที่เอกสาร" },
//         { title: "องค์ประกอบ WBS" },
//         { title: "ชื่อผู้ขาย" },
//         { title: "ปริมาณที่สั่ง" },
//         { title: "หน่วยที่สั่ง" }
//     ];

//     // ดึงข้อมูลตามเลขช่อง Index โดยตรง
//     const dataSet = data.rows.map(row => {
//         const rowCells = row.c.map(cell => (cell && cell.v !== undefined) ? cell.v : "");
//         return [
//             rowCells[0] !== undefined ? rowCells[0] : "-",   
//             rowCells[1] !== undefined ? rowCells[1] : "-",   
//             rowCells[2] !== undefined ? rowCells[2] : "-",   
//             rowCells[5] !== undefined ? rowCells[5] : "-",   
//             rowCells[6] !== undefined ? rowCells[6] : "-",   
//             rowCells[9] !== undefined ? rowCells[9] : "-",   
//             rowCells[10] !== undefined ? rowCells[10] : "-", 
//             rowCells[12] !== undefined ? rowCells[12] : "-", 
//             rowCells[13] !== undefined ? rowCells[13] : "-"  
//         ];
//     });

    
//    upcomingTableInstance = $el.DataTable({
//     "data": dataSet,
//     "columns": colHeaders,
//     "pageLength": 10,
//     "responsive": true,
//     // เปลี่ยน "text-sm" เป็น "text-base" (หรือถอดออก) และเอา "-sm" ออกจาก pagination
// "dom": '<"flex justify-end items-center gap-4 mb-4"fl>rt<"flex justify-between items-center mt-4"<"text-base text-gray-600 font-medium"i><"pagination-normal"p>>',
//     "columnDefs": [
//         // บังคับสีฟอนต์เนื้อหาทุกคอลัมน์
//         { 
//             "targets": "_all", 
//             "className": "py-3 px-3 border-b border-gray-100 font-normal align-middle",
//             "createdCell": function (td) {
//                 $(td).css('color', '#67748E');
//             }
//         },
//         // คอลัมน์ 0 (วัสดุ)
//         { 
//             "targets": 0, 
//             "className": "font-bold font-mono text-left",
//             "render": function(data) {
//                 return `<span class=" px-2 py-1 rounded font-semibold" style="color: #67748E;">${data}</span>`;
//             }
//         },
//         // คอลัมน์ 1
//         { "targets": 1, "className": "font-medium" },
//         // คอลัมน์ 2 (กลุ่มการจัดซื้อ)
//         { 
//             "targets": 2, 
//             "className": "py-3 px-3 border-b border-gray-100 text-center align-middle font-medium",
//             "render": function(data) {
//                 if (!data || data === "-") return "-";
//                 const text = data.toString().trim();
//                 let bgColor = "#f3f4f6", textColor = "#374151", icon = "fa-tag";
                
//                 if (text.includes("กฟส.") || text.includes("กฟจ.")) { bgColor = "#d1fae5"; textColor = "#047857"; icon = "fa-shopping-cart"; }
//                 else if (text.includes("กจล.")) { bgColor = "#dbeafe"; textColor = "#1d4ed8"; icon = "fa-truck"; }
//                 else if (text.includes("ขอโอน")) { bgColor = "#ffedd5"; textColor = "#c2410c"; icon = "fa-sync-alt"; }
                
//                 return `<span class="inline-flex items-center px-4 py-2" 
//                            style="font-size: 13px !important; border-radius: 50px !important; background-color: ${bgColor} !important; color: ${textColor} !important;">
//                            <i class="fas ${icon} me-2" style="color: ${textColor} !important;"></i>${data}
//                        </span>`;
//             }
//         },
//         // คอลัมน์ 3
//         { "targets": 3, "className": "font-bold font-mono text-sm" },
//         // คอลัมน์ 4 (วันที่)
//         {
//             "targets": 4,
//             "className": "py-3 px-3 border-b border-gray-100 font-normal align-middle whitespace-nowrap text-slate-600",
//             "render": function(data) {
//                 if (!data || data === "-") return "-";
//                 let dateStr = data.toString().trim();
//                 const matches = dateStr.match(/\(([^)]+)\)/);
//                 if (matches && matches[1]) {
//                     const parts = matches[1].split(',');
//                     const monthsTh = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
//                     dateStr = `${parseInt(parts[2])} ${monthsTh[parseInt(parts[1])] || "เม.ย."} ${parseInt(parts[0])}`;
//                 }
//                 return `<span><i class="far fa-calendar-alt text-slate-500 me-2"></i>${dateStr}</span>`;
//             }
//         },
//         // คอลัมน์ 5
//         { 
//             "targets": 5, 
//             "className": "font-normal font-mono text-xs",
//             "render": function(data) {
//                 return (data == null || data === "-") ? "-" : `<span class="inline-block bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-medium" style="color: #67748E;">${data}</span>`;
//             }
//         },
//         // คอลัมน์ 7
//         {
//             "targets": 7,
//             "className": "text-right font-semibold font-mono",
//             "render": function(data) {
//                 const num = parseFloat(data);
//                 return isNaN(num) ? data : num.toLocaleString(undefined, {minimumFractionDigits: 0});
//             }
//         },
//         { "targets": 8, "className": "text-center font-medium text-xs" }
//     ],
//     "headerCallback": function (thead) {
//         $(thead).find('th')
//             .removeClass()
//             .addClass('font-extrabold text-sm py-3 px-3 border-b border-gray-200 uppercase tracking-wider whitespace-nowrap')
//             .css({
//                 'background-color': 'transparent', // หัวตารางโปร่งใส
//                 'color': '#344767'
//             });

//         $(thead).find('th').eq(2).addClass('text-center');
//         $(thead).find('th').eq(8).addClass('text-center');
//     }
// });
// return upcomingTableInstance;
// }
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

// ==================== Table Renderer ====================
const TableRenderer = {


//===== ตาราง Requirement =============//

// renderRequirementTable(selector, data, vvipData, peaNameMapping, finalScores, wbsStatusMap, budgetMapping = {}, wbsProgressMap = {}) {
//         const $el = $(selector);
//         if ($.fn.DataTable.isDataTable(selector)) {
//             $el.DataTable().destroy();
//             $el.empty();
//         }

//         let html = this._buildTableHTML(data, vvipData, peaNameMapping, finalScores, wbsStatusMap, budgetMapping, wbsProgressMap);
//         $el.html(html);


//    // 🎯 1. ประกาศตัวแปรรับค่าตาราง (เปลี่ยนจาก return เป็น const ตัวแปรไว้ก่อนเพื่อเอาไปสั่งย้ายปุ่ม)
// const RequirementTable = $el.DataTable({
//     "deferRender": true,
//     "pageLength": 10,
//     "responsive": true,
//     "order": [[0, "asc"]],
//     "buttons": [
//         {
//             extend: 'excel',
//             text: '<i class="fas fa-file-excel mr-1"></i> Export',
//             filename: 'R2C_Report',
//             className: 'px-3 py-2 mb-0 text-center text-white uppercase align-middle bg-purple rounded-lg cursor-pointer text-xs shadow-soft-md hover:scale-102 active:opacity-85'
//         }
//     ],
//     "dom": '<"d-flex justify-content-end align-items-center gap-2 mb-3"fl>rt<"row mt-3"<"col-md-6"i><"col-md-6"p>>',
    
//     "columnDefs": [
//         {
//             "targets": 0,
//             "orderable": false,
//             "render": function (data, type, row) { return data; }
//         },
//         { "targets": 5, "type": "num" },
//         {
//             "targets": 10,
//             // "visible": false,
//             "searchable": true // สำคัญ: ตั้งเป็น true เพื่อให้ช่อง Search ของตารางค้นหาข้อมูลจากช่องนี้ได้
//         },
//         { 
//         "targets": 11, // คอลัมน์ % ความพร้อม
//         "type": "num", 
//         "render": function(data, type, row) {
//             // เพื่อให้ Sort ได้ถูกต้อง ต้องดึงค่าตัวเลขออกมาจาก HTML
//             return type === 'sort' ? parseFloat(data) : data;
//         }
//     }
//     ],
    
//     // 🎯 แก้ไขฟังก์ชันตอนท้ายให้สั้นลงและซ่อนสกรอลบาร์สนิท
//     "initComplete": function() {
//         this.api().columns.adjust();
        
//         // เปิดให้เลื่อนขวาได้เมื่อจอเล็ก + ยิงสไตล์สั้นๆ ไปซ่อนแถบสกรอลบาร์ไม่ให้เห็นในจอคอม
//         const $wrapper = $('#tableRequirement_Data').parent().css({ 'overflow-x': 'auto' });
        
//         $('<style>').text(`
//             #${$wrapper.attr('id')}::-webkit-scrollbar { display: none !important; }
//             #${$wrapper.attr('id')} { scrollbar-width: none !important; }
//         `).appendTo('head');
//     }
// });
// // 🎯 2. สั่งย้ายก้อนปุ่มจากตาราง วาร์ปไปลงที่ช่อง ID ของคุณบิ๊กทันที (สั้นๆ แค่นี้เลย)
// RequirementTable.buttons().container().appendTo('#export-Require');

// // 🎯 3. รีเทิร์นตัวแปรตารางออกไปใช้งานตามปกติ จบงาน!
// return RequirementTable;
// },

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

    // _buildTableHTML(data, vvipData, peaNameMapping = {}, finalScores = null, wbsStatusMap = new Map(), budgetMapping = {}, wbsProgressMap= {}) {
        
        
    //     const headerStyle = `style="${TABLE_STYLES.headerStyle}"`;
    //     const textStyle = `class="mb-0 text-m leading-tight" style="${TABLE_STYLES.textStyle}"`;
    //     const textBoldStyle = `class="mb-0 font-bold text-m leading-tight" style="${TABLE_STYLES.textBoldStyle}"`;

    //     let html = '<thead class="table-light"><tr>';
    //     // 🔢 เพิ่มหัวตาราง "อันดับ" เข้าไปที่คอลัมน์แรกสุด
    //     html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">อันดับ</th>`;
    //     html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">สัญญาณไฟ</th>`;
    //     html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">หมายเลขงาน</th>`;
    //     html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">ชื่องาน</th>`;
    //     html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">การไฟฟ้า</th>`;
    //     html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">สถานะงาน</th>`;
    //     html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">มูลค่างานตามแผน</th>`;
    //     html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">จำนวนวันคงเหลือ</th>`;
    //     html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">จำนวนรายการ</th>`;
    //     html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center">คะแนนสะสม</th>`;
    //     html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center d-none">การกำหนดโครงการ</th>`;
    //     html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center ">% ความพร้อม</th>`;
    //     html += `<th ${headerStyle} class="${TABLE_STYLES.headerClass} text-center d-none">งบ</th>`;
    //     html += '</tr></thead><tbody>';

    //     const uniqueMap = new Map();
    //     const countMap = new Map();

    //     data.rows.forEach(row => {
    //         if (!row || !row.c) return;
    //         let valA = getCellValue(row.c[0]).toString().trim();
    //         if (valA !== "") {
    //             countMap.set(valA, (countMap.get(valA) || 0) + 1);
    //             if (!uniqueMap.has(valA)) {
    //                 uniqueMap.set(valA, row);
    //             }
    //         }
    //     });

    //     // ================================================================================================
    //     // 🏆 [ขั้นตอนเพิ่มเพื่อการเรียงลำดับ] ดึงข้อมูลมาคำนวณและเก็บลง Array เพื่อเตรียม Sort ตามเกณฑ์ 3 ชั้น
    //     // ================================================================================================
    //     const sortedWBSList = [];
    //     uniqueMap.forEach((row, valA) => {
    //         let ProjectPlan = getCellValue(row.c[12]); //การกำหนดโครงการ
    //         let valX = getCellValue(row.c[23]);
    //         let valY = getCellValue(row.c[24]);
    //         let rowCount = countMap.get(valA) || 0;
    //         let valOpenDate = getCellValue(row.c[26]);
    //         let rawBudget = budgetMapping[valA] || 0;

    //         let result = ScoringService.calculateScoreDetails(
    //             valA, valY, valX, rowCount, vvipData, false, valOpenDate, false
    //         );

    //         let totalScore = (finalScores && finalScores.has(valA))
    //             ? finalScores.get(valA)
    //             : result.totalScore;

    //         sortedWBSList.push({
    //             valA: valA,
    //             row: row,
    //             rowCount: rowCount,
    //             totalScore: totalScore,
    //             budget: rawBudget,
    //             result: result
    //         });
    //     });

    //     // 🎯 จัดเรียงลำดับ 3 ชั้น: 1. คะแนนรวมสูงสุด -> 2. พัสดุน้อยสุด -> 3. มูลค่างานสูงสุด
    //     sortedWBSList.sort((a, b) => {
    //         if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    //         if (a.rowCount !== b.rowCount) return a.rowCount - b.rowCount;
    //         return b.budget - a.budget;
    //     });

    //     // 🎯 ส่วนที่เพิ่ม 1: ตัวแปรเก็บสถิติส่งหากราฟ
    //     const activeRowsDataForChart = [];

    //     // ================================================================================================
    //     // 🎯 เปลี่ยนมาวิ่งลูปผ่านข้อมูลที่ผ่านการจัดอันดับถูกต้องแล้ว (โค้ดดึงค่าและโครงสร้างตารางด้านในคงเดิม)
    //     // ================================================================================================
    //     sortedWBSList.forEach((item, index) => {
    //         const rank = index + 1; // 🔢 คำนวณอันดับที่ถูกต้อง (เริ่มจาก 1)
    //         const valA = item.valA;
    //         const row = item.row;
    //         const rowCount = item.rowCount;
    //         const totalScore = item.totalScore;
    //         const result = item.result;
    //         let ProjectPlan = getCellValue(row.c[12]); //การกำหนดโครงการ
    //         let BudgetCIP = getCellValue(row.c[18]);
    //         let valT = getCellValue(row.c[19]);
    //         let valW = getCellValue(row.c[22]) || "";
    //         let valX = getCellValue(row.c[23]);
    //         let valY = getCellValue(row.c[24]);

    //         let peaName = peaNameMapping[valW] || valW || "-";

    //         // 2. 🎯 สำหรับแสดงผลหน้าจอ: ปัดเศษตัวเลขให้เป็นเลขถ้วน ไม่มีทศนิยม
    //         let displayScore = typeof totalScore === 'number' ? Math.round(totalScore).toLocaleString() : totalScore;
            
    //         let dayDisplay = "-";
    //         let dayClass = "";
    //         if (result.daysRemaining !== null) {
    //             dayDisplay = result.daysRemaining + " วัน";
    //             if (result.daysRemaining < 0) dayClass = "text-danger fw-bold";
    //         } else if (valY === "ไม่เกินกำหนด" && valY !== "งาน 02.2") {
    //             dayDisplay = "ยังไม่เกิด AUC";
    //             dayClass = "text-muted small";
    //         }

    //         const status = wbsStatusMap.get(valA);
    //         const lightHTML = createStatusCircle(status || 'yellow');
    //         const searchToken = status ? `status-${status}` : 'status-yellow';
    //         let rawBudget = budgetMapping[valA];
    //         let budgetDisplay = (rawBudget !== undefined) ? rawBudget.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "-";
    //         let budgetOrderValue = (rawBudget !== undefined) ? rawBudget : 0;
    //         const progress = wbsProgressMap[item.valA] || 0;
    //        const barColor = progress >= 80 
    //         ? 'bg-gradient-to-tl from-green-600 to-lime-400' 
    //         : (progress >= 50 
    //             ? 'bg-gradient-to-tl from-blue-600 to-cyan-400' 
    //             : 'bg-gradient-to-tl from-red-600 to-rose-400');

    //         const progressHTML = `
    //             <div class="flex items-center justify-center">
    //                 <span class="mr-2 text-xs font-semibold leading-tight">${progress.toFixed(0)}%</span>
    //                 <div>
    //                     <div class="text-xs h-0.75 w-30 m-0 flex overflow-visible rounded-lg bg-gray-200">
    //                         <div 
    //                             class="duration-600 ease-soft ${barColor} -mt-0.38 -ml-px flex h-1.5 flex-col justify-center overflow-hidden whitespace-nowrap rounded text-center text-white transition-all" 
    //                             style="width: ${progress}%"
    //                             role="progressbar" 
    //                             aria-valuenow="${progress.toFixed(0)}" 
    //                             aria-valuemin="0" 
    //                             aria-valuemax="100">
    //                         </div>
    //                     </div>
    //                 </div>
    //             </div>
    //         `;

    //         // 🎯 ส่วนที่เพิ่ม 2: ยัดข้อมูลแถวนี้ลงถังเก็บ
    //         activeRowsDataForChart.push({ status: status, qty: rowCount });

    //         // พ่น HTML พร้อมทั้งใส่ช่องอันดับ `${rank}` เพิ่มไว้ที่คอลัมน์แรกสุด
    //         html += `<tr class="clickable-requirement" data-wbs="${valA}" style="cursor: pointer;">
    //             <td class="${TABLE_STYLES.cellClass} text-center fw-bold" style="background-color: #f8f9fa;">${rank}</td>
    //             <td class="${TABLE_STYLES.cellClass} text-center "><span style="display: none;">${searchToken}</span>${lightHTML}</td>
    //             <td class="${TABLE_STYLES.cellClass} text-center"><div class="px-3 py-1"><h6 class="mb-0 text-sm leading-normal" ${headerStyle}>${valA}</h6></div></td>
    //             <td class="${TABLE_STYLES.cellClass} text-center"><p ${textStyle}>${valT}</p></td>
    //             <td class="${TABLE_STYLES.cellClass} text-center"><span ${textStyle}>${peaName}</span></td>
    //             <td class="${TABLE_STYLES.cellClass} text-center"><span ${textStyle}>${valY}</span></td>
    //             <td class="${TABLE_STYLES.cellClass} text-center" data-order="${budgetOrderValue}"><span ${textBoldStyle} class="text-dark font-mono">${budgetDisplay}</span></td>
    //             <td class="${TABLE_STYLES.cellClass} text-center"><span class="text-m font-bold leading-tight ${dayClass}">${dayDisplay}</span></td>
    //             <td class="${TABLE_STYLES.cellClass} text-center"><span class="badge rounded-pill  text-right bg-purple ">${rowCount} รายการ</span></td>
    //             <td class="${TABLE_STYLES.cellClass} text-center"><span ${textBoldStyle}>${displayScore}</span></td> 
    //             <td class="${TABLE_STYLES.cellClass} text-center d-none"><span ${textStyle}>${ProjectPlan}</span></td>
    //             <td class="${TABLE_STYLES.cellClass} text-center">${progressHTML}</td>
    //             <td class="${TABLE_STYLES.cellClass} text-center d-none "><span ${textStyle}>${BudgetCIP}</span></td>
    //         </tr>`;
    //     });

    //     html += '</tbody>';
    //     // 🎯 ส่วนที่เพิ่ม 3: ส่งข้อมูลสรุปให้กราฟวงกลมทำงานทันทีหลังสร้างตารางเสร็จ
       
    //     return html;
    // },

    //=========== ตาราง NoStock พัสดุที่ไม่ได้รับการจัดสรร ===========//
/**
 * แสดงตารางพัสดุที่ไม่ได้รับการจัดสรร (assigned = 0)
 * @param {Array} allocatedData - ข้อมูลการจัดสรร
 * @param {Object} materialTypeMap - ประเภทพัสดุ
 */
renderNoStockTable(allocatedData, materialTypeMap) {
    if (!allocatedData || !Array.isArray(allocatedData)) return null;

 const {  stockN2, upcoming } = window.DATA_STORE.maps;

    //4.Group ข้อมูล: กรองเอาเฉพาะที่ assigned < pending และนำส่วนที่เหลือ (remaining) มาบวกกัน
 // 2. Group ข้อมูล
    const EXCLUDED_TYPES = ["พัสดุล้าสมัย", "เปลี่ยนรหัสพัสดุ", "พัสดุไม่เบิกจากคลัง"];
    const groupedData = allocatedData.reduce((acc, res) => {
        const assigned = res.assigned || 0;
        const pending = res.pending || 0;
        if (assigned >= pending) return acc;
        
        const partID = res.partID?.toString().trim();
        const materialInfo = materialTypeMap[partID] || { type: "-", cost: 0 };
        if (EXCLUDED_TYPES.includes(materialInfo.type)) return acc;

        if (!acc[partID]) {
            acc[partID] = { partID, partName: res.partName || "-", type: materialInfo.type, totalRemaining: 0 };
        }
        acc[partID].totalRemaining += (pending - assigned);
        return acc;
    }, {});

    const noStockData = Object.values(groupedData);
    if (noStockData.length === 0) return null;

    // 3. เตรียม Data Set (พร้อมดึงสถานะจาก localStorage)
    const dataSet = noStockData
    
    
    .map(res => {
         const upcomingStock = upcoming[res.partID] || 0;
        const stockN2Map = stockN2[res.partID] || 0;
        // --- เงื่อนไขใหม่ ---
        // 1. ค้างเบิก (totalRemaining) เทียบกับ ปริมาณที่สั่ง (upcomingStock)
        // 2. ถ้าสั่งมากกว่าค้างเบิก (upcomingStock > totalRemaining) ให้ return null เพื่อกรองออก
        if (upcomingStock >= res.totalRemaining) {
            return null; // รายการนี้จะถูกกรองออกในขั้นตอน .filter(Boolean)
        }
        const totalRequire = Math.abs(res.totalRemaining - upcomingStock);
        const savedStatus = localStorage.getItem('status_' + res.partID) || "จัดซื้อใหม่";
        return [res.partID,
             res.partName, 
             res.type, 
             res.totalRemaining, 
             upcomingStock, 
             totalRequire, 
             stockN2Map || 0, 
             savedStatus
            ];
    })
    
    .filter(item => item !== null);;

    // 4. Initialize DataTable
    const $el = $('#tableNoStock');
    if ($.fn.DataTable.isDataTable('#tableNoStock')) {
        $el.DataTable().destroy();
        $el.empty();
    }

    const NoStockTable = $el.DataTable({
        data: dataSet,
        columns: [
            { title: "รหัสพัสดุ" }, { title: "ชื่อพัสดุ" }, { title: "ประเภท" },
            { title: "ค้างเบิก" }, { title: "ปริมาณที่สั่ง" }, { title: "ความต้องการสุทธิ" },
            { title: "สต็อก (น.2)" }, { title: "สถานะ" }
        ],
    "deferRender": true,
    "pageLength": 10,
    "responsive": true,
    "scrollX": false, // ตั้งเป็น false เพื่อป้องกันไม่ให้ DataTable พยายามสร้าง scrollbar เอง
    "autoWidth": false,
    
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
  "dom": '<"row"<"col-md-6"f><"col-md-6 text-right" <"reset-container">>>' + 
       '<"row"<"col-md-12"t>>' + 
       '<"row mt-3"<"col-md-6 d-flex align-items-center gap-3" li><"col-md-6"p>>',
   
        "columnDefs": [

              {
                "targets": [0,1],
                "className": "whitespace-nowrap",
                // "render": $.fn.dataTable.render.number(',', '.', 0)
            },
                { 
                "targets": [3, 4, 5, 6], 
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
                else if (data === 'ผลิตภัณฑ์คอนกรีต') { bgColor = "#f3d5ff"; textColor = "#a821a1"; }

                return `<span class="inline-flex items-center" style="font-size: 13px !important; padding: 4px 16px !important; border-radius: 50px !important; background-color: ${bgColor} !important; color: ${textColor} !important; display: inline-flex !important; justify-content: center; align-items: center; white-space: nowrap;">
                        ${data || '-'}
                        </span>`;
            },
            "className": "py-3 px-3 border-r border-l border-gray-200 text-center" 
        },

   
{
    targets: 7, 
    className: "text-center",
    render: function(data, type, row) {
        // 1. ดึงค่าสถานะจาก localStorage (ให้ความสำคัญกับค่าที่เก็บไว้)
        const savedStatus = localStorage.getItem('status_' + row[0]) || "จัดซื้อใหม่";
        
        // 2. ดึงค่าจำนวนที่กรอกไว้ (ถ้าไม่มีให้เป็นค่าว่าง)
        const savedQty = localStorage.getItem('qty_' + row[0]) || "";

        // 3. สร้าง HTML
        let html = `
            <select class="form-control" onchange="updateStatus_Nostock(this, '${row[0]}')">
                <option value="จัดซื้อใหม่" ${savedStatus === "จัดซื้อใหม่" ? "selected" : ""}>จัดซื้อใหม่</option>
                <option value="ขอโอน" ${savedStatus === "ขอโอน" ? "selected" : ""}>ขอโอน</option>
                <option value="Hold" ${savedStatus === "Hold" ? "selected" : ""}>Hold</option>
            </select>`;
        
        // 4. แสดง Input เฉพาะเมื่อเลือกสถานะโอน (ใช้ display ปรับให้ตรงตามสถานะที่ดึงมา)
        const isTransfer = (savedStatus === "ขอโอน");
       // ในส่วนของ html += ...
html += `<input type="number" class="qty-transfer-input form-control" 
         value="${savedQty}" 
         placeholder="ระบุจำนวน"
         style="margin-top:5px; width: 100%; box-sizing: border-box; display:${isTransfer ? 'block' : 'none'};" 
         oninput="saveQty_Nostock(this, '${row[0]}')">`;
                 
        return html;
    }
}

        ],
        "createdRow": function(row, data, dataIndex) {
        $(row).addClass('clickable-requirement'); // class สำหรับใช้ใน setupRowClickEvent
        $(row).attr('data-material-code', data[0]); // เก็บ รหัสพัสดุ ไว้ใน data-attribute
    },

 "initComplete": function(settings, json) {
    const resetBtn = `
        <button type="button" onclick="resetStatusNostock()" 
                class="block px-3 py-2 text-sm font-semibold transition-all ease-nav-brand text-slate-500 border border-transparent rounded-lg hover:border-slate-400 hover:bg-slate-100 hover:text-slate-800">
            <i class="fas fa-undo mr-1"></i>
        </button>`;
    
    // Find the container and replace its content with the button
    const container = $('.reset-container');
    container.html(resetBtn);

    // Apply CSS to align the button to the right
    container.css({
        'display': 'flex',
        'justify-content': 'flex-end',
        'width': '100%' // Optional: Ensures the container takes full width if needed
    });
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
/**
 * แสดงตารางพัสดุที่ไม่ได้รับการจัดสรร (assigned = 0)
 * @param {Array} allocatedData - ข้อมูลการจัดสรร
 * @param {Object} materialTypeMap - ประเภทพัสดุ
 */
// renderInfoPOTable(allocatedData, materialTypeMap) {
//     if (!allocatedData || !Array.isArray(allocatedData)) return null;
//     const {upcoming } = window.DATA_STORE.maps;
//     const summaryData = window.SUMMARY_DATA || {};
//     // ตรวจสอบว่ามีข้อมูลไหม
//     if (Object.keys(summaryData).length === 0) {
//         console.warn("ยังไม่มีข้อมูลสรุปจากตาราง NoStock!");
//         return null;
//     }
//     //4.Group ข้อมูล: กรองเอาเฉพาะที่ assigned < pending และนำส่วนที่เหลือ (remaining) มาบวกกัน
//    const EXCLUDED_TYPES = ["พัสดุล้าสมัย", "เปลี่ยนรหัสพัสดุ", "พัสดุไม่เบิกจากคลัง"];
//     const groupedData = allocatedData.reduce((acc, res) => {
//         const assigned = res.assigned || 0;
//         const pending = res.pending || 0;
//         if (assigned >= pending) return acc;

//         const partID = res.partID?.toString().trim();
//         const materialInfo = materialTypeMap[partID] || { type: "-", cost: 0 };
       
//         if (EXCLUDED_TYPES.includes(materialInfo.type)) return acc;

//         if (!acc[partID]) {
//             acc[partID] = { 
//                 partID: partID, 
//                 partName: res.partName || "-", 
//                 type: materialInfo.type ||"-",
//                 cost: materialInfo.cost || 0,
//                 totalRemaining: 0 
//             };
//         }
//         acc[partID].totalRemaining += (pending - assigned);
//         return acc;
//     }, {});

//     const noStockData = Object.values(summaryData);
//     if (noStockData.length === 0) return null;

//     // 3. เตรียมข้อมูล
//     const dataSet = noStockData
//     .filter(res => {
//         // ดึงสถานะปัจจุบันจาก localStorage
//         const savedStatus = localStorage.getItem('status_' + res.partID) || "จัดซื้อใหม่";
//         // กรองเอาเฉพาะรายการที่สถานะเป็น "จัดซื้อใหม่" เท่านั้น
//         return savedStatus === "จัดซื้อใหม่" || savedStatus === "ขอโอนบางส่วน";
         
//     })
    
    
//     .map(res => {
//         const upcomingStock = upcoming[res.partID] || 0;
//              // 2. ถ้าสั่งมากกว่าค้างเบิก (upcomingStock > totalRemaining) ให้ return null เพื่อกรองออก
//         if (upcomingStock >= res.totalRemaining) {
//             return null; // รายการนี้จะถูกกรองออกในขั้นตอน .filter(Boolean)
//         }
//         const totalRequire = Math.abs(res.totalRemaining - upcomingStock);
//         const savedStatus = localStorage.getItem('status_' + res.partID) || "จัดซื้อใหม่";

//         const qtyTransfer = parseFloat(localStorage.getItem('qty_' + res.partID)) || 0;
//         let finalOrderQty = 0; 
       
//         if (savedStatus === "จัดซื้อใหม่") {
//              finalOrderQty = totalRequire; // ถ้าใหม่หมด ก็สั่งซื้อเต็มยอด
//         } else if (savedStatus === "ขอโอนบางส่วน") {
//             finalOrderQty = totalRequire - qtyTransfer; // คิดแค่ส่วนต่างที่เหลือ
//         } else {
//             return null; // สถานะอื่นไม่โชว์ในตารางจัดซื้อ
//         }

//         if (finalOrderQty <= 0) return null; // ไม่โชว์ถ้าไม่มีส่วนต่างเหลือ

//         return [
//             res.partID, 
//             res.partName, 
//             res.type,
//             totalRequire, 
//             res.cost,          // เก็บราคาไว้ใน Array เพื่อใช้คำนวณ
//             finalOrderQty,      // ค่าเริ่มต้นจำนวนสั่งซื้อ
//             (finalOrderQty * res.cost),// ราคารวม
//             savedStatus
//         ];
//     })
//     .filter(item => item !== null);;

//     // 4. ตั้งค่าตาราง
//     const $el = $('#tableInfoPO');
//     if ($.fn.DataTable.isDataTable('#tableInfoPO')) {
//         $el.DataTable().destroy();
//         $el.empty();
//     }

//     const InfoPOTable = $el.DataTable({
//         data: dataSet,
//         columns: [
//             { title: "รหัสพัสดุ" },
//             { title: "ชื่อพัสดุ" },
//             { title: "ประเภท" },
//             { title: "ความต้องการสุทธิ" },
//             { title: "ราคากลาง" },
//             { title: "จำนวนสั่งซื้อ" },
//             { title: "ราคารวม" },
//             { title: "สถานะ" }
//         ],

renderInfoPOTable(allocatedData, materialTypeMap) {
    const summaryData = window.SUMMARY_DATA || {};
    
    // แปลง Object เป็น Array เพื่อส่งให้ DataTable
    const dataSet = Object.values(summaryData).map(res => {
        // นำค่าที่ sum ไว้มาใช้ตรงๆ
        const net = res.totalNetRequired;
        const cost = res.cost;
        
        return [
            res.partID, 
            res.partName, 
            res.type,
            net,              // ความต้องการสุทธิ (ค่าที่ Sum มาแล้ว)
            cost, 
            net,              // จำนวนสั่งซื้อ (ใช้ค่าเดียวกับความต้องการสุทธิ)
            (net * cost),     // ราคารวม
            res.savedStatus
        ];
    });

    const $el = $('#tableInfoPO');
    if ($.fn.DataTable.isDataTable($el)) {
        $el.DataTable().destroy();
        $el.empty();
    }

    return $el.DataTable({
        data: dataSet,
        columns: [
            { title: "รหัสพัสดุ" },
            { title: "ชื่อพัสดุ" },
            { title: "ประเภท" },
            { title: "ความต้องการสุทธิ" },
            { title: "ราคากลาง" },
            { title: "จำนวนสั่งซื้อ" },
            { title: "ราคารวม" },
            { title: "สถานะ" }
        ],





    "deferRender": true,
    "pageLength": 10,
    "responsive": true,
    "scrollX": false, // ตั้งเป็น false เพื่อป้องกันไม่ให้ DataTable พยายามสร้าง scrollbar เอง
    "autoWidth": false,
    
    "order": [[0, "asc"]], // เรียงตามรหัสพัสดุ (col 1) จากน้อยไปมาก
 "buttons": [
        {
            extend: 'excel',
            text: '<i class="fas fa-file-excel mr-1"></i> Export',
            filename: 'R2C_InfoPO_report',
            className: 'btn btn-sm btn-success',
            exportOptions: {
                modifier: { page: 'all' },
                format: {
                    body: function (data, row, column, node) {
                        // 1. คอลัมน์จำนวนสั่งซื้อ (Index 4) - ตัดเอาเฉพาะ value ใน input
                        if (column === 5) {
                            if (typeof data === 'string' && data.includes('<input')) {
                                let match = data.match(/value="([^"]*)"/);
                                return match ? match[1] : data;
                            }
                            return data;
                        }
                     
                        if (column === 7 || column === 2) 
                            {
                            // ถ้าไม่มี DOM (หน้าอื่น) ให้เช็คจากข้อมูลดิบ ถ้าพบ HTML ให้ตัดออก
                            if (typeof data === 'string' && data.includes('<span')) {
                                // ใช้ Regex ดึงข้อความระหว่าง >ข้อความ</span>
                                let match = data.match(/>([^<]+)<\/span>/);
                                return match ? match[1].trim() : data;
                            }
                            return data;
                         }
                        
                        return data;
                    }
                }
            },
            action: function (e, dt, button, config) {
                // 1. วนลูปทุกแถวโดยใช้ข้อมูลในตาราง
                dt.rows().every(function(rowIdx, tableLoop, rowLoop) {
                    let node = dt.row(rowIdx).node();
                    if (node) {
                        let input = node.querySelector('.qty-input');
                        if (input) {
                            this.cell(rowIdx, 5).data(input.value);
                        }
                        let span_type = node.querySelector('span');
                        let span_status = node.querySelector('span');
                        if (span_type || span_status) {
                            this.cell(rowIdx, 7).data(span_status.value);
                            this.cell(rowIdx, 2).data(span_type.value);
                        }
                    }
                });

                // 2. เรียกฟังก์ชัน Export มาตรฐาน
                $.fn.dataTable.ext.buttons.excelHtml5.action.call(this, e, dt, button, config);
                
                // 3. วาดตารางใหม่เพื่อให้ input กลับมาแสดงผลปกติ
                dt.draw(false);
            }
        }
    ],


"dom": '<"row mb-3"<"col-md-6"f><"col-md-6 d-flex justify-content-end"B>>rt<"row mt-3"<"col-md-6 d-flex align-items-center gap-3"li><"col-md-6 d-flex justify-content-end"p>>',    
    "columnDefs": [

              {
                "targets": [0,1],
                "className": "",
                // "render": $.fn.dataTable.render.number(',', '.', 0)
            },
             { 
            "targets": 2, 
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
            "className": "py-3 px-3  text-center" 
        },
                { 
                "targets": [3,4,6], 
                "className": "text-center ",
                "render": function(data, type, row) {
                    // เช็คว่าเป็นตัวเลขหรือไม่ ถ้าใช่ให้ใส่ลูกน้ำ ถ้าไม่ใช่ให้แสดงค่าเดิม
                    return (typeof data === 'number') ? data.toLocaleString() : data;
                }
            },
           {
    targets: 5, // คอลัมน์จำนวนสั่งซื้อ
    render: function(data, type, row) {
        if (type !== 'display') return data;
        
        // แปลง data เป็นเลข 1 หลัก (ถ้ามีเศษ) และใช้ parseFloat เพื่อกัน Error
        // วิธีนี้จะบังคับให้ Input แสดงค่าทศนิยมแค่ 1 หลักเสมอ
        const num = parseFloat(data);
        const displayValue = Number.isInteger(num) ? num : num.toFixed(1);

        
        return `<input type="number" class="qty-input" 
                value="${displayValue}" 
                data-cost="${row[4]}" 
                min="0" 
                step="1" 
                   oninput="calculateRowTotal(this)">`;
     }
    },
   {
    "targets": 7, 
    "className": "text-center",
    "responsivePriority": 1,
    "render": function(data, type, row) {
        // กำหนดสีตามสถานะ
        let bgColor = "#e5e7eb"; // สีเทา (Default)
        let textColor = "#374151"; // สีเทาเข้ม
        
        if (data === 'จัดซื้อใหม่') { bgColor = "#dcfce7"; textColor = "#166534"; } // สีเขียว
        else if (data === 'ขอโอน') { bgColor = "#fefcdb"; textColor = "#af7c1e"; } // สีฟ้า
        else if (data === 'Hold') { bgColor = "#fee2e2"; textColor = "#991b1b"; } // สีแดง

        return `<span style="
                    display: inline-block;
                    padding: 4px 12px;
                    font-size: 12px; 
                    font-weight: 600;
                    border-radius: 9999px;
                    background-color: ${bgColor};
                    color: ${textColor};
                    border: 1px solid rgba(0,0,0,0.05);
                    white-space: nowrap;
                ">
                    ${data || '-'}
                </span>`;
    }
}
      
        ],
        "createdRow": function(row, data, dataIndex) {
        $(row).addClass('clickable-requirement'); // class สำหรับใช้ใน setupRowClickEvent
        $(row).attr('data-material-code', data[0]); // เก็บ รหัสพัสดุ ไว้ใน data-attribute
    },

    "drawCallback": function() {
             updateCounts_Orderlist();
        }
    });

    InfoPOTable.buttons().container().appendTo('#export-InfoPO');
    return InfoPOTable;
},

// renderInfoHoleTable(allocatedData, materialTypeMap) {
     
//     const { upcoming } = window.DATA_STORE.maps;
//     if (!allocatedData || !Array.isArray(allocatedData)) {
//         console.warn("allocatedData is empty or not an array");
//         return null;
//     }



//     //4.Group ข้อมูล: กรองเอาเฉพาะที่ assigned < pending และนำส่วนที่เหลือ (remaining) มาบวกกัน
//    const EXCLUDED_TYPES = ["พัสดุล้าสมัย", "เปลี่ยนรหัสพัสดุ", "พัสดุไม่เบิกจากคลัง"];
//     const groupedData = allocatedData.reduce((acc, res) => {
//         const assigned = res.assigned || 0;
//         const pending = res.pending || 0;
//         if (assigned >= pending) return acc;

//         const partID = res.partID?.toString().trim();
//         const materialInfo = materialTypeMap[partID] || { type: "-", cost: 0 };
//         if (EXCLUDED_TYPES.includes(materialInfo.type)) return acc;

//         if (!acc[partID]) {
//             acc[partID] = { 
//                 partID: partID, 
//                 partName: res.partName || "-", 
//                  type: materialInfo.type ||"-", 
//                 cost: materialInfo.cost || 0,
//                 totalRemaining: 0 
//             };
//         }
//         acc[partID].totalRemaining += (pending - assigned);
//         return acc;
//     }, {});

//     const noStockData = Object.values(groupedData);
//     if (noStockData.length === 0) return null;

//     // 3. เตรียมข้อมูล
//  const dataSet = noStockData
//     .filter(res => {
//         // ดึงสถานะปัจจุบันจาก localStorage
//         const status = localStorage.getItem('status_' + res.partID) || "จัดซื้อใหม่";
        
//         // เงื่อนไข: แสดงเฉพาะรายการที่เป็น "ขอโอน" เท่านั้น
//         return status === "ขอโอนครบ" || status === "ขอโอนบางส่วน" || status === "Hold";
//     })
//     .map(res => {
//         const upcomingStock = upcoming[res.partID] || 0;
//             // 2. ถ้าสั่งมากกว่าค้างเบิก (upcomingStock > totalRemaining) ให้ return null เพื่อกรองออก
//         if (upcomingStock >= res.totalRemaining) {
//             return null; // รายการนี้จะถูกกรองออกในขั้นตอน .filter(Boolean)
//         }
//         const totalRequire = Math.max(0, res.totalRemaining - upcomingStock);
//         const savedStatus = localStorage.getItem('status_' + res.partID) || "ขอโอน";
//         const saveQtytransfer = localStorage.getItem('qty_' + res.partID) || 0;
//         return [
//             res.partID, 
//             res.partName, 
//             res.type,  
//             totalRequire, 
//             res.cost,          
//             saveQtytransfer,  
//             (parseFloat(saveQtytransfer) * res.cost),
//             // 0,
//             savedStatus
//         ];
//     })
//     .filter(item => item !== null);;
// console.log("Final dataSet for DataTable:", dataSet);
//     // 4. ตั้งค่าตาราง
//     const $el = $('#tableHole');
//     if ($.fn.DataTable.isDataTable('#tableHole')) {
//         $el.DataTable().destroy();
//         $el.empty();
//     }


renderInfoHoleTable(allocatedData, materialTypeMap) {
    const summaryHold = window.SUMMARY_DATA_HOLD || {};
    
    // แปลง Object เป็น Array
    const dataSet = Object.values(summaryHold)
        .filter(res => res.totalNetRequired > 0)
        .map(res => {
            return [
                res.partID, 
                res.partName, 
                res.type,
                res.totalNetRequired, // ยอดคงค้างที่ติด Hold
                res.cost,
                0,                    // จำนวนสั่งซื้อ (รายการ Hold ปกติจะสั่งซื้อไม่ได้หรือเป็น 0)
                0,                    // ราคารวม
                "Hold"                // สถานะ
            ];
        });

    const $el = $('#tableHole');
    if ($.fn.DataTable.isDataTable($el)) {
        $el.DataTable().destroy();
        $el.empty();
    }

    const HoleTable = $el.DataTable({
        data: dataSet,
        columns: [
            { title: "รหัสพัสดุ" },
            { title: "ชื่อพัสดุ" },
            { title: "ประเภท" },
            { title: "ความต้องการสุทธิ" },
            { title: "ราคากลาง" },
            { title: "จำนวนที่ขอโอน" },
            { title: "ราคารวม" },
            { title: "สถานะ" }
        ],
    "deferRender": true,
    "pageLength": 10,
    "responsive": true,
    "scrollX": false, // ตั้งเป็น false เพื่อป้องกันไม่ให้ DataTable พยายามสร้าง scrollbar เอง
    "autoWidth": false,
    
    "order": [[0, "asc"]], // เรียงตามรหัสพัสดุ (col 1) จากน้อยไปมาก
 "buttons": [
        {
            extend: 'excel',
            text: '<i class="fas fa-file-excel mr-1"></i> Export',
            filename: 'R2C_InfoTransferAndHole_report',
             className: 'btn btn-sm btn-success',
            exportOptions: {
                modifier: { page: 'all' },
                format: {
                    body: function (data, row, column, node) {
                        // 1. คอลัมน์จำนวนสั่งซื้อ (Index 4) - ตัดเอาเฉพาะ value ใน input
                        if (column === 5) {
                            if (typeof data === 'string' && data.includes('<input')) {
                                let match = data.match(/value="([^"]*)"/);
                                return match ? match[1] : data;
                            }
                            return data;
                        }
                        
          
                        if (column === 7 || column === 2) 
                            {
                            // ถ้าไม่มี DOM (หน้าอื่น) ให้เช็คจากข้อมูลดิบ ถ้าพบ HTML ให้ตัดออก
                            if (typeof data === 'string' && data.includes('<span')) {
                                // ใช้ Regex ดึงข้อความระหว่าง >ข้อความ</span>
                                let match = data.match(/>([^<]+)<\/span>/);
                                return match ? match[1].trim() : data;
                            }
                            return data;
                         }
                        
                        return data;
                    }
                }
            },
            action: function (e, dt, button, config) {
                // 1. วนลูปทุกแถวโดยใช้ข้อมูลในตาราง
                dt.rows().every(function(rowIdx, tableLoop, rowLoop) {
                    let node = dt.row(rowIdx).node();
                    if (node) {
                        let input = node.querySelector('.qty-input');
                        if (input) {
                            this.cell(rowIdx, 5).data(input.value);
                        }
                        let span_type = node.querySelector('span');
                        let span_status = node.querySelector('span');
                        if (span_type || span_status) {
                            this.cell(rowIdx, 7).data(span_status.value);
                            this.cell(rowIdx, 2).data(span_type.value);
                        }
                    }
                });

                // 2. เรียกฟังก์ชัน Export มาตรฐาน
                $.fn.dataTable.ext.buttons.excelHtml5.action.call(this, e, dt, button, config);
                
                // 3. วาดตารางใหม่เพื่อให้ input กลับมาแสดงผลปกติ
                dt.draw(false);
            }
        }
    ],

"dom": '<"row mb-3"<"col-md-6"f><"col-md-6 d-flex justify-content-end"B>>rt<"row mt-3"<"col-md-6 d-flex align-items-center gap-3"li><"col-md-6 d-flex justify-content-end"p>>',
   
     "columnDefs": [

              {
                "targets": [0,1],
                "className": "whitespace-nowrap",
                // "render": $.fn.dataTable.render.number(',', '.', 0)
            },
             { 
            "targets": 2, 
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
            "className": "py-3 px-3  text-center" 
        },
                { 
                "targets": [3,4,6], 
                "className": "text-center ",
                "render": function(data, type, row) {
                    // เช็คว่าเป็นตัวเลขหรือไม่ ถ้าใช่ให้ใส่ลูกน้ำ ถ้าไม่ใช่ให้แสดงค่าเดิม
                    return (typeof data === 'number') ? data.toLocaleString() : data;
                }
            },
          {
        targets: 5, // คอลัมน์ "จำนวนที่ขอโอน"
        className: "text-center",
        render: function(data, type, row) {
            // ดึงค่าที่บันทึกไว้ใน localStorage
            const saveQtytransfer = localStorage.getItem('qty_' + row[0]) || 0;
            return saveQtytransfer; // แสดงค่าเฉยๆ ไม่ต้องมี Input
        }
    },
    {
        targets: 6, // คอลัมน์ "ราคารวม"
        className: "text-center",
        // render: function(data, type, row) {
        //     // ดึงค่า saveQtytransfer มาคูณราคากลาง (row[4])
        //     const saveQtytransfer = parseFloat(localStorage.getItem('qty_' + row[0])) || 0;
        //     const cost = parseFloat(row[4]) || 0;
        //     return (saveQtytransfer * cost).toLocaleString(); // คำนวณใหม่สดๆ
        // }
    },
   {
    "targets": 7, 
    "className": "text-center",
    "render": function(data, type, row) {
        // กำหนดสีตามสถานะ
        let bgColor = "#e5e7eb"; // สีเทา (Default)
        let textColor = "#374151"; // สีเทาเข้ม
        
        if (data === 'จัดซื้อใหม่') { bgColor = "#dcfce7"; textColor = "#166534"; } // สีเขียว
        else if (data === 'ขอโอน') { bgColor = "#fefcdb"; textColor = "#af7c1e"; } // สีฟ้า
        else if (data === 'Hold') { bgColor = "#fee2e2"; textColor = "#991b1b"; } // สีแดง

        return `<span style="
                    display: inline-block;
                    padding: 4px 12px;
                    font-size: 12px; 
                    font-weight: 600;
                    border-radius: 9999px;
                    background-color: ${bgColor};
                    color: ${textColor};
                    border: 1px solid rgba(0,0,0,0.05);
                    white-space: nowrap;
                ">
                    ${data || '-'}
                </span>`;
    }
}
      
        ],
        "createdRow": function(row, data, dataIndex) {
        $(row).addClass('clickable-requirement'); // class สำหรับใช้ใน setupRowClickEvent
        $(row).attr('data-material-code', data[0]); // เก็บ รหัสพัสดุ ไว้ใน data-attribute
    },
     "drawCallback": function() {
             updateCounts_Orderlist();
        }
    });

    HoleTable.buttons().container().appendTo('#export-InfoHole');
    return HoleTable;
},

// renderNoStock_AfterUpcomingTable(allocatedData, materialTypeMap) {
//     if (!allocatedData || !Array.isArray(allocatedData)) return null;

//     window.SUMMARY_DATA = {};
//     // 1. ประกาศตัวแปร $el ไว้ที่นี่เลย เพื่อให้ใช้ได้ทั่วทั้งฟังก์ชัน
//     const $el = $('#tableNoStock_AfterUpcoming');
    
//     // 2. เช็คตัวตนก่อนทำงาน
//     if ($el.length === 0) {
//         console.warn("ไม่พบ element #tableNoStock_AfterUpcoming ในหน้าจอ");
//         return null;
//     }

//     // 3. ทำลาย DataTable เก่า (ถ้ามี)
//     if ($.fn.DataTable.isDataTable($el)) {
//         $el.DataTable().destroy();
//         // $el.empty();
//     }
//     // ดึง upcoming จาก DATA_STORE
//     const { upcoming } = window.DATA_STORE.maps;
//     const EXCLUDED_TYPES = ["พัสดุล้าสมัย", "เปลี่ยนรหัสพัสดุ", "พัสดุไม่เบิกจากคลัง"];
//     // const savedRankMap = JSON.parse(localStorage.getItem('wbsRankMap') || "{}");
//     const rankMap = window.GLOBAL_RANK_MAP || {};
//     // 1. กรองและจัดเรียงข้อมูลตาม Rank ของงาน (จากน้อยไปมาก)
//     let sortedData = allocatedData.filter(res => {
//         const assigned = res.assigned || 0;
//         const pending = res.pending || 0;
//         const materialInfo = materialTypeMap[res.partID?.trim()] || { type: "-" };
//         return (assigned < pending) && !EXCLUDED_TYPES.includes(materialInfo.type);
//     }).sort((a, b) => (rankMap[a.wbs] || 999) - (rankMap[b.wbs] || 999));
    
//     // 2. สร้างตู้สำรองข้อมูล upcoming เพื่อเอาไว้หักลบยอด
//     const upcomingBalance = { ...upcoming }; 
//     const transferBalance = {};

//     const wbsHoldMap = {};
//     allocatedData.forEach(res => {
//         if (localStorage.getItem('status_' + res.partID) === "Hold") {
//             wbsHoldMap[res.wbs] = "Hold";
//         }
//     });


//     // 3. เตรียมข้อมูลสำหรับตาราง
//     const dataSet = sortedData.map(res => {
//          const wbsKey = res.wbs ? res.wbs.toString().trim() : "";
//         const rank = rankMap[wbsKey] || "-"; // จะได้อันดับทันทีโดยไม่ต้องรอ localStorage
//         const partID = res.partID?.trim();
//         const materialInfo = materialTypeMap[partID] || { type: "-" };
//         const remaining = (res.pending || 0) - (res.assigned || 0);
        
//         // คำนวณส่วนแบ่งจาก upcoming
//         // const available = upcomingBalance[partID] || 0;
//         // const allocatedQty = Math.min(remaining, available);
        
//         // // หักลบยอดที่จ่ายไปออกจากยอดคงเหลือ
//         // upcomingBalance[partID] = available - allocatedQty;
        
//         // คำนวณ Upcoming
//         const availableUpcoming = upcomingBalance[partID] || 0;
//         const allocatedQty = Math.min(remaining, availableUpcoming);
//         upcomingBalance[partID] = availableUpcoming - allocatedQty;
        
//         // คำนวณ Transfer (จากตาราง NoStockTable)
//         if (!transferBalance[partID]) {
//             if (transferBalance[partID] === undefined) {
//             transferBalance[partID] = parseInt(localStorage.getItem('qty_' + partID)) || 0;
//         }
//         }
//         // const netRequired = remaining - allocatedQty;
//         // คำนวณหลัง Upcoming
//         const netAfterUpcoming = remaining - allocatedQty;
//         const statusAfUpcoming = netAfterUpcoming <= 0 ? "ได้ของครบ" : "ขาดของ";
//         // คำนวณหลังขอโอน
//         const allocatedTransfer = (netAfterUpcoming > 0) ? Math.min(netAfterUpcoming, transferBalance[partID]) : 0;
//         transferBalance[partID] -= allocatedTransfer;
//         const finalNetRequired = netAfterUpcoming - allocatedTransfer;
//         const statusfinal = finalNetRequired <= 0 ? "ได้ของครบ" : "ขาดของ";
        
//         const savedStatus = localStorage.getItem('status_' + res.partID) || "จัดซื้อใหม่";
//         const finalsaveStatus = wbsHoldMap[res.wbs] === "Hold" ? "Hold" : savedStatus;
       
//       // 🎯 สรุปยอดเฉพาะที่ "ขาดของ" และสถานะตรงเงื่อนไข
// if (statusfinal === "ขาดของ" && (savedStatus === "จัดซื้อใหม่" || savedStatus === "ขอโอนบางส่วน")) {
//     if (!window.SUMMARY_DATA[partID]) {
//         window.SUMMARY_DATA[partID] = {
//             partID: partID,
//             partName: res.partName,
//             type: materialInfo.type,
//             cost: materialInfo.cost || 0,
//             totalNetRequired: 0,
//             savedStatus: savedStatus
//         };
//     }
//     window.SUMMARY_DATA[partID].totalNetRequired += parseFloat(finalNetRequired) || 0;
// }
renderNoStock_AfterUpcomingTable(allocatedData, materialTypeMap) {
    if (!allocatedData || !Array.isArray(allocatedData)) return null;

    // 🎯 เพิ่มบรรทัดนี้ไว้ที่นี่
    window.SUMMARY_DATA = {}; 

    const $el = $('#tableNoStock_AfterUpcoming');
    if ($el.length === 0) return null;
    if ($.fn.DataTable.isDataTable($el)) $el.DataTable().destroy();

    const { upcoming } = window.DATA_STORE.maps;
    const rankMap = window.GLOBAL_RANK_MAP || {};
    const EXCLUDED_TYPES = ["พัสดุล้าสมัย", "เปลี่ยนรหัสพัสดุ", "พัสดุไม่เบิกจากคลัง"];

    let sortedData = allocatedData.filter(res => {
        const assigned = res.assigned || 0;
        const pending = res.pending || 0;
        const materialInfo = materialTypeMap[res.partID?.trim()] || { type: "-" };
        return (assigned < pending) && !EXCLUDED_TYPES.includes(materialInfo.type);
    }).sort((a, b) => (rankMap[a.wbs] || 999) - (rankMap[b.wbs] || 999));

    const upcomingBalance = { ...upcoming };
    const transferBalance = {};

    // 🎯 สแกน Hold ทั้ง WBS ไว้ก่อน
    const wbsHoldMap = {};
    sortedData.forEach(res => {
        if (localStorage.getItem('status_' + res.partID) === "Hold") {
            wbsHoldMap[res.wbs] = "Hold";
        }
    });

    const dataSet = sortedData.map(res => {
        const wbsKey = res.wbs ? res.wbs.toString().trim() : "";
        const rank = rankMap[wbsKey] || "-";
        const partID = res.partID?.trim();
        const materialInfo = materialTypeMap[partID] || { type: "-" };
        const remaining = (res.pending || 0) - (res.assigned || 0);

        // 1. คำนวณ Upcoming
        const availableUpcoming = upcomingBalance[partID] || 0;
        const allocatedQty = Math.min(remaining, availableUpcoming);
        upcomingBalance[partID] = availableUpcoming - allocatedQty;

        // 2. คำนวณ Transfer 
        if (transferBalance[partID] === undefined) {
            transferBalance[partID] = parseInt(localStorage.getItem('qty_' + partID)) || 0;
        }

        const netAfterUpcoming = remaining - allocatedQty;
        const statusAfUpcoming = netAfterUpcoming <= 0 ? "ได้ของครบ" : "ขาดของ";

        // 3. คำนวณสถานะจริง (Final)
        const savedStatus = localStorage.getItem('status_' + res.partID) || "จัดซื้อใหม่";
        const finalsaveStatus = wbsHoldMap[res.wbs] === "Hold" ? "Hold" : savedStatus;

        // 4. คำนวณหลังขอโอน (กระจายยอดเฉพาะที่ไม่ใช่ Hold)
        let allocatedTransfer = 0;
        if (finalsaveStatus !== "Hold" && netAfterUpcoming > 0) {
            allocatedTransfer = Math.min(netAfterUpcoming, transferBalance[partID] || 0);
            transferBalance[partID] -= allocatedTransfer;
        }

        const finalNetRequired = netAfterUpcoming - allocatedTransfer;
        const statusfinal = finalNetRequired <= 0 ? "ได้ของครบ" : "ขาดของ";

        // // 🎯 สรุปยอดเพื่อส่งให้ InfoPO (ใช้ finalsaveStatus ตัดสิน)
        // if (statusfinal === "ขาดของ" && (finalsaveStatus === "จัดซื้อใหม่" || finalsaveStatus === "ขอโอนบางส่วน")) {
        //     if (!window.SUMMARY_DATA[partID]) {
        //         window.SUMMARY_DATA[partID] = {
        //             partID: partID,
        //             partName: res.partName,
        //             type: materialInfo.type,
        //             cost: materialInfo.cost || 0,
        //             totalNetRequired: 0,
        //             savedStatus: finalsaveStatus
        //         };
        //     }
        //     window.SUMMARY_DATA[partID].totalNetRequired += parseFloat(finalNetRequired) || 0;
        // }

// ตรงจุดที่สะสมยอด ในลูป .map() ของ NoStock
if (statusfinal === "ขาดของ") {
    if (finalsaveStatus === "Hold") {
        // 🎯 เก็บยอดรายการที่ติด Hold
        if (!window.SUMMARY_DATA_HOLD) window.SUMMARY_DATA_HOLD = {};
        if (!window.SUMMARY_DATA_HOLD[partID]) {
            window.SUMMARY_DATA_HOLD[partID] = { 
                partID, 
                partName: res.partName,
                type: materialInfo.type, 
                cost: materialInfo.cost || 0,
                totalNetRequired: 0 ,
                savedStatus: finalsaveStatus
            };
        }
        window.SUMMARY_DATA_HOLD[partID].totalNetRequired += parseFloat(finalNetRequired) || 0;
    } else if (savedStatus === "จัดซื้อใหม่" || savedStatus === "ขอโอน") {
        // 🎯 เก็บยอดรายการปกติ (ส่วนนี้เหมือนเดิมที่คุณใช้อยู่)
        if (!window.SUMMARY_DATA[partID]) {
            window.SUMMARY_DATA[partID] = {
                    partID: partID,
                    partName: res.partName,
                    type: materialInfo.type,
                    cost: materialInfo.cost || 0,
                    totalNetRequired: 0,
                    savedStatus: finalsaveStatus
                };
        }
        window.SUMMARY_DATA[partID].totalNetRequired += parseFloat(finalNetRequired) || 0;
    }
}
        return [
            // savedRankMap[res.wbs] || "-",
            rank,
            res.wbs || "-",
            partID || "-",
            res.partName || "-",
            materialInfo.type,
            remaining,       // ค้างเบิก
            allocatedQty,    // ที่ได้ (Upcoming)
            netAfterUpcoming,     // ความต้องการหลังหัก
            statusAfUpcoming,           // สถานะ
            allocatedTransfer, // รวมที่ได้โอน
            finalNetRequired, // ความต้องการหลังหัก
            statusfinal, // สถานะ
            savedStatus,
            finalsaveStatus
        ];
    });

    // ... (ต่อด้วยการ Initial DataTable ตามโค้ดเดิมของคุณ)
        const colHeaders = [
            { title: "อันดับ" },
            { title: "หมายเลขงาน" },
            { title: "รหัสพัสดุ" },
            { title: "ชื่อพัสดุ" },
            { title: "ประเภท" },
            { title: "ค้างเบิก" },
            { title: "ที่ได้" },
            { title: "ต้องการหลังหัก" },
            { title: "สถานะ" },
            { title: "ที่ได้หลังโอน" },
            { title: "ต้องการหลังโอน" },
            { title: "สถานะหลังโอน" },
            { title: "สถานะของ" },
            { title: "สถานะที่ใช้จริง" }
        ];

const NoStock_AfterUpcomingTable = $el.DataTable({
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
            //         // columns: [0, 1, 2, 3, 5, 6]
            //     }
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
                //    $(td).css({  'word-break': 'keep-all' });
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
        {
    "targets": 7, // คอลัมน์ความต้องการหลังหัก
    "className": "text-center font-bold",
    "createdCell": function(td, cellData) {
        if (cellData > 0) $(td).addClass('text-red-600');
    }
},
        {
    "targets": 8, // คอลัมน์สถานะ
    "className": "text-center",
    "render": function(data) {
        if (data === "ได้ของครบ") {
            return `<span class="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">✓ ได้ของครบ</span>`;
        } else {
            return `<span class="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">✗ ขาดของ</span>`;
        }
    }
},
  {
    "targets": 11, // คอลัมน์สถานะ
    "className": "text-center",
    "render": function(data) {
        if (data === "ได้ของครบ") {
            return `<span class="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">✓ ได้ของครบ</span>`;
        } else {
            return `<span class="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">✗ ขาดของ</span>`;
        }
    }
},
{
    targets: 12, // คอลัมน์สถานะ
    "visible": true,
   "render": function(data, type, row) {
        // กำหนดสีตามสถานะ
        let bgColor = "#e5e7eb"; // สีเทา (Default)
        let textColor = "#374151"; // สีเทาเข้ม
        
        if (data === 'จัดซื้อใหม่') { bgColor = "#dcfce7"; textColor = "#166534"; } // สีเขียว
        else if (data === 'ขอโอน') { bgColor = "#fefcdb"; textColor = "#af7c1e"; } // สีฟ้า
        else if (data === 'Hold') { bgColor = "#fee2e2"; textColor = "#991b1b"; } // สีแดง

        return `<span style="
                    display: inline-block;
                    padding: 4px 12px;
                    font-size: 12px; 
                    font-weight: 600;
                    border-radius: 9999px;
                    background-color: ${bgColor};
                    color: ${textColor};
                    border: 1px solid rgba(0,0,0,0.05);
                    white-space: nowrap;
                ">
                    ${data || '-'}
                </span>`;
    }
},
{ 
            "targets": [13], // Index คอลัมน์สถานะที่ใช้จริง
            "className": "text-center",
            "render": function(data) {
                let color = data === "Hold" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700";
                return `<span class="px-2 py-1 rounded text-xs ${color}">${data}</span>`;
            }
        }
        // col 4: ค้างเบิก
        // {
        //         "targets": 4,
        //         "className": "py-3 px-3 border-b border-gray-100 text-center whitespace-nowrap text-base",
        //         "render": function(data, type, row) {
        //             // ป้องกันความผิดพลาดของข้อมูล
        //             if (!data || typeof data !== 'object') return '0 / 0';
                    
        //             const assignedFormated = data.assigned.toLocaleString();
        //             const pendingFormated = data.pending.toLocaleString();
                    
        //             // แสดงผลในสไตล์: จำนวนที่ได้ (สีเขียวหรือสีปกติ) / ค้างเบิก (สีแดงโดดเด่น)
        //             return ` <span class="font-bold text-red-600" style=" font-weight: bold; margin-right: 5px; font-size: 16px;">✗</span>
        //             <span class="font-bold text-red-600 ">${assignedFormated}</span> 
        //                     <span class="text-slate-700">/</span> 
        //                     <span class="font-bold text-slate-700">${pendingFormated}</span>`;


        //                 //     `<div class="text-center whitespace-nowrap">
        //                 // <span lass="font-bold" style="color: rgb(199, 68, 68); font-weight: bold; margin-right: 5px; font-size: 16px;">✗</span>
        //                 //     <span class="text-red-600 font-bold">${assignedFormated}</span>
        //                 //     <span class="text-slate-700">/</span>
        //                 //     <span class="text-slate-700 font-bold">${pendingFormated}</span>
        //                 // </div>`;
        //         }
        //     },
            // { "targets": [5, 6], "visible": false },
        
    ],
   "headerCallback": function (thead) {
    $(thead).find('th')
        .removeClass() // ล้างคลาสสีเดิมออก
        .addClass('font-bold py-3 px-4 text-left') // ใส่คลาสที่จำเป็น
        .css({
            'background-color': 'transparent', // ทำให้หัวตารางโปร่งใส
            'border-bottom': '2px solid #e9d5ff', // ใช้สีเส้นคั่นที่คุณชอบ
            // 'white-space': 'nowrap'
        });
},
    
    // 🎯 3. สั่งครอบตัวอุ้มตาราง คัดสไตล์สกรอลบาร์ออก (ในคอมไม่มีแถบวิ่ง แต่ในมือถือปัดขวาได้สวยๆ)
    "initComplete": function() {
        this.api().columns.adjust();
        
        // เจาะจงที่ parent wrapper ของตารางนี้โดยตรง
        const $wrapper = $('#tableNoStock_AfterUpcoming').parent().css({ 'overflow-x': 'auto' });
        
        $('<style>').text(`
            #${$wrapper.attr('id')}::-webkit-scrollbar { display: none !important; }
            #${$wrapper.attr('id')} { scrollbar-width: none !important; }
        `).appendTo('head');
    }
});
 
 
 
// 🎯 4. [บรรทัดเด็ด] สั่งย้ายปุ่มวาร์ปไปที่กล่อง ID ขวาสุดบนแถวหัวข้อสีเขียวทันที
NoStock_AfterUpcomingTable.buttons().container().appendTo('#export-NoStock');
 NoStock_AfterUpcomingTableInstance = NoStock_AfterUpcomingTable;
// 🎯 5. รีเทิร์นตัวแปรตารางออกไปใช้งานต่อตามปกติ
return NoStock_AfterUpcomingTable;
}, // 👈 เช็กดูว่ามีปีกกาปิดตัวนี้ครบถ้วนไหม




};

/**
 * คำนวณราคารวมต่อแถวแบบ Real-time
 * @param {HTMLInputElement} inputElement - องค์ประกอบ input ที่มีการเปลี่ยนแปลงค่า
 */
window.calculateRowTotal = function(inputElement) {
    const qty = parseFloat(inputElement.value) || 0;
    const cost = parseFloat(inputElement.getAttribute('data-cost')) || 0;
    const total = qty * cost;

    // 1. หาแถวและ DataTable instance
    const table = $('#tableInfoPO').DataTable();
    const row = table.row($(inputElement).closest('tr'));

    // 2. อัปเดตเฉพาะ DOM ของเซลล์ราคารวม (Index 6) โดยไม่เรียก table.draw()
    // เราจะใช้ .text() ของ jQuery ตรงๆ เพื่อให้ข้อมูลในตารางอัปเดตแบบมองไม่เห็น
    $(inputElement).closest('tr').find('td').eq(6).text(total.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }));

    // 3. สำคัญมาก: อัปเดตข้อมูลใน Data Store ของ DataTable เพื่อให้ Export ข้อมูลได้ถูกต้อง
    // โดยใช้การตั้งค่าค่าผ่าน object โดยตรง (จะไม่ทำให้ตารางถูก Re-render)
    const rowData = row.data();
    rowData[6] = total; // อัปเดตค่า Index 6 ใน Data ของแถวนั้น
    
    // 4. ถ้ามีฟังก์ชันคำนวณยอดรวมสุทธิ (Grand Total) ให้เรียกที่นี่
    if (typeof updateCounts_Orderlist === 'function') {
        updateCounts_Orderlist();
    }
};

// ฟังก์ชันอัปเดตจำนวนแถวที่แสดงในแต่ละแท็บ (Upcoming, StockN2, N2PO) และแสดงผลในช่องที่กำหนดไว้
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

// ฟังก์ชันอัปเดตจำนวนแถวที่แสดงในแต่ละแท็บ (Upcoming, StockN2, N2PO) และแสดงผลในช่องที่กำหนดไว้
function updateCounts_Orderlist() {
    // คำนวณจำนวนแถว
    const counts = {
        InfoPO: $.fn.DataTable.isDataTable('#tableInfoPO') ? $('#tableInfoPO').DataTable().rows({filter: 'applied'}).count() : 0,
        InfoHole: $.fn.DataTable.isDataTable('#tableHole') ? $('#tableHole').DataTable().rows({filter: 'applied'}).count() : 0,
       
    };

    // ใช้ .toLocaleString() เพื่อเพิ่มคอมม่า (เช่น 1000 กลายเป็น 1,000)
    const elements = [
        { id: 'count-InfoPO', val: counts.InfoPO },
        { id: 'count-InfoHole', val: counts.InfoHole },
   
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
function toggleInfoTab(tabName) {
    console.log("Switching to tab:", tabName);
    
    const tableMap = {
        'InfoPO': '#tableInfoPO',
        'InfoHole': '#tableHole',
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





// ฟังก์ชันบันทึกเลือกสถานะ ขอโอน จะขึ้นให้กรอก input 
function updateStatus_Nostock(selectElement, partID) {
    const newValue = selectElement.value;
    localStorage.setItem('status_' + partID, newValue);
    
    // สั่งซ่อน/แสดงช่องกรอกทันที
    const row = $(selectElement).closest('tr');
    if(newValue === "ขอโอน") {
        row.find('.qty-transfer-input').show();
    } else {
        row.find('.qty-transfer-input').hide();
        localStorage.removeItem('qty_' + partID); // ล้างค่าจำนวนถ้าเปลี่ยนไปสถานะอื่น
    }
    
    $(selectElement).addClass('border-success');
    // TableRenderer.renderNoStock_AfterUpcomingTable(window.GLOBAL_ALLOCATED_DATA, window.GLOBAL_MATERIAL_TYPE_MAP);
// refreshTables();

}




// กรอกจำนวนที่โอน ส่งค่าไปตารางรอง
function saveQty_Nostock(inputElement, partID) {
    localStorage.setItem('qty_' + partID, inputElement.value);
    
    // renderNoStock_AfterUpcomingTable(window.GLOBAL_ALLOCATED_DATA, window.GLOBAL_MATERIAL_TYPE_MAP);
// refreshTables();
}

// function refreshTables() {
//     console.log("รีเฟรชตาราง InfoPO และ Hole...");

//     const tables = [
//         { id: '#tableInfoPO', func: TableRenderer.renderInfoPOTable },
//         { id: '#tableHole', func: TableRenderer.renderInfoHoleTable },
//         // { id: '#tableNoStock_AfterUpcoming', func: TableRenderer.renderNoStock_AfterUpcomingTable } // เพิ่มบรรทัดนี้
//     ];

//     tables.forEach(cfg => {
//         const $el = $(cfg.id);
        
//         if ($.fn.DataTable.isDataTable(cfg.id)) {
//             $el.DataTable().destroy();
//             $el.empty(); 
//         }

//         cfg.func(
//             window.DATA_STORE.allocated, 
//             window.DATA_STORE.materialMap, 
//             window.DATA_STORE.stock, 
//             window.DATA_STORE.upcoming, 
//             window.DATA_STORE.stockN2
//         );
//     });
// // เรียกแยกต่างหากสำหรับตารางที่ต้องการค่าเฉพาะ
//     if ($('#tableNoStock_AfterUpcoming').length > 0) {
//         TableRenderer.renderNoStock_AfterUpcomingTable(window.DATA_STORE.allocated, window.DATA_STORE.materialMap);
//     }
//     // --- เพิ่มส่วนนี้เพื่อสั่งให้เลื่อนหน้าจอ ---
//     const targetElement = document.querySelector('#summary-order'); // เปลี่ยน ID เป็นตารางที่อยากให้เลื่อนไปหา
//     if (targetElement) {
//         targetElement.scrollIntoView({ 
//             behavior: 'smooth', // ทำให้เลื่อนแบบนุ่มนวล
//             block: 'start'      // เลื่อนให้ตารางไปอยู่ด้านบนสุดของจอ
//         });
//     }


// }


function refreshTables() {
    console.log("รีเฟรชตารางตามลำดับ...");
window.SUMMARY_DATA = {};
    window.SUMMARY_DATA_HOLD = {};
    // 1. คำนวณ NoStock ก่อน (เพราะตารางอื่นดึงค่าจาก window.SUMMARY_DATA)
    if ($('#tableNoStock_AfterUpcoming').length > 0) {
        TableRenderer.renderNoStock_AfterUpcomingTable(window.DATA_STORE.allocated, window.DATA_STORE.materialMap);
    }

    // 2. ตามด้วยตาราง InfoPO และตารางอื่นๆ ที่ต้องใช้ค่าที่คำนวณเสร็จแล้ว
    const tables = [
        { id: '#tableInfoPO', func: TableRenderer.renderInfoPOTable },
        { id: '#tableHole', func: TableRenderer.renderInfoHoleTable }
    ];

    tables.forEach(cfg => {
        const $el = $(cfg.id);
        if ($el.length > 0) {
            // ไม่ต้องทำลายและสร้างใหม่เองถ้าฟังก์ชัน render ของคุณทำลายให้แล้ว 
            // แต่ถ้าทำลายข้างนอกได้ ก็ทำที่นี่
            cfg.func(window.DATA_STORE.allocated, window.DATA_STORE.materialMap);
        }
    });

    // 3. เลื่อนหน้าจอ
    const targetElement = document.querySelector('#summary-order');
    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
function resetStatusNostock() {
    // 1. ล้างค่า localStorage ที่เกี่ยวข้อง
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('status_') || key.startsWith('qty_')) {
            localStorage.removeItem(key);
        }
    });

    // 2. เรียกฟังก์ชัน refreshTables เพื่ออัปเดตตาราง InfoPO และ Hole
    if (typeof refreshTables === 'function') {
        refreshTables();
    }

    // --- ส่วนแก้ไข: อัปเดตสถานะ Input ในตาราง NoStock ให้แสดงผลทันที ---
    const $table = $('#tableNoStock');
    if ($.fn.DataTable.isDataTable('#tableNoStock')) {
        // หา Select ทั้งหมดในตารางนี้
        $table.find('select').each(function() {
            $(this).val('จัดซื้อใหม่'); // เปลี่ยนค่า Dropdown เป็นค่าเริ่มต้น
            $(this).removeClass('border-success');
            
            // หา Input ที่อยู่ใกล้ๆ กันในแถวนั้น
            const $row = $(this).closest('tr');
            const $input = $row.find('.qty-transfer-input');
            
            // ซ่อน Input และล้างค่าใน Input ทันที
            $input.val(''); 
            $input.hide();
        });
    }

    console.log("Reset สถานะและอัปเดตตารางเรียบร้อย");
}

// // กรอกจำนวนที่โอน ส่งค่าไปตารางรอง
// function saveQtytransfer(inputElement, partID) {
//     // 1. บันทึกค่าลง localStorage
//     localStorage.setItem('qty_' + partID, inputElement.value);
    
//     // 2. เรียกฟังก์ชัน Refresh ตารางที่มีอยู่แล้ว
//     // เพื่อให้ตาราง InfoHole ดึงค่าใหม่จาก localStorage มาคำนวณและแสดงผลทันที
//     refreshTables(); 
// }


 // =================================================================
// 🌟 ฟังก์ชันตัวกลางสำหรับแชร์การซิงค์ Cross-Filter ไปยังทุกตารางย่อย
// =================================================================
function syncAllTables(mainTable) {
    // ดึง WBS (คอลัมน์ 2) ที่รอดอยู่บนตารางหลักในปัจจุบัน
    const activeWBS = mainTable.rows({ search: 'applied' }).data().toArray().map(row => row[2].replace(/<[^>]*>/g, '').trim());
    const uniqueWBS = [...new Set(activeWBS)].filter(Boolean);
    const stockRegex = uniqueWBS.length > 0 ? uniqueWBS.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|') : '^$|🚫';

    // 1. ซิงค์ตาราง Stock Match (คอลัมน์ 0)
    if (typeof UpcomingTabInstance !== 'undefined' && UpcomingTabInstance) {
        UpcomingTabInstance.column(0).search(stockRegex, true, false).draw();
    }
    // 2. ซิงค์ตาราง No Stock (คอลัมน์ 0)
    if (typeof noStockTableInstance !== 'undefined' && noStockTableInstance) {
        noStockTableInstance.column(0).search(stockRegex, true, false).draw();
    }
    // 3. ซิงค์ตาราง Obsolete (คอลัมน์ 0)
    if (typeof N2POTabInstance !== 'undefined' && N2POTabInstance) {
        N2POTabInstance.column(0).search(stockRegex, true, false).draw();
    }
       // 3. ซิงค์ตาราง Obsolete (คอลัมน์ 0)
    if (typeof StockN2TabInstance !== 'undefined' && StockN2TabInstance) {
        StockN2TabInstance.column(0).search(stockRegex, true, false).draw();
    }

}
// ==================== Filter Module ====================
const FilterModule = {

    // =================================================================
// [1/5] ฟังก์ชันกรอง ประเภท (คอลัมน์ที่ 2 ในตาราง Nostcok)
// =================================================================

    // 1. ฟิลเตอร์สำหรับตาราง NoStock (Material Group)
   setupNoStockFilter: function(tableId, checkboxClass) {
    // ลงทะเบียน Custom Filter ให้ DataTable
    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        // เช็ค ID ตารางให้ถูกต้อง (ถ้าใช้ $ ใน tableId ให้ตัดออกตอนเทียบ)
        if (settings.nTable.id !== tableId.replace('#', '')) return true;

        const selected = $(checkboxClass + ':checked').map(function() { 
            return $(this).val().trim(); // ใช้ .trim() เพื่อกันช่องว่างเกิน
        }).get();

        const rowType = data[2].trim(); // ใช้ .trim() กันพลาดเหมือนกัน

        // ถ้าไม่มีการเลือก ให้แสดงทั้งหมด
        if (selected.length === 0) return true;
        
        // คืนค่าผลการตรวจสอบ
        return selected.includes(rowType);
    });

    // Event Listener
    $(document).off('change', checkboxClass).on('change', checkboxClass, function() {
        $(tableId).DataTable().draw();
    });
},

// =================================================================
// [2/5] ฟังก์ชันกรอง รหัสพัสดุ (คอลัมน์ที่ 0 ในตาราง Nostcok)
// =================================================================

setupBulkMaterialFilter: function(tableId) {
        const $textarea = $('#bulkMaterialInput');
        const $button = $('#applyBulkFilter');

        $button.on('click', function() {
            const table = $(tableId).DataTable();
            
            // 1. ดึงค่าจาก textarea เปลี่ยนขึ้นบรรทัดใหม่หรือ comma ให้เป็น Array
            // .split(/[\n,]+/) หมายถึงตัดด้วยขึ้นบรรทัดใหม่ หรือ เครื่องหมายจุลภาค
            let rawInput = $textarea.val().trim();
            
            if (rawInput === "") {
                table.column(0).search("").draw();
                return;
            }

            // 2. แปลงเป็น array และลบช่องว่าง
            const codes = rawInput.split(/[\n,]+/).map(item => item.trim()).filter(item => item !== "");

            // 3. สร้าง Regex สำหรับ DataTable (ใช้เครื่องหมาย ^ และ $ เพื่อความแม่นยำ)
            // ตัวอย่าง: ^(e0001|e0002|e0003)$
            const regex = codes.map(code => `^${$.fn.dataTable.util.escapeRegex(code)}$`).join('|');

            // 4. สั่งค้นหาในคอลัมน์ที่ 0 (ใช้ regex=true)
            table.column(0).search(regex, true, false).draw();
        });
    },

// =================================================================
// [3/5] ฟังก์ชันกรอง ยกเว้นรหัสพัสดุ เหล่านี้ (คอลัมน์ที่ 0 ในตาราง Nostcok)
// =================================================================

/**
     * ฟิลเตอร์ยกเว้นรายการที่ระบุ (Exclude)
     * @param {string} tableId - ID ของตาราง
     * @param {string} textareaId - ID ของ textarea ที่ใส่รหัส
     */
   setupExcludeBulkMaterialFilter: function(tableId) {
    const $textarea = $('#excludeMaterialInput'); // เปลี่ยน ID ตาม HTML ของคุณ
    const $button = $('#btnExcludeFilter');       // เปลี่ยน ID ตาม HTML ของคุณ

    $button.on('click', function() {
        const table = $(tableId).DataTable();
        let rawInput = $textarea.val().trim();
        
        if (rawInput === "") {
            table.column(0).search("").draw();
            return;
        }

        const codes = rawInput.split(/[\n,]+/).map(item => item.trim()).filter(item => item !== "");

        // --- จุดเปลี่ยนสำคัญอยู่ตรงนี้ครับ ---
        // เดิม: `^${รหัส}$` -> (เอาตัวที่ตรงเป๊ะ)
        // ใหม่: `^(?!(${รหัส})$).*$` -> (เอาตัวที่ไม่ตรงกับรหัสเหล่านี้)
        
        const escapedCodes = codes.map(code => $.fn.dataTable.util.escapeRegex(code)).join('|');
        const regex = `^(?!(${escapedCodes})$).*$`;

        // สั่งค้นหา
        table.column(0).search(regex, true, false).draw();
    });
},
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
// [4/5] ฟังก์ชันกรอง  WBS (คอลัมน์ที่ 4 ในตารางหลัก)
// =================================================================
setupFilterID_WBS(table, allocatedData, materialTypeMap, stockData, upcomingData, stockN2Data) {
    const $searchContainer = $('#dropdownSearchWBS').find('ul'),
          $searchInput = $('#searchWBS'),
          $clearButton = $('#clearWBSFilter');

    // ... (โค้ดสร้าง Checkbox คงเดิม) ...

    // เปลี่ยนมาใช้ Closure เพื่อให้มองเห็น 'table'
    const applyFilter = () => {
        let selected = [];
        $searchContainer.find('.wbs-checkbox:checked').each(function () { selected.push($(this).val()); });
        
        // กรองตารางหลัก
        const regex = selected.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|');
        table.column(2).search(regex, true, false).draw();
        
        // สั่งวาดตาราง NoStock ใหม่โดยส่งค่า selected ไปด้วย
        // (ใช้ชื่อฟังก์ชันเดิมของคุณ)
        this.renderNoStockTable(allocatedData, materialTypeMap, stockData, upcomingData, stockN2Data, selected);
        
        syncAllTables(table);
    };

    // ปรับการผูก Event ให้ทำงานถูกต้อง
    $searchContainer.off('change', '.wbs-checkbox').on('change', '.wbs-checkbox', applyFilter.bind(this));
    $clearButton.off('click').on('click', () => {
        $searchContainer.find('.wbs-checkbox').prop('checked', false); 
        $searchInput.val('').trigger('input');
        applyFilter.call(this);
    });
},


// ฟังก์ชันสำหรับเคลียร์ค่า
 initClearButtons: function() {
        $('#clearBulkFilter').on('click', () => $('#bulkMaterialInput').val(''));
        $('#clearExcludeFilter').on('click', () => $('#excludeMaterialInput').val(''));
    }


};





function setupRowClickEvent() {
    $(document).off('click', '#tableNoStock tbody tr.clickable-requirement').on('click', '#tableNoStock tbody tr.clickable-requirement', function (e) {
        
        const isTargetElement = $(e.target).is('select, input') || 
                                $(e.target).closest('select, input').length > 0;
        // --- ส่วนที่เพิ่มเข้ามาเพื่อแก้ปัญหา ---
        // ตรวจสอบว่าถ้าคลิกโดน select หรือปุ่ม ให้หยุดการทำงานทันที
       if (isTargetElement) {
            return; 
        }
        // -------------------------------------

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
 
 $('#resetMB52').on('click', function () {
        // 1. ล้างการค้นหาและการกรองในตารางหลักทั้งหมดออก แล้ววาดตารางใหม่ (โค้ดดั้งเดิมของคุณ)
        if (noStockTableInstance) noStockTableInstance.search('').columns().search('').draw();
        if (UpcomingTabInstance) UpcomingTabInstance.search('').columns().search('').draw();
        if (StockN2TabInstance) StockN2TabInstance.search('').columns().search('').draw();
        if (N2POTabInstance) N2POTabInstance.search('').columns().search('').draw();
         });

    
    setupRowClickEvent();
}

// const range = document.getElementById('rangeInput');
//   const numInput = document.getElementById('numInput');
//   const tooltip = document.getElementById('tooltip');

//   range.addEventListener('input', function() {
//     // อัปเดตตัวเลขในช่อง Input
//     numInput.value = this.value;
//     // อัปเดต Tooltip
//     tooltip.innerText = '$' + this.value;
//   });

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

       

                // ใน initDashboard() หลังโหลดข้อมูลเสร็จ
        window.DATA_STORE.allocated = alloc.allocatedResults;
        window.DATA_STORE.materialMap = materialTypeMap;
        window.DATA_STORE.stock = dataMap['Stock_Data'];
        window.DATA_STORE.upcoming = upcomingData;
        window.DATA_STORE.stockN2 = dataMap['StockN2_Data'];

  // 1. สร้างโครงสร้างให้สมบูรณ์ (บรรทัดนี้ต้องมีแน่นอน)
        window.DATA_STORE.maps = { stock: {}, stockN2: {}, upcoming: {} };

        // 1. Build Stock Map ลง DATA_STORE
        window.DATA_STORE.maps.stock = {};
        if (dataMap['Stock_Data']?.rows) {
            dataMap['Stock_Data'].rows.forEach(row => {
                const partID = CommonService.getCellValue(row.c[0])?.toString().trim();
                const qty = parseFloat(CommonService.getCellValue(row.c[8])) || 0;
                if (partID) {
                    window.DATA_STORE.maps.stock[partID] = (window.DATA_STORE.maps.stock[partID] || 0) + qty;
                }
            });
        }

        // 2. Build StockN2 Map ลง DATA_STORE
        window.DATA_STORE.maps.stockN2 = {};
        if (dataMap['StockN2_Data']?.rows) {
            dataMap['StockN2_Data'].rows.forEach(row => {
                const partID = CommonService.getCellValue(row.c[2])?.toString().trim();
                const qty = parseFloat(CommonService.getCellValue(row.c[10])) || 0;
                const location = CommonService.getCellValue(row.c[0])?.toString().trim();
                if (partID && location !== 'คลังพัสดุ พิษณุโลก') {
                    window.DATA_STORE.maps.stockN2[partID] = (window.DATA_STORE.maps.stockN2[partID] || 0) + qty;
                }
            });
        }

        // 3. Build Upcoming Map ลง DATA_STORE 👈 อันนี้คือตัวที่คุณต้องการ
        window.DATA_STORE.maps.upcoming = {};
        if (upcomingData?.rows) {
            upcomingData.rows.forEach(row => {
                const partID = CommonService.getCellValue(row.c[0])?.toString().trim();
                const qty = parseFloat(CommonService.getCellValue(row.c[12])) || 0;
                if (partID) {
                    window.DATA_STORE.maps.upcoming[partID] = (window.DATA_STORE.maps.upcoming[partID] || 0) + qty;
                }
            });
        }
            // คำนวณอันดับตรงนี้เลย!
        const globalRankMap = RankingService.calculateAllWbsRanks(
            dataMap['Requirement_Data'].rows, 
            budgetMapping, 
            alloc.finalWbsScores
        );

        // เอาไปแปะไว้ใน window หรือตัวแปร Global เพื่อให้ตารางต่างๆ ดึงไปใช้ได้ทันที
        window.GLOBAL_RANK_MAP = globalRankMap;
// สั่งเรนเดอร์ครั้งแรกจาก DATA_STORE

        // ================= วาดตาราง ================= //
        config.forEach(sheet => {
            const data = dataMap[sheet.name];
            if (!data) return;

            if (sheet.name === 'Requirement_Data') {
                // parcelTable = TableRenderer.renderRequirementTable(
                //     sheet.target, data, globalVVIP, peaNameMapping,
                //     alloc.finalWbsScores, alloc.wbsStatusMap, budgetMapping, wbsProgressMap
                // );
                noStockTableInstance = TableRenderer.renderNoStockTable( window.DATA_STORE.allocated, window.DATA_STORE.materialMap);
                NoStock_AfterUpcomingTableInstance = TableRenderer.renderNoStock_AfterUpcomingTable(window.DATA_STORE.allocated, window.DATA_STORE.materialMap);
                HoleTableInstance = TableRenderer.renderInfoHoleTable(window.DATA_STORE.allocated, window.DATA_STORE.materialMap);
                InfoPOTableInstance = TableRenderer.renderInfoPOTable(window.DATA_STORE.allocated, window.DATA_STORE.materialMap);
                UpcomingTabInstance = TableRenderer.renderUpcomingTab(upcomingData);
                StockN2TabInstance =TableRenderer.renderStockN2Tab(dataMap['StockN2_Data']);
                N2POTabInstance =TableRenderer.renderN2POTab(dataMap['N2PO_Data']);
                // 1. เรียกใช้ฟิลเตอร์ประเภทวัสดุ
                FilterModule.setupNoStockFilter('#tableNoStock', '.filter-type');
                FilterModule.setupBulkMaterialFilter('#tableNoStock');
                // เปลี่ยนจากบรรทัดเดิมของคุณเป็น:
                FilterModule.setupFilterID_WBS(
                    parcelTable, 
                    alloc.allocatedResults,  // ข้อมูลการจัดสรร (ต้องส่งตัวนี้ไปเพื่อให้ฟิลเตอร์กรองได้)
                    materialTypeMap,         // ประเภทพัสดุ
                    dataMap['Stock_Data'],   // ข้อมูลสต็อก
                    upcomingData,            // ข้อมูลของที่กำลังมา
                    dataMap['StockN2_Data']  // ข้อมูลคลัง น.2
                );
                FilterModule.setupFilterType_WBS(parcelTable, data);
                FilterModule.setupFilterPEA_WBS(parcelTable, peaNameMapping);
               
                 // ตัวอย่างการใช้งานเมื่อกดปุ่ม "ยกเว้นรหัส"
                $('#btnExcludeFilter').on('click', function() {
                    FilterModule.setupExcludeBulkMaterialFilter('#tableNoStock', '#bulkMaterialInput');
                });

                FilterModule.initClearButtons();

            }
           
            else if (sheet.name !== 'Material_Master') {
                TableRenderer.renderGenericTable(sheet.target, data);
            }
        });

       
        updateCounts();
        setupGlobalEvents();
        $('#main-page-loader').fadeOut(50, function() { $(this).remove(); });

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