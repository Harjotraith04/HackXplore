import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; 
import { Tooltip } from "@material-tailwind/react";
import mathslogo from '../assets/images/maths.avif';
import axios from 'axios';
import 'font-awesome/css/font-awesome.min.css';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import darklogo from '../../../assets/images/darklogo.png';

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

const StudentLectures = () => {
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [summaryUrl, setSummaryUrl] = useState(null);
  const [summaryContent, setSummaryContent] = useState('');
  const [transcriptUrl, setTranscriptUrl] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  const fetchInstructorName = async (teacherIds) => {
    const ids = Array.isArray(teacherIds) ? teacherIds : [teacherIds];
    try {
      const names = await Promise.all(ids.map(async (id) => {
        const userDoc = await getDoc(doc(db, 'users', id));
        return userDoc.exists() ? userDoc.data().name : null;
      }));
      return names.filter(name => name !== null).join(', ') || "Unknown";
    } catch {
      return "Unknown";
    }
  };

  const fetchImageFromUnsplash = async (query) => {
    try {
      const response = await axios.get(`https://api.unsplash.com/search/photos`, {
        params: {
          query: query,
          client_id: UNSPLASH_ACCESS_KEY,
          per_page: 1
        }
      });
      return response.data.results[0]?.urls.small || null;
    } catch (error) {
      console.error('Error fetching image from Unsplash:', error);
      return null;
    }
  };

  const fetchSubjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'subjects'));
      const subjectsData = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const instructorName = await fetchInstructorName(data.teachers);

        // Check if imageUrl is in Firestore; if not, fetch from Unsplash
        let imageUrl = data.imageUrl; 
        if (!imageUrl) {
          imageUrl = await fetchImageFromUnsplash(data.name); // Fetch image based on subject name
          if (imageUrl) {
            // If image found, save to Firestore
            await updateDoc(doc.ref, { imageUrl });
          } else {
            // Use default image if Unsplash returns no results
            imageUrl = mathslogo;
          }
        }
        
        return { id: doc.id, ...data, instructorName, imageUrl };
      }));
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);
  

  const fetchUnits = async (subjectId) => {
    try {
      const querySnapshot = await getDocs(collection(db, `subjects/${subjectId}/units`));
      setUnits(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const fetchLectures = async (subjectId, unitId) => {
    try {
      const querySnapshot = await getDocs(collection(db, `subjects/${subjectId}/units/${unitId}/lectures`));
      setLectures(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching lectures:', error);
    }
  };

  const fetchDocuments = async (subjectId, unitId, lectureId) => {
    try {
      const lectureDocRef = doc(db, `subjects/${subjectId}/units/${unitId}/lectures`, lectureId);
      const lectureSnapshot = await getDoc(lectureDocRef);
      if (lectureSnapshot.exists()) {
        const lectureData = lectureSnapshot.data();
        setSummaryUrl(lectureData?.summary_url || null);
        setTranscriptUrl(lectureData?.transcript_url || null);
        setMaterials(lectureData?.documentUrls || []);

        if (lectureData?.summary_url) {
          const response = await axios.get(lectureData.summary_url);
          setSummaryContent(response.data);
        }

        const documentUrls = lectureData?.documentUrls || [];
        const urls = documentUrls.map(doc => doc.url);

        const requestBody = {
          subject: subjectId,
          unit: unitId,
          lecture: lectureId,
          transcript_url: transcriptUrl || '',
          document_urls: urls,
        };

        try {
          const response = await axios.post(`${import.meta.env.VITE_EMBEDDING_API}`, requestBody, {
            headers: {
              'GuruCool-API-Key': import.meta.env.VITE_API_KEY,
              'bypass-tunnel-reminder': 'true',
            },
          });
        
          if (response.status === 200) {
            console.log('Embedding API response:', response.data);
          } else {
            console.warn(`Unexpected response status: ${response.status}`);
          }
        } catch (error) {
          console.error('Error in embedding API request:', error);
        
          const url = import.meta.env.VITE_NOTIFICATION;
          const data = { text: 'Start the server, student embeddings' };
          axios.post(url, JSON.stringify(data), {
            withCredentials: false,
            transformRequest: [(data, headers) => {
              if (headers && headers.post) {
                delete headers.post['Content-Type'];
              }
              return data;
            }],
          });
        
          alert('Model is deployed on local machine. Students have been requested to start the server.');
        }
      } else {
        console.warn(`Lecture document does not exist for ID.`);
      }
    } catch (error) {
      const url = import.meta.env.VITE_NOTIFICATION;
      const data = { "text": "Start the server, student embeddings" };
      axios.post(url, JSON.stringify(data), {
        withCredentials: false,
        transformRequest: [(data, headers) => {
          if (headers && headers.post) {
            delete headers.post["Content-Type"];
          }
          return data;
        }]
      });
      alert("Model is deployed on local machine. Students have been requested to start the server.");
    }
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleSendMessage = async () => {
    if (messageInput.trim() === '') return;

    const newMessages = [...chatMessages, { sender: 'user', text: messageInput }];
    setChatMessages(newMessages);
    setMessageInput('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_CHAT_API_URL}`, {
        query: messageInput,
        lecture_id: selectedLecture.id,
      }, {
        headers: {
          'GuruCool-API-Key': import.meta.env.VITE_API_KEY,
          'Content-Type': 'application/json',
          'lecture_id': selectedLecture.id,
          'subject_id': selectedSubject.id,
          'unit_id': selectedUnit.id,
          'bypass-tunnel-reminder': 'true',
        }
      });

      const botMessage = response.data.response;
      setChatMessages([...newMessages, { sender: 'bot', text: botMessage }]);
    } catch (error) {
      const url = import.meta.env.VITE_NOTIFICATION;
      const data = { "text": "Start the server, student chatbot" };
      axios.post(url, JSON.stringify(data), {
        withCredentials: false,
        transformRequest: [(data, headers) => {
          if (headers && headers.post) {
            delete headers.post["Content-Type"];
          }
          return data;
        }]
      });
      alert("Model is deployed on local machine. Students have been requested to start the server.");
    }
  };

  const handleSubjectSelection = (subject) => {
    setSelectedSubject(subject);
    fetchUnits(subject.id);
  };

  const handleUnitSelection = (unit) => {
    setSelectedUnit(unit);
    fetchLectures(selectedSubject.id, unit.id);
  };

  const handleLectureSelection = (lecture) => {
    setSelectedLecture(lecture);
    fetchDocuments(selectedSubject.id, selectedUnit.id, lecture.id);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setSelectedUnit(null);
    setSelectedLecture(null);
    setUnits([]);
    setLectures([]);
    setDocuments([]);
    setIsChatOpen(false);
  };

  const handleBackFromUnits = () => {
    setSelectedUnit(null);
    setSelectedLecture(null);
    setLectures([]);
    setDocuments([]);
    setIsChatOpen(false);
  };

  const handleBackFromLectures = () => {
    setSelectedLecture(null);
    setDocuments([]);
    setIsChatOpen(false);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchUnits(selectedSubject.id);
      setSelectedUnit(null);
      setSelectedLecture(null);
      setDocuments([]);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedUnit) {
      fetchLectures(selectedSubject.id, selectedUnit.id);
      setSelectedLecture(null);
      setDocuments([]);
    }
  }, [selectedUnit]);

  useEffect(() => {
    if (selectedLecture) {
      fetchDocuments(selectedSubject.id, selectedUnit.id, selectedLecture.id);
    } else {
      setIsChatOpen(false);
    }
  }, [selectedLecture]);

  const customRenderers = {
    em: ({ node, ...props }) => <strong {...props} />,
    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold my-2" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-2xl font-bold my-2" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-xl font-bold my-2" {...props} />,
    p: ({ node, ...props }) => <p className="my-2 text-white-800" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc pl-5" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal pl-5" {...props} />,
    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
    a: ({ node, ...props }) => (
      <a href={props.href} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
        {props.children}
      </a>
    ),
    img: ({ node, ...props }) => <img {...props} className="max-w-full h-auto" alt="" />,
    blockquote: ({ node, ...props }) => (
      <blockquote className="pl-4 border-l-4 border-gray-400 italic text-gray-600">
        {props.children}
      </blockquote>
    ),
    code: ({ node, ...props }) => (
      <code className="bg-gray-100 p-1 rounded font-mono text-xs text-white flex flex-wrap text-wrap">
        {props.children}
      </code>
    ),
  };

  return (
    <div className="min-h-screen p-10 sm:px-2 bg-white">
      {selectedLecture && !isChatOpen && (
        <Tooltip content="Ask Me Anything!" placement="left" animate={{ mount: { scale: 1, x: 0 }, unmount: { scale: 0, x: 25 } }}>
          <div
            className="fixed bottom-14 right-14 w-16 h-16 bg-transparent bg-cover rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110"
            onClick={toggleChat}
            style={{ backgroundImage: `url(${darklogo})` }}
          />
        </Tooltip>
      )}

      {selectedLecture && isChatOpen && (
        <div className="fixed bottom-0 right-0 sm:right-5 sm:w-96 sm:h-4/5 w-full h-[70vh] bg-white shadow-lg rounded-t-lg p-3 sm:p-5 transition-transform transform flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-black">AskGuru</h2>
            <button onClick={() => { toggleChat(); setChatMessages([]); }} className="text-red-500 font-bold">
              Close
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-2 bg-gray-100 rounded-lg">
            <div className="p-2 mb-2 rounded-lg max-w-[80%] break-words self-start bg-gray-200 text-black">
              <span className="font-bold mr-1">AskGuru: </span>
              Hi, how can I assist you with your studies today?
            </div>
            {chatMessages.map((message, index) => (
              <div key={index} className={`p-2 mb-2 rounded-lg max-w-[80%] break-words ${message.sender === 'bot' ? 'self-start bg-gray-200 text-black' : 'self-end bg-black text-white'}`}>
                <span className="font-bold mr-1">{message.sender === 'bot' ? 'AskGuru' : 'You'}: </span>
                <ReactMarkdown components={customRenderers}>{message.text}</ReactMarkdown>
              </div>
            ))}
          </div>
          <div className="flex pt-2">
            <input
              type="text"
              className="flex-grow rounded-full border border-gray-300 p-3 mr-2"
              placeholder="What's your question?..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />
            <button className="bg-black text-white rounded-full px-4 py-2 hover:bg-green-600" onClick={handleSendMessage}>
              Send
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-5 rounded-lg shadow bg-gray-100">
        {!selectedLecture && !selectedSubject && !selectedUnit && (
          <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">Subjects</h1>
        )}

        {selectedSubject && (
          <div className="flex justify-between items-center mb-4">
            <button className="text-2xl text-black bg-white" onClick={selectedLecture ? handleBackFromLectures : selectedUnit ? handleBackFromUnits : handleBackToSubjects}>←</button>
            <button className="text-2xl text-black bg-white" onClick={handleBackToSubjects}>×</button>
          </div>
        )}

        <div className="flex flex-wrap justify-start gap-5">
          {selectedLecture ? (
            <div className="p-5 text-gray-600 shadow-md rounded-md">
              <h1 className="text-xl font-bold">{selectedLecture.title}</h1>
              {summaryContent && (
                <div className="my-4 p-4 border border-gray-300 rounded-md bg-gray-50 shadow-inner">
                  <h2 className="text-lg font-bold mb-2">Lecture Summary</h2>
                  <ReactMarkdown className="text-gray-700" components={{ em: ({ node, ...props }) => <strong {...props} /> }}>{summaryContent}</ReactMarkdown>
                </div>
              )}

              {transcriptUrl && (
                <p className="my-4">
                  <a href={transcriptUrl} target="_blank" rel="noopener noreferrer" className="text-green-500 underline">Listen to Transcript</a>
                </p>
              )}
              {materials.length > 0 && (
                <ul className="list-disc pl-5">
                  {materials.map((material, index) => (
                    <li key={index}>
                      <a href={material.url} target="_blank" rel="noopener noreferrer" className="text-purple-500 underline">
                        {material.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : selectedUnit ? (
            <ul className="w-full bg-gray-200 p-4 rounded-lg shadow">
              {lectures.map(lecture => (
                <li key={lecture.id} className="p-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-300 text-black" onClick={() => handleLectureSelection(lecture)}>{lecture.title}</li>
              ))}
            </ul>
          ) : selectedSubject ? (
            <ul className="w-full bg-gray-200 p-4 rounded-lg shadow">
              {units.map(unit => (
                <li key={unit.id} className="p-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-300 text-black" onClick={() => handleUnitSelection(unit)}>
                  {unit.title}
                </li>
              ))}
            </ul>
          ) : (
            subjects.map(subject => (
              <div 
                key={subject.id} 
                className="w-60 p-4 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg hover:transform hover:-translate-y-1 transition-all" 
                onClick={() => handleSubjectSelection(subject)}
              >
                <img 
                  src={subject.imageUrl} // Use saved, Unsplash, or default image
                  alt={subject.name} 
                  className="w-full h-48 object-cover rounded-t-lg" 
                />
                <div className="p-2">
                  <h3 className="text-xl font-bold text-gray-800">{subject.name}</h3>
                  <p className="text-gray-600">Instructor: {subject.instructorName}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentLectures;