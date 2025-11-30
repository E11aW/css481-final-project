// src/pages/home.js
import React, { useEffect, useState } from 'react';
import './home.scss';

import D3HeatMap from '../../components/D3HeatMap/D3HeatMap';
import { fetchAntarcticaPoints } from '../../back-end/dataSource';

// adjust the path/filename to wherever your image actually is:
import MapofAntartica from '../../assets/Home/Map-of-Antarctica.png';

import { Button } from '../../components/Button/Button'; // if you have a Button component

function Home() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPoints() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAntarcticaPoints();

        // Handle both shapes:
        //   [{...}, {...}]  OR  { note, points: [...] }
        const pts = Array.isArray(data) ? data : data.points || [];
        setPoints(pts);
      } catch (e) {
        console.error(e);
        setError(e.message || 'Failed to load Antarctica data');
      } finally {
        setLoading(false);
      }
    }

    loadPoints();
  }, []);

  return (
    <div className="home">
      <section className="home__hero">
        <div className="home__hero-text">
          <h1 className="home__title">Tip of the Iceberg</h1>
          <p className="home__subtitle">
            Explore how a warming world is reshaping Antarctica&apos;s ice.
          </p>

          <div className="home__highlights">
            <div className="home__highlight">
              <h3>Why Antarctica?</h3>
              <p>
                Antarctica holds around 90% of the world&apos;s ice. Small
                changes here can mean big changes in global sea level.
              </p>
            </div>
            <div className="home__highlight">
              <h3>What you&apos;re seeing</h3>
              <p>
                Each cell on the map represents a region of the continent.
                Brighter colors indicate stronger climate stress — places where
                warming and ice loss are most pronounced.
              </p>
            </div>
            <div className="home__highlight">
              <h3>Dig into the data</h3>
              <p>
                Head to the Data page to explore real Arctic climate time series,
                filter by year, and annotate trends with your own notes.
              </p>
            </div>
          </div>

          <div className="home__cta-row">
            <Button
              className="home__cta-button"
              buttonLink="/data"
              buttonText="Explore the data"
            />
            <span className="home__cta-note">
              Live climate data powered by the Open-Meteo Climate API.
            </span>
          </div>
        </div>

        <div className="home__hero-visual">
          <div className="home__heatmap-card">
            <div className="home__heatmap-header">
              <h2>Antarctica Heat Map</h2>
              <p>Relative climate stress across the continent.</p>
            </div>

            {loading && (
              <div className="home__heatmap-status">Loading map…</div>
            )}
            {error && (
              <div className="home__heatmap-status home__heatmap-status--error">
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="home__heatmap-wrapper">
                <D3HeatMap
                  imageSrc={MapofAntartica}
                  points={points}
                  normalized={true}
                  cellSize={28}
                />
              </div>
            )}

            <div className="home__legend">
              <span className="home__legend-label">Lower stress</span>
              <span className="home__legend-gradient" />
              <span className="home__legend-label">Higher stress</span>
            </div>

            <p className="home__heatmap-footnote">
              This visualization uses modeled values to highlight regions where
              conditions place the most pressure on Antarctic ice. Melting here
              contributes directly to global sea-level rise.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;