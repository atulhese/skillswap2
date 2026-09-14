const express = require("express");
const router = express.Router();
const db = require("../db");

// =====================================
// SCHEDULE A SESSION FOR A SWAP
// =====================================

router.post("/sessions", (req, res) => {

    const {
        swap_id,
        session_date,
        duration,
        agenda = "",
        meeting_link = ""
    } = req.body;

    if (!swap_id || !session_date || !duration) {

        return res.status(400).json({
            message: "swap_id, session_date and duration are required"
        });

    }


    // =====================================
    // MAKE SURE THE SWAP EXISTS AND IS ACCEPTED
    // =====================================

    const checkSwapSql = `
        SELECT swap_status
        FROM swap_requests
        WHERE swap_id = ?
    `;

    db.query(
        checkSwapSql,
        [swap_id],
        (err, result) => {

            if (err) {

                console.log("Check Swap Error:", err);

                return res.status(500).json({
                    message: "Unable to verify swap",
                    error: err.message
                });

            }

            if (result.length === 0) {

                return res.status(404).json({
                    message: "Swap request not found"
                });

            }

            const status = result[0].swap_status.toLowerCase();

            if (status !== "accepted" && status !== "completed") {

                return res.status(400).json({
                    message: "You can only schedule sessions for accepted swaps"
                });

            }


            // =====================================
            // INSERT SESSION
            // =====================================

            const insertSql = `
                INSERT INTO sessions
                (swap_id, session_date, duration, agenda, meeting_link, session_status)
                VALUES (?, ?, ?, ?, ?, 'Scheduled')
            `;

            db.query(
                insertSql,
                [swap_id, session_date, duration, String(agenda).trim().slice(0, 500), String(meeting_link).trim().slice(0, 500)],
                (err, result) => {

                    if (err) {

                        console.log("Schedule Session Error:", err);

                        return res.status(500).json({
                            message: "Unable to schedule session",
                            error: err.message
                        });

                    }

                    res.status(201).json({

                        message: "Session scheduled successfully",

                        session_id: result.insertId

                    });

                }
            );

        }
    );

});


// =====================================
// GET ALL SESSIONS FOR A USER
// =====================================
// A user's sessions are found through the
// swap_requests they are the sender or
// receiver of.

router.get("/sessions/:user_id", (req, res) => {

    const userId = req.params.user_id;

    const sql = `
        SELECT

            se.session_id,
            se.swap_id,
            se.session_date,
            se.duration,
            se.agenda,
            se.meeting_link,
            se.session_status,

            sr.sender_id,
            sr.receiver_id,

            sender.name AS sender_name,
            receiver.name AS receiver_name,

            offered.skill_name AS offered_skill,
            requested.skill_name AS requested_skill

        FROM sessions se

        JOIN swap_requests sr
            ON sr.swap_id = se.swap_id

        JOIN users sender
            ON sender.user_id = sr.sender_id

        JOIN users receiver
            ON receiver.user_id = sr.receiver_id

        JOIN skills offered
            ON offered.skill_id = sr.offered_skill_id

        JOIN skills requested
            ON requested.skill_id = sr.requested_skill_id

        WHERE sr.sender_id = ? OR sr.receiver_id = ?

        ORDER BY se.session_date ASC
    `;

    db.query(
        sql,
        [userId, userId],
        (err, result) => {

            if (err) {

                console.log("Get Sessions Error:", err);

                return res.status(500).json({
                    message: "Unable to load sessions",
                    error: err.message
                });

            }

            res.json(result);

        }
    );

});


// =====================================
// GET SESSIONS FOR A SPECIFIC SWAP
// =====================================

router.get("/sessions/swap/:swap_id", (req, res) => {

    const swapId = req.params.swap_id;

    const sql = `
        SELECT
            session_id,
            swap_id,
            session_date,
            duration,
            session_status
        FROM sessions
        WHERE swap_id = ?
        ORDER BY session_date ASC
    `;

    db.query(
        sql,
        [swapId],
        (err, result) => {

            if (err) {

                console.log("Get Swap Sessions Error:", err);

                return res.status(500).json({
                    message: "Unable to load sessions for this swap",
                    error: err.message
                });

            }

            res.json(result);

        }
    );

});


// =====================================
// UPDATE SESSION STATUS
// =====================================
// Accepts: Scheduled, Completed, Cancelled

router.put("/sessions/:session_id/status", (req, res) => {

    const sessionId = req.params.session_id;
    const { status } = req.body;

    const allowedStatuses = ["Scheduled", "Completed", "Cancelled"];

    if (!status || !allowedStatuses.includes(status)) {

        return res.status(400).json({
            message: "status must be one of: Scheduled, Completed, Cancelled"
        });

    }

    const sql = `
        UPDATE sessions
        SET session_status = ?
        WHERE session_id = ?
    `;

    db.query(
        sql,
        [status, sessionId],
        (err, result) => {

            if (err) {

                console.log("Update Session Status Error:", err);

                return res.status(500).json({
                    message: "Unable to update session status",
                    error: err.message
                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message: "Session not found"
                });

            }

            res.json({
                message: `Session marked as ${status}`
            });

        }
    );

});


// =====================================
// RESCHEDULE A SESSION
// =====================================

router.put("/sessions/:session_id/reschedule", (req, res) => {

    const sessionId = req.params.session_id;
    const { session_date, duration } = req.body;

    if (!session_date || !duration) {

        return res.status(400).json({
            message: "session_date and duration are required"
        });

    }

    const sql = `
        UPDATE sessions
        SET session_date = ?, duration = ?, session_status = 'Scheduled'
        WHERE session_id = ?
    `;

    db.query(
        sql,
        [session_date, duration, sessionId],
        (err, result) => {

            if (err) {

                console.log("Reschedule Session Error:", err);

                return res.status(500).json({
                    message: "Unable to reschedule session",
                    error: err.message
                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message: "Session not found"
                });

            }

            res.json({
                message: "Session rescheduled successfully"
            });

        }
    );

});

module.exports = router;
