import { useParams, Routes, Route, useNavigate } from 'react-router-dom';
import StudentNavBar from './pages/StudentNavBar';
import Dashboard from './pages/Dashboard';
import LoginPage from '../../pages/LoginPage'; // Import the LoginPage component
import { useState, useEffect } from 'react';
import StudentLectures from './pages/StudentLectures';
import StudentQuiz from './pages/StudentQuiz';
import StudentResource from './pages/StudentResource';
import RoomPage from './pages/RoomPage';

function StudentApp() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Assume true initially

  useEffect(() => {
    if (window.location.pathname === '/signout') {
      // Redirect to the login page and clear any necessary states
      setIsLoggedIn(false);
      navigate('/signout');
    }
  }, [navigate]);

  return (
    <div>
      {isLoggedIn && <StudentNavBar userId={userId}/>} {/* Render the nav bar only if logged in */}
      <Routes>
        <Route path="/:userId" element={<Dashboard />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/document" element={<StudentLectures userId={userId}/>} />
        <Route path="/quiz" element={<StudentQuiz userId={userId}/>} />
        <Route path="/resource" element={<StudentResource userId={userId}/>} />  
        <Route path="/rooms" element={<RoomPage userId={userId}/>} />

        {/* Additional student routes can be added here */}
      </Routes>
    </div>
  );
}

export default StudentApp;
