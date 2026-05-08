import { useContext, useEffect, useRef } from "react";
import { ISSContext } from "../context/index.js";
import { ToastContext } from "../context/index.js";

export default function ISSTracker() {
  const { position, history, speed, locationName, people, loading, error, refresh } =
    useContext(ISSContext);
  const { addToast } = useContext(ToastContext);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const pathRef = useRef(null);

  // Init Leaflet once
  useEffect(() => {
    if (!window.L || !mapRef.current || mapInstanceRef.current) return;
    const L = window.L;

    mapInstanceRef.current = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 1,
      worldCopyJump: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "© OpenStreetMap, © CARTO",
        maxZoom: 18,
      }
    ).addTo(mapInstanceRef.current);

    const issIcon = L.divIcon({
      html: `<div style="font-size:30px;filter:drop-shadow(0 0 8px #00d4ff);animation:spin 4s linear infinite">🛸</div>`,
      className: "",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    // Add spin keyframe once
    if (!document.getElementById("iss-spin-style")) {
      const style = document.createElement("style");
      style.id = "iss-spin-style";
      style.textContent = `@keyframes spin{to{transform:rotate(360deg)}}`;
      document.head.appendChild(style);
    }

    markerRef.current = L.marker([0, 0], { icon: issIcon }).addTo(mapInstanceRef.current);
    pathRef.current = L.polyline([], {
      color: "#00d4ff",
      weight: 2,
      opacity: 0.75,
      dashArray: "6 4",
    }).addTo(mapInstanceRef.current);
  }, []);

  // Update map on new position
  useEffect(() => {
    if (!mapInstanceRef.current || !position) return;
    const { lat, lon } = position;
    markerRef.current?.setLatLng([lat, lon]);
    markerRef.current?.bindPopup(
      `<b>ISS</b><br>Lat: ${lat.toFixed(4)}°<br>Lon: ${lon.toFixed(4)}°<br>Over: ${locationName}<br>Speed: ${speed?.toLocaleString() ?? "—"} km/h`
    );
    const latlngs = history.map(p => [p.lat, p.lon]);
    pathRef.current?.setLatLngs(latlngs);
  }, [position, history, speed, locationName]);

  const handleRefresh = async () => {
    await refresh();
    addToast("ISS position refreshed!", "success");
  };

  if (error && !position) {
    return (
      <div>
        <div className="error-card">
          <span>⚠️ {error}</span>
          <button className="btn btn-primary btn-sm" onClick={handleRefresh}>Retry</button>
        </div>
        <div className="map-container" style={{ marginTop: "1.5rem" }}>
          <div ref={mapRef} style={{ height: 420, width: "100%" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="iss-tracker">
      {loading && !position ? (
        <div className="iss-stats-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="stat-card">
              <div className="skeleton skeleton-line short" style={{ marginBottom: 8, height: 10 }} />
              <div className="skeleton skeleton-line" style={{ height: 20 }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="iss-stats-grid">
            <div className="stat-card">
              <div className="stat-label">Latitude</div>
              <div className="stat-value">{position ? `${position.lat.toFixed(4)}°` : "—"}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Longitude</div>
              <div className="stat-value">{position ? `${position.lon.toFixed(4)}°` : "—"}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Speed</div>
              <div className="stat-value speed">
                {speed != null ? `${speed.toLocaleString()} km/h` : "Calculating..."}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Over</div>
              <div className="stat-value location">{locationName}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Positions Tracked</div>
              <div className="stat-value">{history.length} / 15</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">People in Space</div>
              <div className="stat-value">{people.number}</div>
            </div>
          </div>

          {people.people.length > 0 && (
            <div className="astronauts-section">
              <h3>👨‍🚀 Current Crew ({people.number})</h3>
              <div className="astronaut-list">
                {people.people.map((p, i) => (
                  <div key={i} className="astronaut-chip">
                    🧑‍🚀 {p.name}
                    {p.craft && <small>({p.craft})</small>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="btn btn-primary refresh-btn" onClick={handleRefresh}>
            🔄 Refresh Position
          </button>
        </>
      )}

      <div className="map-container" style={{ marginTop: "1.5rem" }}>
        <div ref={mapRef} style={{ height: 420, width: "100%" }} />
      </div>
    </div>
  );
}
