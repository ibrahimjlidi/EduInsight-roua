// src/api/authApi.js
import api from "./axiosInstance";

export const loginUser = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

export const registerUser = async (payload) => {
  // payload peut contenir : firstName, lastName, email, password, role,
  // + speciality/office/department (teacher) ou level/department (student)
  const res = await api.post("/auth/register", payload);
  return res.data;
};