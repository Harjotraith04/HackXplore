import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useParams } from 'react-router-dom';

function TeacherResources() {
    const { userId } = useParams();
    const [formData, setFormData] = useState({
        name: '',
        classroom: '',
        subject: '',
        resourceType: '',
        otherResource: '',
        dateNeeded: new Date(),
        durationFrom: '00:00',
        durationTo: '00:00',
        userType: 'Teacher',
        quantity: '',
    });
    const [resourceTypes, setResourceTypes] = useState([]);
    const [requests, setRequests] = useState({
        pending: [],
        approved: [],
        rejected: [],
        completed: []
    });

    useEffect(() => {

        fetchRequests();

        const fetchResourceTypes = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'resources'));
                const types = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.type && !types.includes(data.type)) {
                        types.push(data.type);
                    }
                });
                setResourceTypes(types);
            } catch (error) {
                console.error('Error fetching resource types:', error);
            }
        };

        fetchResourceTypes();

        const checkForExpiredRequests = async () => {
            try {
                const now = new Date(); // Current time in HH:MM
        
                // Fetch all approved requests from Firestore
                const snapshot = await getDocs(collection(db, 'resourceRequests'));
                snapshot.forEach(async (do1) => {
                    const request = do1.data();
        
                    // Check if the request is approved and has a valid durationTo time
                    if (request.status === 'Approved' && request.durationTo) {
                        const [durationToHour, durationToMinute] = request.durationTo.split(':');
                        const nowHours = now.getHours();
                        const nowMinutes = now.getMinutes();
        
                        // Compare the current time with the request's durationTo time
                        if (nowHours > durationToHour || (nowHours === parseInt(durationToHour) && nowMinutes >= parseInt(durationToMinute))) {
                            
                            // Find the resource in the 'resources' collection using the resourceType
                            const resourceSnapshot = await getDocs(collection(db, 'resources'));
                            const resourceDoc = resourceSnapshot.docs.find(resource => resource.data().type === request.resourceType);
                            console.log(resourceDoc.id);
                            if (!resourceDoc) {
                                console.error(`Resource with type ${request.resourceType} not found.`);
                                return;
                            }
                            const resourceRef = doc(db, 'resources', resourceDoc.id);
                            const resourceData = resourceDoc.data();
                            
                            // Adjust resource quantities
                            const available = parseInt(resourceData.available, 10);
                            const borrowed = parseInt(resourceData.borrowed, 10);
                            const requestQuantity = parseInt(request.quantity, 10);
        
                            const updatedAvailable = available + requestQuantity;
                            const updatedBorrowed = borrowed - requestQuantity;
        
                            if (updatedBorrowed >= 0) {
                                // Update the resource quantities in Firestore
                                await updateDoc(resourceRef, {
                                    available: updatedAvailable,
                                    borrowed: updatedBorrowed,
                                });
                                console.log("Resource quantities updated.");
                            } else {
                                console.error("Invalid borrowed quantity. Cannot proceed with the update.");
                                return;
                            }
        
                            // Update the request status to 'Completed'
                            await updateDoc(do1.ref, {
                                status: 'Completed'
                            });
                            console.log(`Request with ID ${do1.id} marked as completed.`);
                        }
                    }
                });
        
                // Call fetchRequests to refresh the UI
                fetchRequests();
            } catch (error) {
                console.error('Error checking for expired requests:', error);
            }
        };
        
        // Run the check every 1 minute
        const intervalId = setInterval(checkForExpiredRequests, 1 * 60 * 1000);
        return () => clearInterval(intervalId); // Clean up on unmount
    }, [userId]);
    const fetchRequests = async () => {
        try {
            // Fetch user document to get request IDs
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
    
            if (!userDoc.exists()) {
                console.error('User document does not exist.');
                return;
            }
    
            const userData = userDoc.data();
            const requestIds = userData.requests || [];
    
            if (requestIds.length === 0) {
                setRequests({
                    pending: [],
                    approved: [],
                    rejected: [],
                    completed: []
                });
                return;
            }
    
            // Fetch the requests based on the request IDs
            const requestsSnapshot = await Promise.all(
                requestIds.map(id => getDoc(doc(db, 'resourceRequests', id)))
            );
    
            const fetchedRequests = requestsSnapshot
                .filter(snapshot => snapshot.exists())
                .map(snapshot => ({ id: snapshot.id, ...snapshot.data() }));
    
            // Filter requests based on their status
            setRequests({
                pending: fetchedRequests.filter(req => req.status === 'Pending' && req.userType === 'Teacher'),
                approved: fetchedRequests.filter(req => req.status === 'Approved' && req.userType === 'Teacher'),
                rejected: fetchedRequests.filter(req => req.status === 'Rejected' && req.userType === 'Teacher'),
                completed: fetchedRequests.filter(req => req.status === 'Completed' && req.userType === 'Teacher')
            });
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };
    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.subject || !formData.classroom || !formData.resourceType || (formData.resourceType === 'Other' && !formData.otherResource) || !formData.quantity) {
            alert('Please fill in all required fields.');
            return;
        }

        // Additional validation for quantity and date if needed
        if (formData.quantity <= 0) {
            alert('Quantity must be greater than 0.');
            return;
        }

        const dataToSubmit = {
            ...formData,
            resourceType: formData.resourceType === 'Other' ? formData.otherResource : formData.resourceType,
            createdAt: new Date(),
            status: 'Pending',
            userType: 'Teacher',
        };

        try {
            const docRef = await addDoc(collection(db, 'resourceRequests'), dataToSubmit);
            
            // Update user's requests array with the new request ID
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.data();
            const requestsArray = userData?.requests || [];
            await setDoc(userDocRef, {
                requests: [...requestsArray, docRef.id]
            }, { merge: true });
            
            alert('Resource request submitted successfully!');
            handleClear();
            fetchRequests(); // Refresh the requests list
        } catch (error) {
            console.error('Error adding document: ', error);
            alert('Failed to submit resource request. Please try again.');
        }
    };

    const handleClear = () => {
        setFormData({
            name: '',
            classroom: '',
            subject: '',
            resourceType: '',
            otherResource: '',
            dateNeeded: new Date(),
            durationFrom: '00:00',
            durationTo: '00:00',
            userType: 'Teacher',
            quantity: '',
        });
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, 'resourceRequests', id));
            
            // Remove request ID from the user's requests array
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.data();
            const requestsArray = userData?.requests || [];
            const updatedRequestsArray = requestsArray.filter(requestId => requestId !== id);
            await setDoc(userDocRef, {
                requests: updatedRequestsArray
            }, { merge: true });

            alert('Request deleted successfully!');
            fetchRequests(); // Refresh the requests list
        } catch (error) {
            console.error('Error deleting document: ', error);
            alert('Failed to delete request. Please try again.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen pt-10 pb-10">
            <div className="w-full max-w-4xl mx-5 md:mx-auto p-5 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-center text-white mb-6">Resource Request Form</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="mb-6">
                            <label className="block font-medium text-gray-300">Teacher Name:</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-indigo-400 focus:border-indigo-400"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block font-medium text-gray-300">Subject:</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-indigo-400 focus:border-indigo-400"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block font-medium text-gray-300">Classroom:</label>
                            <input
                                type="text"
                                name="classroom"
                                value={formData.classroom}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-indigo-400 focus:border-indigo-400"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="mb-6">
                            <label className="block font-medium text-gray-300">Resource Type:</label>
                            <select
                                name="resourceType"
                                value={formData.resourceType}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-indigo-400 focus:border-indigo-400"
                            >
                                <option value="" disabled>Select Resource</option>
                                {resourceTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        {formData.resourceType === 'Other' && (
                            <div className="mb-6">
                                <label className="block font-medium text-gray-300">Specify Resource:</label>
                                <input
                                    type="text"
                                    name="otherResource"
                                    value={formData.otherResource}
                                    onChange={handleChange}
                                    className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-indigo-400 focus:border-indigo-400"
                                />
                            </div>
                        )}
                        <div className="mb-6">
                            <label className="block font-medium text-gray-300">Quantity:</label>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-indigo-400 focus:border-indigo-400"
                            />
                        </div>
                    </div>
                    <div className="flex space-x-4 mb-6">
                        <div className="w-1/3">
                            <label className="block font-medium text-gray-300">Date Needed:</label>
                            <DatePicker
                                selected={formData.dateNeeded}
                                onChange={(date) => setFormData(prev => ({ ...prev, dateNeeded: date }))}
                                className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-indigo-400 focus:border-indigo-400"
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="block font-medium text-gray-300">Duration From:</label>
                            <input
                                type="time"
                                name="durationFrom"
                                value={formData.durationFrom}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-indigo-400 focus:border-indigo-400"
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="block font-medium text-gray-300">Duration To:</label>
                            <input
                                type="time"
                                name="durationTo"
                                value={formData.durationTo}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-indigo-400 focus:border-indigo-400"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <button
                            type="submit"
                            className="py-2 px-6 bg-indigo-500 text-white font-bold rounded hover:bg-indigo-600 text-sm transition duration-200"
                        >
                            Submit
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="py-2 px-6 bg-red-500 text-white font-bold rounded hover:bg-red-600 text-sm transition duration-200"
                        >
                            Clear
                        </button>
                    </div>
                </form>

                {/* Request Tables */}
                <div className="mt-10">
                    <h2 className="text-xl font-bold text-indigo-400 mb-4">Pending Requests</h2>
                    <div className="overflow-x-auto">
                    <table className="w-full bg-gray-700 border border-gray-600 rounded-md table-fixed mb-6 text-sm text-gray-300">
                        <thead>
                            <tr>
                            <th className="py-2 px-4 border-b border-gray-600 text-left">Teacher Name</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Classroom</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Subject</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Resource Type</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Quantity</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Date Needed</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Duration From</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Duration To</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.pending.map(req => (
                                <tr key={req.id} className="hover:bg-gray-800 transition duration-200">
                                <td className="py-2 px-4 border-b border-gray-600">{req.name}</td>
                                <td className="py-2 px-4 border-b border-gray-600">{req.classroom}</td>
                                <td className="py-2 px-4 border-b border-gray-600">{req.subject}</td>
                                <td className="py-2 px-4 border-b border-gray-600">{req.resourceType}</td>
                                <td className="py-2 px-4 border-b border-gray-600">{req.quantity}</td>
                                <td className="py-2 px-4 border-b border-gray-600">
                                    {req.dateNeeded ? new Date(req.dateNeeded.seconds * 1000).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="py-2 px-4 border-b border-gray-600">{req.durationFrom}</td>
                                <td className="py-2 px-4 border-b border-gray-600">{req.durationTo}</td>
                                <td className="py-2 px-4 border-b border-gray-600">
                                    <button
                                        onClick={() => handleDelete(req.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                    <h2 className="text-xl font-bold text-indigo-400 mb-4">Approved Requests</h2>
                    <div className="overflow-x-auto">
                    <table className="w-full bg-gray-700 border border-gray-600 rounded-md table-fixed mb-6 text-sm text-gray-300">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Teacher Name</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Classroom</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Subject</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Resource Type</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Quantity</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Date Needed</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Duration From</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Duration To</th>
                            </tr>
                        </thead>
                        <tbody>
                           {requests.approved.map(req => (
                            <tr key={req.id}>
                                <td className="py-2 px-4 border-b border-gray-600">{req.name}</td>
                                <td className="py-2 px-4 border-b border-gray-600">{req.classroom}</td>
                                <td className="py-2 px-4 border-b border-gray-600">{req.subject}</td>
                                <td className="py-2 px-4 border-b border-gray-600">{req.resourceType}</td>
                                <td className="py-2 px-4 border-b border-gray-600">{req.quantity}</td>
                                <td className="py-2 px-4 border-b border-gray-600">{req.dateNeeded ? new Date(req.dateNeeded.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                <td className="py-2 px-4 border-b border-gray-600">{req.durationFrom}</td>
                                <td className="py-2 px-4 border-b border-gray-600">{req.durationTo}</td>
                            </tr>
                            ))}
                    </tbody>

                    </table>
                    </div>
                    <h2 className="text-xl font-bold text-indigo-400 mb-4">Rejected Requests</h2>
                    <div className="overflow-x-auto">
                    <table className="w-full bg-gray-700 border border-gray-600 rounded-md table-fixed mb-6 text-sm text-gray-300">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Teacher Name</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Classroom</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Subject</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Resource Type</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Quantity</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Date Needed</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Duration From</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Duration To</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.rejected.map(req => (
                                <tr key={req.id}>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.name}</td>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.classroom}</td>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.subject}</td>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.resourceType}</td>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.quantity}</td>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.dateNeeded ? new Date(req.dateNeeded.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.durationFrom}</td>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.durationTo}</td>
                                    <td className="py-1 border-b text-gray-700">
                                        <button 
                                            onClick={() => handleDelete(req.id)} 
                                            className="text-red-600 hover:text-red-800 text-xs sm:text-sm">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                    <div className="mt-10">
                    <h2 className="text-xl font-bold text-indigo-400 mb-4">Completed</h2>
                    <div className="overflow-x-auto">
                    <table className="w-full bg-gray-700 border border-gray-600 rounded-md table-fixed mb-6 text-sm text-gray-300">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Teacher Name</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Classroom</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Subject</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Resource Type</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Quantity</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Date Needed</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Duration From</th>
                                <th className="py-2 px-4 border-b border-gray-600 text-left">Duration To</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.completed.map(req => (
                                <tr key={req.id}>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.name}</td>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.classroom}</td>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.subject}</td>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.resourceType}</td>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.quantity}</td>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.dateNeeded ? new Date(req.dateNeeded.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.durationFrom}</td>
                                    <td className="py-2 px-4 border-b border-gray-600">{req.durationTo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}

export default TeacherResources;
