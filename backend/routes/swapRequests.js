const express = require("express");
const router = express.Router();
const db = require("../db");

// =====================================
// SEND SWAP REQUEST
// =====================================

router.post("/swap-request", (req, res) => {

    const {
        requester_id,
        receiver_id,
        offered_skill_id,
        requested_skill_id
    } = req.body;

    if (
        !requester_id ||
        !receiver_id ||
        !offered_skill_id ||
        !requested_skill_id
    ) {

        return res.status(400).json({
            message: "All swap request fields are required"
        });

    }

    if (requester_id == receiver_id) {

        return res.status(400).json({
            message: "You cannot send a request to yourself"
        });

    }


    // =====================================
    // VALIDATE MUTUAL MATCH
    // =====================================

    const validationSql = `

        SELECT

            (
                SELECT COUNT(*)
                FROM user_skills
                WHERE user_id = ?
                AND skill_id = ?
                AND skill_type = 'OFFER'
            ) AS requester_offer,

            (
                SELECT COUNT(*)
                FROM user_skills
                WHERE user_id = ?
                AND skill_id = ?
                AND skill_type = 'WANT'
            ) AS requester_want,

            (
                SELECT COUNT(*)
                FROM user_skills
                WHERE user_id = ?
                AND skill_id = ?
                AND skill_type = 'OFFER'
            ) AS receiver_offer,

            (
                SELECT COUNT(*)
                FROM user_skills
                WHERE user_id = ?
                AND skill_id = ?
                AND skill_type = 'WANT'
            ) AS receiver_want

    `;

    db.query(

        validationSql,

        [
            requester_id,
            offered_skill_id,

            requester_id,
            requested_skill_id,

            receiver_id,
            requested_skill_id,

            receiver_id,
            offered_skill_id
        ],

        (err, result) => {

            if (err) {

                console.log("Validation Error:", err);

                return res.status(500).json({
                    message: "Unable to validate skill match",
                    error: err.message
                });

            }

            const validation = result[0];

            if (
                Number(validation.requester_offer) === 0 ||
                Number(validation.requester_want) === 0 ||
                Number(validation.receiver_offer) === 0 ||
                Number(validation.receiver_want) === 0
            ) {

                return res.status(400).json({
                    message:
                        "This is not a valid mutual skill match"
                });

            }


            // =====================================
            // CHECK DUPLICATE PENDING REQUEST
            // =====================================

            const duplicateSql = `

                SELECT swap_id
                FROM swap_requests
                WHERE sender_id = ?
                AND receiver_id = ?
                AND offered_skill_id = ?
                AND requested_skill_id = ?
                AND LOWER(swap_status) = 'pending'

            `;

            db.query(

                duplicateSql,

                [
                    requester_id,
                    receiver_id,
                    offered_skill_id,
                    requested_skill_id
                ],

                (err, duplicateResult) => {

                    if (err) {

                        console.log(
                            "Duplicate Check Error:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Unable to check existing request",
                            error: err.message
                        });

                    }

                    if (duplicateResult.length > 0) {

                        return res.status(400).json({
                            message:
                                "Swap request already sent"
                        });

                    }


                    // =====================================
                    // INSERT REQUEST
                    // =====================================

                    const insertSql = `

                        INSERT INTO swap_requests

                        (
                            sender_id,
                            receiver_id,
                            offered_skill_id,
                            requested_skill_id,
                            swap_status
                        )

                        VALUES (?, ?, ?, ?, 'Pending')

                    `;

                    db.query(

                        insertSql,

                        [
                            requester_id,
                            receiver_id,
                            offered_skill_id,
                            requested_skill_id
                        ],

                        (err, result) => {

                            if (err) {

                                console.log(
                                    "Insert Request Error:",
                                    err
                                );

                                return res.status(500).json({
                                    message:
                                        "Unable to send swap request",
                                    error: err.message
                                });

                            }

                            res.status(201).json({

                                message:
                                    "Swap request sent successfully",

                                swap_id:
                                    result.insertId

                            });

                        }
                    );

                }
            );

        }
    );

});


// =====================================
// GET RECEIVED SWAP REQUESTS
// =====================================

router.get("/requests/:user_id", (req, res) => {

    const userId = req.params.user_id;

    const sql = `

        SELECT

            sr.swap_id,

            sr.sender_id,

            sr.receiver_id,

            sr.offered_skill_id,

            sr.requested_skill_id,

            sr.swap_date,

            sr.swap_status,

            sender.name AS sender_name,

            sender.email AS sender_email,

            offered_skill.skill_name AS offered_skill,

            requested_skill.skill_name AS requested_skill

        FROM swap_requests sr

        JOIN users sender
            ON sender.user_id = sr.sender_id

        JOIN skills offered_skill
            ON offered_skill.skill_id = sr.offered_skill_id

        JOIN skills requested_skill
            ON requested_skill.skill_id = sr.requested_skill_id

        WHERE sr.receiver_id = ?

        ORDER BY sr.swap_id DESC

    `;

    db.query(

        sql,

        [userId],

        (err, result) => {

            if (err) {

                console.log("Request Load Error:", err);

                return res.status(500).json({
                    message: "Unable to load requests",
                    error: err.message
                });

            }

            res.json(result);

        }
    );

});


// =====================================
// ACCEPT SWAP REQUEST
// =====================================

router.put(
    "/swap-request/:swap_id/accept",
    (req, res) => {

        const swapId = req.params.swap_id;


        // =====================================
        // GET REQUEST
        // =====================================

        const getRequestSql = `

            SELECT *

            FROM swap_requests

            WHERE swap_id = ?

        `;

        db.query(

            getRequestSql,

            [swapId],

            (err, result) => {

                if (err) {

                    console.log(
                        "Get Request Error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Unable to find request",
                        error:
                            err.message
                    });

                }

                if (result.length === 0) {

                    return res.status(404).json({
                        message:
                            "Swap request not found"
                    });

                }

                const request = result[0];


                // =====================================
                // CHECK STATUS
                // =====================================

                if (
                    request.swap_status.toLowerCase()
                    !== "pending"
                ) {

                    return res.status(400).json({
                        message:
                            "This request has already been processed"
                    });

                }


                // =====================================
                // UPDATE STATUS
                // =====================================

                const updateSql = `

                    UPDATE swap_requests

                    SET swap_status = 'Accepted'

                    WHERE swap_id = ?

                    AND swap_status = 'Pending'

                `;

                db.query(

                    updateSql,

                    [swapId],

                    (err, updateResult) => {

                        if (err) {

                            console.log(
                                "Accept Error:",
                                err
                            );

                            return res.status(500).json({
                                message:
                                    "Unable to accept request",
                                error:
                                    err.message
                            });

                        }

                        if (
                            updateResult.affectedRows === 0
                        ) {

                            return res.status(400).json({
                                message:
                                    "Request already processed"
                            });

                        }


                        res.json({

                            message:
                                "Swap request accepted successfully",

                            swap_id:
                                request.swap_id

                        });

                    }
                );

            }
        );

    }
);


// =====================================
// REJECT SWAP REQUEST
// =====================================

router.put(
    "/swap-request/:swap_id/reject",
    (req, res) => {

        const swapId = req.params.swap_id;

        const sql = `

            UPDATE swap_requests

            SET swap_status = 'Rejected'

            WHERE swap_id = ?

            AND swap_status = 'Pending'

        `;

        db.query(

            sql,

            [swapId],

            (err, result) => {

                if (err) {

                    console.log(
                        "Reject Error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Unable to reject request",
                        error:
                            err.message
                    });

                }

                if (result.affectedRows === 0) {

                    return res.status(400).json({
                        message:
                            "Request not found or already processed"
                    });

                }

                res.json({

                    message:
                        "Swap request rejected"

                });

            }
        );

    }
);

module.exports = router;
