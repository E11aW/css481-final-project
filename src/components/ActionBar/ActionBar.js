// src/components/ActionBar/ActionBar.js
import "./ActionBar.scss";

export default function ActionBar({ children }) {
  return <div className="actionBar">{children}</div>;
}

// Optional: item wrapper to force each button to size to its content
export function Item({ children }) {
  return <span className="actionBar__item">{children}</span>;
}