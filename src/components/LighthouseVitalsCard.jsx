import React from "react";

const colorClasses = {
  green: "text-green-700 border-green-500",
  yellow: "text-yellow-700 border-yellow-500",
  red: "text-red-700 border-red-500",
  gray: "text-gray-600 border-gray-400"
};


const getColor = (key, value) => {
  if (value === null || value === undefined) return "gray";

  if (["performance", "seo", "accessibility", "bestPractices"].includes(key)) {
    return value >= 0.9 ? "green" : value >= 0.5 ? "yellow" : "red";
  }

  if (key === "cls") return value <= 0.1 ? "green" : value <= 0.25 ? "yellow" : "red";
  if (["fcp", "lcp", "speedIndex"].includes(key)) return value <= 2000 ? "green" : value <= 4000 ? "yellow" : "red";
  if (key === "tbt") return value <= 200 ? "green" : value <= 600 ? "yellow" : "red";

  return "gray";
};

export default function LighthouseVitalsCard({ data }) {
  const metrics = [
    ["performance", "Performance", data.performance, "%"],
    ["seo", "SEO", data.seo, "%"],
    ["accessibility", "Accessibility", data.accessibility, "%"],
    ["bestPractices", "Best Practices", data.bestPractices, "%"],
    ["fcp", "First Contentful Paint", data.fcp, "ms"],
    ["lcp", "Largest Contentful Paint", data.lcp, "ms"],
    ["cls", "Cumulative Layout Shift", data.cls, ""],
    ["speedIndex", "Speed Index", data.speedIndex, "ms"],
    ["tbt", "Total Blocking Time", data.tbt, "ms"]
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
      {metrics.map(([key, label, value, unit]) => {
        const color = getColor(key, value);
        const classes = colorClasses[color]; 
        const display =
          value === null || value === undefined
            ? "N/A"
            : unit === "%" ? `${Math.round(value * 100)}%` :
              unit === "ms" ? `${Math.round(value)} ms` : value;

        return (
          <div
            key={key}
            className={`p-4 rounded-xl border-l-4 shadow bg-white ${classes}-500`}
          >
            <div className="text-sm text-gray-600 font-semibold">{label}</div>
            <div className={`text-xl font-bold text-${classes}-700`}>{display}</div>
          </div>
        );
      })}
    </div>
  );
}
