/**
 * Dashboard Single File - Optimized & Clean
 * All functionality in one file with optimizations
 */



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

// ==================== Constants ====================


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
renderNoStockTable(allocatedData, materialTypeMap, stockData,upcomingData = {}, stockN2Data) {
    if (!allocatedData || !Array.isArray(allocatedData)) return null;

    // 1. ประมวลผล Stock Map จาก stockData (Index 8)
    const stockMap = {};
    if (stockData && stockData.rows) {
        stockData.rows.forEach(row => {
            const partID = getCellValue(row.c[0])?.toString().trim();
            const qty = parseFloat(getCellValue(row.c[8])) || 0;
            if (partID) stockMap[partID] = (stockMap[partID] || 0) + qty;
        });
    }
    // 2. สร้าง StockN2 Map (คงคลังภายในเขต - ดึงจาก StockN2_Data)
   const stockN2Map = {};
    if (stockN2Data && stockN2Data.rows) {
        stockN2Data.rows.forEach(row => {
            const partID = getCellValue(row.c[2])?.toString().trim(); // รหัสพัสดุ
            const qty = parseFloat(getCellValue(row.c[10])) || 0;     // จำนวนที่ใช้ได้
            const location = getCellValue(row.c[0])?.toString().trim(); // location
            
            // ใช้การบวกสะสม (Sum) เข้าไปใน partID นั้นๆ
            if (partID && location !== 'คลังพัสดุ พิษณุโลก') {
                stockN2Map[partID] = (stockN2Map[partID] || 0) + qty;
            }
        });
    }
    // 3. สร้าง Upcoming Map (Index 12) 👈 เพิ่มส่วนนี้
    const upcomingMap = {};
    if (upcomingData && upcomingData.rows) {
        upcomingData.rows.forEach(row => {
            const partID = getCellValue(row.c[0])?.toString().trim();
            const qty = parseFloat(getCellValue(row.c[12])) || 0;
            if (partID) upcomingMap[partID] = (upcomingMap[partID] || 0) + qty;
        });
    }


    //4.Group ข้อมูล: กรองเอาเฉพาะที่ assigned < pending และนำส่วนที่เหลือ (remaining) มาบวกกัน
    const EXCLUDED_TYPES = ["พัสดุล้าสมัย", "เปลี่ยนรหัสพัสดุ", "พัสดุไม่เบิกจากคลัง"];
    const groupedData = allocatedData.reduce((acc, res) => {
        const assigned = res.assigned || 0;
        const pending = res.pending || 0;
        
        // เงื่อนไข: เอาเฉพาะรายการที่ได้ไม่ครบ
        if (assigned >= pending) return acc;
        
        const partID = res.partID?.toString().trim();
        const partType = materialTypeMap[partID] || "-";
        if (EXCLUDED_TYPES.includes(partType)) return acc;

        // คำนวณส่วนที่เหลือของรายการนี้
        const remaining = pending - assigned;

        if (!acc[partID]) {
            acc[partID] = { 
                partID: partID, 
                partName: res.partName || "-", 
                type: partType, 
                totalRemaining: 0 // เปลี่ยนจาก totalPending เป็น totalRemaining
            };
        }
        acc[partID].totalRemaining += remaining;
        return acc;
    }, {});

    const noStockData = Object.values(groupedData);
    if (noStockData.length === 0) return null;
   
    // 5. แยกส่วน Config หัวตาราง (ไว้ข้างนอก DataTable)
    const colHeaders = [
        { title: "รหัสพัสดุ" },
        { title: "ชื่อพัสดุ" },
        { title: "ประเภท" },
        { title: "ค้างเบิก" },
        { title: "ปริมาณที่สั่ง" },
        { title: "ความต้องการสุทธิ" },
        { title: "สต็อก (น.2)" },
        { title: "สถานะ" }
    ];

    // 6. เตรียมข้อมูล Data สำหรับตาราง
    const dataSet = noStockData.map(res => {
        // 1. รวมของที่มีอยู่จริง (สต็อก + ของที่กำลังมา)
    const upcomingStock = upcomingMap[res.partID] || 0;

    // 2. คำนวณความต้องการ: ถ้ามีของ 100 ต้องการ 71 ก็จะเหลือติดลบ 29 
    // เราใช้ Math.abs เพื่อให้แสดงเป็นเลข 29 (แสดงว่าขาดอยู่ 29)
    const totalRequire = Math.abs(res.totalRemaining - upcomingStock);
   
        return [
            res.partID, 
            res.partName, 
            res.type, 
            res.totalRemaining, 
            upcomingMap[res.partID] || 0,
            totalRequire || 0,
            stockN2Map[res.partID] || 0,
            ""
        ]
});
    // --- (โค้ดส่วน DataTable เริ่มต้น) ---
    const $el = $('#tableNoStock');
    if ($.fn.DataTable.isDataTable('#tableNoStock')) {
        $el.DataTable().destroy();
        $el.empty();
    }

    const NoStockTable = $el.DataTable({
      "data": dataSet,
    "columns": colHeaders,
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
      "dom": '<"d-flex justify-content-end align-items-center gap-2 mb-3"fl>rt<"row mt-3"<"col-md-6"i><"col-md-6"p>>',
   
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
                else if (data === 'ผลิตภัณฑ์คอนกรีต') { bgColor = "#d5fff9"; textColor = "#2189a8"; }

                return `<span class="inline-flex items-center" style="font-size: 13px !important; padding: 4px 16px !important; border-radius: 50px !important; background-color: ${bgColor} !important; color: ${textColor} !important; display: inline-flex !important; justify-content: center; align-items: center; white-space: nowrap;">
                        ${data || '-'}
                        </span>`;
            },
            "className": "py-3 px-3 border-r border-l border-gray-200 text-center" 
        },

       {
            "targets": 7,
            "className": "whitespace-nowrap",
            "render": function (data, type, row) {
                return `<select class="form-control" onchange="updateStatus(this, '${row[0]}')">
                    <option value="" ${data === "" ? "selected" : ""}>- เลือก -</option>
                    <option value="จัดซื้อใหม่" ${data === "จัดซื้อใหม่" ? "selected" : ""}>จัดซื้อใหม่</option>
                    <option value="ขอโอน" ${data === "ขอโอน" ? "selected" : ""}>ขอโอน</option>
                    <option value="Hold" ${data === "Hold" ? "selected" : ""}>Hold</option>
                </select>`;
            }
        }
        ],
        "createdRow": function(row, data, dataIndex) {
        $(row).addClass('clickable-requirement'); // class สำหรับใช้ใน setupRowClickEvent
        $(row).attr('data-material-code', data[0]); // เก็บ รหัสพัสดุ ไว้ใน data-attribute
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
// 
function updateStatus_Nostock(selectEl, partID) {
    const selectedValue = selectEl.value;
    // เลือกค่าแล้วให้ค้างไว้
    selectEl.setAttribute('data-value', selectedValue);
    
    // หากต้องการบันทึกลงฐานข้อมูลหรือทำอย่างอื่นต่อ ทำที่นี่ได้เลย
    console.log("พัสดุ:", partID, "สถานะใหม่:", selectedValue);
}
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




};





 
function setupRowClickEvent() {
    $(document).off('click', '#tableNoStock tbody tr.clickable-requirement').on('click', '#tableNoStock tbody tr.clickable-requirement', function () {
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

        // ================= วาดตาราง ================= //
        config.forEach(sheet => {
            const data = dataMap[sheet.name];
            if (!data) return;

            if (sheet.name === 'Requirement_Data') {
                // parcelTable = TableRenderer.renderRequirementTable(
                //     sheet.target, data, globalVVIP, peaNameMapping,
                //     alloc.finalWbsScores, alloc.wbsStatusMap, budgetMapping, wbsProgressMap
                // );
                
               
                noStockTableInstance = TableRenderer.renderNoStockTable(alloc.allocatedResults, materialTypeMap,dataMap['Stock_Data'],upcomingData,dataMap['StockN2_Data']);
                UpcomingTabInstance = TableRenderer.renderUpcomingTab(upcomingData);
                StockN2TabInstance =TableRenderer.renderStockN2Tab(dataMap['StockN2_Data']);
                N2POTabInstance =TableRenderer.renderN2POTab(dataMap['N2PO_Data']);

            
                FilterModule.setupFilterID_WBS(parcelTable, data);
                FilterModule.setupFilterType_WBS(parcelTable, data);
                FilterModule.setupFilterPEA_WBS(parcelTable, peaNameMapping);
               

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