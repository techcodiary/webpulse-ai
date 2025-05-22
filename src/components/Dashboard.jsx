import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [insights, setInsights] = useState("");
  const [metrics, setMetrics] = useState([]);

  const handleSubmit = async () => {
    if (!url) return;

    try {

      // 1. Fetch AI insights + basic metrics
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const analyzeData = await response.json();
      if (analyzeData.error) throw new Error(analyzeData.error);

      setMetrics([...metrics, analyzeData.metrics]);
      setInsights(analyzeData.insight);
      setUrls([...urls, url]);
      setUrl("");
    } catch (error) {
      setInsights("Error: " + error.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-4 space-y-4">
          <h2 className="text-xl font-bold">Enter Website URL</h2>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button variant="secondary" onClick={handleSubmit}>Analyze</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-4">
          <h2 className="text-xl font-bold mb-2">AI-Generated Insights</h2>
          <Textarea readOnly value={insights} className="min-h-[100px]" />
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-4">
          <h2 className="text-xl font-bold mb-4">Website Metrics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="visits" fill="#8884d8" name="Visits" />
              <Bar dataKey="bounceRate" fill="#82ca9d" name="Bounce Rate" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
