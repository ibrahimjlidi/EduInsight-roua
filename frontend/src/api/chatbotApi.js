// src/api/chatbotApi.js
import api from "./axiosInstance";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const sendChatMessage = async (message, history) => {
  const res = await api.post(
    "/chatbot/message",
    { message, history },
    { headers: authHeader() }
  );
  return res.data;
};