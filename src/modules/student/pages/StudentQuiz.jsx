import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; // Adjust the path as necessary
import axios from 'axios'; // Import axios
import FlashcardList from './FlashcardList';
import TeacherQuiz from './TeacherQuiz';
import AssignmentPage from './AssignmentPage';
import LoadingScreen from '../../../LoadingScreen.jsx'; // Adjust the path as necessary

function StudentQuiz() {
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedLecture, setSelectedLecture] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [activeTab, setActiveTab] = useState('StudentQuiz');
  const [loading, setLoading] = useState(false);
  const [currentFact, setCurrentFact] = useState('');
  const facts = [
    "Flashcards can help improve your active recall.",
    "Using flashcards can enhance your spaced repetition.",
    "Flashcards are a great way to test your knowledge.",
    "Flashcards can help you identify gaps in your understanding.",
    "Flashcards can make studying more engaging and fun."
  ];

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    const factInterval = setInterval(() => {
      setCurrentFact(facts[Math.floor(Math.random() * facts.length)]);
    }, 5000);

    return () => clearInterval(factInterval);
  }, []);

  const fetchSubjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'subjects'));
      const subjectsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchUnits = async (subjectId) => {
    try {
      const querySnapshot = await getDocs(collection(db, `subjects/${subjectId}/units`));
      const unitsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUnits(unitsData);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const fetchLectures = async (subjectId, unitId) => {
    try {
      const querySnapshot = await getDocs(collection(db, `subjects/${subjectId}/units/${unitId}/lectures`));
      const lecturesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLectures(lecturesData);
    } catch (error) {
      console.error('Error fetching lectures:', error);
    }
  };

  const handleSubjectChange = (e) => {
    const selectedSubjectId = e.target.value;
    setSelectedSubject(selectedSubjectId);
    setSelectedUnit('');
    setSelectedLecture('');
    setUnits([]);
    setLectures([]);
    if (selectedSubjectId) {
      fetchUnits(selectedSubjectId);
    }
  };

  const handleUnitChange = (e) => {
    const selectedUnitId = e.target.value;
    setSelectedUnit(selectedUnitId);
    setSelectedLecture('');
    setLectures([]);
    if (selectedUnitId) {
      fetchLectures(selectedSubject, selectedUnitId);
    }
  };

  const handleLectureChange = (e) => {
    setSelectedLecture(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleGenerateQuiz();
  };

  const handleGenerateQuiz = async () => {
    setLoading(true);
    try {
      console.log('Generating quiz with:', {
        lecture_id: selectedLecture,
        subject_id: selectedSubject,
        unit_id: selectedUnit,
        num_questions: 10,
      });

      // Send POST request to generate quiz
      const response = await axios.post(
        `${import.meta.env.VITE_GENERATE_QUIZ}`,
        {
          lecture_id: selectedLecture,
          subject_id: selectedSubject,
          unit_id: selectedUnit,
          num_questions: 10,
        },
        {
          headers: {
            'GuruCool-API-Key': import.meta.env.VITE_API_KEY,
            'Content-Type': 'application/json',
            'bypass-tunnel-reminder': 'true',
          },
        }
      );

      console.log('API response:', response);

      if (response.status === 200) {
        const quiz = response.data.quiz;
        console.log('Quiz data received:', quiz);

        // Convert quiz object to flashcards format
        const flashcardData = Object.entries(quiz).map(([question, answer]) => ({
          question,
          answer,
        }));

        // Update flashcards state
        setFlashcards(flashcardData);
      } else {
        console.error('Unexpected response status:', response.status);
        alert('Failed to generate quiz. Please try again.');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      const url = import.meta.env.VITE_NOTIFICATION;
      const data = {
        text: 'Start the server, student quiz',
      };
      axios.post(url, JSON.stringify(data), {
        withCredentials: false,
        transformRequest: [(data, headers) => {
          if (headers && headers.post) {
            delete headers.post['Content-Type'];
          }
          return data;
        }],
      });
      alert('Model is deployed on local machine. Students have been requested to start the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screens">
      <h1 className="text-center text-3xl font-bold mb-8 mt-10">Study Centre</h1>
      <div className="mt-10 w-full max-w-6xl bg-white p-4  rounded-lg shadow-md">
        {/* Navbar */}
        <ul className="flex border-b mb-4 overflow-x-auto whitespace-nowrap">
          {/* Student Quiz Tab */}
          <li className="flex-shrink-0 mr-1">
            <button
              className={
                activeTab === 'StudentQuiz'
                  ? 'bg-white inline-block border-l border-t border-r rounded-t py-2 px-4 text-blue-700 font-semibold text-sm md:text-base'
                  : 'bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold text-sm md:text-base'
              }
              onClick={() => setActiveTab('StudentQuiz')}
            >
              Flashcard/Revision
            </button>
          </li>
          {/* Teacher Quiz Tab */}
          <li className="flex-shrink-0 mr-1">
            <button
              className={
                activeTab === 'TeacherQuiz'
                  ? 'bg-white inline-block border-l border-t border-r rounded-t py-2 px-4 text-blue-700 font-semibold text-sm md:text-base'
                  : 'bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold text-sm md:text-base'
              }
              onClick={() => setActiveTab('TeacherQuiz')}
            >
              Teacher Quiz
            </button>
          </li>
          {/* Assignment Tab */}
          <li className="flex-shrink-0 mr-1">
            <button
              className={
                activeTab === 'AssignmentPage'
                  ? 'bg-white inline-block border-l border-t border-r rounded-t py-2 px-4 text-blue-700 font-semibold text-sm md:text-base'
                  : 'bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold text-sm md:text-base'
              }
              onClick={() => setActiveTab('AssignmentPage')}
            >
              Assignments
            </button>
          </li>
        </ul>

        {/* Content */}
        <div className="quiz-content h-[500px] md:h-[650px] overflow-y-auto">
          {activeTab === 'StudentQuiz' && (
            <>
              <form
                className="flex flex-col md:flex-row items-start md:items-end justify-start space-y-4 md:space-y-0 md:space-x-4 bg-white p-4 md:p-6 shadow-md"
                onSubmit={handleSubmit}
              >
                <div className="flex flex-col w-full md:w-64">
                  <label htmlFor="subject" className="text-gray-500 text-xs mb-1">
                    Subject
                  </label>
                  <select
                    id="subject"
                    value={selectedSubject}
                    onChange={handleSubjectChange}
                    className="text-black bg-white p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col w-full md:w-64">
                  <label htmlFor="unit" className="text-gray-500 text-xs mb-1">
                    Unit
                  </label>
                  <select
                    id="unit"
                    value={selectedUnit}
                    onChange={handleUnitChange}
                    className="text-black bg-white p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={!selectedSubject}
                  >
                    <option value="">Select Unit</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col w-full md:w-64">
                  <label htmlFor="lecture" className="text-gray-500 text-xs mb-1">
                    Lecture
                  </label>
                  <select
                    id="lecture"
                    value={selectedLecture}
                    onChange={handleLectureChange}
                    className="text-black bg-white p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={!selectedUnit}
                  >
                    <option value="">Select Lecture</option>
                    {lectures.map((lecture) => (
                      <option key={lecture.id} value={lecture.id}>
                        {lecture.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-start md:items-end w-full md:w-auto">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 w-full md:w-auto"
                    disabled={!selectedLecture}
                  >
                    Generate
                  </button>
                </div>
              </form>

              {loading ? (
                <LoadingScreen fact={currentFact} />
              ) : (
                <div className="container mx-auto mt-6 px-4">
                  <FlashcardList flashcards={flashcards} />
                </div>
              )}
            </>
          )}
          {activeTab === 'TeacherQuiz' && (
            <>
              <TeacherQuiz />
            </>
          )}

          {activeTab === 'AssignmentPage' && (
            <>
              <AssignmentPage />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentQuiz;
