import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapView.css';

const MapView: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<maplibregl.Map | null>(null);

    // Define your base map styles
    const baseMapStyles = [
        {
            name: 'Google Hybrid',
            style: {
                'version': 8, 'glyphs': 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
                'sources': { 'google-hybrid': { 'type': 'raster', 'tiles': ['https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'], 'tileSize': 256 } },
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

    const [selectedBasemap, setSelectedBasemap] = useState<any>('Google Hybrid');

    const [mapStyle, setMapStyle] = useState<any>(baseMapStyles[0].style);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: mapStyle,
            center: [100.577982, 13.845845],
            zoom: 5,
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
        // console.log(selectedBasemap);
        let f = baseMapStyles.find((e: any) => e.name == selectedBasemap);
        setMapStyle(f?.style)
    }, [selectedBasemap])

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
            </div>
        </div>
    );
};

export default MapView;
