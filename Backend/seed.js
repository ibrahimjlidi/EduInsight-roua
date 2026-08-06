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
const Inscription = require("./models/Inscription");
const QuizAttempt = require("./models/QuizAttempt");
const PerformanceMetric = require("./models/PerformanceMetric");

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
    await Inscription.deleteMany({});
    await QuizAttempt.deleteMany({});
    await PerformanceMetric.deleteMany({});
    console.log("🧹 Anciennes données supprimées.");

    // 3. Mot de passe hashé
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    // 4. Département
    const dept = await Department.create({
      name: "Informatique & Technologies",
      description: "Département génie logiciel et développement web",
    });
    console.log("✅ Département créé.");

    // 5. Modèles discriminators
    const AdminModel = User.discriminators["admin"];
    const TeacherModel = User.discriminators["teacher"];
    const StudentModel = User.discriminators["student"];

    // 5.1 Admin
    const admin = await AdminModel.create({
      firstName: "Admin",
      lastName: "System",
      email: "admin@eduinsight.com",
      password: hashedPassword,
      permissions: ["ALL_PERMISSIONS"],
    });
    console.log("✅ Admin créé.");

    // 5.2 Liste de 10 Teachers avec noms distincts
    const teacherNames = [
      { firstName: "Ahmed", lastName: "Ben Salah" },
      { firstName: "Sonia", lastName: "Trabelsi" },
      { firstName: "Karim", lastName: "Jebali" },
      { firstName: "Nadia", lastName: "Cherif" },
      { firstName: "Mehdi", lastName: "Bouazizi" },
      { firstName: "Ines", lastName: "Gharbi" },
      { firstName: "Walid", lastName: "Mansour" },
      { firstName: "Amel", lastName: "Sassi" },
      { firstName: "Youssef", lastName: "Khelifi" },
      { firstName: "Rania", lastName: "Ouertani" },
    ];

    const teachers = [];
    for (let i = 0; i < teacherNames.length; i++) {
      const t = await TeacherModel.create({
        firstName: teacherNames[i].firstName,
        lastName: teacherNames[i].lastName,
        email: `teacher${i + 1}@eduinsight.com`,
        password: hashedPassword,
        speciality: "MERN Stack & Web Dev",
        office: `B-${200 + i}`,
        department: dept._id,
      });
      teachers.push(t);
    }
    console.log("✅ 10 Teachers créés.");

    // 5.3 Liste de 10 Students avec noms distincts
    const studentNames = [
      { firstName: "Sami", lastName: "Ben Ali" },
      { firstName: "Maram", lastName: "Achouri" },
      { firstName: "Yassine", lastName: "Hamdi" },
      { firstName: "Emna", lastName: "Zribi" },
      { firstName: "Firas", lastName: "Belhaj" },
      { firstName: "Sarra", lastName: "Nasri" },
      { firstName: "Aymen", lastName: "Chaabane" },
      { firstName: "Lina", lastName: "Bouhlel" },
      { firstName: "Anis", lastName: "Frikha" },
      { firstName: "Hiba", lastName: "Snoussi" },
    ];

    const students = [];
    for (let i = 0; i < studentNames.length; i++) {
      const s = await StudentModel.create({
        firstName: studentNames[i].firstName,
        lastName: studentNames[i].lastName,
        email: `student${i + 1}@eduinsight.com`,
        password: hashedPassword,
        studentCode: `ETU2026${String(i + 1).padStart(3, "0")}`,
        level: "L2",
        group: "G1",
        department: dept._id,
      });
      students.push(s);
    }
    console.log("✅ 10 Students créés.");

    // 6. Cours de démonstration pour les dashboards
    const courseSeeds = [
      ["React Fundamentals", "Build modern interfaces with React components, hooks and state.", 0, "24 hours", "Beginner"],
      ["Data Science Intro", "Explore Python, notebooks, datasets and visual analysis.", 1, "30 hours", "Draft"],
      ["UX/UI Design", "Design attractive digital products with wireframes and prototypes.", 2, "18 hours", "Advanced"],
      ["Machine Learning", "Understand supervised learning, evaluation and practical models.", 3, "32 hours", "Upcoming"],
      ["Cloud Architecture", "Deploy scalable applications with cloud-native services.", 4, "28 hours", "Intermediate"],
      ["Cybersecurity 101", "Learn practical security fundamentals for web platforms.", 5, "20 hours", "Beginner"],
    ];

    const courses = await Course.create(
      courseSeeds.map(([Title, Description, teacherIndex, Duration, Level]) => ({
        Title,
        Description,
        Department: dept._id,
        Teacher: teachers[teacherIndex]._id,
        Duration,
        Level,
      }))
    );
    console.log("✅ 6 cours créés.");

    // 7. Modules et leçons pour chaque cours
    for (let i = 0; i < courses.length; i++) {
      const module = await Module.create({
        Title: `Module 1 : ${courses[i].Title}`,
        Description: "Introduction et objectifs du cours",
        Order: 1,
        course: courses[i]._id,
      });

      await Lesson.create({
        Title: "Lesson 1 : Getting started",
        Content: `<h1>${courses[i].Title}</h1><p>Course introduction and practical workflow.</p>`,
        Order: 1,
        module: module._id,
      });
    }
    console.log("✅ Modules et leçons créés.");

    // 8. Quiz + Questions + Choix
    const quizSeeds = [
      [courses[0], "React Basics", "Components, props and hooks", 3, teachers[0]],
      [courses[1], "Data Science Quiz", "Datasets and basic analysis", 2, teachers[1]],
      [courses[2], "UX Quiz", "Design principles", 1, teachers[2]],
      [courses[4], "Cloud Quiz", "Architecture foundations", 2, teachers[4]],
    ];

    const quizzes = [];
    for (const [course, Title, Description, questionCount, teacher] of quizSeeds) {
      const quiz = await Quiz.create({
        course: course._id,
        Title,
        Description,
        Duration: 15,
        isPublished: true,
        createdBy: teacher._id,
      });
      quizzes.push(quiz);

      for (let i = 1; i <= questionCount; i++) {
        const question = await Question.create({
          quiz: quiz._id,
          Statement: `${Title} question ${i}`,
          Type: "MCQ",
          Points: 2,
          Order: i,
        });

        await Choice.create([
          { question: question._id, Text: "Correct answer", isCorrect: true, Order: 1 },
          { question: question._id, Text: "Distractor A", isCorrect: false, Order: 2 },
          { question: question._id, Text: "Distractor B", isCorrect: false, Order: 3 },
        ]);
      }
    }
    console.log("✅ Quiz, questions et choix créés.");

    // 9. Inscriptions, tentatives et métriques pour alimenter student/analytics
    await Inscription.create([
      { student: students[0]._id, course: courses[0]._id, status: "active" },
      { student: students[0]._id, course: courses[2]._id, status: "completed" },
      { student: students[0]._id, course: courses[4]._id, status: "active" },
      { student: students[1]._id, course: courses[0]._id, status: "active" },
      { student: students[2]._id, course: courses[1]._id, status: "active" },
      { student: students[3]._id, course: courses[2]._id, status: "completed" },
    ]);

    await QuizAttempt.create([
      { student: students[0]._id, quiz: quizzes[0]._id, score: 85, totalQuestions: 3, startedAt: new Date(), submittedAt: new Date(), duration: 12 },
      { student: students[0]._id, quiz: quizzes[2]._id, score: 92, totalQuestions: 1, startedAt: new Date(), submittedAt: new Date(), duration: 6 },
      { student: students[0]._id, quiz: quizzes[3]._id, score: 78, totalQuestions: 2, startedAt: new Date(), submittedAt: new Date(), duration: 10 },
      { student: students[3]._id, quiz: quizzes[2]._id, score: 88, totalQuestions: 1, startedAt: new Date(), submittedAt: new Date(), duration: 7 },
    ]);

    await PerformanceMetric.create([
      { student: students[0]._id, course: courses[0]._id, weekName: "Week 1", quizScoreAverage: 72, attendanceRate: 95 },
      { student: students[0]._id, course: courses[2]._id, weekName: "Week 2", quizScoreAverage: 85, attendanceRate: 98 },
      { student: students[0]._id, course: courses[4]._id, weekName: "Week 3", quizScoreAverage: 92, attendanceRate: 96 },
    ]);

    console.log("✅ Inscriptions, tentatives et métriques créées.");
    console.log("🎉 Seeding terminé avec succès ! (1 Admin, 10 Teachers, 10 Students, 6 Courses, 4 Quizzes)");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur durant le seeding :", error);
    process.exit(1);
  }
};

seedDatabase();
