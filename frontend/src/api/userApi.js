import api from "./axiosInstance";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getUsers = async (params = {}) => {
  const res = await api.get("/users/list", { params, headers: authHeader() });
  return res.data;
};

export const createUser = async (payload) => {
  const res = await api.post("/users/ajouter", payload, { headers: authHeader() });
  return res.data;
};

export const updateUser = async (id, payload) => {
  const res = await api.put(`/users/${id}`, payload, { headers: authHeader() });
  return res.data;
};

export const deactivateUser = async (id) => {
  const res = await api.delete(`/users/${id}`, { headers: authHeader() });
  return res.data;
};
