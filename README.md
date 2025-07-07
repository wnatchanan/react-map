# react-map
1. ติดตั้ง Maplibre ใน React
```
npm install maplibre-gl @types/maplibre-gl
npm install  --save-dev papaparse @types/papaparse
npm instasll --save-dev shpjs @types/shpjs
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

Add Function Custom Zone Color 
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

้เพิ่ม Function addDataPopup
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
เพิ่ม record ใน layers
```
{
    id: 7, type: "csv", name_en: "bma_cctv", name: "กล้อง cctv", path: "bma_cctv.csv", geojson: null, visible: true, icon: '/assets/images/cctv.png', minzoom: 10, maxzoom: 22
},
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
