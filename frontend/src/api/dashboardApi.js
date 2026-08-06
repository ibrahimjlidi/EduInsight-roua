// src/api/dashboardApi.js
import api from "./axiosInstance";

export const getAdminDashboard = async () => {
  const res = await api.get("/dashboard/admin", { headers: authHeader() });
  return res.data;
};

export const getTeacherDashboard = async () => {
  const res = await api.get("/dashboard/teacher", { headers: authHeader() });
  return res.data;
};

export const getStudentDashboard = async () => {
  const res = await api.get("/dashboard/student", { headers: authHeader() });
  return res.data;
};

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}