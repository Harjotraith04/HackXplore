import React, { useState, useEffect } from 'react';
import { db, storage } from '../../../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const TeacherLectures = ({ userId }) => {
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureDuration, setLectureDuration] = useState('');
  const [lectureDate, setLectureDate] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [selectedLectureId, setSelectedLectureId] = useState(null);
  const [files, setFiles] = useState([]);

  const fetchSubjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'subjects'));
      const subjectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchUnits = async (subjectId) => {
    try {
      const querySnapshot = await getDocs(collection(db, `subjects/${subjectId}/units`));
      const unitsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUnits(unitsData);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const fetchLectures = async (subjectId, unitId) => {
    try {
      const querySnapshot = await getDocs(collection(db, `subjects/${subjectId}/units/${unitId}/lectures`));
      const lecturesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLectures(lecturesData);
    } catch (error) {
      console.error('Error fetching lectures:', error);
    }
  };

  const handleAddLecture = async () => {
    if (!selectedSubjectId || !selectedUnitId) return;
    try {
      const docRef = await addDoc(collection(db, `subjects/${selectedSubjectId}/units/${selectedUnitId}/lectures`), {
        title: lectureTitle,
        duration: lectureDuration,
        date: lectureDate,
        documentUrls: []
      });
      setLectures([...lectures, { id: docRef.id, title: lectureTitle, duration: lectureDuration, date: lectureDate }]);
      setLectureTitle('');
      setLectureDuration('');
      setLectureDate('');
      console.log('Lecture added successfully');
    } catch (error) {
      console.error('Error adding lecture:', error);
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    try {
      await deleteDoc(doc(db, `subjects/${selectedSubjectId}/units/${selectedUnitId}/lectures`, lectureId));
      setLectures(lectures.filter(lecture => lecture.id !== lectureId));
      console.log('Lecture deleted successfully');
    } catch (error) {
      console.error('Error deleting lecture:', error);
    }
  };

  const handleUploadDocuments = async (lectureId) => {
    if (files.length === 0) return;
    try {
      const uploadPromises = files.map(async (file) => {
        const storageRef = ref(storage, `lectures/${lectureId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return { name: file.name, url: downloadURL };
      });
  
      const fileData = await Promise.all(uploadPromises);
  
      // Fetch existing document URLs to append the new ones
      const lectureRef = doc(db, `subjects/${selectedSubjectId}/units/${selectedUnitId}/lectures`, lectureId);
      const lectureDoc = await getDoc(lectureRef);
      const existingDocs = lectureDoc.data().documentUrls || [];
  
      // Append new document data
      const updatedDocs = [...existingDocs, ...fileData];
  
      await updateDoc(lectureRef, {
        documentUrls: updatedDocs,
      });
  
      alert('Documents uploaded successfully');
    } catch (error) {
      alert('Error uploading documents:');
      console.log('Error uploading documents:', error);
    }
  };
  

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchUnits(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    if (selectedSubjectId && selectedUnitId) {
      fetchLectures(selectedSubjectId, selectedUnitId);
    }
  }, [selectedSubjectId, selectedUnitId]);

  return (
    <div className="container mx-auto mt-10 p-4">
                        <style>
      </style>
      <h1 className="text-center text-3xl font-bold text-white">Teacher - Lectures</h1>

      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700">Add Lecture to Unit</h2>
        <select
          className="block w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="block w-full mt-4 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <input
          type="text"
          className="block w-full mt-4 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Lecture Title"
          value={lectureTitle}
          onChange={(e) => setLectureTitle(e.target.value)}
        />
        <input
          type="text"
          className="block w-full mt-4 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Lecture Duration"
          value={lectureDuration}
          onChange={(e) => setLectureDuration(e.target.value)}
        />
        <input
          type="date"
          className="block w-full mt-4 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={lectureDate}
          onChange={(e) => setLectureDate(e.target.value)}
        />
        <button
          className="mt-4 w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600"
          onClick={handleAddLecture}
        >
          Add Lecture
        </button>
      </section>

      {selectedUnitId && (
        <section className="my-8">
          <h2 className="text-2xl font-semibold text-white">Lectures List</h2>
          {lectures.map(lecture => (
            <div key={lecture.id} className="flex flex-col sm:flex-row mt-4 p-4 bg-white rounded-md shadow-md">
              <div className="flex-grow">
                <h3 className="text-xl font-semibold text-gray-800">{lecture.title}</h3>
                <p className="text-gray-600">Duration: {lecture.duration}</p>
                <p className="text-gray-600">Date: {lecture.date}</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center mt-4 sm:mt-0">
                <input
                  type="file"
                  className="mb-4 sm:mb-0 sm:mr-4"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                />
                <button
                  className="mb-2 sm:mb-0 sm:mr-4 bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600"
                  onClick={() => handleUploadDocuments(lecture.id)}
                >
                  Upload Documents
                </button>
                <button
                  className="bg-red-500 text-white font-bold py-2 px-4 rounded-md hover:bg-red-600"
                  onClick={() => handleDeleteLecture(lecture.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default TeacherLectures;
