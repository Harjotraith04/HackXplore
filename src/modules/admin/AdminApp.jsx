import { useParams, Routes, Route } from 'react-router-dom';
import AdminNavBar from './pages/AdminNavBar';
import AdminSubjects from './pages/AdminSubjects';
import Dashboard from './pages/Dashboard';
import AdminUnits from './pages/AdminUnits';
import AdminResources from './pages/AdminResource';
import Register from './pages/Register'; 
import Lectures from './pages/AdminLectures'; 
import AddStudents from './pages/AddStudents'; 


function AdminApp() {
  const { userId } = useParams();
  return (
    <div>
      <AdminNavBar userId={userId}/>
      <Routes>
        <Route path="/:userId" element={<Dashboard />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/subjects/" element={<AdminSubjects userId={userId}/>} />
        <Route path="/units/" element={<AdminUnits userId={userId}/>} />
        <Route path="/resources/" element={<AdminResources userId={userId}/>} />
        <Route path="/register/" element={<Register userId={userId}/>} /> 
        <Route path="/lectures/" element={<Lectures userId={userId}/>} /> 
        <Route path="/addnew/" element={<AddStudents userId={userId}/>} /> 


        {/* Additional admin routes can be added here */}
      </Routes>
    </div>
  );
}

export default AdminApp;
