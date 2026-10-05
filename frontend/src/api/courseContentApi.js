import api from "./axiosInstance";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getCourseContent = async (courseId) => {
  const response = await api.get(`/courses/${courseId}/content`, { headers: authHeader() });
  return response.data;
};

export const createCourseModule = async (courseId, payload) => {
  const response = await api.post(`/courses/${courseId}/modules`, payload, { headers: authHeader() });
  return response.data;
};

export const updateCourseModule = async (courseId, moduleId, payload) => {
  const response = await api.put(`/courses/${courseId}/modules/${moduleId}`, payload, { headers: authHeader() });
  return response.data;
};

export const deleteCourseModule = async (courseId, moduleId) => {
  const response = await api.delete(`/courses/${courseId}/modules/${moduleId}`, { headers: authHeader() });
  return response.data;
};

export const createCourseLesson = async (courseId, moduleId, payload) => {
  const response = await api.post(`/courses/${courseId}/modules/${moduleId}/lessons`, payload, { headers: authHeader() });
  return response.data;
};

export const updateCourseLesson = async (courseId, moduleId, lessonId, payload) => {
  const response = await api.put(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, payload, { headers: authHeader() });
  return response.data;
};

export const deleteCourseLesson = async (courseId, moduleId, lessonId) => {
  const response = await api.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, { headers: authHeader() });
  return response.data;
};
