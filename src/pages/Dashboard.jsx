import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
const API_BASE = import.meta.env.VITE_API_BASE_URL;
console.log("API_BASE:", API_BASE);

  // ✅ Fetch data
  const fetchData = async (customLimit = limit) => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(
      `${API_BASE}/api/scrape?query=restaurants&location=New York&limit=${customLimit}`
    );
    if (!res.ok) throw new Error("Failed to fetch data");
    const result = await res.json();
    const newData = result.data || [];
    setData(newData);
    setFilteredData(newData);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Debounced search (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  // ✅ Filter data based on debounced search
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setFilteredData(data);
    } else {
      const lower = debouncedSearch.toLowerCase();
      const filtered = data.filter(
        (item) =>
          (item.name && item.name.toLowerCase().includes(lower)) ||
          (item.address && item.address.toLowerCase().includes(lower)) ||
          (item.category && item.category.toLowerCase().includes(lower)) ||
          (item.phone && item.phone.toLowerCase().includes(lower))
      );
      setFilteredData(filtered);
    }
  }, [debouncedSearch, data]);

  // ✅ CSV Download with safe check
  const downloadCSV = (customData) => {
    if (!customData.length) return alert("No data to export!");
    if (customData.length > 10000) {
      return alert(
        "Data too large to export on frontend. Use smaller limit or server-side export."
      );
    }
    const csvRows = [];
    const headers = Object.keys(customData[0]);
    csvRows.push(headers.join(","));
    customData.forEach((row) => {
      const values = headers.map((h) => JSON.stringify(row[h] ?? ""));
      csvRows.push(values.join(","));
    });
    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(blob, `restaurants_${Date.now()}.csv`);
  };

  // ✅ Excel Download with safe check
  const downloadExcel = (customData) => {
    if (!customData.length) return alert("No data to export!");
    if (customData.length > 10000) {
      return alert(
        "Data too large to export on frontend. Use smaller limit or server-side export."
      );
    }
    const worksheet = XLSX.utils.json_to_sheet(customData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Restaurants");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `restaurants_${Date.now()}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 text-center sm:text-left">
          🍽️ Restaurant Finder
        </h1>

        <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 sm:gap-3">
          <input
            type="number"
            className="border border-gray-300 rounded-lg px-3 py-2 w-24 sm:w-28 text-sm focus:ring-2 focus:ring-blue-500"
            value={limit}
            onChange={(e) => {
              let val = Number(e.target.value);
              if (val > 1000) {
                alert("Maximum limit allowed is 1000 for performance reasons.");
                val = 1000;
              }
              setLimit(val);
            }}
            placeholder="Limit"
            min="1"
          />
          <button
            onClick={() => fetchData()}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            Refresh
          </button>
          <button
            onClick={() => downloadCSV(filteredData)}
            className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
          >
            ⬇️ CSV
          </button>
          <button
            onClick={() => downloadExcel(filteredData)}
            className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm hover:bg-orange-700 transition"
          >
            ⬇️ Excel
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search name, address, category, or phone..."
          className="w-full sm:w-2/3 lg:w-1/2 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600 text-lg">Loading...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-red-500 text-lg font-semibold text-center py-10">
          ⚠️ {error}
        </div>
      )}

      {/* Data Table / Cards */}
      {!loading && !error && filteredData.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Address</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-100 transition border-b border-gray-200"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {item.name || "Unnamed"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.address || "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.category || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.phone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredData.map((item, i) => (
              <div
                key={i}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-800 text-base">
                    {i + 1}. {item.name || "Unnamed"}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    📍 {item.address || "N/A"}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    🍽️ {item.category || "-"}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    ☎️ {item.phone || "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data */}
      {!loading && !error && filteredData.length === 0 && (
        <p className="text-center text-gray-500 text-lg mt-10">
          No restaurants found.
        </p>
      )}
    </div>
  );
}
