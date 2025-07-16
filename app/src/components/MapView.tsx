import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import './MapView.css';
import webservice from '../services/webservice.service';
// if your bundler supports CSS imports
import 'maplibre-gl/dist/maplibre-gl.css';

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
        name: "Carto Dark",
        style: "./basemap/cartoDark.json"
    },
];

const AirTypeList = [
    "AQI", "PM25", "PM10", "O3", "CO", "NO2", "SO2"
]




const MapView: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const [airtype, setAirType] = useState<any>("AQI");

    const colorPalette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
    const getColorByIndex = (i: number) => {
        return colorPalette[i % colorPalette.length];
    }

    const [GISData, setGISData] = useState<any[]>([]);

    const loadGISDATA = async () => {
        const layers: any = [
            {
                id: 1, type: "geojson", name_en: "district", name: "เขต", path: "district.geojson", geojson: null, visible: true, icon: null, minzoom: 10,
                maxzoom: 15
            },
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
            },
            {
                id: 7, type: "csv", name_en: "bma_cctv", name: "กล้อง cctv", path: "bma_cctv.csv", geojson: null, visible: true, icon: '/assets/images/cctv.png', minzoom: 10, maxzoom: 22
            },
            {
                id: 8, type: "shp", name_en: "bma_green_area", name: "พื้นที่สีเขียว", path: "bma_green_area.zip", geojson: null, visible: true, icon: null, minzoom: 15, maxzoom: 22
            },
            {
                id: 9, type: "shp", name_en: "bma_building", name: "อาคาร/ตึก", path: "bma_building.zip", geojson: null, visible: true, icon: null, minzoom: 15,
                maxzoom: 22
            },
            {
                id: 10, type: "api", name_en: "air4thai", name: "รายงานสภาพอากาศ", path: "http://air4thai.com/forweb/getAQI_JSON.php", geojson: null, visible: true, icon: '/assets/images/air.png', minzoom: 15, maxzoom: 22
            },
        ];
        const loadedLayers: any[] = [];

        for (const [index, layer] of layers.entries()) {

            try {
                let geojson = null;

                if (layer.type === "geojson") {
                    const res = await webservice.loadGeojsonFile(`/assets/geodata/${layer.path}`);
                    geojson = res.status === 200 ? res.data : null;
                } else if (layer.type === "csv") {
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

                } else if (layer.type === "shp") {
                    const res: any = await webservice.loadShapeFile(`/assets/geodata/${layer.path}`);
                    if (res.features?.length > 0) geojson = res;
                } else if (layer.type === "api") {
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
                const fullLayer = { ...layer, geojson };
                loadedLayers.push(fullLayer);

            } catch (err) {
                console.error(`Failed to load ${layer.name_en}:`, err);
            }
        }

        return loadedLayers;
    };

    const addLayer = (layer: any, mapInstance: maplibregl.Map) => {
        if (!layer.geojson) return;

        const sourceId = `${layer.name_en}_${layer.id}_source`;
        const layerId = `${layer.name_en}_${layer.id}_layer`;

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
        } else if (layer.name_en === "road") {
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

        } else if (layer.name_en === "bma_school" || layer.name_en === "air_pollution" || layer.name_en === "bma_cctv") {
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
        } else if (layer.name_en === 'bma_green_area') {
            layerConfig = {
                id: layerId,
                type: "fill",
                source: sourceId,
                minzoom: layer.minzoom ?? 0,
                maxzoom: layer.maxzoom ?? 22,
                paint: { 'fill-color': '#b3ff80', 'fill-opacity': 1 }
            };
        } else if (layer.name_en === 'bma_building') {
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
        } else if (layer.name_en === "air4thai") {
            // Add colored HTML markers
            addAir4ThaiMarkers(layer);
            return;
        }
        mapInstance.addLayer(layerConfig);

    };

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
        } else if (layer == "air_pollution") {
            content = `
            <div style="font-size: 12px;">
                <b>ID:</b> ${props.id_air}<br/>
                <b>NAME:</b> ${props.dname}<br/>
                <b>Location:</b> ${props.location}<br/>
                <b>Code:</b> ${props.dcode}<br/>
            </div>
        `
        } else if (layer == "bma_cctv") {
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

        } else if (layer == "bma_building") {
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
        return content
    }


    useEffect(() => {
        const mapInstance = new maplibregl.Map({
            container: mapContainer.current!,
            style: baseMapStyles[0].style,
            center: [100.577982, 13.845845],
            zoom: 10,
        });

        map.current = mapInstance;

        map.current?.on("load", () => {
            loadGISDATA().then((data) => {
                setGISData(data);
                data.forEach((layer) => addLayer(layer, mapInstance));
            });
        });

        return () => map.current?.remove();

        // return () => mapInstance.remove();
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