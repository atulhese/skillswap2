const express = require("express");
const router = express.Router();
const db = require("../db");

// =====================================
// FIND USERS WHO OFFER A SKILL
// =====================================

router.get("/find-skill/:skill_id", (req, res) => {

    const skillId = req.params.skill_id;

    const sql = `
        SELECT
            u.user_id,
            u.name,
            u.email,
            s.skill_name
        FROM user_skills us
        JOIN users u
            ON us.user_id = u.user_id
        JOIN skills s
            ON us.skill_id = s.skill_id
        WHERE us.skill_id = ?
        AND us.skill_type = 'OFFER'
    `;

    db.query(
        sql,
        [skillId],
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    message: "Unable to find users",
                    error: err.message
                });

            }

            res.json(result);

        }
    );

});


// =====================================
// FIND MUTUAL MATCHES
// =====================================

router.get("/matches/:user_id", (req, res) => {

    const userId = req.params.user_id;

    const sql = `

        SELECT DISTINCT

            other_user.user_id,

            other_user.name,

            other_user.email,

            my_offer.skill_id AS my_offered_skill_id,

            my_offer_skill.skill_name AS my_offered_skill,

            my_want.skill_id AS my_wanted_skill_id,

            my_want_skill.skill_name AS my_wanted_skill,

            other_offer_skill.skill_name AS they_can_teach,

            other_want_skill.skill_name AS they_want_to_learn

        FROM user_skills my_want

        JOIN user_skills my_offer
            ON my_offer.user_id = my_want.user_id
            AND my_offer.skill_type = 'OFFER'

        JOIN user_skills other_offer
            ON other_offer.skill_id = my_want.skill_id
            AND other_offer.skill_type = 'OFFER'

        JOIN user_skills other_want
            ON other_want.user_id = other_offer.user_id
            AND other_want.skill_id = my_offer.skill_id
            AND other_want.skill_type = 'WANT'

        JOIN users other_user
            ON other_user.user_id = other_offer.user_id

        JOIN skills my_offer_skill
            ON my_offer_skill.skill_id = my_offer.skill_id

        JOIN skills my_want_skill
            ON my_want_skill.skill_id = my_want.skill_id

        JOIN skills other_offer_skill
            ON other_offer_skill.skill_id = other_offer.skill_id

        JOIN skills other_want_skill
            ON other_want_skill.skill_id = other_want.skill_id

        WHERE my_want.user_id = ?

        AND my_want.skill_type = 'WANT'

        AND other_user.user_id <> ?

    `;

    db.query(
        sql,
        [userId, userId],
        (err, result) => {

            if (err) {

                console.log("Match Error:", err);

                return res.status(500).json({
                    message: "Unable to find matches",
                    error: err.message
                });

            }

            res.json(result);

        }
    );

});

module.exports = router;
