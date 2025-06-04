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
  const [aiInsights, setAIInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [results, setResults] = useState(null);

  const isValidUrl = (url) => {
    const urlRegex = /^(https?:\/\/)?([a-z\d.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return urlRegex.test(url);
  };

  const handleSubmit = async () => {

    setError(""); 
    setResult(null); 
    setResults(null);

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL.");
      return;
    }

    setLoading(true);

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
    setInsights([...insights, analyzeData.insights]);
    setAIInsights(lighthouseData.aiInsights || []);
    
      setUrls([...urls, url]);
      setUrl("");
    //3. Analyze meta response
    const meta_response = await fetch('http://localhost:5000/analyze-meta-tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

      if (!meta_response.ok) {
        throw new Error('Failed to fetch analysis results');
      }
      const metaData = await response.json();
      setResults(metaData);
      console.log("meta==>"+metaData);

    } catch (error) {
      setInsights("Error: " + error.message);
    } finally {
      setLoading(false); 
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
              placeholder="Enter Website URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
            />
            <Button 
              variant="secondary" 
              onClick={handleSubmit}
              disabled={loading}
              className={`px-4 py-2 rounded ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
              }`}
              >
                {loading ? "Analyzing..." : "Analyze"}
            </Button>
            {loading && (
              <div className="flex justify-center mt-4">
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

          {error && <p className="mt-4 text-red-500">{error}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="p-4">
        <h2 className="text-xl font-bold">AI-Generated Insights</h2>
          <Textarea
            readOnly
            value={aiInsights}
            className="min-h-[100px] h-full resize-none"
          />
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="p-4">
        <div style={{ padding: '20px' }}>
        <h2 className="text-xl font-bold">Meta Tag Analysis</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {results && (
          <div style={{ marginTop: '20px' }}>
            <h2>Analysis Results</h2>
            <p><strong>Title:</strong> {results.title}</p>
            <p><strong>Description:</strong> {results.description}</p>
            <p><strong>Keywords:</strong> {results.keywords}</p>
            <p><strong>Key Phrases:</strong></p>
            <ul>
              {results.key_phrases.map((phrase, index) => (
                <li key={index}>{phrase}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
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

    </div>

  </div>
</div>

  );
}
