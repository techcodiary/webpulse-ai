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

       // 2. Fetch Lighthouse scores
    const lighthouseResponse = await fetch("http://localhost:5000/lighthouse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const lighthouseData = await lighthouseResponse.json();

    const formatMs = (val) => val ? `${Math.round(val)} ms` : "N/A";
    const formatScore = (val) => val ? `${Math.round(val * 100)}%` : "N/A";


      setMetrics([...metrics, analyzeData.metrics]);

      // Create combined insights string
    const combinedInsights = `
AI Insight:
${analyzeData.insight}

Lighthouse Scores:
- Performance: ${lighthouseData.performance ? Math.round(lighthouseData.performance * 100) + "%" : "N/A"}
- SEO: ${lighthouseData.seo ? Math.round(lighthouseData.seo * 100) + "%" : "N/A"}
- Accessibility: ${lighthouseData.accessibility ? Math.round(lighthouseData.accessibility * 100) + "%" : "N/A"}
- Best Practices: ${lighthouseData.bestPractices ? Math.round(lighthouseData.bestPractices * 100) + "%" : "N/A"}

Core Web Vitals:
- FCP (First Contentful Paint): ${formatMs(lighthouseData.fcp)}
- LCP (Largest Contentful Paint): ${formatMs(lighthouseData.lcp)}
- CLS (Cumulative Layout Shift): ${lighthouseData.cls ?? "N/A"}
- Speed Index: ${formatMs(lighthouseData.speedIndex)}
- TBT (Total Blocking Time): ${formatMs(lighthouseData.tbt)}
    `.trim();

      
      setInsights(combinedInsights);
      setUrls([...urls, url]);
      setUrl("");
    } catch (error) {
      setInsights("Error: " + error.message);
    }
  };

  return (
    <div className="p-6">
  <div className="flex flex-col lg:flex-row gap-6">
    <div className="flex-1 space-y-6">
      <Card className="w-full max-w-2xl">
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

      <Card className="w-full max-w-4xl">
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

    <div className="w-full lg:w-1/3">
      <Card className="h-full">
        <CardContent className="p-4 space-y-4">
          <h2 className="text-xl font-bold">AI-Generated Insights</h2>
          <Textarea
            readOnly
            value={insights}
            className="min-h-[400px] h-full resize-none"
          />
        </CardContent>
      </Card>
    </div>
  </div>
</div>

  );
}
