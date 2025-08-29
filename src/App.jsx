import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
// import "react-leaflet-markercluster/dist/styles.min.css"; // REMOVE or COMMENT OUT

import MarkerClusterGroup from "react-leaflet-markercluster";




// ----- Helpers -----
const FEEDS = {
  hour: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson",
  day: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
  week: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
  month: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson",
};

function getColor(mag) {
  if (mag == null || isNaN(mag)) return "#9CA3AF";
  if (mag < 2.5) return "#22c55e";
  if (mag < 4.5) return "#eab308";
  if (mag < 6) return "#f97316";
  return "#ef4444";
}

function magToSize(mag) {
  if (mag == null || isNaN(mag)) return 18;
  return Math.max(14, Math.min(42, 12 + mag * 4));
}

const iconCache = {};
function makeIcon(mag) {
  const key = Math.round((mag ?? 0) * 2);
  if (iconCache[key]) return iconCache[key];

  const size = magToSize(mag);
  const color = getColor(mag);

  const icon = L.divIcon({
    className: "quake-icon",
    html: `<div class="quake-marker"
                 style="
                   width:${size}px;
                   height:${size}px;
                   background: radial-gradient(circle at 40% 40%, #ffffff, ${color});
                   border: 2px solid rgba(0,0,0,0.25);
                 ">
            ${mag?.toFixed?.(1) ?? "?"}
          </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });

  iconCache[key] = icon;
  return icon;
}

// ----- Data Hook -----
function useEarthquakes({ windowKey, minMag }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(FEEDS[windowKey], { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const features = Array.isArray(json?.features) ? json.features : [];
        const cleaned = features
          .map((f) => {
            const [lon, lat, depth] = f.geometry?.coordinates ?? [null, null, null];
            const p = f.properties || {};
            return {
              id: f.id,
              lat,
              lon,
              depth,
              mag: p.mag,
              place: p.place,
              time: p.time,
              url: p.url,
              tsunami: p.tsunami,
              felt: p.felt,
              alert: p.alert,
            };
          })
          .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lon) && (d.mag == null || !isNaN(d.mag)));
        setData(cleaned);
        setUpdatedAt(Date.now());
      } catch (e) {
        if (active && e.name !== "AbortError") setError(e.message || String(e));
      } finally {
        if (active) setLoading(false);
      }
    }

    run();
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [windowKey]);

  const filtered = useMemo(
    () => data.filter((d) => (minMag ? (d.mag ?? -Infinity) >= minMag : true)),
    [data, minMag]
  );

  const stats = useMemo(() => {
    if (!filtered.length) return { count: 0, avgMag: 0, max: null };
    const mags = filtered.map((d) => d.mag ?? 0);
    const count = filtered.length;
    const avgMag = mags.reduce((a, b) => a + b, 0) / count;
    const max = filtered.reduce((m, d) => (m && m.mag > d.mag ? m : d), null);
    return { count, avgMag, max };
  }, [filtered]);

  return { data: filtered, loading, error, updatedAt, stats };
}

// ----- Map Helpers -----
function FitBounds({ bounds, resetTrigger }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 6, animate: true });
    } else {
      map.setView([20, 0], 2);
    }
  }, [bounds, map, resetTrigger]);
  return null;
}

function calculateBounds(points) {
  if (!points.length) return null;
  let minLat = 90,
    maxLat = -90,
    minLon = 180,
    maxLon = -180;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lon < minLon) minLon = p.lon;
    if (p.lon > maxLon) maxLon = p.lon;
  }
  return [
    [minLat, minLon],
    [maxLat, maxLon],
  ];
}

// ----- UI Components -----
function Header({ windowKey, setWindowKey, minMag, setMinMag, onResetBounds, updatedAt }) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-semibold">My Custom Earthquake Map</h1>
            <p className="text-xs text-gray-500">USGS real-time feeds • React + Leaflet</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Window</label>
            <select
              value={windowKey}
              onChange={(e) => setWindowKey(e.target.value)}
              className="rounded-md border px-2 py-1 text-sm"
            >
              <option value="hour">Past Hour</option>
              <option value="day">Past Day</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Min Magnitude</label>
            <input
              type="range"
              min="0"
              max="7"
              step="0.5"
              value={minMag}
              onChange={(e) => setMinMag(parseFloat(e.target.value))}
              className="w-40"
            />
            <span className="text-sm w-10 text-center">{minMag.toFixed(1)}</span>
          </div>
          <button
            onClick={onResetBounds}
            className="btn-blue px-3 py-1 rounded-md text-sm ml-2"
            aria-label="Reset map view to fit all earthquakes"
          >
            Reset View
          </button>
        </div>
        {updatedAt && (
          <div className="text-xs text-gray-500 mt-2 md:mt-0">
            Updated: {new Date(updatedAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </header>
  );
}

function StatsBar({ stats }) {
  return (
    <div className="stats-bar flex flex-wrap justify-between gap-4 mb-4">
      <div className="flex-1 min-w-[120px] p-4 rounded-xl bg-gray-50 shadow hover:shadow-lg transition transform hover:-translate-y-1 text-center">
        <span className="block text-sm text-gray-500 mb-1">Events</span>
        <strong className="block text-xl font-semibold text-gray-900">{stats.count}</strong>
      </div>

      <div className="flex-1 min-w-[120px] p-4 rounded-xl bg-gray-50 shadow hover:shadow-lg transition transform hover:-translate-y-1 text-center">
        <span className="block text-sm text-gray-500 mb-1">Average Magnitude</span>
        <strong className="block text-xl font-semibold text-gray-900">{stats.avgMag.toFixed(2)}</strong>
      </div>

      <div className="flex-1 min-w-[120px] p-4 rounded-xl bg-gray-50 shadow hover:shadow-lg transition transform hover:-translate-y-1 text-center truncate">
        <span className="block text-sm text-gray-500 mb-1">Strongest</span>
        <strong className="block text-xl font-semibold text-gray-900">
          {stats.max ? `M${stats.max.mag?.toFixed(1)} – ${stats.max.place}` : "—"}
        </strong>
      </div>
    </div>
  );
}


function CustomZoomControl() {
  const map = useMap();
  useEffect(() => {
    const zoom = L.control.zoom({ position: "topright" });
    zoom.addTo(map);
    return () => map.removeControl(zoom);
  }, [map]);
  return null;
}

// Define outside MapSection
function MagnitudeLegend() {
  const items = [
    { color: "#22c55e", label: "< 2.5", desc: "Minor" },
    { color: "#eab308", label: "2.5 – 4.4", desc: "Light" },
    { color: "#f97316", label: "4.5 – 5.9", desc: "Moderate" },
    { color: "#ef4444", label: "6.0+", desc: "Strong" },
  ];

  return (
    <div
      className="absolute bottom-6 left-6 z-[1000] w-max bg-white shadow-lg rounded-xl p-4 border border-gray-200"
      style={{ backdropFilter: "blur(8px)" }}
    >
      <div className="font-semibold text-gray-800 mb-3 text-sm md:text-base">
        Magnitude
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span
              className="h-5 w-5 rounded-full border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-700 font-medium text-sm">
              {item.label} <span className="text-gray-500">({item.desc})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapSection({ points, bounds, resetTrigger, loading }) {
  const defaultCenter = [20, 0];
  const defaultZoom = 2;

  return (
    <div className="relative h-[72vh] w-full">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {bounds && <FitBounds bounds={bounds} resetTrigger={resetTrigger} />}

        <MarkerClusterGroup>
          {points.map((d) => (
            <Marker key={d.id} position={[d.lat, d.lon]} icon={makeIcon(d.mag)}>
              <Popup>
                <div>
                  <strong>M{d.mag || "—"}</strong> – {d.place || "Unknown location"}
                  <br />
                  <b>Time</b>:{" "}
                  {d.time ? new Date(d.time).toLocaleString() : "—"}
                  <br />
                  <b>Depth</b>:{" "}
                  {d.depth !== undefined ? `${d.depth} km` : "—"}
                  <br />
                  <b>Tsunami</b>: {d.tsunami === 1 ? "Yes" : "No"}
                  <br />
                  <b>Felt</b>: {d.felt ? d.felt : "—"}
                  <br />
                  {d.url && (
                    <a href={d.url} target="_blank" rel="noreferrer">
                      View details on USGS ↗
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        <CustomZoomControl />
        <MagnitudeLegend />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
            <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          </div>
        )}
      </MapContainer>
    </div>
  );
}




// ----- Main App -----
export default function App() {
  const [windowKey, setWindowKey] = useState("day");
  const [minMag, setMinMag] = useState(0);
  const { data, loading, error, updatedAt, stats } = useEarthquakes({ windowKey, minMag });
  const bounds = useMemo(() => calculateBounds(data), [data]);
  const [resetTrigger, setResetTrigger] = useState(0);
  const onResetBounds = () => setResetTrigger((prev) => prev + 1);

  useEffect(() => {
    document.title = "My Custom Earthquake Map";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900 flex flex-col">
      <Header
        windowKey={windowKey}
        setWindowKey={setWindowKey}
        minMag={minMag}
        setMinMag={setMinMag}
        onResetBounds={onResetBounds}
        updatedAt={updatedAt}
      />
      <StatsBar stats={stats} />
      <main className="flex-1 mx-auto max-w-7xl px-4 py-6 flex flex-col gap-4">
        {loading && (
          <div className="mb-3 animate-pulse rounded-xl border p-4 text-sm bg-white">
            Loading recent earthquakes…
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-xl border p-4 text-sm bg-red-50 text-red-700">
            Failed to load data: {error}. Please check your network and try again.
          </div>
        )}
        {!loading && !error && data.length === 0 && (
          <div className="mb-3 rounded-xl border p-4 text-sm bg-yellow-50 text-yellow-800">
            No earthquakes match the current filters.
          </div>
        )}
        <MapSection points={data} bounds={bounds} resetTrigger={resetTrigger} loading={loading} />
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <article className="rounded-xl border bg-white shadow p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
            <h2 className="text-lg font-semibold mb-2">About this app</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              This Earthquake Visualizer displays recent global seismic events from USGS real-time feeds. Use the
              controls to adjust the time window and filter by minimum magnitude. Markers are clustered to keep the map
              readable, and their color/size reflects magnitude.
            </p>
          </article>
          <article className="rounded-xl border bg-white shadow p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Usage tips</h2>
            <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1 leading-relaxed">
              <li>Zoom in to expand clusters and see individual events.</li>
              <li>Click a marker for details and a link to the official USGS page.</li>
              <li>Use “Reset View” to refit the world view to current results.</li>
            </ul>
          </article>
        </section>
        <footer className="mt-8 py-6 text-center text-xs text-gray-500 bg-white/70 backdrop-blur rounded-t-xl">
          Data source: <a className="underline" href="https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php" target="_blank" rel="noreferrer">USGS GeoJSON feeds</a>. Map tiles © OpenStreetMap contributors.
        </footer>
      </main>
    </div>
  );
}