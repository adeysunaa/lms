import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const Quiz = ({ quiz, courseId, chapterId, onComplete, backendUrl, getToken }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit * 60); // Convert to seconds
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // Security: Disable right-click, text selection, copy, and keyboard shortcuts
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleSelectStart = (e) => e.preventDefault();
    const handleCopy = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        (e.ctrlKey && e.key === "U") ||
        (e.ctrlKey && e.key === "S")
      ) {
        e.preventDefault();
        toast.warning("This action is not allowed during quiz");
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("keydown", handleKeyDown);

    // Disable tab switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.error("You cannot switch tabs during the quiz!");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Disable screenshot (attempt)
    const handleKeyPress = (e) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        toast.warning("Screenshots are not allowed");
      }
    };
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (submitted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, submitted]);

  const handleAnswerSelect = (answer) => {
    if (submitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitted) return;

    try {
      const token = await getToken();
      const answers = quiz.questions.map(
        (_, index) => selectedAnswers[index] || ""
      );

      const { data } = await axios.post(
        backendUrl + "/api/user/submit-quiz",
        {
          courseId,
          chapterId,
          quizId: quiz.quizId,
          answers,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setResult(data);
        setSubmitted(true);
        if (data.passed && onComplete) {
          onComplete(true);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (result) {
    return (
      <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/20">
        <div className="text-center">
          <div
            className={`text-6xl mb-4 ${
              result.passed ? "text-green-400" : "text-red-400"
            }`}
          >
            {result.passed ? "✓" : "✗"}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {result.passed ? "Quiz Passed!" : "Quiz Failed"}
          </h2>
          <p className="text-white/70 mb-4">
            Your Score: {result.score.toFixed(1)}%
          </p>
          <p className="text-white/60">
            {result.correctAnswers} out of {result.totalQuestions} questions
            correct
          </p>
          <p className="text-white/60 mt-2">
            Passing Score: {quiz.passingScore}%
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          {quiz.quizTitle}
        </h2>
        <div className="text-white/80 font-semibold">
          Time: {formatTime(timeRemaining)}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-white/70 mb-2">
          <span>
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
          <span>
            Passing Score: {quiz.passingScore}%
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
            style={{
              width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-white mb-4">
          {currentQuestion.question}
        </h3>
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedAnswers[currentQuestionIndex] === option
                  ? "border-blue-500 bg-blue-500/20 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 rounded-lg bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
        >
          Previous
        </button>
        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitted}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;

