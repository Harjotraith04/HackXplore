import React, { useState, useEffect, useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDocs, getDoc } from '../../../firebaseConfig'; // Adjust import path

ChartJS.register(Title, Tooltip, Legend, ArcElement);

const AdminResources = () => {
  const [resourceName, setResourceName] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceQuantity, setResourceQuantity] = useState('');
  const [resources, setResources] = useState([]);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedQuantity, setEditedQuantity] = useState('');
  const [borrowedQuantity, setBorrowedQuantity] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [requests, setRequests] = useState([]);
  
  const [newResourceName, setNewResourceName] = useState('');
  const [newResourceDescription, setNewResourceDescription] = useState('');
  const [newResourceQuantity, setNewResourceQuantity] = useState('');

  const buttonStyle = "text-white font-bold py-1 px-4 rounded-md hover:shadow-md focus:outline-none";

  const resourcesCollection = collection(db, 'resources');
  const requestsCollection = collection(db, 'resourceRequests');

  useEffect(() => {
    const unsubscribeResources = onSnapshot(resourcesCollection, snapshot => {
      const resourcesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResources(resourcesData);
    });

    const unsubscribeRequests = onSnapshot(requestsCollection, snapshot => {
      const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("hello")
      requestsData.forEach(element => { 
        delete element.createdAt
        delete element.dateNeeded
        
      });
      setRequests(requestsData);
      console.log(requestsData);
    });

    return () => {
      unsubscribeResources();
      unsubscribeRequests();
    };
  }, []);

  const handleAddResource = async () => {
    if (resourceQuantity <= 0) {
      setErrorMessage('Quantity must be greater than 0');
      return;
    }
    try {
      await addDoc(resourcesCollection, {
        type: resourceName,
        description: resourceDescription,
        quantity: parseInt(resourceQuantity),
        borrowed: 0,
        available: parseInt(resourceQuantity)
      });
      setResourceName('');
      setResourceDescription('');
      setResourceQuantity('');
      setErrorMessage('');
    } catch (error) {
      console.error('Error adding resource:', error);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      await deleteDoc(doc(db, 'resources', resourceId));
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const handleUpdateResource = async () => {
    if (editedQuantity <= 0 || borrowedQuantity < 0) {
      setErrorMessage('Invalid quantities');
      return;
    }
    if (parseInt(editedQuantity) < borrowedQuantity) {
      setErrorMessage('Borrowed quantity cannot exceed total quantity');
      return;
    }
    const availableQuantity = parseInt(editedQuantity) - borrowedQuantity;
    if (availableQuantity < 0) {
      setErrorMessage('Available quantity cannot be negative');
      return;
    }

    try {
      await updateDoc(doc(db, 'resources', editingResourceId), {
        type: editedName,
        description: editedDescription,
        quantity: parseInt(editedQuantity),
        available: availableQuantity,
        borrowed: borrowedQuantity
      });
      setEditingResourceId(null);
      setEditedName('');
      setEditedDescription('');
      setEditedQuantity('');
      setBorrowedQuantity(0);
      setErrorMessage('');
    } catch (error) {
      console.error('Error updating resource:', error);
    }
  };

  const handleEditClick = (resource) => {
    setEditingResourceId(resource.id);
    setEditedName(resource.type);
    setEditedDescription(resource.description);
    setEditedQuantity(resource.quantity);
    setBorrowedQuantity(resource.borrowed);
    setErrorMessage('');
  };

  const handleCancelEdit = () => {
    setEditingResourceId(null);
    setEditedName('');
    setEditedDescription('');
    setEditedQuantity('');
    setBorrowedQuantity(0);
    setErrorMessage('');
  };
  const handleRequestApproval = async (requestId) => {
    try {
      // Fetch the request details from 'resourceRequests' collection
      const requestSnapshot = await getDoc(doc(db, 'resourceRequests', requestId));
      const request = requestSnapshot.data();
    
      if (!request) {
        throw new Error('Request not found');
      }
    
      // Fetch the resource details from the 'resources' collection using resource name
      const resourcesSnapshot = await getDocs(collection(db, 'resources'));
      const resourceDoc = resourcesSnapshot.docs.find(doc => 
        doc.data().type === request.resourceType
      );
      const resource = resourceDoc?.data();
    
      if (!resource) {
        throw new Error('Resource not found');
      }
  
      // Convert resource quantities to numbers
      const available = parseInt(resource.available, 10);
      const borrowed = parseInt(resource.borrowed, 10) || 0;
      const requestQuantity = parseInt(request.quantity, 10);
    
      // Check if the resource is available in sufficient quantity
      if (available >= requestQuantity) {
        const updatedAvailable = available - requestQuantity;
        const updatedBorrowed = borrowed + requestQuantity;
  
        // Update the resource availability in the 'resources' collection
        await updateDoc(doc(db, 'resources', resourceDoc.id), {
          available: updatedAvailable,
          borrowed: updatedBorrowed
        });
    
        // Update the request status to 'Approved' in the 'resourceRequests' collection
        await updateDoc(doc(db, 'resourceRequests', requestId), {
          status: 'Approved'
        });
      } else {
        setErrorMessage('Not enough available resources');
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };
  
  
  
  const handleRequestRejection = async (requestId) => {
    try {
      // Update the request status to 'Rejected' instead of deleting it
      await updateDoc(doc(db, 'resourceRequests', requestId), {
        status: 'Rejected'
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };
  

  const handleAddNewResource = async () => {

    // Check if any field is empty
    if (!newResourceName.trim() || !newResourceDescription.trim() || !newResourceQuantity.trim()) {
      setErrorMessage('All fields are required.');
      return;
    }

    if (newResourceQuantity <= 0) {
      setErrorMessage('Quantity must be greater than 0');
      return;
    }
    try {
      await addDoc(resourcesCollection, {
        type: newResourceName,
        description: newResourceDescription,
        quantity: parseInt(newResourceQuantity),
        borrowed: 0,
        available: parseInt(newResourceQuantity)
      });
      setNewResourceName('');
      setNewResourceDescription('');
      setNewResourceQuantity('');
      setErrorMessage('');
    } catch (error) {
      console.error('Error adding new resource:', error);
    }
  };

  const chartData = useMemo(() => {
    const labels = resources.map(resource => resource.type);
    const data = resources.map(resource => resource.quantity);

    return {
      labels,
      datasets: [
        {
          label: 'Resource Quantities',
          data,
          backgroundColor: data.map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`),
        },
      ],
    };
  }, [resources]);
   
  const PRT = requests.filter(request => request.status === 'Pending' && request.userType === 'Teacher');
  const ART = requests.filter(request => request.status === 'Approved' && request.userType === 'Teacher');
  const RRT = requests.filter(request => request.status === 'Rejected' && request.userType === 'Teacher');
  const CRT = requests.filter(request => request.status === 'Completed' && request.userType === 'Teacher');

  const PRS = requests.filter(request => request.status === 'Pending' && request.userType === 'Student');
  const ARS = requests.filter(request => request.status === 'Approved' && request.userType === 'Student');
  const RRS = requests.filter(request => request.status === 'Rejected' && request.userType === 'Student');
  const CRS = requests.filter(request => request.status === 'Completed' && request.userType === 'Student');

  const handleDelete = async (id) => {
    try {
        // Delete the request from the resourceRequests collection
        await deleteDoc(doc(db, 'resourceRequests', id));
        
        // Check if the request ID exists in any user's document
        const userSnapshot = await getDocs(collection(db, 'users'));
        const usersToUpdate = [];

        userSnapshot.forEach(userDoc => {
            const userData = userDoc.data();
            if (userData.requests && userData.requests.includes(id)) {
                usersToUpdate.push(userDoc.id);
            }
        });

        // Update each user's document by removing the deleted request ID
        for (const userId of usersToUpdate) {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const updatedRequests = userData.requests.filter(reqId => reqId !== id);
                await updateDoc(userDocRef, { requests: updatedRequests });
            }
        }

        alert('Request deleted successfully!');
    } catch (error) {
        console.error('Error deleting document: ', error);
        alert('Failed to delete request. Please try again.');
    }
};

   
  return (
    <div className="container mx-auto p-2 sm:p-6 md:p-6 lg:p-8">
      <h1 className="text-center text-2xl sm:text-3xl font-bold text-white">Admin - Resources</h1>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-md mb-4">
          {errorMessage}
        </div>
      )}

      {/* Pie Chart Section */}
      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700">Resource Quantities</h2>
        <div className="flex justify-center">
          <div className=" mx-auto h-72">
            <Pie data={chartData} />
          </div>
        </div>
      </section>

      {/* Resource Inventory Section */}
      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700">Resource Inventory</h2>
        <div className="overflow-x-auto">
        <table className="md:w-full mt-4 bg-white border border-gray-200 rounded-md mb-6 table-fixed text-xs sm:text-sm md:text-base lg:text-base">
          <thead>
            <tr>
              <th className="py-1 px-4 border-b text-black text-left">Inventory Item</th>
              <th className="py-1 px-4 border-b text-black text-left">Quantity</th>
              <th className="py-1 px-4 border-b text-black text-left">Available</th>
              <th className="py-1 px-4 border-b text-black text-left">Borrowed</th>
              <th className="py-1 px-4 border-b text-black text-left">Description</th>
              <th className="py-1 px-4 border-b text-black text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map(resource => (
              <tr key={resource.id}>
                <td className="py-1 px-4 border-b">
                  {editingResourceId === resource.id ? (
                    <input
                      type="text"
                      className="block w-full p-2 border rounded-md bg-gray-200 text-black"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                    />
                  ) : (
                    <span className="text-black">{resource.type}</span>
                  )}
                </td>
                <td className="py-1 px-4 border-b text-black">
                  {editingResourceId === resource.id ? (
                    <input
                      type="number"
                      className="block w-full p-2 border rounded-md bg-gray-200"
                      value={editedQuantity}
                      onChange={(e) => setEditedQuantity(e.target.value)}
                    />
                  ) : (
                    <span>{resource.quantity}</span>
                  )}
                </td>
                <td className="py-1 px-4 border-b text-black">
                  {editingResourceId === resource.id ? (
                    <input
                      type="number"
                      className="block w-full p-2 border rounded-md bg-gray-200"
                      value={resource.available}
                      readOnly
                    />
                  ) : (
                    <span>{resource.available}</span>
                  )}
                </td>
                <td className="py-1 px-4 border-b text-black">
                  {editingResourceId === resource.id ? (
                    <input
                      type="number"
                      className="block w-full p-2 border rounded-md bg-gray-200"
                      value={borrowedQuantity}
                      onChange={(e) => setBorrowedQuantity(e.target.value)}
                    />
                  ) : (
                    <span>{resource.borrowed}</span>
                  )}
                </td>
                <td className="py-1 px-4 border-b text-black">
                  {editingResourceId === resource.id ? (
                    <input
                      type="text"
                      className="block w-full p-2 border rounded-md bg-gray-200"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                    />
                  ) : (
                    <span>{resource.description}</span>
                  )}
                </td>
                <td className="py-1 px-4 border-b">
                  {editingResourceId === resource.id ? (
                    <>
                    <div className="flex flex-col xl:flex-row xl:space-y-0 space-y-2 xl:space-x-2">
                      <button
                        className={`${buttonStyle} bg-blue-500 w-24`}
                        onClick={handleUpdateResource}
                      >
                        Save
                      </button>
                      <button
                        className={`${buttonStyle} bg-gray-500 w-24`}
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col xl:flex-row xl:space-y-0 space-y-2 xl:space-x-2 w-full">
                      <button
                        className={`${buttonStyle} bg-yellow-500 w-24`}
                        onClick={() => handleEditClick(resource)}
                      >
                        Edit
                      </button>
                      <button
                        className={`${buttonStyle} bg-red-500 w-24`}
                        onClick={() => handleDeleteResource(resource.id)}
                      >Delete
                      </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>

      {/* Add New Resource Section */}
      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700">Add New Resource</h2>
        <div className="mt-4">
          <input
            type="text"
            className="block w-full p-2 border rounded-md mb-4"
            placeholder="Resource Name"
            value={newResourceName}
            onChange={(e) => setNewResourceName(e.target.value)}
          />
          <input
            type="text"
            className="block w-full p-2 border rounded-md mb-4"
            placeholder="Resource Description"
            value={newResourceDescription}
            onChange={(e) => setNewResourceDescription(e.target.value)}
          />
          <input
            type="number"
            className="block w-full p-2 border rounded-md mb-4"
            placeholder="Resource Quantity"
            value={newResourceQuantity}
            onChange={(e) => setNewResourceQuantity(e.target.value)}
          />
          <button
            className={`${buttonStyle} bg-green-500`}
            onClick={handleAddNewResource}
          >
            Add Resource
          </button>
        </div>
      </section>

      {/* Requests Section */}
      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md text-black">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700">Teacher Requests</h2>
      {/* Teacher Requests - Pending Section */}
      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700">Pending Teacher Requests</h2>
        <div className="overflow-x-auto">
        <table className="md:w-full mt-4 bg-white border border-gray-200 rounded-md mb-6 table-fixed text-xs sm:text-sm md:text-base lg:text-base">
          <thead>                                                                                                                                              
            <tr>
              <th className="py-1 px-4 border-b text-left">Teacher Name</th>
              <th className="py-1 px-4 border-b text-left">Classroom</th>
              <th className="py-1 px-4 border-b text-left">Subject</th>
              <th className="py-1 px-4 border-b text-left">Resource Type</th>
              <th className="py-1 px-4 border-b text-black text-left">Duration From</th>
              <th className="py-1 px-4 border-b text-black text-left">Duration To</th>
              <th className="py-1 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {PRT.map(request => (
              <tr key={request.id}>
                <td className="py-1 px-4 border-b">{request.name}</td>
                <td className="py-1 px-4 border-b">{request.classroom}</td>
                <td className="py-1 px-4 border-b">{request.subject}</td>
                <td className="py-1 px-4 border-b">{request.resourceType}</td>
                <td className="py-1 px-4 border-b">{request.durationFrom}</td>
                <td className="py-1 px-4 border-b">{request.durationTo}</td>
                <td className="py-1 px-4 border-b">
                  <button
                    className={`${buttonStyle} bg-green-500 text-xs sm:text-sm`}
                    onClick={() => handleRequestApproval(request.id)}
                  >
                    Approve
                  </button>
                  <button
                    className={`${buttonStyle} bg-red-500 ml-2 text-xs sm:text-sm`}
                    onClick={() => handleRequestRejection(request.id)}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
      {/* Approved Requests Section */}
      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700">Approved Teacher Requests</h2>
        <div className="overflow-x-auto">
        <table className="md:w-full mt-4 bg-white border border-gray-200 rounded-md mb-6 table-fixed text-xs sm:text-sm md:text-base lg:text-base">
          <thead>
            <tr>
              <th className="py-1 px-4 border-b text-left">Teacher Name</th>
              <th className="py-1 px-4 border-b text-left">Classroom</th>
              <th className="py-1 px-4 border-b text-left">Subject</th>
              <th className="py-1 px-4 border-b text-left">Resource Type</th>
              <th className="py-1 px-4 border-b text-black text-left">Duration From</th>
              <th className="py-1 px-4 border-b text-black text-left">Duration To</th>
            </tr>
          </thead>
          <tbody>
            {ART.map(request => (
              <tr key={request.id}>
                <td className="py-1 px-4 border-b">{request.name}</td>
                <td className="py-1 px-4 border-b">{request.classroom}</td>
                <td className="py-1 px-4 border-b">{request.subject}</td>
                <td className="py-1 px-4 border-b">{request.resourceType}</td>
                <td className="py-1 px-4 border-b">{request.durationFrom}</td>
                <td className="py-1 px-4 border-b">{request.durationTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
      {/* Rejected Requests Section */}
      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700">Rejected Teacher Requests</h2>
        <div className="overflow-x-auto">
        <table className="md:w-full mt-4 bg-white border border-gray-200 rounded-md mb-6 table-fixed text-xs sm:text-sm md:text-base lg:text-base">
          <thead>
            <tr>
              <th className="py-1 px-4 border-b text-left">Teacher Name</th>
              <th className="py-1 px-4 border-b text-left">Classroom</th>
              <th className="py-1 px-4 border-b text-left">Subject</th>
              <th className="py-1 px-4 border-b text-left">Resource Type</th>
              <th className="py-1 px-4 border-b text-black text-left">Duration From</th>
              <th className="py-1 px-4 border-b text-black text-left">Duration To</th>
            </tr>
          </thead>
          <tbody>
            {RRT.map(request => (
              <tr key={request.id}>
                <td className="py-1 px-4 border-b">{request.name}</td>
                <td className="py-1 px-4 border-b">{request.classroom}</td>
                <td className="py-1 px-4 border-b">{request.subject}</td>
                <td className="py-1 px-4 border-b">{request.resourceType}</td>
                <td className="py-1 px-4 border-b">{request.durationFrom}</td>
                <td className="py-1 px-4 border-b">{request.durationTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700">Completed Teacher Requests</h2>
            <div className="overflow-x-auto">
                <table className="md:w-full mt-4 bg-white border border-gray-200 rounded-md mb-6 table-fixed text-xs sm:text-sm md:text-base lg:text-base">
                    <thead>
                        <tr>
                            <th className="py-1 px-4 border-b text-left">Teacher Name</th>
                            <th className="py-1 px-4 border-b text-left">Classroom</th>
                            <th className="py-1 px-4 border-b text-left">Subject</th>
                            <th className="py-1 px-4 border-b text-left">Resource Type</th>
                            <th className="py-1 px-4 border-b text-black text-left">Duration From</th>
                            <th className="py-1 px-4 border-b text-black text-left">Duration To</th>
                            <th className="py-1 px-4 border-b text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {CRT.map(request => (
                            <tr key={request.id}>
                                <td className="py-1 px-4 border-b">{request.name}</td>
                                <td className="py-1 px-4 border-b">{request.classroom}</td>
                                <td className="py-1 px-4 border-b">{request.subject}</td>
                                <td className="py-1 px-4 border-b">{request.resourceType}</td>
                                <td className="py-1 px-4 border-b">{request.durationFrom}</td>
                                <td className="py-1 px-4 border-b">{request.durationTo}</td>
                                <td className="py-1 px-4 border-b">
                                    <button 
                                        onClick={() => handleDelete(request.id, 'Teacher')}
                                        className="py-1 px-4 bg-red-500 text-white font-bold rounded hover:bg-red-600 text-xs sm:text-sm"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
      </section>
      {/* Requests Section */}
      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md text-black">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700">Student Requests</h2>
      {/* Student Requests - Pending Section */}
      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <h2 className="text-2xl  sm:text-3xl font-semibold text-gray-700">Pending Student Requests</h2>
        <div className="overflow-x-auto">
        <table className="md:w-full mt-4 bg-white border border-gray-200 rounded-md mb-6 table-fixed text-xs sm:text-sm md:text-base lg:text-base">
          <thead>
            <tr>
              <th className="py-1 px-4 border-b text-left">Student Name</th>
              <th className="py-1 px-4 border-b text-left">Classroom</th>
              <th className="py-1 px-4 border-b text-left">Subject</th>
              <th className="py-1 px-4 border-b text-left">Resource Type</th>
              <th className="py-1 px-4 border-b text-black text-left">Duration From</th>
              <th className="py-1 px-4 border-b text-black text-left">Duration To</th>
              <th className="py-1 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {PRS.map(request => (
              <tr key={request.id}>
                <td className="py-1 px-4 border-b">{request.name}</td>
                <td className="py-1 px-4 border-b">{request.classroom}</td>
                <td className="py-1 px-4 border-b">{request.subject}</td>
                <td className="py-1 px-4 border-b">{request.resourceType}</td>
                <td className="py-1 px-4 border-b">{request.durationFrom}</td>
                <td className="py-1 px-4 border-b">{request.durationTo}</td>
                <td className="py-1 px-4 border-b">
                  <button
                    className={`${buttonStyle} bg-green-500 text-xs sm:text-sm`}
                    onClick={() => handleRequestApproval(request.id)}
                  >
                    Approve
                  </button>
                  <button
                    className={`${buttonStyle} bg-red-500 ml-2 text-xs sm:text-sm`}
                    onClick={() => handleRequestRejection(request.id)}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
      {/* Approved Requests Section */}
      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <h2 className="text-2xl  sm:text-3xl font-semibold text-gray-700">Approved Student Requests</h2>
        <div className="overflow-x-auto">
        <table className="md:w-full mt-4 bg-white border border-gray-200 rounded-md mb-6 table-fixed text-xs sm:text-sm md:text-base lg:text-base">
          <thead>
            <tr>
              <th className="py-1 px-4 border-b text-left">Student Name</th>
              <th className="py-1 px-4 border-b text-left">Classroom</th>
              <th className="py-1 px-4 border-b text-left">Subject</th>
              <th className="py-1 px-4 border-b text-left">Resource Type</th>
              <th className="py-1 px-4 border-b text-black text-left">Duration From</th>
              <th className="py-1 px-4 border-b text-black text-left">Duration To</th>
            </tr>
          </thead>
          <tbody>
            {ARS.map(request => (
              <tr key={request.id}>
                <td className="py-1 px-4 border-b">{request.name}</td>
                <td className="py-1 px-4 border-b">{request.classroom}</td>
                <td className="py-1 px-4 border-b">{request.subject}</td>
                <td className="py-1 px-4 border-b">{request.resourceType}</td>
                <td className="py-1 px-4 border-b">{request.durationFrom}</td>
                <td className="py-1 px-4 border-b">{request.durationTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
      {/* Rejected Requests Section */}
      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700">Rejected Student Requests</h2>
        <div className="overflow-x-auto">
        <table className="md:w-full mt-4 bg-white border border-gray-200 rounded-md mb-6 table-fixed text-xs sm:text-sm md:text-base lg:text-base">
          <thead>
            <tr>
              <th className="py-1 px-4 border-b text-left">Student Name</th>
              <th className="py-1 px-4 border-b text-left">Classroom</th>
              <th className="py-1 px-4 border-b text-left">Subject</th>
              <th className="py-1 px-4 border-b text-left">Resource Type</th>
              <th className="py-1 px-4 border-b text-black text-left">Duration From</th>
              <th className="py-1 px-4 border-b text-black text-left">Duration To</th>
            </tr>
          </thead>
          <tbody>
            {RRS.map(request => (
              <tr key={request.id}>
                <td className="py-1 px-4 border-b">{request.name}</td>
                <td className="py-1 px-4 border-b">{request.classroom}</td>
                <td className="py-1 px-4 border-b">{request.subject}</td>
                <td className="py-1 px-4 border-b">{request.resourceType}</td>
                <td className="py-1 px-4 border-b">{request.durationFrom}</td>
                <td className="py-1 px-4 border-b">{request.durationTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700">Completed Student Requests</h2>
            <div className="overflow-x-auto">
                <table className="md:w-full mt-4 bg-white border border-gray-200 rounded-md mb-6 table-fixed text-xs sm:text-sm md:text-base lg:text-base">
                    <thead>
                        <tr>
                            <th className="py-1 px-4 border-b text-left">Student Name</th>
                            <th className="py-1 px-4 border-b text-left">Classroom</th>
                            <th className="py-1 px-4 border-b text-left">Subject</th>
                            <th className="py-1 px-4 border-b text-left">Resource Type</th>
                            <th className="py-1 px-4 border-b text-black text-left">Duration From</th>
                            <th className="py-1 px-4 border-b text-black text-left">Duration To</th>
                            <th className="py-1 px-4 border-b text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {CRS.map(request => (
                            <tr key={request.id}>
                                <td className="py-1 px-4 border-b">{request.name}</td>
                                <td className="py-1 px-4 border-b">{request.classroom}</td>
                                <td className="py-1 px-4 border-b">{request.subject}</td>
                                <td className="py-1 px-4 border-b">{request.resourceType}</td>
                                <td className="py-1 px-4 border-b">{request.durationFrom}</td>
                                <td className="py-1 px-4 border-b">{request.durationTo}</td>
                                <td className="py-1 px-4 border-b">
                                    <button 
                                        onClick={() => handleDelete(request.id, 'Student')}
                                        className="py-1 px-4 bg-red-500 text-white font-bold rounded hover:bg-red-600 text-xs sm:text-sm"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
      </section>
    </div>
  );
};

export default AdminResources;
