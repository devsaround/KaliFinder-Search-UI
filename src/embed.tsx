import React from "react";
import ReactDOM from "react-dom/client";
// import EmbeddableKalifindSearch from "./components/KalifindSearch";
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("kalifind-search-container");

if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      {/* <EmbeddableKalifindSearch /> */}
      <App />
    </React.StrictMode>,
  );
} else {
  console.error('Could not find element with id "kalifind-search-container"');
}
