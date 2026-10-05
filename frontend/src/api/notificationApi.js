import api from "./axiosInstance";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getNotifications = async (params = {}) => {
  const res = await api.get("/notifications/list", { params, headers: authHeader() });
  return res.data;
};

export const markNotificationRead = async (id) => {
  const res = await api.put(`/notifications/${id}`, { isRead: true }, { headers: authHeader() });
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await api.put("/notifications/read-all", {}, { headers: authHeader() });
  return res.data;
};
