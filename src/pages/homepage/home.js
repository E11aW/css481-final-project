import React, { useEffect, useState, useMemo } from 'react';
import './home.scss';

import { MaxWidth } from '../../components/MaxWidth/MaxWidth';
import { TextImage } from '../../components/TextImage/TextImage';
import { IcebergTitle } from '../../components/IcebergTitle/IcebergTitle';
import { SealRoller } from '../../components/SealRoller/SealRoller';
import { Button } from '../../components/Button/Button';
import D3HeatMap from '../../components/D3HeatMap/D3HeatMap';

import GroupPhoto from '../../assets/Home/group-photo.jpg';
import MapofAntartica from '../../assets/Home/Map-of-Antarctica.png';

import { fetchAntarcticaPoints } from '../../back-end/dataSource';

export const Homepage = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load heat map points from backend so it uses the same data layer as the rest of the app
  useEffect(() => {
    async function loadPoints() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAntarcticaPoints();
        // Handle both shapes: [ {nx, ny, value}, ... ] OR { points: [...] }
        const pts = Array.isArray(data) ? data : data.points || [];
        const normalizedPoints = pts.map((p) => ({
          nx: p.nx,
          ny: p.ny,
          value: p.value,
        }));
        setPoints(normalizedPoints);
      } catch (e) {
        console.error(e);
        setError(e.message || 'Failed to load Antarctica heat map data');
      } finally {
        setLoading(false);
      }
    }

    loadPoints();
  }, []);

  // Simple derived stats from the points to power the little info cards
  const heatmapStats = useMemo(() => {
    if (!points || points.length === 0) {
      return {
        count: 0,
        min: null,
        max: null,
        avg: null,
      };
    }

    const values = points.map((p) => typeof p.value === 'number' ? p.value : 0);
    const count = values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / count;

    return { count, min, max, avg };
  }, [points]);

  return (
    <main className="homepage">
      <MaxWidth>
        <IcebergTitle
          title="Tip of the Iceberg"
          subtitle="Going deeper on the impacts of global warming"
        />

        {/* Game Section */}
        <h2 className="game-subheader">Game</h2>
      </MaxWidth>

      <SealRoller />

      <MaxWidth>
        {/* Data Section */}
        <section className="homepage__data">
          <h2 className="subheader-need-padding">Data</h2>

          <div className="homepage__data-layout">
            {/* Left side: explanation + stat cards */}
            <div className="homepage__data-info">
              <h3 className="heat-map-subheader">Antarctica Heat Map</h3>
              <p className="heat-map-description">
                Our heat map focuses on where Antarctica&apos;s ice is under the
                most stress. Each cell aggregates model-based climate intensity
                at a specific region, making it easier to see where warming and
                shifting conditions are likely to have the largest impact.
              </p>

              <div className="heat-map-stats">
                <div className="heat-map-stat">
                  <h4>Regional Coverage</h4>
                  <p>
                    {heatmapStats.count > 0
                      ? `${heatmapStats.count} mapped regions across the continent`
                      : 'Loading regional coverage...'}
                  </p>
                </div>
                <div className="heat-map-stat">
                  <h4>Relative Stress Range</h4>
                  {heatmapStats.min !== null && heatmapStats.max !== null ? (
                    <p>
                      Min: {heatmapStats.min.toFixed(2)} &nbsp;|&nbsp; Max:{' '}
                      {heatmapStats.max.toFixed(2)}
                    </p>
                  ) : (
                    <p>Waiting for climate stress values…</p>
                  )}
                </div>
                <div className="heat-map-stat">
                  <h4>Average Stress Level</h4>
                  {heatmapStats.avg !== null ? (
                    <p>
                      Average intensity:{' '}
                      {heatmapStats.avg.toFixed(2)} (0 = low, 1 = high)
                    </p>
                  ) : (
                    <p>Average intensity will appear once data loads.</p>
                  )}
                </div>
              </div>

              <p className="heat-map-description heat-map-description--secondary">
                Use this as a big-picture overview, then click into the Data
                page to explore detailed climate time series, tables, and your
                own annotations.
              </p>
            </div>

            {/* Right side: heat map card */}
            <div className="heat-map-card">
              {loading && (
                <p className="heat-map-status">Loading heat map data…</p>
              )}
              {error && (
                <p className="heat-map-status heat-map-status--error">
                  {error}
                </p>
              )}
              {!loading && !error && (
                <>
                  <div className="heat-map-visual">
                    <D3HeatMap
                      imageSrc={MapofAntartica}
                      points={points}
                      normalized={true}
                      cellSize={28}
                    />
                  </div>

                  <div className="heat-map-legend">
                    <span className="heat-map-legend__label">Lower stress</span>
                    <span className="heat-map-legend__bar" />
                    <span className="heat-map-legend__label">Higher stress</span>
                  </div>
                </>
              )}

              <Button
                className="button heat-map-button"
                buttonLink="/data"
                buttonText="Explore the Data"
              />
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <h2 className="about-us-subheader">About Us</h2>
        <TextImage
          text="We are a small team of 4 developers working to spread awareness about climate change and its impacts on arctic habitats. We all attend the University of Washington Bothell and completed this website as our final project for a Web Developing class. Our goal was to improve our frontend skills, connecting that with backend data to create a website that is visually interesting while also presenting the important data."
          imageSource={GroupPhoto}
          imageAlt="Development Team"
          hasButton={true}
          buttonText="Learn More!"
          buttonLink="/about-us"
        />
      </MaxWidth>
    </main>
  );
};