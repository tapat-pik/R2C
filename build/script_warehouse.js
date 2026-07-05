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
let allData = [];
let rawDataStockN2 = [];      // เก็บข้อมูลต้นฉบับทั้งหมด
let currentStockN2Data = [];  // เก็บข้อมูลที่กำลังโชว์อยู่ (หลัง Filter แล้ว)
let rawDataN2PO = []; // ตัวแปรเก็บข้อมูลดิบที่สรุปแล้ว
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
let TransferTableInstance = null;
// ==================== Constants ====================
// --- ส่วนที่ 1: ประกาศตัวแปรเก็บข้อมูล (Global) ---
let globalAllocatedResults = [];
let globalMaterialMap = {};
let globalStockData = {};
let globalUpcomingData = {};
let globalStockN2Data = {};
window.CURRENT_RANK_LIMIT = 9999; // ค่าเริ่มต้น

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

   

    //=========== ตาราง NoStock พัสดุที่ไม่ได้รับการจัดสรร ===========//
/**
 * แสดงตารางพัสดุที่ไม่ได้รับการจัดสรร (assigned = 0)
 * @param {Array} allocatedData - ข้อมูลการจัดสรร
 * @param {Object} materialTypeMap - ประเภทพัสดุ
 */



renderNoStockTable(allocatedData, materialTypeMap) {
    const $el = $('#tableNoStock_warehouse');
    if ($el.length === 0) return null;

    // 1. ดึงข้อมูลที่ผ่านการสรุปจาก renderNoStock_AfterUpcomingTable
    // ในขั้นตอนนี้ SUMMARY_DATA จะมีค่า totalNetRequired ที่หักลบแค่ Upcoming แล้ว
    const summaryItems = Object.values(window.SUMMARY_DATA_NOSTOCK || {});
    // const summaryItems = window.SUMMARY_DATA_NOSTOCK || {};
    // 2. เตรียม Data Set
    const dataSet = summaryItems.map(item => {
        // ดึงสต็อก น.2 มาแสดงประกอบ (ถ้ามี)
       const { stockN2, upcoming } = window.DATA_STORE.maps;
        const stockN2Map = stockN2[item.partID] || 0;
         const upcomingStock = upcoming[item.partID] || 0;
        return [
            item.partID|| "-",
            item.partName|| "-",
            item.type|| "-",
            item.totalPending ,
            upcomingStock|| 0,
            item.totalNetRequired|| 0, // ค่าความต้องการสุทธิที่หักแค่ Upcoming
            stockN2Map || 0,
            item.savedStatus || "-"
        ];
    });

    // 3. Initialize DataTable (จัดการเรื่องการทำลายตารางเก่าก่อน)
    if ($.fn.DataTable.isDataTable($el)) {
        $el.DataTable().destroy();
        $el.empty();
    }

     const NoStockTable = $el.DataTable({
        data: dataSet,
        columns: [
            { title: "รหัสพัสดุ" },
            { title: "ชื่อพัสดุ" },
            { title: "ประเภท" },
            { title: "ค้างเบิก" },
            { title: "ปริมาณที่สั่ง" },
            { title: "ความต้องการสุทธิ" },
            { title: "สต็อก (น.2)" },
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
            filename: 'R2C_NoStock_report',
            className: 'px-3 py-2 mb-0 text-center text-slate-500 uppercase align-middle bg-white rounded-lg cursor-pointer text-xs shadow-soft-md hover:scale-102 active:opacity-85',
            // exportOptions: {
            //         columns: [0, 1, 2, 3, 5]
            //     }
        }
    ],
"dom": '<"row"<"col-md-6"f><"col-md-6 text-right" <"reset-container">>>' + 
       '<"row"<"col-md-12"t>>' + 
       '<"row mt-3"<"col-md-5"i><"col-md-7"p>>', // ปรับจาก 6/6 เป็น 5/7 เพื่อให้ Pagination มีพื้นที่มากขึ้น
   
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
    // เพิ่ม min-width ตรงนี้ เพื่อให้ช่องไม่ถูกบีบจนเกินไป
    className: "text-center", 
    render: function(data, type, row) {
        const savedStatus = localStorage.getItem('status_' + row[0]) || "จัดซื้อใหม่";
        const savedQty = localStorage.getItem('qty_' + row[0]) || "";

        // ปรับ CSS ตรง style ของ select และ input
        // เพิ่ม min-width: 120px; เพื่อให้ข้อความ "จัดซื้อใหม่" แสดงได้ครบโดยไม่ถูกตัด
        let html = `
            <select class="form-control" onchange="updateStatus_Nostock(this, '${row[0]}')" 
                    style="min-width: 120px; width: 100%; padding: 5px;">
                <option value="จัดซื้อใหม่" ${savedStatus === "จัดซื้อใหม่" ? "selected" : ""}>จัดซื้อใหม่</option>
                <option value="ขอโอน" ${savedStatus === "ขอโอน" ? "selected" : ""}>ขอโอน</option>
                <option value="Hold" ${savedStatus === "Hold" ? "selected" : ""}>Hold</option>
            </select>`;
        
        const isTransfer = (savedStatus === "ขอโอน");
        html += `<input type="number" class="qty-transfer-input form-control" 
                 value="${savedQty}" 
                 placeholder="ระบุจำนวน"
                 style="margin-top:5px; width: 100%; min-width: 80px; box-sizing: border-box; display:${isTransfer ? 'block' : 'none'}; padding: 5px;" 
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
    noStockTableInstance = NoStockTable;
    return NoStockTable;
},


// renderUpcomingTab(upcomingData) {
//     const $el = $('#tabUpcoming');
    
//     // ทำลายตารางเก่าทิ้งก่อน (ถ้ามี) เพื่อป้องกัน Error การสร้างตารางซ้อน
//     if ($.fn.DataTable.isDataTable($el)) {
//         $el.DataTable().destroy();
//     }

//     // แปลงข้อมูลจาก Google Sheets Format (c[0], c[1]...) 
//     // เป็น Array ของ Array สำหรับ DataTable
//     const dataSet = upcomingData.rows.map(row => {
//         const totalStock = parseFloat(getCellValue(row.c[12]) || 0).toLocaleString();
//         const unit = getCellValue(row.c[13]) || "";
//         const totalStockWithUnit = `${totalStock} ${unit}`;
//         return [
//             getCellValue(row.c[0],), // รหัสพัสดุ
//             getCellValue(row.c[5]), // เอกสารการจัดซื้อ
//             getCellValue(row.c[2]), // กลุ่มการจัดซื้อ
//             totalStockWithUnit // ปริมาณที่สั่ง (ใส่ลูกน้ำ)
//         ];
//     });

//     // สร้างตารางใหม่
//     const table = $el.DataTable({
//         "data": dataSet,
//         "deferRender": true,
//         "pageLength": 10,
        
//         "dom": '<"flex justify-between items-center mb-4"<"flex items-center gap-2"f><"flex items-center"l>>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
//         "columns": [
//             { "title": "รหัสพัสดุ" },
//             { "title": "เอกสารการจัดซื้อ" },
//             { "title": "กลุ่มการจัดซื้อ" },
//             { "title": "ปริมาณที่สั่ง" }
//         ],
        
//         "responsive": true,
//         "language": { "emptyTable": "ไม่พบข้อมูลในตาราง" },
//         "columnDefs": [
//             { "targets": 0, "visible": false } // 🎯 3. ซ่อนคอลัมน์รหัสพัสดุไม่ให้ผู้ใช้เห็น แต่ยังใช้ Search ได้
//         ],
        
//         "drawCallback": function() {
//             updateCounts(); 
//         }
//     });
//     return table;
// },

//  renderUpcomingTab(upcomingData, isFiltered = false) {
//     const $container = $('#tabUpcoming');
//     const $btn = $('#btnSeeMore');
//      allData = upcomingData.rows;
    
//     // สถานะปัจจุบัน: false = โชว์แค่ 10, true = โชว์ทั้งหมด
//     let isExpanded = false;

//    // ถ้าไม่ได้ Filter ให้เก็บข้อมูลต้นฉบับไว้ (ถ้า Filter อยู่ ให้ใช้ข้อมูลที่ส่งมา)
//     if (!isFiltered) {
//         allData = upcomingData.rows;
//     }
    
//     const dataToUse = isFiltered ? upcomingData.rows : allData; // ใช้ข้อมูลที่ส่งเข้ามา (ซึ่งถูกกรองมาแล้ว)

//     function showRows(limit) {
//         $container.empty();
//         const dataToRender = dataToUse.slice(0, limit);
               
//         if (dataToRender.length === 0) {
//             $container.append('<div class="p-4 text-gray-500 text-center">ไม่พบข้อมูลที่ค้นหา</div>');
//             return;
//         }
//         const htmlContent = dataToRender.map(row => {
//             const partID = getCellValue(row.c[0])
//             const totalStock = parseFloat(getCellValue(row.c[12]) || 0).toLocaleString();
//             const unit = getCellValue(row.c[13]) || "";
//             const docName = String(getCellValue(row.c[5]) || "");
//             const groupName = getCellValue(row.c[2]) || "-";

//             let bgColor = "bg-gray-100";
//             let textColor = "text-gray-600";
//             let icon = "fa-box"; // ไอคอนตั้งต้น
//             // ตรวจสอบเงื่อนไขตาม groupName
//             if (groupName.includes("กฟส.") || groupName.includes("กฟจ.")) {
//                 bgColor = "bg-green-100";
//                 textColor = "text-green-700";
//                 icon = "fa-shopping-cart";
//             } else if (groupName.includes("กจล.")) {
//                 bgColor = "bg-blue-100";
//                 textColor = "text-blue-700";
//                 icon = "fa-truck";
//             } else if (groupName.includes("ขอโอน")) {
//                 bgColor = "bg-orange-100";
//                 textColor = "text-orange-700";
//                 icon = "fa-sync-alt";
//             }
//         return `
//     <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100 hover:bg-gray-50 transition">
//         <div class="flex items-center gap-3">
//             <!-- ส่วนวงกลมแสดง Icon -->
//             <div class="w-11 h-11 ${bgColor} ${textColor} rounded-full flex items-center justify-center shrink-0">
//                 <i class="fas ${icon} text-sm"></i>
//             </div>
//             <div>
//                 <div class="font-bold text-gray-900 text-[16px]">${docName || "ไม่มีชื่อเอกสาร"}</div>
//                 <div class="text-[14px] text-gray-500 leading-tight">${groupName}</div>
//             </div>
//         </div>
//         <div class="text-right">
//             <div class="font-bold text-gray-900 text-[14px]">
//                 ${totalStock} <span class="text-xs font-normal text-gray-500">${unit}</span>
//             </div>
//         </div>
//     </div>`;
//         }).join('');
        
//         $container.append(htmlContent);
//     }

//     // เริ่มต้นแสดงผล
//     showRows(10);

//     // จัดการปุ่ม Toggle
//     if (allData.length > 10) {
//         $btn.show().text('See More');
        
//         $btn.off('click').on('click', function() {
//             isExpanded = !isExpanded; // สลับสถานะ
            
//             if (isExpanded) {
//                 showRows(allData.length);
//                 $(this).text('See Less'); // เปลี่ยนข้อความปุ่ม
//             } else {
//                 showRows(10);
//                 $(this).text('See More'); // เปลี่ยนข้อความปุ่ม
//             }
//         });
//     } else {
//         $btn.hide();
//     }
    
//     if (typeof updateCounts === 'function') updateCounts();
// },

 renderUpcomingTab(upcomingData, isFiltered = false) {
    const $container = $('#tabUpcoming');
    const $btn = $('#btnSeeMore');
    let isExpanded = false;

    // ถ้าไม่ใช่โหมดกรอง ให้บันทึกข้อมูลดิบลง rawData เสมอ
    if (!isFiltered) {
        rawData = upcomingData.rows || [];
    }
    
    // กำหนดข้อมูลที่จะใช้แสดงผล
    allData = isFiltered ? upcomingData.rows : rawData;

    function showRows(limit) {
        $container.empty();
        const dataToRender = allData.slice(0, limit);
        
        if (dataToRender.length === 0) {
            $container.append('<div class="p-4 text-gray-500 text-center">ไม่พบข้อมูล</div>');
            return;
        }

        const htmlContent = dataToRender.map(row => {
            const partID = getCellValue(row.c[0])
            const docName = String(getCellValue(row.c[5]) || "");
            const groupName = getCellValue(row.c[2]) || "-";
            const totalStock = parseFloat(getCellValue(row.c[12]) || 0).toLocaleString();
            const unit = getCellValue(row.c[13]) || "";

            let bgColor = "bg-gray-100";
            let textColor = "text-gray-600";
            let icon = "fa-box";

            if (groupName.includes("กฟส.") || groupName.includes("กฟจ.")) {
                bgColor = "bg-green"; textColor = "text-white"; icon = "fa-shopping-cart";
            } else if (groupName.includes("กจล.")) {
                bgColor = "bg-blue"; textColor = "text-white"; icon = "fa-truck";
            } else if (groupName.includes("ขอโอน")) {
                bgColor = "bg-orange"; textColor = "text-white"; icon = "fa-sync-alt";
            }

             return `
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100 hover:bg-gray-50 transition">
        <div class="flex items-center gap-3">
            <!-- ส่วนวงกลมแสดง Icon -->
            <div class="w-11 h-11 ${bgColor} ${textColor} rounded-full flex items-center justify-center shrink-0">
                <i class="fas ${icon} text-[16px]"></i>
            </div>
            <div>
                <div class="font-bold text-gray-900 text-[16px]">${docName || "ไม่มีชื่อเอกสาร"}</div>
               
                <div class="text-[14px] text-gray-500 leading-tight">${groupName}</div>
            </div>
        </div>
        <div class="text-right">

            <div class="font-bold text-gray-900 text-[16px]">
                ${totalStock} <span class="text-xs font-normal text-gray-500">${unit}</span>
            </div>
        </div>
    </div>`;
        }).join('');
        
        $container.append(htmlContent);
    }

    showRows(10);

    if (allData.length > 10) {
        $btn.show().text('See More');
        $btn.off('click').on('click', function() {
            isExpanded = !isExpanded;
            showRows(isExpanded ? allData.length : 10);
            $(this).text(isExpanded ? 'See Less' : 'See More');
        });
    } else {
        $btn.hide();
    }
    
    if (typeof updateCounts === 'function') updateCounts();
},
// renderStockN2Tab(stockN2Data) {
//     const $el = $('#tabStockN2');
    
//     if ($.fn.DataTable.isDataTable($el)) {
//         $el.DataTable().destroy();
//     }

//     // 1. Group และ Sum ข้อมูล
//     const groupedData = stockN2Data.rows.reduce((acc, row) => {
//         const location = getCellValue(row.c[0])?.toString().trim();
//         if (location === 'คลังพัสดุ พิษณุโลก') return acc;

//         const partID = getCellValue(row.c[2])?.toString().trim();
//         const locName = getCellValue(row.c[1])?.toString().trim();
//         const qty = parseFloat(getCellValue(row.c[10]) || 0);
//         const unit = getCellValue(row.c[9]) || "";

//         const groupKey = `${location}|${partID}`;

//         if (partID) {
//             if (!acc[groupKey]) {
//                 acc[groupKey] = { 
//                     partID, 
//                     location, 
//                     locNames: new Set(), // ใช้ Set เพื่อไม่ให้ Loc ซ้ำ
//                     totalQty: 0, 
//                     unit 
//                 };
//             }
//             acc[groupKey].totalQty += qty;
//             if (locName) acc[groupKey].locNames.add(locName);
//         }
//         return acc;
//     }, {});

//     // 2. แปลงเป็น Array 4 คอลัมน์
//     const dataSet = Object.values(groupedData).map(item => {
//         return [
//             item.partID,                                     // 0: รหัสพัสดุ
//             item.location,                                   // 1: คลังพัสดุ
//             Array.from(item.locNames).join(", "),            // 2: รวม Loc.
//             `${item.totalQty.toLocaleString()} ${item.unit}` // 3: รวมจำนวน
//         ];
//     });

//     // 3. สร้างตาราง
//     const table = $el.DataTable({
//         "data": dataSet,
//         "deferRender": true,
//         "pageLength": 10,
//         "dom": '<"flex justify-between items-center mb-4"<"flex items-center gap-2"f><"flex items-center"l>>rt<"flex justify-between items-center mt-4"<"text-sm text-gray-500 font-medium"i><"pagination-sm"p>>',
//         "columns": [
//             { "title": "รหัสพัสดุ" },
//             { "title": "คลังพัสดุ" },
//             { "title": "Loc." },
//             { "title": "จำนวนคงคลัง" }
//         ],
//         "responsive": true,
//         "language": { "emptyTable": "ไม่พบข้อมูลในตาราง" },
//         "columnDefs": [
//             { "targets": 0, "visible": false } // ซ่อนรหัสพัสดุไว้สำหรับ Search
//         ],
//         "drawCallback": function() {
//             if (typeof updateCounts === 'function') updateCounts();
//         }
//     });
    
//     return table;
// }
// renderStockN2Tab(stockN2Data, isFiltered = false) {
//     const $container = $('#tabStockN2');
//     const $btn = $('#btnSeeMoreStockN2');
//     let isExpanded = false;

//     // เก็บข้อมูลดิบ (ที่ยังไม่ได้สรุปผล) ไว้ตอนโหลดครั้งแรกเท่านั้น
//     if (!isFiltered) {
//         // ทำการสรุปผล (Group/Sum) ครั้งเดียวตอนโหลดข้อมูลดิบมา
//         const groupedData = stockN2Data.rows.reduce((acc, row) => {
//             if (!row || !row.c) return acc;
//             const location = getCellValue(row.c[0])?.toString().trim();
//             if (location === 'คลังพัสดุ พิษณุโลก') return acc;

//             const partID = getCellValue(row.c[2])?.toString().trim();
//             const locName = getCellValue(row.c[1])?.toString().trim();
//             const qty = parseFloat(getCellValue(row.c[10]) || 0);
//             const unit = getCellValue(row.c[9]) || "";
//             const groupKey = `${location}|${partID}`;

//             if (partID) {
//                 if (!acc[groupKey]) {
//                     acc[groupKey] = { partID, location, locNames: new Set(), totalQty: 0, unit };
//                 }
//                 acc[groupKey].totalQty += qty;
//                 if (locName) acc[groupKey].locNames.add(locName);
//             }
//             return acc;
//         }, {});
        
//         // แปลงเป็น Array แล้วเก็บใน rawDataStockN2
//         rawDataStockN2 = Object.values(groupedData);
//     }
    
//     // allData ใช้ข้อมูลจาก rawDataStockN2 เสมอ
//     const allData = isFiltered ? stockN2Data.rows : rawDataStockN2;
//     currentStockN2Data = allData;
//     function showRows(limit) {
//         $container.empty();
//         const dataToRender = allData.slice(0, limit);
        
//         if (dataToRender.length === 0) {
//             $container.append('<div class="p-4 text-gray-500 text-center">ไม่พบข้อมูล</div>');
//             return;
//         }

//         const htmlContent = dataToRender.map(item => {
//             const locList = Array.from(item.locNames).join(", ");
//             const totalQty = item.totalQty.toLocaleString();
            
//             // กำหนดสีและไอคอน (ใช้โลจิกตามตารางสต็อก)
//             // กำหนดสีและไอคอนตามชื่อคลัง
//             // กำหนดสีและไอคอนตามชื่อคลังที่ระบุมา
//             let bgColor = "bg-gray-500"; 
//             let textColor = "text-white";
//             let icon = "fa-warehouse";

//            const loc = item.location;

//             if (loc.includes("คลังพัสดุ พิจิตร")) { bgColor = "bg-green"; }
//             else if (loc.includes("คลังพัสดุ พิษณุโลก")) { bgColor = "bg-blue"; }
//             else if (loc.includes("คลังพัสดุ ตาก")) { bgColor = "bg-amber"; }
//             else if (loc.includes("คลังพัสดุ อุตรดิตถ์")) { bgColor = "bg-red"; }
//             else if (loc.includes("คลังพัสดุ แม่สอด")) { bgColor = "bg-indigo"; }
//             else if (loc.includes("คลังพัสดุ สุโขทัย")) { bgColor = "bg-violet"; }
//             else if (loc.includes("คลังพัสดุ กำแพงเพชร")) { bgColor = "bg-teal"; }
//             else if (loc.includes("คลังพัสดุ น่าน")) { bgColor = "bg-orange"; }
//             else if (loc.includes("คลังพัสดุ ตะพานหิน")) { bgColor = "bg-cyan"; }
//             else if (loc.includes("คลังพัสดุ ขาณุวรลักษบุรี")) { bgColor = "bg-fuchsia"; }
//             else if (loc.includes("คลังพัสดุ แพร่")) { bgColor = "bg-pink"; }
//             else if (loc.includes("คลังพัสดุ เพชรบูรณ์")) { bgColor = "bg-emerald"; }
//             else { bgColor = "bg-slate-700"; }

//             return `
//             <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100 hover:bg-gray-50 transition">
//                 <div class="flex items-center gap-3">
//                     <div class="w-11 h-11 ${bgColor} ${textColor} rounded-full flex items-center justify-center shrink-0">
//                         <i class="fas ${icon} text-[16px]"></i>
//                     </div>
//                     <div>
//                         <div class="font-bold text-gray-900 text-[16px]">${item.location}</div>
//                         <div class="text-[12px] text-gray-500 leading-tight">${item.partID} </div>
//                         <div class="text-[14px] text-gray-500 leading-tight font-bold"> Loc: ${locList}</div>
//                     </div>
//                 </div>
//                 <div class="text-right">
//                     <div class="font-bold text-gray-900 text-[16px]">
//                         ${totalQty} <span class="text-xs font-normal text-gray-500">${item.unit}</span>
//                     </div>
//                 </div>
//             </div>`;
//         }).join('');
        
//         $container.append(htmlContent);
//     }

//     showRows(10);

//     // จัดการปุ่ม See More
//     if (allData.length > 10) {
//         $btn.show().text('See More');
//         $btn.off('click').on('click', function() {
//             isExpanded = !isExpanded;
//             showRows(isExpanded ? allData.length : 10);
//             $(this).text(isExpanded ? 'See Less' : 'See More');
//         });
//     } else {
//         $btn.hide();
//     }
    
//     if (typeof updateCounts === 'function') updateCounts();
// } ,


// ตรวจสอบให้แน่ใจว่าตัวแปรเหล่านี้ประกาศไว้นอกฟังก์ชัน


 renderStockN2Tab(stockN2Data, isFiltered = false) {
    const $container = $('#tabStockN2');
    const $btn = $('#btnSeeMoreStockN2');
    let isExpanded = false;

    // แก้ตรงนี้: 
    // ถ้า isFiltered คือ true -> ใช้ข้อมูลที่ส่งมา (ข้อมูลที่กรองแล้ว)
    // ถ้า isFiltered คือ false -> 
    //    ถ้า stockN2Data.rows เป็น array ของ Object สรุปแล้ว (มี totalQty) -> ใช้ข้อมูลนั้นเลย
    //    ถ้าไม่ใช่ (เป็นข้อมูลดิบ) -> ถึงค่อยทำ reduce
    
    let allData = [];
    
    // ตรวจสอบว่าข้อมูลที่ส่งมาคือข้อมูลที่สรุปแล้วหรือไม่
    const isAlreadyGrouped = stockN2Data.rows.length > 0 && stockN2Data.rows[0].hasOwnProperty('totalQty');

    if (isFiltered || isAlreadyGrouped) {
        allData = stockN2Data.rows;
    } else {
        // ทำการสรุปผลเฉพาะครั้งแรกที่เป็นข้อมูลดิบ
        const groupedData = stockN2Data.rows.reduce((acc, row) => {
            if (!row || !row.c) return acc;
            
            const location = getCellValue(row.c[0])?.toString().trim();
            if (location === 'คลังพัสดุ พิษณุโลก') return acc;

            const partID = getCellValue(row.c[2])?.toString().trim();
            const locName = getCellValue(row.c[1])?.toString().trim();
            const qty = parseFloat(getCellValue(row.c[10]) || 0);
            const unit = getCellValue(row.c[9]) || "";
            const groupKey = `${location}|${partID}`;

            if (partID) {
                if (!acc[groupKey]) {
                    acc[groupKey] = { partID, location, locNames: new Set(), totalQty: 0, unit };
                }
                acc[groupKey].totalQty += qty;
                if (locName) acc[groupKey].locNames.add(locName);
            }
            return acc;
        }, {});
        
        rawDataStockN2 = Object.values(groupedData);
        allData = rawDataStockN2;
    
    }

       currentStockN2Data = allData;
       currentStockN2Data.sort((a, b) => (a.partID || "").toString().localeCompare((b.partID || "")));
    allData = currentStockN2Data;
    // 3. ฟังก์ชันแสดงผล
    function showRows(limit) {
        $container.empty();
        const dataToRender = allData.slice(0, limit);
        
        if (dataToRender.length === 0) {
            $container.append('<div class="p-4 text-gray-500 text-center">ไม่พบข้อมูล</div>');
            return;
        }

        const htmlContent = dataToRender.map(item => {
            const locList = Array.from(item.locNames).join(", ");
            const totalQty = item.totalQty.toLocaleString();
            
            let bgColor = "bg-gray-500"; 
            let textColor = "text-white";
            const loc = item.location;

            // Logic สี (เหมือนเดิม)
            if (loc.includes("คลังพัสดุ พิจิตร")) bgColor = "bg-green";
            else if (loc.includes("คลังพัสดุ พิษณุโลก")) bgColor = "bg-blue";
            else if (loc.includes("คลังพัสดุ ตาก")) bgColor = "bg-amber";
            else if (loc.includes("คลังพัสดุ อุตรดิตถ์")) bgColor = "bg-red";
            else if (loc.includes("คลังพัสดุ แม่สอด")) bgColor = "bg-indigo";
            else if (loc.includes("คลังพัสดุ สุโขทัย")) bgColor = "bg-violet";
            else if (loc.includes("คลังพัสดุ กำแพงเพชร")) bgColor = "bg-teal";
            else if (loc.includes("คลังพัสดุ น่าน")) bgColor = "bg-orange";
            else if (loc.includes("คลังพัสดุ ตะพานหิน")) bgColor = "bg-cyan";
            else if (loc.includes("คลังพัสดุ ขาณุวรลักษบุรี")) bgColor = "bg-fuchsia";
            else if (loc.includes("คลังพัสดุ แพร่")) bgColor = "bg-pink";
            else if (loc.includes("คลังพัสดุ เพชรบูรณ์")) bgColor = "bg-emerald";
            else bgColor = "bg-slate-700";

            return `
            <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100 hover:bg-gray-50 transition">
                <div class="flex items-center gap-3">
                    <div class="w-11 h-11 ${bgColor} ${textColor} rounded-full flex items-center justify-center shrink-0">
                        <i class="fas fa-warehouse text-[16px]"></i>
                    </div>
                    <div>
                        <div class="font-bold text-gray-900 text-[16px]">${item.location}</div>
                        <div class="text-[12px] text-gray-500 leading-tight">${item.partID}</div>
                        <div class="text-[14px] text-gray-500 leading-tight font-bold">Loc: ${locList}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-gray-900 text-[16px]">
                        ${totalQty} <span class="text-xs font-normal text-gray-500">${item.unit}</span>
                    </div>
                </div>
            </div>`;
        }).join('');
        
        $container.append(htmlContent);
    }

    showRows(10);

    // 4. จัดการปุ่ม See More
    if (allData.length > 10) {
        $btn.show().text('See More');
        $btn.off('click').on('click', function() {
            isExpanded = !isExpanded;
            showRows(isExpanded ? allData.length : 10);
            $(this).text(isExpanded ? 'See Less' : 'See More');
        });
    } else {
        $btn.hide();
    }

   if (typeof updateCounts === 'function') updateCounts();
},

//     const $container = $('#tabN2PO'); // เปลี่ยนจาก $el เป็น $container
//     const $btn = $('#btnSeeMoreN2PO'); // สมมติว่ามีปุ่ม See More สำหรับตารางนี้
//     let isExpanded = false;

//     // 1. ประมวลผลข้อมูล (Group By) เฉพาะเมื่อเป็นข้อมูลดิบและไม่ใช่โหมดกรอง
//     if (!isFiltered && n2poData.rows && Array.isArray(n2poData.rows)) {
//         const groupedData = n2poData.rows.reduce((acc, row) => {
//             const key = getCellValue(row.c[0]); // เอกสารการจัดซื้อ
//             if (!key) return acc;
            
//             const partID = getCellValue(row.c[5]);
//             const qty = parseFloat(getCellValue(row.c[7]) || 0);
//             const unit = getCellValue(row.c[8]) || "";
//             const warehouse = getCellValue(row.c[2]);
//             const locCode = getCellValue(row.c[3]);

//             if (!acc[key]) {
//                 acc[key] = { partID, key, warehouse, locCode, totalQty: 0, unit };
//             }
//             acc[key].totalQty += qty;
//             return acc;
//         }, {});
        
//         rawDataN2PO = Object.values(groupedData);
//     }

//     // 2. เลือกข้อมูลที่จะแสดง
//     const allData = isFiltered ? n2poData.rows : rawDataN2PO;
//     currentN2POData = allData; // อัปเดตตัวแปร Global

//     // 3. ฟังก์ชันแสดงผล (List Format)
//     function showRows(limit) {
//         $container.empty();
//         const dataToRender = allData.slice(0, limit);
        
//         if (dataToRender.length === 0) {
//             $container.append('<div class="p-4 text-gray-500 text-center">ไม่พบข้อมูล</div>');
//             return;
//         }

//         const htmlContent = dataToRender.map(item => {
//             // ดึงข้อมูล (รองรับทั้งแบบ Object สรุปแล้ว และ Row ดิบ)
//             const docName = item.key || getCellValue(item.c?.[0]);
//             const groupName = item.warehouse || getCellValue(item.c?.[2]);
//             const totalQty = (item.totalQty || parseFloat(getCellValue(item.c?.[7]) || 0)).toLocaleString();
//             const unit = item.unit || getCellValue(item.c?.[8]) || "";

//             return `
//             <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100 hover:bg-gray-50 transition">
//                 <div class="flex items-center gap-3">
//                     <div class="w-11 h-11 bg-indigo-500 text-white rounded-full flex items-center justify-center shrink-0">
//                         <i class="fas fa-file-invoice text-[16px]"></i>
//                     </div>
//                     <div>
//                         <div class="font-bold text-gray-900 text-[16px]">${docName || "ไม่มีเลขเอกสาร"}</div>
//                         <div class="text-[14px] text-gray-500 leading-tight">${groupName}</div>
//                     </div>
//                 </div>
//                 <div class="text-right">
//                     <div class="font-bold text-gray-900 text-[16px]">
//                         ${totalQty} <span class="text-xs font-normal text-gray-500">${unit}</span>
//                     </div>
//                 </div>
//             </div>`;
//         }).join('');
        
//         $container.append(htmlContent);
//     }

//     showRows(10);

//     // 4. จัดการปุ่ม See More
//     if (allData.length > 10) {
//         $btn.show().text('See More');
//         $btn.off('click').on('click', function() {
//             isExpanded = !isExpanded;
//             showRows(isExpanded ? allData.length : 10);
//             $(this).text(isExpanded ? 'See Less' : 'See More');
//         });
//     } else {
//         $btn.hide();
//     }

//     if (typeof updateCounts === 'function') updateCounts();
// },
/**
 * แสดงตารางพัสดุที่ไม่ได้รับการจัดสรร (assigned = 0)
 * @param {Array} allocatedData - ข้อมูลการจัดสรร
 * @param {Object} materialTypeMap - ประเภทพัสดุ
 */


renderInfoPOTable(allocatedData, materialTypeMap) {
    const summaryData = window.SUMMARY_DATA || {};
    const usageCountMap = window.SUMMARY_USAGE_COUNT || {};
    // แปลง Object เป็น Array เพื่อส่งให้ DataTable
    const dataSet = Object.values(summaryData).map(res => {
        // นำค่าที่ sum ไว้มาใช้ตรงๆ
        const net = res.totalNetRequired;
        const cost = res.cost;
        const usageCount = usageCountMap[res.partID] || 0;
        const totalprice = (net * cost);
        return [
            res.partID, 
            res.partName, 
            res.type,
            net,              // ความต้องการสุทธิ (ค่าที่ Sum มาแล้ว)
            cost, 
            net,              // จำนวนสั่งซื้อ (ใช้ค่าเดียวกับความต้องการสุทธิ)
            totalprice,
            usageCount + " งาน",     // ราคารวม
            res.savedStatus
        ];
    });


    const $el = $('#tableInfoPO');
    if ($.fn.DataTable.isDataTable($el)) {
        $el.DataTable().destroy();
        $el.empty();
    }
// 1. เพิ่ม <thead> และ <tfoot> ลงในตารางก่อนสร้าง DataTable
  $el.html(`
        <thead>
            <tr>
                <th>รหัสพัสดุ</th><th>ชื่อพัสดุ</th><th>ประเภท</th>
                <th>ความต้องการสุทธิ</th><th>ราคากลาง</th><th>จำนวนสั่งซื้อ</th>
                <th>ราคารวม</th><th>จำนวนงานที่ใช้</th><th>สถานะ</th>
            </tr>
        </thead>
      // ในส่วนของ $el.html(...)
<tfoot>
    <tr>
        <th colspan="8" style="text-align:right !important; vertical-align: middle !important; font-size: 20px;">
            รวมมูลค่าการสั่งซื้อทั้งหมด:
        </th>
        <th id="footer-total-price" style="text-align:right !important; vertical-align: middle !important; padding: 10px !important;">
            </th>
    </tr>
</tfoot>
    `);
     return  $el.DataTable({
    // const INFOPOTable =  $el.DataTable({
        data: dataSet,
        columns: [
            { title: "รหัสพัสดุ" },
            { title: "ชื่อพัสดุ" },
            { title: "ประเภท" },
            { title: "ความต้องการสุทธิ" },
            { title: "ราคากลาง" },
            { title: "จำนวนสั่งซื้อ" },
            { title: "ราคารวม" },
            { title: "จำนวนงานที่ใช้" },
            { title: "สถานะ" }
        ],


"footerCallback": function (row, data, start, end, display) {
    var api = this.api();
    // คำนวณจากข้อมูลที่แสดงผลอยู่ปัจจุบัน (applied filter)
    var total = api.column(6, { search: 'applied' }).data().reduce(function (a, b) {
        return parseFloat(a) + parseFloat(typeof b === 'string' ? b.replace(/,/g, '') : b || 0);
    }, 0);

    $('#footer-total-price').html(
        `<div style="background-color: #f0fdf4; padding: 10px 20px; border-radius: 6px; border: 1px solid #22c55e; color: #166534; font-weight: 800; font-size: 20px;">
            ${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท
        </div>`
    );
},

    


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
            className: 'border px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
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
                "targets": [0],
                "className": "font-bold whitespace-nowrap",
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
                "targets": [3,6], 
                "className": "text-center ",
                "render": function(data, type, row) {
                    // เช็คว่าเป็นตัวเลขหรือไม่ ถ้าใช่ให้ใส่ลูกน้ำ ถ้าไม่ใช่ให้แสดงค่าเดิม
                    return (typeof data === 'number') ? data.toLocaleString() : data;
                }
            },
                   {
    targets: 4, // คอลัมน์ราคากลาง
    render: function(data, type, row) {
        if (type !== 'display') return data;
        
        // แปลง data เป็นเลข 1 หลัก (ถ้ามีเศษ) และใช้ parseFloat เพื่อกัน Error
        // วิธีนี้จะบังคับให้ Input แสดงค่าทศนิยมแค่ 1 หลักเสมอ
        const num = parseFloat(data);
        const displayValue = Number.isInteger(num) ? num : num.toFixed(1);

        
        return `<input type="number" class="qty-input" 
                value="${displayValue}" 
                data-cost="${row[5]}" 
                min="0" 
                step="1" 
                   oninput="calculateRowTotal(this)">`;
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
        
      
        return `<span style="
                    display: inline-block;
                    padding: 4px 12px;
                    font-size: 13px; 
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
    "targets": 8, 
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
                    font-size: 13px; 
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

    // InfoPOTableInstance = INFOPOTable;

    // return INFOPOTable;
},



renderInfoHoleTable(allocatedData, materialTypeMap) {
    const summaryHold = window.SUMMARY_DATA_HOLD || {};
    const usageCountMap = window.SUMMARY_USAGE_COUNT || {};
    // แปลง Object เป็น Array
    const dataSet = Object.values(summaryHold)
        .filter(res => res.totalNetRequired > 0)
        .map(res => {

            const usageCount = usageCountMap[res.partID] || 0;
 
            return [
                res.partID, 
                res.partName, 
                res.type,
                res.totalNetRequired, // ยอดคงค้างที่ติด Hold
                res.cost,
                // 0,                    // จำนวนสั่งซื้อ (รายการ Hold ปกติจะสั่งซื้อไม่ได้หรือเป็น 0)
                res.totalNetRequired*res.cost,                    // ราคารวม
                usageCount + " งาน", //จำนวนงานที่ใช้
                 res.savedStatus                // สถานะ
            ];
        });

    const $el = $('#tableHole');
   if ($.fn.DataTable.isDataTable($el)) {
        $el.DataTable().destroy();
        $el.empty();
    }
// 1. เพิ่ม <thead> และ <tfoot> ลงในตารางก่อนสร้าง DataTable
  $el.html(`
        <thead>
            <tr>
                <th>รหัสพัสดุ</th><th>ชื่อพัสดุ</th><th>ประเภท</th>
                <th>ความต้องการสุทธิ</th><th>ราคากลาง</th>
                <th>ราคารวม</th><th>จำนวนงานที่ใช้</th><th>สถานะ</th>
            </tr>
        </thead>
      // ในส่วนของ $el.html(...)
<tfoot>
    <tr>
        <th colspan="7" style="text-align:right !important; vertical-align: middle !important; font-size: 20px;">
            รวมมูลค่าการสั่งซื้อทั้งหมด:
        </th>
        <th id="footer-total-price" style="text-align:right !important; vertical-align: middle !important; padding: 10px !important;">
            </th>
    </tr>
</tfoot>
    `);

    const HoleTable = $el.DataTable({
        data: dataSet,
        columns: [
            { title: "รหัสพัสดุ" },
            { title: "ชื่อพัสดุ" },
            { title: "ประเภท" },
            { title: "ความต้องการสุทธิ" },
            { title: "ราคากลาง" },
            { title: "ราคารวม" },
            { title: "จำนวนงานที่ใช้" },
            { title: "สถานะ" }
        ],
        "footerCallback": function (row, data, start, end, display) {
    var api = this.api();

    // ข้อมูลใน api.column(6).data() จะได้รับค่าล่าสุดที่คุณใส่ไปใน rowData[6]
    var total = api.column(5).data().reduce(function (a, b) {
        var valB = typeof b === 'string' ? b.replace(/,/g, '') : b;
        return parseFloat(a) + parseFloat(valB || 0);
    }, 0);

    // ยิงค่าเข้า ID ที่เราย้ายมาอยู่ที่ index 8 (คอลัมน์ที่ 9)
    $('#footer-total-price').html(
                `<div style="background-color: #f0fdf4; padding: 10px 20px; border-radius: 6px; border: 1px solid #22c55e; color: #166534; font-weight: 800; font-size: 20px; display: inline-block; min-width: 200px; text-align: right;">

            ${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท
        </div>`
    );
},
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
                "targets": [3,4,5], 
                "className": "text-center ",
                "render": function(data, type, row) {
                    // เช็คว่าเป็นตัวเลขหรือไม่ ถ้าใช่ให้ใส่ลูกน้ำ ถ้าไม่ใช่ให้แสดงค่าเดิม
                    return (typeof data === 'number') ? data.toLocaleString() : data;
                }
            },
    //       {
    //     targets: 5, // คอลัมน์ "จำนวนที่ขอโอน"
    //     className: "text-center",
    //     render: function(data, type, row) {
    //         // ดึงค่าที่บันทึกไว้ใน localStorage
    //         const saveQtytransfer = localStorage.getItem('qty_' + row[0]) || 0;
    //         return saveQtytransfer; // แสดงค่าเฉยๆ ไม่ต้องมี Input
    //     }
    // },
    // {
    //     targets: 5, // คอลัมน์ "ราคารวม"
    //     className: "text-center",
    //    "render": function(data, type, row) {
    //                 // เช็คว่าเป็นตัวเลขหรือไม่ ถ้าใช่ให้ใส่ลูกน้ำ ถ้าไม่ใช่ให้แสดงค่าเดิม
    //                 return (typeof data === 'number') ? data.toLocaleString() : data;
    //             }
    // },
    {
    "targets": 6, 
    "className": "text-center",
    "responsivePriority": 1,
    "render": function(data, type, row) {
        // กำหนดสีตามสถานะ
        let bgColor = "#e5e7eb"; // สีเทา (Default)
        let textColor = "#374151"; // สีเทาเข้ม
        
      
        return `<span style="
                    display: inline-block;
                    padding: 4px 12px;
                    font-size: 13px; 
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
                    font-size: 13px; 
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

renderInfoTransferTable(allocatedData, materialTypeMap) { 
    const summaryTransfer = window.SUMMARY_DATA_TRANSFER || {};
    const noStockCache = window.NO_STOCK_CACHE || [];
    const usageCountMap = window.SUMMARY_USAGE_COUNT || {};
    // แปลง Object เป็น Array
    const dataSet = Object.values(summaryTransfer)
        // .filter(res => res.originalPending > 0)
        .map(res => {


            const matchedItem = noStockCache.find(item => item.partID === res.partID);
            
            // ถ้าเจอข้อมูลใน noStock ให้ดึงค่า totalRemaining - upcoming ออกมา
            // ถ้าไม่เจอ ให้ใช้ค่าเริ่มต้น (เช่น 0)
            const totalRequired = matchedItem ? (matchedItem.totalRemaining - (window.DATA_STORE.maps.upcoming[res.partID] || 0)) : 0;
            const savedQtyTransfer = parseFloat(localStorage.getItem('qty_' + res.partID)) || 0;
              const usageCount = usageCountMap[res.partID] || 0;
            // 2. คำนวณราคารวมจากจำนวนที่ขอโอน (savedQtyTransfer) แทนที่จะเป็น totalRequired
            const totalPrice = savedQtyTransfer * (res.cost || 0);
            return [
                res.partID, 
                res.partName, 
                res.type,
                res.originalPending,
                // totalRequired, // ยอดคงค้างที่ติด Hold
                res.cost,
                savedQtyTransfer,                    // จำนวนสั่งซื้อ (รายการ Hold ปกติจะสั่งซื้อไม่ได้หรือเป็น 0)
                totalPrice,                    // ราคารวม
                usageCount + " งาน",  //จำนวนงานที่ใช้
                res.savedStatus                // สถานะ
            ];
        });

    const $el = $('#tableTransfer');
    if ($.fn.DataTable.isDataTable($el)) {
        $el.DataTable().destroy();
        $el.empty();
    }
// 1. เพิ่ม <thead> และ <tfoot> ลงในตารางก่อนสร้าง DataTable
  $el.html(`
        <thead>
            <tr>
                <th>รหัสพัสดุ</th><th>ชื่อพัสดุ</th><th>ประเภท</th>
                <th>ความต้องการสุทธิ</th><th>ราคากลาง</th><th>จำนวนที่ขอโอน</th>
                <th>ราคารวม</th><th>จำนวนงานที่ใช้</th><th>สถานะ</th>
            </tr>
        </thead>
      // ในส่วนของ $el.html(...)
<tfoot>
    <tr>
        <th colspan="8" style="text-align:right !important; vertical-align: middle !important; font-size: 20px;">
            รวมมูลค่าการสั่งซื้อทั้งหมด:
        </th>
        <th id="footer-total-price" style="text-align:right !important; vertical-align: middle !important; padding: 10px !important;">
            </th>
    </tr>
</tfoot>
    `);

    const TransferTable = $el.DataTable({
        data: dataSet,
        columns: [
            { title: "รหัสพัสดุ" },
            { title: "ชื่อพัสดุ" },
            { title: "ประเภท" },
            { title: "ความต้องการสุทธิ" },
            { title: "ราคากลาง" },
            { title: "จำนวนที่ขอโอน" },
            { title: "ราคารวม" },
            { title: "จำนวนงานที่ใช้" },
            { title: "สถานะ" }
        ],

"footerCallback": function (row, data, start, end, display) {
    var api = this.api();

    // 1. ใช้ api.column(6) เพื่อดึงข้อมูลคอลัมน์ที่ 7 (ราคารวม)
    var total = api.column(6, {page: 'current'}).data().reduce(function (a, b) {
        // จัดการกรณีเป็น String ที่มี comma หรือเป็น object
        var val = typeof b === 'string' ? b.replace(/,/g, '') : (b || 0);
        return parseFloat(a) + parseFloat(val);
    }, 0);

    // 2. ใช้ $(this).find('#footer-total-price') เพื่อให้มั่นใจว่าหา ID ในตารางนี้เท่านั้น
    $(this).find('#footer-total-price').html(
        `<div style="background-color: #f0fdf4; padding: 10px 20px; border-radius: 6px; border: 1px solid #22c55e; color: #166534; font-weight: 800; font-size: 20px; display: inline-block; min-width: 200px; text-align: right;">
            ${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท
        </div>`
    );
},
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
                "targets": [3,4], 
                "className": "text-center ",
                "render": function(data, type, row) {
                    // เช็คว่าเป็นตัวเลขหรือไม่ ถ้าใช่ให้ใส่ลูกน้ำ ถ้าไม่ใช่ให้แสดงค่าเดิม
                    return (typeof data === 'number') ? data.toLocaleString() : data;
                }
            },
          {
        targets: 5, // คอลัมน์ "จำนวนที่ขอโอน"
        className: "text-center",
        "render": function(data, type, row) {
                    // เช็คว่าเป็นตัวเลขหรือไม่ ถ้าใช่ให้ใส่ลูกน้ำ ถ้าไม่ใช่ให้แสดงค่าเดิม
                    return (typeof data === 'number') ? data.toLocaleString() : data;
                }
    },
    {
        targets: 6, // คอลัมน์ "ราคารวม"
        className: "text-center",
       "render": function(data, type, row) {
                    // เช็คว่าเป็นตัวเลขหรือไม่ ถ้าใช่ให้ใส่ลูกน้ำ ถ้าไม่ใช่ให้แสดงค่าเดิม
                    return (typeof data === 'number') ? data.toLocaleString() : data;
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
        
      
        return `<span style="
                    display: inline-block;
                    padding: 4px 12px;
                    font-size: 13px; 
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
    "targets": 8, 
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
                    font-size: 13px; 
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

    TransferTable.buttons().container().appendTo('#export-InfoTransfer');
    return TransferTable;
},

// renderWorkSummarytable() {
//     const $el = $('#tableWorkSummary');
//     if ($el.length === 0) return;

//     // 1. ดึงข้อมูลดิบและเช็คความพร้อม
//     const allocatedData = window.DATA_STORE?.allocated;
//     if (!allocatedData || !Array.isArray(allocatedData)) return;

//     // 2. Group by WBS และรวมค่าที่ต้องการ
//     // ใช้ Object เก็บข้อมูลเพื่อเป็น Map (Key = WBS)
//     const groupedData = allocatedData.reduce((acc, curr) => {
//         const wbs = curr.wbs;
//         if (!wbs) return acc;

//         // ถ้ายังไม่มี WBS นี้ในกลุ่ม ให้สร้างโครงสร้างไว้
//         if (!acc[wbs]) {
//             const info = window.WORK_INFO_MAP[wbs] || { jobName: "-", pea: "-" };
//             const peaShort = info.pea?.toString().trim();
//             const peaFullName = window.PEAName_MAP[peaShort] || peaShort;
//             acc[wbs] = {
//                 wbs: wbs,
//                 rank: window.GLOBAL_RANK_MAP[wbs] || 999,
//                 jobName: info.jobName,
//                 pea: peaFullName,
//                 budget: window.BUDGET_MAP[wbs] || 0,
//                 hasMissingItems: false // flag ไว้เช็คว่ามีของขาดไหม
//             };
//         }

//         // เช็คสถานะขาดของ (จาก SUMMARY_USAGE_COUNT ที่คุณทำไว้)
//         const partID = curr.partID?.trim();
//         if (window.SUMMARY_USAGE_COUNT && window.SUMMARY_USAGE_COUNT[partID] > 0) {
//             acc[wbs].hasMissingItems = true;
//         }

//         return acc;
//     }, {});

//     // 3. แปลง Object เป็น Array สำหรับ DataTable
//   // ดึงข้อมูลงานทั้งหมดจาก Map ที่สร้างไว้
//     const dataSet = Object.values(window.WORK_SUMMARY_MAP || {}).map(item => {
//         const info = window.WORK_INFO_MAP[item.wbs] || { jobName: "-", pea: "-" };
//         const peaFullName = window.PEAName_MAP[info.pea?.toString().trim()] || info.pea;
//         const budget = window.BUDGET_MAP[item.wbs] || 0;

//         return [null, 
//             item.rank,
//             item.wbs,
//             info.jobName,
//             peaFullName,
//             budget.toLocaleString()];
//     });

//     // 4. เรนเดอร์ DataTable
//  if ($.fn.DataTable.isDataTable($el)) $el.DataTable().destroy();
    
//     const table = $el.DataTable({
//         data: dataSet,
//         columns: [
//             { className: 'details-control', orderable: false, data: null, defaultContent: '➕' }, // ปุ่มกด
//             { title: "อันดับ" }, 
//             { title: "หมายเลขงาน" }, 
//             { title: "ชื่องาน" }, 
//             { title: "การไฟฟ้า" }, 
//             { title: "มูลค่างาน" }
//         ],
//         order: [[1, 'asc']] // เรียงตามอันดับ (index 1 ในตารางใหม่เพราะเพิ่มปุ่ม)
//     });

//     // 🎯 เพิ่ม Event คลิกเพื่อแสดงข้อมูลย่อย (Child Rows)
//     $el.find('tbody').on('click', 'td.details-control', function () {
//         const tr = $(this).closest('tr');
//         const row = table.row(tr);
//         const wbs = row.data()[2]; // หมายเลขงานอยู่คอลัมน์ที่ 2

//         if (row.child.isShown()) {
//             row.child.hide();
//             tr.removeClass('shown');
//             $(this).text('➕');
//         } else {
//             // ดึงรายการพัสดุที่ขาดของใน WBS นี้
//             const details = getMaterialDetailsByWBS(wbs);
//             row.child(formatChildRow(details)).show();
//             tr.addClass('shown');
//             $(this).text('➖');
//         }
//     });
// },
renderWorkSummarytable() {
    const $el = $('#tableWorkSummary');
    if ($el.length === 0) return;

    // กรองเอาเฉพาะ WBS ที่มีสถานะ hasMissingItems เป็น true (ถ้าต้องการโชว์แค่ที่ขาด)
    const summaryList = Object.values(window.WORK_SUMMARY_MAP || {}).filter(item => item.hasMissingItems);

    const dataSet = summaryList.map(item => {
       const info = window.WORK_INFO_MAP[item.wbs] || { jobName: "-", pea: "-" };
    const peaFullName = window.PEAName_MAP[info.pea?.toString().trim()] || info.pea;
    
    // 🎯 แก้ไขตรงนี้: ตรวจสอบค่า budget ให้เป็นตัวเลขก่อนเสมอ
    const budget = window.BUDGET_MAP[item.wbs] || 0; 

    return [
        null, 
        item.rank,
        item.wbs,
        info.jobName,
        peaFullName,
        // ใช้การตรวจสอบก่อนเรียก toLocaleString หรือแปลงเป็น Number ก่อน
        (typeof budget === 'number' ? budget : parseFloat(budget) || 0).toLocaleString()
    ];
    });

    if ($.fn.DataTable.isDataTable($el)) $el.DataTable().destroy();
    
    const table = $el.DataTable({
        data: dataSet,
        columns: [
            { className: 'details-control', orderable: false, data: null, defaultContent: '➕' },
            { title: "อันดับ" }, 
            { title: "หมายเลขงาน" }, 
            { title: "ชื่องาน" }, 
            { title: "การไฟฟ้า" }, 
            { title: "มูลค่างาน" }
        ],
        order: [[1, 'asc']],
        "dom": '<"row mb-3"<"col-md-6"f><"col-md-6 d-flex justify-content-end"B>>rt<"row mt-3"<"col-md-6 d-flex align-items-center gap-3"li><"col-md-6 d-flex justify-content-end"p>>',    
    });

    // // Event คลิกเพื่อดึงข้อมูลจาก เปิดข้อมูลพัสดุที่ซ่อนอยู่
    //  $el.find('tbody').on('click', 'td.details-control', function () {
    //     const tr = $(this).closest('tr');
    //     const row = table.row(tr);
    //     const wbs = row.data()[2]; // หมายเลขงานอยู่คอลัมน์ที่ 2

    //     if (row.child.isShown()) {
    //         row.child.hide();
    //         tr.removeClass('shown');
    //         $(this).text('➕');
    //     } else {
    //         // ดึงรายการพัสดุที่ขาดของใน WBS นี้
    //         const details = getMaterialDetailsByWBS(wbs);
    //         row.child(formatChildRow(details)).show();
    //         tr.addClass('shown');
    //         $(this).text('➖');
    //     }
    // });
},

renderNoStock_AfterUpcomingTable: function(allocatedData, materialTypeMap, budget) {
        if (!allocatedData || !Array.isArray(allocatedData)) return null;
// renderNoStock_AfterUpcomingTable(allocatedData, materialTypeMap) {
//     if (!allocatedData || !Array.isArray(allocatedData)) return null;
    // 1. นำข้อมูลที่ได้รับมา กรองตามจำนวนที่เลือกใน FilterModule (ถ้ามีการส่งข้อมูลที่กรองมาแล้ว ให้ใช้ตามนั้น)
  
    // 🎯 เพิ่มบรรทัดนี้ไว้ที่นี่
    window.SUMMARY_DATA = {}; 
    window.SUMMARY_DATA_TRANSFER = {};
    window.SUMMARY_TOTAL_ALLOCATED = {};
    window.SUMMARY_USAGE_COUNT = {};
    window.WORK_SUMMARY_MAP = {};
    window.SUMMARY_DATA_NOSTOCK = {};
    window.FINAL_CALCULATED_DATA = [];


    // ดึงค่าจาก input ที่คุณสร้างไว้
    const totalBudget = parseFloat($('#amount').val()) || 0;
    let remainingBudget = totalBudget; // งบที่เหลืออยู่สำหรับจัดสรร
    const limit = window.CURRENT_RANK_LIMIT || 9999;
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
    
    // 2. ประกาศตัวแปร limit และ limitedData (เพื่อเอาไป map ข้อมูล)
    
    const result = getTopRankedWbsData(sortedData, limit);
    const filteredData = result.filteredData;
    const newOrderMap = result.newOrderMap;

    const upcomingBalance = { ...upcoming };
    const transferBalance = {};

    // 🎯 สแกน Hold ทั้ง WBS ไว้ก่อน
    const wbsHoldMap = {};
    filteredData.forEach(res => {
        if (localStorage.getItem('status_' + res.partID) === "Hold") {
            wbsHoldMap[res.wbs] = "Hold";
        }
    });


     
    const dataSet = filteredData.map(res => {
        const wbsKey = res.wbs ? res.wbs.toString().trim() : "";
        const rank = rankMap[wbsKey] || "-";
        const partID = res.partID?.trim();
        const materialInfo = materialTypeMap[partID] || { type: "-" };
        const unitCost = parseFloat(materialInfo.cost) || 0;
        
        const remaining = (res.pending || 0) - (res.assigned || 0);
        const newOrder = newOrderMap[wbsKey] || "-";
        // 1. คำนวณ Upcoming
        const availableUpcoming = upcomingBalance[partID] || 0;
        const allocatedQty = Math.min(remaining, availableUpcoming);
        upcomingBalance[partID] = availableUpcoming - allocatedQty;
         if (!window.WORK_SUMMARY_MAP[wbsKey]) {
            window.WORK_SUMMARY_MAP[wbsKey] = { wbs: wbsKey, rank: rank };
        }
        // 2. คำนวณ Transfer 
        if (transferBalance[partID] === undefined) {
            transferBalance[partID] = parseInt(localStorage.getItem('qty_' + partID)) || 0;
        }

        const netAfterUpcoming = remaining - allocatedQty;
        const statusAfUpcoming = netAfterUpcoming <= 0 ? "ได้ของครบ" : "ของขาด";
        const demandBeforeTransfer = remaining - allocatedQty;
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
        const totalCost = unitCost * finalNetRequired; // คำนวณราคารวม
        // let budgetAllocated = 0;
        // let budgetDeficit = 0;
    //    // คำนวณเงินที่ได้รับ
        let budgetAllocated = 0;
        if (remainingBudget >= totalCost) {
            budgetAllocated = totalCost;
            remainingBudget -= totalCost;
        } else if (remainingBudget > 0) {
            budgetAllocated = remainingBudget;
            remainingBudget = 0;
        }

        // คำนวณเงินที่ขาด
        const budgetDeficit = totalCost - budgetAllocated;

        // คำนวณสถานะ (ปรับเงื่อนไขใหม่)
        let budgetStatus;
        if (budgetAllocated === 0 && remainingBudget === 0) {
            budgetStatus = "รอแจกเงิน"; // กรณีงบหมดก่อนถึงรายการนี้
        } else if (budgetDeficit <= 0) {
            budgetStatus = "เงินครบ";
        } else {
            budgetStatus = "เงินขาด";
        }

    // 2. เช็กเงื่อนไขแจกงบ
// if (statusfinal === "ขาดของ") {
//     // ถ้าระบบยังไม่มีการกรอกงบหรือ remainingBudget เป็น 0
//     if (remainingBudget <= 0) {
//         budgetStatus = "รอแจกเงิน";
//     } else {
//         // แจกงบเฉพาะรายการที่ "ขาดของ"
//         const totalCost = unitCost * finalNetRequired;
//         if (remainingBudget >= totalCost) {
//             budgetAllocated = totalCost;
//             remainingBudget -= totalCost;
//         } else {
//             budgetAllocated = remainingBudget;
//             remainingBudget = 0;
//         }
//         budgetDeficit = totalCost - budgetAllocated;
//         budgetStatus = (budgetDeficit <= 0) ? "เงินครบ" : "เงินขาด";
//     }
// }
      
        //  นับจำนวนงานของพัสดุ
        if (statusfinal === "ขาดของ") {
            if (!window.SUMMARY_USAGE_COUNT[partID]) {
                window.SUMMARY_USAGE_COUNT[partID] = 0;
            }
            window.SUMMARY_USAGE_COUNT[partID]++;
        }    
    // if (finalNetRequired > 0) {
    if (!window.WORK_SUMMARY_MAP[wbsKey]) {
        // ดึงข้อมูลพื้นฐานมาใส่ (หรือใส่ค่าว่างไว้ก่อน)
        const info = window.WORK_INFO_MAP[wbsKey] || { jobName: "ไม่พบข้อมูลงาน", pea: "-" };
        window.WORK_SUMMARY_MAP[wbsKey] = { 
            wbs: wbsKey, 
            rank: rank,
            jobName: info.jobName,
            pea: info.pea,
            budget: window.BUDGET_MAP[wbsKey] || 0,
            hasMissingItems: true // Flag ว่า WBS นี้มีของขาด
        };
    } 
    else {
        // ถ้ามีอยู่แล้ว แค่อัปเดตสถานะว่ามีของขาด
        window.WORK_SUMMARY_MAP[wbsKey].hasMissingItems = true;
    }
// }   
       
    // 1. ถัง "ขอโอน" (สำหรับตาราง InfoTransfer)
    if (savedStatus === "ขอโอน") {
        if (!window.SUMMARY_DATA_TRANSFER) window.SUMMARY_DATA_TRANSFER = {};
        
        if (!window.SUMMARY_DATA_TRANSFER[partID]) {
            window.SUMMARY_DATA_TRANSFER[partID] = { 
                partID, 
                partName: res.partName, 
                type: materialInfo.type, 
                cost: materialInfo.cost || 0,
                // 🎯 เก็บยอดตั้งต้นไว้ตรงนี้ "ห้าม" นำไปหักลบอะไรทั้งสิ้น
                originalPending: 0, 
                savedStatus: "ขอโอน"
            };
        }
         window.SUMMARY_DATA_TRANSFER[partID].originalPending += parseFloat(remaining) ;
        }





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

    }
   
     if (finalsaveStatus === "จัดซื้อใหม่" || finalsaveStatus === "ขอโอน") {
        // 🎯 เก็บยอดรายการปกติ (ส่วนนี้เหมือนเดิมที่คุณใช้อยู่)
        if (!window.SUMMARY_DATA[partID]) {
            window.SUMMARY_DATA[partID] = {
                    partID: partID,
                    partName: res.partName,
                    type: materialInfo.type,
                    cost: materialInfo.cost || 0,
                    totalNetRequired: 0,
                     totalPending: 0,
                    totalAssigned: 0,
                    totalNetUpcomingRequired:0,
                    savedStatus: finalsaveStatus
                };
        }
        window.SUMMARY_DATA[partID].totalNetRequired += parseFloat(finalNetRequired) || 0;
          window.SUMMARY_DATA[partID].totalPending += parseFloat(remaining) ;
            window.SUMMARY_DATA[partID].totalAssigned += parseFloat(res.assigned) || 0;
            window.SUMMARY_DATA[partID].totalNetUpcomingRequired += parseFloat(netAfterUpcoming) || 0;
    }
}
 
            if (!window.SUMMARY_DATA_NOSTOCK[partID]) { // เปลี่ยนชื่อตัวแปร
                window.SUMMARY_DATA_NOSTOCK[partID] = {
                    partID: partID,
                    partName: res.partName,
                    type: materialInfo.type,
                    totalPending: 0,
                    totalAssigned: 0,
                    totalNetRequired: 0,
                    savedStatus: "จัดซื้อใหม่"
                };
            }
            
            window.SUMMARY_DATA_NOSTOCK[partID].totalPending += parseFloat(remaining) ;
            window.SUMMARY_DATA_NOSTOCK[partID].totalAssigned += parseFloat(res.assigned) || 0;
            window.SUMMARY_DATA_NOSTOCK[partID].totalNetRequired += parseFloat(netAfterUpcoming) || 0;
        



    window.FINAL_CALCULATED_DATA.push({
            wbs: res.wbs,
            partID: partID,
            partName: res.partName,
            pending: remaining, 
            finalNetRequired: finalNetRequired,
            status: statusfinal
        });
        return [
            // savedRankMap[res.wbs] || "-",
            rank,
            res.wbs || "-",
            partID || "-",
            res.partName || "-",
            materialInfo.type,
            remaining,       // ค้างเบิก
            allocatedQty,    // ที่ได้ (Upcoming)
            netAfterUpcoming,     // ความต้องการหลังหัก upcoming
            statusAfUpcoming,           // สถานะของหลังหัก upcoming
            allocatedTransfer, // รวมที่ได้โอน
            finalNetRequired, // ความต้องการหลังขอโอน
           
            statusfinal, // สถานะของหลังโอน
            savedStatus,
            finalsaveStatus, // สถานะการจัดซื้อ
            newOrder,
            unitCost.toLocaleString(),      // ราคากลาง
            totalCost.toLocaleString(undefined, {minimumFractionDigits: 2}), // ราคารวม
            budgetAllocated.toLocaleString(undefined, {minimumFractionDigits: 2}), // เงินที่ได้รับ
            budgetDeficit.toLocaleString(undefined, {minimumFractionDigits: 2}),  // เงินที่ขาด
            budgetStatus                                                        // สถานะการเงิน
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
            { title: "สถานะที่ใช้จริง" },
            { title: "อันดับใหม่" },
             { title: "ราคากลาง" },
             { title: "ราคารวม" },
             { title: "งบที่ได้" },
            { title: "งบที่ขาด" },
            { title: "สถานะการเงิน" },
        ];

const NoStock_AfterUpcomingTable = $el.DataTable({
    "data": dataSet,
    "columns": colHeaders,
    "deferRender": true,
    "scrollX": true,
    "autoWidth": false, // ป้องกันตารางบีบเอง
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
            "targets": [0],
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
            return `<span class="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">✗ ของขาด</span>`;
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
        },
        {
    "targets": [17, 18], // คอลัมน์เงินที่ได้รับ/ขาด
    "className": "text-right"
},
{
    "targets": 19, // Index ของคอลัมน์สถานะการเงิน
    "className": "text-center",
    "render": function(data) {
        switch(data) {
            case "เงินครบ":
                return `<span class="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">✓ เงินครบ</span>`;
            case "เงินขาด":
                return `<span class="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">✗ เงินขาด</span>`;
            case "รอแจกเงิน":
                return `<span class="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">⌛ รอแจกเงิน</span>`;
            default: // "ไม่ต้องการเงิน"
                return `<span class="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">─ ไม่ต้องการเงิน</span>`;
        }
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


//============== 🎯 ฟังก์ชันช่วยสร้าง Worksummary ของข้อมูลย่อย ===============================//

// วางไว้นอกฟังก์ชัน render เพื่อผูก Event ไว้ที่ตัวตารางถาวร
$(document).on('click', '#tableWorkSummary tbody td.details-control', function () {
    // ดึง Instance ของตารางที่สร้างขึ้นใหม่ล่าสุดเสมอ
    const table = $('#tableWorkSummary').DataTable();
    const tr = $(this).closest('tr');
    const row = table.row(tr);
    
    // ตรวจสอบว่ามีข้อมูลบรรทัดนั้นจริงหรือไม่
    if (!row.any()) return;

    const wbs = row.data()[2]; 

    if (row.child.isShown()) {
        row.child.hide();
        tr.removeClass('shown');
        $(this).text('➕');
    } else {
        const details = getMaterialDetailsByWBS(wbs);
        row.child(formatChildRow(details)).show();
        tr.addClass('shown');
        $(this).text('➖');
    }
});

function formatChildRow(items) {
    let html = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px; width:100%; background:#f9f9f9;">';
    html += '<thead><tr><th>รหัสพัสดุ</th><th>ชื่อพัสดุ</th><th>ค้างเบิก</th><th>จำนวนที่ได้</th></tr></thead><tbody>';
    items.forEach(item => {
        html += `<tr><td>${item.partID}</td>
        <td>${item.partName}</td>
        <td>${item.pending}</td>
        <td>${item.receivedQty}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    return html;
}

// 🎯 ฟังก์ชันดึงพัสดุที่เกี่ยวข้องกับ WBS นั้นๆ แสดง
function getMaterialDetailsByWBS(wbs) {
    const data = window.FINAL_CALCULATED_DATA || [];
    
    // Debug ดูว่าข้อมูลที่กรองมามีค่า finalNetRequired หรือไม่
    console.log("Filtered Data for WBS:", data.filter(res => res.wbs === wbs));

    return data
        .filter(res => res.wbs === wbs)
        .map(res => ({
            partID: res.partID,
            partName: res.partName,
            pending: res.pending || 0,
            receivedQty: (res.pending || 0) - (res.finalNetRequired || 0)
        }));
}

// ช=========================================================================//
/**
 * คำนวณราคารวมต่อแถวแบบ Real-time
 * @param {HTMLInputElement} inputElement - องค์ประกอบ input ที่มีการเปลี่ยนแปลงค่า
 */

function buttonRunProcess() {
    const budget = parseFloat($('#amount').val()) || 0;
    if (budget <= 0) {
        alert("กรุณากรอกจำนวนเงินให้ถูกต้อง");
        return;
    }
    
    // 🎯 แก้ไขบรรทัดนี้: เรียกใช้ฟังก์ชันจาก TableRenderer แทนการเรียกชื่อลอย ๆ
    TableRenderer.renderNoStock_AfterUpcomingTable(window.DATA_STORE.allocated, window.DATA_STORE.materialMap, budget);
}

$(document).ready(function() {
    $('#btn-process').on('click', function() {
        buttonRunProcess(); 
    });
});

window.calculateRowTotal = function(inputElement) {
    const qty = parseFloat(inputElement.value) || 0;
    const cost = parseFloat(inputElement.getAttribute('data-cost')) || 0;
    const totalRaw = qty * cost; // ใช้ค่าดิบ (Raw value)

    const table = $('#tableInfoPO').DataTable();
    const row = table.row($(inputElement).closest('tr'));

    // อัปเดต Data Store ด้วยค่าดิบเสมอ เพื่อใช้ในการคำนวณรวมตอน Export
    const rowData = row.data();
    rowData[6] = totalRaw; 
    
    // อัปเดตหน้าจอ (ทำเฉพาะการแสดงผล)
    $(inputElement).closest('tr').find('td').eq(6).text(totalRaw.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }));

    table.draw(false); // เรียกให้ Footer คำนวณใหม่จากค่าดิบใน Data Store
};
// ฟังก์ชันอัปเดตจำนวนแถวที่แสดงในแต่ละแท็บ (Upcoming, StockN2, N2PO) และแสดงผลในช่องที่กำหนดไว้
function updateCounts() {

    const upcomingCount = (typeof allData !== 'undefined' && Array.isArray(allData)) ? allData.length : 0;
    const stockN2Count = (typeof currentStockN2Data !== 'undefined' && Array.isArray(currentStockN2Data)) ? currentStockN2Data.length : 0;
    // const n2poCount = (typeof rawDataN2PO !== 'undefined' && Array.isArray(rawDataN2PO)) ? rawDataN2PO.length : 0;
    // คำนวณจำนวนแถว
    const counts = {
        upcoming: upcomingCount,
        stockN2: stockN2Count,
        // n2po: n2poCount
        
    };

    // ใช้ .toLocaleString() เพื่อเพิ่มคอมม่า (เช่น 1000 กลายเป็น 1,000)
    const elements = [
        { id: 'count-upcoming', val: counts.upcoming },
        { id: 'count-stockN2', val: counts.stockN2 },
        // { id: 'count-n2po', val: counts.n2po }
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
        InfoTransfer: $.fn.DataTable.isDataTable('#tableTransfer') ? $('#tableTransfer').DataTable().rows({filter: 'applied'}).count() : 0,
       
    };

    // ใช้ .toLocaleString() เพื่อเพิ่มคอมม่า (เช่น 1000 กลายเป็น 1,000)
    const elements = [
        { id: 'count-InfoPO', val: counts.InfoPO },
        { id: 'count-InfoHole', val: counts.InfoHole },
         { id: 'count-InfoTransfer', val: counts.InfoTransfer },
   
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
         'InfoTransfer': '#tableTransfer',
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



// ====== ฟิลเตอร์ rank =======//
function updateRankFilter(newLimit) {
    window.CURRENT_RANK_LIMIT = parseInt(newLimit);
    
    // เรียกใช้ข้อมูลดิบจาก window.FULL_ALLOCATED_DATA เสมอ
    // เพื่อให้ฟังก์ชัน getTopRankedWbsData ไปนับและตัด "งาน" ใหม่ให้คุณ
    renderNoStock_AfterUpcomingTable(window.FULL_ALLOCATED_DATA, window.MATERIAL_TYPE_MAP);
    // renderNoStockTable();
    refreshTables();
}

function getTopRankedWbsData(fullData, limit) {
    const currentLimit = limit || 50; 
    const rankMap = window.GLOBAL_RANK_MAP || {};

    const uniqueWbs = [...new Set(fullData.map(res => res.wbs))];
    const sortedWbs = uniqueWbs.sort((a, b) => (rankMap[a] || 999) - (rankMap[b] || 999));
    const topWbsList = sortedWbs.slice(0, currentLimit);

    // สร้าง Map ลำดับใหม่ (Index + 1) เพื่อเอาไว้โชว์เป็น "อันดับที่จัดใหม่"
    const newOrderMap = {};
    topWbsList.forEach((wbs, index) => {
        newOrderMap[wbs] = index + 1;
    });

    // คืนค่าทั้งข้อมูลที่กรองแล้ว และ Map ลำดับใหม่
    return {
        filteredData: fullData.filter(res => topWbsList.includes(res.wbs)),
        newOrderMap: newOrderMap
    };
}
/** * 1. ฟังก์ชันอัปเดตค่าที่แสดงผล (ทำหน้าที่แค่ Sync UI) 
   */
  function updateUI(value) {
    const slider = document.getElementById('rankSlider');
    const input = document.getElementById('rankInput');
    const display = document.getElementById('rank-display');
    
    // อัปเดตทุกจุดให้ตรงกัน
    slider.value = value;
    input.value = value;
    display.textContent = value;
  }

  /**
   * 2. ฟังก์ชันหลักสำหรับปุ่ม "ตกลง" (ทำหน้าที่ประมวลผล)
   */
  function applyManualLimit() {
    const val = document.getElementById('rankInput').value;
    window.CURRENT_RANK_LIMIT = parseInt(val);
    
    console.log("ตั้งค่า Rank Limit เป็น:", window.CURRENT_RANK_LIMIT);
    
    if (typeof refreshTables === 'function') {
        refreshTables();
    }
  }

  // ผูก Event Listener เมื่อโหลดหน้าเว็บเสร็จ
  document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('rankSlider');
    const input = document.getElementById('rankInput');

    // เลื่อน Slider -> เรียกใช้ updateUI
    slider.addEventListener('input', (e) => updateUI(e.target.value));

    // พิมพ์ที่ Input -> เรียกใช้ updateUI
    input.addEventListener('input', (e) => updateUI(e.target.value));
  });



function refreshTables() {
    console.log("รีเฟรชตารางตามลำดับ...");
    window.SUMMARY_DATA = {};
    window.SUMMARY_DATA_HOLD = {};
    window.SUMMARY_DATA_NOSTOCK = {};
    // 1. คำนวณ NoStock ก่อน (เพราะตารางอื่นดึงค่าจาก window.SUMMARY_DATA)
    if ($('#tableNoStock_AfterUpcoming').length > 0) {
        TableRenderer.renderNoStock_AfterUpcomingTable(window.DATA_STORE.allocated, window.DATA_STORE.materialMap);
    }
    if (typeof renderNoStockTable === 'function') {
        renderNoStockTable(); 
    }
    // 2. ตามด้วยตาราง InfoPO และตารางอื่นๆ ที่ต้องใช้ค่าที่คำนวณเสร็จแล้ว
    const tables = [
        { id: '#tableInfoPO', func: TableRenderer.renderInfoPOTable },
        { id: '#tableHole', func: TableRenderer.renderInfoHoleTable },
         { id: '#tableTransfer', func: TableRenderer.renderInfoTransferTable },
         { id: '#tableNoStock_warehouse', func: TableRenderer.renderNoStockTable },
         { id: '#tableWorkSummary', func: TableRenderer.renderWorkSummarytable },
        
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
    const $table = $('#tableNoStock_warehouse');
    if ($.fn.DataTable.isDataTable('#tableNoStock_warehouse')) {
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



 // =================================================================
// 🌟 ฟังก์ชันตัวกลางสำหรับแชร์การซิงค์ Cross-Filter ไปยังทุกตารางย่อย
// =================================================================
function syncAllTables(mainTable) {
    // ดึง WBS (คอลัมน์ 2) ที่รอดอยู่บนตารางหลักในปัจจุบัน
    const activeWBS = mainTable.rows({ search: 'applied' }).data().toArray().map(row => row[2].replace(/<[^>]*>/g, '').trim());
    const uniqueWBS = [...new Set(activeWBS)].filter(Boolean);
    const stockRegex = uniqueWBS.length > 0 ? uniqueWBS.map(v => $.fn.dataTable.util.escapeRegex(v)).join('|') : '^$|🚫';

    // 1. ซิงค์ตาราง Stock Match (คอลัมน์ 0)
   // ใน syncAllTables
// if (typeof UpcomingTabInstance !== 'undefined' && UpcomingTabInstance && $.fn.DataTable.isDataTable('#tabUpcoming')) {
//     UpcomingTabInstance.column(0).search(stockRegex, true, false).draw();
// }
    // 2. ซิงค์ตาราง No Stock (คอลัมน์ 0)
    // if (typeof noStockTableInstance !== 'undefined' && noStockTableInstance) {
    //     noStockTableInstance.column(0).search(stockRegex, true, false).draw();
    // }
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
currentRankLimit: 50,
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
    },
// =================================================================
// [5/5] ฟังก์ชันกรอง  WBS (คอลัมน์ที่ 4 ในตารางหลัก)
// =================================================================
// ฟังก์ชันสำหรับผูก Event เข้ากับ Slider
    setupRankPickerFilter: function(fullData, materialTypeMap) {
        const self = this;
        
        // 1. รับค่าจาก Input ผ่าน id="rankSlider"
        $('#rankSlider').on('input', function() {
            // ดึงค่าเลขจาก Input มาเก็บไว้
            self.currentRank = parseInt($(this).val());
            
            // อัปเดตตัวเลขแสดงผลบน UI (ถ้ามี element นี้)
            $('#rankDisplay').text(`Focus ${self.currentRank} งานแรก`);
            
            // 2. สั่งให้ตัวกรองเริ่มทำงาน
            self.applyFilter(fullData, materialTypeMap);
        });
    },

    // ฟังก์ชันหลักที่ทำหน้าที่ Filter และสั่งวาดตาราง
    applyFilter: function(fullData, materialTypeMap) {
        const rankMap = window.GLOBAL_RANK_MAP || {};
        
        // 1. กรองเฉพาะรายการที่ Rank ของ WBS <= ค่าที่เลือก
        const filteredData = fullData.filter(res => {
            const rank = rankMap[res.wbs] || 999;
            return rank <= this.currentRank;
        });

        // 2. ส่งข้อมูลที่กรองแล้วเข้าฟังก์ชัน Render ทั้ง 2 ตาราง
        // ฟังก์ชัน render ของคุณต้องถูกปรับให้รับ data เข้ามาแทนที่ allocatedData ตัวเดิม
        renderNoStock_AfterUpcomingTable(filteredData, materialTypeMap);
        renderNoStockTable(filteredData, materialTypeMap);
        
        console.log("Filter Applied: ", this.currentRank, "งานแรก");
    }
};







function setupRowClickEvent() {
    $(document).off('click', '#tableNoStock_warehouse tbody tr.clickable-requirement').on('click', '#tableNoStock_warehouse tbody tr.clickable-requirement', function (e) {
        if ($(e.target).is('select, input') || $(e.target).closest('select, input').length > 0) return;

        const materialCode = $(this).data('material-code');
        const tables = ['#tabUpcoming', '#tabStockN2'];
        
        tables.forEach(id => {
            if (id === '#tabUpcoming') {
                // กรองจาก rawData เสมอ
                const filteredData = rawData.filter(row => getCellValue(row.c[0]) === materialCode);
                // เรียกใช้ผ่าน TableRenderer (ให้ตรวจสอบชื่อ Object ให้ตรงกับในโค้ดคุณ)
                TableRenderer.renderUpcomingTab({ rows: filteredData }, true);
                }
            else if (id === '#tabStockN2') {
        // rawDataStockN2 คือ Array ที่สรุปผลแล้ว (มี partID อยู่แล้ว)
                const filteredRows = rawDataStockN2.filter(item => item.partID === materialCode);
                
                // ส่ง { rows: filteredRows } เข้าไป โดย isFiltered = true
                TableRenderer.renderStockN2Tab({ rows: filteredRows }, true);
            }  
        //  
        });
        
        setTimeout(() => {
            if (typeof updateCounts === 'function') updateCounts();
        }, 300);
    });
}
function setupGlobalEvents() {
 
 $('#resetMB52').on('click', function () {
        // 1. ล้างการค้นหาและการกรองในตารางหลักทั้งหมดออก แล้ววาดตารางใหม่ (โค้ดดั้งเดิมของคุณ)
        if (noStockTableInstance) noStockTableInstance.search('').columns().search('').draw();
        // if (StockN2TabInstance) StockN2TabInstance.search('').columns().search('').draw();
        if (N2POTabInstance) N2POTabInstance.search('').columns().search('').draw();

        // 2. Reset tabUpcoming (ที่เป็นระบบ List แล้ว)
        // ส่งข้อมูลเต็ม (rawData) กลับไปแสดงผลใหม่ และกำหนด flag isFiltered เป็น false
        if (typeof TableRenderer !== 'undefined' && typeof TableRenderer.renderUpcomingTab === 'function') {
            TableRenderer.renderUpcomingTab({ rows: rawData }, false);
        } else if (typeof renderUpcomingTab === 'function') {
            renderUpcomingTab({ rows: rawData }, false);
        }

        // 3. Reset tabStockN2 (ระบบ List ใหม่)
        // ใช้ rawDataStockN2 ที่เก็บข้อมูลดิบไว้ตอนโหลดครั้งแรก
       if (typeof TableRenderer !== 'undefined' && typeof TableRenderer.renderStockN2Tab === 'function') {
            // ส่ง rawDataStockN2 กลับไปโดยตรง
            TableRenderer.renderStockN2Tab({ rows: rawDataStockN2 }, false);
        } else if (typeof renderStockN2Tab === 'function') {
            renderStockN2Tab({ rows: rawDataStockN2 }, false);
        }

     
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
        window.WORK_INFO_MAP = {}; 
        // สมมติว่าดึง Requirement_Data จากผลลัพธ์ของ sheetPromises 
        // หรือถ้ามีตัวแปรเก็บ rawRequirementDatabase อยู่แล้วให้ใช้ตัวนั้น
        const reqData = await CommonService.fetchSheetData('Requirement_Data'); 
        if (reqData?.rows) {
            reqData.rows.forEach(row => {
                const wbs_require = CommonService.getCellValue(row.c[0]); // สมมติ WBS อยู่ index 1
                window.WORK_INFO_MAP[wbs_require] = {
                    jobName: CommonService.getCellValue(row.c[19]), // ชื่องาน index 19
                    pea: CommonService.getCellValue(row.c[22])      // การไฟฟ้า index 22
                };
            });
        }

       window.BUDGET_MAP = {};
        if (dataMap['Budget_Data']?.rows) {
            dataMap['Budget_Data'].rows.forEach(row => {
                const wbs = CommonService.getCellValue(row.c[2]); // สมมติ WBS อยู่ index 1
                const value = CommonService.getCellValue(row.c[19]); // สมมติ มูลค่า อยู่ index 19
                if (wbs) {
                    window.BUDGET_MAP[wbs] = value || 0;
                }
            });
        }

         window.PEAName_MAP = {};
        if (dataMap['PEAName_data']?.rows) {
            dataMap['PEAName_data'].rows.forEach(row => {
                const nameID = CommonService.getCellValue(row.c[0]); // สมมติ WBS อยู่ index 1
                const peaname = CommonService.getCellValue(row.c[1]); // สมมติ มูลค่า อยู่ index 19
                if (nameID) {
                     window.PEAName_MAP[nameID] = peaname ;
                }
            });
        }
        // ================= วาดตาราง ================= //
        config.forEach(sheet => {
            const data = dataMap[sheet.name];
            if (!data) return;

            if (sheet.name === 'Requirement_Data') {
                // parcelTable = TableRenderer.renderRequirementTable(
                //     sheet.target, data, globalVVIP, peaNameMapping,
                //     alloc.finalWbsScores, alloc.wbsStatusMap, budgetMapping, wbsProgressMap
                // );
                 NoStock_AfterUpcomingTableInstance = TableRenderer.renderNoStock_AfterUpcomingTable(window.DATA_STORE.allocated, window.DATA_STORE.materialMap);
                noStockTableInstance = TableRenderer.renderNoStockTable(window.DATA_STORE.allocated, window.DATA_STORE.materialMap);
                HoleTableInstance = TableRenderer.renderInfoHoleTable(window.DATA_STORE.allocated, window.DATA_STORE.materialMap);
                InfoPOTableInstance = TableRenderer.renderInfoPOTable(window.DATA_STORE.allocated, window.DATA_STORE.materialMap);
                TransferTableInstance = TableRenderer.renderInfoTransferTable(window.DATA_STORE.allocated, window.DATA_STORE.materialMap);
                TableRenderer.renderUpcomingTab(upcomingData);
                StockN2TabInstance =TableRenderer.renderStockN2Tab(dataMap['StockN2_Data']);
                // 1. เรียกใช้ฟิลเตอร์ประเภทวัสดุ
                FilterModule.setupNoStockFilter('#tableNoStock_warehouse', '.filter-type');
                FilterModule.setupBulkMaterialFilter('#tableNoStock_warehouse');
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
                    FilterModule.setupExcludeBulkMaterialFilter('#tableNoStock_warehouse', '#bulkMaterialInput');
                });

                FilterModule.initClearButtons();

            }
           
            else if (sheet.name !== 'Material_Master') {
                TableRenderer.renderGenericTable(sheet.target, data);
            }
                // FilterModule.setupRankPickerFilter(fullData, materialTypeMap);

           
        });

        if (typeof TableRenderer.renderWorkSummarytable === 'function') {
                TableRenderer.renderWorkSummarytable();
            }
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