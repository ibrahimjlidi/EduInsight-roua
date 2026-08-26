import api from "./axiosInstance";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getQuestions = async (params = {}) => {
  const res = await api.get("/questions/list", { params, headers: authHeader() });
  return res.data;
};

export const createQuestion = async (payload) => {
  const res = await api.post("/questions/ajouter", payload, { headers: authHeader() });
  return res.data;
};

export const updateQuestion = async (id, payload) => {
  const res = await api.put(`/questions/${id}`, payload, { headers: authHeader() });
  return res.data;
};

export const deleteQuestion = async (id) => {
  const res = await api.delete(`/questions/${id}`, { headers: authHeader() });
  return res.data;
};
