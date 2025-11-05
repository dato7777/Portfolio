import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Input } from "@material-tailwind/react";

const categories = ["Geography", "Science", "History", "Technology", "Literature"];
const letters = ["A", "B", "C", "D"];

const QuizProAI = () => {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [fadeOutOthers, setFadeOutOthers] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHow, setShowHow] = useState(false);

  // NEW: custom category
  const [customCategory, setCustomCategory] = useState("");
  const [catError, setCatError] = useState("");

  const catBtnBase =
    "text-indigo-800 text-xl font-semibold capitalize rounded-full px-6 py-3 " +
    "transition duration-200 transform " +
    "shadow-lg hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 hover:brightness-110 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300";

  useEffect(() => {
    if (loading) {
      let percent = 0;
      const interval = setInterval(() => {
        if (percent < 100) {
          percent += 1;
          const el = document.getElementById("loading-percentage");
          if (el) el.innerText = percent + "%";
        } else {
          clearInterval(interval);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    if (questions.length > 0 && Object.keys(selectedOptions).length === questions.length) {
      setTimeout(() => {
        setQuestions([]);
        setSelectedOptions({});
        setSelectedCategory(null);
        setFadeOutOthers(false);
      }, 2000);
    }
  }, [selectedOptions, questions]);

  const handleCategoryClick = (category) => {
    if (!selectedCategory) {
      setSelectedCategory(category);
      setCatError("");

      setTimeout(() => setFadeOutOthers(true), 2000);
      setTimeout(() => fetchQuestions(category), 3000);
    }
  };

  const fetchQuestions = async (category) => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/quizproai/generate-questions/",
        { category },
        { headers: { "Content-Type": "application/json" } }
      );
      const data = JSON.parse(res.data);
      setQuestions(data);
    } catch (err) {
      console.error(err);
      // show backend validation message if any
      const msg = err?.response?.data?.detail || "Failed to load questions.";
      alert(msg);
      // reset state if backend rejected the category
      setSelectedCategory(null);
      setFadeOutOthers(false);
    } finally {
      setLoading(false);
    }
  };

  // small info card wrapper
  const InfoCard = ({ children }) => (
    <div className="mx-auto max-w-3xl mt-6 text-left bg-white/10 backdrop-blur rounded-xl p-4 shadow-lg">
      {children}
    </div>
  );

  const startCustom = () => {
    const cat = customCategory.trim();
    if (!cat) {
      setCatError("Please enter a category.");
      return;
    }
    // simple client-side guard; server does the real validation
    if (cat.length < 3 || cat.length > 40) {
      setCatError("Category should be 3–40 characters.");
      return;
    }
    handleCategoryClick(cat);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 to-purple-800 text-white p-6">
      <div className="max-w-3xl mx-auto text-center mt-12">
        <h1 className="text-4xl font-bold mb-3">QuizProAI</h1>

        <p className="mb-4 text-lg">
          {selectedCategory ? `Category: ${selectedCategory}` : "Choose a category to begin your challenge:"}
        </p>

        {/* How it works */}
        {!selectedCategory && !questions.length && (
          <InfoCard>
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-full bg-indigo-500/20 px-3 py-1.5">
                <span className="text-indigo-200 font-bold">i</span>
              </div>
              <div className="text-indigo-50/90">
                <p className="font-semibold">How it works</p>
                <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
                  <li>Pick a category (or add your own) to start.</li>
                  <li>The server returns <strong>5 unused</strong> questions from a database.</li>
                  <li>If the pool is empty, the server generates <strong>10 new</strong> with OpenAI, stores them, and serves 5.</li>
                  <li>Questions are cleaned & deduped; the correct answer is the <em>actual option text</em> (not just A/B/C/D).</li>
                </ul>

                <button
                  onClick={() => setShowHow((v) => !v)}
                  className="mt-3 text-xs underline underline-offset-2 text-indigo-200 hover:text-white"
                >
                  {showHow ? "Hide prompt example" : "Show prompt example"}
                </button>

                {showHow && (
                  <pre className="mt-3 text-xs bg-black/30 p-3 rounded-lg overflow-x-auto text-indigo-100">
{`Return ONLY a JSON array of 10 items (no commentary).
Category: "<chosen category>"

Each item:
{
  "level": 1,
  "question": "under 220 chars",
  "options": ["option text 1", "option text 2", "option text 3", "option text 4"],
  "answer": "option text 1"
}

Rules:
- Options are unlabeled (no A./B./C./D.).
- "answer" must be EXACTLY one of the strings in "options".
- Make all 10 questions mutually different.`}
                  </pre>
                )}
              </div>
            </div>
          </InfoCard>
        )}

        {/* Preset categories */}
        {!fadeOutOthers && !questions.length && (
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => handleCategoryClick(category)}
                color="white"
                size="lg"
                disabled={!!selectedCategory && selectedCategory !== category}
                className={`
                  ${catBtnBase}
                  ${selectedCategory === category ? "animate-blink-fast" : ""}
                  ${selectedCategory && selectedCategory !== category ? "opacity-0 scale-0" : ""}
                `}
              >
                {category}
              </Button>
            ))}
          </div>
        )}

        {/* Custom category input */}
        {/* Custom category input */}
{!fadeOutOthers && !questions.length && (
  <div className="mt-10 max-w-2xl mx-auto text-center">
    <p className="text-2xl font-semibold text-white mb-6 drop-shadow-lg tracking-wide">
      OR&nbsp;<span className="text-yellow-300"> enter category</span>&nbsp;you want to be tested in:
    </p>

    <div className="relative group flex justify-center">
      <input
        type="text"
        value={customCategory}
        onChange={(e) => {
          setCatError("");
          setCustomCategory(e.target.value);
        }}
        placeholder="Type your custom topic here..."
        className="w-full max-w-lg text-2xl text-center font-bold text-indigo-100 placeholder-indigo-300 
                   bg-white/10 border-2 border-indigo-400/30 rounded-full px-6 py-4 
                   backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-yellow-300/50 
                   focus:border-yellow-300 shadow-md transition-all duration-300 
                   group-hover:shadow-yellow-400/40"
      />

      {/* optional decorative glow ring */}
      <div className="absolute inset-0 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition-all duration-300 bg-gradient-to-r from-indigo-400 to-yellow-400 pointer-events-none"></div>
    </div>

    <Button
      color="white"
      size="lg"
      onClick={startCustom}
      className="mt-6 text-indigo-800 text-xl font-semibold rounded-full px-8 py-3 
                 bg-yellow-300 hover:bg-yellow-400 hover:shadow-xl hover:scale-105 
                 transition-all duration-300"
      disabled={!!selectedCategory}
    >
      Start
    </Button>

    {catError && (
      <p className="text-red-300 text-sm mt-3 font-semibold animate-pulse">
        {catError}
      </p>
    )}

    {/* Live preview of user input */}
    {customCategory && (
      <p className="mt-8 text-3xl font-bold text-white drop-shadow-md tracking-wide animate-fade-in">
        “{customCategory}”
      </p>
    )}
  </div>
)}


        {/* Selected category badge */}
        {fadeOutOthers && selectedCategory && !questions.length && (
          <div className="mt-6 flex justify-center">
            <Button color="white" size="lg" className={`${catBtnBase}`}>
              {selectedCategory}
            </Button>
          </div>
        )}

        {/* Preparing note */}
        {fadeOutOthers && selectedCategory && !questions.length && !loading && (
          <InfoCard>
            <p className="text-indigo-50/90 text-sm">
              Preparing your quiz… If there aren’t enough unused questions saved in the database,
              the server will generate 10 fresh ones with OpenAI, store them, and send you 5 now.
            </p>
          </InfoCard>
        )}

        {/* Loading bar */}
        {loading && (
          <div className="mt-6 text-lg">
            <p>Loading questions...</p>
            <div className="relative w-full bg-gray-200 rounded-full h-6 mt-4 overflow-hidden">
              <div className="bg-yellow-400 h-6 rounded-full text-center text-black font-bold text-sm flex items-center justify-center loading-bar">
                <span id="loading-percentage">0%</span>
              </div>
            </div>
          </div>
        )}

        {/* Explainer */}
        {questions.length > 0 && (
          <InfoCard>
            <p className="text-indigo-50/90 text-sm">
              You’re seeing 5 questions from the “{selectedCategory}” pool. The letters A/B/C/D are added here for display,
              but correctness is checked against the exact answer string saved on the server.
            </p>
          </InfoCard>
        )}

        {/* Questions */}
        {questions.length > 0 && (
          <div className="mt-6 space-y-8">
            {questions.map((q, idx) => {
              const selectedOption = selectedOptions[idx];
              const isCorrect = selectedOption === q.answer;

              return (
                <div key={idx} className="text-left bg-white bg-opacity-10 p-4 rounded-lg shadow-md">
                  <p className="text-lg font-bold mb-2">Level {q.level}: {q.question}</p>

                  {selectedOption && (
                    <p className={`mb-2 font-semibold ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                      {isCorrect ? "Correct!" : "Wrong answer"}
                    </p>
                  )}

                  <ul className="space-y-2">
                    {q.options.map((option, i) => (
                      <li
                        key={i}
                        onClick={() => {
                          if (!selectedOption) {
                            setSelectedOptions({ ...selectedOptions, [idx]: option });
                          }
                        }}
                        className={`
                          rounded px-3 py-2 cursor-pointer transition
                          ${selectedOption
                            ? option === q.answer
                              ? "bg-green-600"
                              : option === selectedOption
                                ? "bg-red-600"
                                : "bg-indigo-700"
                            : "bg-indigo-700 hover:bg-indigo-600"}
                        `}
                      >
                        <strong className="mr-2">{letters[i]}.</strong> {option}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {questions.length > 0 && Object.keys(selectedOptions).length === questions.length && (
          <p className="text-center text-xl font-bold mt-4">
            You completed the quiz! Returning to category selection...
          </p>
        )}
      </div>
    </div>
  );
};

export default QuizProAI;
