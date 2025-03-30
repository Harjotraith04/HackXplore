import React, { useState, useEffect } from 'react';
import { db } from '../../../firebaseConfig';
import { useParams } from 'react-router-dom';
import { collection, getDocs, addDoc, getDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import axios from 'axios';
import * as XLSX from 'xlsx'; 
import CalendarComponent from '../../../components/CalendarComponent';
import { addDays, format, parse, isBefore, isAfter } from 'date-fns';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const Dashboard = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [lectures, setLectures] = useState([]);
  const { userId } = useParams(); // Getting userId from URL params
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [events, setEvents] = useState([]);
  const dayMappings = { 'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5 };
  const [numMCQs, setNumMCQs] = useState('');
  const [numLongAnswers, setNumLongAnswers] = useState('');
  const [numShortAnswers, setNumShortAnswers] = useState('');
  const [assignmentSubjectId, setAssignmentSubjectId] = useState('');
  const [assignmentUnitId, setAssignmentUnitId] = useState('');
  const [assignmentLectureId, setAssignmentLectureId] = useState('');
  const [assignmentUnits, setAssignmentUnits] = useState([]);
  const [assignmentLectures, setAssignmentLectures] = useState([]);
  const [generatedCoursePolicies, setGeneratedCoursePolicies] = useState([]);
  const [coursePolicies, setCoursePolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [policyText, setPolicyText] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);


  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'subjects'));
        const subjectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubjects(subjectsData);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      const fetchUnits = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, `subjects/${selectedSubjectId}/units`));
          const unitsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUnits(unitsData);
        } catch (error) {
          console.error('Error fetching units:', error);
        }
      };

      fetchUnits();
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    if (selectedSubjectId && selectedUnitId) {
      const fetchLectures = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, `subjects/${selectedSubjectId}/units/${selectedUnitId}/lectures`));
          const lecturesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setLectures(lecturesData);
        } catch (error) {
          console.error('Error fetching lectures:', error);
        }
      };

      fetchLectures();
    }
  }, [selectedSubjectId, selectedUnitId]);

  useEffect(() => {
    if (assignmentSubjectId) {
      const fetchAssignmentUnits = async () => {
        try {
          const querySnapshot = await getDocs(
            collection(db, `subjects/${assignmentSubjectId}/units`)
          );
          const unitsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAssignmentUnits(unitsData);
        } catch (error) {
          console.error('Error fetching assignment units:', error);
        }
      };

      fetchAssignmentUnits();
    } else {
      setAssignmentUnits([]);
      setAssignmentUnitId('');
      setAssignmentLectureId('');
      setAssignmentLectures([]);
    }
  }, [assignmentSubjectId]);

  // New useEffect for Assignment lectures
  useEffect(() => {
    if (assignmentSubjectId && assignmentUnitId) {
      const fetchAssignmentLectures = async () => {
        try {
          const querySnapshot = await getDocs(
            collection(db, `subjects/${assignmentSubjectId}/units/${assignmentUnitId}/lectures`)
          );
          const lecturesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAssignmentLectures(lecturesData);
        } catch (error) {
          console.error('Error fetching assignment lectures:', error);
        }
      };

      fetchAssignmentLectures();
    } else {
      setAssignmentLectures([]);
      setAssignmentLectureId('');
    }
  }, [assignmentSubjectId, assignmentUnitId]);
  

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'notifications'));
        const notificationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    // Fetch the course policies from Firestore for the current teacher
    const fetchGeneratedCoursePolicies = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.generatedCoursePolicy) {
            // Fetch the policies associated with this user
            const policies = await Promise.all(
              userData.generatedCoursePolicy.map(async (policyId) => {
                const policyRef = doc(db, 'coursePolicies', policyId);
                const policyDoc = await getDoc(policyRef);
                return { id: policyId, ...policyDoc.data() };
              })
            );
            setCoursePolicies(policies);
          }
        }
      } catch (error) {
        console.error('Error fetching course policies:', error);
      }
    };

    fetchGeneratedCoursePolicies();
  }, [userId]);

  // Open the modal with the selected policy
  const openModal = (policy) => {
    setSelectedPolicy(policy);
    setPolicyText(policy.text); // Assuming 'text' contains the course policy content
    setModalIsOpen(true);
  };

  // Close the modal
  const closeModal = () => {
    setModalIsOpen(false);
  };

  // Handle updating the course policy
  const handleUpdate = async () => {
    try {
      const policyRef = doc(db, 'coursePolicies', selectedPolicy.id);
      await updateDoc(policyRef, {
        text: policyText,
        updatedAt: new Date(),
      });
  
      // Update local state after successful DB update
      setCoursePolicies((prevPolicies) =>
        prevPolicies.map((policy) =>
          policy.id === selectedPolicy.id ? { ...policy, text: policyText } : policy
        )
      );
      
      alert('Course policy updated successfully!');
    } catch (error) {
      console.error('Error updating course policy:', error);
      alert('Failed to update course policy. Please try again.');
    }
  };

  // Download the policy as a text file
  const downloadAsTxtFile = () => {
    if (policyText) {
      const blob = new Blob([policyText], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${selectedPolicy.subject}_CoursePolicy.txt`);
    }
  };

  const handleDelete = async () => {
    try {
      // Delete the course policy from Firestore
      const policyRef = doc(db, 'coursePolicies', selectedPolicy.id);
      await deleteDoc(policyRef);
  
      // Remove the course policy ID from the user's document
      const userRef = doc(db, 'users', userId); // teacherId from useParams
      const userDoc = await getDoc(userRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedPolicies = userData.generatedCoursePolicy.filter(
          (policyId) => policyId !== selectedPolicy.id
        );
  
        // Update the user's generatedCoursePolicy field in Firestore
        await updateDoc(userRef, {
          generatedCoursePolicy: updatedPolicies,
        });
      }
  
      // Update the local state to reflect the deletion
      setCoursePolicies((prevPolicies) =>
        prevPolicies.filter((policy) => policy.id !== selectedPolicy.id)
      );
  
      alert('Course policy deleted successfully!');
      closeModal(); // Close the modal after deletion
    } catch (error) {
      console.error('Error deleting course policy:', error);
      alert('Failed to delete course policy. Please try again.');
    }
  };
  

  const handleGenerateQuiz = async () => {
    try {
      // Make the API request to generate the quiz
      const response = await axios.post(`${import.meta.env.VITE_GENERATE_MCQ_QUIZ}`, {
        lecture_id: selectedLectureId,
        subject_id: selectedSubjectId,
        unit_id: selectedUnitId,
        num_questions: 10,
      }, {
        headers: {
          'GuruCool-API-Key': import.meta.env.VITE_API_KEY,
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true',
        },
      });
  
      // Get the quiz data from the response
      const quiz = response.data.mcq_quiz;
  
      // Validate the quiz data
      if (!quiz || Object.values(quiz).some(value => value === undefined)) {
        console.error('Invalid quiz data:', quiz);
        alert('Quiz data is invalid. Please check the API response.');
        return;
      }
  
      // Save the generated quiz as mcq_quiz in Firestore
      const quizDocRef = await addDoc(collection(db, 'quizzes'), {
        lectureId: selectedLectureId,
        subjectId: selectedSubjectId,
        unitId: selectedUnitId,
        mcq_quiz: quiz, // Store the whole quiz response as mcq_quiz field
        createdAt: new Date(),
      });
  
      // Fetch the subject document to get the students array
      const subjectDocRef = doc(db, 'subjects', selectedSubjectId);
      const subjectDoc = await getDoc(subjectDocRef);
  
      if (!subjectDoc.exists()) {
        console.error('Subject document not found');
        alert('Subject data not found.');
        return;
      }
  
      const subjectData = subjectDoc.data();
      const studentIds = subjectData.students || [];
  
      // Prepare the new quiz data to be added to each student's document
      const newQuizData = {
        quizId: quizDocRef.id,
        status: 'pending',
      };
  
      // Update each student document with the new quiz data
      for (const studentId of studentIds) {
        const studentDocRef = doc(db, 'users', studentId);
        const studentDoc = await getDoc(studentDocRef);
  
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          const existingQuizzes = studentData.quizzes || [];
  
          // Check if the quiz already exists for this student
          const quizExists = existingQuizzes.some(quiz => quiz.quizId === newQuizData.quizId);
          if (!quizExists) {
            // Append the new quiz data
            existingQuizzes.push(newQuizData);
            await updateDoc(studentDocRef, { quizzes: existingQuizzes });
          }
        } else {
          console.error('Student document not found:', studentId);
          // Optionally, you can log missing IDs or notify an administrator
          // e.g., logToAdmin('Missing student document', studentId);
        }
      }
  
      alert('Quiz generated and saved successfully!');
    } catch (error) {
      const url = import.meta.env.VITE_NOTIFICATION
      const data = {
        "text": "Start the server, teacher quiz",
      }
      axios.post(url, JSON.stringify(data), {
        withCredentials: false,
        transformRequest: [(data, headers) => {
          if (headers && headers.post) {
            delete headers.post["Content-Type"];
          }
          return data;
        }]
      })
        alert("Model is deployed on local machine. Students have been requested to start the server.");
    }
  };


  const handleGenerateAssignment = async () => {
    try {
      if (!assignmentSubjectId || !assignmentUnitId || !assignmentLectureId) {
        alert('Please select Subject, Unit, and Lecture.');
        return;
      }
  
      if (numMCQs <= 0 && numLongAnswers <= 0 && numShortAnswers <= 0) {
        alert('Number of MCQs, Long Answers, and Short Answers must be greater than zero.');
        return;
      }
  
      const numQuestions = numMCQs + numLongAnswers + numShortAnswers;
  
      // Make the API request to generate the assignment
      const response = await axios.post(
        `${import.meta.env.VITE_GENERATE_ASSIGNMENT}`,
        {
          subject_id: assignmentSubjectId,
          unit_id: assignmentUnitId,
          lecture_id: assignmentLectureId,
          num_questions: numQuestions,
          mcq_weightage: numMCQs / numQuestions,
          long_answer_weightage: numLongAnswers / numQuestions,
          short_answer_weightage: numShortAnswers / numQuestions,
        },
        {
          headers: {
            'GuruCool-API-Key': import.meta.env.VITE_API_KEY,
            'Content-Type': 'application/json',
            'bypass-tunnel-reminder': 'true',
          },
        }
      );

      const assignment = response.data;
  
      // Validate the assignment data
      if (!assignment || Object.values(assignment).some(value => value === undefined)) {
        console.error('Invalid assignment data:', assignment);
        alert('Assignment data is invalid. Please check the API response.');
        return;
      }
  
      // Save the generated assignment in Firestore
      const assignmentDocRef = await addDoc(collection(db, 'assignments'), {
        lectureId: assignmentLectureId,
        subjectId: assignmentSubjectId,
        unitId: assignmentUnitId,
        assignment: assignment, // Store the whole assignment response as assignment field
        createdAt: new Date(),
      });
  
      console.log('Assignment saved with ID:', assignmentDocRef.id);
  
      // Fetch the subject document to get the students array
      const subjectDocRef = doc(db, 'subjects', assignmentSubjectId);
      const subjectDoc = await getDoc(subjectDocRef);
  
      if (!subjectDoc.exists()) {
        console.error('Subject document not found');
        alert('Subject data not found.');
        return;
      }
  
      const subjectData = subjectDoc.data();
      const studentIds = subjectData.students || [];
  
      // Prepare the new assignment data to be added to each student's document
      const newAssignmentData = {
        assignmentId: assignmentDocRef.id,
        status: 'pending',
      };
  
      // Update each student document with the new assignment data
      for (const studentId of studentIds) {
        const studentDocRef = doc(db, 'users', studentId);
        const studentDoc = await getDoc(studentDocRef);
  
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          const existingAssignments = studentData.assignments || [];
  
          // Check if the assignment already exists for this student
          const assignmentExists = existingAssignments.some(
            assignment => assignment.assignmentId === newAssignmentData.assignmentId
          );
  
          if (!assignmentExists) {
            // Append the new assignment data
            existingAssignments.push(newAssignmentData);
            await updateDoc(studentDocRef, { assignments: existingAssignments });
          }
        } else {
          console.error('Student document not found:', studentId);
          // Optionally, you can log missing IDs or notify an administrator
        }
      }
  
      alert('Assignment generated and assigned to students successfully!');
    }  catch (error) {
      const url = import.meta.env.VITE_NOTIFICATION
      const data = {
        "text": "Start the server, teacher assignment",
      }
      axios.post(url, JSON.stringify(data), {
        withCredentials: false,
        transformRequest: [(data, headers) => {
          if (headers && headers.post) {
            delete headers.post["Content-Type"];
          }
          return data;
        }]
      })
        alert("Model is deployed on local machine. Students have been requested to start the server.");
    }
  };
    const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile); // Save the selected file in state
    }
  };

  const handleUpload = () => {
    if (!file) {
      alert('Please upload a file');
      return;
    }

    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    const fileType = file.type;

    if (fileType.includes('spreadsheetml') || fileType.includes('csv')) {
      processExcelOrCSVFile(file); // Process the Excel or CSV file
    } else {
      alert('Unsupported file format. Please upload a valid Excel or CSV file.');
    }
  };

  const getTimeRange = (time) => {
    const timeParts = time.match(/(\d{1,2}:\d{2} (AM|PM))/g); // Match start and end times like "9:00 AM"
    if (timeParts && timeParts.length === 2) {
      return [timeParts[0], timeParts[1]]; // Return start and end time
    } else if (timeParts && timeParts.length === 1) {
      return [timeParts[0], timeParts[0]]; // If there's only one time, it's assumed to be the same start and end time
    }
    return [null, null]; // If invalid format, return null
  };

  const getDateForDay = (day, startDate) => {
    const start = new Date(startDate);
    const dayOfWeek = dayMappings[day]; // Get the day of the week index (Monday = 0, etc.)

    if (typeof dayOfWeek === 'number') {
      const resultDate = addDays(start, dayOfWeek);
      return format(resultDate, 'yyyy-MM-dd'); // Return date in 'yyyy-MM-dd' format
    }

    return null; // If invalid day, return null
  };

  const processExcelOrCSVFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
  
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
      const daysOfWeek = jsonData[0]; // First row contains day headers (Monday, Tuesday, etc.)
      const timeSlots = jsonData.slice(1); // Remaining rows contain time slots and subjects
  
      // Process each time slot
      timeSlots.forEach((slot) => {
        const timeRange = getTimeRange(slot[0]); // Extract the time range (start and end)
        const [startTime, endTime] = timeRange;
  
        if (startTime && endTime) {
          daysOfWeek.slice(1).forEach((day, index) => {
            const classInfo = slot[index + 1]; // Get class info for each day
            if (classInfo && dayMappings[day]) {
              const eventDate = getDateForDay(day, startDate); // Get the date for this day
  
              if (eventDate) {
                // Ensure the eventDate is within the startDate and endDate range
                const eventDateTime = new Date(eventDate);
  
                // Skip Sundays (index 0) and any dates outside the start and end range
                if (eventDateTime >= new Date(startDate) && eventDateTime <= new Date(endDate) && eventDateTime.getDay() !== 0) {
                  const startDateTime = parse(`${eventDate} ${startTime}`, "yyyy-MM-dd hh:mm a", new Date());
                  const endDateTime = parse(`${eventDate} ${endTime}`, "yyyy-MM-dd hh:mm a", new Date());
  
                  if (!isNaN(startDateTime) && !isNaN(endDateTime)) {
                    const event = {
                      title: classInfo, // Class info from Excel
                      start: format(startDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
                      end: format(endDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
                      allDay: false,
                    };
                    addEventToCalendar(event); // This function now correctly adds userId as an array
                  }
                }
              }
            }
          });
        }
      });
    };
  
    reader.readAsArrayBuffer(file);
  };
  
const addEventToCalendar = async (event) => {
  try {
    // Ensure userId is stored in an array
    const eventToAdd = {
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay || false,
      userIds: [userId], // Store userId as an array
    };

    // Save the event to the database
    const docRef = await addDoc(collection(db, 'events'), eventToAdd);
    console.log('Event added with ID:', docRef.id);

    // Update the events in state
    setEvents((prevEvents) => [...prevEvents, { ...eventToAdd, id: docRef.id }]);
  } catch (error) {
    console.error('Error adding event:', error);
  }
};



  return (
    <div className="container mx-auto mt-10 p-4">
      <h1 className="text-center text-3xl font-bold text-white mb-8">Teacher Dashboard</h1>

      {/* Attendance Overview Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Attendance Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-blue-500 text-white p-4 rounded-md shadow-md">
            <h3 className="text-xl font-bold">Mathematics</h3>
            <p className="text-3xl mt-2">85% Present</p>
          </div>
          <div className="bg-blue-500 text-white p-4 rounded-md shadow-md">
            <h3 className="text-xl font-bold">Physics</h3>
            <p className="text-3xl mt-2">90% Present</p>
          </div>
        </div>
      </section>

      {/* Full Calendar for Events */}
      <section className="mb-8">
        <CalendarComponent userId={userId} />
      </section>

      {/* Timetable Upload Section */}
      <section className="mb-8 p-4 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-white mb-4">Upload Timetable</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <label className="flex-grow">
            <span className="sr-only">Choose timetable file</span>
            <input type="file" onChange={handleFileChange} accept=".csv, .xlsx, image/*"
              className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100" />
          </label>
          <label htmlFor="start-date" className="text-white font-medium">
            Start Date
          </label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="flex-grow p-2 rounded-lg bg-white border-gray-300 shadow-sm
            focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-black" />
        <label htmlFor="end-date" className="text-white font-medium">
            End Date
          </label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="flex-grow p-2 rounded-lg bg-white border-gray-300 shadow-sm
            focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-black" />
          <button onClick={handleUpload} className="flex-grow bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Upload and Process
          </button>
        </div>
      </section>

      {/* Generate Quiz Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Generate a Quiz</h2>
        <div className="p-4 rounded-md shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              className="block w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <select
              className="block w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
            >
              <option value="">Select Unit</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.title}
                </option>
              ))}
            </select>
            <select
              className="block w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedLectureId}
              onChange={(e) => setSelectedLectureId(e.target.value)}
            >
              <option value="">Select Lecture</option>
              {lectures.map(lecture => (
                <option key={lecture.id} value={lecture.id}>
                  {lecture.title}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerateQuiz}
            className="mt-4 w-full bg-blue-500 text-white p-2 rounded-md shadow-md hover:bg-blue-600"
          >
            Generate
          </button>
        </div>
      </section>
      
      
      {/* Generate Assignment Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Generate an Assignment</h2>
        <div className="p-4 rounded-md shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              className="block w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={assignmentSubjectId}
              onChange={(e) => setAssignmentSubjectId(e.target.value)}
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <select
              className="block w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={assignmentUnitId}
              onChange={(e) => setAssignmentUnitId(e.target.value)}
              disabled={!assignmentSubjectId}
            >
              <option value="">Select Unit</option>
              {assignmentUnits.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.title}
                </option>
              ))}
            </select>
            <select
              className="block w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={assignmentLectureId}
              onChange={(e) => setAssignmentLectureId(e.target.value)}
              disabled={!assignmentUnitId}
            >
              <option value="">Select Lecture</option>
              {assignmentLectures.map(lecture => (
                <option key={lecture.id} value={lecture.id}>
                  {lecture.title}
                </option>
              ))}
            </select>
          </div>
          {/* Rest of the assignment inputs and generate button */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="number"
              value={numMCQs}
              onChange={(e) => setNumMCQs(Number(e.target.value))}
              placeholder="Number of MCQs"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={numLongAnswers}
              onChange={(e) => setNumLongAnswers(Number(e.target.value))}
              placeholder="Number of Long Answers"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={numShortAnswers}
              onChange={(e) => setNumShortAnswers(Number(e.target.value))}
              placeholder="Number of Short Answers"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleGenerateAssignment}
            className="mt-4 w-full bg-blue-500 text-white p-2 rounded-md shadow-md hover:bg-blue-600"
          >
            Generate
          </button>
        </div>
      </section>

    {/* Course Policy Viewing Section */}
    <div className="p-6">
      <h2 className="text-3xl font-semibold mb-6 text-white">Course Policies</h2>
      <div className="space-y-4">
        {coursePolicies.length > 0 ? (
          coursePolicies.map((policy) => (
            <div
              key={policy.id}
              className="bg-white shadow-md rounded-lg p-4 border border-gray-300 hover:bg-blue-50 transition cursor-pointer"
              onClick={() => openModal(policy)}
            >
              <h3 className="text-xl font-medium text-gray-800">{policy.subject}</h3>
              <p className="text-sm text-gray-600">Click to view and edit the course policy.</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No course policies available.</p>
        )}
      </div>

      {/* Modal for displaying and editing course policy */}
      <Modal
  isOpen={modalIsOpen}
  onRequestClose={closeModal}
  className="relative w-full max-w-4xl md:max-w-3xl sm:max-w-xl mx-auto bg-white rounded-lg shadow-lg mt-10 sm:mt-5 p-4 sm:p-6 md:p-8"
>
  <div className="p-4 sm:p-6 md:p-8">
    <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 mb-4 sm:mb-6 border-b pb-2 sm:pb-4">
      {selectedPolicy?.subject} - Course Policy
    </h3>
    <div className="space-y-4">
      <label className="text-md sm:text-lg font-medium text-gray-700">Edit Course Policy</label>
      <textarea
        value={policyText}
        onChange={(e) => setPolicyText(e.target.value)}
        className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        style={{ height: '250px' }}
      />
    </div>
    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t pt-4">
      <div className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-0">Last Updated: {new Date().toLocaleDateString()}</div>
      <div className="space-y-2 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row">
        <button
          onClick={handleUpdate}
          className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-blue-500 text-white font-semibold rounded-lg shadow hover:bg-blue-600 transition duration-200"
        >
          Update Policy
        </button>
        <button
          onClick={handleDelete}
          className="w-full sm:w-auto bg-red-500 text-white px-4 py-2 sm:px-4 sm:py-2 rounded hover:bg-red-600"
        >
          Delete
        </button>
        <button
          onClick={downloadAsTxtFile}
          className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-green-500 text-white font-semibold rounded-lg shadow hover:bg-green-600 transition duration-200"
        >
          Download as TXT
        </button>
        <button
          onClick={closeModal}
          className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-gray-500 text-white font-semibold rounded-lg shadow hover:bg-gray-600 transition duration-200"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</Modal>


    </div>

      {/* Notifications Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Notifications</h2>
        <div className="bg-gray-800 text-white p-4 rounded-md shadow-md">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <div key={notification.id} className="mb-2">
                <p>{notification.message}</p>
                <small>{new Date(notification.timestamp.seconds * 1000).toLocaleString()}</small>
              </div>
            ))
          ) : (
            <p>No notifications available.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
