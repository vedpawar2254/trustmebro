'use client';

import React, { memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from 'react-simple-maps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Simplified topojson for the world map
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const markers = [
  { markerOffset: -15, name: "India", coordinates: [78.9629, 20.5937] as [number, number] },
  { markerOffset: -15, name: "United States", coordinates: [-95.7129, 37.0902] as [number, number] },
  { markerOffset: 15, name: "Germany", coordinates: [10.4515, 51.1657] as [number, number] },
  { markerOffset: 15, name: "Australia", coordinates: [133.7751, -25.2744] as [number, number] },
  { markerOffset: -15, name: "United Kingdom", coordinates: [-3.4360, 55.3781] as [number, number] }
];

const MapChart = memo(() => {
  return (
    <Card className="rounded-xl shadow-md border-border bg-card overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Freelancer Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">Global network of verified talent</p>
      </CardHeader>
      <CardContent className="p-0 h-[420px] flex items-center justify-center bg-card">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 120 }}
          width={800}
          height={400}
          className="w-full h-full"
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#e2e8f0" // var(--border)
                  stroke="#ffffff" // var(--card)
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#cbd5e1", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
          {markers.map(({ name, coordinates, markerOffset }) => (
            <Marker key={name} coordinates={coordinates}>
              <g
                fill="none"
                stroke="var(--primary)" // Trustmebro Primary Green
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="translate(-12, -24)"
                className="cursor-pointer hover:scale-110 transition-transform origin-bottom"
              >
                <circle cx="12" cy="10" r="3" fill="var(--primary)" />
                <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
              </g>
              <text
                textAnchor="middle"
                y={markerOffset}
                style={{ fontFamily: "system-ui", fill: "var(--foreground)", fontSize: "12px", fontWeight: "600", pointerEvents: "none" }}
              >
                {name}
              </text>
            </Marker>
          ))}
        </ComposableMap>
      </CardContent>
    </Card>
  );
});

MapChart.displayName = "MapChart";

export function FreelancerMap() {
  return <MapChart />;
}
