const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Abk483tnu+',
    server: 'localhost',
    port: 1433,
    database: 'nextjs_dashboard',
    options: {
        encrypt: false,              // 本地端通常關閉
        trustServerCertificate: true // 避免憑證錯誤
    }
};

async function testConnection() {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT GETDATE() as now`;
        console.log("✅ Connected! Current time:", result.recordset[0].now);
    } catch (err) {
        console.error("❌ Connection failed:", err);
    }
}

testConnection();
