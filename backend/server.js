const express = require("express");
const cors = require("cors");

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

    res.json({
        message: "Skill Swap Management API is running"
    });

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

const PORT = 5000;

app.listen(PORT, () => {

    console.log(
        `🚀 Server running at http://localhost:${PORT}`
    );

});
