import React from "react";
import { Route, Routes, useMatch } from "react-router-dom";
import Home from "./pages/student/Home";
import CoursesList from "./pages/student/CoursesList";
import CourseDetails from "./pages/student/CourseDetails";
import MyEnrollments from "./pages/student/MyEnrollments";
import Player from "./pages/student/Player";
import Forum from "./pages/student/Forum";
import PostDetail from "./pages/student/PostDetail";
import CreatePost from "./pages/student/CreatePost";
import UpdateCourse from "./pages/educator/UpdateCourse";
import Loading from "./components/student/Loading";
import Educator from "./pages/educator/Educator";
import Dashboard from "./pages/educator/Dashboard";
import AddCourse from "./pages/educator/AddCourse";
import MyCourses from "./pages/educator/MyCourses";
import StudentsEnrolled from "./pages/educator/StudentsEnrolled";
import CertificateManagement from "./pages/educator/CertificateManagement";
import Navbar from "./components/student/Navbar";
import Chatbot from "./components/student/Chatbot";
import "quill/dist/quill.snow.css";
import { ToastContainer } from "react-toastify";

const App = () => {
  const isEducatorRoute = useMatch("/educator/*");

  return (
    <div className="text-default min-h-screen">
      <ToastContainer />
      {!isEducatorRoute && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/course-list" element={<CoursesList />} />
        <Route path="/course-list/:input" element={<CoursesList />} />
        <Route path="/course/:id" element={<CourseDetails />} />
        <Route path="/my-enrollments" element={<MyEnrollments />} />
        <Route path="/player/:courseId" element={<Player />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/forum/post/:postId" element={<PostDetail />} />
        <Route path="/forum/create" element={<CreatePost />} />
        <Route path="/loading/:path" element={<Loading />} />
        <Route path="/educator" element={<Educator />}>
          <Route path="/educator" element={<Dashboard />} />
          <Route path="add-course" element={<AddCourse />} />
          <Route path="update-course/:courseId" element={<UpdateCourse />} />
          <Route path="my-course" element={<MyCourses />} />
          <Route path="student-enrolled" element={<StudentsEnrolled />} />
          <Route path="certificates" element={<CertificateManagement />} />
        </Route>
      </Routes>
      <Chatbot />
    </div>
  );
};

export default App;
