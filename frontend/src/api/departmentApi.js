// src/api/departmentApi.js
import api from "./axiosInstance";

export const getDepartments = async () => {
  const res = await api.get("/departments/list");
  return res.data;
};