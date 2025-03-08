import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const ELDLogChart = ({ totalMiles, cycle }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: 25 }, (_, i) => `${i}:00`),
        datasets: [
          {
            label: "ELD Log",
            data: generateELDData(totalMiles, cycle),
            borderColor: "black",
            fill: false,
            stepped: true,
            pointRadius: 0,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false, // Disable legend
          },
        },
        scales: {
          x: {
            position: "top", // Move x-axis to the top
            ticks: {
              callback: function (value) {
                if (value === 0 || value === 24) return "Midnight";
                if (value === 12) return "Noon";
                return `${value}:00`;
              },
            },
            grid: {
              display: true,
              drawOnChartArea: true,
              drawTicks: true,
              tickLength: 10,
              lineWidth: 1,
              color: "rgba(0, 0, 0, 0.2)",
            },
          },
          y: {
            ticks: {
              callback: function (value) {
                const statuses = [
                  "Off-Duty",
                  "Sleeper Berth",
                  "Driving",
                  "On-Duty",
                ];
                return statuses[value];
              },
              stepSize: 1,
              max: 3,
            },
            grid: {
              display: true,
              drawOnChartArea: true,
              drawTicks: true,
              tickLength: 10,
              lineWidth: 1,
              color: "rgba(0, 0, 0, 0.2)",
            },
          },
        },
      },
    });

    return () => {
      chart.destroy();
    };
  }, [totalMiles, cycle]);

  const generateELDData = (totalMiles, cycle) => {
    const data = Array(25).fill(0);
    let milesDriven = 0;
    let hour = 0;

    while (milesDriven < totalMiles && hour < 24) {
      // Driving for 11 hours max per day
      for (let i = 0; i < 11 && milesDriven < totalMiles && hour < 24; i++) {
        data[hour] = 2; // Driving
        milesDriven += 100; // Assuming 100 miles per hour
        hour++;
      }

      // 1 hour for fueling every 1,000 miles
      if (milesDriven % 1000 === 0 && hour < 24) {
        data[hour] = 3; // On-Duty (fueling)
        hour++;
      }

      // 1 hour for pickup and drop-off
      if (hour < 24) {
        data[hour] = 3; // On-Duty (pickup/drop-off)
        hour++;
      }

      // 10 hours off-duty
      for (let i = 0; i < 10 && hour < 24; i++) {
        data[hour] = 0; // Off-Duty
        hour++;
      }
    }

    return data;
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md">
      <div className="text-xl font-bold mb-2">ELD Log Chart</div>
      <div className="w-full h-64 bg-white rounded-lg shadow-inner">
        <canvas ref={chartRef} />
      </div>
      <div className="mt-4">
        <div className="text-gray-700">Total Miles: {totalMiles}</div>
        <div className="text-gray-700">Cycle: {cycle} hours</div>
      </div>
    </div>
  );
};

export default ELDLogChart;
