import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Context to share map instance
const MapContext = createContext<{ map: maplibregl.Map | null; isLoaded: boolean }>({ map: null, isLoaded: false });

export const useMap = () => useContext(MapContext);

interface MapProps extends React.HTMLAttributes<HTMLDivElement> {
    center?: [number, number]; // [lng, lat]
    zoom?: number;
    children?: React.ReactNode;
}

export function Map({ center = [122.4025, 9.7512], zoom = 12, children, className, ...props }: MapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<maplibregl.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const tileUrl = 'https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png';

        const mapStyle: any = {
            version: 8,
            sources: {
                basemap: {
                    type: 'raster',
                    tiles: [tileUrl],
                    tileSize: 256,
                    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
                }
            },
            layers: [
                {
                    id: 'basemap-layer',
                    type: 'raster',
                    source: 'basemap',
                    minzoom: 0,
                    maxzoom: 20
                }
            ]
        };

        const mapInstance = new maplibregl.Map({
            container: containerRef.current,
            style: mapStyle,
            center: center,
            zoom: zoom,
            attributionControl: false
        });

        // Add controls
        mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        mapInstance.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

        mapInstance.on('load', () => {
            setIsLoaded(true);
        });

        setMap(mapInstance);

        return () => {
            mapInstance.remove();
        };
    }, []);

    // flyTo center when it changes
    useEffect(() => {
        if (map && isLoaded) {
            map.flyTo({ center, zoom: map.getZoom() });
        }
    }, [center, map, isLoaded]);

    return (
        <MapContext.Provider value={{ map, isLoaded }}>
            <div ref={containerRef} className={`relative overflow-hidden ${className}`} {...props}>
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 z-10">
                        <div className="flex flex-col items-center gap-3">
                            <svg className="animate-spin h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-sm text-slate-500 font-medium">Initializing Map...</span>
                        </div>
                    </div>
                )}
                {isLoaded && children}
            </div>
        </MapContext.Provider>
    );
}

// Marker component
interface MarkerProps {
    longitude: number;
    latitude: number;
    color?: string;
    children?: React.ReactNode;
    onClick?: (e?: any) => void;
}

export function Marker({ longitude, latitude, color = '#0f766e', children, onClick }: MarkerProps) {
    const { map } = useMap();
    const [container] = useState(() => document.createElement('div'));
    const markerRef = useRef<maplibregl.Marker | null>(null);

    useEffect(() => {
        if (!map) return;

        // If children are supplied, we use the container element.
        // Otherwise we use MapLibre's default marker SVG.
        const markerInstance = new maplibregl.Marker({
            color: children ? undefined : color,
            element: children ? container : undefined,
        })
            .setLngLat([longitude, latitude])
            .addTo(map);

        if (onClick) {
            const el = markerInstance.getElement();
            el.style.cursor = 'pointer';
            el.addEventListener('click', onClick);
        }

        markerRef.current = markerInstance;

        return () => {
            if (onClick) {
                markerInstance.getElement().removeEventListener('click', onClick);
            }
            markerInstance.remove();
        };
    }, [map, longitude, latitude, color, container]);

    // Render custom React content inside the MapLibre Marker element
    if (children) {
        return createPortal(children, container);
    }
    return null;
}

// Popup component
interface PopupProps {
    longitude: number;
    latitude: number;
    children: React.ReactNode;
    onClose?: () => void;
    closeButton?: boolean;
    closeOnClick?: boolean;
}

export function Popup({ longitude, latitude, children, onClose, closeButton = true, closeOnClick = false }: PopupProps) {
    const { map } = useMap();
    const [container] = useState(() => document.createElement('div'));
    const popupRef = useRef<maplibregl.Popup | null>(null);

    useEffect(() => {
        if (!map) return;

        const popupInstance = new maplibregl.Popup({
            closeButton,
            closeOnClick,
            className: 'custom-maplibre-popup',
            maxWidth: '320px'
        })
            .setLngLat([longitude, latitude])
            .setDOMContent(container)
            .addTo(map);

        if (onClose) {
            popupInstance.on('close', onClose);
        }

        popupRef.current = popupInstance;

        return () => {
            popupInstance.remove();
        };
    }, [map, longitude, latitude, container]);

    return createPortal(children, container);
}
