# SkillSwap — Full Stack Project

A skill-exchange platform where users offer skills, find matches,
send swap requests, message each other, and schedule learning
sessions.

## Project Structure

```
skill-swap-project/
├── backend/
│   ├── server.js              <- entry point, run this
│   ├── db.js                  <- MySQL connection
│   ├── package.json
│   └── routes/
│       ├── auth.js            <- register, login
│       ├── skills.js          <- skill catalog, user skills
│       ├── matches.js         <- skill discovery & matching
│       ├── swapRequests.js    <- send/accept/reject requests
│       ├── swaps.js           <- active/completed swaps
│       ├── messages.js        <- NEW: direct messaging
│       └── sessions.js        <- NEW: schedule learning sessions
├── frontend/
│   └── index.html             <- single-page app (sidebar UI)
└── database/
    └── messages_sessions_schema.sql   <- run this in MySQL
```

## Setup

### 1. Database

Your existing database (`skill_swap`) should already have:
`users`, `skills`, `user_skills`, `swap_requests`.

Add the two new tables by running:

```bash
mysql -u root -p skill_swap < database/messages_sessions_schema.sql
```

This creates `messages` and `sessions`, and inserts the sample rows
you shared.

### 2. Backend

```bash
cd backend
npm install
node server.js
```

You should see:
```
✅ MySQL Connected Successfully
🚀 Server running at http://localhost:5000
```

### 3. Frontend

Open `frontend/index.html` directly in your browser, or serve it
with a tool like VS Code's Live Server extension.

The frontend is hardcoded to call the backend at
`http://localhost:5000` — make sure the backend is running before
you use the app.

## Full API Reference

| Module | Method | Route | Purpose |
|---|---|---|---|
| Auth | POST | `/api/register` | Create account |
| Auth | POST | `/api/login` | Log in |
| Skills | GET | `/api/skills` | List all skills |
| Skills | POST | `/api/user-skills` | Add a skill to your profile |
| Skills | GET | `/api/user-skills/:user_id` | List your skills |
| Matches | GET | `/api/find-skill/:skill_id` | Find who offers a skill |
| Matches | GET | `/api/matches/:user_id` | Find two-way matches |
| Swap Requests | POST | `/api/swap-request` | Send a swap request |
| Swap Requests | GET | `/api/requests/:user_id` | View received requests |
| Swap Requests | PUT | `/api/swap-request/:id/accept` | Accept a request |
| Swap Requests | PUT | `/api/swap-request/:id/reject` | Reject a request |
| Swaps | GET | `/api/swaps/:userId` | View active/completed swaps |
| Swaps | PUT | `/api/swaps/:id/complete` | Mark a swap completed |
| **Messages** | POST | `/api/messages` | Send a message |
| **Messages** | GET | `/api/messages/:user1/:user2` | Get a conversation |
| **Messages** | GET | `/api/messages/conversations/:user_id` | Get inbox list |
| **Sessions** | POST | `/api/sessions` | Schedule a session |
| **Sessions** | GET | `/api/sessions/:user_id` | List your sessions |
| **Sessions** | GET | `/api/sessions/swap/:swap_id` | Sessions for one swap |
| **Sessions** | PUT | `/api/sessions/:id/status` | Update session status |
| **Sessions** | PUT | `/api/sessions/:id/reschedule` | Reschedule a session |

## Notes

- Sessions can only be scheduled for swaps that are `Accepted` or
  `Completed` — the backend checks this before inserting.
- The sidebar in `index.html` now has 7 tabs: Dashboard, My Skills,
  Find Matches, Swap Requests, Active Swaps, Messages, Sessions.
- All 7 backend route modules were verified end-to-end with a test
  script that boots the server and hits every endpoint.
