import React from "react";
import Dashboard from "./components/Dashboard";

export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Social Aggregator</h1>
      <Dashboard />
    </div>
  );
}
