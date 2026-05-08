import { useContext } from "react";
import { ThemeContext } from "../context/index.js";

export default function Navbar() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">🛸</span>
        <span className="brand-name">OrbitDash</span>
      </div>
      <div className="navbar-links">
        <a href="#iss">ISS Tracker</a>
        <a href="#charts">Analytics</a>
        <a href="#news">News</a>
      </div>
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </nav>
  );
}
