import { useParams, Routes, Route } from 'react-router-dom';
import TeacherNavBar from './pages/TeacherNavBar';
import TeacherUnits from './pages/TeacherUnits';
import TeacherLecture from './pages/TeacherLecture';
import Dashboard from './pages/Dashboard';
import Transcript from './pages/Transcript';
import TeacherResources from './pages/TeacherResources';
import TeacherRoomPage from './pages/TeacherRoomPage';
import TeacherAttendance from './pages/Attendance';
import GenerateCP from './pages/GenerateCP';

function TeacherApp() {
  const { userId } = useParams();
  console.log('Extracted userId:', userId);
  return (
    <div>
      <TeacherNavBar userId={userId}/>
      <Routes>
        <Route path="/:userId" element={<Dashboard />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/units" element={<TeacherUnits userId={userId}/>} />
        <Route path="/attendance" element={<TeacherAttendance userId={userId}/>} />
        <Route path="/lectures" element={<TeacherLecture userId={userId}/>} />
        <Route path="/transcript" element={<Transcript userId={userId}/>} />
        <Route path="/room" element={<TeacherRoomPage userId={userId}/>} />
        <Route path="/resources" element={<TeacherResources userId={userId}/>} />
        <Route path="/generatecp" element={<GenerateCP userId={userId}/>} />
        {/* Additional teacher routes can be added here */}
      </Routes>
    </div>
  );
}

export default TeacherApp;
