# react-map
-
1. ติดตั้ง maplibre-gl และ tailwindcss

initialize Tailwind CSS:

npm install maplibre-gl
npm install -D tailwindcss @tailwindcss/cli postcss autoprefixer
<!-- npm install tailwindcss  -->
npx tailwindcss init -p

touch src/tailwind.config.js

```
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}

```

touch src/postcss.config.js
```
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

```

2. สร้าง folder components
mkdir src/components

3. สร้าง ไฟล์ components.tsx ชื่อว่า MapView.tsx และ MapView.css
touch src/components/MapView.tsx
touch src/components/MapView.css


code ใน MapView.tsx
```
import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import './MapView.css';

const MapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json', // public demo tiles
      center: [0, 0],
      zoom: 2,
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  return <div className="map-container" ref={mapContainer} />;
};

export default MapView;
```



code ใน MapView.css
```
.map-container {
  width: 100%;
  height: 100vh;
}

```

4. add map router 

npm install react-router-dom


5. เปลี่ยน src/App.tsx เป็น code ดังนัี้

```
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MapView from './MapView';

const Home: React.FC = () => <h1>Welcome to the homepage</h1>;

function App() {
  return (
    <Router>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/map">Map</Link></li>
        </ul>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapView />} />
      </Routes>
    </Router>
  );
}

export default App;

```

