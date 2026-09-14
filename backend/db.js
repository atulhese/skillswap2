const mysql = require("mysql2");

// =====================================
// MYSQL CONNECTION
// =====================================

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "skill_swap"
});

db.ready = new Promise((resolve, reject) => {
    db.connect((err) => {
        if (err) {
            console.log("❌ Database connection failed:");
            console.log(err.message);
            reject(err);
            return;
        }

        console.log("✅ MySQL Connected Successfully");

        // Older installations may not have the scheduling metadata columns.
        // Complete this migration before the API starts accepting requests.
        const sessionColumns = [
            ["title", "VARCHAR(180) NOT NULL DEFAULT 'SkillSwap learning session'"],
            ["agenda", "VARCHAR(500) NULL"],
            ["meeting_link", "VARCHAR(500) NULL"]
        ];

        const ensureSessionColumns = (index = 0) => {
            if (index >= sessionColumns.length) {
                resolve();
                return;
            }

            const [column, definition] = sessionColumns[index];
            const columnSql = `
                SELECT COUNT(*) AS column_count
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'sessions'
                  AND column_name = ?
            `;

            db.query(columnSql, [column], (columnError, rows) => {
                if (columnError) {
                    console.log("Session schema check failed:", columnError.message);
                    reject(columnError);
                    return;
                }

                if (rows[0].column_count > 0) {
                    ensureSessionColumns(index + 1);
                    return;
                }

                db.query(`ALTER TABLE sessions ADD COLUMN ${column} ${definition}`, (alterError) => {
                    if (alterError) {
                        console.log(`Session schema migration failed for ${column}:`, alterError.message);
                        reject(alterError);
                        return;
                    }
                    ensureSessionColumns(index + 1);
                });
            });
        };

        ensureSessionColumns();
    });
});

module.exports = db;
