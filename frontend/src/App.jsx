import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function App() {
  const [drugName, setDrugName] = useState('');
  const [foodName, setFoodName] = useState('');
  
  const [drugSuggestions, setDrugSuggestions] = useState([]);
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  const [showFoodDropdown, setShowFoodDropdown] = useState(false);
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch Drug Suggestions
  useEffect(() => {
    if (drugName.length >= 1 && showDrugDropdown) {
      axios.get(`http://127.0.0.1:8000/suggestions?query=${encodeURIComponent(drugName)}`)
        .then((res) => setDrugSuggestions(res.data))
        .catch(() => setDrugSuggestions([]));
    } else {
      setDrugSuggestions([]);
    }
  }, [drugName, showDrugDropdown]);

  // Fetch Food Suggestions
  useEffect(() => {
    if (foodName.length >= 1 && showFoodDropdown) {
      axios.get(`http://127.0.0.1:8000/suggestions?query=${encodeURIComponent(foodName)}`)
        .then((res) => setFoodSuggestions(res.data))
        .catch(() => setFoodSuggestions([]));
    } else {
      setFoodSuggestions([]);
    }
  }, [foodName, showFoodDropdown]);

  // Autotype completion handlers
  const handleSelectDrug = (val) => {
    setDrugName(val);
    setShowDrugDropdown(false);
  };

  const handleSelectFood = (val) => {
    setFoodName(val);
    setShowFoodDropdown(false);
  };

  // Keyboard navigation for inline autotype (Tab or Right Arrow to complete)
  const handleKeyDownDrug = (e) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && drugSuggestions.length > 0) {
      e.preventDefault();
      setDrugName(drugSuggestions[0]);
      setShowDrugDropdown(false);
    }
  };

  const handleKeyDownFood = (e) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && foodSuggestions.length > 0) {
      e.preventDefault();
      setFoodName(foodSuggestions[0]);
      setShowFoodDropdown(false);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('http://127.0.0.1:8000/predict', {
        drug_name: drugName,
        food_name: foodName,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Structure non-resolvable.');
    } finally {
      setLoading(false);
    }
  };

  const pieData = result ? {
    labels: ['Safe Baseline', 'Interaction Risk'],
    datasets: [{
      data: [result.probabilities['Safe'], result.probabilities['Interaction Risk']],
      backgroundColor: ['#00ff66', '#ff0055'],
      borderColor: '#010409',
      borderWidth: 2,
    }],
  } : null;

  const barData = result ? {
    labels: Object.keys(result.metrics),
    datasets: [
      {
        label: result.drug,
        data: Object.values(result.metrics).map(m => m.Drug),
        backgroundColor: '#00e5ff',
        borderRadius: 4,
      },
      {
        label: result.food,
        data: Object.values(result.metrics).map(m => m.Food),
        backgroundColor: '#00ff66',
        borderRadius: 4,
      },
    ],
  } : null;

  // Inline Ghost Text Preview logic for Drug & Food
  const drugGhost = (drugSuggestions.length > 0 && drugName.length > 0 && drugSuggestions[0].toLowerCase().startsWith(drugName.toLowerCase()))
    ? drugName + drugSuggestions[0].slice(drugName.length)
    : '';

  const foodGhost = (foodSuggestions.length > 0 && foodName.length > 0 && foodSuggestions[0].toLowerCase().startsWith(foodName.toLowerCase()))
    ? foodName + foodSuggestions[0].slice(foodName.length)
    : '';

  return (
    <div className="gemini-container">
      <div className="gemini-card">
        
        <div style={{ textAlign: 'center' }}>
          <div className="gemini-badge">SYSTEM READY // ML-ENGINE</div>
          <h1 className="gemini-title">Drug-Food Interaction Checker</h1>
          <p className="gemini-subtitle">Analyze chemical compatibility and safety risks between compounds</p>
        </div>

        <form onSubmit={handlePredict}>
          <div className="input-grid">
            
            {/* Drug Compound Input with Inline Autotype Ghosting */}
            <div style={{ position: 'relative' }}>
              <label className="input-label">
                Drug Compound {drugGhost && <span className="autotype-hint">(Press Tab to autotype)</span>}
              </label>
              <div className="autotype-wrapper">
                {drugGhost && <input type="text" className="gemini-input ghost-input" value={drugGhost} disabled />}
                <input
                  type="text"
                  value={drugName}
                  onChange={(e) => {
                    setDrugName(e.target.value);
                    setShowDrugDropdown(true);
                  }}
                  onKeyDown={handleKeyDownDrug}
                  onFocus={() => setShowDrugDropdown(true)}
                  placeholder="e.g. Aspirin"
                  required
                  className="gemini-input real-input"
                />
              </div>

              {showDrugDropdown && drugSuggestions.length > 0 && (
                <div className="autotype-dropdown">
                  {drugSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="autotype-item"
                      onMouseDown={() => handleSelectDrug(item)}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Food Compound Input with Inline Autotype Ghosting */}
            <div style={{ position: 'relative' }}>
              <label className="input-label">
                Food Compound {foodGhost && <span className="autotype-hint">(Press Tab to autotype)</span>}
              </label>
              <div className="autotype-wrapper">
                {foodGhost && <input type="text" className="gemini-input ghost-input" value={foodGhost} disabled />}
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => {
                    setFoodName(e.target.value);
                    setShowFoodDropdown(true);
                  }}
                  onKeyDown={handleKeyDownFood}
                  onFocus={() => setShowFoodDropdown(true)}
                  placeholder="e.g. Caffeine"
                  required
                  className="gemini-input real-input"
                />
              </div>

              {showFoodDropdown && foodSuggestions.length > 0 && (
                <div className="autotype-dropdown">
                  {foodSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="autotype-item"
                      onMouseDown={() => handleSelectFood(item)}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <button type="submit" disabled={loading} className="gemini-btn">
            {loading ? 'PROCESSING STRUCTURES...' : 'RUN ANALYTICS MATRIX'}
          </button>
        </form>

        {error && (
          <div className="result-banner danger" style={{ justifyContent: 'center' }}>
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div>
            <div className={`result-banner ${result.prediction === 1 ? 'danger' : 'safe'}`}>
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Analysis Verdict
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  {result.result}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Confidence Index</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  {result.confidence}%
                </div>
              </div>
            </div>

            <div className="chart-grid">
              <div className="gemini-chart-card">
                <h3 className="chart-title">Probability Ratio</h3>
                <div style={{ width: '100%', maxWidth: '240px', margin: '0 auto' }}>
                  <Pie 
                    data={pieData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 11 } }
                        }
                      }
                    }} 
                  />
                </div>
              </div>

              <div className="gemini-chart-card">
                <h3 className="chart-title">Molecular Comparison</h3>
                <Bar 
                  data={barData} 
                  options={{ 
                    responsive: true, 
                    plugins: { legend: { labels: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 11 } } } },
                    scales: {
                      x: { ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 10 } }, grid: { display: false } },
                      y: { ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: '#21262d' } }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;