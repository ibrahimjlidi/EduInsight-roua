// config/sidebarMenu.js
// ⚠️ IMPORTANT : garde cette liste synchronisée avec src/config/sidebarConfig.js (frontend)
// Copie ici uniquement label + path (pas les icônes, elles n'existent pas côté backend)

module.exports = {
  admin: [
    { label: "Dashboard", path: "/admin" },
    { label: "Users", path: "/admin/users" },
    { label: "Courses", path: "/admin/courses" },
    { label: "Quizzes", path: "/admin/quizzes" },
    { label: "Students", path: "/admin/students" },
    { label: "Analytics", path: "/admin/analytics" },
    { label: "Docs", path: "/admin/docs" },
    { label: "Settings", path: "/admin/settings" },
  ],
  teacher: [
    { label: "Dashboard", path: "/teacher" },
    { label: "Courses", path: "/teacher/courses" },
    { label: "Quizzes", path: "/teacher/quizzes" },
    { label: "Students", path: "/teacher/students" },
    { label: "Docs", path: "/teacher/docs" },
    { label: "Settings", path: "/teacher/settings" },
  ],
  student: [
    { label: "Dashboard", path: "/student" },
    { label: "My Courses", path: "/student/courses" },
    { label: "My Quizzes", path: "/student/quizzes" },
    { label: "My Progress", path: "/student/progress" },
    { label: "Recommendations", path: "/student/recommendations" },
    { label: "Certificates", path: "/student/certificates" },
    { label: "Docs", path: "/student/docs" },
  ],
};