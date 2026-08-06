// src/api/inscriptionApi.js
import api from "./axiosInstance";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getMyInscriptions = async () => {
  const res = await api.get("/inscriptions/list", { headers: authHeader() });
  return res.data;
};

export const enrollInCourse = async (courseId) => {
  const res = await api.post(
    "/inscriptions/ajouter",
    { course: courseId, status: "active" },
    { headers: authHeader() }
  );
  return res.data;
};