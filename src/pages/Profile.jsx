import axios from "axios";
import { memo,  useCallback, useState, useRef } from "react";
import * as Papa from "papaparse";

const Profile = () => {
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [total, setTotal] = useState(0);
  const fileInputRef = useRef(null);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const PROFILE_API = `${API_BASE}/api/trustpilot-profile`;

  // Parse CSV file and extract URLs
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvFile(file);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const urls = [];
        
        results.data.forEach((row) => {
          // Look for URL in any column (case-insensitive)
          Object.values(row).forEach((value) => {
            if (typeof value === 'string' && value.includes('trustpilot.com')) {
              // Clean the URL
              const cleanUrl = value.trim().replace(/["']/g, '');
              if (cleanUrl && !urls.includes(cleanUrl)) {
                urls.push(cleanUrl);
              }
            }
          });
        });

        if (urls.length === 0) {
          setError("No TrustPilot URLs found in the CSV file");
          setUploadedUrls([]);
        } else {
          setUploadedUrls(urls);
          setError(`Found ${urls.length} TrustPilot URLs`);
        }
      },
      error: (error) => {
        setError("Error parsing CSV file: " + error.message);
      }
    });
  };

  const fetchData = useCallback(async () => {
  if (!API_BASE) {
    setError("API base URL not defined");
    return;
  }

  if (uploadedUrls.length === 0) {
    setError("Please upload a CSV file with URLs first");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const response = await axios.post(PROFILE_API, {
      urls: uploadedUrls,
    });

    const processedResults =
      response.data?.results?.map((profile) => ({
        url: profile.url || "Not Found",
        name: profile.name || "Not Found",
        description: profile.description || "Not Found",
        address: profile.address || "Not Found",
        phone: profile.phone || "Not Found",
        email: profile.email || "Not Found",
        website: profile.website || "Not Found",
      })) || [];

    setProfiles(processedResults);
    setTotal(response.data?.total || 0);
  } catch (err) {
    console.error("API Error:", err);
    setError(
      "Failed to load profiles. " +
        (err.response?.data?.message || err.message)
    );
  } finally {
    setLoading(false);
  }
}, [uploadedUrls, API_BASE]);
  // Download data as CSV
  const downloadCSV = () => {
    if (profiles.length === 0) {
      setError("No data to download");
      return;
    }

    // Define CSV headers
    const headers = [
      "URL",
      "Company Name",
      "Description",
      "Address",
      "Phone",
      "Email",
      "Website"
    ];

    // Prepare data rows
    const csvData = profiles.map(profile => [
      profile.url,
      profile.name,
      profile.description,
      profile.address,
      profile.phone,
      profile.email,
      profile.website
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map(cell => 
          // Escape quotes and wrap in quotes if contains comma or quotes
          cell.includes(',') || cell.includes('"') || cell.includes('\n')
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        ).join(',')
      )
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `trustpilot_profiles_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all data
  const clearData = () => {
    setProfiles([]);
    setUploadedUrls([]);
    setCsvFile(null);
    setTotal(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ color: "#333", marginBottom: "30px" }}>
        TrustPilot Profile Extractor
      </h2>

      {/* File Upload Section */}
      <div style={{ 
        border: "2px dashed #ccc", 
        padding: "30px", 
        textAlign: "center",
        marginBottom: "20px",
        borderRadius: "10px",
        backgroundColor: "#f9f9f9"
      }}>
        <h3>Step 1: Upload CSV File</h3>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          Upload a CSV file containing TrustPilot URLs. The system will automatically detect URLs.
        </p>
        
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          ref={fileInputRef}
          style={{
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            backgroundColor: "white"
          }}
        />
        
        {csvFile && (
          <div style={{ marginTop: "15px" }}>
            <p>
              <strong>Selected File:</strong> {csvFile.name}
            </p>
            {uploadedUrls.length > 0 && (
              <p>
                <strong>URLs Found:</strong> {uploadedUrls.length}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        marginBottom: "30px",
        flexWrap: "wrap"
      }}>
        <button
          onClick={fetchData}
          disabled={uploadedUrls.length === 0 || loading}
          style={{
            padding: "12px 24px",
            backgroundColor: uploadedUrls.length === 0 ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: uploadedUrls.length === 0 ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            minWidth: "200px"
          }}
        >
          {loading ? "Loading..." : "Find Details"}
        </button>
        
        <button
          onClick={downloadCSV}
          disabled={profiles.length === 0}
          style={{
            padding: "12px 24px",
            backgroundColor: profiles.length === 0 ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: profiles.length === 0 ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            minWidth: "200px"
          }}
        >
          Download CSV ({profiles.length})
        </button>
        
        <button
          onClick={clearData}
          style={{
            padding: "12px 24px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            minWidth: "200px"
          }}
        >
          Clear All
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: error.includes("Failed") ? "#f8d7da" : "#fff3cd",
          border: error.includes("Failed") ? "1px solid #f5c6cb" : "1px solid #ffeaa7",
          color: error.includes("Failed") ? "#721c24" : "#856404",
          padding: "15px",
          borderRadius: "5px",
          marginBottom: "20px"
        }}>
          {error}
        </div>
      )}

      {/* Stats Display */}
      {(uploadedUrls.length > 0 || profiles.length > 0) && (
        <div style={{
          backgroundColor: "#e8f4fd",
          padding: "15px",
          borderRadius: "5px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap"
        }}>
          <div>
            <strong>Uploaded URLs:</strong> {uploadedUrls.length}
          </div>
          <div>
            <strong>Profiles Found:</strong> {profiles.length}
          </div>
          <div>
            <strong>Total Records:</strong> {total}
          </div>
        </div>
      )}

      {/* Results Display */}
      {profiles.length > 0 && (
        <div>
          <h3 style={{ marginBottom: "20px" }}>Extracted Profiles</h3>
          <div style={{ 
            overflowX: "auto",
            border: "1px solid #ddd",
            borderRadius: "5px"
          }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              minWidth: "800px"
            }}>
              <thead>
                <tr style={{ backgroundColor: "#f2f2f2" }}>
                  <th style={{ padding: "12px", borderBottom: "2px solid #ddd", textAlign: "left" }}>#</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #ddd", textAlign: "left" }}>Company Name</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #ddd", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #ddd", textAlign: "left" }}>Phone</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #ddd", textAlign: "left" }}>Website</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #ddd", textAlign: "left" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile, index) => (
                  <tr key={index} style={{ 
                    borderBottom: "1px solid #ddd",
                    backgroundColor: index % 2 === 0 ? "white" : "#f9f9f9"
                  }}>
                    <td style={{ padding: "12px" }}>{index + 1}</td>
                    <td style={{ padding: "12px" }}>
                      <strong>{profile.name}</strong>
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                        {profile.url}
                      </div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      {profile.email !== "Not Found" ? (
                        <a href={`mailto:${profile.email}`} style={{ color: "#007bff" }}>
                          {profile.email}
                        </a>
                      ) : (
                        <span style={{ color: "#999", fontStyle: "italic" }}>Not Found</span>
                      )}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {profile.phone !== "Not Found" ? (
                        <a href={`tel:${profile.phone}`} style={{ color: "#007bff" }}>
                          {profile.phone}
                        </a>
                      ) : (
                        <span style={{ color: "#999", fontStyle: "italic" }}>Not Found</span>
                      )}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {profile.website !== "Not Found" ? (
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: "#007bff" }}
                        >
                          Visit Website
                        </a>
                      ) : (
                        <span style={{ color: "#999", fontStyle: "italic" }}>Not Found</span>
                      )}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        backgroundColor: Object.values(profile).some(val => val === "Not Found") 
                          ? "#ffc107" 
                          : "#28a745",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "3px",
                        fontSize: "12px"
                      }}>
                        {Object.values(profile).some(val => val === "Not Found") 
                          ? "Partial" 
                          : "Complete"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Raw JSON View (Collapsible) */}
          <details style={{ marginTop: "30px" }}>
            <summary style={{ 
              cursor: "pointer", 
              padding: "10px",
              backgroundColor: "#f5f5f5",
              borderRadius: "5px",
              fontWeight: "bold"
            }}>
              View Raw JSON Data
            </summary>
            <pre style={{
              backgroundColor: "#282c34",
              color: "#abb2bf",
              padding: "20px",
              borderRadius: "5px",
              overflow: "auto",
              maxHeight: "400px",
              marginTop: "10px"
            }}>
              {JSON.stringify({ success: true, total: total, results: profiles }, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Instructions */}
      {profiles.length === 0 && !error && (
        <div style={{
          backgroundColor: "#f0f8ff",
          padding: "20px",
          borderRadius: "10px",
          marginTop: "30px",
          border: "1px solid #d1ecf1"
        }}>
          <h3 style={{ color: "#0c5460", marginBottom: "15px" }}>How to use:</h3>
          <ol style={{ lineHeight: "1.8", color: "#666" }}>
            <li>Upload a CSV file containing TrustPilot URLs</li>
            <li>Click "Find Details" to extract profile information</li>
            <li>View the extracted data in the table</li>
            <li>Download the results as CSV file</li>
          </ol>
          <p style={{ marginTop: "15px", color: "#666" }}>
            <strong>Note:</strong> The CSV file should contain TrustPilot URLs in any column.
            Missing data will be marked as "Not Found".
          </p>
        </div>
      )}
    </div>
  );
};

export default memo(Profile);