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
import LighthouseVitalsCard from "./LighthouseVitalsCard";


export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [insights, setInsights] = useState("");
  const [metrics, setMetrics] = useState([]);
  const [lighthouse, setLighthouse] = useState(null);
  const [recommendations, setRecommendations] = useState([]);


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

       // 2. Fetch Lighthouse scores
    const lighthouseResponse = await fetch("http://localhost:5000/lighthouse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const lighthouseData = await lighthouseResponse.json();
    setLighthouse(lighthouseData);
    setRecommendations(lighthouseData.recommendations || []);

    setMetrics([...metrics, analyzeData.metrics]);
    
      setUrls([...urls, url]);
      setUrl("");
    } catch (error) {
      setInsights("Error: " + error.message);
    }
  };

  return (
<div className="w-full p-6">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
    
    {/* Left Column */}
    <div className="space-y-6 w-full">
      <Card className="w-full">
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

      <Card className="w-full">
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

    {/* Right Column */}
    <div className="space-y-6 w-full">
      {lighthouse && <LighthouseVitalsCard data={lighthouse} />}
      {recommendations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">AI Recommendations</h2>
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="p-4 rounded-md bg-yellow-50 border-l-4 border-yellow-400 shadow">
                <h3 className="text-lg font-semibold">{rec.title}</h3>
                <p className="text-sm text-gray-700">{rec.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card className="h-full w-full">
        <CardContent className="p-4 space-y-4">
          <h2 className="text-xl font-bold">AI-Generated Insights</h2>
          <Textarea
            readOnly
            value={insights}
            className="min-h-[500px] h-full resize-none"
          />
        </CardContent>
      </Card>
    </div>

  </div>
</div>





  );
}
