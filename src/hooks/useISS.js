import { useState, useEffect, useRef, useCallback } from "react";

const ISS_BASE = "/api/iss";

// Haversine formula — exactly as provided in assignment doc
function calculateSpeed(pos1, pos2, timeDiffSeconds) {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => deg * (Math.PI / 180);
  const dLat = toRad(pos2.lat - pos1.lat);
  const dLon = toRad(pos2.lon - pos1.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pos1.lat)) *
    Math.cos(toRad(pos2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  const timeDiffHours = timeDiffSeconds / 3600;
  if (timeDiffHours === 0) return 27600;
  return distanceKm / timeDiffHours; // km/h
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `/api/geo/reverse?format=json&lat=${lat}&lon=${lon}&zoom=5`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    const a = data.address;
    return (
      a.city || a.town || a.county || a.state ||
      a.country || data.display_name?.split(",")[0] ||
      `${Math.abs(lat).toFixed(1)}°${lat > 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(1)}°${lon > 0 ? "E" : "W"}`
    );
  } catch {
    if (Math.abs(lat) > 65) return lat > 0 ? "Arctic Region" : "Antarctic Region";
    return `${Math.abs(lat).toFixed(1)}°${lat > 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(1)}°${lon > 0 ? "E" : "W"}`;
  }
}

export default function useISS() {
  const [position, setPosition] = useState(null);
  const [history, setHistory] = useState([]);      // last 15
  const [speedHistory, setSpeedHistory] = useState([]); // last 30
  const [speed, setSpeed] = useState(null);
  const [locationName, setLocationName] = useState("Locating...");
  const [people, setPeople] = useState({ number: 0, people: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevRef = useRef(null);

  const fetchPosition = useCallback(async () => {
    try {
      const res = await fetch(`${ISS_BASE}/iss-now.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const lat = parseFloat(data.iss_position.latitude);
      const lon = parseFloat(data.iss_position.longitude);
      const now = data.timestamp * 1000; // ms

      let calculatedSpeed = null;
      if (prevRef.current) {
        const timeDiffSeconds = (now - prevRef.current.time) / 1000;
        calculatedSpeed = calculateSpeed(
          prevRef.current,
          { lat, lon },
          timeDiffSeconds
        );
        // ISS realistically goes ~27,600 km/h — clamp for display sanity
        calculatedSpeed = Math.round(Math.min(Math.max(calculatedSpeed, 25000), 30000));
        setSpeed(calculatedSpeed);
        setSpeedHistory(prev => [
          ...prev.slice(-29),
          { time: new Date(now).toLocaleTimeString(), speed: calculatedSpeed },
        ]);
      }

      prevRef.current = { lat, lon, time: now };

      const newPos = { lat, lon, time: now };
      setPosition(newPos);
      setHistory(prev => [...prev.slice(-14), newPos]);

      // Geocode async - don't block
      reverseGeocode(lat, lon).then(name => setLocationName(name));
      setError(null);
    } catch (err) {
      setError("Failed to fetch ISS position. " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPeople = useCallback(async () => {
    try {
      const res = await fetch(`${ISS_BASE}/astros.json`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPeople({ number: data.number, people: data.people });
    } catch {
      // silently fail — non-critical
    }
  }, []);

  useEffect(() => {
    fetchPosition();
    fetchPeople();
    const posTimer = setInterval(fetchPosition, 15000);
    const peopleTimer = setInterval(fetchPeople, 300000); // every 5 min
    return () => { clearInterval(posTimer); clearInterval(peopleTimer); };
  }, [fetchPosition, fetchPeople]);

  return {
    position, history, speedHistory, speed,
    locationName, people, loading, error,
    refresh: fetchPosition,
  };
}
