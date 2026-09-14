const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined
});

function toPostgres(sql) {
    let index = 0;
    return sql
        .replace(/\?/g, () => `$${++index}`)
        .replace(/\bNOW\(\)/gi, "CURRENT_TIMESTAMP")
        .replace(/`/g, '"');
}

function query(sql, values = [], callback) {
    if (typeof values === "function") {
        callback = values;
        values = [];
    }

    const text = toPostgres(sql);
    pool.query(text, values)
        .then(async (result) => {
            const response = result.rows;
            response.insertId = undefined;
            response.affectedRows = result.rowCount;

            if (/^\s*INSERT\s+INTO\s+([a-z_]+)/i.test(text)) {
                const table = text.match(/^\s*INSERT\s+INTO\s+([a-z_]+)/i)[1];
                const idColumn = {
                    users: "user_id",
                    skills: "skill_id",
                    user_skills: "user_skill_id",
                    swap_requests: "swap_id",
                    messages: "message_id",
                    sessions: "session_id"
                }[table];
                if (idColumn) {
                    const idResult = await pool.query(
                        "SELECT currval(pg_get_serial_sequence($1, $2)) AS id",
                        [table, idColumn]
                    );
                    response.insertId = idResult.rows[0]?.id;
                }
            }

            callback?.(null, response);
        })
        .catch((error) => {
            if (error.code === "23505") error.code = "ER_DUP_ENTRY";
            callback?.(error);
        });
}

const ready = (async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS sessions (
            session_id SERIAL PRIMARY KEY,
            swap_id INTEGER NOT NULL REFERENCES swap_requests(swap_id) ON DELETE CASCADE,
            session_date TIMESTAMPTZ NOT NULL,
            duration INTEGER NOT NULL,
            title VARCHAR(180) NOT NULL DEFAULT 'SkillSwap learning session',
            agenda VARCHAR(500),
            meeting_link VARCHAR(500),
            session_status VARCHAR(20) NOT NULL DEFAULT 'Scheduled'
        )
    `);
    await pool.query("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS title VARCHAR(180) NOT NULL DEFAULT 'SkillSwap learning session'");
    await pool.query("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS agenda VARCHAR(500)");
    await pool.query("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(500)");
})();

module.exports = { query, ready, pool };
