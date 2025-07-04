# react-map
-
1. ติดตั้ง Maplibre ใน React
```
npm install maplibre-gl @types/maplibre-gl
```

2. สร้าง folder components
```
mkdir src/components
```

3. สร้าง ไฟล์ MapView.tsx และ MapView.css
```
touch src/components/MapView.tsx
touch src/components/MapView.css
```

4. สร้าง Map ใน MapView.tsx ด้วย code
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


4. แต่ง style map ใน MapView.css ด้วย code
```
.map-container {
  width: 100%;
  height: 100vh;
}

```

5. เพิ่ม Basemap ใน MapView.tsx
```
const baseMapStyles = [
    {
        name: "Google Hybrid",
        style: "./basemap/ghyb.json"
    },
    {
        name: "OpenStreetMap",
        style: "./basemap/osm.json"
    },
    {
        name: "ESRI WorldImagery",
        style: "./basemap/esri.json"
    },
     {
        name: "Carto Light",
        style: "./basemap/cartoLight.json"
    },
     {
        name:  "Carto Dark",
        style: "./basemap/cartoDark.json"
    },
];
```

6. เรียกใช้งาน Basemap 
```
useEffect(() => {
  const mapInstance = new maplibregl.Map({
    container: mapContainer.current!,
    style: baseMapStyles[0].style,
    center: [100.577982, 13.845845],
    zoom: 10,
  });

  return () => mapInstance.remove();
}, []);
```

7. เพิ่ม App router ใน React
```
npm install react-router-dom
```

8. เรียกใช้งาน Router ใน และเปลี่ยน src/App.tsx เป็น code ดังนัี้

```
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MapView from './MapView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/map" element={<MapView />} />
        <Route path="*" element={<Navigate to="/map" />} />
      </Routes>
    </Router>
  );

}
export default App;

```

9. ติดตั้ง libary สำหรับ เรียกใช้งานข้อมูล
```
npm i axios
```

10. สร้างไฟล์ http-common.ts
```
touch http-common.ts
```
code ใน http-common.ts
```
import axios from "axios";
const api_path = "";

const http = axios.create({
    baseURL: api_path,
    headers: {
        "Content-type": "application/json"
    }
});

export { http };

```

11. สร้าง service สำหรับดังข้อมูลภายใน webapp

เริ่มจากสร้าง folder service ด้วยคำสั่ง

```
mkdir src/services
```

จากนั้นสร้างไฟล์ webservice.service.ts ด้วยคำสั่ง

```
touch src/services/webservice.service.ts 
```

code ใน webservice.service.ts


import { http } from "../http-common";


const loadGeojsonFile = async (file_path: any) => {
    return http.get(file_path);
};

const webservice = {
    loadGeojsonFile
};

export default webservice;
