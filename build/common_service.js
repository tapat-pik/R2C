
//  let finalRankPrepList = [];

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

async fetchSheetData(sheetName) {
    // Return Cache ทันทีหากเคยดึงแล้ว
    if (this._cache && this._cache[sheetName]) {
        return this._cache[sheetName];
    }

    const spreadsheetId = '1zhp1OMsuil2DhjttNGRpvi1SOPlbT5FLGRYqOMruIN4';
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const textData = await response.text();

        // ตัดข้อความส่วนเกินจาก Google GViz API ออกเพื่อแปลงเป็น JSON
        // ตอบกลับปกติจะมาในรูปแบบ: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
        const jsonString = textData.substring(textData.indexOf('{'), textData.lastIndexOf('}') + 1);
        const jsonData = JSON.parse(jsonString);

        // ดึงโครงสร้างข้อมูล table ({ cols: [...], rows: [...] })
        const rawTable = jsonData?.table || { cols: [], rows: [] };

        // บันทึกลง Memory Cache
        if (!this._cache) this._cache = {};
        this._cache[sheetName] = rawTable;

        return rawTable;

    } catch (err) {
        console.error(`[Google Sheet Fetch Error] ${sheetName}:`, err);
        return { cols: [], rows: [] };
    }
},
  
    


    // async fetchSheetData(sheetName) {
    //     // Return Cache ทันทีหากเคยดึงแล้ว (0 ms)
    //     if (this._cache[sheetName]) return this._cache[sheetName];

    //     const url = `/R2C/build/api/get_data.php?sheet=${encodeURIComponent(sheetName)}`;

    //     try {
    //         const response = await fetch(url, {
    //             method: 'GET',
    //             headers: { 'Accept': 'application/json' }
    //         });

    //         if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    //         const jsonData = await response.json();
    //         const rawTable = jsonData?.table || { cols: [], rows: [] };
            
    //         // บันทึกลง Memory Cache
    //         this._cache[sheetName] = rawTable;
    //         return rawTable;

    //     } catch (err) {
    //         console.error(`[MySQL Fetch Error] ${sheetName}:`, err);
    //         return { cols: [], rows: [] };
    //     }
    // },

    /**
     * 🚀 [NEW] ยิงดึงข้อมูลหลาย Table พร้อมกันแบบ Parallel (Promise.all)
     * ช่วยให้การดึง 7-8 ตาราง ใช้เวลารวมเท่ากับการดึงตารางเดียว (< 300ms)
     */
    async fetchMultipleSheets(sheetNames = []) {
        const promises = sheetNames.map(name => this.fetchSheetData(name));
        const results = await Promise.all(promises);
        
        return sheetNames.reduce((acc, name, index) => {
            acc[name] = results[index];
            return acc;
        }, {});
    },

    getCellValue: function(cell) {
        return cell?.v !== undefined ? cell.v : cell;
    },

    async fetchVVIPData() {
        const data = await this.fetchSheetData('VVIP_Data');
        return data.rows || [];
    },

    async fetchPEANameData() {
        const data = await this.fetchSheetData('PEAName_data');
        const mapping = {};
        if (data?.rows) {
            const rows = data.rows;
            for (let i = 0; i < rows.length; i++) {
                const peaCode = this.getCellValue(rows[i].c[0])?.toString().trim();
                const peaName = this.getCellValue(rows[i].c[1])?.toString().trim();
                if (peaCode && peaName) mapping[peaCode] = peaName;
            }
        }
        return mapping;
    },

    async fetchBudgetData() {
        const data = await this.fetchSheetData('Budget_Data');
        const mapping = {};
        if (data?.rows) {
            const rows = data.rows;
            for (let i = 0; i < rows.length; i++) {
                const wbs = this.getCellValue(rows[i].c[2])?.toString().trim();
                const rawValue = this.getCellValue(rows[i].c[19])?.toString() || "0";
                const cleanValue = rawValue.replace(/[^0-9.]/g, ''); 
                if (wbs) mapping[wbs] = parseFloat(cleanValue) || 0;
            }
        }
        return mapping;
    },

    async fetchUpcomingItemData() {
        return await this.fetchSheetData('Upcoming_Item');
    },

    buildMaterialTypeMap: function(masterData) {
        const map = {};
        if (!masterData?.rows) return map;
        const rows = masterData.rows;
        for (let i = 0; i < rows.length; i++) {
            const partID = this.getCellValue(rows[i].c[0])?.toString().trim();
            const type = this.getCellValue(rows[i].c[2])?.toString().trim();
            const cost = this.getCellValue(rows[i].c[3])?.toString().trim();
            if (partID) map[partID] = { type: type || "ทั่วไป", cost: parseFloat(cost) || 0 };
        }
        return map;
    }

};
