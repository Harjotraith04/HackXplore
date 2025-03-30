import React, { useState, useEffect } from 'react';
import { collection, getDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useParams } from 'react-router-dom';
import Assignment from './Assignment'; // Import the Assignment component

function AssignmentPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useParams();
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isAssignmentStarted, setIsAssignmentStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      // Fetch the student's user document
      const studentDocRef = doc(db, 'users', userId);
      const studentDoc = await getDoc(studentDocRef);

      if (!studentDoc.exists()) {
        console.error('Student document not found');
        setLoading(false);
        return;
      }

      const studentData = studentDoc.data();
      const studentAssignments = studentData.assignments || [];

      // Fetch details for each assignment
      const assignmentsData = await Promise.all(
        studentAssignments.map(async (assignmentEntry) => {
          // Only include assignments with status 'pending' (optional)
          if (assignmentEntry.status !== 'pending') {
            return null;
          }

          // Fetch the assignment document
          const assignmentDocRef = doc(db, 'assignments', assignmentEntry.assignmentId);
          const assignmentDoc = await getDoc(assignmentDocRef);

          if (!assignmentDoc.exists()) {
            console.error('Assignment document not found:', assignmentEntry.assignmentId);
            return null;
          }

          const assignmentData = assignmentDoc.data();

          // Fetch related subject, unit, and lecture data
          const subjectDocRef = doc(db, 'subjects', assignmentData.subjectId);
          const subjectDoc = await getDoc(subjectDocRef);
          const subjectData = subjectDoc.exists() ? subjectDoc.data() : null;

          const unitDocRef = doc(db, `subjects/${assignmentData.subjectId}/units`, assignmentData.unitId);
          const unitDoc = await getDoc(unitDocRef);
          const unitData = unitDoc.exists() ? unitDoc.data() : null;

          const lectureDocRef = doc(db, `subjects/${assignmentData.subjectId}/units/${assignmentData.unitId}/lectures`, assignmentData.lectureId);
          const lectureDoc = await getDoc(lectureDocRef);
          const lectureData = lectureDoc.exists() ? lectureDoc.data() : null;

          // Fetch teacher names
          const teacherNamesPromises = (subjectData?.teachers || []).map(async (teacherId) => {
            const teacherDoc = await getDoc(doc(db, 'users', teacherId));
            return teacherDoc.exists() ? teacherDoc.data().name : 'Unknown Teacher';
          });
          const teacherNames = await Promise.all(teacherNamesPromises);

          return {
            id: assignmentEntry.assignmentId,
            assignment: assignmentData.assignment || {},
            subjectName: subjectData ? subjectData.name : 'Unknown Subject',
            teachers: teacherNames,
            unitName: unitData ? unitData.title : 'Unknown Unit',
            lectureName: lectureData ? lectureData.title : 'Unknown Lecture',
            status: assignmentEntry.status,
            subjectId: assignmentData.subjectId,
          };
        })
      );

      // Filter out null values
      setAssignments(assignmentsData.filter(assignment => assignment !== null));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setLoading(false);
    }
  };

  const handleAssignmentClick = (assignment) => {
    setSelectedAssignment(assignment);
    setShowInstructions(true); // Show the instructions popup
  };

  const startAssignment = () => {
    setIsAssignmentStarted(true);
    setShowInstructions(false); // Close the instructions popup
  };

  const closeAssignment = async () => {
    setSelectedAssignment(null);
    setIsAssignmentStarted(false);
    await fetchAssignments();
  };

  if (loading) {
    return <div className="text-center">Loading assignments...</div>;
  }

  if (isAssignmentStarted && selectedAssignment) {
    // Render the Assignment component when an assignment is started
    return (
      <Assignment
        assignment={selectedAssignment.assignment}
        closeAssignment={closeAssignment}
        studentId={userId}
        assignmentId={selectedAssignment.id}
        subjectId={selectedAssignment.subjectId}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Assignments List */}
      {assignments.length > 0 ? (
        assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="mb-4 p-4 border rounded shadow-md bg-white cursor-pointer hover:bg-gray-100"
            onClick={() => handleAssignmentClick(assignment)}
          >
            <h3 className="text-lg font-semibold text-black">{assignment.subjectName}</h3>
            <h4 className="text-sm font-medium text-gray-600">
              Teachers: {assignment.teachers.length > 0 ? assignment.teachers.join(', ') : 'No Teachers Assigned'}
            </h4>
            <p className="text-sm text-gray-500">Unit: {assignment.unitName}</p>
            <p className="text-sm text-gray-500">Lecture: {assignment.lectureName}</p>
            <p className="text-sm text-gray-500">Status: {assignment.status}</p>
          </div>
        ))
      ) : (
        <div className="text-center text-black">No assignments found.</div>
      )}

      {/* Instructions Popup */}
      {showInstructions && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-2xl font-semibold mb-4 text-black text-center">Assignment Instructions</h2>
            <p className="text-gray-700 mb-4 text-center">Please read the instructions carefully before starting the assignment:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4">
              <li>Provide detailed answers for short and long answer questions.</li>
              <li>Select the correct option for MCQ questions.</li>
              <li>You have a total of 60 minutes to complete the assignment.</li>
              <li>Ensure all answers are saved before submitting.</li>
              <li>After submitting, your assignment will be evaluated by the instructor.</li>
            </ul>
            <div className="flex justify-between">
              <button
                onClick={() => setShowInstructions(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={startAssignment}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Start Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignmentPage;