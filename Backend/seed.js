// seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Department = require("./models/Department");
const User = require("./models/User");
require("./models/Admin");
require("./models/Teacher");
require("./models/Student");
const Course = require("./models/Course");
const Module = require("./models/Module");
const Lesson = require("./models/Lesson");
const Quiz = require("./models/Quiz");
const Question = require("./models/Question");
const Choice = require("./models/Choice");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/EduInsight";

const seedDatabase = async () => {
  try {
    // 1. Connexion
    await mongoose.connect(MONGO_URI);
    console.log("🔌 Connecté à MongoDB pour le seeding...");

    // 2. Nettoyage
    await Department.deleteMany({});
    await User.deleteMany({});
    await Course.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});
    await Quiz.deleteMany({});
    await Question.deleteMany({});
    await Choice.deleteMany({});
    console.log("🧹 Anciennes données supprimées.");

    // 3. Mot de passe hashé
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    // 4. Département
    const dept = await Department.create({
      name: "Informatique & Technologies",
      description: "Département génie logiciel et développement web",
    });
    console.log("✅ Département créé.");

    // 5. Utilisateurs (via discriminators)
    const AdminModel = User.discriminators["admin"];
    const TeacherModel = User.discriminators["teacher"];
    const StudentModel = User.discriminators["student"];

    const admin = await AdminModel.create({
      firstName: "Admin",
      lastName: "System",
      email: "admin@eduinsight.com",
      password: hashedPassword,
      permissions: ["ALL_PERMISSIONS"],
    });

    const teacher = await TeacherModel.create({
      firstName: "Roua",
      lastName: "Rezgui",
      email: "teacher@eduinsight.com",
      password: hashedPassword,
      speciality: "MERN Stack & Web Dev",
      office: "B-204",
      department: dept._id,
    });

    const student = await StudentModel.create({
      firstName: "Sami",
      lastName: "Ben Salah",
      email: "student@eduinsight.com",
      password: hashedPassword,
      studentCode: "ETU2026001",
      level: "L2",
      group: "G1",
      department: dept._id,
    });

    console.log("✅ Utilisateurs créés (Admin, Teacher, Student).");

    // 6. Cours (champs PascalCase selon ton modèle Course.js)
    const course = await Course.create({
      Title: "Développement Web avec la Stack MERN",
      Description: "Apprenez à concevoir des applications full-stack modernes avec React et Express.",
      Department: dept._id,
      Teacher: teacher._id,
      Duration: "30 heures",
      Level: "L2",
    });
    console.log("✅ Cours créé.");

    // 7. Module et Leçon
    const module1 = await Module.create({
      Title: "Module 1 : Introduction à Node.js & Express",
      Description: "Bases du serveur backend",
      Order: 1,
      course: course._id,
    });

    await Lesson.create({
      Title: "Leçon 1 : Création du serveur Express",
      Content: "<h1>Bienvenue dans Express</h1><p>Explication des routes et contrôleurs...</p>",
      Order: 1,
      module: module1._id,
    });
    console.log("✅ Module et Leçon créés.");

    // 8. Quiz + Question + Choix
    const quiz = await Quiz.create({
      course: course._id,
      Title: "Quiz 1 : Notions de base Express.js",
      Description: "Test sur les middlewares et le routage",
      Duration: 15,
      isPublished: true,
      createdBy: teacher._id,
    });

    const question1 = await Question.create({
      quiz: quiz._id,
      Statement: "Quel middleware permet de parser le JSON dans Express ?",
      Type: "MCQ",
      Points: 2,
      Order: 1,
    });

    await Choice.create([
      { question: question1._id, Text: "express.json()", isCorrect: true, Order: 1 },
      { question: question1._id, Text: "express.parse()", isCorrect: false, Order: 2 },
      { question: question1._id, Text: "body.json()", isCorrect: false, Order: 3 },
    ]);

    console.log("✅ Quiz, Questions et Choix créés.");
    console.log("🎉 Seeding terminé avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur durant le seeding :", error);
    process.exit(1);
  }
};

seedDatabase();