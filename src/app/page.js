"use client";
import React, { useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";

const MAPBOX_API_KEY =
  "pk.eyJ1IjoiZ29rZXluIiwiYSI6ImNtN3kzc3hmbzA0MDEycXM1ajM3cnZiZDcifQ.UzQmL2mATngTDUTgs1vNDg";
mapboxgl.accessToken = MAPBOX_API_KEY;

export default function Home() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [current, setCurrent] = useState("");
  const [cycle, setCycle] = useState(0);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    const initializeMap = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [28.9784, 41.0082], // Default: Istanbul
      zoom: 10,
    });
    initializeMap.on("load", () => {
      setMap(initializeMap);
    });
  }, []);

  const fetchCoordinates = async (address) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?access_token=${MAPBOX_API_KEY}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].center;
      }
    } catch (err) {
      setError("Failed to fetch coordinates.");
    }
    return null;
  };

  const fetchRoute = async (pickupCoords, dropoffCoords, currentCoords) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${currentCoords[0]},${currentCoords[1]};${pickupCoords[0]},${pickupCoords[1]};${dropoffCoords[0]},${dropoffCoords[1]}?geometries=geojson&steps=true&overview=full&access_token=${MAPBOX_API_KEY}`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        setRouteData(data.routes[0].geometry.coordinates);
      } else {
        setError("No route found.");
      }
    } catch (err) {
      setError("Failed to fetch route.");
    }
  };

  const handleRoute = async () => {
    setError(null);
    const pickupLocation = await fetchCoordinates(pickup);
    const dropoffLocation = await fetchCoordinates(dropoff);
    const currentLocation = await fetchCoordinates(current);

    if (pickupLocation && dropoffLocation && currentLocation) {
      setCurrentCoords(currentLocation);
      setPickupCoords(pickupLocation);
      setDropoffCoords(dropoffLocation);
      await fetchRoute(pickupLocation, dropoffLocation, currentLocation);
    } else {
      setError("One or both locations could not be found. Try again.");
    }
  };

  useEffect(() => {
    if (map && pickupCoords && dropoffCoords && currentCoords && routeData) {
      if (!map.isStyleLoaded()) {
        return;
      }

      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(pickupCoords);
      bounds.extend(dropoffCoords);
      bounds.extend(currentCoords);
      map.fitBounds(bounds, { padding: 50 });

      new mapboxgl.Marker().setLngLat(pickupCoords).addTo(map);
      new mapboxgl.Marker().setLngLat(dropoffCoords).addTo(map);
      new mapboxgl.Marker().setLngLat(currentCoords).addTo(map);

      if (map.getLayer("route")) {
        map.removeLayer("route");
        map.removeSource("route");
      }

      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: routeData,
          },
        },
      });

      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FF0000", "line-width": 4 },
      });
    }
  }, [map, pickupCoords, dropoffCoords, currentCoords, routeData]);

  return (
    <div className="flex h-screen w-full items-center p-4 flex-row">
      <div className="basis-1/3 flex flex-col gap-4 mx-8">
        <h1 className="text-xl font-bold">Stops</h1>
        <input
          type="text"
          placeholder="Current Location"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Pickup Location"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Dropoff Location"
          value={dropoff}
          onChange={(e) => setDropoff(e.target.value)}
          className="p-2 border rounded"
        />
        <h2 className="text-lg font-semibold">Hour Cycle</h2>
        <input
          type="value"
          placeholder="Hour Cycle"
          value={cycle}
          onChange={(e) => setCycle(e.target.value)}
          className="p-2 border rounded"
        />
        <button
          onClick={handleRoute}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Show Driving Logs
        </button>
      </div>
      <div className="basis-2/3 h-3/4 bg-gray-200 shadow-lg">
        <div id="map" className="h-full h-3/4 bg-gray-200"></div>
      </div>

      {error && (
        <div className="w-3/4 bg-red-100 text-red-700 p-4 rounded shadow-lg">
          <h2 className="text-lg font-semibold">Error</h2>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
