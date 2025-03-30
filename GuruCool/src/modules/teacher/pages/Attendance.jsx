import React, { useState, useEffect } from 'react';
import { db } from '../../../firebaseConfig';  // Firestore setup file
import { collection, getDocs } from 'firebase/firestore';
import Webcam from 'react-webcam';

const TeacherPage = () => {
    const [subjects, setSubjects] = useState([]);
    const [lectures, setLectures] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedLecture, setSelectedLecture] = useState('');
    const [isAttendanceStarted, setIsAttendanceStarted] = useState(false);
    const [attendanceList, setAttendanceList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const webcamRef = React.useRef(null);
    const flaskApiUrl = import.meta.env.VITE_FLASK_API_URL;  // Get API URL from .env

    // Fetch all subjects from Firestore
    useEffect(() => {
        const fetchSubjects = async () => {
            const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
            const subjectList = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSubjects(subjectList);
        };
        fetchSubjects();
    }, []);

    // Fetch units and lectures for the selected subject
    const fetchLectures = async (subjectId) => {
        const unitsRef = collection(db, `subjects/${subjectId}/units`);
        const unitsSnapshot = await getDocs(unitsRef);
        const allLectures = [];
        
        for (const unitDoc of unitsSnapshot.docs) {
            const lecturesRef = collection(db, `subjects/${subjectId}/units/${unitDoc.id}/lectures`);
            const lecturesSnapshot = await getDocs(lecturesRef);
            lecturesSnapshot.docs.forEach(lecture => allLectures.push({ id: lecture.id, ...lecture.data() }));
        }
        setLectures(allLectures);
    };

    // Handle subject selection
    const handleSubjectChange = (e) => {
        const subjectId = e.target.value;
        setSelectedSubject(subjectId);
        fetchLectures(subjectId);  // Fetch lectures for the selected subject
        setSelectedLecture('');  // Reset the selected lecture
    };

    // Function to start the facial recognition and attendance
    const startAttendance = async () => {
        if (!selectedLecture) {
            setError('Please select a lecture before starting attendance.');
            return;
        }

        setIsAttendanceStarted(true);
        setIsLoading(true);
        setError(null);

        const videoFrame = webcamRef.current.getScreenshot(); // Get webcam frame

        try {
            const response = await fetch(`${flaskApiUrl}/recognize-face`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: videoFrame, lectureId: selectedLecture })
            });

            const result = await response.json();
            if (result.success) {
                setAttendanceList(result.attendance);
            } else {
                setError(result.message || 'Failed to process attendance.');
            }
        } catch (err) {
            setError('Error connecting to the Flask API.');
        }

        setIsLoading(false);
    };

    return (
        <div className="p-4 max-w-lg mx-auto">
            
            <h1 className="text-2xl font-bold text-center mb-6">Start Attendance</h1>

            {/* Dropdown to select subject */}
            <label className="block text-lg mb-2">Select Subject:</label>
            <select 
                value={selectedSubject} 
                onChange={handleSubjectChange} 
                className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
            >
                <option value="" disabled>Select Subject</option>
                {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
            </select>

            {/* Dropdown to select lecture */}
            <label className="block text-lg mb-2">Select Lecture:</label>
            <select 
                value={selectedLecture} 
                onChange={(e) => setSelectedLecture(e.target.value)} 
                className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
                disabled={!lectures.length}
            >
                <option value="" disabled>Select Lecture</option>
                {lectures.map(lecture => (
                    <option key={lecture.id} value={lecture.id}>{lecture.title}</option>
                ))}
            </select>

            {/* Webcam for live video capture */}
            <Webcam 
                audio={false} 
                ref={webcamRef} 
                screenshotFormat="image/jpeg" 
                className="w-full max-w-md mx-auto mb-4 border border-gray-300 rounded-lg"
                videoConstraints={{
                    facingMode: "user",
                    width: 360,
                    height: 270,
                }}
            />

            {/* Start Attendance button */}
            <button 
                onClick={startAttendance} 
                className={`w-full py-3 text-white font-semibold rounded-lg ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-500'}`}
                disabled={isLoading || !selectedLecture}
            >
                {isLoading ? 'Processing Attendance...' : 'Start Attendance'}
            </button>

            {/* Error Message */}
            {error && <p className="text-red-500 mt-4">{error}</p>}

            {/* Real-time attendance list */}
            {attendanceList.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold mt-6 mb-4">Real-Time Attendance</h2>
                    <ul className="list-disc pl-5">
                        {attendanceList.map((student, index) => (
                            <li key={index} className="text-lg">{student.name} - {student.status}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default TeacherPage;
