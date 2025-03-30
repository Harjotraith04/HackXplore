import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import GuruCoolAnywhere from './pages/GuruCoolAnywhere';
import AdminApp from './modules/admin/AdminApp';
import TeacherApp from './modules/teacher/TeacherApp';
import StudentApp from './modules/student/StudentApp';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './pages/SplashScreen'; 


function AppRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    setTimeout(() => {
      setLoading(false);
    }, 3000); 
  }, []);

  if (loading) {
    return <SplashScreen />;
  }


  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/anywhere" element={<GuruCoolAnywhere />} />
        <Route
          path="/login"
          element={<LoginPage setIsLoggedIn={setIsLoggedIn} setUserType={setUserType} />}
        />
        <Route
          path="/student/:userId/*"
          element={
            <ProtectedRoute
              element={<StudentApp />}
              isLoggedIn={isLoggedIn}
              userType={userType}
              requiredUserType="student"
            />
          }
        />
        <Route
          path="/teacher/:userId/*"
          element={
            <ProtectedRoute
              element={<TeacherApp />}
              isLoggedIn={isLoggedIn}
              userType={userType}
              requiredUserType="teacher"
            />
          }
        />
        <Route
          path="/admin/:userId/*"
          element={
            <ProtectedRoute
              element={<AdminApp />}
              isLoggedIn={isLoggedIn}
              userType={userType}
              requiredUserType="admin"
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
