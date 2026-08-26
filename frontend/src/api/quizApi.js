import api from "./axiosInstance";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getQuizzes = async (params = {}) => {
  const res = await api.get("/quizzes/list", { params, headers: authHeader() });
  return res.data;
};

export const getQuizForTaking = async (id) => {
  const res = await api.get(`/quizzes/${id}/take`, { headers: authHeader() });
  return res.data;
};

export const createQuiz = async (payload) => {
  const res = await api.post("/quizzes/ajouter", payload, { headers: authHeader() });
  return res.data;
};

export const updateQuiz = async (id, payload) => {
  const res = await api.put(`/quizzes/${id}`, payload, { headers: authHeader() });
  return res.data;
};

export const deleteQuiz = async (id) => {
  const res = await api.delete(`/quizzes/${id}`, { headers: authHeader() });
  return res.data;
};
