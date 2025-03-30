import React, { useState, useEffect } from 'react';
import { db } from '../../../firebaseConfig';
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';

const AdminEvents = () => {
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [duration, setDuration] = useState('1 hour');
  const [userIds, setUserIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
        const subjectsList = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubjects(subjectsList);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchUnits = async () => {
      if (selectedSubjectId) {
        try {
          const subjectDoc = doc(db, 'subjects', selectedSubjectId);
          const unitsSnapshot = await getDocs(collection(subjectDoc, 'units'));
          const unitsList = unitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUnits(unitsList);
        } catch (error) {
          console.error('Error fetching units:', error);
        }
      }
    };
    fetchUnits();
  }, [selectedSubjectId]);

  useEffect(() => {
    const fetchLectures = async () => {
      if (selectedUnitId) {
        try {
          const unitDoc = doc(db, 'subjects', selectedSubjectId, 'units', selectedUnitId);
          const lecturesSnapshot = await getDocs(collection(unitDoc, 'lectures'));
          const lecturesList = lecturesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setLectures(lecturesList);
        } catch (error) {
          console.error('Error fetching lectures:', error);
        }
      }
    };
    fetchLectures();
  }, [selectedUnitId]);

  useEffect(() => {
    const fetchUserIds = async () => {
      if (selectedSubjectId) {
        try {
          const subjectDocRef = doc(db, 'subjects', selectedSubjectId);
          const subjectDocSnapshot = await getDoc(subjectDocRef);
          const subjectData = subjectDocSnapshot.data();

          const studentIds = subjectData?.students || [];
          const teacherIds = subjectData?.teachers || [];

          setUserIds([...studentIds, ...teacherIds]);
        } catch (error) {
          console.error('Error fetching user IDs:', error);
        }
      }
    };
    fetchUserIds();
  }, [selectedSubjectId]);

  const handleAddEvent = async () => {
    try {
      if (!selectedLectureId || !eventTitle || !eventDate || !eventTime || !duration) {
        alert('Please fill all fields.');
        return;
      }

      // Create start and end times
      const start = new Date(`${eventDate}T${eventTime}`).toISOString();
      const durationInHours = duration === '1 hour' ? 1 : 2;
      const end = new Date(new Date(start).getTime() + durationInHours * 60 * 60 * 1000).toISOString(); // Dynamic duration

      // Add event to Firestore
      await addDoc(collection(db, 'events'), {
        allDay: false,
        end,
        start,
        title: eventTitle,
        userIds,
      });

      alert('Event added successfully!');
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setEventTime('');
      setSelectedLectureId('');
      setDuration('1 hour');
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-center text-3xl font-bold text-white">Admin - Add Event</h1>
      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700">Create New Event</h2>

        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="block w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Subject</option>
          {subjects.map(subject => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        {units.length > 0 && (
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="block w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" >Select Unit</option>
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>
                {unit.title}
              </option>
            ))}
          </select>
        )}

        <div className='text-white'>
          {lectures.length > 0 && (
            <select
              value={selectedLectureId}
              onChange={(e) => setSelectedLectureId(e.target.value)}
              className="block w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">Select Lecture</option>
              {lectures.map(lecture => (
                <option key={lecture.id} value={lecture.id} style={{ backgroundColor: 'black', color: 'white' }}>
                  {lecture.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <input
          type="text"
          placeholder="Event Title"
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
          className="block w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          placeholder="Event Description"
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
          className="block w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="event-date" className="text-black font-medium">
            Event Date
          </label>
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="block w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
          <label htmlFor="event-time" className="text-black font-medium">
            Event Time
          </label>
        <input
          type="time"
          value={eventTime}
          onChange={(e) => setEventTime(e.target.value)}
          className="block w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          style={{ backgroundColor: 'black', color: 'white' }}
          className="block w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="1 hour" style={{ backgroundColor: 'black', color: 'white' }}>1 Hour</option>
          <option value="2 hours" style={{ backgroundColor: 'black', color: 'white' }}>2 Hours</option>
        </select>

        <button
          onClick={handleAddEvent}
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 mt-4"
        >
          Add Event
        </button>
      </section>
    </div>
  );
};

export default AdminEvents;
