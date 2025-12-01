// src/pages/game/game.js
import { useEffect, useRef } from "react";
import "./game.scss";
import { createGame } from "./gameCore";

// Game Theme Colors (must match game.scss)
const COLORS = {
  gameBgLight: "#cfeefc",
  gameBgSky: "#cbe2e8",
  gameBgGradientTop: "#6ba3c5",
  gameBgGradientBottom: "#a8d8ff",
  sunColor: "#fff6b8",
  hillsDistant: "#d0effb",
  hillsMid: "#b6e3f7",
  hillsForeground: "#89d3f1",
  iceLight: "#eaf6ff",
  iceEdge: "#d7f0ff",
  iceParticleAlpha: 0.6,
  titleDark: "#06414a",
  titleBlue: "#0a82b4",
  lossRed: "#c41e3a",
  lossRedDark: "#8b1428",
  lossRedHover: "#ff3a4a",
  lossRedHoverDark: "#d41c34",
  warningRed: "#c41e3a",
  warningOverlayAlpha: 0.15,
  cloudWhite: "#ffffff",
};

// (CLIMATE_FACTS moved to gameUtils)

export const Game = () => {
  const canvasRef = useRef(null);
  const scoreRef = useRef(null);
  const pauseBtnRef = useRef(null);
  const restartBtnRef = useRef(null);
  const touchBtnRef = useRef(null);
  const startControlsRef = useRef(null);
  const startDomRef = useRef(null);
  const demoDomRef = useRef(null);
  const fsBtnRef = useRef(null);
  
  useEffect(() => {
    const cleanup = createGame({
      canvas: canvasRef.current,
      scoreDisplay: scoreRef.current,
      pauseBtn: pauseBtnRef.current,
      restartBtn: restartBtnRef.current,
      touchBtn: touchBtnRef.current,
      startControls: startControlsRef.current,
      startBtnEl: startDomRef.current,
      demoBtnEl: demoDomRef.current,
      fsBtn: fsBtnRef.current,
      COLORS,
    });
    return cleanup;
  }, []);

  return (
    <main className="game">
      <div className="gameRoot">
        <header className="gameHeader">
          <div className="title">Save The Seal</div>
          <div id="score-display" ref={scoreRef}></div>
          <div className="control-buttons">
            <button ref={restartBtnRef} id="restartBtn" title="Restart">
              🔄
            </button>
            <button ref={pauseBtnRef} id="pauseBtn" title="Pause/Resume">
              ⏸️
            </button>
            <button
              ref={fsBtnRef}
              className="fs-btn"
              id="fsBtn"
              title="Toggle Fullscreen"
            >
              ⤢
            </button>
          </div>
        </header>

        <canvas ref={canvasRef} id="c" />
        {/* DOM overlay for accessible Start/Demo controls */}
        <div
          ref={startControlsRef}
          className="start-controls"
          role="dialog"
          aria-modal="true"
          style={{ display: "flex" }}
        ></div>
        <div ref={touchBtnRef} id="touchButton" aria-hidden="true">
          HOLD
        </div>

        <div id="toolbar" />
      </div>
    </main>
  );
};
