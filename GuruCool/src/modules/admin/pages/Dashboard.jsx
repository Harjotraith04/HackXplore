import React, { useState, useEffect } from 'react';
import { db, doc, updateDoc, setDoc, onSnapshot, Timestamp, deleteDoc, collection } from '../../../firebaseConfig';

const Dashboard = () => {
  // State to manage notifications and UI
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notificationsData);
    });

    return () => unsubscribe();
  }, []);

  // Toggle the popup visibility
  const handlePopupToggle = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  // Handle the emergency type selection
  const handleEmergencyChange = (e) => {
    setSelectedEmergency(e.target.value);
  };

  // Handle custom message input change
  const handleCustomMessageChange = (e) => {
    setCustomMessage(e.target.value);
  };

  // Send notification to Firebase
  const handleSendNotification = async () => {
    const message = selectedEmergency === 'Other' ? customMessage : selectedEmergency;

    if (message) {
      const docRef = doc(collection(db, 'notifications'));

      try {
        await setDoc(docRef, {
          dismissed: false,
          sent: true,
          message,
          timestamp: Timestamp.now(),
        });
        alert('Notification Sent Successfully!');
        setSelectedEmergency("");
        setCustomMessage("");
        setIsPopupOpen(false);
      } catch (error) {
        console.error('Error sending notification: ', error);
        alert('Failed to send notification.');
      }
    } else {
      alert('Please select an emergency type or enter a custom message.');
    }
  };

  // Delete a notification
  const handleDeleteNotification = async (id) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      alert('Notification deleted successfully!');
    } catch (error) {
      console.error('Error deleting notification: ', error);
      alert('Failed to delete notification.');
    }
  };

  // Edit a notification
  const handleEditNotification = async (id, newMessage) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { message: newMessage });
      alert('Notification edited successfully!');
    } catch (error) {
      console.error('Error editing notification: ', error);
      alert('Failed to edit notification.');
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-center text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      {/* Inventory and Issued Items Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Inventory Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-blue-500 text-white p-4 rounded-md shadow-md">
            <h3 className="text-xl font-bold">Total Inventory</h3>
            <p className="text-3xl mt-2">1500</p>
          </div>
          <div className="bg-red-500 text-white p-4 rounded-md shadow-md">
            <h3 className="text-xl font-bold">Issued Items</h3>
            <p className="text-3xl mt-2">300</p>
          </div>
        </div>
      </section>

      {/* Subjects and Lectures Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Subjects & Lectures</h2>
        <div className="p-4 rounded-md shadow-md">
          <table className="w-full table-auto text-white">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Subject</th>
                <th className="px-4 py-2 text-left">Completed Lectures</th>
                <th className="px-4 py-2 text-left">Total Lectures</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2">Mathematics</td>
                <td className="border px-4 py-2">8</td>
                <td className="border px-4 py-2">10</td>
              </tr>
              <tr>
                <td className="border px-4 py-2">Physics</td>
                <td className="border px-4 py-2">6</td>
                <td className="border px-4 py-2">8</td>
              </tr>
              <tr>
                <td className="border px-4 py-2">Chemistry</td>
                <td className="border px-4 py-2">7</td>
                <td className="border px-4 py-2">9</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Additional Metrics Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-green-500 text-white p-4 rounded-md shadow-md">
            <h3 className="text-xl font-bold">Average Lecture Completion Rate</h3>
            <p className="text-3xl mt-2">80%</p>
          </div>
          <div className="bg-yellow-500 text-white p-4 rounded-md shadow-md">
            <h3 className="text-xl font-bold">Pending Approvals</h3>
            <p className="text-3xl mt-2">5</p>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Notifications</h2>
        <div className="p-4 rounded-md shadow-md bg-gray-800">
          <ul className="list-disc pl-4">
            {notifications.map(notification => (
              <li key={notification.id} className="mb-2 flex flex-col sm:flex-row sm:justify-between">
                <span className='text-white mb-2 sm:mb-0'>
                  {notification.message} - {new Date(notification.timestamp.toDate()).toLocaleString()}
                </span>
                <div className="flex flex-col sm:flex-row">
                  <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold py-2 px-4 rounded-md mb-2 sm:mb-0 sm:mr-2 w-full sm:w-auto"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      const newMessage = prompt('Edit your message:', notification.message);
                      if (newMessage) handleEditNotification(notification.id, newMessage);
                    }}
                    className="bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold py-2 px-4 rounded-md w-full sm:w-auto"
                  >
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>


      {/* SOS Notification Popup */}
      <section>
        <button onClick={handlePopupToggle} className="bg-blue-500 text-white p-2 rounded">
          {isPopupOpen ? "Close Notification Popup" : "Open Notification Popup"}
        </button>
        {isPopupOpen && (
          <div className="bg-white p-4 mt-4 rounded shadow-md">
            <select value={selectedEmergency} onChange={handleEmergencyChange} className="w-full p-2 border rounded">
              <option value="">Select Emergency Type</option>
              <option value="Fire">Fire</option>
              <option value="Earthquake">Earthquake</option>
              <option value="Other">Other</option>
            </select>
            {selectedEmergency === 'Other' && (
              <input
                type="text"
                value={customMessage}
                onChange={handleCustomMessageChange}
                placeholder="Enter custom message"
                className="w-full mt-2 p-2 border rounded"
              />
            )}
            <button onClick={handleSendNotification} className="bg-green-500 text-white p-2 rounded mt-4">
              Send Notification
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
