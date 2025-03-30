import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import Quiz from './Quiz';
import { useParams } from 'react-router-dom';

function TeacherQuiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { userId } = useParams();
  const [subjectId, setSubjectId] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      // Fetch all quizzes
      const querySnapshot = await getDocs(collection(db, 'quizzes'));
      const quizzesData = await Promise.all(
        querySnapshot.docs.map(async (quizDoc) => {
          const quizData = quizDoc.data();

          // Fetch student-specific quiz data
          const studentDoc = await getDoc(doc(db, 'users', userId));
          if (!studentDoc.exists()) {
            console.error('Student document not found');
            return null;
          }
          const studentData = studentDoc.data();

          // Filter quizzes based on pending status for the student
          const quizStatus = studentData.quizzes.find(q => q.quizId === quizDoc.id);
          if (quizStatus && quizStatus.status === 'pending') {
            // Fetch related subject, unit, and lecture data
            const subjectDoc = await getDoc(doc(db, 'subjects', quizData.subjectId));
            const subjectData = subjectDoc.exists() ? subjectDoc.data() : null;
            setSubjectId(quizData.subjectId);

            const unitDoc = await getDoc(doc(db, `subjects/${quizData.subjectId}/units`, quizData.unitId));
            const unitData = unitDoc.exists() ? unitDoc.data() : null;

            const lectureDoc = await getDoc(
              doc(db, `subjects/${quizData.subjectId}/units/${quizData.unitId}/lectures`, quizData.lectureId)
            );
            const lectureData = lectureDoc.exists() ? lectureDoc.data() : null;

            // Fetch teacher names
            const teacherNamesPromises = (subjectData?.teachers || []).map(async (teacherId) => {
              const userDoc = await getDoc(doc(db, 'users', teacherId));
              return userDoc.exists() ? userDoc.data().name : 'Unknown Teacher';
            });
            const teacherNames = await Promise.all(teacherNamesPromises);

            return {
              id: quizDoc.id,
              quiz: quizData.mcq_quiz || {},
              subjectName: subjectData ? subjectData.name : 'Unknown Subject',
              teachers: teacherNames,
              unitName: unitData ? unitData.title : 'Unknown Unit',
              lectureName: lectureData ? lectureData.title : 'Unknown Lecture',
            };
          }
          return null;
        })
      );

      // Filter out null values (quizzes that don't match the pending status)
      setQuizzes(quizzesData.filter(quiz => quiz !== null));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setLoading(false);
    }
  };

  const handleQuizClick = (quiz) => {
    setSelectedQuiz(quiz);
    setShowModal(true);
  };

  const startQuiz = () => {
    setIsQuizStarted(true);
  };

  const closeQuiz = async () => {
    setShowModal(false);
    setSelectedQuiz(null);
    setIsQuizStarted(false);
    await fetchQuizzes()
  };

  if (loading) {
    return <div className="text-center">Loading quizzes...</div>;
  }

  return (
    <div className="p-6">
    {/* Quiz List */}
    {!showModal && (
      <>
        {quizzes.length > 0 ? (
          quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="mb-4 p-4 border rounded shadow-md bg-white cursor-pointer hover:bg-gray-100"
              onClick={() => handleQuizClick(quiz)}
            >
              <h3 className="text-lg font-semibold text-black">{quiz.subjectName}</h3>
              <h4 className="text-sm font-medium text-gray-600">
                Teachers: {quiz.teachers.length > 0 ? quiz.teachers.join(', ') : 'No Teachers Assigned'}
              </h4>
              <p className="text-sm text-gray-500">Unit: {quiz.unitName}</p>
              <p className="text-sm text-gray-500">Lecture: {quiz.lectureName}</p>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 mt-6">
            No quizzes available.
          </div>
        )}
      </>
    )}

      {/* Quiz Modal */}
      {showModal && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full md:w-3/4 lg:w-1/2 p-6 max-h-[90vh] overflow-y-auto flex flex-col justify-center">
            {!isQuizStarted ? (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-black text-center">Quiz Instructions</h2>
                <p className="text-gray-700 mb-4 text-center">Please read the instructions carefully before starting the quiz:</p>
                <ul className="list-disc list-inside text-gray-700 mb-4">
                  <li>You have 1 minute to answer each question.</li>
                  <li>Each correct answer gives you 1 point.</li>
                  <li>No points are deducted for wrong answers.</li>
                  <li>If you don't select an answer within the time limit, it will be marked as incorrect.</li>
                  <li>After finishing, your score will be displayed as correct answers/total questions.</li>
                </ul>
                <div className="flex justify-between">
                  <button
                    onClick={closeQuiz}
                    className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Back to Quiz List
                  </button>
                  <button
                    onClick={startQuiz}
                    className="bg-blue-500 text-black px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Start Quiz
                  </button>
                </div>
              </div>
            ) : (
              <Quiz 
                quiz={selectedQuiz.quiz} 
                totalTime={300} 
                closeQuiz={closeQuiz} 
                studentId={userId} 
                quizId={selectedQuiz.id} 
                subjectId={subjectId}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherQuiz;
