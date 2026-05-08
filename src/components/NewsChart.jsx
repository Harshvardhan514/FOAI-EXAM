import { useContext, useEffect, useRef } from "react";
import { NewsContext } from "../context/index.js";

const COLORS = ["#00d4ff", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

export default function NewsChart() {
  const { categoryStats, setActiveCategory } = useContext(NewsContext);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!window.Chart || !canvasRef.current) return;
    const Chart = window.Chart;

    if (chartRef.current) chartRef.current.destroy();

    const labels = categoryStats.map(s => s.category.charAt(0).toUpperCase() + s.category.slice(1));
    const data = categoryStats.map(s => s.count);

    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: COLORS.map(c => c + "cc"),
            borderColor: COLORS,
            borderWidth: 2,
            hoverOffset: 12,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: "60%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "var(--text-secondary)",
              font: { family: "Syne", size: 11 },
              padding: 12,
            },
          },
          tooltip: {
            backgroundColor: "var(--bg-card)",
            titleColor: "var(--text-primary)",
            bodyColor: "var(--accent-cyan)",
            borderColor: "var(--border-color)",
            borderWidth: 1,
            callbacks: {
              label: ctx => ` ${ctx.parsed} articles`,
            },
          },
        },
        onClick: (_, elements) => {
          if (elements.length > 0) {
            const idx = elements[0].index;
            const cat = categoryStats[idx]?.category;
            if (cat) setActiveCategory(cat);
          }
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [categoryStats, setActiveCategory]);

  return (
    <div className="chart-card">
      <div className="chart-title">🍩 News by Category <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>(click to filter)</span></div>
      {categoryStats.every(s => s.count === 0) ? (
        <div className="chart-placeholder">
          <div className="spinner" style={{ margin: "0 auto" }} />
        </div>
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  );
}
