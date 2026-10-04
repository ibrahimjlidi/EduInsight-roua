import api from "./axiosInstance";

export const getMyCertificates = async () => {
  const token = localStorage.getItem("token");
  const res = await api.get("/certificates/mine", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
};
