import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapView.css';
import webservice from '../services/webservice.service';

const MapView: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<maplibregl.Map | null>(null);

    // Define your base map styles
    const baseMapStyles = [
        {
            name: 'Google Hybrid',
            style: {
                'version': 8, 'glyphs': 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
                'sources': {
                    'google-hybrid': {
                        'type': 'raster',
                        'tiles': ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
                        // 'tiles': ['https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'],
                        'tileSize': 256
                    }
                },
                'layers': [{ 'id': 'google-layer', 'type': 'raster', 'source': 'google-hybrid' }]
            }
        },
        {
            name: 'OpenStreetMap',
            style: {
                'version': 8,
                'sources': {
                    'osm-tiles': {
                        type: 'raster',
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '© OpenStreetMap contributors',
                    },
                },
                'layers': [
                    {
                        id: 'osm-layer',
                        type: 'raster',
                        source: 'osm-tiles',
                        minzoom: 0,
                        maxzoom: 18,
                    },
                ],
            }
        },

    ];


    const [GISData, setGISData] = useState([
        { id: 1, type: "geojson", name_en: "district", name: "เขต", path: "district.geojson", geojson: null, check: true },
        { id: 2, type: "geojson", name_en: "road", name: "เส้นถนน", path: "bma_road.geojson", geojson: null, check: true },
        { id: 3, type: "geojson", name_en: "bike_way", name: "ทางจักรยาน", path: "bike_way.geojson", geojson: null, check: true },
        { id: 4, type: "geojson", name_en: "bma_zone", name: "Zone", path: "bma_zone.geojson", geojson: null, check: true },
        { id: 5, type: "geojson", name_en: "bma_school", name: "โรงเรียน", path: "bma_school.geojson", geojson: null, check: true },
        { id: 6, type: "geojson", name_en: "air_pollution", name: "สถานีตรวจวัดคุณภาพฯ", path: "air_pollution.geojson", geojson: null, check: true },
        { id: 7, type: "csv", name_en: "bma_cctv", name: "กล้อง cctv", path: "bma_cctv.csv", geojson: null, check: true },
        { id: 8, type: "shp", name_en: "bma_green_area", name: "พื้นที่สีเขียว", path: "bma_green_area.zip", geojson: null, check: true },
        { id: 9, type: "shp", name_en: "bma_building", name: "อาคาร/ตึก", path: "bma_building.zip", geojson: null, check: true },

    ])

    const [selectedBasemap, setSelectedBasemap] = useState<any>('Google Hybrid');

    const [mapStyle, setMapStyle] = useState<any>(baseMapStyles[0].style);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: mapStyle,
            center: [100.577982, 13.845845],
            zoom: 10,
        });

        return () => {
            map.current?.remove();
        };
    }, []);

    useEffect(() => {
        if (!map.current || !mapContainer.current || !mapStyle) return;
        map.current.setStyle(mapStyle);
    }, [mapStyle]);


    const handleBasemapChange = (basemap: any) => {
        setSelectedBasemap(basemap);
    };

    React.useEffect(() => {
        let f = baseMapStyles.find((e: any) => e.name == selectedBasemap);
        setMapStyle(f?.style)
    }, [selectedBasemap])

    React.useEffect(() => {
        loadGISDATA();
    }, []);

    const loadGISDATA = async () => {
        const updatedData = await Promise.all(
            GISData.map(async (e) => {
                if (e.type === "geojson") {
                    const res: any = await webservice.loadGeojsonFile(`/assets/geodata/${e.path}`);
                    if (res.status === 200) {
                        return { ...e, geojson: res.data };
                    }
                } else if (e.type === "csv") {
                    const res: any = await webservice.loadCSVFile(`/assets/geodata/${e.path}`);
                    if (res.length > 0) {
                        var geojson = csvArrayToGeoJSON(res)
                        return { ...e, geojson: geojson };
                    }
                } else if (e.type === "shp") {
                    const geojson: any = await webservice.loadShapeFile(`/assets/geodata/${e.path}`);
                    if (geojson.features.length > 0) {
                        return { ...e, geojson: geojson };
                    }
                }
                return e;
            })
        );
        setGISData(updatedData);
        console.log(updatedData);
    };

    function csvArrayToGeoJSON(dataArray: any) {
        return {
            type: "FeatureCollection",
            features: dataArray.map((item: any) => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [
                        parseFloat(item.long),
                        parseFloat(item.lat),
                    ],
                },
                properties: { ...item },
            })),
        };
    }

    React.useEffect(() => {
        if (!GISData.length || !map.current) return;


        function addCsvLayer(sourceId: string, iconId: string, layerId: string) {
            if (!map.current) return;

            map.current.addLayer({
                id: layerId,
                type: "symbol",
                source: sourceId,
                layout: {
                    "icon-image": iconId,
                    "icon-size": 0.5,
                    "icon-allow-overlap": true,
                },

            });

            map.current.on("click", layerId, (eClick) => {
                const feature = eClick.features?.[0];
                if (!feature) return;

                const props = feature.properties;
                const lngLat = eClick.lngLat;

                const html = `
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

                new maplibregl.Popup()
                    .setLngLat(lngLat)
                    .setHTML(html)
                    .addTo(map.current!);
            });

            map.current.on("mouseenter", layerId, () => {
                map.current!.getCanvas().style.cursor = "pointer";
            });
            map.current.on("mouseleave", layerId, () => {
                map.current!.getCanvas().style.cursor = "";
            });
        }

        function addPointLayer(sourceId: string, iconId: string, layerId: string) {
            if (!map.current) return;

            map.current.addLayer({
                id: layerId,
                type: "symbol",
                source: sourceId,
                layout: {
                    "icon-image": iconId,
                    "icon-size": 0.5,
                    "icon-allow-overlap": true,
                },
            });

            map.current.on("click", layerId, (eClick) => {
                const feature = eClick.features?.[0];
                if (!feature) return;

                const props = feature.properties;
                const lngLat = eClick.lngLat;

                const html = `
                    <div style="font-size: 12px;">
                        <b>ID:</b> ${props.id_air}<br/>
                        <b>NAME:</b> ${props.dname}<br/>
                        <b>Location:</b> ${props.location}<br/>
                        <b>Code:</b> ${props.dcode}<br/>
                    </div>
                `;

                new maplibregl.Popup()
                    .setLngLat(lngLat)
                    .setHTML(html)
                    .addTo(map.current!);
            });

            map.current.on("mouseenter", layerId, () => {
                map.current!.getCanvas().style.cursor = "pointer";
            });
            map.current.on("mouseleave", layerId, () => {
                map.current!.getCanvas().style.cursor = "";
            });
        }

        function addSchoolLayer(sourceId: string, iconId: string, layerId: string) {
            if (!map.current) return;

            map.current.addLayer({
                id: layerId,
                type: "symbol",
                source: sourceId,
                layout: {
                    "icon-image": iconId,
                    "icon-size": 0.5,
                    "icon-allow-overlap": true,
                },
            });

            map.current.on("click", layerId, (eClick) => {
                const feature = eClick.features?.[0];
                if (!feature) return;

                const props = feature.properties;
                const lngLat = eClick.lngLat;

                const html = `
                    <div style="font-size: 12px;">
                        <b>ID:</b> ${props.is_sch}<br/>
                        <b>NAME:</b> ${props.name}<br/>
                        <b>Address:</b> ${props.address}<br/>
                        <b>Code:</b> ${props.dcode}<br/>
                        <b>Student Count:</b> ${props.num_stu}<br/>
                    </div>
                `;

                new maplibregl.Popup()
                    .setLngLat(lngLat)
                    .setHTML(html)
                    .addTo(map.current!);
            });

            map.current.on("mouseenter", layerId, () => {
                map.current!.getCanvas().style.cursor = "pointer";
            });
            map.current.on("mouseleave", layerId, () => {
                map.current!.getCanvas().style.cursor = "";
            });
        }


        const addLayers = () => {

            GISData.forEach((e: any, index: number) => {
                if (e.geojson != null && e.geojson?.features.length > 0) {
                    const sourceId = `${e.name_en}_layer_source`;
                    const layerId = `${e.name_en}_layer`;

                    if (map.current?.getSource(sourceId)) return;

                    if (e.type === "csv") {
                        map.current?.addSource(sourceId, {
                            type: 'geojson',
                            data: e.geojson
                        });

                        const iconId = "cctv-icon";

                        if (!map.current?.hasImage(iconId)) {
                            map.current!.loadImage("/assets/images/cctv.png")
                                .then((img) => {
                                    const raw = img.data as HTMLImageElement | ImageBitmap;

                                    // Desired output size (in pixels)
                                    const targetSize = 48;

                                    const canvas = document.createElement("canvas");
                                    canvas.width = targetSize;
                                    canvas.height = targetSize;

                                    const ctx = canvas.getContext("2d")!;
                                    ctx.drawImage(raw, 0, 0, targetSize, targetSize);

                                    canvas.toBlob((blob) => {
                                        if (!blob) return;

                                        createImageBitmap(blob).then((resizedBitmap) => {
                                            if (!map.current!.hasImage(iconId)) {
                                                map.current!.addImage(iconId, resizedBitmap, { pixelRatio: 1 });
                                            }
                                            addCsvLayer(sourceId, iconId, layerId);
                                        });
                                    }, "image/png");
                                })
                                .catch((err) => {
                                    console.error("Failed to load CCTV icon", err);
                                });
                        } else {
                            addCsvLayer(sourceId, iconId, layerId);
                        }


                    } else {
                        if (e.name_en === 'air_pollution') {

                            map.current?.addSource(sourceId, {
                                type: 'geojson',
                                data: e.geojson
                            });
                            const iconId = "station-icon";

                            if (!map.current?.hasImage(iconId)) {
                                map.current!.loadImage("/assets/images/station.png")
                                    .then((img) => {
                                        const raw = img.data as HTMLImageElement | ImageBitmap;

                                        // Desired output size (in pixels)
                                        const targetSize = 48;

                                        const canvas = document.createElement("canvas");
                                        canvas.width = targetSize;
                                        canvas.height = targetSize;

                                        const ctx = canvas.getContext("2d")!;
                                        ctx.drawImage(raw, 0, 0, targetSize, targetSize);

                                        canvas.toBlob((blob) => {
                                            if (!blob) return;

                                            createImageBitmap(blob).then((resizedBitmap) => {
                                                if (!map.current!.hasImage(iconId)) {
                                                    map.current!.addImage(iconId, resizedBitmap, { pixelRatio: 1 });
                                                }
                                                addPointLayer(sourceId, iconId, layerId);
                                            });
                                        }, "image/png");
                                    })
                                    .catch((err) => {
                                        console.error("Failed to load station icon", err);
                                    });
                            } else {
                                addPointLayer(sourceId, iconId, layerId);
                            }

                        } else if (e.name_en === 'bma_school') {

                            map.current?.addSource(sourceId, {
                                type: 'geojson',
                                data: e.geojson
                            });
                            const iconId = "school-icon";

                            if (!map.current?.hasImage(iconId)) {
                                map.current!.loadImage("/assets/images/school.png")
                                    .then((img) => {
                                        const raw = img.data as HTMLImageElement | ImageBitmap;

                                        // Desired output size (in pixels)
                                        const targetSize = 48;

                                        const canvas = document.createElement("canvas");
                                        canvas.width = targetSize;
                                        canvas.height = targetSize;

                                        const ctx = canvas.getContext("2d")!;
                                        ctx.drawImage(raw, 0, 0, targetSize, targetSize);

                                        canvas.toBlob((blob) => {
                                            if (!blob) return;

                                            createImageBitmap(blob).then((resizedBitmap) => {
                                                if (!map.current!.hasImage(iconId)) {
                                                    map.current!.addImage(iconId, resizedBitmap, { pixelRatio: 1 });
                                                }
                                                addSchoolLayer(sourceId, iconId, layerId);
                                            });
                                        }, "image/png");
                                    })
                                    .catch((err) => {
                                        console.error("Failed to load station icon", err);
                                    });
                            } else {
                                addSchoolLayer(sourceId, iconId, layerId);
                            }

                        } else {

                            map.current?.addSource(sourceId, {
                                type: 'geojson',
                                data: e.geojson
                            });

                            let paint = {};
                            let layerType: any = 'fill';

                            if (e.name_en === 'road') {
                                layerType = 'line';
                                paint = {
                                    'line-color': '#ffe53d',
                                    'line-width': 8
                                };
                            } else if (e.name_en === 'bike_way') {
                                layerType = 'line';
                                paint = {
                                    'line-color': '#ffa200',
                                    'line-width': 5
                                };
                            } else if (e.name_en === 'district') {
                                layerType = 'line';
                                paint = { 'line-color': '#f391d6', 'line-width': 10 }
                            } else if (e.name_en === 'bma_zone') {
                                layerType = 'fill';
                                paint = { 'line-color': '#f391d6', 'line-width': 5 };

                                const features = e.geojson.features;

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

                                paint = {
                                    'fill-color': colorExpression,
                                    'fill-opacity': 0.25,
                                };

                            } else if (e.name_en === 'bma_green_area') {
                                layerType = 'fill';
                                paint = { 'fill-color': '#b3ff80', 'fill-opacity': 1 }
                            } else if (e.name_en === 'bma_building') {
                                layerType = 'fill-extrusion';
                                paint = {
                                    'fill-extrusion-color': '#ffcc00',
                                    'fill-extrusion-height': [
                                        'case',
                                        ['<', ['get', 'area_in_me'], 200], 6,
                                        ['all', ['>=', ['get', 'area_in_me'], 200], ['<', ['get', 'area_in_me'], 400]], 8,
                                        20
                                    ],
                                    'fill-extrusion-opacity': 0.9
                                };

                                // Add highlight layer initially
                                map.current?.addLayer({
                                    id: 'bma_building-highlight',
                                    type: 'fill-extrusion',
                                    source: sourceId,
                                    paint: {
                                        'fill-extrusion-color': '#ff0000',
                                        'fill-extrusion-height': [
                                            'case',
                                            ['<', ['get', 'area_in_me'], 200], 3,
                                            ['all', ['>=', ['get', 'area_in_me'], 200], ['<', ['get', 'area_in_me'], 400]], 6,
                                            10
                                        ],
                                        'fill-extrusion-opacity': 1
                                    },
                                    filter: ['==', 'dummy_field', 'dummy_value']
                                });

                                // Click handler

                                map.current?.on('click', layerId, (e) => {
                                    const feature = e.features?.[0];
                                    if (!feature) return;

                                    const props = feature.properties;
                                    const buildingId = props?.id;

                                    if (buildingId === undefined || buildingId === null) {
                                        console.warn('Clicked building has no building_id property:', props);
                                        return;
                                    }

                                    if (map.current) {
                                        map.current.setFilter('bma_building-highlight', [
                                            '==',
                                            'building_id',
                                            buildingId
                                        ]);

                                        new maplibregl.Popup()
                                            .setLngLat(e.lngLat)
                                            .setHTML(`
                                               <div style="font-size: 12px;">
                                               <strong>Building Info</strong><br/>
                                                <b>ID:</b> ${props.id}<br/>
                                                <b>Area:</b> ${props.area_in_me}<br/>
                                                <b>Confidence:</b> ${props.confidence}<br/>
                                                <b>latitude:</b> ${props.latitude}<br/>
                                                <b>longitude:</b> ${props.longitude}<br/>
                                            </div>
                                        `)
                                            .addTo(map.current);
                                    }
                                });

                                // Optional: clear highlight on clicking elsewhere
                                map.current?.on('click', (e) => {
                                    const features: any = map.current?.queryRenderedFeatures(e.point, {
                                        layers: [layerId]
                                    });

                                    if (features.length === 0) {
                                        map.current?.setFilter('bma_building-highlight', ['==', 'dummy_field', 'dummy_value']);
                                    }
                                });

                            }
                            map.current?.addLayer({
                                id: layerId,
                                type: layerType,
                                source: sourceId,
                                paint: paint,
                                layout: {
                                    visibility: e.check ? 'visible' : 'none'
                                }
                            });
                        }
                    }
                }
            });
        };


        const colorPalette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
        function getColorByIndex(i: number) {
            return colorPalette[i % colorPalette.length];
        }

        if (map.current.isStyleLoaded()) {
            addLayers();
        } else {
            const onLoad = () => {
                addLayers();
                map.current?.off('load', onLoad);
            };
            map.current.on('load', onLoad);
        }
    }, [GISData]);

    const toggleLayerVisibility = (id: any) => {
        setGISData((prevData) => {
            return prevData.map((layer) => {
                if (layer.id === id) {
                    const newCheck = !layer.check;
                    const layerId = `${layer.name_en}_layer`;

                    if (map.current?.getLayer(layerId)) {
                        map.current.setLayoutProperty(
                            layerId,
                            'visibility',
                            newCheck ? 'visible' : 'none'
                        );
                    }

                    return { ...layer, check: newCheck };
                }
                return layer;
            });
        });
    };




    return (
        <div className="map-view-wrapper">
            <div className="map-container" ref={mapContainer} />
            <div className="layer-control">
                <label htmlFor="basemap-select">Select Basemap:</label>
                <select id="basemap-select" onChange={(e) => handleBasemapChange(e.target.value)} value={selectedBasemap}>

                    {baseMapStyles.map((item, index) => (
                        <option key={index} value={item.name}>
                            {item.name}
                        </option>
                    ))}

                </select>

                <div>
                    {GISData.map((layer) => (
                        <div key={layer.id}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={layer.check}
                                    onChange={() => toggleLayerVisibility(layer.id)}
                                />
                                {layer.name}
                            </label>
                        </div>
                    ))}
                </div>
            </div>




        </div>
    );
};

export default MapView;
