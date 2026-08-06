// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");

dotenv.config();
const app = express();


/* Middlewares globaux */
app.use(express.json()); // lire le body JSON
app.use(cors()); // autoriser les requêtes externes

// Connexion BDD
connectDB();

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
//
app.use("/api/register", require("./routes/authRoutes"));
app.use("/api/login", require("./routes/authRoutes"));
//
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
//
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/departments", require("./routes/departmentRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/modules", require("./routes/moduleRoutes"));
app.use("/api/lessons", require("./routes/lessonRoutes"));
app.use("/api/quizzes", require("./routes/quizRoutes"));
app.use("/api/questions", require("./routes/questionRoutes"));
app.use("/api/choices", require("./routes/choiceRoutes"));
app.use("/api/quiz-attempts", require("./routes/quizAttemptRoutes"));
app.use("/api/answers", require("./routes/answerRoutes"));
app.use("/api/inscriptions", require("./routes/inscriptionRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/recommendations", require("./routes/recommendationRoutes"));
app.use("/api/performance-metrics", require("./routes/performanceMetricRoutes"));
app.use("/api/audit-logs", require("./routes/auditLogRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
// Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
