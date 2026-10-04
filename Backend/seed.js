require("dotenv").config();
const bcrypt = require("bcryptjs");
const fs = require("fs/promises");
const mongoose = require("mongoose");
const path = require("path");

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
const Answer = require("./models/Answer");
const PerformanceMetric = require("./models/PerformanceMetric");
const Certificate = require("./models/Certificate");
const Document = require("./models/Document");
const Notification = require("./models/Notification");
const Recommendation = require("./models/Recommendation");
const AuditLog = require("./models/AuditLog");

const DEMO_PASSWORD = "DemoEduInsight123!";
const DEMO_DOCUMENT_NAME = "eduinsight-demo-learning-guide.txt";
const DEMO_DOCUMENT_CONTENT = [
  "EduInsight demo learning guide",
  "",
  "Use this sample document to test course learning resources.",
  "Sign in as a demo student, open Docs, and download this file.",
  "",
].join("\n");
const seedRecord = async (Model, filter, data) => Model.findOneAndUpdate(
  filter,
  { $setOnInsert: data },
  { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
);

const seedDatabase = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Add it to Backend/.env before running npm run seed.");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const password = await bcrypt.hash(DEMO_PASSWORD, 10);
    const department = await seedRecord(Department, { name: "EduInsight Demo Department" }, {
      name: "EduInsight Demo Department",
      description: "Sample department for testing EduInsight workflows.",
    });

    const Admin = User.discriminators.admin;
    const Teacher = User.discriminators.teacher;
    const Student = User.discriminators.student;
    const admin = await seedRecord(Admin, { email: "demo.admin@eduinsight.test" }, {
      firstName: "Demo",
      lastName: "Admin",
      email: "demo.admin@eduinsight.test",
      password,
      permissions: ["ALL_PERMISSIONS"],
    });
    const teacher = await seedRecord(Teacher, { email: "demo.teacher@eduinsight.test" }, {
      firstName: "Demo",
      lastName: "Teacher",
      email: "demo.teacher@eduinsight.test",
      password,
      speciality: "Software Development",
      department: department._id,
    });
    const student = await seedRecord(Student, { email: "demo.student@eduinsight.test" }, {
      firstName: "Demo",
      lastName: "Student",
      email: "demo.student@eduinsight.test",
      password,
      studentCode: "DEMO00001",
      level: "L2",
      group: "DEMO",
      department: department._id,
    });
    const secondStudent = await seedRecord(Student, { email: "demo.student2@eduinsight.test" }, {
      firstName: "Alex",
      lastName: "Learner",
      email: "demo.student2@eduinsight.test",
      password,
      studentCode: "DEMO00002",
      level: "L1",
      group: "DEMO",
      department: department._id,
    });

    const courseDefinitions = [
      {
        key: "web-development",
        title: "Demo Web Development",
        description: "Build and test accessible web applications with HTML, CSS, and JavaScript.",
        level: "Beginner",
        status: "completed",
        score: 100,
      },
      {
        key: "database-fundamentals",
        title: "Demo Database Fundamentals",
        description: "Learn relational data, MongoDB documents, and safe application persistence.",
        level: "Intermediate",
        status: "active",
        score: 0,
      },
      {
        key: "learning-analytics",
        title: "Demo Learning Analytics",
        description: "Explore learning outcomes, assessment design, and student progress.",
        level: "Beginner",
        status: "active",
        score: null,
      },
    ];

    const seededCourses = [];
    for (const [index, definition] of courseDefinitions.entries()) {
      const course = await seedRecord(Course, { Title: definition.title }, {
        Title: definition.title,
        Description: definition.description,
        Department: department._id,
        Teacher: teacher._id,
        Duration: `${8 + index * 2} hours`,
        Level: definition.level,
      });
      seededCourses.push({ ...definition, document: course });

      const module = await seedRecord(Module, { course: course._id, Order: 1 }, {
        Title: `Getting Started: ${definition.title}`,
        Description: `Introduction to ${definition.title}.`,
        Order: 1,
        course: course._id,
      });
      await seedRecord(Lesson, { module: module._id, Order: 1 }, {
        Title: "Introduction and learning objectives",
        Content: `<h1>${definition.title}</h1><p>${definition.description}</p><p>Complete the published quiz to check your understanding.</p>`,
        Order: 1,
        module: module._id,
      });

      const quiz = await seedRecord(Quiz, { course: course._id, Title: `${definition.title} Checkpoint` }, {
        course: course._id,
        Title: `${definition.title} Checkpoint`,
        Description: `A short assessment for ${definition.title}.`,
        Duration: 15,
        isPublished: true,
        createdBy: teacher._id,
      });
      const questions = [];
      for (const [questionIndex, statement] of [
        `What is the main learning goal of ${definition.title}?`,
        `Which action best demonstrates progress in ${definition.title}?`,
      ].entries()) {
        const questionData = {
          quiz: quiz._id,
          Statement: statement,
          Type: "MCQ",
          Points: 2,
          Order: questionIndex + 1,
        };
        const question = await Question.findOneAndUpdate(
          { quiz: quiz._id, Order: questionIndex + 1 },
          { $set: questionData },
          { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
        );
        const correctChoice = await seedRecord(Choice, { question: question._id, Order: 1 }, {
          question: question._id,
          Text: "Apply the course concepts to a practical task",
          isCorrect: true,
          Order: 1,
        });
        const incorrectChoice = await seedRecord(Choice, { question: question._id, Order: 2 }, {
          question: question._id,
          Text: "Skip the lesson and assessment",
          isCorrect: false,
          Order: 2,
        });
        questions.push({ question, correctChoice, incorrectChoice });
      }
      seededCourses[seededCourses.length - 1].quiz = quiz;
      seededCourses[seededCourses.length - 1].questions = questions;
    }

    for (const [index, course] of seededCourses.entries()) {
      const enrollment = await seedRecord(Inscription, { student: student._id, course: course.document._id }, {
        student: student._id,
        course: course.document._id,
        status: course.status,
      });
      if (index < 2) {
        const attempt = await seedRecord(QuizAttempt, { student: student._id, quiz: course.quiz._id }, {
          student: student._id,
          quiz: course.quiz._id,
          score: course.score,
          totalQuestions: course.questions.length,
          startedAt: new Date(),
          submittedAt: new Date(),
          duration: 300,
        });
        for (const [questionIndex, item] of course.questions.entries()) {
          const selectedChoice = course.score === 100
            ? item.correctChoice._id
            : item.incorrectChoice._id;
          await seedRecord(Answer, { attempt: attempt._id, question: item.question._id }, {
            attempt: attempt._id,
            question: item.question._id,
            selectedChoice,
            isCorrect: course.score === 100,
            pointsEarned: course.score === 100 ? item.question.Points : 0,
          });
        }
      }

      if (index === 1) {
        await seedRecord(Inscription, { student: secondStudent._id, course: course.document._id }, {
          student: secondStudent._id,
          course: course.document._id,
          status: "active",
        });
      }

      await seedRecord(PerformanceMetric, {
        student: student._id,
        course: course.document._id,
        weekName: "Demo Week 1",
      }, {
        student: student._id,
        course: course.document._id,
        weekName: "Demo Week 1",
        quizScoreAverage: course.score ?? 0,
        attendanceRate: course.status === "completed" ? 100 : 75,
      });

      if (enrollment.status === "completed") {
        await seedRecord(Certificate, { student: student._id, course: course.document._id }, {
          student: student._id,
          course: course.document._id,
          certificateCode: `EI-DEMO-${course.key.toUpperCase()}`,
          issuedAt: new Date(),
          score: course.score,
          quizAttempt: await QuizAttempt.findOne({ student: student._id, quiz: course.quiz._id }).then((attempt) => attempt._id),
        });
      }
    }

    const demoDocumentPath = path.join(__dirname, "uploads", "docs", DEMO_DOCUMENT_NAME);
    await fs.mkdir(path.dirname(demoDocumentPath), { recursive: true });
    try {
      await fs.writeFile(demoDocumentPath, DEMO_DOCUMENT_CONTENT, { flag: "wx" });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }

    const documentStat = await fs.stat(demoDocumentPath);
    await seedRecord(Document, { fileName: DEMO_DOCUMENT_NAME }, {
      title: "Demo Course Learning Guide",
      description: "Sample course resource for testing document access and downloads.",
      fileName: DEMO_DOCUMENT_NAME,
      originalName: DEMO_DOCUMENT_NAME,
      mimeType: "text/plain",
      size: documentStat.size,
      course: seededCourses[0].document._id,
      uploadedBy: teacher._id,
      audience: "all",
    });
    await seedRecord(Notification, {
      user: student._id,
      title: "Demo course enrollment",
      type: "enrollment",
    }, {
      user: student._id,
      title: "Demo course enrollment",
      message: "Your EduInsight demo courses are ready to explore.",
      type: "enrollment",
      isRead: false,
    });
    await seedRecord(Recommendation, {
      student: student._id,
      message: "Review the database lesson and retry the checkpoint quiz.",
      type: "practice",
    }, {
      student: student._id,
      message: "Review the database lesson and retry the checkpoint quiz.",
      type: "practice",
      confidenceScore: 0.9,
    });
    await seedRecord(AuditLog, {
      user: admin._id,
      action: "SEED",
      entity: "Course",
      entityId: seededCourses[0].document._id,
    }, {
      user: admin._id,
      action: "SEED",
      entity: "Course",
      entityId: seededCourses[0].document._id,
      ipAddress: "127.0.0.1",
    });

    const seededQuizIds = seededCourses.map((course) => course.quiz._id);
    const [courseCount, quizCount, moduleCount, lessonCount, questionCount, choiceCount, enrollmentCount, attemptCount, answerCount, metricCount, certificateCount, documentCount, notificationCount, recommendationCount, auditLogCount] = await Promise.all([
      Course.countDocuments({ Title: /^Demo / }),
      Quiz.countDocuments({ Title: /^Demo / }),
      Module.countDocuments({ course: { $in: seededCourses.map((course) => course.document._id) } }),
      Lesson.countDocuments({ module: { $in: await Module.find({ course: { $in: seededCourses.map((course) => course.document._id) } }).distinct("_id") } }),
      Question.countDocuments({ quiz: { $in: seededQuizIds } }),
      Choice.countDocuments({ question: { $in: await Question.find({ quiz: { $in: seededQuizIds } }).distinct("_id") } }),
      Inscription.countDocuments({ student: { $in: [student._id, secondStudent._id] } }),
      QuizAttempt.countDocuments({ student: student._id, submittedAt: { $ne: null } }),
      Answer.countDocuments({ attempt: { $in: await QuizAttempt.find({ student: student._id }).distinct("_id") } }),
      PerformanceMetric.countDocuments({ student: student._id }),
      Certificate.countDocuments({ student: student._id }),
      Document.countDocuments({ fileName: DEMO_DOCUMENT_NAME }),
      Notification.countDocuments({ user: student._id, title: "Demo course enrollment" }),
      Recommendation.countDocuments({ student: student._id, type: "practice" }),
      AuditLog.countDocuments({ user: admin._id, action: "SEED", entityId: seededCourses[0].document._id }),
    ]);

    console.log("Demo records are saved in MongoDB. Existing collections and users were not deleted or overwritten.");
    console.log("Demo admin: demo.admin@eduinsight.test");
    console.log("Demo teacher: demo.teacher@eduinsight.test");
    console.log("Demo student: demo.student@eduinsight.test (completed course and certificate)");
    console.log("Demo second student: demo.student2@eduinsight.test");
    console.log(`Password for new demo accounts: ${DEMO_PASSWORD}`);
    console.log(`Verified in MongoDB: ${courseCount} courses, ${moduleCount} modules, ${lessonCount} lessons, ${quizCount} quizzes, ${questionCount} questions, ${choiceCount} choices, ${enrollmentCount} enrollments, ${attemptCount} submitted attempts, ${answerCount} answers, ${metricCount} performance metrics, ${documentCount} sample document, ${notificationCount} notification, ${recommendationCount} saved recommendation, ${auditLogCount} audit event and ${certificateCount} certificate(s).`);
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase().catch((error) => {
  console.error("Failed to seed demo data:", error.message);
  process.exitCode = 1;
});
