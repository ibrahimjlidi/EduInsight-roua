import api from "./axiosInstance";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const startQuizAttempt = async (quizId) => {
  const res = await api.post("/quiz-attempts/ajouter", { quiz: quizId }, { headers: authHeader() });
  return res.data;
};

export const getQuizAttempts = async (params = {}) => {
  const res = await api.get("/quiz-attempts/list", { params, headers: authHeader() });
  return res.data;
};

export const submitQuizAttempt = async (attemptId, answers) => {
  const res = await api.post(`/quiz-attempts/${attemptId}/submit`, { answers }, { headers: authHeader() });
  return res.data;
};
