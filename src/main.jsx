if (import.meta.env.DEV) {
  import("react-grab");
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AppSkeletonTheme } from "@/components/ui/skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppSkeletonTheme>
        <App />
      </AppSkeletonTheme>
    </BrowserRouter>
  </StrictMode>
);
