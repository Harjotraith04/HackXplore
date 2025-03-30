import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { calculateEloForQuiz } from '../../../components/Aura'; // Import the ELO calculation function

const Quiz = ({ quiz, closeQuiz, studentId, quizId, subjectId }) => {
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute per question
  const [result, setResult] = useState({
    correctAnswers: 0,
    wrongAnswers: 0,
  });

  useEffect(() => {
    if (showResult) return; // Prevent timer from running when results are shown

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          // Time is up
          handleTimeout();
          return 60; // Reset time for the next question
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuestion, showResult]);

  // New useEffect to handle submission after state updates
  useEffect(() => {
    if (showResult) {
      handleSubmit();
    }
  }, [showResult]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const questionKey = Object.keys(quiz)[activeQuestion];
  const { options, answer } = quiz[questionKey];

  const onClickNext = () => {
    const selectedOption = options[selectedAnswerIndex];
    const isCorrect = selectedOption === answer;

    setResult((prev) =>
      isCorrect
        ? {
            ...prev,
            correctAnswers: prev.correctAnswers + 1,
          }
        : {
            ...prev,
            wrongAnswers: prev.wrongAnswers + 1,
          }
    );

    goToNextQuestion();
  };

  const onAnswerSelected = (index) => {
    setSelectedAnswerIndex(index);
  };

  const goToNextQuestion = () => {
    setSelectedAnswerIndex(null); // Reset selected answer
    setTimeLeft(60); // Reset time left for the next question
    if (activeQuestion < Object.keys(quiz).length - 1) {
      setActiveQuestion((prev) => prev + 1);
    } else {
      setShowResult(true); // Show results when the quiz is finished
      // Do not call handleSubmit here
    }
  };

  const handleTimeout = () => {
    setResult((prev) => ({
      ...prev,
      wrongAnswers: prev.wrongAnswers + 1, // Count unanswered as wrong
    }));
    goToNextQuestion(); // Move to the next question
  };

  const handleSubmit = async () => {
    try {
      // Fetch the current quizzes array from Firestore
      const studentRef = doc(db, 'users', studentId);
      const studentDoc = await getDoc(studentRef);
      const studentData = studentDoc.data();

      if (!studentData || !Array.isArray(studentData.quizzes)) {
        console.error('Student data or quizzes array not found');
        return;
      }

      // Calculate the normalized score
      const totalQuestions = Object.keys(quiz).length;
      const correctScore = result.correctAnswers;
      const normalizedScore = totalQuestions > 0 ? (correctScore / totalQuestions) * 100 : 0;

      // Update the quizzes array with the new status and normalized score
      const updatedQuizzes = studentData.quizzes.map((quizMap) =>
        quizMap.quizId === quizId
          ? { ...quizMap, status: 'completed', normalizedScore } // Store normalized score
          : quizMap
      );

      // Update the quizzes array in Firestore
      await updateDoc(studentRef, { quizzes: updatedQuizzes });

      // Calculate and update ELO
      await calculateEloForQuiz(studentId, quizId, normalizedScore, subjectId); // Call the ELO function

    } catch (error) {
      console.error('Error updating quiz status or ELO:', error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white max-w-lg w-full rounded-lg shadow-lg p-6">
        {!showResult ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <span className="text-3xl font-bold text-black">
                  {activeQuestion + 1}
                </span>
                <span className="ml-2 text-black">
                  /{Object.keys(quiz).length}
                </span>
              </div>
              <span className="text-black">
                Time Left: {formatTime(timeLeft)}
              </span>
            </div>
            <h2 className="text-lg font-semibold mb-6 text-black">{questionKey}</h2>
            <ul>
              {options.map((option, index) => (
                <li
                  onClick={() => onAnswerSelected(index)}
                  key={option}
                  className={`cursor-pointer text-lg p-3 rounded-md mb-3 border ${
                    selectedAnswerIndex === index
                      ? 'bg-purple-100 border-purple-500'
                      : 'bg-gray-100 border-gray-300'
                  } text-black`}
                >
                  {option}
                </li>
              ))}
            </ul>
            <div className="flex justify-end mt-6">
              <button
                onClick={onClickNext}
                disabled={selectedAnswerIndex === null}
                className={`px-6 py-2 text-white font-semibold rounded-md ${
                  selectedAnswerIndex === null
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {activeQuestion === Object.keys(quiz).length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 text-black">Quiz Completed!</h3>
            <p className="text-lg mb-2 text-black">
              Total Questions: <span className="font-semibold">{Object.keys(quiz).length}</span>
            </p>
            <p className="text-lg mb-2 text-black">
              Correct Answers: <span className="font-semibold">{result.correctAnswers}</span>
            </p>
            <p className="text-lg mb-2 text-black">
              Wrong Answers: <span className="font-semibold">{result.wrongAnswers}</span>
            </p>
            <button
              onClick={closeQuiz}
              className="bg-blue-500 text-white px-4 py-2 rounded mt-4 hover:bg-blue-600"
            >
              Close Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;