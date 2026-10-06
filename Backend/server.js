// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");
const securityHeaders = require("./middlewares/securityHeaders");

dotenv.config();
const app = express();
app.disable("x-powered-by");


/* Middlewares globaux */
app.use(securityHeaders);
app.use(express.json({ limit: "1mb" })); // lire le body JSON
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
//
app.use("/api/register", require("./routes/authRoutes"));
app.use("/api/login", require("./routes/authRoutes"));
//
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
//
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/departments", require("./routes/departmentRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/courses", require("./routes/courseLearningRoutes"));
app.use("/api/courses", require("./routes/courseContentRoutes"));
app.use("/api/courses", require("./routes/courseTutorRoutes"));
app.use("/api/modules", require("./routes/moduleRoutes"));
app.use("/api/lessons", require("./routes/lessonRoutes"));
app.use("/api/quizzes", require("./routes/quizRoutes"));
app.use("/api/questions", require("./routes/questionRoutes"));
app.use("/api/choices", require("./routes/choiceRoutes"));
app.use("/api/quiz-attempts", require("./routes/quizAttemptRoutes"));
app.use("/api/answers", require("./routes/answerRoutes"));
app.use("/api/inscriptions", require("./routes/inscriptionRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/documents", require("./routes/documentRoutes"));
app.use("/api/recommendations", require("./routes/recommendationRoutes"));
app.use("/api/certificates", require("./routes/certificateRoutes"));
app.use("/api/performance-metrics", require("./routes/performanceMetricRoutes"));
app.use("/api/audit-logs", require("./routes/auditLogRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/chatbot", require("./routes/chatbotRoutes"));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "eduinsight-api" });
});

// Lancer le serveur
const PORT = process.env.PORT || 5001;

if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("❌ Erreur de connexion MongoDB :", err.message);
      process.exitCode = 1;
    });
}

module.exports = app;
