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
            pointRadius: (context) => {
              const index = context.dataIndex;
              const data = context.dataset.data;
              if (
                index === 0 ||
                index === data.length - 1 ||
                data[index] !== data[index - 1] ||
                data[index] !== data[index + 1]
              ) {
                return 5; // Show point at the corners and status changes
              }
              return 0; // Hide point on the line
            },
          },
        ],
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: "Time (Hours)",
            },
            grid: {
              display: true,
              drawOnChartArea: true,
              drawTicks: true,
              tickLength: 10,
              lineWidth: 1,
              color: (context) => {
                const index = context.tick.index;
                if (index % 2 === 0) {
                  return "rgba(0, 0, 0, 0.2)"; // Short lines color
                }
                return "rgba(0, 0, 0, 0.5)"; // Long lines color
              },
            },
          },
          y: {
            title: {
              display: true,
              text: "Status",
            },
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
            },
            grid: {
              display: true,
              drawOnChartArea: true,
              drawTicks: true,
              tickLength: 10,
              lineWidth: 1,
              color: (context) => {
                const index = context.tick.index;
                if (index % 2 === 0) {
                  return "rgba(0, 0, 0, 0.2)"; // Short lines color
                }
                return "rgba(0, 0, 0, 0.5)"; // Long lines color
              },
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
    <div>
      <canvas ref={chartRef} />
    </div>
  );
};

export default ELDLogChart;
