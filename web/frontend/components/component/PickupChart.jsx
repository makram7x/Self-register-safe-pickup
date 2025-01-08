import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";

const DailyPickupsChart = () => {
  const [pickupData, setPickupData] = useState([]);

  useEffect(() => {
    const fetchPickupData = async () => {
      try {
        const response = await axios.get(
          "https://self-register-safe-pickup-production.up.railway.app/api/pickup/logs"
        );
        if (response.data.success) {
          // Group pickups by date
          const pickupsByDate = {};

          response.data.data.forEach((pickup) => {
            const date = new Date(pickup.pickupTime).toLocaleDateString();
            pickupsByDate[date] = (pickupsByDate[date] || 0) + 1;
          });

          // Convert to array format for recharts
          const chartData = Object.entries(pickupsByDate)
            .map(([date, count]) => ({
              date,
              pickups: count,
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-14); // Get last 7 days

          setPickupData(chartData);
        }
      } catch (error) {
        console.error("Error fetching pickup data:", error);
      }
    };

    fetchPickupData();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">
          Daily Pickup Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={pickupData}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pickups" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyPickupsChart;
