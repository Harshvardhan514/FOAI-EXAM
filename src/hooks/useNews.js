import { useState, useCallback, useEffect } from "react";

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export const CATEGORIES = ["technology", "science", "health", "business", "general"];

const CATEGORY_EMOJIS = {
  technology: "💻", science: "🔬", health: "🏥", business: "💼", general: "🌍"
};
export { CATEGORY_EMOJIS };

function getCacheKey(cat) { return `news_v2_${cat}`; }

function getCached(cat) {
  try {
    const raw = localStorage.getItem(getCacheKey(cat));
    if (!raw) return null;
    const { articles, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return articles;
    return null;
  } catch { return null; }
}

function setCache(cat, articles) {
  try {
    localStorage.setItem(getCacheKey(cat), JSON.stringify({ articles, ts: Date.now() }));
  } catch {}
}

// Normalize article shape from GNews API
function normalizeArticle(art) {
  return {
    title: art.title,
    description: art.description || "",
    url: art.url,
    urlToImage: art.image,
    publishedAt: art.publishedAt,
    source: { name: art.source?.name || "Unknown" },
  };
}

async function fetchCategoryArticles(category) {
  const cached = getCached(category);
  if (cached) return cached;

  const key = NEWS_API_KEY;
  if (!key) throw new Error("No API key — add VITE_NEWS_API_KEY to .env");

  // GNews API — top headlines by category
  const params = new URLSearchParams({
    apikey: key,
    category,
    lang: "en",
    max: 10,
  });

  const res = await fetch(`https://gnews.io/api/v4/top-headlines?${params}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();

  const raw = data.articles || [];
  const articles = raw.map(normalizeArticle).filter(a => a.title);
  setCache(category, articles);
  return articles;
}

export default function useNews() {
  const [articlesByCategory, setArticlesByCategory] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [activeCategory, setActiveCategory] = useState("technology");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterCategory, setFilterCategory] = useState(null); // from pie chart click

  const fetchForCategory = useCallback(async (category, force = false) => {
    if (force) localStorage.removeItem(getCacheKey(category));

    setLoading(prev => ({ ...prev, [category]: true }));
    setErrors(prev => ({ ...prev, [category]: null }));
    try {
      const articles = await fetchCategoryArticles(category);
      setArticlesByCategory(prev => ({ ...prev, [category]: articles }));
    } catch (err) {
      setErrors(prev => ({ ...prev, [category]: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, [category]: false }));
    }
  }, []);

  // Initial load — fetch all categories with stagger to avoid rate limits
  useEffect(() => {
    CATEGORIES.forEach((cat, i) => {
      setTimeout(() => fetchForCategory(cat), i * 1200);
    });
  }, [fetchForCategory]);

  const getFilteredArticles = useCallback((category) => {
    const articles = articlesByCategory[category] || [];
    let filtered = [...articles];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.source?.name?.toLowerCase().includes(q)
      );
    }

    if (sortBy === "date") {
      filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    } else if (sortBy === "source") {
      filtered.sort((a, b) => (a.source?.name || "").localeCompare(b.source?.name || ""));
    }

    return filtered;
  }, [articlesByCategory, searchQuery, sortBy]);

  const categoryStats = CATEGORIES.map(cat => ({
    category: cat,
    count: (articlesByCategory[cat] || []).length,
  }));

  const allArticles = CATEGORIES.flatMap(cat => articlesByCategory[cat] || []);

  return {
    articlesByCategory, allArticles, categoryStats,
    categories: CATEGORIES,
    activeCategory, setActiveCategory,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    filterCategory, setFilterCategory,
    loading, errors,
    fetchForCategory,
    getFilteredArticles,
  };
}
