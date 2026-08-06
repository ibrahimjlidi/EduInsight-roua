// src/api/courseApi.js
import api from "./axiosInstance";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const isFormData = (payload) => payload instanceof FormData;

const uploadHeaders = (payload) => ({
  ...authHeader(),
  ...(isFormData(payload) ? { "Content-Type": "multipart/form-data" } : {}),
});

export const getCourses = async (params = {}) => {
  const res = await api.get("/courses/list", { params });
  return res.data;
};

export const createCourse = async (payload) => {
  const res = await api.post("/courses/ajouter", payload, { headers: uploadHeaders(payload) });
  return res.data;
};

export const updateCourse = async (id, payload) => {
  const res = await api.put(`/courses/${id}`, payload, { headers: uploadHeaders(payload) });
  return res.data;
};

export const deleteCourse = async (id) => {
  const res = await api.delete(`/courses/${id}`, { headers: authHeader() });
  return res.data;
};
