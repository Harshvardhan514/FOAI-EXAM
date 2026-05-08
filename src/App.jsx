import { useState, useEffect } from "react";
import { ThemeContext, ISSContext, NewsContext, ToastContext } from "./context/index.js";
import useISS from "./hooks/useISS.js";
import useNews from "./hooks/useNews.js";
import useToast from "./hooks/useToast.js";
import Navbar from "./components/Navbar.jsx";
import ISSTracker from "./components/ISSTracker.jsx";
import SpeedChart from "./components/SpeedChart.jsx";
import NewsChart from "./components/NewsChart.jsx";
import NewsDashboard from "./components/NewsDashboard.jsx";
import Chatbot from "./components/Chatbot.jsx";
import Toast from "./components/Toast.jsx";
import "./index.css";

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const issData = useISS();
  const newsData = useNews();
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ISSContext.Provider value={issData}>
        <NewsContext.Provider value={newsData}>
          <ToastContext.Provider value={{ addToast }}>
            <div className="app">
              <Navbar />
              <main className="main-content">

                {/* PART 1 — ISS */}
                <section className="section" id="iss">
                  <h2 className="section-title">
                    <span className="live-dot" />
                    ISS Live Tracker
                  </h2>
                  <ISSTracker />
                </section>

                {/* PART 4 — Charts */}
                <section className="section" id="charts">
                  <h2 className="section-title">📊 Analytics</h2>
                  <div className="charts-grid">
                    <SpeedChart />
                    <NewsChart />
                  </div>
                </section>

                {/* PART 2 — News */}
                <section className="section" id="news">
                  <h2 className="section-title">📰 News Dashboard</h2>
                  <NewsDashboard />
                </section>

              </main>

              {/* PART 3 — Chatbot */}
              <Chatbot />

              {/* PART 5 — Toasts */}
              <div className="toast-container">
                {toasts.map(t => (
                  <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
                ))}
              </div>
            </div>
          </ToastContext.Provider>
        </NewsContext.Provider>
      </ISSContext.Provider>
    </ThemeContext.Provider>
  );
}
