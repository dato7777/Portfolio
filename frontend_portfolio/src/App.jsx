import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import About from "./pages/about";
import Home from "./pages/home";
import MyNavbar from "./components/Navbar";
import Projects from "./pages/projects/projects";
import QuizProAI from "./pages/projects/quizProAi";
import Weather from "./pages/projects/weather";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Contact from "./pages/Contact";
import SmartFileOrganizer from "./pages/projects/SmartFileOrganizer";
import BuySmart from "./pages/projects/BuySmart";
import ScrollToTop from "./pages/projects/ScrollToTop";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <MyNavbar />
      <div className="min-h-dvh w-full overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route
            path="/projects/quizProAi"
            element={
              <ProtectedRoute>
                <QuizProAI />
              </ProtectedRoute>
            }
          />
          <Route path="/projects/weather" element={<Weather />} />
          <Route path="/projects/smartfileorganizer" element={<SmartFileOrganizer />} />
          <Route path="/projects/buysmart" element={<BuySmart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
