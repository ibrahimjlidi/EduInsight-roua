import api from "./axiosInstance";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getChoices = async (params = {}) => {
  const res = await api.get("/choices/list", { params, headers: authHeader() });
  return res.data;
};

export const createChoice = async (payload) => {
  const res = await api.post("/choices/ajouter", payload, { headers: authHeader() });
  return res.data;
};

export const updateChoice = async (id, payload) => {
  const res = await api.put(`/choices/${id}`, payload, { headers: authHeader() });
  return res.data;
};

export const deleteChoice = async (id) => {
  const res = await api.delete(`/choices/${id}`, { headers: authHeader() });
  return res.data;
};
