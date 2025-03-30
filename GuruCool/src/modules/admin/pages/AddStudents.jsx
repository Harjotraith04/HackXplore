import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, storage } from '../../../firebaseConfig'; // Firestore & Storage setup file
import { addDoc, collection, updateDoc, doc, getDocs, query } from 'firebase/firestore';
import { ref, uploadString } from 'firebase/storage';
import axios from 'axios';
import Webcam from 'react-webcam';

const AdminPage = () => {
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        password: '',
        userType: 'student'
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [webcamImage, setWebcamImage] = useState('');
    const [showWebcam, setShowWebcam] = useState(true);
    const [userList, setUserList] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const webcamRef = useRef(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersQuery = query(collection(db, 'users'));
                const querySnapshot = await getDocs(usersQuery);
                const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUserList(users);
            } catch (error) {
                console.error('Error fetching users:', error);
                setError('Failed to fetch users.');
            }
        };

        fetchUsers();
    }, []);

    const captureImage = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setWebcamImage(imageSrc);
        setShowWebcam(false);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prevData => ({ ...prevData, [name]: value }));
    };

    const uploadFaceAndAddUser = async () => {
        setError(null);
        setSuccess(null);

        if (!userData.name || !userData.email || !userData.password || !webcamImage) {
            setError('Please fill in all fields and capture an image.');
            return;
        }

        setIsUploading(true);

        try {
            const userRef = await addDoc(collection(db, 'users'), userData);
            const storageRef = ref(storage, `faces/${userRef.id}.jpg`);
            await uploadString(storageRef, webcamImage, 'data_url');

            const response = await axios.post(`${import.meta.env.VITE_FLASK_API_URL}/process_image`, { image: webcamImage });
            const { faceId } = response.data;

            await updateDoc(doc(db, 'users', userRef.id), { faceId });
            setSuccess('User and facial scan successfully added!');
        } catch (error) {
            console.error('Error adding user or uploading face:', error);
            setError('An error occurred while adding the user.');
        } finally {
            setIsUploading(false);
        }
    };

    const reAddFace = async () => {
        if (!selectedUser || !webcamImage) {
            setError('Please select a user and capture an image.');
            return;
        }

        try {
            const response = await axios.post(`${import.meta.env.VITE_FLASK_API_URL}/process_image`, { image: webcamImage });
            const { faceId } = response.data;

            await updateDoc(doc(db, 'users', selectedUser), { faceId });
            setSuccess('Facial scan successfully updated!');
        } catch (error) {
            console.error('Error re-uploading facial scan:', error);
            setError('An error occurred while re-uploading the facial scan.');
        }
    };

    return (
        <div className="p-4 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-center mb-6">Add User</h1>

            <div className="mb-4">
                <label className="block text-lg mb-2">Name:</label>
                <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Enter Name"
                />
            </div>

            <div className="mb-4">
                <label className="block text-lg mb-2">Email:</label>
                <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Enter Email"
                />
            </div>

            <div className="mb-4">
                <label className="block text-lg mb-2">Password:</label>
                <input
                    type="password"
                    name="password"
                    value={userData.password}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Enter Password"
                />
            </div>

            <div className="mb-4">
                <label className="block text-lg mb-2">User Type:</label>
                <select
                    name="userType"
                    value={userData.userType}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {showWebcam ? (
                <div className="mb-4">
                    <label className="block text-lg mb-2">Capture Facial Scan:</label>
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full max-w-sm mx-auto border border-gray-300 rounded-lg"
                    />
                    <button
                        onClick={captureImage}
                        className="w-full mt-2 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500"
                    >
                        Capture Image
                    </button>
                </div>
            ) : (
                <div className="mb-4">
                    <label className="block text-lg mb-2">Captured Image:</label>
                    <img
                        src={webcamImage}
                        alt="Captured"
                        className="w-full max-w-sm mx-auto border border-gray-300 rounded-lg"
                    />
                    <button
                        onClick={() => setShowWebcam(true)}
                        className="w-full mt-2 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500"
                    >
                        Retake Image
                    </button>
                </div>
            )}

            <button
                onClick={uploadFaceAndAddUser}
                className={`w-full py-3 text-white font-semibold rounded-lg ${isUploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-500'}`}
                disabled={isUploading}
            >
                {isUploading ? 'Uploading...' : 'Add User with Face'}
            </button>

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Re-add Facial Scan</h2>
                
                <div className="mb-4">
                    <label className="block text-lg mb-2">Select User:</label>
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                        <option value="">Select a user</option>
                        {userList.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.email})
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={reAddFace}
                    className={`w-full py-3 mt-4 text-white font-semibold rounded-lg ${!selectedUser || !webcamImage ? 'bg-gray-400' : 'bg-yellow-600 hover:bg-yellow-500'}`}
                    disabled={!selectedUser || !webcamImage}
                >
                    Re-add Facial Scan
                </button>
            </div>

            {error && <p className="text-red-500 mt-4">{error}</p>}
            {success && <p className="text-green-500 mt-4">{success}</p>}
        </div>
    );
};

export default AdminPage;
