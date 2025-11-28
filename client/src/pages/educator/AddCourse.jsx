import React, { useContext, useEffect, useRef, useState } from "react";
import uniqid from "uniqid";
import Quill from "quill";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";

const AddCourse = () => {
  const { backendUrl, getToken, fetchAllCourses } = useContext(AppContext);
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const [courseTitle, setCourseTitle] = useState("");
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [image, setImage] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showQuizPopup, setShowQuizPopup] = useState(false);
  const [showFinalAssessmentPopup, setShowFinalAssessmentPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [currentQuizChapterId, setCurrentQuizChapterId] = useState(null);
  const [currentFinalAssessmentChapterId, setCurrentFinalAssessmentChapterId] = useState(null);
  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: "",
    lectureDuration: "",
    lectureUrl: "",
    isPreviewFree: false,
  });
  const [quizDetails, setQuizDetails] = useState({
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
  });
  const [finalAssessmentDetails, setFinalAssessmentDetails] = useState({
    title: "Final Assessment",
    description: "",
    questions: [],
    passingScore: 70,
    timeLimit: 0,
  });
  const [currentAssessmentQuestion, setCurrentAssessmentQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
  });

  const handleChapter = (action, chapterId) => {
    if (action === "add") {
      const title = prompt("Enter Chapter Name: ");
      if (title) {
        const newChapter = {
          chapterId: uniqid(),
          chapterTitle: title,
          chapterContent: [],
          quizzes: [],
          finalAssessment: null,
          collapsed: false,
          chapterOrder:
            chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
        };
        setChapters([...chapters, newChapter]);
      }
    } else if (action === "remove") {
      setChapters(
        chapters.filter((chapter) => chapter.chapterId !== chapterId)
      );
    } else if (action === "toggle") {
      setChapters(
        chapters.map((chapter) =>
          chapter.chapterId === chapterId
            ? { ...chapter, collapsed: !chapter.collapsed }
            : chapter
        )
      );
    }
  };

  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === "add") {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    } else if (action === "remove") {
      setChapters(
        chapters.map((chapter) => {
          if (chapter.chapterId === chapterId) {
            chapter.chapterContent.splice(lectureIndex, 1);
          }
          return chapter;
        })
      );
    }
  };

  const handleQuiz = (action, chapterId, quizIndex) => {
    if (action === "add") {
      setCurrentQuizChapterId(chapterId);
      setShowQuizPopup(true);
    } else if (action === "remove") {
      setChapters(
        chapters.map((chapter) => {
          if (chapter.chapterId === chapterId) {
            chapter.quizzes.splice(quizIndex, 1);
          }
          return chapter;
        })
      );
    }
  };

  const addLecture = () => {
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentChapterId) {
          const newLecture = {
            ...lectureDetails,
            lectureOrder:
              chapter.chapterContent.length > 0
                ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1
                : 1,
            lectureId: uniqid(),
          };
          chapter.chapterContent.push(newLecture);
        }
        return chapter;
      })
    );
    setShowPopup(false);
    setLectureDetails({
      lectureTitle: "",
      lectureDuration: "",
      lectureUrl: "",
      isPreviewFree: false,
    });
  };

  const addQuiz = () => {
    // Validation: Check if question and all options are filled
    if (!quizDetails.question.trim()) {
      toast.error('Please enter a question');
      return;
    }
    
    if (quizDetails.options.some(opt => !opt.trim())) {
      toast.error('Please fill all options');
      return;
    }
    
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentQuizChapterId) {
          const newQuiz = {
            quizId: uniqid(),
            question: quizDetails.question.trim(),
            options: quizDetails.options.map(opt => opt.trim()),
            correctAnswer: quizDetails.correctIndex, // Map correctIndex to correctAnswer
          };
          chapter.quizzes = chapter.quizzes ? [...chapter.quizzes, newQuiz] : [newQuiz];
        }
        return chapter;
      })
    );
    setShowQuizPopup(false);
    setQuizDetails({
      question: "",
      options: ["", "", "", ""],
      correctIndex: 0,
    });
  };

  const addAssessmentQuestion = () => {
    if (!currentAssessmentQuestion.question.trim()) {
      toast.error('Please enter a question');
      return;
    }
    
    if (currentAssessmentQuestion.options.some(opt => !opt.trim())) {
      toast.error('Please fill all options');
      return;
    }
    
    const newQuestion = {
      quizId: uniqid(),
      question: currentAssessmentQuestion.question.trim(),
      options: currentAssessmentQuestion.options.map(opt => opt.trim()),
      correctAnswer: currentAssessmentQuestion.correctIndex,
    };
    
    setFinalAssessmentDetails({
      ...finalAssessmentDetails,
      questions: [...finalAssessmentDetails.questions, newQuestion],
    });
    
    setCurrentAssessmentQuestion({
      question: "",
      options: ["", "", "", ""],
      correctIndex: 0,
    });
  };

  const removeAssessmentQuestion = (questionIndex) => {
    setFinalAssessmentDetails({
      ...finalAssessmentDetails,
      questions: finalAssessmentDetails.questions.filter((_, idx) => idx !== questionIndex),
    });
  };

  const saveFinalAssessment = () => {
    if (!finalAssessmentDetails.title.trim()) {
      toast.error('Please enter an assessment title');
      return;
    }
    
    if (finalAssessmentDetails.questions.length === 0) {
      toast.error('Please add at least one question to the assessment');
      return;
    }
    
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentFinalAssessmentChapterId) {
          chapter.finalAssessment = {
            assessmentId: uniqid(),
            title: finalAssessmentDetails.title.trim(),
            description: finalAssessmentDetails.description.trim(),
            questions: finalAssessmentDetails.questions,
            passingScore: Number(finalAssessmentDetails.passingScore),
            timeLimit: Number(finalAssessmentDetails.timeLimit),
          };
        }
        return chapter;
      })
    );
    
    setShowFinalAssessmentPopup(false);
    setFinalAssessmentDetails({
      title: "Final Assessment",
      description: "",
      questions: [],
      passingScore: 70,
      timeLimit: 0,
    });
    toast.success('Final assessment saved successfully');
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      if (!image) {
        toast.error("Thumbnail Not Selected");
      }

      const courseData = {
        courseTitle,
        courseDescription: quillRef.current.root.innerHTML,
        coursePrice: Number(coursePrice),
        discount: Number(discount),
        courseContent: chapters,
      };

      const formData = new FormData();
      formData.append("courseData", JSON.stringify(courseData));
      formData.append("image", image);

      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/educator/add-course",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        // Refresh the course list to show new course
        await fetchAllCourses();
        setCourseTitle("");
        setCoursePrice(0);
        setDiscount(0);
        setImage(null);
        setChapters([]);
        quillRef.current.root.innerHTML = "";
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    //Initiate Quill only once
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
      });
    }
  }, []);

  return (
    <div className="min-h-screen overflow-y-auto w-full px-4 md:px-10 py-8 text-white">
      <form
        onSubmit={handleSubmit}
        className="glass-card border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-6 w-full max-w-4xl mx-auto backdrop-blur-2xl"
      >
        <div className="text-center space-y-2">
          <p className="uppercase text-xs tracking-[0.5em] text-white/60">
            Course Builder
          </p>
          <h2 className="text-2xl font-semibold">Add a New Course</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Course Title</label>
            <input
              onChange={(e) => setCourseTitle(e.target.value)}
              value={courseTitle}
              type="text"
              placeholder="e.g., Modern React Bootcamp"
              className="glass-input border border-white/15 rounded-2xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Course Thumbnail</label>
            <label
              htmlFor="thumbnailImage"
              className="glass-input border border-white/15 rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-white/40 transition"
            >
              <i className="ri-upload-cloud-2-line text-2xl text-white/80"></i>
              <div className="flex-1">
                <p className="text-sm text-white/70">
                  {image ? image.name : "Upload an image"}
                </p>
                <p className="text-xs text-white/40">JPG or PNG</p>
              </div>
              <input
                type="file"
                id="thumbnailImage"
                onChange={(e) => setImage(e.target.files[0])}
                accept="image/*"
                hidden
              />
              {image && (
                <img
                  src={URL.createObjectURL(image)}
                  alt="preview"
                  className="w-10 h-10 rounded-lg object-cover border border-white/20"
                />
              )}
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Course Description</label>
          <div
            ref={editorRef}
            className="glass-input border border-white/15 rounded-2xl px-3 py-2 text-white"
          ></div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Price</label>
            <input
              onChange={(e) => setCoursePrice(e.target.value)}
              value={coursePrice}
              type="number"
              placeholder="0"
              className="glass-input border border-white/15 rounded-2xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Discount %</label>
            <input
              onChange={(e) => setDiscount(e.target.value)}
              value={discount}
              type="number"
              placeholder="0"
              min={0}
              max={100}
              className="glass-input border border-white/15 rounded-2xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Chapters</h3>
            <button
              type="button"
              className="glass-button border border-white/20 rounded-full px-4 py-2 text-sm text-white"
              onClick={() => handleChapter("add")}
            >
              + Add Chapter
            </button>
          </div>
          {chapters.map((chapter, chapterIndex) => (
            <div
              key={chapter.chapterId}
              className="glass-card border border-white/10 rounded-2xl mb-4"
            >
              <div className="flex justify-between items-center p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleChapter("toggle", chapter.chapterId)}
                    className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition ${
                      chapter.collapsed ? "-rotate-90" : ""
                    }`}
                  >
                    <i className="ri-arrow-down-s-line text-lg"></i>
                  </button>
                  <div>
                    <p className="font-semibold">{chapter.chapterTitle}</p>
                    <span className="text-xs text-white/60">
                      {chapter.chapterContent.length} Lectures
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChapter("remove", chapter.chapterId)}
                  className="text-white/60 hover:text-red-400"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              {!chapter.collapsed && (
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    {chapter.chapterContent.map((lecture, lectureIndex) => (
                      <div
                        key={lecture.lectureId}
                        className="flex justify-between items-center py-2 text-sm text-white/80 border-b border-white/10 last:border-b-0"
                      >
                        <div>
                          <p className="font-medium">{lecture.lectureTitle}</p>
                          <p className="text-white/60">
                            {lecture.lectureDuration} mins ·{" "}
                            <a
                              href={lecture.lectureUrl}
                              target="_blank"
                              className="text-blue-300 underline"
                            >
                              Link
                            </a>{" "}
                            · {lecture.isPreviewFree ? "Free Preview" : "Paid"}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-white/60 hover:text-red-400"
                          onClick={() =>
                            handleLecture("remove", chapter.chapterId, lectureIndex)
                          }
                        >
                          <i className="ri-delete-bin-line text-lg"></i>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="glass-button border border-white/20 rounded-full px-4 py-2 text-sm mt-3"
                      onClick={() => handleLecture("add", chapter.chapterId)}
                    >
                      + Add Lecture
                    </button>
                  </div>
                  <div className="border-t border-white/10 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Quizzes</p>
                      <button
                        type="button"
                        className="text-xs glass-button border border-white/20 rounded-full px-3 py-1"
                        onClick={() => handleQuiz("add", chapter.chapterId)}
                      >
                        + Add Quiz
                      </button>
                    </div>
                    {(chapter.quizzes || []).length === 0 && (
                      <p className="text-xs text-white/50">
                        No quizzes added yet.
                      </p>
                    )}
                    {(chapter.quizzes || []).map((quiz, quizIndex) => (
                      <div
                        key={quiz.quizId || quizIndex}
                        className="space-y-2 py-2 text-sm text-white/80 border-b border-white/10 last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <p className="font-medium">{quiz.question}</p>
                          <button
                            type="button"
                            className="text-white/60 hover:text-red-400"
                            onClick={() =>
                              handleQuiz("remove", chapter.chapterId, quizIndex)
                            }
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        </div>
                        <div className="space-y-1 pl-2">
                          {quiz.options?.map((option, idx) => (
                            <div
                              key={idx}
                              className={`text-xs ${
                                idx === quiz.correctIndex
                                  ? "text-green-300"
                                  : "text-white/60"
                              }`}
                            >
                              {idx + 1}. {option}
                              {idx === quiz.correctIndex && " (Correct)"}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/10 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Final Assessment</p>
                      <button
                        type="button"
                        className="text-xs glass-button border border-white/20 rounded-full px-3 py-1"
                        onClick={() => {
                          setCurrentFinalAssessmentChapterId(chapter.chapterId);
                          if (chapter.finalAssessment) {
                            setFinalAssessmentDetails({
                              title: chapter.finalAssessment.title || "Final Assessment",
                              description: chapter.finalAssessment.description || "",
                              questions: chapter.finalAssessment.questions || [],
                              passingScore: chapter.finalAssessment.passingScore || 70,
                              timeLimit: chapter.finalAssessment.timeLimit || 0,
                            });
                          } else {
                            setFinalAssessmentDetails({
                              title: "Final Assessment",
                              description: "",
                              questions: [],
                              passingScore: 70,
                              timeLimit: 0,
                            });
                          }
                          setShowFinalAssessmentPopup(true);
                        }}
                      >
                        {chapter.finalAssessment ? "Edit Assessment" : "+ Add Final Assessment"}
                      </button>
                    </div>
                    {chapter.finalAssessment ? (
                      <div className="space-y-2 py-2 text-sm text-white/80">
                        <p className="font-medium">{chapter.finalAssessment.title}</p>
                        <p className="text-xs text-white/60">
                          {chapter.finalAssessment.questions?.length || 0} questions · 
                          Passing Score: {chapter.finalAssessment.passingScore}% · 
                          {chapter.finalAssessment.timeLimit > 0 
                            ? `Time Limit: ${chapter.finalAssessment.timeLimit} mins`
                            : "No time limit"}
                        </p>
                        <button
                          type="button"
                          className="text-xs text-red-400 hover:text-red-300"
                          onClick={() => {
                            setChapters(
                              chapters.map((ch) =>
                                ch.chapterId === chapter.chapterId
                                  ? { ...ch, finalAssessment: null }
                                  : ch
                              )
                            );
                          }}
                        >
                          Remove Assessment
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-white/50">
                        No final assessment added yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {showPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur">
              <div className="glass-card border border-white/10 rounded-3xl p-6 w-full max-w-md relative text-white">
                <h2 className="text-lg font-semibold mb-4">Add Lecture</h2>
                <div className="mb-2">
                  <p className="text-sm text-white/70">Lecture Title</p>
                  <input
                    type="text"
                    className="mt-1 block w-full glass-input border border-white/20 rounded-2xl py-2 px-3"
                    value={lectureDetails.lectureTitle}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        lectureTitle: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mb-2">
                  <p className="text-sm text-white/70">Duration (minutes)</p>
                  <input
                    type="number"
                    className="mt-1 block w-full glass-input border border-white/20 rounded-2xl py-2 px-3"
                    value={lectureDetails.lectureDuration}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        lectureDuration: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mb-2">
                  <p className="text-sm text-white/70">Lecture URL</p>
                  <input
                    type="text"
                    className="mt-1 block w-full glass-input border border-white/20 rounded-2xl py-2 px-3"
                    value={lectureDetails.lectureUrl}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        lectureUrl: e.target.value,
                      })
                    }
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-white/70 my-3">
                  <input
                    type="checkbox"
                    className="scale-125 accent-blue-400"
                    checked={lectureDetails.isPreviewFree}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        isPreviewFree: e.target.checked,
                      })
                    }
                  />
                  Free Preview
                </label>
                <button
                  onClick={addLecture}
                  type="button"
                  className="w-full glass-button border border-white/20 rounded-full py-3 mt-4 text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowPopup(false)}
                  className="absolute top-4 right-4 text-white/60 hover:text-white"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>
          )}
          {showQuizPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur">
              <div className="glass-card border border-white/10 rounded-3xl p-6 w-full max-w-md relative text-white">
                <h2 className="text-lg font-semibold mb-4">Add Quiz</h2>
                <div className="mb-2">
                  <p className="text-sm text-white/70">Question</p>
                  <input
                    type="text"
                    className="mt-1 block w-full glass-input border border-white/20 rounded-2xl py-2 px-3"
                    value={quizDetails.question}
                    onChange={(e) =>
                      setQuizDetails({ ...quizDetails, question: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-white/70">Options</p>
                  {quizDetails.options.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={quizDetails.correctIndex === idx}
                        onChange={() =>
                          setQuizDetails({ ...quizDetails, correctIndex: idx })
                        }
                        className="accent-blue-400"
                      />
                      <input
                        type="text"
                        className="flex-1 glass-input border border-white/20 rounded-2xl py-2 px-3"
                        placeholder={`Option ${idx + 1}`}
                        value={option}
                        onChange={(e) =>
                          setQuizDetails({
                            ...quizDetails,
                            options: quizDetails.options.map((opt, i) =>
                              i === idx ? e.target.value : opt
                            ),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={addQuiz}
                  type="button"
                  className="w-full glass-button border border-white/20 rounded-full py-3 mt-4 text-sm"
                >
                  Add Quiz
                </button>
                <button
                  onClick={() => setShowQuizPopup(false)}
                  className="absolute top-4 right-4 text-white/60 hover:text-white"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>
          )}
          {showFinalAssessmentPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur z-50 overflow-y-auto">
              <div className="glass-card border border-white/10 rounded-3xl p-6 w-full max-w-3xl relative text-white my-8">
                <h2 className="text-lg font-semibold mb-4">Final Assessment</h2>
                
                <div className="space-y-4 mb-4">
                  <div>
                    <p className="text-sm text-white/70 mb-1">Assessment Title</p>
                    <input
                      type="text"
                      className="w-full glass-input border border-white/20 rounded-2xl py-2 px-3"
                      value={finalAssessmentDetails.title}
                      onChange={(e) =>
                        setFinalAssessmentDetails({
                          ...finalAssessmentDetails,
                          title: e.target.value,
                        })
                      }
                      placeholder="e.g., Module 1 Final Exam"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-white/70 mb-1">Description (Optional)</p>
                    <textarea
                      className="w-full glass-input border border-white/20 rounded-2xl py-2 px-3"
                      rows="2"
                      value={finalAssessmentDetails.description}
                      onChange={(e) =>
                        setFinalAssessmentDetails({
                          ...finalAssessmentDetails,
                          description: e.target.value,
                        })
                      }
                      placeholder="Assessment description..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-white/70 mb-1">Passing Score (%)</p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full glass-input border border-white/20 rounded-2xl py-2 px-3"
                        value={finalAssessmentDetails.passingScore}
                        onChange={(e) =>
                          setFinalAssessmentDetails({
                            ...finalAssessmentDetails,
                            passingScore: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <p className="text-sm text-white/70 mb-1">Time Limit (minutes, 0 = no limit)</p>
                      <input
                        type="number"
                        min="0"
                        className="w-full glass-input border border-white/20 rounded-2xl py-2 px-3"
                        value={finalAssessmentDetails.timeLimit}
                        onChange={(e) =>
                          setFinalAssessmentDetails({
                            ...finalAssessmentDetails,
                            timeLimit: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 mb-4">
                  <h3 className="text-md font-semibold mb-3">Questions ({finalAssessmentDetails.questions.length})</h3>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {finalAssessmentDetails.questions.map((q, qIdx) => (
                      <div key={qIdx} className="glass-light border border-white/10 rounded-xl p-3">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-sm">{qIdx + 1}. {q.question}</p>
                          <button
                            type="button"
                            onClick={() => removeAssessmentQuestion(qIdx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                        <div className="space-y-1 pl-4">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`text-xs ${
                                optIdx === q.correctAnswer
                                  ? "text-green-300 font-medium"
                                  : "text-white/60"
                              }`}
                            >
                              {optIdx + 1}. {opt}
                              {optIdx === q.correctAnswer && " ✓"}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 glass-light border border-white/10 rounded-xl">
                    <p className="text-sm font-semibold mb-3">Add New Question</p>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="w-full glass-input border border-white/20 rounded-2xl py-2 px-3"
                        placeholder="Enter question"
                        value={currentAssessmentQuestion.question}
                        onChange={(e) =>
                          setCurrentAssessmentQuestion({
                            ...currentAssessmentQuestion,
                            question: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2 mb-3">
                      {currentAssessmentQuestion.options.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="correctOption"
                            checked={currentAssessmentQuestion.correctIndex === idx}
                            onChange={() =>
                              setCurrentAssessmentQuestion({
                                ...currentAssessmentQuestion,
                                correctIndex: idx,
                              })
                            }
                            className="accent-blue-400"
                          />
                          <input
                            type="text"
                            className="flex-1 glass-input border border-white/20 rounded-2xl py-2 px-3"
                            placeholder={`Option ${idx + 1}`}
                            value={option}
                            onChange={(e) =>
                              setCurrentAssessmentQuestion({
                                ...currentAssessmentQuestion,
                                options: currentAssessmentQuestion.options.map((opt, i) =>
                                  i === idx ? e.target.value : opt
                                ),
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addAssessmentQuestion}
                      className="w-full glass-button border border-white/20 rounded-full py-2 text-sm"
                    >
                      + Add Question
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={saveFinalAssessment}
                    type="button"
                    className="flex-1 glass-button border border-white/20 rounded-full py-3 text-sm font-semibold"
                  >
                    Save Assessment
                  </button>
                  <button
                    onClick={() => {
                      setShowFinalAssessmentPopup(false);
                      setFinalAssessmentDetails({
                        title: "Final Assessment",
                        description: "",
                        questions: [],
                        passingScore: 70,
                        timeLimit: 0,
                      });
                    }}
                    className="px-6 glass-button border border-white/20 rounded-full py-3 text-sm"
                  >
                    Cancel
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowFinalAssessmentPopup(false);
                    setFinalAssessmentDetails({
                      title: "Final Assessment",
                      description: "",
                      questions: [],
                      passingScore: 70,
                      timeLimit: 0,
                    });
                  }}
                  className="absolute top-4 right-4 text-white/60 hover:text-white"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="self-center glass-button border border-white/20 rounded-full px-10 py-3 text-sm font-semibold text-white hover:scale-[1.02]"
        >
          Publish Course
        </button>
      </form>
    </div>
  );
};

export default AddCourse;
