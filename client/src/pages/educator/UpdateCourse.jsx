import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import uniqid from "uniqid";
import Quill from "quill";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";

const UpdateCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { backendUrl, getToken, fetchAllCourses } = useContext(AppContext);
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const [courseTitle, setCourseTitle] = useState("");
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [image, setImage] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showQuizPopup, setShowQuizPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [currentQuizChapterId, setCurrentQuizChapterId] = useState(null);
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

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
      });
    }
  }, []);

  const fetchCourseData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        `${backendUrl}/api/educator/get-course-for-edit/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success && data.course) {
        const course = data.course;
        setCourseTitle(course.courseTitle);
        setCoursePrice(course.coursePrice);
        setDiscount(course.discount);
        setExistingImage(course.courseThumbnail);
        setChapters(
          (course.courseContent || []).map((chapter) => ({
            ...chapter,
            quizzes: chapter.quizzes || [],
          }))
        );
        if (quillRef.current) {
          quillRef.current.root.innerHTML = course.courseDescription || "";
        }
      }
    } catch (error) {
      toast.error("Failed to load course data");
    }
  };

  const handleChapter = (action, chapterId) => {
    if (action === "add") {
      const title = prompt("Enter Chapter Name: ");
      if (title) {
        const newChapter = {
          chapterId: uniqid(),
          chapterTitle: title,
          chapterContent: [],
          quizzes: [],
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
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentQuizChapterId) {
          const newQuiz = {
            question: quizDetails.question,
            options: quizDetails.options,
            correctAnswer: quizDetails.correctIndex, // Save as correctAnswer for consistency
            quizId: uniqid(),
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

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();

      const courseData = {
        courseTitle,
        courseDescription: quillRef.current.root.innerHTML,
        coursePrice: Number(coursePrice),
        discount: Number(discount),
        courseContent: chapters,
      };

      const formData = new FormData();
      formData.append("courseData", JSON.stringify(courseData));
      if (image) {
        formData.append("image", image);
      }

      const token = await getToken();
      const { data } = await axios.put(
        `${backendUrl}/api/educator/update-course/${courseId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        // Refresh the course list to show updated data
        await fetchAllCourses();
        navigate("/educator/my-course");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

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
          <h2 className="text-2xl font-semibold">Update Course</h2>
          <p className="text-sm text-white/70">
            Make changes to your course content, pricing, or chapters.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Course Title</label>
            <input
              onChange={(e) => setCourseTitle(e.target.value)}
              value={courseTitle}
              type="text"
              placeholder="e.g., Advanced UI Design"
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
                  {image ? image.name : "Upload a new image or keep existing"}
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
              {(image || existingImage) && (
                <img
                  src={image ? URL.createObjectURL(image) : existingImage}
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
                        <div className="space-y-1">
                          {(quiz.options || []).map((option, idx) => (
                            <div
                              key={idx}
                              className={`text-xs px-3 py-1 rounded-full border ${
                                (quiz.correctAnswer !== undefined ? quiz.correctAnswer : quiz.correctIndex) === idx
                                  ? "border-green-400 bg-green-400/10 text-green-200"
                                  : "border-white/10 text-white/60"
                              }`}
                            >
                              {option || "—"}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
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
                  <p className="text-xs text-white/60 mt-2">
                    Select the radio button for the correct answer
                  </p>
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
        </div>
        <button
          type="submit"
          className="self-center glass-button border border-white/20 rounded-full px-10 py-3 text-sm font-semibold text-white hover:scale-[1.02]"
        >
          Update Course
        </button>
      </form>
    </div>
  );
};

export default UpdateCourse;

