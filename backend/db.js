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

db.connect((err) => {

    if (err) {
        console.log("❌ Database connection failed:");
        console.log(err.message);
        return;
    }

    console.log("✅ MySQL Connected Successfully");

});

module.exports = db;
