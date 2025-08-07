import React, { useEffect, useState } from 'react';
import './Search.css';
import { useLocation } from 'react-router-dom';

const Search = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const query = params.get('q');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    setLoading(true);

    // Replace this with your real API or local search logic
    fetch(`/api/recipes/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        setResults(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Search failed:', err);
        setLoading(false);
      });

  }, [query]);

  return (
    <div className="search-page">
      <h1>ผลการค้นหา</h1>
      <p>ค้นหาคำว่า: <strong>{query}</strong></p>

      {loading && <p>กำลังค้นหา...</p>}

      {!loading && results.length === 0 && (
        <p>ไม่พบสูตรอาหารที่ตรงกับคำค้นนี้</p>
      )}

      <ul className="results-list">
        {results.map((item, index) => (
          <li key={index}>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Search;
