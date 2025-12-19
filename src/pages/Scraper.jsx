import { useState } from "react";
import axios from "axios";

export default function Scraper() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);

 const handleScrape = async () => {
  try {
    const apiUrl = `http://192.168.100.42:4000/api/google-map?query=${encodeURIComponent(
      query
    )}&location=London&limit=10`;

    console.log("Calling:", apiUrl);

    const res = await axios.get(apiUrl);
    setResult(res.data);
  } catch (error) {
    console.log("API ERROR:", error.response?.data || error.message);
    setResult({ error: error.response?.data || error.message });
  }
};


  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Scraper Tool</h1>
      <p className="text-gray-600 mb-4">Use the form below to fetch website data.</p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Enter search query... (e.g. coffee shops)"
          className="border p-2 rounded w-full md:w-1/2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <button
          onClick={handleScrape}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Scrape Now
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-semibold mb-2">API Response:</h2>
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
