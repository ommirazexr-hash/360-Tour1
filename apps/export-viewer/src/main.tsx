import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { TourViewer } from './TourViewer';
import './index.css';

function App() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read the self-contained tour.json file placed in the same directory
    fetch('./tour.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load tour.json configuration');
        return res.json();
      })
      .then((data) => {
        setData(data);
      })
      .catch((err) => {
        console.error('Error fetching tour.json:', err);
        setError(err.message || 'Error loading tour data');
      });
  }, []);

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-sans p-6 text-center">
        <div className="max-w-md p-6 bg-slate-900 border border-red-500/20 rounded-2xl shadow-xl">
          <h3 className="text-xl font-bold text-red-500 mb-2">Error Loading Tour</h3>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <p className="text-xs text-slate-500">Please make sure the exported tour folder contains a valid <code className="bg-slate-950 px-1 py-0.5 rounded">tour.json</code> file.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Loading Virtual Tour...</p>
        </div>
      </div>
    );
  }

  return <TourViewer data={data} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
