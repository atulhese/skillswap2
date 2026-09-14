const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const authRoutes = require("./routes/auth");
const skillsRoutes = require("./routes/skills");
const matchesRoutes = require("./routes/matches");
const swapRequestRoutes = require("./routes/swapRequests");
const swapsRoutes = require("./routes/swaps");
const messagesRoutes = require("./routes/messages");
const sessionsRoutes = require("./routes/sessions");

const app = express();


// =====================================
// MIDDLEWARE
// =====================================

app.use(cors());
app.use(express.json());


// =====================================
// HOME
// =====================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});


// =====================================
// ROUTES
// =====================================

app.use("/api", authRoutes);
app.use("/api", skillsRoutes);
app.use("/api", matchesRoutes);
app.use("/api", swapRequestRoutes);
app.use("/api", swapsRoutes);
app.use("/api", messagesRoutes);
app.use("/api", sessionsRoutes);


// =====================================
// SERVER
// =====================================

app.use(async (req, res, next) => {
    try {
        await db.ready;
        next();
    } catch (error) {
        res.status(503).json({ message: "Database is unavailable" });
    }
});

if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    db.ready
        .then(() => app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`)))
        .catch((err) => {
            console.error("Server startup aborted because the database is not ready:", err.message);
            process.exitCode = 1;
        });
}

module.exports = app;
