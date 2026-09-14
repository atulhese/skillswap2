-- =====================================================
-- MESSAGES TABLE
-- =====================================================
-- Stores direct messages between two users.

CREATE TABLE IF NOT EXISTS messages (

    message_id      INT AUTO_INCREMENT PRIMARY KEY,

    sender_id       INT NOT NULL,
    receiver_id     INT NOT NULL,

    message_text    TEXT NOT NULL,

    message_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sender_id)   REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE

);


-- =====================================================
-- SESSIONS TABLE
-- =====================================================
-- Stores scheduled learning sessions tied to an
-- accepted swap request.

CREATE TABLE IF NOT EXISTS sessions (

    session_id      INT AUTO_INCREMENT PRIMARY KEY,

    swap_id         INT NOT NULL,

    session_date    DATETIME NOT NULL,

    duration        INT NOT NULL,           -- duration in minutes

    agenda          VARCHAR(500) NULL,

    meeting_link    VARCHAR(500) NULL,

    session_status  VARCHAR(20) NOT NULL DEFAULT 'Scheduled',

    FOREIGN KEY (swap_id) REFERENCES swap_requests(swap_id) ON DELETE CASCADE

);


-- =====================================================
-- SAMPLE DATA (matches what you shared)
-- =====================================================

INSERT INTO messages (sender_id, receiver_id, message_text, message_date) VALUES
(1, 2, 'Hi Rahul, I would like to learn Python from you.', '2026-09-01 17:10:00'),
(2, 1, 'Sure Atul, I would like to learn Java from you.', '2026-09-01 17:15:00'),
(3, 6, 'Hi Rohan, can we schedule an SQL learning session?', '2026-09-02 09:00:00'),
(6, 3, 'Yes Priya, we can schedule it tomorrow.', '2026-09-02 09:10:00'),
(4, 5, 'I can teach you Machine Learning concepts.', '2026-09-02 12:15:00'),
(5, 4, 'Great! I can help you learn React.', '2026-09-02 12:20:00'),
(7, 3, 'Hi Priya, I would like to learn Excel.', '2026-09-03 10:15:00'),
(8, 5, 'Can you teach me UI/UX design?', '2026-09-03 13:10:00');

INSERT INTO sessions (swap_id, session_date, duration, session_status) VALUES
(1, '2026-09-05 10:00:00', 60, 'Scheduled'),
(2, '2026-09-05 14:00:00', 90, 'Scheduled'),
(4, '2026-09-06 11:00:00', 60, 'Scheduled');
