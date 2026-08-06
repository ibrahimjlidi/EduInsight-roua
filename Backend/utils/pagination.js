const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const buildPaginationResponse = (key, data, total, page, limit) => ({
  [key]: data,
  total,
  page,
  pages: Math.max(Math.ceil(total / limit), 1),
  limit,
});

module.exports = { getPagination, buildPaginationResponse };
