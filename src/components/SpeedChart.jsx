import { useContext, useEffect, useRef } from "react";
import { ISSContext } from "../context/index.js";

export default function SpeedChart() {
  const { speedHistory } = useContext(ISSContext);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!window.Chart || !canvasRef.current || speedHistory.length === 0) return;
    const Chart = window.Chart;

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: speedHistory.map(s => s.time),
        datasets: [
          {
            label: "ISS Speed (km/h)",
            data: speedHistory.map(s => s.speed),
            borderColor: "#00d4ff",
            backgroundColor: "rgba(0,212,255,0.08)",
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: "#00d4ff",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: { color: "var(--text-secondary)", font: { family: "Syne" } },
          },
          tooltip: {
            backgroundColor: "var(--bg-card)",
            titleColor: "var(--text-primary)",
            bodyColor: "var(--accent-cyan)",
            borderColor: "var(--border-color)",
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: { color: "var(--text-muted)", maxTicksLimit: 6, font: { size: 10 } },
            grid: { color: "rgba(42,58,92,0.5)" },
          },
          y: {
            ticks: { color: "var(--text-muted)", font: { size: 10 }, callback: v => v.toLocaleString() },
            grid: { color: "rgba(42,58,92,0.5)" },
            suggestedMin: 25000,
            suggestedMax: 30000,
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [speedHistory]);

  return (
    <div className="chart-card">
      <div className="chart-title">📈 ISS Speed Over Time</div>
      {speedHistory.length === 0 ? (
        <div className="chart-placeholder">
          <div style={{ textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 0.5rem" }} />
            <div>Collecting speed data (updates every 15s)...</div>
          </div>
        </div>
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  );
}
