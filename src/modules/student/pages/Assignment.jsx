import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { calculateEloForAssignment } from '../../../components/Aura';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

const Assignment = ({ assignment, closeAssignment, studentId, assignmentId, subjectId }) => {
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes for the assignment
  const [showResult, setShowResult] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  const [useModel, setUseModel] = useState(null);
  const [similarityScores, setSimilarityScores] = useState({});
  const [numShortLongQuestions, setNumShortLongQuestions] = useState(0);

  useEffect(() => {
    // Load the Universal Sentence Encoder model
    const loadModel = async () => {
      try {
        const model = await use.load();
        setUseModel(model);
        console.log('USE model loaded successfully');
      } catch (error) {
        console.error('Error loading USE model:', error);
      }
    };
    loadModel();
  }, []);

  useEffect(() => {
    const nestedAssignment = assignment?.assignment || {}; // Access nested assignment map

    const mcqQuestions = nestedAssignment.mcq_questions
      ? Object.entries(nestedAssignment.mcq_questions).map(([questionText, data]) => ({
          type: 'mcq',
          question: questionText,
          options: data.options,
          answer: data.answer,
        }))
      : [];

    const shortAnswerQuestions = Array.isArray(nestedAssignment.short_answer_questions)
      ? nestedAssignment.short_answer_questions.map((item) => ({
          type: 'short',
          question: item.question,
          answer: item.answer,
        }))
      : [];

    const longAnswerQuestions = Array.isArray(nestedAssignment.long_answer_questions)
      ? nestedAssignment.long_answer_questions.map((item) => ({
          type: 'long',
          question: item.question,
          answer: item.answer,
        }))
      : [];

    const combinedQuestions = [...mcqQuestions, ...shortAnswerQuestions, ...longAnswerQuestions];

    setAllQuestions(combinedQuestions);
  }, [assignment]);

  useEffect(() => {
    if (showResult) return; // Stop the timer when assignment is submitted

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResult]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleInputChange = (index, value) => {
    setAnswers({
      ...answers,
      [index]: value,
    });
  };

  const calculateSimilarityScore = async (studentAnswer, correctAnswer) => {
    if (!useModel) {
      console.error('USE model not loaded yet');
      return 0;
    }
  
    try {
      // Handle empty or undefined answers
      if (!studentAnswer || !correctAnswer) {
        return 0;
      }
  
      // Generate embeddings
      const [studentEmbedding, correctEmbedding] = await Promise.all([
        useModel.embed([studentAnswer]),
        useModel.embed([correctAnswer]),
      ]);
  
      // Convert embeddings to arrays
      const studentEmbeddingArray = studentEmbedding.arraySync()[0];
      const correctEmbeddingArray = correctEmbedding.arraySync()[0];
  
      // Calculate cosine similarity
      const dotProduct = tf.dot(studentEmbeddingArray, correctEmbeddingArray).arraySync();
      const normStudent = tf.norm(studentEmbeddingArray).arraySync();
      const normCorrect = tf.norm(correctEmbeddingArray).arraySync();
  
      const similarity = dotProduct / (normStudent * normCorrect);
  
      // Handle NaN or invalid similarity
      if (isNaN(similarity) || typeof similarity !== 'number') {
        return 0;
      }
  
      // Normalize the similarity score to a 0-100 scale
      const normalizedScore = ((similarity + 1) / 2) * 100;
  
      return normalizedScore;
    } catch (error) {
      console.error('Error calculating similarity score:', error);
      return 0;
    }
  };
  

  const handleSubmit = async () => {
    setShowResult(true);
  
    // Initialize scores
    let correctMCQs = 0;
    let totalMCQs = 0;
    let totalSimilarityScore = 0;
    let numShortLongQuestionsLocal = 0;
    let totalNormalizedScore = 0; // To track the sum of normalized scores
    const individualSimilarityScores = {};
  
    let totalQuestions = allQuestions.length; // Correctly track the total number of questions
  
    for (let index = 0; index < allQuestions.length; index++) {
      const question = allQuestions[index];
      const studentAnswer = answers[index] || '';
  
      if (question.type === 'mcq') {
        totalMCQs += 1;
        const isCorrect = studentAnswer === question.answer;
        if (isCorrect) {
          correctMCQs += 1;
        }
  
        // MCQ normalized score (0 or 100)
        const mcqNormalizedScore = isCorrect ? 100 : 0;
        totalNormalizedScore += mcqNormalizedScore;
      } else if (question.type === 'short' || question.type === 'long') {
        numShortLongQuestionsLocal += 1;
        const correctAnswer = question.answer || '';
  
        const similarityScore = await calculateSimilarityScore(studentAnswer, correctAnswer);
        totalSimilarityScore += similarityScore;
  
        // Store the similarity score for this question
        individualSimilarityScores[index] = similarityScore;
  
        // No need to multiply by 100 again here
        totalNormalizedScore += similarityScore;
      }
    }
  
    // Ensure we are dividing by the correct total number of questions
    const averageNormalizedScore = totalQuestions > 0 ? totalNormalizedScore / totalQuestions : 0;
  
    try {
      // Fetch the student's user document
      const studentRef = doc(db, 'users', studentId);
      const studentDoc = await getDoc(studentRef);
      const studentData = studentDoc.data();
  
      if (!studentData || !Array.isArray(studentData.assignments)) {
        console.error('Student data or assignments array not found');
        return;
      }
  
      // Update the assignments array with the new status and normalized score
      const updatedAssignments = studentData.assignments.map((assignmentEntry) =>
        assignmentEntry.assignmentId === assignmentId
          ? { ...assignmentEntry, status: 'completed', normalizedScore: averageNormalizedScore }
          : assignmentEntry
      );
  
      // Update the assignments array in Firestore
      await updateDoc(studentRef, { assignments: updatedAssignments });
  
      // Calculate and update ELO
      await calculateEloForAssignment(studentId, assignmentId, averageNormalizedScore, subjectId);
    } catch (error) {
      console.error('Error submitting assignment:', error);
    }
  
    // Update state with individual similarity scores
    setSimilarityScores(individualSimilarityScores);
  };
  
  
  
  

  if (allQuestions.length === 0) {
    return <div>Loading assignment...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      {!showResult ? (
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h2 className="text-xl font-semibold text-black mb-2 md:mb-0">Assignment</h2>
            <span className="text-black">Time Left: {formatTime(timeLeft)}</span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {allQuestions.map((question, index) => (
              <div key={index} className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-black">
                  {index + 1}. {question.question}
                </h3>
                {question.type === 'mcq' && (
                  <ul>
                    {question.options.map((option, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleInputChange(index, option)}
                        className={`cursor-pointer text-base p-3 rounded-md mb-2 border ${
                          answers[index] === option
                            ? 'bg-purple-100 border-purple-500'
                            : 'bg-white border-gray-300'
                        } text-black`}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
                {(question.type === 'short' || question.type === 'long') && (
                  <textarea
                    rows={question.type === 'short' ? 3 : 6}
                    className="w-full p-3 border rounded-md text-black bg-white"
                    value={answers[index] || ''}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                  ></textarea>
                )}
              </div>
            ))}
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                className="px-6 py-2 text-white font-semibold rounded-md bg-purple-600 hover:bg-purple-700"
              >
                Submit Assignment
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4 text-black">Assignment Submitted!</h3>
          <p className="text-lg mb-2 text-black">Thank you for completing the assignment.</p>
          {/* Display individual similarity scores */}
          {numShortLongQuestions > 0 && (
            <div className="mb-4">
              <h4 className="text-xl font-semibold mb-2 text-black">Your Answers:</h4>
              {allQuestions.map((question, index) => {
                if (question.type === 'short' || question.type === 'long') {
                  const similarityScore = similarityScores[index];

                  // Ensure similarityScore is a valid number
                  const displayScore =
                    similarityScore !== undefined && !isNaN(similarityScore)
                      ? similarityScore.toFixed(2)
                      : 'N/A';

                  return (
                    <div key={index} className="mb-4 text-left">
                      <p className="text-black">
                        <strong>Question {index + 1}:</strong> {question.question}
                      </p>
                      <p className="text-black">
                        <strong>Your Answer:</strong> {answers[index]}
                      </p>
                      <p className="text-black">
                        <strong>Similarity Score:</strong> {displayScore}
                      </p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
          <button
            onClick={closeAssignment}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-4 hover:bg-blue-600"
          >
            Close Assignment
          </button>
        </div>
      )}
    </div>
  );
};

export default Assignment;