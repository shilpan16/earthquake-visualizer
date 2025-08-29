
## 📄 README.md

````markdown
# 🌎 Earthquake Visualizer

A React + Vite + Leaflet application that visualizes recent earthquakes worldwide using **USGS real-time feeds**.  
Built as part of the **Aganitha Web Developer Take-Home Challenge**.

---

## ✨ Features

- 🗺️ **Interactive Map** with zoom & pan  
- 🎯 **Markers** sized and colored by magnitude:
  - Green: Minor (< 2.5)  
  - Yellow: Light (2.5 – 4.4)  
  - Orange: Moderate (4.5 – 5.9)  
  - Red: Strong (6.0+)  
- 📊 **Stats bar** showing:
  - Total events  
  - Average magnitude  
  - Strongest quake (with location)  
- ⏳ **Filters**
  - Time window: Hour, Day, Week, Month  
  - Minimum magnitude slider  
- 🔍 **Marker Clustering** for readability  
- 📌 **Popups with details**:
  - Magnitude, location, depth  
  - Tsunami alert, felt reports  
  - Link to official **USGS event page**  
- 🖱️ **Reset View** button to fit results on the map  
- ⚡ **Loading & error states** with user-friendly messages  

---

## 🛠️ Tech Stack

- **React (Vite)**
- **Leaflet & react-leaflet**
- **react-leaflet-markercluster**
- **Tailwind CSS**
- **USGS Earthquake GeoJSON API**  

---

## 🚀 Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/<your-username>/earthquake-visualizer.git
cd earthquake-visualizer
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Your app will be available at:
👉 [http://localhost:5173](http://localhost:5173)

---

## 📂 Project Structure

```
earthquake-visualizer/
├─ public/                 # Static assets
├─ src/
│  ├─ assets/              # Icons, images (if any)
│  ├─ App.jsx              # Main app with map & logic
│  ├─ App.css              # Component-specific styling
│  ├─ index.css            # Tailwind styles
│  └─ main.jsx             # Entry point
├─ index.html              # HTML template
├─ package.json            # Dependencies & scripts
├─ tailwind.config.js      # Tailwind setup
├─ vite.config.js          # Vite config
└─ README.md               # Project documentation
```

---


## 🌐 Live Demo

- 🚀 Live App: https://fjldjv-5173.csb.app/  
- 💻 GitHub Repo: https://github.com/shilpan16/earthquake-visualizer  
- 🛠️ CodeSandbox Editor: https://codesandbox.io/p/github/shilpan16/earthquake-visualizer/main

---

## 📸 Screenshots

*(Add your own screenshots of the running app here for extra clarity in submission)*

---

## 📜 License

This project is licensed under the **MIT License**.
Data source: [USGS Earthquake GeoJSON Feeds](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php).
Map tiles © [OpenStreetMap](https://www.openstreetmap.org/) contributors.



