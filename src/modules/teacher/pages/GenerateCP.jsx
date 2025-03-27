import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { storage } from '../../../firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { useParams } from 'react-router-dom';
import { doc, getDoc, getDocs, collection, query, where, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; // Import your Firestore instance

const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 10px;
`;

const Heading = styled.h1`
  color: white;
  margin-bottom: 30px;
`;

const UploadBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #00bfff;
  border-radius: 5px;
  width: 100%;
  max-width: 700px;
  height: 350px;
  background-color: white;
  transition: border-color 0.3s, box-shadow 0.3s;
  position: relative;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  &.drag-active {
    border-color: #00bfff;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
  }
`;

const UploadInput = styled.input`
  width: 100%;
  height: 100%;
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
`;

const UploadContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  text-align: center;
  p {
    margin: 0;
    font-size: 18px;
    color: #666666;
  }
`;

const UploadInfo = styled.div`
  margin-top: 20px;
  text-align: center;
  p {
    margin: 0 0 10px 0;
    font-size: 15px;
  }
  button {
    background-color: #00bfff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin: 5px;
    &:hover {
      background-color: #0099cc;
    }
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  background-color: #f3f3f3;
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 20px;

  div {
    height: 100%;
    background-color: #00bfff;
    width: ${(props) => props.progress}%;
    transition: width 0.3s ease;
  }
`;

const DateInput = styled.input`
  padding: 10px;
  margin-top: 5px;
  border-radius: 5px;
  border: 1px solid #ccc;
`;

const NumberInput = styled.input`
  width: 100px;
  padding: 10px;
  margin-top: 5px;
  border-radius: 5px;
  border: 1px solid #ccc;
`;

const TextDisplayContainer = styled.div`
  margin-top: 20px;
  padding: 20px;
  background-color: #f7f7f7;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  width: 80%;
  overflow: auto;
`;

const GenerateCP = () => {
  const { userId } = useParams();
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hours, setHours] = useState('');
  const [textData, setTextData] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        // Fetch the user's document to get subject IDs
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const subjectIds = userData.subjects || [];

          // Fetch subjects collection
          const subjectsQuery = query(collection(db, 'subjects'), where('__name__', 'in', subjectIds));
          const subjectsSnapshot = await getDocs(subjectsQuery);

          // Map subject IDs to names
          const subjectsList = subjectsSnapshot.docs.map(doc => doc.data().name);
          setSubjects(subjectsList);
        } else {
          console.error('No such user!');
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };

    fetchSubjects();
  }, [userId]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setFiles(Array.from(e.dataTransfer.files));
  };

  const formatText = (data) => {
    if (!data || !data.schedule) return '';

    return data.schedule.map(item => {
      const date = item.date;
      const topics = item.topics.join('\n');
      return `Date: ${date}\nTopics:\n${topics}`;
    }).join('\n\n');
  };

  const handleGenerateLectureSchedule = async () => {
    if (files.length === 0) return;

    setLoading(true);
    let uploadedUrl = null;

    for (const file of files) {
      const storageRef = ref(storage, `pdfs/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      try {
        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progressPercent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(progressPercent);
            },
            (error) => {
              console.error('Upload failed:', error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              if (!uploadedUrl) uploadedUrl = downloadURL;
              resolve();
            }
          );
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload files. Please try again.');
        setLoading(false);
        return;
      }
    }

    if (uploadedUrl) {
      const payload = {
        firebase_url: uploadedUrl,
        start_date: startDate,
        end_date: endDate,
        hours_per_week: hours
      };

      try {
        const response = await axios.post(`${import.meta.env.VITE_LECTURE_SCHEDULE}`, payload, {
          headers: {
            'GuruCool-API-Key': import.meta.env.VITE_API_KEY,
            'Content-Type': 'application/json',
            'bypass-tunnel-reminder': 'true',
          },
        });
        if (response.data) {
          setTextData(formatText(response.data));
          alert('Lecture schedule generated successfully!');
        } else {
          alert('Received no data from server.');
        }
      } catch (error) {
        const url = import.meta.env.VITE_NOTIFICATION
        const data = {
          "text": "Start the server, course policy",
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

      setLoading(false);
      setFiles([]);
    }
  };

  const handleUploadToFirebase = async () => {
    if (!selectedSubject || !textData) {
      alert('Please select a subject and ensure text is generated.');
      return;
    }
  
    try {
      // Add course policy document
      const coursePolicyRef = collection(db, 'coursePolicies'); // This will create the collection if it doesn't exist
      const docRef = await addDoc(coursePolicyRef, {
        subject: selectedSubject,
        text: textData,
      });
  
      const coursePolicyId = docRef.id;
  
      // Update the user's document with the new course policy ID
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedRequests = [...(userData.generatedCoursePolicy || []), coursePolicyId];
        await updateDoc(userRef, { generatedCoursePolicy: updatedRequests });
  
        alert('Course policy uploaded successfully!');
      } else {
        console.error('User document does not exist.');
        alert('Failed to upload course policy. User document not found.');
      }
    } catch (error) {
      console.error('Error uploading course policy:', error);
      alert('Failed to upload course policy. Please try again.');
    }
  };
  
  

return (
  <UploadContainer>
    <Heading><b>Course Policy</b></Heading>
    <UploadBox
      className={dragActive ? 'drag-active' : ''}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <UploadInput
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        multiple
      />
      <UploadContent>
        <p>Drag & Drop to Upload PDFs or Click to Browse</p>
      </UploadContent>
    </UploadBox>

    {files.length > 0 && !loading && (
      <UploadInfo>
        {files.map((file, index) => (
          <p key={index}>Selected file: {file.name}</p>
        ))}
        <DateInput
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start Date"
        />
        <DateInput
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
        />
        <NumberInput
          type="number"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Hours"
        />
        <button onClick={handleGenerateLectureSchedule}>Generate Schedule</button>
      </UploadInfo>
    )}

    {loading && (
      <ProgressBar progress={progress}>
        <div></div>
      </ProgressBar>
    )}

    {textData && (
      <TextDisplayContainer>
        <textarea
          value={textData}
          onChange={(e) => setTextData(e.target.value)}
          style={{ width: '100%', height: '300px', fontFamily: 'monospace' }}
        />
        <div>
        <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-700"
            >
            <option value="" disabled>
                Select Subject
            </option>
            {subjects.map((subject, index) => (
                <option key={index} value={subject} className="text-gray-700">
                {subject}
                </option>
            ))}
        </select>
          <button onClick={handleUploadToFirebase}>Upload to Firebase</button>
        </div>
      </TextDisplayContainer>
    )}
  </UploadContainer>
);
};

export default GenerateCP;