import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Inscription from "./pages/Inscription";
import Villa from "./pages/Villa";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ScrollToHash from "./components/ScrollToHash";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<Inscription />} />
        <Route path="/villa" element={<Villa />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
