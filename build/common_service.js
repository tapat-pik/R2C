
 let finalRankPrepList = [];

// ==================== Configuration ====================
const config = [
    { name: 'Material_Master', target: '#tableParcel' },
    { name: 'Stock_Data', target: '#tableMB52' },
    { name: 'Requirement_Data', target: '#tableRequirement_Data' },
    { name: 'Upcoming_Item', target: '#tableUpcoming_Item' },
    { name: 'Budget_Data', target: '#tableUBudget_Data' },
    { name: 'VVIP_Data', target: '#tableVVIP_Data' },
    { name: 'StockN2_Data', target: '#tableStockN2_Data' },
    { name: 'N2PO_Data', target: '#tableN2PO_Data' },
    { name: 'PEAName_data', target: '#tablePEAName_data' }
];


const CommonService = {
    // --- 1. ฟังก์ชันดึงข้อมูลดิบ (เดิมที่คุณส่งมา) ---
   _cache: {}, // เพิ่มตัวแปรเก็บ Cache ใน Memory
//    async fetchSheetData(sheetName) {
//         const url = `api/get_data.php?sheet=${encodeURIComponent(sheetName)}`;

//         // 🔗 log บอกเมื่อระบบฝั่ง JavaScript เริ่มทำการเชื่อมต่อไปยัง API เพื่อดึงข้อมูลจาก MySQL

//         try {
//             const response = await fetch(url);
//             if (!response.ok) throw new Error(`Network response was not ok (Status: ${response.status})`);

//             const jsonData = await response.json();
            
//             // ✅ log บอกเมื่อดึงข้อมูลสำเร็จจาก MySQL พร้อมบอกจำนวนแถวข้อมูลที่ได้กลับมา
//             const rowCount = (jsonData.table && jsonData.table.rows) ? jsonData.table.rows.length : 0;
            
//             return jsonData.table;

//         } catch (err) {
//             // ❌ log แจ้งเตือนกรณีที่ระบบเกิด Error หรือติดต่อ API ของ MySQL ไม่สำเร็จ
//             return { cols: [], rows: [] };
//         }
//     },

    fetchSheetData: async function(sheetName) {
        // ถ้าเคยดึงมาแล้ว ให้คืนค่าเดิมทันที (ไม่ยิง API ซ้ำ)
        if (this._cache[sheetName]) return this._cache[sheetName];

        const spreadsheetId = '1zhp1OMsuil2DhjttNGRpvi1SOPlbT5FLGRYqOMruIN4';
        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}`;
         try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const textData = await response.text();
            const jsonStart = textData.indexOf('{');
            const jsonEnd = textData.lastIndexOf('}');
            const parsedData = JSON.parse(textData.substring(jsonStart, jsonEnd + 1));
            const rawTable = parsedData.table;
            if (!rawTable) return { cols: [], rows: [] };

            const formattedCols = (rawTable.cols || []).map(col => ({ label: col.label || "" }));
            const formattedRows = (rawTable.rows || []).map(row => {
                if (!row || !row.c) return { c: [] };
                const formattedCells = row.c.map(cell => ({ v: cell?.v ?? "" }));
                while (formattedCells.length < formattedCols.length) formattedCells.push({ v: "" });
                return { c: formattedCells };
            });
            // return { cols: formattedCols, rows: formattedRows };

            const result = { cols: formattedCols, rows: formattedRows };
            
            // เก็บลง Cache ไว้ใช้ครั้งต่อไป
            this._cache[sheetName] = result;
            return result;
        } catch (err) {
            return { cols: [], rows: [] };
        }
    },

    // --- 2. ฟังก์ชันเสริม (Data Services) ---
    getCellValue: function(cell) {
        return cell?.v !== undefined ? cell.v : cell;
    },

    fetchVVIPData: async function() {
        const data = await this.fetchSheetData('VVIP_Data');
        return data.rows || [];
    },

    fetchPEANameData: async function() {
        const data = await this.fetchSheetData('PEAName_data');
        const mapping = {};
        if (data?.rows) {
            data.rows.forEach(row => {
                const peaCode = this.getCellValue(row.c[0])?.toString().trim();
                const peaName = this.getCellValue(row.c[1])?.toString().trim();
                if (peaCode && peaName) mapping[peaCode] = peaName;
            });
        }
        return mapping;
    },

    fetchBudgetData: async function() {
        const data = await this.fetchSheetData('Budget_Data');
        const mapping = {};
        if (data?.rows) {
            data.rows.forEach(row => {
                const wbs = this.getCellValue(row.c[2])?.toString().trim();
                const rawValue = this.getCellValue(row.c[19])?.toString() || "0";
                const cleanValue = rawValue.replace(/[^0-9.]/g, ''); 
                if (wbs) mapping[wbs] = parseFloat(cleanValue) || 0;
            });
        }
        return mapping;
    },

    fetchUpcomingItemData: async function() {
        return await this.fetchSheetData('Upcoming_Item');
    },

    buildMaterialTypeMap: function(masterData) {
        const map = {};
        if (!masterData?.rows) return map;
        masterData.rows.forEach(row => {
            const partID = this.getCellValue(row.c[0])?.toString().trim();
            const type = this.getCellValue(row.c[2])?.toString().trim();
            const cost = this.getCellValue(row.c[3])?.toString().trim();
            if (partID) {
            map[partID] = {
                type: type || "ทั่วไป",
                cost: parseFloat(cost) || 0 // เก็บเป็นตัวเลข
            };
        }
        });
        return map;
    }


};
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
        const agingPoints = agingDays > 0 ? (agingDays / 10000) : 0;

        // 🎯 เช็กเงื่อนไข +2000 แต้มตรงนี้: ถ้าได้ของครบ (isFullyAllocated = true) ปรับเป็น 2000 แต้มเต็มทันที
        const readinessPoints = isFullyAllocated ? 2000 : this._calculateReadinessPoints(rowCount);

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