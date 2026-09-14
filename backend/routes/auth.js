const express = require("express");
const router = express.Router();
const db = require("../db");

// =====================================
// REGISTER USER
// =====================================

router.post("/register", (req, res) => {

    const {
        name,
        email,
        phone,
        password
    } = req.body;

    if (!name || !email || !phone || !password) {

        return res.status(400).json({
            message: "All fields are required"
        });

    }

    const sql = `
        INSERT INTO users
        (name, email, phone, password)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [name, email, phone, password],
        (err, result) => {

            if (err) {

                console.log("Register Error:", err);

                if (err.code === "ER_DUP_ENTRY") {

                    return res.status(400).json({
                        message: "Email already registered"
                    });

                }

                return res.status(500).json({
                    message: "Registration failed",
                    error: err.message
                });

            }

            res.status(201).json({

                message: "Registration successful",
                user_id: result.insertId

            });

        }
    );

});


// =====================================
// LOGIN
// =====================================

router.post("/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {

        return res.status(400).json({
            message: "Email and password are required"
        });

    }

    const sql = `
        SELECT
            user_id,
            name,
            email,
            phone
        FROM users
        WHERE email = ?
        AND password = ?
    `;

    db.query(
        sql,
        [email, password],
        (err, result) => {

            if (err) {

                console.log("Login Error:", err);

                return res.status(500).json({
                    message: "Login failed",
                    error: err.message
                });

            }

            if (result.length === 0) {

                return res.status(401).json({
                    message: "Invalid email or password"
                });

            }

            res.json({

                message: "Login successful",

                user: result[0]

            });

        }
    );

});

module.exports = router;
