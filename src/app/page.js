"use client";
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import ELDLogChart from "../components/ELDLogChart"; // Import the new ELDLogChart component
import LoadingSpinner from "@/components/LoadingSpinner";
import { ArrowDown } from "lucide-react";

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
  const [menuOpen, setMenuOpen] = useState(true);
  const [totalMiles, setTotalMiles] = useState(0);
  const [loading, setLoading] = useState(false); // loading check
  const [showLogs, setShowLogs] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [showDown, setShowDown] = useState(false);

  const scrollRef = useRef(null);

  const handleRefClick = () => {
    scrollRef.current.scrollIntoView({ behavior: "smooth" });
    setShowDown(false);
  };

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
        return data.features[0];
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
        setTotalMiles(data.routes[0].distance / 1609.34); // Convert meters to miles
      } else {
        setError("No route found.");
      }
    } catch (err) {
      setError("Failed to fetch route.");
    }
  };

  const handleRoute = async () => {
    setError(null);
    setLoading(true); // Start loading animation

    // Clear existing markers and route data
    markers.forEach((marker) => marker.remove());
    setMarkers([]);
    setRouteData(null);

    if (!pickup || !dropoff || !current || !cycle) {
      setError("All fields are required.");
      setLoading(false); // Stop loading animation
      return;
    }

    const pickupData = await fetchCoordinates(pickup);
    const dropoffData = await fetchCoordinates(dropoff);
    const currentData = await fetchCoordinates(current);

    if (pickupData && dropoffData && currentData) {
      setPickupCoords(pickupData.center);
      setPickup(pickupData.text);
      setDropoffCoords(dropoffData.center);
      setDropoff(dropoffData.text);
      setCurrentCoords(currentData.center);
      setCurrent(currentData.text);

      await fetchRoute(
        pickupData.center,
        dropoffData.center,
        currentData.center
      );
      setMenuOpen(false);
      setShowLogs(true); // Show logs after fetching route
      setShowDown(true); // Show down arrow after fetching route
    } else {
      setError("One or both locations could not be found. Try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (map && pickupCoords && dropoffCoords && currentCoords && routeData) {
      if (!map.isStyleLoaded()) {
        return;
      }

      // Remove existing markers
      markers.forEach((marker) => marker.remove());
      setMarkers([]);

      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(pickupCoords);
      bounds.extend(dropoffCoords);
      bounds.extend(currentCoords);
      map.fitBounds(bounds, { padding: 50 });

      const newMarkers = [
        new mapboxgl.Marker().setLngLat(pickupCoords).addTo(map),
        new mapboxgl.Marker().setLngLat(dropoffCoords).addTo(map),
        new mapboxgl.Marker().setLngLat(currentCoords).addTo(map),
      ];
      setMarkers(newMarkers);

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

  const calcSheet = () => {
    let day = cycle / 24;
    day = Math.ceil(day); // Round up to the nearest integer
    return day;
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex portrait:flex-col h-screen w-full items-center justify-center px-4">
        <div className="landscape:w-1/4 portrait:h-[15%] h-[80%] flex justify-center text-center flex-col items-center">
          <h1 className="lg:text-4xl font-bold">Select Your Locations</h1>
          <span className="text-gray-500 text-sm">
            (Pickup, Dropoff, Current Location)
          </span>
        </div>
        <div className="landscape:w-3/4 w-full portrait:h-[85%] h-[80%] relative">
          <div id="map" className="h-[95%] shadow-lg"></div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="absolute top-4 left-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            ☰
          </button>
          {menuOpen && (
            <div className="absolute top-16 left-4 bg-white p-4 rounded shadow-lg w-64">
              <div className="flex flex-col gap-3">
                <h1 className="text-xl font-bold">Stops</h1>
                <input
                  type="text"
                  placeholder="Current Location"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  className="p-2 border rounded w-full"
                  required
                />
                <input
                  type="text"
                  placeholder="Pickup Location"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="p-2 border rounded w-full"
                  required
                />
                <input
                  type="text"
                  placeholder="Dropoff Location"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  className="p-2 border rounded w-full"
                  required
                />
                <h3 className="font-semibold">Hour Cycle</h3>
                <input
                  type="value"
                  placeholder="Hour Cycle"
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value)}
                  className="p-2 border rounded w-full"
                  required
                />
                <button
                  onClick={handleRoute}
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 w-full flex justify-center items-center"
                >
                  {loading ? <LoadingSpinner /> : "Show Driving Logs"}
                </button>
              </div>
              {error && (
                <div className="w-full bg-red-100 text-red-700 p-4 rounded shadow-lg mt-4">
                  <h2 className="text-lg font-semibold">Error</h2>
                  <p>{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showDown && (
        <button
          onClick={() => handleRefClick()}
          className="fixed bottom-5 right-5 z-50 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition"
        >
          <ArrowDown size={30} />
        </button>
      )}
      {showLogs && (
        <div
          className="w-full flex flex-col items-center justify-center"
          ref={scrollRef}
        >
          <h1 className="lg:text-4xl font-bold">ELD Log Sheets</h1>
          <div className="w-[90%] flex flex-col gap-6">
            {Array.from({ length: calcSheet() }).map((_, index) => (
              <div key={index} className=" border-2 p-4 rounded-lg bg-white">
                <ELDLogChart
                  totalMiles={totalMiles}
                  cycle={cycle}
                  dropoff={dropoff}
                  pickup={pickup}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
