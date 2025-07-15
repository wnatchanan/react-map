# react-map
1. ติดตั้ง Maplibre ใน React
```
npm install maplibre-gl @types/maplibre-gl
npm install  --save-dev papaparse @types/papaparse
npm install --save-dev shpjs @types/shpjs
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
    }, []);

    return (
        <div className="map-view-wrapper" style={{ display: "flex" }}>
            <div
                ref={mapContainer}
                style={{ width: "100%", height: "100vh" }}
            ></div>
        </div>
    )
};

export default MapView;
```


4. แต่ง style map ใน MapView.css ด้วย code
```
.map-container {
    width: 100%;
    height: 100vh;
    /* Or whatever height you need */
    z-index: 999;
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
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MapView from './components/MapView';
import MainPage from "./components/pages/MainPage";
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/map" element={<MapView />} />
        <Route path="*" element={<Navigate to="/home" />} />
        <Route path="/home" element={<MainPage />} />
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

        map.current?.on("load", () => {
            loadGISDATA().then((data) => {
                setGISData(data);
                data.forEach((layer) => addLayer(layer, mapInstance));
            });
        });

        return () => map.current?.remove();
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

16. ปรับแต่ง Style Geojson Layer
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
        }  
```

layer bike_way
```
else if (layer.name_en === "bike_way") {
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
 } 
```

เพิ่ม Function Custom Zone Color 
```
    const colorPalette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
    const getColorByIndex = (i: number) => {
        return colorPalette[i % colorPalette.length];
    }
```

layer bma_zone
```
else if (layer.name_en === 'bma_zone') {

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

        }
```

layer bma_school
```
else if (layer.name_en === "bma_school") {
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
เพิ่ม Function loadImagePopup
```

    const loadedImages = useRef<{ [key: string]: string }>({});

    const loadImagePopup = (data: any) => {
        map.current!.loadImage(data.iconPath)
            .then((img) => {
                const raw = img.data as HTMLImageElement | ImageBitmap;

                const targetSize = 48;

                const canvas = document.createElement("canvas");
                canvas.width = targetSize;
                canvas.height = targetSize;

                const ctx = canvas.getContext("2d")!;
                ctx.drawImage(raw, 0, 0, targetSize, targetSize);

                canvas.toBlob((blob) => {
                    if (!blob) return;

                    createImageBitmap(blob).then((resizedBitmap) => {
                        if (!map.current!.hasImage(data.iconId)) {
                            map.current!.addImage(data.iconId, resizedBitmap, { pixelRatio: 1 });
                            loadedImages.current[data.iconId] = data.iconPath;
                        }
                        addDataPopup(data);
                    });
                }, "image/png");
            })
            .catch((err) => {
                console.error("Failed to load image icon", err);
            });
    }
```

เพิ่ม Function addDataPopup
```
    const addDataPopup = (data: any) => {
        if (!map.current) return;

        map.current.addLayer({
            id: data.layerId,
            type: "symbol",
            source: data.sourceId,
            layout: {
                "icon-image": data.iconId,
                "icon-size": 0.5,
                "icon-allow-overlap": true,
            },

        });

        map.current.on("click", data.layerId, (eClick) => {
            const feature = eClick.features?.[0];
            if (!feature) return;

            const props = feature.properties;
            const lngLat = eClick.lngLat;

            const html = setContent(props, data.layer)

            new maplibregl.Popup()
                .setLngLat(lngLat)
                .setHTML(html)
                .addTo(map.current!);
        });

        map.current.on("mouseenter", data.layerId, () => {
            map.current!.getCanvas().style.cursor = "pointer";
        });
        map.current.on("mouseleave", data.layerId, () => {
            map.current!.getCanvas().style.cursor = "";
        });

    }
```

เพิ่ม popup content
```
    const setContent = (props: any, layer: any) => {
        var content = ""
        if (layer == "bma_school") {
            content = `
            <div style="font-size: 12px;">
                <b>ID:</b> ${props.id_sch}<br/>
                <b>NAME:</b> ${props.name}<br/>
                <b>Address:</b> ${props.address}<br/>
                <b>Code:</b> ${props.dcode}<br/>
                <b>Student Count:</b> ${props.num_stu}<br/>
            </div>
        `
        }
        return content
    }

```

เพิ่มเงื่อนไขเดียวกับ bma_school ใน add layer

```
|| layer.name_en === "air_pollution" 
```

เพิ่ม popup content ของ air_pollution
```
else if (layer == "air_pollution") {
            content = `
            <div style="font-size: 12px;">
                <b>ID:</b> ${props.id_air}<br/>
                <b>NAME:</b> ${props.dname}<br/>
                <b>Location:</b> ${props.location}<br/>
                <b>Code:</b> ${props.dcode}<br/>
            </div>
        `
        }
```

18. เรียกข้อมูลจาก CSV
เพิ่ม record ใน layers
```
{
    id: 7, type: "csv", name_en: "bma_cctv", name: "กล้อง cctv", path: "bma_cctv.csv", geojson: null, visible: true, icon: '/assets/images/cctv.png', minzoom: 10, maxzoom: 22
},
```
เพิ่ม function เรียกข้อมูลจาก CSV
```
else if (layer.type === "csv") {
                    const res = await webservice.loadCSVFile(`/assets/geodata/${layer.path}`);
                    if (res.length > 0) {
                        geojson = {
                            type: "FeatureCollection",
                            features: res.map((d: any) => ({
                                type: "Feature",
                                geometry: { type: "Point", coordinates: [+d.long, +d.lat] },
                                properties: d,
                            })),
                        };
                    }

                }
```
เพิ่ม layer styles ใน addlayerเงื่อนไขเดียวกับ bma_school และ air_pollution
```
layer.name_en === "bma_cctv"
```

เพิ่ม popup content ของ bma_cctv
```
if (layer == "bma_cctv") {
            content = `
            <div style="font-size: 12px;">
                <b>ID:</b> ${props.ID}<br/>
                <b>District:</b> ${props.District}<br/>
                <b>Location:</b> ${props.location}<br/>
                <b>Code DVR:</b> ${props["Code DVR"]}<br/>
                <b>ID Camera:</b> ${props[" ID Camera"]}<br/>
                <b>Project:</b> ${props.project}<br/>
                <b>Lat:</b> ${props.lat}<br/>
                <b>Long:</b> ${props.long}<br/>
            </div>
            `;

        } 
```
19. เรียกข้อมูลจาก ShapeFile (zip)
```
{
    id: 8, type: "shp", name_en: "bma_green_area", name: "พื้นที่สีเขียว", path: "bma_green_area.zip", geojson: null, visible: true, icon: null, minzoom: 15, maxzoom: 22
},
{
    id: 9, type: "shp", name_en: "bma_building", name: "อาคาร/ตึก", path: "bma_building.zip", geojson: null, visible: true, icon: null, minzoom: 15,
    maxzoom: 22
},
```
เพิ่ม function loadShapeFile
```
else if (layer.type === "shp") {
                    const res: any = await webservice.loadShapeFile(`/assets/geodata/${layer.path}`);
                    if (res.features?.length > 0) geojson = res;
                }
```
เพิ่ม layer style bma_green_area
```
else if (layer.name_en === 'bma_green_area') {
            layerConfig = {
                id: layerId,
                type: "fill",
                source: sourceId,
                minzoom: layer.minzoom ?? 0,
                maxzoom: layer.maxzoom ?? 22,
                paint: { 'fill-color': '#b3ff80', 'fill-opacity': 1 }
            };
        }
```

เพิ่ม layer style bma_building
```
else if (layer.name_en === 'bma_building') {
            const color = getColorByIndex(layer.id);
            const areaExpr: any[] = ['to-number', ['get', 'area_in_me'], 0];
            const heightExpr: any = [
                'case',
                ['<', areaExpr, 200], 6,
                ['<', areaExpr, 400], 8,
                20
            ];
            layerConfig = {
                id: layerId,
                type: 'fill-extrusion',
                source: sourceId,
                minzoom: layer.minzoom ?? 0,
                maxzoom: layer.maxzoom ?? 22,
                paint: {
                    'fill-extrusion-color': color,
                    'fill-extrusion-height': heightExpr,
                    'fill-extrusion-opacity': 0.9
                }
            };
            map.current?.on('click', layerId, (e) => {
                const feature = e.features?.[0];
                if (!feature) return;

                const props = feature.properties || {};

                new maplibregl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(setContent(props, layer.name_en))
                    .addTo(map.current!);
            });
        }
```

เพิ่ม popup content ของ bma_building

```
else if (layer == "bma_building") {
            content = `
            <div style="font-size: 12px;">
            <strong>Building Info</strong><br/>
                <b>ID:</b> ${props.id}<br/>
                <b>Area:</b> ${props.area_in_me}<br/>
                <b>Confidence:</b> ${props.confidence}<br/>
                <b>latitude:</b> ${props.latitude}<br/>
                <b>longitude:</b> ${props.longitude}<br/>
            </div>
        `
        }
```
19. เรียกข้อมูลจาก API (AQI)

```
{
    id: 10, type: "api", name_en: "air4thai", name: "รายงานสภาพอากาศ", path: "http://air4thai.com/forweb/getAQI_JSON.php", geojson: null, visible: true, icon: '/assets/images/air.png', minzoom: 15, maxzoom: 22
},
```

เพิ่ม function เรียกข้อมูลจาก API 
```
else if (layer.type === "api") {
                    const res: any = await webservice.loadAPI(layer.path);

                    if (res.data.stations.length > 0) {
                        geojson = {
                            type: "FeatureCollection",
                            features: res.data.stations.map((d: any) => ({
                                type: "Feature",
                                geometry: { type: "Point", coordinates: [+d.long, +d.lat] },
                                properties: d,
                            })),
                        };

                    }
                }
```

เพิ่มเงื่อนไข addSource ของ air4thai
```
        if (layer.name_en === "air4thai") {
            const filteredFeatures = layer.geojson.features.filter((f: any) => {
                let AQILast: any;
                try {
                    AQILast = typeof f.properties.AQILast === "string"
                        ? JSON.parse(f.properties.AQILast)
                        : f.properties.AQILast;
                } catch (e) {
                    console.error("Invalid AQILast JSON:", e);
                    return false;
                }

                if (!AQILast || !AQILast[airtype]) return false;

                const aqiVal = AQILast[airtype].aqi;
                return aqiVal !== "-1" && aqiVal !== "-999";
            });

            const filteredGeojson: any = {
                type: "FeatureCollection",
                features: filteredFeatures
            };

            mapInstance.addSource(sourceId, {
                type: "geojson",
                data: filteredGeojson,
            });
        } else {
            mapInstance.addSource(sourceId, {
                type: "geojson",
                data: layer.geojson,
            });

        }
```

เพิ่ม layer style air4thai
```
else if (layer.name_en === "air4thai") {
            // Add colored HTML markers
            addAir4ThaiMarkers(layer);
            return;
        }
```

เพิ่ม function addAir4ThaiMarkers
```
    const air4thaiMarkersRef = useRef<maplibregl.Marker[]>([]);

    const addAir4ThaiMarkers = (layer: any, type?: string) => {
        if (!map.current) return;

        air4thaiMarkersRef.current.forEach(marker => marker.remove());
        air4thaiMarkersRef.current = [];

        const features = layer.geojson.features;

        const atype = type ?? airtype

        features.forEach((f: any) => {
            const coords = f.geometry.coordinates;

            let AQILast: any;
            try {
                AQILast = typeof f.properties.AQILast === "string"
                    ? JSON.parse(f.properties.AQILast)
                    : f.properties.AQILast;
            } catch (e) {
                console.error("Invalid AQILast JSON:", e);
                return;
            }

            if (!AQILast || !AQILast[atype]) return;

            const pollutant = AQILast[atype];

            if (!pollutant || pollutant.aqi === "-1" || pollutant.aqi === "-999") return;

            const colorMap: any = {
                "0": "#808080", // gray
                "1": "#00bfff", // sky blue
                "2": "#32cd32", // lime green
                "3": "#ffa500", // orange
                "4": "#ff4500", // red-orange
                "5": "#800080", // purple
            };

            const color = colorMap[pollutant.color_id] || "#cccccc";

            // 🔵 Marker HTML
            const markerEl = document.createElement("div");
            markerEl.style.width = "36px";
            markerEl.style.height = "36px";
            markerEl.style.background = color;
            markerEl.style.borderRadius = "50%";
            markerEl.style.display = "flex";
            markerEl.style.alignItems = "center";
            markerEl.style.justifyContent = "center";
            markerEl.style.color = "#ffffff";
            markerEl.style.fontSize = "13px";
            markerEl.style.fontWeight = "bold";
            markerEl.style.border = "2px solid white";
            markerEl.style.boxShadow = "0 0 3px rgba(0,0,0,0.4)";
            markerEl.innerText = atype == "AQI" ? pollutant.aqi : pollutant.value;

            const marker = new maplibregl.Marker({ element: markerEl })
                .setLngLat(coords)
                .setPopup(
                    new maplibregl.Popup({ offset: 25 }).setHTML(setContent(f.properties, layer.name_en))
                )
                .addTo(map.current!);

            air4thaiMarkersRef.current.push(marker);
        });
    };
```

เพิ่ม popup content air4thai
```
 else if (layer == "air4thai") {
            let AQILast: any = props.AQILast
            content = `
              <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
                <strong style="font-size: 14px;">รายงานสภาพอากาศ</strong>
                <table style="border-collapse: collapse; margin-top: 8px;">
                  <tr>
                    <td style="padding: 4px 8px; font-weight: bold;">ID:</td>
                    <td style="padding: 4px 8px;">${props.stationID}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 8px; font-weight: bold;">Type:</td>
                    <td style="padding: 4px 8px;">${props.stationType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 8px; font-weight: bold;">Name:</td>
                    <td style="padding: 4px 8px;">${props.nameTH}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 8px; font-weight: bold;">Area:</td>
                    <td style="padding: 4px 8px;">${props.areaTH}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 8px; font-weight: bold;">Latitude:</td>
                    <td style="padding: 4px 8px;">${props.lat}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 8px; font-weight: bold;">Longitude:</td>
                    <td style="padding: 4px 8px;">${props.long}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 8px; font-weight: bold;">วันที่:</td>
                    <td style="padding: 4px 8px;">${AQILast.date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 8px; font-weight: bold;">เวลา:</td>
                    <td style="padding: 4px 8px;">${AQILast.time}</td>
                  </tr>
                </table>
              </div>
            `;
        }
```
20. เรียกข้อมูล Tile Service ( WMS )

เพิ่ม function addAir4ThaiMarkers

```
 {
                id: 11,
                type: "arcgis",
                name_en: "bma_basemap_arcgis",
                name: "BMAGI Basemap 2564",
                path: "",
                geojson: null,
                visible: false,
                icon: null,
                minzoom: 0,
                maxzoom: 22,

            }
```

เพิ่ม เงื่อนไข arcgis ใน function addLayer

```
if (layer.type === "arcgis") {
            const sourceId = `${layer.name_en}_${layer.id}_source`;
            const layerId = `${layer.name_en}_${layer.id}_layer`;

            if (!mapInstance.getSource(sourceId)) {
                mapInstance.addSource(sourceId, {
                    type: "raster",
                    tiles: [
                        "https://cpudgiapp.bangkok.go.th/arcgis/rest/services/GI_Platform/BMAGI_Basemap_2564/MapServer/export" +
                        "?bbox={bbox-epsg-3857}" +
                        "&bboxSR=3857" +
                        "&size=256,256" +
                        "&format=png" +
                        "&transparent=true" +
                        "&f=image"
                    ],
                    tileSize: 256,
                });
            }

            mapInstance.addLayer({
                id: layerId,
                type: "raster",
                source: sourceId,
                layout: {
                    visibility: layer.visible ? "visible" : "none"
                }
            });
            return;
        }
```
21. เพิ่ม layer control Basemap
```
<div className="layer-control" style={{ padding: "10px" }}>
                <label>Basemap:</label>
                <select
                    value={selectedBasemap}
                    onChange={(e) => handleBasemapChange(e.target.value)}
                >
                    {baseMapStyles.map((b) => (
                        <option key={b.name} value={b.name}>
                            {b.name}
                        </option>
                    ))}
                </select>
            </div>
```

เพิ่ม Function handleBasemapChange
```
    const handleBasemapChange = (basemapName: string) => {
        if (!map.current) return;

        const basemap: any = baseMapStyles.find(b => b.name === basemapName);
        if (!basemap?.style) return;

        setSelectedBasemap(basemapName);
        setMapStyle(basemap.style);
        map.current.setStyle(basemap.style);
        map.current.once('idle', async () => {
            GISData.forEach(layer => {
                if (layer.geojson || layer.type === 'arcgis') {
                    addLayer(layer, map.current!);
                }
            });;
        });
    };
```

เพิ่ม Function cachedIcon
```
    async function cachedIcon() {
        if (!map.current) return;

        await Promise.all(
            Object.entries(loadedImages.current).map(([id, url]) =>
                new Promise<void>((resolve, reject) => {
                    if (map.current!.hasImage(id)) return resolve();          // sprite already has it

                    map.current!.loadImage(url)
                        .then(img => {
                            map.current!.addImage(id, img.data as ImageBitmap, { pixelRatio: 1 });
                            resolve();
                        })
                        .catch(reject);
                }),
            ),
        );
    }
```

เพิ่ม div layer control

```
 <div>
        {GISData.map((layer) => (
            <div key={layer.id}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={layer.visible}
                                    onChange={() => toggleLayerVisibility(layer.id)}
                                />
                                {layer.name}
                            </label>
                            {layer.name_en == "air4thai" && (
                                <select
                                    value={airtype}
                                    onChange={(e) => {
                                        const newAirType = e.target.value;
                                        handleAirTypeChange(newAirType)
                                    }}
                                >
                                    {AirTypeList.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>

                            )}
                        </div>
                    ))}
                </div>
```
เพิ่ม function handleBasemapChange
```
    const handleBasemapChange = (basemapName: string) => {
        if (!map.current) return;

        const basemap: any = baseMapStyles.find(b => b.name === basemapName);
        if (!basemap?.style) return;

        setSelectedBasemap(basemapName);
        setMapStyle(basemap.style);
        map.current.setStyle(basemap.style);
        map.current.once('idle', async () => {
            await cachedIcon();
            GISData.forEach(layer => {
                if (layer.geojson || layer.type === 'arcgis') {
                    addLayer(layer, map.current!);
                }
            });;
        });
    };
```

เพิ่ม function toggleLayerVisibility

```
const toggleLayerVisibility = (layerId: number) => {
        setGISData((prev) =>
            prev.map((layer) => {
                if (layer.id === layerId) {
                    const newVisible = !layer.visible;

                    if (layer.name_en === "air4thai") {
                        if (newVisible) {
                            showAir4ThaiMarkers(layer);
                        } else {
                            hideAir4ThaiMarkers();
                        }
                    } else {
                        const mapLayerId = `${layer.name_en}_${layer.id}_layer`;
                        if (map.current?.getLayer(mapLayerId)) {
                            map.current.setLayoutProperty(
                                mapLayerId,
                                "visibility",
                                newVisible ? "visible" : "none"
                            );
                        }
                    }

                    return { ...layer, visible: newVisible };
                }
                return layer;
            })
        );
    };
```
```
const showAir4ThaiMarkers = (layer: any) => {
    addAir4ThaiMarkers(layer);
};

const hideAir4ThaiMarkers = () => {
    air4thaiMarkersRef.current.forEach(marker => marker.remove());
    air4thaiMarkersRef.current = [];
};




const handleAirTypeChange = (type: string) => {
        setAirType(type);
        refreshAir4ThaiLayer(type);
    };

    const refreshAir4ThaiLayer = (type: string) => {
        const layer = GISData.find(l => l.name_en === "air4thai");
        if (!layer || !layer.visible) return;
        air4thaiMarkersRef.current.forEach(marker => marker.remove());
        air4thaiMarkersRef.current = [];

        addAir4ThaiMarkers(layer, type);
    };

```

เพิ่ม loadingProgress
```
    const [loadingProgress, setLoadingProgress] = useState<{ loaded: number, total: number }>({
        loaded: 0,
        total: 0
    });
```

ใช้งาน loadingProgress
```
setLoadingProgress({ loaded: 0, total: layers.length });

setLoadingProgress({ loaded: index + 1, total: layers.length });
```

เพิ่ม div loadingProgress
```
<div style={{ marginTop: 10 }}>
                    {loadingProgress.loaded < loadingProgress.total && (
                        <div>
                            Loading GIS Data… {loadingProgress.loaded} / {loadingProgress.total}
                        </div>
                    )}
                </div>
```

