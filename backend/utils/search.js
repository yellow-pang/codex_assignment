function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeNumericSearchValue(value) {
  return String(value || "").replace(/\s+/g, "");
}

function normalizeSearchText(value) {
  return String(value || "").trim();
}

function parseSearchNumber(value, fieldName) {
  const normalizedValue = normalizeNumericSearchValue(value);

  if (!normalizedValue) {
    return undefined;
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue)) {
    const error = new Error(`${fieldName} 검색 조건은 숫자로 입력해야 합니다.`);
    error.statusCode = 400;
    throw error;
  }

  return parsedValue;
}

function createCarSearchQuery(queryParams) {
  const keyword = normalizeSearchText(queryParams.keyword);
  const company = normalizeSearchText(queryParams.company).toUpperCase();
  const minPrice = parseSearchNumber(queryParams.minPrice, "가격");
  const maxPrice = parseSearchNumber(queryParams.maxPrice, "가격");
  const minYear = parseSearchNumber(queryParams.minYear, "연식");
  const maxYear = parseSearchNumber(queryParams.maxYear, "연식");
  const query = {};

  if (keyword) {
    query.name = { $regex: escapeRegExp(keyword), $options: "i" };
  }

  if (company) {
    query.company = company;
  }

  const priceQuery = {};
  if (minPrice !== undefined) {
    priceQuery.$gte = minPrice;
  }
  if (maxPrice !== undefined) {
    priceQuery.$lte = maxPrice;
  }
  if (Object.keys(priceQuery).length > 0) {
    query.price = priceQuery;
  }

  const yearQuery = {};
  if (minYear !== undefined) {
    yearQuery.$gte = minYear;
  }
  if (maxYear !== undefined) {
    yearQuery.$lte = maxYear;
  }
  if (Object.keys(yearQuery).length > 0) {
    query.year = yearQuery;
  }

  return query;
}

module.exports = {
  createCarSearchQuery,
};
