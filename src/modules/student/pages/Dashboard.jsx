import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, db, doc, getFirestore, getDoc } from '../../../firebaseConfig';
import CalendarComponent from '../../../components/CalendarComponent';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const [notifications, setNotifications] = useState([]);
  const [auraScore, setAuraScore] = useState(1000); // Example initial score
  const [rank, setRank] = useState("Novice Learner");
  const [recentActivities, setRecentActivities] = useState([]);
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [events, setEvents] = useState([]);
  const dayMappings = { 'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5 };

  const { userId } = useParams();

  useEffect(() => {
    if (userId) {
      const db = getFirestore();
      const userRef = doc(db, 'users', userId);

      const unsubscribeUser = onSnapshot(userRef, async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setAuraScore(userData.aura || 1000);

          const recentAuras = userData.recentAuras || [];
          const recentActivityData = await Promise.all(
            recentAuras.map(async (aura) => {
              const subjectRef = doc(db, 'subjects', aura.subjectId);
              const subjectSnapshot = await getDoc(subjectRef);

              const subjectName = subjectSnapshot.exists() ? subjectSnapshot.data().name : 'Unknown Subject';

              return {
                activity: `${subjectName} ${aura.activityType}`,
                points: aura.auraChange,
              };
            })
          );

          setRecentActivities(recentActivityData);
        }
      });

      const unsubscribeNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => doc.data());
        setNotifications(notificationsData);

        notificationsData.forEach((notification) => {
          const notificationTime = notification.timestamp.toDate();
          const currentTime = new Date();
          const timeDifference = (currentTime - notificationTime) / (1000 * 60);

          if (timeDifference <= 60) {
            alert(`New Notification: ${notification.message}`);
          }
        });
      });

      return () => {
        unsubscribeUser();
        unsubscribeNotifications();
      };
    }
  }, [userId]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
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

    const fileType = file.type;

    if (fileType.includes('spreadsheetml') || fileType.includes('csv')) {
      processExcelOrCSVFile(file);
    } else {
      alert('Unsupported file format. Please upload a valid Excel or CSV file.');
    }
  };

  const getTimeRange = (time) => {
    const timeParts = time.match(/(\d{1,2}:\d{2} (AM|PM))/g);
    if (timeParts && timeParts.length === 2) {
      return [timeParts[0], timeParts[1]];
    } else if (timeParts && timeParts.length === 1) {
      return [timeParts[0], timeParts[0]];
    }
    return [null, null];
  };

  const getDateForDay = (day, startDate) => {
    const start = new Date(startDate);
    const dayOfWeek = dayMappings[day];

    if (typeof dayOfWeek === 'number') {
      const resultDate = addDays(start, dayOfWeek);
      return format(resultDate, 'yyyy-MM-dd');
    }

    return null;
  };

  const processExcelOrCSVFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const daysOfWeek = jsonData[0];
      const timeSlots = jsonData.slice(1);

      timeSlots.forEach((slot) => {
        const timeRange = getTimeRange(slot[0]);
        const [startTime, endTime] = timeRange;

        if (startTime && endTime) {
          daysOfWeek.slice(1).forEach((day, index) => {
            const classInfo = slot[index + 1];
            if (classInfo && dayMappings[day]) {
              const eventDate = getDateForDay(day, startDate);

              if (eventDate) {
                const eventDateTime = new Date(eventDate);

                if (eventDateTime >= new Date(startDate) && eventDateTime <= new Date(endDate) && eventDateTime.getDay() !== 0) {
                  const startDateTime = parse(`${eventDate} ${startTime}`, "yyyy-MM-dd hh:mm a", new Date());
                  const endDateTime = parse(`${eventDate} ${endTime}`, "yyyy-MM-dd hh:mm a", new Date());

                  if (!isNaN(startDateTime) && !isNaN(endDateTime)) {
                    const event = {
                      title: classInfo,
                      start: format(startDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
                      end: format(endDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
                      allDay: false,
                    };
                    addEventToCalendar(event);
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
      const eventToAdd = {
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay || false,
        userIds: [userId],
      };

      const docRef = await addDoc(collection(db, 'events'), eventToAdd);
      setEvents((prevEvents) => [...prevEvents, { ...eventToAdd, id: docRef.id }]);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-white">
      <h1 className="text-center text-3xl font-bold mb-8">Student Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">AURA Score</h2>
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-6 rounded-md shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold">Current AURA Score</h3>
              <p className="text-4xl mt-2">{auraScore}</p>
              <p className="text-lg mt-1">{rank}</p>
            </div>
            <div className="text-center">
              <p className="text-lg">Badges Earned</p>
              <div className="flex justify-center mt-2 space-x-2">
                <div className="w-10 h-10 bg-yellow-300 rounded-full flex items-center justify-center">🏅</div>
                <div className="w-10 h-10 bg-blue-300 rounded-full flex items-center justify-center">🌟</div>
              </div>
            </div>
          </div>
          <h4 className="text-lg font-bold mb-2">Recent Activities</h4>
          <ul>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <li key={index} className={`mb-1 ${activity.points > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {activity.activity}: {activity.points > 0 ? `+${activity.points}` : activity.points} points
                </li>
              ))
            ) : (
              <li>No recent activities found</li>
            )}
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <div className="mt-6">
          <h4 className="text-lg font-bold mb-2">Your Calendar</h4>
          <CalendarComponent userId={userId} />
        </div>
      </section>

      <section className="mb-8 p-4 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Upload Timetable</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <label className="flex-grow">
            <span className="sr-only">Choose timetable file</span>
            <input type="file" onChange={handleFileChange} accept=".csv, .xlsx, image/*"
              className="block w-full text-sm text-white
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

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Course Progress</h2>
        <div className="bg-blue-500 text-white p-4 rounded-md shadow-md">
          <h3 className="text-xl font-bold">Mathematics</h3>
          <p className="text-3xl mt-2">75% Complete</p>
          <div className="bg-gray-200 h-2 rounded-md overflow-hidden mt-2">
            <div className="bg-green-500 h-full" style={{ width: '75%' }}></div>
          </div>
        </div>
        <div className="bg-blue-500 text-white p-4 rounded-md shadow-md mt-4">
          <h3 className="text-xl font-bold">Physics</h3>
          <p className="text-3xl mt-2">60% Complete</p>
          <div className="bg-gray-200 h-2 rounded-md overflow-hidden mt-2">
            <div className="bg-green-500 h-full" style={{ width: '60%' }}></div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Upcoming Assignments</h2>
        <div className="p-4 rounded-md shadow-md">
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Assignment</th>
                <th className="px-4 py-2 text-left">Due Date</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2">Math Homework #3</td>
                <td className="border px-4 py-2">02/09/2024</td>
                <td className="border px-4 py-2 text-yellow-500">Pending</td>
              </tr>
              <tr>
                <td className="border px-4 py-2">Physics Lab Report</td>
                <td className="border px-4 py-2">05/09/2024</td>
                <td className="border px-4 py-2 text-green-500">Completed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Recent Grades</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-green-500 text-white p-4 rounded-md shadow-md">
            <h3 className="text-xl font-bold">Mathematics</h3>
            <p className="text-3xl mt-2">A</p>
          </div>
          <div className="bg-green-500 text-white p-4 rounded-md shadow-md">
            <h3 className="text-xl font-bold">Physics</h3>
            <p className="text-3xl mt-2">B+</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
        <div className="p-4 rounded-md shadow-md">
          <ul className="list-disc pl-4">
            {notifications.map((notification, index) => (
              <li key={index} className="mb-2">
                {notification.message} - {new Date(notification.timestamp.toDate()).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
