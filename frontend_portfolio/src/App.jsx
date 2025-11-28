import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import About from "./pages/About";
import Home from "./pages/home";
import MyNavbar from "./components/Navbar"; // This is your Material Tailwind navbar
import Projects from "./pages/projects/projects";
import QuizProAI from "./pages/projects/quizProAi";
import Weather from "./pages/projects/weather";
import ScrollToTop from "./pages/projects/ScrollToTop";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Contact from "./pages/Contact";

function App() {
  return (
    <Router>
      {/* Keep navbar outside of container to avoid max-width conflicts */}
      <MyNavbar />
      <div className="max-w-screen-xl mx-auto px-4 mt-6">
        {/* <ScrollToTop /> */}
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
          <Route path="/projects/weather" element={< Weather />} />
          <Route path="/login" element={< Login />} />
          <Route path="/contact" element={< Contact />} />

          {/* Add more routes like /projects, /contact later */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
