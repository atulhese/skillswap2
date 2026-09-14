const express = require("express");
const router = express.Router();
const db = require("../db");

// =====================================
// SEND MESSAGE
// =====================================

router.post("/messages", (req, res) => {

    const {
        sender_id,
        receiver_id,
        message_text
    } = req.body;

    if (!sender_id || !receiver_id || !message_text) {

        return res.status(400).json({
            message: "sender_id, receiver_id and message_text are required"
        });

    }

    if (sender_id == receiver_id) {

        return res.status(400).json({
            message: "You cannot message yourself"
        });

    }

    const sql = `
        INSERT INTO messages
        (sender_id, receiver_id, message_text, message_date)
        VALUES (?, ?, ?, NOW())
    `;

    db.query(
        sql,
        [sender_id, receiver_id, message_text],
        (err, result) => {

            if (err) {

                console.log("Send Message Error:", err);

                return res.status(500).json({
                    message: "Unable to send message",
                    error: err.message
                });

            }

            res.status(201).json({

                message: "Message sent successfully",

                message_id: result.insertId

            });

        }
    );

});


// =====================================
// GET CONVERSATION BETWEEN TWO USERS
// =====================================

router.get("/messages/:user1/:user2", (req, res) => {

    const { user1, user2 } = req.params;

    const sql = `
        SELECT
            m.message_id,
            m.sender_id,
            m.receiver_id,
            m.message_text,
            m.message_date,
            s.name AS sender_name,
            r.name AS receiver_name
        FROM messages m
        JOIN users s ON s.user_id = m.sender_id
        JOIN users r ON r.user_id = m.receiver_id
        WHERE
            (m.sender_id = ? AND m.receiver_id = ?)
            OR
            (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.message_date ASC
    `;

    db.query(
        sql,
        [user1, user2, user2, user1],
        (err, result) => {

            if (err) {

                console.log("Get Conversation Error:", err);

                return res.status(500).json({
                    message: "Unable to load conversation",
                    error: err.message
                });

            }

            res.json(result);

        }
    );

});


// =====================================
// GET LIST OF CONVERSATIONS (INBOX)
// =====================================
// Returns the other user + the most recent
// message exchanged with them, one row per
// conversation partner.

router.get("/messages/conversations/:user_id", (req, res) => {

    const userId = req.params.user_id;

    const sql = `
        SELECT

            other_user.user_id,
            other_user.name,
            other_user.email,

            latest.message_text AS last_message,
            latest.message_date AS last_message_date

        FROM (

            SELECT

                CASE
                    WHEN sender_id = ? THEN receiver_id
                    ELSE sender_id
                END AS other_user_id,

                MAX(message_date) AS max_date

            FROM messages

            WHERE sender_id = ? OR receiver_id = ?

            GROUP BY other_user_id

        ) AS convo

        JOIN messages latest
            ON latest.message_date = convo.max_date
            AND (
                (latest.sender_id = ? AND latest.receiver_id = convo.other_user_id)
                OR
                (latest.receiver_id = ? AND latest.sender_id = convo.other_user_id)
            )

        JOIN users other_user
            ON other_user.user_id = convo.other_user_id

        ORDER BY latest.message_date DESC
    `;

    db.query(
        sql,
        [userId, userId, userId, userId, userId],
        (err, result) => {

            if (err) {

                console.log("Get Conversations Error:", err);

                return res.status(500).json({
                    message: "Unable to load conversations",
                    error: err.message
                });

            }

            res.json(result);

        }
    );

});

module.exports = router;
