import React from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from "./Login";
import StudentDashboard from "./Student";
import TeacherDashboard from "./Teacher";
import Signup from "./Signup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<AuthPage />} />
        <Route path='/login' element={<AuthPage />} /> 
        <Route path='/signup' element={<Signup />} />
        <Route path='/Student' element={<StudentDashboard />} />
        <Route path='/Teacher' element={<TeacherDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;