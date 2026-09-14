const express = require("express");
const router = express.Router();
const db = require("../db");

// =====================================
// GET ALL SKILLS
// =====================================

router.get("/skills", (req, res) => {

    const sql = `
        SELECT
            skill_id,
            skill_name
        FROM skills
        ORDER BY skill_name
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log("Skills Error:", err);

            return res.status(500).json({
                message: "Unable to load skills",
                error: err.message
            });

        }

        res.json(result);

    });

});


// =====================================
// ADD USER SKILL
// =====================================

router.post("/user-skills", (req, res) => {

    const {
        user_id,
        skill_id,
        skill_type
    } = req.body;

    if (!user_id || !skill_id || !skill_type) {

        return res.status(400).json({
            message: "user_id, skill_id and skill_type are required"
        });

    }

    if (
        skill_type !== "OFFER" &&
        skill_type !== "WANT"
    ) {

        return res.status(400).json({
            message: "skill_type must be OFFER or WANT"
        });

    }

    const sql = `
        INSERT INTO user_skills
        (user_id, skill_id, skill_type)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [user_id, skill_id, skill_type],
        (err, result) => {

            if (err) {

                console.log("Add Skill Error:", err);

                if (err.code === "ER_DUP_ENTRY") {

                    return res.status(400).json({
                        message:
                            "You already added this skill with this type"
                    });

                }

                return res.status(500).json({
                    message: "Unable to add skill",
                    error: err.message
                });

            }

            res.status(201).json({

                message: "Skill added successfully",

                skill_id: result.insertId

            });

        }
    );

});


// =====================================
// GET USER SKILLS
// =====================================

router.get("/user-skills/:user_id", (req, res) => {

    const userId = req.params.user_id;

    const sql = `
        SELECT
            us.user_skill_id,
            us.user_id,
            us.skill_id,
            s.skill_name,
            us.skill_type
        FROM user_skills us
        JOIN skills s
            ON us.skill_id = s.skill_id
        WHERE us.user_id = ?
        ORDER BY us.skill_type, s.skill_name
    `;

    db.query(
        sql,
        [userId],
        (err, result) => {

            if (err) {

                console.log("User Skills Error:", err);

                return res.status(500).json({
                    message: "Unable to load your skills",
                    error: err.message
                });

            }

            res.json(result);

        }
    );

});

module.exports = router;
