import api from "./axiosInstance";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getDocuments = async (params = {}) => {
  const res = await api.get("/documents/list", { params, headers: authHeader() });
  return res.data;
};

export const createDocument = async (payload) => {
  const res = await api.post("/documents", payload, {
    headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateDocument = async (id, payload) => {
  const res = await api.put(`/documents/${id}`, payload, { headers: authHeader() });
  return res.data;
};

export const deleteDocument = async (id) => {
  const res = await api.delete(`/documents/${id}`, { headers: authHeader() });
  return res.data;
};

export const getDocumentUrl = (fileName) => {
  const base = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "");
  return `${base}/uploads/docs/${fileName}`;
};
