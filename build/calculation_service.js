
 let finalRankPrepList = [];

// ==================== Configuration ====================
// const config = [
//     { name: 'Material_Master', target: '#tableParcel' },
//     { name: 'Stock_Data', target: '#tableMB52' },
//     { name: 'Requirement_Data', target: '#tableRequirement_Data' },
//     { name: 'Upcoming_Item', target: '#tableUpcoming_Item' },
//     { name: 'Budget_Data', target: '#tableUBudget_Data' },
//     { name: 'VVIP_Data', target: '#tableVVIP_Data' },
//     { name: 'StockN2_Data', target: '#tableStockN2_Data' },
//     { name: 'N2PO_Data', target: '#tableN2PO_Data' },
//     { name: 'PEAName_data', target: '#tablePEAName_data' }
// ];


// const CommonService = {
//     // --- 1. ฟังก์ชันดึงข้อมูลดิบ (เดิมที่คุณส่งมา) ---
//    _cache: {}, // เพิ่มตัวแปรเก็บ Cache ใน Memory

// async fetchSheetData(sheetName) {
//     // Return Cache ทันทีหากเคยดึงแล้ว
//     if (this._cache && this._cache[sheetName]) {
//         return this._cache[sheetName];
//     }

//     const spreadsheetId = '1zhp1OMsuil2DhjttNGRpvi1SOPlbT5FLGRYqOMruIN4';
//     const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}`;

//     try {
//         const response = await fetch(url);
//         if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

//         const textData = await response.text();

//         // ตัดข้อความส่วนเกินจาก Google GViz API ออกเพื่อแปลงเป็น JSON
//         // ตอบกลับปกติจะมาในรูปแบบ: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
//         const jsonString = textData.substring(textData.indexOf('{'), textData.lastIndexOf('}') + 1);
//         const jsonData = JSON.parse(jsonString);

//         // ดึงโครงสร้างข้อมูล table ({ cols: [...], rows: [...] })
//         const rawTable = jsonData?.table || { cols: [], rows: [] };

//         // บันทึกลง Memory Cache
//         if (!this._cache) this._cache = {};
//         this._cache[sheetName] = rawTable;

//         return rawTable;

//     } catch (err) {
//         console.error(`[Google Sheet Fetch Error] ${sheetName}:`, err);
//         return { cols: [], rows: [] };
//     }
// },
  
    


//     // async fetchSheetData(sheetName) {
//     //     // Return Cache ทันทีหากเคยดึงแล้ว (0 ms)
//     //     if (this._cache[sheetName]) return this._cache[sheetName];

//     //     const url = `/R2C/build/api/get_data.php?sheet=${encodeURIComponent(sheetName)}`;

//     //     try {
//     //         const response = await fetch(url, {
//     //             method: 'GET',
//     //             headers: { 'Accept': 'application/json' }
//     //         });

//     //         if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

//     //         const jsonData = await response.json();
//     //         const rawTable = jsonData?.table || { cols: [], rows: [] };
            
//     //         // บันทึกลง Memory Cache
//     //         this._cache[sheetName] = rawTable;
//     //         return rawTable;

//     //     } catch (err) {
//     //         console.error(`[MySQL Fetch Error] ${sheetName}:`, err);
//     //         return { cols: [], rows: [] };
//     //     }
//     // },

//     /**
//      * 🚀 [NEW] ยิงดึงข้อมูลหลาย Table พร้อมกันแบบ Parallel (Promise.all)
//      * ช่วยให้การดึง 7-8 ตาราง ใช้เวลารวมเท่ากับการดึงตารางเดียว (< 300ms)
//      */
//     async fetchMultipleSheets(sheetNames = []) {
//         const promises = sheetNames.map(name => this.fetchSheetData(name));
//         const results = await Promise.all(promises);
        
//         return sheetNames.reduce((acc, name, index) => {
//             acc[name] = results[index];
//             return acc;
//         }, {});
//     },

//     getCellValue: function(cell) {
//         return cell?.v !== undefined ? cell.v : cell;
//     },

//     async fetchVVIPData() {
//         const data = await this.fetchSheetData('VVIP_Data');
//         return data.rows || [];
//     },

//     async fetchPEANameData() {
//         const data = await this.fetchSheetData('PEAName_data');
//         const mapping = {};
//         if (data?.rows) {
//             const rows = data.rows;
//             for (let i = 0; i < rows.length; i++) {
//                 const peaCode = this.getCellValue(rows[i].c[0])?.toString().trim();
//                 const peaName = this.getCellValue(rows[i].c[1])?.toString().trim();
//                 if (peaCode && peaName) mapping[peaCode] = peaName;
//             }
//         }
//         return mapping;
//     },

//     async fetchBudgetData() {
//         const data = await this.fetchSheetData('Budget_Data');
//         const mapping = {};
//         if (data?.rows) {
//             const rows = data.rows;
//             for (let i = 0; i < rows.length; i++) {
//                 const wbs = this.getCellValue(rows[i].c[2])?.toString().trim();
//                 const rawValue = this.getCellValue(rows[i].c[19])?.toString() || "0";
//                 const cleanValue = rawValue.replace(/[^0-9.]/g, ''); 
//                 if (wbs) mapping[wbs] = parseFloat(cleanValue) || 0;
//             }
//         }
//         return mapping;
//     },

//     async fetchUpcomingItemData() {
//         return await this.fetchSheetData('Upcoming_Item');
//     },

//     buildMaterialTypeMap: function(masterData) {
//         const map = {};
//         if (!masterData?.rows) return map;
//         const rows = masterData.rows;
//         for (let i = 0; i < rows.length; i++) {
//             const partID = this.getCellValue(rows[i].c[0])?.toString().trim();
//             const type = this.getCellValue(rows[i].c[2])?.toString().trim();
//             const cost = this.getCellValue(rows[i].c[3])?.toString().trim();
//             if (partID) map[partID] = { type: type || "ทั่วไป", cost: parseFloat(cost) || 0 };
//         }
//         return map;
//     }

// };
// ==================== Scoring Service ====================//
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
        const agingPoints = agingDays > 0 ? Math.min(200, agingDays / 10) : 0;

        // 🎯 เช็กเงื่อนไข +2000 แต้มตรงนี้: ถ้าได้ของครบ (isFullyAllocated = true) ปรับเป็น 2000 แต้มเต็มทันที
        const readinessPoints = isFullyAllocated ? 2500 : this._calculateReadinessPoints(rowCount);

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
    // คำนวณคะแนนเชิงกลยุทธ์ (Strategic Points) โดยตรวจสอบว่ามี WBS ตรงกับ VVIP หรือไม่
    _calculateStrategicPoints(strA, vvipData) {
        if (strA === "") return 0;
        let points = 1000;
        if (vvipData && Array.isArray(vvipData)) {
            const isVVIP = vvipData.some(row => {
                const vvipVal = (row.c && row.c[1] && row.c[1].v) ? row.c[1].v.toString().trim() : "";
                return vvipVal === strA;
            });
            if (isVVIP) points += 5000;
        }
        return points;
    },

    _calculateTimingPoints(strY, diffDays, strX) {
        const accumulationDays = Math.abs(diffDays || 0);
        if (strY === "งาน 02.2") return 3000;
        if (strY === "เกินกำหนด" || diffDays < 0) return Math.min(3000, 2000 + (accumulationDays * 2));
        if (diffDays !== null && diffDays >= 0 && diffDays <= 30) return 1200 + ((30-accumulationDays) * 50);
        if (diffDays !== null && diffDays > 30) return 500;
        if (strY === "ไม่เกินกำหนด" && strX === "ยังไม่เกิด AUC" || strX === "") return 500;
        return 0;
    },

   _calculateReadinessPoints(rowCount) {
    if (rowCount === undefined || rowCount === null || rowCount <= 0) {
        return 0;
    }
    if (rowCount === 1) {
        return 2200;
    }
    if (rowCount === 2) {
        return 1900;
    }
    if (rowCount === 3) {
        return 1600;
    }
    if (rowCount === 4) {
        return 1300;
    }
    if (rowCount === 5) {
        return 1000;
    }
    if (rowCount > 5) {
        return 400;
    }
}
};

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
        const pendingCountByWBS = new Map();
        rawDatabase.rows.forEach(row => {
            const wbs = getCellValue(row.c[0]).toString().trim();
            const pending = parseFloat(CommonService.getCellValue(row.c[14])) || 0;
            if (!rowsByWBS.has(wbs)) {
                rowsByWBS.set(wbs, []);
            }
            rowsByWBS.get(wbs).push(row);
            // 🎯 นับเฉพาะรายการที่ค้างเบิก > 0 เหมือนหน้าบ้าน
                if (pending > 0) {
                    pendingCountByWBS.set(wbs, (pendingCountByWBS.get(wbs) || 0) + 1);
                }
        });

        // ================================================================================================
        // STEP 1: เตรียมคิวงานรอบแรก (ใช้คะแนนตั้งต้นก่อนแจกของเพื่อจัดลำดับความสำคัญ)
        // ================================================================================================
        const queue = rawDatabase.rows.map(row => {
            const wbs = getCellValue(row.c[0]).toString().trim();
            const rowsOfWbs = rowsByWBS.get(wbs) || [];
            const rowCount = pendingCountByWBS.get(wbs) || 0;
            const openDateValue = getCellValue(row.c[26]);
            const wbsBudget = budgetMapping[wbs] || 0;

            // const info = ScoringService.calculateScoreDetails(
            //     wbs, getCellValue(row.c[24]), getCellValue(row.c[23]),
            //     rowsOfWbs.length, vvipData, false, openDateValue, false
            // );
            const info = ScoringService.calculateScoreDetails(
                wbs, CommonService.getCellValue(row.c[24]), CommonService.getCellValue(row.c[23]),
                rowCount, vvipData, false, openDateValue, false
            );

            return {
                wbs,
                partID: getCellValue(row.c[3])?.toString().trim(),
                partName: getCellValue(row.c[4]),
                pending: parseFloat(getCellValue(row.c[14])) || 0,
                score: info.totalScore,
                // rowCount: rowsOfWbs.length,
                rowCount: rowCount,
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
       
        const allocatedByWBS = new Map();

        allocatedResults.forEach(item => {
            if (!allocatedByWBS.has(item.wbs)) {
                allocatedByWBS.set(item.wbs, []);
            }
            allocatedByWBS.get(item.wbs).push(item);
        });

      
// ... (โค้ดก่อนหน้านี้ใน STEP 3 จนถึงส่วนที่เริ่มลูป uniqueWBS)
uniqueWBS.forEach(wbs => {
    const items = allocatedByWBS.get(wbs) || [];
    const activeRowCount = pendingCountByWBS.get(wbs) || 0; // 👈 ใช้ rowCount เฉพาะที่ค้างเบิก > 0
    const allItems = items.map(i => {
        const type = materialTypeMap[i.partID?.toString().trim()]?.type || "";
        return { ...i, type,
            isSpecial: type.includes("พัสดุล้าสมัย") || type.includes("เปลี่ยนรหัสพัสดุ"),
            isNoStock: type.includes("พัสดุไม่เบิกจากคลัง"),
            isMain: type.includes("พัสดุหลัก")
        };
    });

    const activeItems = allItems.filter(i => !i.isSpecial && !i.isNoStock);
    const mainItems = activeItems.filter(i => i.isMain);
    const otherItems = activeItems.filter(i => !i.isMain);

    const hasLocked = allItems.some(i => i.isSpecial && i.pending > 0);
    const isOnlyNoStock = allItems.every(i => i.isNoStock);
    
    // กรองรายการที่ต้องเบิกจริง (pending > 0)
    const itemsNeedingAllocation = activeItems.filter(i => i.pending > 0);
    // เปลี่ยนจากเช็คแค่ .every เป็นเช็คว่าต้องมีตัวที่ pending > 0 ก่อนด้วย
    const mainNeedingAllocation = mainItems.filter(i => i.pending > 0);

    const isMainFully = mainNeedingAllocation.length > 0 && 
                    mainNeedingAllocation.every(i => i.assigned === i.pending);
    // เช็คความครบถ้วนแบบเข้มงวด: เฉพาะรายการที่ต้องเบิก (pending > 0) ต้องมี assigned === pending
    // const isMainFully = mainItems.length > 0 && mainItems.filter(i => i.pending > 0).every(i => i.assigned === i.pending && i.assigned > 0);
    const isMainFullyCompleted = mainItems.every(i => i.pending <= 0 || (i.assigned === i.pending && i.assigned > 0));
    const isOthersFullyCompleted = otherItems.every(i => i.pending <= 0 || (i.assigned === i.pending && i.assigned > 0));
    
    // ไฟแดง: ถ้ามีของต้องเบิก (pending > 0) แต่ได้ assigned = 0 ทุกตัว
    const isAllPendingZeroAssigned = itemsNeedingAllocation.length > 0 && itemsNeedingAllocation.every(i => i.assigned === 0);
    
    const isMainPendingAllZero = mainItems.every(i => i.pending <= 0);
    const isOtherMismatch = otherItems.some(i => i.pending > 0 && i.assigned !== i.pending);
    const isAllPendingAllZero = allItems.every(i => i.pending <= 0);
    let status = "yellow";
    let isGreen = false;

    // --- ลำดับการตัดสินไฟ ---
    // 
    // 2. ถ้ามีของล็อค -> ล็อค
        if (hasLocked) { 
        status = "lock"; 
    }
    //1. ถ้าไม่มีรายการต้องเบิกเลย หรือเป็นของไม่เบิกคลังทั้งหมด -> เขียว
    else if (itemsNeedingAllocation.length === 0 || isOnlyNoStock) {
        status = "green";
        isGreen = true;
    }
    
     
    // 3. ไฟแดง (ของที่ต้องเบิกได้ 0 ทุกตัว)
    else if (isAllPendingZeroAssigned) { 
        status = "red"; 
    }
    // 4. ไฟเขียว (หลักครบ และ อื่นๆ ครบ)
    else if (isMainFullyCompleted && isOthersFullyCompleted) { 
        status = "green"; 
        isGreen = true; 
    }
    // 5. ไฟน้ำเงิน (หลักครบ แต่รายการอื่นไม่ครบ)
    else if (isMainFully) { 
        status = "blue"; 
    }
    // 6. กรณีอื่น -> เหลือง
    else { 
        status = "yellow"; 
    }

    // ... (ส่วนอัปเดต finalWbsScores และ finalRankPrepList ต่อตามเดิม)


    // ... (ส่วนที่เหลือของการอัปเดต finalWbsScores และ finalRankPrepList เหมือนเดิม)

            const firstItem = items[0];
            // if (firstItem) {
            //     // คำนวณคะแนนสุทธิสุดท้ายหลังแจกของ (ใส่ค่า isGreen เพื่อลุ้นโบนัส +2000)
            //     const final = ScoringService.calculateScoreDetails(
            //         firstItem.raw.valA, firstItem.raw.valY, firstItem.raw.valX,
            //         firstItem.rowCount, vvipData, isGreen, firstItem.raw.valOpenDate, false
            //     );
        if (firstItem) {
                const final = ScoringService.calculateScoreDetails(
                    firstItem.raw.valA, firstItem.raw.valY, firstItem.raw.valX,
                    activeRowCount, vvipData, isGreen, firstItem.raw.valOpenDate, false // 👈 ส่ง activeRowCount
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
                    isFullyAllocated: isGreen,
                    isAllPendingAllZero: isAllPendingAllZero
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



// --- สิ้นสุดการแทนที่ ---
      

// =========================================================================
        // 📊 [Console Log] แสดงอันดับ สัญญาณไฟ rowCount (pending>0) และการคำนวณคะแนน
        // =========================================================================
        console.group("%c🏆 [รายงานสรุปอันดับ สัญญาณไฟ และการคำนวณคะแนน WBS]", "color: #FFD700; background: #222; font-size: 14px; padding: 4px 8px; font-weight: bold;");

        // 1. คำนวณอันดับ WBS ทั้งหมด
        const rankMapLog = RankingService.calculateAllWbsRanks(rawDatabase.rows, budgetMapping, finalWbsScores);
        const logDataList = [];

        // ฟังก์ชันแปลง Status เป็น Emoji สัญญาณไฟ
        const getSignalLight = (status) => {
            switch (status) {
                case 'green': return '🟢 จัดสรรครบ';
                case 'blue': return '🔵 จัดสรรได้เฉพาะพัสดุหลัก';
                case 'yellow': return '🟡 จัดสรรได้บางส่วน';
                case 'red': return '🔴 สต็อกไม่พอ/จัดสรรไม่ได้';
                case 'lock': return '🔒 ล็อก (พัสดุล้าสมัย/เปลี่ยนรหัส)';
                default: return '⚪ ไม่ระบุ';
            }
        };

        // 2. ดึงข้อมูลแจกแจงรายละเอียดการคำนวณของแต่ละ WBS
        uniqueWBS.forEach(wbs => {
            const rowsOfWbs = rowsByWBS.get(wbs) || [];
            const firstRow = rowsOfWbs[0];
            
            // 🎯 ดึง rowCount ที่นับเฉพาะรายการค้างเบิก (pending > 0)
            const activeRowCount = pendingCountByWBS.get(wbs) || 0; 
            
            if (firstRow) {
                const valY = CommonService.getCellValue(firstRow.c[24]) ? CommonService.getCellValue(firstRow.c[24]).toString().trim() : "";
                const valX = CommonService.getCellValue(firstRow.c[23]) ? CommonService.getCellValue(firstRow.c[23]).toString().trim() : "";
                const openDate = CommonService.getCellValue(firstRow.c[26]) ? CommonService.getCellValue(firstRow.c[26]).toString().trim() : "";
                const status = wbsStatusMap.get(wbs);
                const isGreen = (status === "green");

                // คำนวณค่าแต้มย่อยแต่ละตัว
                const diffDays = ScoringService._calculateDaysRemaining(valX);
                const strategicPts = ScoringService._calculateStrategicPoints(wbs, vvipData);
                const timingPts = ScoringService._calculateTimingPoints(valY, diffDays, valX);
                const agingDays = ScoringService._calculateAgingDays(openDate);
                const agingPts = agingDays > 0 ? Math.min(200, agingDays / 10) : 0;
                
                // 🎯 ใช้ activeRowCount คำนวณแต้มความพร้อม
                const readinessPts = isGreen ? 2500 : ScoringService._calculateReadinessPoints(activeRowCount);
                const totalScore = finalWbsScores.get(wbs) || 0;

                // จัดฟอร์แมตข้อมูลแสดงใน Console
                logDataList.push({
                    "อันดับ": rankMapLog[wbs] || "-",
                    "สัญญาณไฟ": getSignalLight(status),
                    "ชื่องาน (WBS)": wbs,
                    "ค้างเบิก (rowCount)": `${activeRowCount} รายการ`,
                    "ผลรวมคะแนน": totalScore,
                    "1. แต้มยุทธศาสตร์ (Strategic)": `${strategicPts} แต้ม ${strategicPts >= 5000 ? "(งาน VVIP)" : "(งานทั่วไป)"}`,
                    "2. แต้มเวลา/กำหนดส่ง (Timing)": `${timingPts} แต้ม (สถานะ: "${valY }/ ${valX}"  / คงเหลือ: ${diffDays !== null ? diffDays + ' วัน' : 'ไม่ระบุ'})`,
                    "3. แต้มอายุงาน (Aging)": `${agingPts.toFixed(4)} แต้ม (เปิดงานมาแล้ว ${agingDays} วัน)`,
                    "4. แต้มความพร้อม (Readiness)": `${readinessPts} แต้ม (${isGreen ? 'จัดสรรสต็อกครบ' : `ค้างเบิก = ${activeRowCount} ${activeRowCount <= 5 ? '(<=5 ได้ 1800)' : '(>5 ได้ 500)'}`})`,
                    "สูตรคิดคะแนนรวม": `${strategicPts} + ${timingPts} + ${agingPts.toFixed(4)} + ${readinessPts} = ${totalScore}`
                });
            }
        });

        // 3. จัดเรียงตามอันดับ 1 ไปท้ายสุด
        logDataList.sort((a, b) => a["อันดับ"] - b["อันดับ"]);

        // 4. พิมพ์ตารางออกทาง Console
        console.table(logDataList);
        console.groupEnd();
        // =========================================================================

        return { allocatedResults, finalWbsScores, wbsStatusMap };
    },


    updatePieChart(data) {
        if (typeof updatePieChart === 'function') {
            updatePieChart(data);
        }
    }
};


const RankingService = {
    calculateAllWbsRanks(dataRows, budgetMapping, finalScores) {
        const uniqueMap = new Map();
        const countMap = new Map();

        // 1. จัดกลุ่มข้อมูลและตรวจสอบสถานะการเบิก
        dataRows.forEach(row => {
            let valA = CommonService.getCellValue(row.c[0]).toString().trim();
            let pending = parseFloat(CommonService.getCellValue(row.c[14])) || 0;
            
            if (valA !== "") {
                // เก็บสถานะว่างานนี้มีรายการที่ต้องเบิกค้างอยู่หรือไม่
                if (!uniqueMap.has(valA)) {
                    uniqueMap.set(valA, {
                        valA: valA,
                        isAllPendingZero: true, // ตั้งต้นว่าครบแล้ว
                        rowCount: 0,
                        budget: budgetMapping[valA] || 0,
                        score: finalScores?.get(valA) || 0
                    });
                }

                // ถ้าเจอรายการที่มี pending > 0 แสดงว่างานนี้ยังเบิกไม่ครบ
                if (pending > 0) {
                    uniqueMap.get(valA).isAllPendingZero = false;
                    uniqueMap.get(valA).rowCount += 1; // นับเฉพาะรายการที่ต้องเบิก
                }
            }
        });

        // 2. แปลง Map เป็น Array เพื่อเตรียม Sort
        const sortedList = Array.from(uniqueMap.values());

        // 3. เรียงลำดับตามเงื่อนไขที่ตกลงกัน
        // เงื่อนไข: งานที่ครบแล้ว (isAllPendingZero = true) จะถูกผลักไปไว้ท้ายเสมอ
        sortedList.sort((a, b) => {
            // ชั้นที่ 0: คัดงานที่ของครบ (Pending=0) ไปไว้ท้ายตาราง
            if (a.isAllPendingZero !== b.isAllPendingZero) {
                return a.isAllPendingZero ? 1 : -1;
            }
            
            // ชั้นที่ 1: คะแนนรวมสูงสุด (เหมือนเดิม)
            if (b.score !== a.score) return b.score - a.score;
            
            // ชั้นที่ 2: พัสดุน้อยสุด (เหมือนเดิม)
            if (a.rowCount !== b.rowCount) return a.rowCount - b.rowCount;
            
            // ชั้นที่ 3: มูลค่างานสูงสุด (เหมือนเดิม)
            return b.budget - a.budget;
        });

        // 4. สร้าง Map ของอันดับ [WBS: Rank]
        const rankMap = {};
        sortedList.forEach((item, index) => {
            rankMap[item.valA] = index + 1;
        });

        return rankMap;
    }
};