const express = require("express");
const router = express.Router();
const db = require("../db");

// =====================================================
// GET ACTIVE / COMPLETED SWAPS
// =====================================================

router.get("/swaps/:userId", (req, res) => {

    const userId = Number(req.params.userId);

    if (!userId) {

        return res.status(400).json({

            success: false,

            message: "Invalid user ID"

        });

    }


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

            receiver.name AS receiver_name,

            offered.skill_name AS offered_skill,

            requested.skill_name AS requested_skill

        FROM swap_requests sr

        INNER JOIN users sender
            ON sr.sender_id = sender.user_id

        INNER JOIN users receiver
            ON sr.receiver_id = receiver.user_id

        INNER JOIN skills offered
            ON sr.offered_skill_id = offered.skill_id

        INNER JOIN skills requested
            ON sr.requested_skill_id = requested.skill_id

        WHERE

            (
                sr.sender_id = ?
                OR
                sr.receiver_id = ?
            )

            AND

            (
                LOWER(sr.swap_status) = 'accepted'

                OR

                LOWER(sr.swap_status) = 'completed'
            )

        ORDER BY sr.swap_date DESC

    `;


    db.query(

        sql,

        [userId, userId],

        (err, results) => {

            if (err) {

                console.error(
                    "GET SWAPS ERROR:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to load swaps",

                    error:
                        err.message

                });

            }


            console.log(
                `Swaps for user ${userId}:`,
                results
            );


            res.json({

                success: true,

                swaps: results

            });

        }
    );

});


// =====================================
// COMPLETE SWAP
// =====================================

router.put(
    "/swaps/:swap_id/complete",
    (req, res) => {

        const swapId = req.params.swap_id;

        const sql = `

            UPDATE swap_requests

            SET swap_status = 'Completed'

            WHERE swap_id = ?

            AND swap_status = 'Accepted'

        `;

        db.query(

            sql,

            [swapId],

            (err, result) => {

                if (err) {

                    console.log(
                        "Complete Swap Error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Unable to complete swap",
                        error:
                            err.message
                    });

                }

                if (result.affectedRows === 0) {

                    return res.status(400).json({
                        message:
                            "Swap not found or already completed"
                    });

                }

                res.json({

                    message:
                        "Swap completed successfully"

                });

            }
        );

    }
);

module.exports = router;
