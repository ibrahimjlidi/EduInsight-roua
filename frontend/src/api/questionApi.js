import api from "./axiosInstance";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getQuestions = async () => {
  const res = await api.get("/questions/list", { headers: authHeader() });
  return res.data;
};
