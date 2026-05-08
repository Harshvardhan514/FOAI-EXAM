import { useContext } from "react";
import { NewsContext } from "../context/index.js";
import { ToastContext } from "../context/index.js";
import { CATEGORY_EMOJIS } from "../hooks/useNews.js";

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line medium" />
        <div className="skeleton skeleton-line" />
      </div>
    </div>
  );
}

function ArticleCard({ article }) {
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Unknown date";

  return (
    <div className="article-card">
      {article.urlToImage ? (
        <img
          className="article-img"
          src={article.urlToImage}
          alt={article.title}
          onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
        />
      ) : null}
      <div
        className="article-img-placeholder"
        style={{ display: article.urlToImage ? "none" : "flex" }}
      >
        📰
      </div>
      <div className="article-body">
        <div className="article-meta">
          <span className="article-source">{article.source?.name || "Unknown"}</span>
          <span className="article-date">{date}</span>
        </div>
        <div className="article-title">{article.title}</div>
        {article.author && <div className="article-author">By {article.author}</div>}
        <div className="article-desc">
          {article.description || "No description available."}
        </div>
        <div className="article-footer">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            Read More →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function NewsDashboard() {
  const {
    categories, activeCategory, setActiveCategory,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    loading, errors,
    fetchForCategory, getFilteredArticles,
  } = useContext(NewsContext);
  const { addToast } = useContext(ToastContext);

  const articles = getFilteredArticles(activeCategory);
  const isLoading = loading[activeCategory];
  const err = errors[activeCategory];

  const handleRefresh = () => {
    fetchForCategory(activeCategory, true);
    addToast(`Refreshing ${activeCategory} news...`, "info");
  };

  return (
    <div>
      {/* Controls */}
      <div className="news-controls" style={{ marginBottom: "1rem" }}>
        <div className="search-bar">
          🔍
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>
        <select
          className="sort-select"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="date">Sort by Date</option>
          <option value="source">Sort by Source</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? <span className="spinner" /> : "🔄"} Refresh
        </button>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs" style={{ marginBottom: "1.5rem" }}>
        {categories.map(cat => (
          <button
            key={cat}
            className={`cat-tab${activeCategory === cat ? " active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {CATEGORY_EMOJIS[cat]} {cat}
          </button>
        ))}
      </div>

      {/* Error */}
      {err && (
        <div className="error-card" style={{ marginBottom: "1rem" }}>
          <span>⚠️ {err}</span>
          <button className="btn btn-primary btn-sm" onClick={handleRefresh}>Retry</button>
        </div>
      )}

      {/* Articles Grid */}
      {isLoading ? (
        <div className="articles-grid">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          {searchQuery ? `No articles found for "${searchQuery}"` : "No articles available yet."}
        </div>
      ) : (
        <div className="articles-grid">
          {articles.map((a, i) => <ArticleCard key={i} article={a} />)}
        </div>
      )}
    </div>
  );
}
