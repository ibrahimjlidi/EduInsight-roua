import api from "./axiosInstance";

export const getPersonalizedRecommendations = async () => {
  const token = localStorage.getItem("token");
  const res = await api.get("/recommendations/personalized", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
};
