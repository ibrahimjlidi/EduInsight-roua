// src/App.jsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Panel from "./components/Panel";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard"));
const TeacherDashboard = lazy(() => import("./pages/dashboard/TeacherDashboard"));
const StudentDashboard = lazy(() => import("./pages/dashboard/StudentDashboard"));
const AdminCourses = lazy(() => import("./pages/admin/Courses"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminQuizzes = lazy(() => import("./pages/admin/Quizzes"));
const AdminStudents = lazy(() => import("./pages/admin/Students"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const TeacherCourses = lazy(() => import("./pages/teacher/Courses"));
const TeacherQuizzes = lazy(() => import("./pages/teacher/Quizzes"));
const TeacherStudents = lazy(() => import("./pages/teacher/Students"));
const StudentCourses = lazy(() => import("./pages/student/Courses"));
const StudentCourseLearning = lazy(() => import("./pages/student/CourseLearning"));
const StudentQuizzes = lazy(() => import("./pages/student/Quizzes"));
const StudentQuizTake = lazy(() => import("./pages/student/QuizTake"));
const StudentProgress = lazy(() => import("./pages/student/Progress"));
const StudentRecommendations = lazy(() => import("./pages/student/Recommendations"));
const StudentCertificates = lazy(() => import("./pages/student/Certificates"));
const CourseContentManagement = lazy(() => import("./pages/shared/CourseContentManagement"));
const Docs = lazy(() => import("./pages/shared/Docs"));
const Settings = lazy(() => import("./pages/shared/Settings"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={
        <main className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950" aria-live="polite">
          <Panel className="mx-auto flex max-w-xl items-center gap-4 p-6">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />
            <p className="font-bold text-slate-700 dark:text-slate-200">Loading your workspace…</p>
          </Panel>
        </main>
      }>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/:courseId/content"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CourseContentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/quizzes"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminQuizzes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/docs"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Docs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseId/content"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <CourseContentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/quizzes"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherQuizzes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/docs"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <Docs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/settings"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses/:courseId/learn"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentCourseLearning />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/quizzes"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentQuizzes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/quizzes/:quizId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentQuizTake />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/progress"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/recommendations"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentRecommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/certificates"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentCertificates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/docs"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Docs />
            </ProtectedRoute>
          }
        />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
