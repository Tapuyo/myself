import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Nav } from "./components/Nav";
import CallPage from "./pages/CallPage";
import ContactPage from "./pages/ContactPage";
import Home from "./pages/Home";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-white">
        <Nav />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/call" element={<CallPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
