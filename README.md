# react-map
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

```
import { http } from "../http-common";


const loadGeojsonFile = async (file_path: any) => {
    return http.get(file_path);
};

const webservice = {
    loadGeojsonFile
};

export default webservice;
```

12. ประกาศตัวแปลรับค่า GISData และเตรียม Function สำหรับเรียกใช้งานข้อมูลใน folder geodata

```
    const [GISData, setGISData] = useState<any[]>([]);

    const loadGISDATA = async () => {
        const layers: any = [
            {
                id: 1, type: "geojson", name_en: "district", name: "เขต", path: "district.geojson", geojson: null, visible: true, icon: null, minzoom: 10,
                maxzoom: 15
            }
        ];
        const loadedLayers: any[] = [];

        for (const [index, layer] of layers.entries()) {

            try {
                let geojson = null;

                if (layer.type === "geojson") {
                    const res = await webservice.loadGeojsonFile(`/assets/geodata/${layer.path}`);
                    geojson = res.status === 200 ? res.data : null;
                }
                const fullLayer = { ...layer, geojson };
                loadedLayers.push(fullLayer);

            } catch (err) {
                console.error(`Failed to load ${layer.name_en}:`, err);
            }
        }

        return loadedLayers;
    };
```

13. สร้าง function addLayer 
```
    const addLayer = (layer: any, mapInstance: maplibregl.Map) => {
        if (!layer.geojson) return;

        const sourceId = `${layer.name_en}_${layer.id}_source`;
        const layerId = `${layer.name_en}_${layer.id}_layer`;

        mapInstance.addSource(sourceId, {
          type: "geojson",
          data: layer.geojson,
        });

        let layerConfig: any = {
            id: layerId,
            type: "fill",
            source: sourceId,
            minzoom: layer.minzoom ?? 0,
            maxzoom: layer.maxzoom ?? 22,
            paint: {
                "fill-color": "#ff0000",
                "fill-opacity": 0.5,
            },
            layout: {
                visibility: layer.visible ? "visible" : "none",
            },
        };

        if (layer.name_en === 'district') {
            layerConfig = {
                id: layerId,
                type: "line",
                source: sourceId,
                minzoom: layer.minzoom ?? 0,
                maxzoom: layer.maxzoom ?? 22,
                paint: { 'line-color': '#f391d6', 'line-width': 10 }
            };
        } 
        mapInstance.addLayer(layerConfig);

    };
```

14. เรียกใช้งาน function setGeoData , loadGISDATA และ addLayer
```
        map.current = mapInstance;

        mapInstance.on("load", () => {
            loadGISDATA().then((data) => {
                setGISData(data);
                data.forEach((layer) => addLayer(layer, mapInstance));
            });
        });
```

15. เพิ่มชั้นข้อมูล  Geojson 
```

            {
                id: 2, type: "geojson", name_en: "road", name: "เส้นถนน", path: "bma_road.geojson", geojson: null, visible: true, icon: null, minzoom: 15,
                maxzoom: 22
            },
            {
                id: 3, type: "geojson", name_en: "bike_way", name: "ทางจักรยาน", path: "bike_way.geojson", geojson: null, visible: true, icon: null, minzoom: 15,
                maxzoom: 22
            },
            {
                id: 4, type: "geojson", name_en: "bma_zone", name: "Zone", path: "bma_zone.geojson", geojson: null, visible: true, icon: null, minzoom: 10,
                maxzoom: 15
            },
            {
                id: 5, type: "geojson", name_en: "bma_school", name: "โรงเรียน", path: "bma_school.geojson", geojson: null, visible: true, icon: '/assets/images/school.png', minzoom: 10,
                maxzoom: 22
            },
            {
                id: 6, type: "geojson", name_en: "air_pollution", name: "สถานีตรวจวัดคุณภาพฯ", path: "air_pollution.geojson", geojson: null, visible: true, icon: '/assets/images/station.png', minzoom: 10,
                maxzoom: 22
            }

```

16 Custom Style Geojson Layer
layer road
```
      else if (layer.name_en === "road") {
            layerConfig = {
                id: layerId,
                type: "line",
                source: sourceId,
                minzoom: layer.minzoom ?? 0,
                maxzoom: layer.maxzoom ?? 22,
                paint: {
                    "line-color": "#ffe53d",
                    "line-width": 3,
                },
            };
        } else if (layer.name_en === "bike_way") {
            layerConfig = {
                id: layerId,
                type: "line",
                source: sourceId,
                minzoom: layer.minzoom ?? 0,
                maxzoom: layer.maxzoom ?? 22,
                paint: {
                    'line-color': '#ffa200',
                    'line-width': 5
                },
            };
        } else if (layer.name_en === 'bma_zone') {


            const features = layer.geojson.features;

            const property = 'z_code';

            const uniqueZoneIds: string[] = Array.from(
                new Set(
                    features
                        .map((f: any) => f.properties?.z_code as string)
                        .filter((z_code: string) => z_code !== undefined && z_code !== null)
                )
            );

            const colorMap: { [key: string]: string } = {};
            uniqueZoneIds.forEach((z_code, i) => {
                colorMap[z_code] = getColorByIndex(i);
            });

            const colorExpression: (string | any[])[] = ['match', ['get', property]];
            for (const [z_code, color] of Object.entries(colorMap)) {
                colorExpression.push(z_code, color);
            }
            colorExpression.push('#cccccc');
            layerConfig = {
                id: layerId,
                type: "fill",
                source: sourceId,
                minzoom: layer.minzoom ?? 0,
                maxzoom: layer.maxzoom ?? 22,
                paint: {
                    'fill-color': colorExpression,
                    'fill-opacity': 0.25,
                }
            };

        } else if (layer.name_en === 'bma_green_area') {
            layerConfig = {
                id: layerId,
                type: "fill",
                source: sourceId,
                minzoom: layer.minzoom ?? 0,
                maxzoom: layer.maxzoom ?? 22,
                paint: { 'fill-color': '#b3ff80', 'fill-opacity': 1 }
            };
        } else if (layer.name_en === "bma_cctv" || layer.name_en === "air_pollution" || layer.name_en === "bma_school") {
            const iconId = `${layer.name_en}_icon`;
            if (!mapInstance.hasImage(iconId)) {
                loadImagePopup({
                    layer: layer.name_en, iconPath: layer.icon, sourceId, iconId, layerId
                })
            } else {
                mapInstance.addLayer({
                    id: layerId,
                    type: "symbol",
                    source: sourceId,
                    minzoom: layer.minzoom ?? 0,
                    maxzoom: layer.maxzoom ?? 22,
                    layout: {
                        "icon-image": iconId,
                        "icon-size": 0.5,
                    },
                });
            }
            return;
        }
```



