import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const ELDLogChart = ({ totalMiles, cycle, dropoff, pickup }) => {
  const chartRef = useRef(null);

  const capitalizeFirstLetter = (string) => {
    if (string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  };

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: 25 }, (_, i) => `${i}`),
        datasets: [
          {
            label: "ELD Log",
            data: generateELDData(totalMiles, cycle),
            borderColor: "black",
            fill: false,
            stepped: true,
            pointRadius: 0,
            borderWidth: 7,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            position: "top",
            min: 0,
            max: 24,
            ticks: {
              callback: function (value) {
                if (value === 0 || value === 24) return ["Mid-", "night"];
                if (value === 12) return "Noon";
                return value % 12 || 12;
              },
              stepSize: 1,
              autoSkip: false,
              font: {
                size: 14,
              },
              color: "black",
              rotation: 0,
              minRotation: 0,
              maxRotation: 0,
            },
            grid: {
              display: true,
              drawOnChartArea: true,
              drawTicks: true,
              tickLength: 0,
              lineWidth: 2,
              color: "black",
            },
          },
          y: {
            min: 0,
            max: 3,
            position: "left",
            reverse: true,
            ticks: {
              callback: function (value) {
                const statuses = [
                  "1. Off-Duty",
                  "2. Sleeper Berth",
                  "3. Driving",
                  "4. On-Duty (not driving)",
                ];
                return statuses[value];
              },
              stepSize: 1,
              font: {
                size: 16,
              },
              color: "black",
              crossAlign: "far",
              padding: 10,
            },
            grid: {
              display: true,
              drawOnChartArea: true,
              drawTicks: true,
              tickLength: 0,
              lineWidth: 2,
              color: "black",
            },
          },
        },
      },
      plugins: [
        {
          id: "customGridLines",
          beforeDraw: (chart) => {
            const ctx = chart.ctx;
            const chartArea = chart.chartArea;

            for (let i = 0; i < 24; i++) {
              for (let j = 0; j <= 3; j++) {
                const x = chart.scales.x.getPixelForValue(i);
                const nextX = chart.scales.x.getPixelForValue(i + 1);
                const y = chart.scales.y.getPixelForValue(j);
                const nextY = chart.scales.y.getPixelForValue(j + 1);

                // Hücre merkezini bulmak için ortalama değerler
                const centerX = (x + nextX) / 2;
                const centerY = (y + nextY) / 2;

                // Kısa dikey çizgi (hücrenin sol kenarında)
                ctx.beginPath();
                ctx.moveTo(x + 2, centerY - 5);
                ctx.lineTo(x + 2, centerY + 5);
                ctx.strokeStyle = "black";
                ctx.lineWidth = 1;
                ctx.stroke();

                // Kısa dikey çizgi (hücrenin sağ kenarında)
                ctx.beginPath();
                ctx.moveTo(nextX - 2, centerY - 5);
                ctx.lineTo(nextX - 2, centerY + 5);
                ctx.strokeStyle = "black";
                ctx.lineWidth = 1;
                ctx.stroke();

                // Uzun dikey çizgi (hücrenin ortasında)
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - 10);
                ctx.lineTo(centerX, centerY + 10);
                ctx.strokeStyle = "black";
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            }
          },
        },
      ],
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
      <div className="flex items-center mb-6">
        <span className="text-2xl font-bold">Drivers Daily Log</span>
        <span className="text-gray-500 text-sm ml-2">(24 hours)</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-gray-700 text-xl font-bold">From:</h3>
          <p className="">{capitalizeFirstLetter(pickup)}</p>
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-gray-700 text-xl font-bold">To:</h3>
          <p className="">{capitalizeFirstLetter(dropoff)}</p>
        </div>
        <div>
          <label className="block text-gray-700 font-bold">
            Total Miles Driving Today: {totalMiles}
          </label>
        </div>
        <div>
          <label className="block text-gray-700 font-bold">
            Total Mileage Today:
          </label>
          <input type="text" className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-gray-700 font-bold">
            Truck/Tractor and Trailer Numbers or License Plates/State: {}
          </label>
        </div>
        <div>
          <label className="block text-gray-700 font-bold">
            Name of Carrier or Carriers:
          </label>
          <input type="text" className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-gray-700 font-bold">
            Main Office Address:
          </label>
          <input type="text" className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-gray-700 font-bold">
            Home Terminal Address:
          </label>
          <input type="text" className="w-full border rounded p-2" />
        </div>
      </div>
      <div className="w-full h-96 bg-white rounded-lg shadow-inner">
        <canvas ref={chartRef} /> {/* Increased width and height */}
      </div>
      <div className="mt-4">
        <div className="text-gray-700">Total Miles: {totalMiles}</div>
        <div className="text-gray-700">
          Cycle: {cycle} {cycle > 1 ? "hours" : "hour"}
        </div>
      </div>
    </div>
  );
};

export default ELDLogChart;
