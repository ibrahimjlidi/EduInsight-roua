// src/config/sidebarConfig.js
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Puzzle,
  GraduationCap,
  FileText,
  Award,
  LineChart,
  Library,
} from "lucide-react";

export const sidebarConfig = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { label: "Users", icon: Users, path: "/admin/users" },
    { label: "Courses", icon: BookOpen, path: "/admin/courses" },
    { label: "Quizzes", icon: Puzzle, path: "/admin/quizzes" },
    { label: "Students", icon: GraduationCap, path: "/admin/students" },
    { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
    { label: "Docs", icon: FileText, path: "/admin/docs" },
    { label: "Settings", icon: Settings, path: "/admin/settings" },
  ],
  teacher: [
    { label: "Courses", icon: BookOpen, path: "/teacher/courses" },
    { label: "Quizzes", icon: Puzzle, path: "/teacher/quizzes" },
    { label: "Students", icon: GraduationCap, path: "/teacher/students" },
    { label: "Docs", icon: FileText, path: "/teacher/docs" },
    { label: "Settings", icon: Settings, path: "/teacher/settings" },
  ],
  student: [
    { label: "My Courses", icon: Library, path: "/student/courses" },
    { label: "My Quizzes", icon: BarChart3, path: "/student/quizzes" },
    { label: "My Progress", icon: LineChart, path: "/student/progress" },
    { label: "Certificates", icon: Award, path: "/student/certificates" },
    { label: "Docs", icon: FileText, path: "/student/docs" },
  ],
};
