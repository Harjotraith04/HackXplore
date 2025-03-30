import React, { useState, useEffect } from 'react';
import { db, storage } from '../../../firebaseConfig';
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRecorder } from 'react-microphone-recorder';
import axios from 'axios';

const Transcript = ({ userId }) => {
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedLectureId, setSelectedLectureId] = useState('');

  // Recorder Hook Variables
  const {
    startRecording,
    pauseRecording,
    stopRecording,
    resetRecording,
    resumeRecording,
    timeElapsed,
    recordingState,
    audioURL,
    audioFile,
  } = useRecorder();

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
    const fetchUnits = async (subjectId) => {
      if (!subjectId) return;
      try {
        const querySnapshot = await getDocs(collection(db, `subjects/${subjectId}/units`));
        const unitsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUnits(unitsData);
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    };

    fetchUnits(selectedSubjectId);
  }, [selectedSubjectId]);

  useEffect(() => {
    const fetchLectures = async (subjectId, unitId) => {
      if (!subjectId || !unitId) return;
      try {
        const querySnapshot = await getDocs(collection(db, `subjects/${subjectId}/units/${unitId}/lectures`));
        const lecturesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLectures(lecturesData);
      } catch (error) {
        console.error('Error fetching lectures:', error);
      }
    };

    fetchLectures(selectedSubjectId, selectedUnitId);
  }, [selectedSubjectId, selectedUnitId]);

  const uploadAndStoreTranscript = async (audioBlob) => {
    try {

      // Construct the file name using subject, unit, and lecture names
      const sanitizedSubjectId = selectedSubjectId.replace(/\//g, '_');
      const sanitizedUnitId = selectedUnitId.replace(/\//g, '_');
      const sanitizedLectureId = selectedLectureId.replace(/\//g, '_');
  
      const fileName = `${sanitizedSubjectId}_${sanitizedUnitId}_${sanitizedLectureId}_transcript.mp3`;
  
      console.log(fileName);
  
      // Create a file from the audio blob with the constructed file name
      const file = new File([audioBlob], fileName, { type: 'audio/mp3' });
  
      // Create a reference to the location in Firebase Storage
      const storageRef = ref(storage, `lectures/${fileName}`);
  
      // Upload the file to Firebase Storage
      await uploadBytes(storageRef, file);
  
      // Get the download URL of the uploaded file
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Download URL:', downloadURL);
  
      // Add the download URL to Firestore under the corresponding lecture document
      const lectureDocRef = doc(db, `subjects/${selectedSubjectId}/units/${selectedUnitId}/lectures`, selectedLectureId);
  
      console.log('Download URL added to Firestore');
      alert("Recording saved and uploaded successfully");

  
      // Make the POST request to your Flask API with the download URL and other variables in the body
      await axios.post(
        import.meta.env.VITE_TRANSCRIBE_API,
        {
          download_url: downloadURL, // Send the download URL in the request body
          subject: selectedSubjectId,
          unit: selectedUnitId,
          lecture: selectedLectureId,
        }, // Pass variables in the body instead of headers
        {
          headers: {
            'GuruCool-API-Key': import.meta.env.VITE_API_KEY, // If you still need to send an API key, keep it in the headers
            'bypass-tunnel-reminder': 'true',
          },
        }
      );
  
      // Update the Firestore document with the transcript URL
      await updateDoc(lectureDocRef, {
        transcript_url: downloadURL
      });
  
      // Alert the user about the successful operation with the subject ID
      alert(`Recording completed, uploaded successfully! Subject ID: ${selectedSubjectId}`);
    }catch (error) {
      const url = import.meta.env.VITE_NOTIFICATION
      const data = {
        "text": "Start the server, transcript",
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
  


  const handleStopRecording = async () => {
    stopRecording();
    await uploadAndStoreTranscript(audioFile);
  };

  return (
    <div className="container mx-auto mt-10 p-4">
                        <style>
      </style>
      <h1 className="text-center text-3xl font-bold text-white">Record Audio for Lecture</h1>

      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700">Select Lecture</h2>
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
        <select
          className="block w-full mt-4 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </section>

      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <div className="flex flex-wrap gap-4 mb-4 justify-center">
          <button
            onClick={startRecording}
            className="w-28 sm:w-32 px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600"
          >
            Start
          </button>
          <button
            onClick={pauseRecording}
            className="w-28 sm:w-32 px-4 py-2 bg-yellow-500 text-white rounded-md shadow hover:bg-yellow-600"
          >
            Pause
          </button>
          <button
            onClick={resumeRecording}
            className="w-28 sm:w-32 px-4 py-2 bg-green-500 text-white rounded-md shadow hover:bg-green-600"
          >
            Resume
          </button>
          <button
            onClick={handleStopRecording}
            className="w-28 sm:w-32 px-4 py-2 bg-red-500 text-white rounded-md shadow hover:bg-red-600"
          >
            Stop
          </button>
          <button
            onClick={resetRecording}
            className="w-28 sm:w-32 px-4 py-2 bg-gray-500 text-white rounded-md shadow hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
        <div className="mb-4 text-center">
          <span className="text-gray-900">Time Elapsed: {timeElapsed}s</span>
        </div>
        <div className="text-center">
          <span className="text-gray-900">Recording State: {recordingState}</span>
          {recordingState === 'stopped' && audioURL && (
            <div className="mt-4">
              <span className="text-gray-900">Audio File:</span>
              <audio src={audioURL} controls className="mt-4"></audio>
            </div>
          )}
        </div>
      </section>


    </div>
  );
};

export default Transcript;
