import api from "./axiosInstance";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getCourseLearning = async (courseId) => {
  const res = await api.get(`/courses/${courseId}/learning`, { headers: authHeader() });
  return res.data;
};

export const completeCourseLesson = async (courseId, lessonId) => {
  const res = await api.post(
    `/courses/${courseId}/lessons/${lessonId}/progress`,
    {},
    { headers: authHeader() }
  );
  return res.data;
};

export const askCourseTutor = async (courseId, message, history) => {
  const res = await api.post(
    `/courses/${courseId}/tutor`,
    { message, history },
    { headers: authHeader() }
  );
  return res.data;
};
