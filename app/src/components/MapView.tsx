import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import webservice from "../services/webservice.service";
import './MapView.css'
const baseMapStyles = [
    {
        name: "Google Hybrid",
        style: {
            version: 8,
            // glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
            sources: {
                "google-hybrid": {
                    type: "raster",
                    tiles: ["https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"],
                    tileSize: 256,
                },
            },
            layers: [
                {
                    id: "google-layer",
                    type: "raster",
                    source: "google-hybrid",
                },
            ],
        },
    },
    {
        name: "OpenStreetMap",
        style: {
            version: 8,
            sources: {
                "osm-tiles": {
                    type: "raster",
                    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                    tileSize: 256,
                    attribution: "© OpenStreetMap contributors",
                },
            },
            layers: [
                {
                    id: "osm-layer",
                    type: "raster",
                    source: "osm-tiles",
                    minzoom: 0,
                    maxzoom: 18,
                },
            ],
        },
    },
];

const MapView: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const [mapStyle, setMapStyle] = useState<any>(baseMapStyles[0].style);
    const [selectedBasemap, setSelectedBasemap] = useState<any>("Google Hybrid");
    const [GISData, setGISData] = useState<any[]>([]);

    useEffect(() => {
        const mapInstance = new maplibregl.Map({
            container: mapContainer.current!,
            style: mapStyle,
            center: [100.577982, 13.845845],
            zoom: 10,
        });

        map.current = mapInstance;

        mapInstance.on("load", () => {
            loadGISDATA().then((data) => {
                setGISData(data);
                data.forEach((layer) => addLayer(layer, mapInstance));
            });
        });


        return () => mapInstance.remove();
    }, []);


    const [loadingProgress, setLoadingProgress] = useState<{ loaded: number, total: number }>({
        loaded: 0,
        total: 0
    });

    // const [loadingStatus, setLoadingStatus] = useState<{ [key: number]: string }>({});

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
                id: 7, type: "csv", name_en: "bma_cctv", name: "กล้อง cctv", path: "bma_cctv.csv", geojson: null, visible: true, icon: '/assets/images/cctv.png', minzoom: 10,
                maxzoom: 22
            },
            {
                id: 8, type: "shp", name_en: "bma_green_area", name: "พื้นที่สีเขียว", path: "bma_green_area.zip", geojson: null, visible: true, icon: null, minzoom: 15,
                maxzoom: 22
            },
            {
                id: 9, type: "shp", name_en: "bma_building", name: "อาคาร/ตึก 1", path: "bma_building_center.zip", geojson: null, visible: true, icon: null, minzoom: 15,
                maxzoom: 22
            },
            // {
            //     id: 10, type: "shp", name_en: "bma_building", name: "อาคาร/ตึก 2", path: "bma_building_north.zip", geojson: null, visible: true, icon: null, minzoom: 15,
            //     maxzoom: 22
            // },
            // {
            //     id: 11, type: "shp", name_en: "bma_building", name: "อาคาร/ตึก 3", path: "bma_building_south.zip", geojson: null, visible: true, icon: null, minzoom: 15,
            //     maxzoom: 22
            // },
            {
                id: 12,
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
        ];

        setLoadingProgress({ loaded: 0, total: layers.length });
        // setLoadingStatus({}); // reset

        const loadedLayers: any[] = [];

        for (const [index, layer] of layers.entries()) {
            // setLoadingStatus((prev) => ({ ...prev, [layer.id]: 'loading' }));

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
                }

                const fullLayer = { ...layer, geojson };
                loadedLayers.push(fullLayer);
                // setLoadingStatus((prev) => ({ ...prev, [layer.id]: 'loaded' }));

            } catch (err) {
                // console.error(`Failed to load ${layer.name_en}:`, err);
                // setLoadingStatus((prev) => ({ ...prev, [layer.id]: 'error' }));
            }

            setLoadingProgress({ loaded: index + 1, total: layers.length });
        }

        return loadedLayers;
    };


    const colorPalette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
    const getColorByIndex = (i: number) => {
        return colorPalette[i % colorPalette.length];
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

        } else if (layer == "air_pollution") {
            content = `
            <div style="font-size: 12px;">
                <b>ID:</b> ${props.id_air}<br/>
                <b>NAME:</b> ${props.dname}<br/>
                <b>Location:</b> ${props.location}<br/>
                <b>Code:</b> ${props.dcode}<br/>
            </div>
        `
        } else if (layer == "bma_school") {
            content = `
            <div style="font-size: 12px;">
                <b>ID:</b> ${props.id_sch}<br/>
                <b>NAME:</b> ${props.name}<br/>
                <b>Address:</b> ${props.address}<br/>
                <b>Code:</b> ${props.dcode}<br/>
                <b>Student Count:</b> ${props.num_stu}<br/>
            </div>
        `
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
                console.error("Failed to load CCTV icon", err);
            });
    }

    const addLayer = (layer: any, mapInstance: maplibregl.Map) => {

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

        if (!layer.geojson) return;

        const sourceId = `${layer.name_en}_${layer.id}_source`;
        const layerId = `${layer.name_en}_${layer.id}_layer`;

        // console.log(layer.geojson);


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
        } else if (layer.name_en === 'bma_building') {
            const color = getColorByIndex(layer.id);

            /* ---------- helper expressions ---------- */
            // Safely pull out area_in_me as a number with default 0
            const areaExpr: any[] = ['to-number', ['get', 'area_in_me'], 0];

            // Re‑usable logic for extrusion height
            const heightExpr: any = [
                'case',
                ['<', areaExpr, 200], 6,
                ['<', areaExpr, 400], 8,
                20
            ];

            /* ---------- main extrusion layer ---------- */
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

            /* ---------- highlight layer (invisible until clicked) ---------- */
            const hlId = `bma_building-highlight-${layer.id}`;

            map.current?.addLayer({
                id: hlId,
                type: 'fill-extrusion',
                source: sourceId,
                minzoom: layer.minzoom ?? 0,
                maxzoom: layer.maxzoom ?? 22,
                paint: {
                    'fill-extrusion-color': '#ff0000',
                    'fill-extrusion-height': heightExpr,
                    'fill-extrusion-opacity': 1
                },
                // Start hidden
                filter: ['==', '___init___', 0]
            });

            /* ---------- click handler ---------- */
            map.current?.on('click', layerId, (e) => {
                const feature = e.features?.[0];
                if (!feature) return;

                const props = feature.properties || {};

                // The ID field in your data could be id OR building_id.
                const buildingId = props.building_id ?? props.id;
                if (buildingId === undefined || buildingId === null) {
                    console.warn('Clicked building has no id / building_id:', props);
                    return;
                }

                // Filter highlight layer by the **actual** field that exists in the data
                map.current!.setFilter(hlId, ['==', props.building_id !== undefined ? 'building_id' : 'id', buildingId]);

                new maplibregl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(setContent(props, layer.name_en))
                    .addTo(map.current!);
            });
        }


        mapInstance.addLayer(layerConfig);


    };

    const toggleLayerVisibility = (layerId: number) => {
        setGISData((prev) =>
            prev.map((layer) => {
                if (layer.id === layerId) {
                    const newVisible = !layer.visible;
                    const mapLayerId = `${layer.name_en}_layer`;
                    if (map.current?.getLayer(mapLayerId)) {
                        map.current.setLayoutProperty(
                            mapLayerId,
                            "visibility",
                            newVisible ? "visible" : "none"
                        );
                    }
                    return { ...layer, visible: newVisible };
                }
                return layer;
            })
        );
    };

    // ─────────────────────────────────────────────
    // helper: re‑add every custom icon that
    // was loaded earlier (CCTV, school, station)
    async function replayIcons() {
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

    const handleBasemapChange = (basemapName: string) => {
        if (!map.current) return;

        const basemap: any = baseMapStyles.find(b => b.name === basemapName);
        if (!basemap?.style) return;

        setSelectedBasemap(basemapName);
        setMapStyle(basemap.style);

        // 1️⃣ Switch style
        map.current.setStyle(basemap.style);

        // 2️⃣ Wait until the map is **idle** (all style + sprite + glyph +
        //    tiles parsed). This fires once per style change.
        map.current.once('idle', async () => {
            // a) put back custom icons *first*
            await replayIcons();

            // b) add every GIS layer again
            GISData.forEach(layer => {
                if (layer.geojson || layer.type === 'arcgis') {
                    addLayer(layer, map.current!);
                }
            });

            // c) keep your preferred drawing order
            // reorderLayers();
        });
    };


    function reorderLayers() {
        const desiredOrder = [
            'district_layer',
            'road_layer',
            'bike_way_layer',
            'bma_zone_layer',
            'bma_cctv_layer',
            'bma_school_layer',
            'air_pollution_layer'
        ];

        let previousLayerId = null;

        for (let i = desiredOrder.length - 1; i >= 0; i--) {
            const layerId = desiredOrder[i];
            if (map.current?.getLayer(layerId)) {
                map.current.moveLayer(layerId, previousLayerId || undefined);
                previousLayerId = layerId;
            }
        }
    }




    return (
        <div className="map-view-wrapper" style={{ display: "flex" }}>
            <div
                ref={mapContainer}
                style={{ width: "100%", height: "100vh" }}
            ></div>
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
                <div style={{ marginTop: 10 }}>
                    {loadingProgress.loaded < loadingProgress.total && (
                        <div>
                            Loading GIS Data… {loadingProgress.loaded} / {loadingProgress.total}
                        </div>
                    )}
                </div>
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
                            {/* <div style={{ fontSize: '12px', marginLeft: '10px' }}>
                                Status: {loadingStatus[layer.id] || 'pending'}
                            </div> */}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MapView;
