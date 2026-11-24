// Clickjacking guard: static hosts without X-Frame-Options can't forbid framing,
// so refuse to run inside someone else's frame.
if (window.top !== window.self) {
  try {
    window.top!.location.href = window.self.location.href;
  } catch {
    document.documentElement.innerHTML = "";
  }
  throw new Error("Framing is not allowed");
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./i18n";
import { initTheme } from "./lib/theme";

initTheme();
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
