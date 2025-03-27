import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import DatePicker from 'react-datepicker';
import TimePicker from 'react-time-picker';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-time-picker/dist/TimePicker.css';
import { useParams } from 'react-router-dom';

function StudentResource() {

    const { userId } = useParams();  // Get user ID from the URL
    const [formData, setFormData] = useState({
        name: '',
        classroom: '',
        subject: '',
        resourceType: '',
        otherResource: '',
        dateNeeded: new Date(),
        durationFrom: '00:00',
        durationTo: '00:00',
        userType: '',
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
                const snapshot = await getDocs(collection(db, 'resourceRequests'));

                snapshot.forEach(async (do1) => {
                    const request = do1.data();

                    if (request.status === 'Approved' && request.durationTo) {
                        const [durationToHour, durationToMinute] = request.durationTo.split(':');
                        const nowHours = now.getHours();
                        const nowMinutes = now.getMinutes();

                        if (nowHours > durationToHour || (nowHours === parseInt(durationToHour) && nowMinutes >= parseInt(durationToMinute))) {
                            const resourceSnapshot = await getDocs(collection(db, 'resources'));
                            const resourceDoc = resourceSnapshot.docs.find(resource => resource.data().type === request.resourceType);

                            if (!resourceDoc) {
                                console.error(`Resource with type ${request.resourceType} not found.`);
                                return;
                            }

                            const resourceRef = doc(db, 'resources', resourceDoc.id);
                            const resourceData = resourceDoc.data();

                            const available = parseInt(resourceData.available, 10);
                            const borrowed = parseInt(resourceData.borrowed, 10);
                            const requestQuantity = parseInt(request.quantity, 10);

                            const updatedAvailable = available + requestQuantity;
                            const updatedBorrowed = borrowed - requestQuantity;

                            if (updatedBorrowed >= 0) {
                                await updateDoc(resourceRef, {
                                    available: updatedAvailable,
                                    borrowed: updatedBorrowed,
                                });
                                console.log("Resource quantities updated.");
                            } else {
                                console.error("Invalid borrowed quantity. Cannot proceed with the update.");
                                return;
                            }

                            await updateDoc(do1.ref, {
                                status: 'Completed'
                            });
                            console.log(`Request with ID ${do1.id} marked as completed.`);
                        }
                    }
                });

                fetchRequests();
            } catch (error) {
                console.error('Error checking for expired requests:', error);
            }
        };

        const intervalId = setInterval(checkForExpiredRequests, 1 * 60 * 1000);
        return () => clearInterval(intervalId); // Clean up on unmount
    }, [userId]);
    const fetchRequests = async () => {
        try {
            // Fetch the user's document to get their request IDs
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                console.error('User document not found');
                return;
            }

            const userData = userDoc.data();
            const requestIds = userData.requests || [];

            // Fetch the resource requests using the request IDs
            const fetchedRequests = [];
            for (const requestId of requestIds) {
                const requestDocRef = doc(db, 'resourceRequests', requestId);
                const requestDoc = await getDoc(requestDocRef);

                if (requestDoc.exists()) {
                    fetchedRequests.push({ id: requestDoc.id, ...requestDoc.data() });
                }
            }

            setRequests({
                pending: fetchedRequests.filter(req => req.status === 'Pending' && req.userType === 'Student'),
                approved: fetchedRequests.filter(req => req.status === 'Approved' && req.userType === 'Student'),
                rejected: fetchedRequests.filter(req => req.status === 'Rejected' && req.userType === 'Student'),
                completed: fetchedRequests.filter(req => req.status === 'Completed' && req.userType === 'Student')
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
            userType: 'Student'
        };

        try {
            // Add the resource request to the resourceRequests collection
            const docRef = await addDoc(collection(db, 'resourceRequests'), dataToSubmit);

            // Update the user's document with the new request ID
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const updatedRequests = [...(userData.requests || []), docRef.id];

                await updateDoc(userDocRef, { requests: updatedRequests });
            }

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
            userType: '',
            quantity: '',
        });
    };

    const handleDelete = async (id) => {
        try {
            // Delete the request from the resourceRequests collection
            await deleteDoc(doc(db, 'resourceRequests', id));

            // Update the user's document by removing the deleted request ID
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const updatedRequests = userData.requests.filter(reqId => reqId !== id);

                await updateDoc(userDocRef, { requests: updatedRequests });
            }

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
                <h1 className="text-2xl font-bold text-center mb-6">Resource Request Form</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="mb-6">
                            <label className="block font-medium text-gray-300">Student Name:</label>
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
                            className="py-2 px-6 bg-indigo-500 text-white font-bold rounded hover:bg-indigo-600 transition duration-200">
                            Submit
                        </button>
                        <button 
                            type="button"
                            onClick={handleClear}
                            className="py-2 px-6 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition duration-200">
                            Clear
                        </button>
                    </div>
                </form>
    
                {/* Request Tables */}
                <div className="mt-10">
                    {['Pending', 'Approved', 'Rejected', 'Completed'].map((status) => (
                        <div key={status} className="mb-8">
                            <h2 className="text-xl font-bold text-indigo-400 mb-4">{status} Requests</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full bg-gray-700 border border-gray-600 rounded-md table-fixed text-sm text-gray-300">
                                    <thead>
                                        <tr>
                                            {['Student Name', 'Classroom', 'Subject', 'Resource Type', 'Quantity', 'Date Needed', 'Duration From', 'Duration To', 'Actions'].map((heading, index) => (
                                                <th key={index} className="py-2 px-4 border-b border-gray-600 text-left">{heading}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests[status.toLowerCase()].map((req) => (
                                            <tr key={req.id} className="hover:bg-gray-800 transition duration-200">
                                                <td className="py-2 px-4 border-b border-gray-600">{req.name}</td>
                                                <td className="py-2 px-4 border-b border-gray-600">{req.classroom}</td>
                                                <td className="py-2 px-4 border-b border-gray-600">{req.subject}</td>
                                                <td className="py-2 px-4 border-b border-gray-600">{req.resourceType}</td>
                                                <td className="py-2 px-4 border-b border-gray-600">{req.quantity}</td>
                                                <td className="py-2 px-4 border-b border-gray-600">{req.dateNeeded ? new Date(req.dateNeeded.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                                <td className="py-2 px-4 border-b border-gray-600">{req.durationFrom}</td>
                                                <td className="py-2 px-4 border-b border-gray-600">{req.durationTo}</td>
                                                {status === 'Pending' || status === 'Rejected' ? (
                                                    <td className="py-2 px-4 border-b border-gray-600">
                                                        <button 
                                                            onClick={() => handleDelete(req.id)} 
                                                            className="text-red-500 hover:text-red-700">
                                                            Delete
                                                        </button>
                                                    </td>
                                                ) : (
                                                    <td className="py-2 px-4 border-b border-gray-600">-</td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );    
}
    
export default StudentResource;
