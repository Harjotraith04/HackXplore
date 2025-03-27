import React, { useState, useEffect } from 'react';
import { db } from '../../../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const AdminSubjects = () => {
  const [subjectName, setSubjectName] = useState('');
  const [subjectDescription, setSubjectDescription] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isAddingNewSubject, setIsAddingNewSubject] = useState(false);

  const buttonStyle = "text-white font-bold py-2 px-4 rounded-md hover:shadow-md focus:outline-none";

  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const studentsList = [];
      const teachersList = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.userType === 'student') {
          studentsList.push({ id: doc.id, ...data });
        } else if (data.userType === 'teacher') {
          teachersList.push({ id: doc.id, ...data });
        }
      });
      setStudents(studentsList);
      setTeachers(teachersList);

      const subjectSnapshot = await getDocs(collection(db, 'subjects'));
      const subjectsList = subjectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(subjectsList);
    } catch (error) {
      console.error('Error fetching users and subjects:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubject = async () => {
    try {
      const docRef = await addDoc(collection(db, 'subjects'), {
        name: subjectName,
        description: subjectDescription,
        students: selectedStudents.map(student => student.id),
        teachers: selectedTeachers.map(teacher => teacher.id)
      });

      // Update the user's subject array with the new subject ID
      await Promise.all([...selectedStudents, ...selectedTeachers].map(user => {
        return updateDoc(doc(db, 'users', user.id), {
          subjects: [...user.subjects, docRef.id]
        });
      }));

      setSubjects([
        ...subjects,
        {
          id: docRef.id,
          name: subjectName,
          description: subjectDescription,
          students: selectedStudents.map(student => student.id),
          teachers: selectedTeachers.map(teacher => teacher.id)
        }
      ]);

      setSubjectName('');
      setSubjectDescription('');
      setSelectedStudents([]);
      setSelectedTeachers([]);
      setIsAddingNewSubject(false);
      console.log('Subject added successfully');
    } catch (error) {
      console.error('Error adding subject:', error);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      // Remove the subject ID from the user's subject array
      await Promise.all(subjects.find(subject => subject.id === subjectId).students.map(studentId => {
        return updateDoc(doc(db, 'users', studentId), {
          subjects: subjects.find(subject => subject.id === subjectId).students.filter(id => id !== studentId)
        });
      }));
  
      // Delete the subject document
      await deleteDoc(doc(db, 'subjects', subjectId));
      setSubjects(subjects.filter(subject => subject.id !== subjectId));
      alert('Subject deleted successfully');
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };
  

  const handleUpdateSubject = async () => {
    try {
      await updateDoc(doc(db, 'subjects', editingSubjectId), {
        name: editedName,
        description: editedDescription,
        students: selectedStudents.map(student => student.id),
        teachers: selectedTeachers.map(teacher => teacher.id)
      });
  
      // Update the user's subject array for both students and teachers
      await Promise.all([...subjects.find(subject => subject.id === editingSubjectId).students, ...subjects.find(subject => subject.id === editingSubjectId).teachers].map(userId => {
        return updateDoc(doc(db, 'users', userId), {
          subjects: [...getUserSubjects(userId), editingSubjectId] // Use getUserSubjects function
        });
      }));
  
      setSubjects(subjects.map(subject =>
        subject.id === editingSubjectId
          ? { id: editingSubjectId, name: editedName, description: editedDescription, students: selectedStudents.map(student => student.id), teachers: selectedTeachers.map(teacher => teacher.id) }
          : subject
      ));
      setEditingSubjectId(null);
      console.log('Subject updated successfully');
    } catch (error) {
      console.error('Error updating subject:', error);
    }
  };
  
  // Helper function to get the user's subjects (optional)
  const getUserSubjects = (userId) => {
    const user = students.find(student => student.id === userId) || teachers.find(teacher => teacher.id === userId);
    if (user) {
      return user.subjects || []; // Return an empty array if subjects is not defined
    }
    return []; // Return an empty array if user is not found
  }

  const handleCheckboxChange = (item, isStudent) => {
    if (isStudent) {
      setSelectedStudents(prevSelectedStudents =>
        prevSelectedStudents.includes(item)
          ? prevSelectedStudents.filter(i => i !== item)
          : [...prevSelectedStudents, item]
      );
    } else {
      setSelectedTeachers(prevSelectedTeachers =>
        prevSelectedTeachers.includes(item)
          ? prevSelectedTeachers.filter(i => i !== item)
          : [...prevSelectedTeachers, item]
      );
    }
  };

  const renderList = (items, isStudent) => {
    return items.map(item => (
      <div key={item.id} className="flex items-center space-x-2 mb-2">
        <input
          type="checkbox"
          checked={isStudent
            ? selectedStudents.some(selected => selected.id === item.id)
            : selectedTeachers.some(selected => selected.id === item.id)
          }
          onChange={() => handleCheckboxChange(item, isStudent)}
          className="mr-2"
        />
        <div className="text-black">
          <div>{item.name}</div>
          <div className="text-gray-600">{item.email}</div>
        </div>
      </div>
    ));
  };

  const handleSubjectSelection = async (e) => {
    const selectedValue = e.target.value;
    setSelectedSubjectId(selectedValue);

    if (selectedValue === 'new') {
      setIsAddingNewSubject(true);
      setSubjectName('');
      setSubjectDescription('');
      setSelectedStudents([]);
      setSelectedTeachers([]);
    } else {
      setIsAddingNewSubject(false);
      const selectedSubject = subjects.find(subject => subject.id === selectedValue);
      if (selectedSubject) {
        setEditingSubjectId(selectedSubject.id);
        setEditedName(selectedSubject.name);
        setEditedDescription(selectedSubject.description);
        setSelectedStudents(students.filter(student => selectedSubject.students.includes(student.id)));
        setSelectedTeachers(teachers.filter(teacher => selectedSubject.teachers.includes(teacher.id)));
      }
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-center text-3xl font-bold text-white">Admin - Subjects</h1>

      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700">Manage Subjects</h2>

        <select
          value={selectedSubjectId}
          onChange={handleSubjectSelection}
          className="block w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a subject</option>
          {subjects.map(subject => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
          <option value="new">Add New Subject</option>
        </select>

        {isAddingNewSubject && (
          <>
          <input
              type="text"
              className="block w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Subject Name"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />
            <textarea
              className="block w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Subject Description"
              value={subjectDescription}
              onChange={(e) => setSubjectDescription(e.target.value)}
            />
            <div className="mt-4">
              <h3 className="text-xl font-semibold text-gray-800">Select Students</h3>
              {renderList(students, true)}
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-semibold text-gray-800">Select Teachers</h3>
              {renderList(teachers, false)}
            </div>
            <button
              className={`${buttonStyle} bg-green-500 hover:bg-green-600 mt-4`}
              onClick={handleAddSubject}
            >
              Save
            </button>
          </>
        )}

        {subjects.map(subject => (
          <div key={subject.id} className="flex items-start justify-between mt-4 p-4 border-b border-gray-200 space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-grow">
              {editingSubjectId === subject.id ? (
                <div>
                  <input
                    type="text"
                    className="block w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Subject Name"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                  />
                  <textarea
                    className="block w-full mt-4 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Subject Description"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                  />
                  <div className="mt-4">
                    <h3 className="text-xl font-semibold text-gray-800">Select Students</h3>
                    {renderList(students, true)}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xl font-semibold text-gray-800">Select Teachers</h3>
                    {renderList(teachers, false)}
                  </div>
                </div>
              ) : (
                <div className='text-gray-800'>
                  <h3 className="text-xl font-semibold text-gray-800">{subject.name}</h3>
                  <p className="text-gray-600">{subject.description}</p>
                  <div className="mt-2 text-gray-800">
                    <h4 className="text-lg text-gray-800 font-semibold">Students:</h4>
                    <ul>
                      {students.filter(student => subject.students.includes(student.id)).map(student => (
                        <li key={student.id}>{student.name}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-lg font-semibold">Teachers:</h4>
                    <ul>
                      {teachers.filter(teacher => subject.teachers.includes(teacher.id)).map(teacher => (
                        <li key={teacher.id}>{teacher.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-shrink-0 flex flex-col sm:flex-row sm:space-x-4">
              {editingSubjectId === subject.id ? (
                <button
                  className={`${buttonStyle} bg-green-500 hover:bg-green-600`}
                  onClick={handleUpdateSubject}
                >
                  Save
                </button>
              ) : (
                <button
                  className={`${buttonStyle} bg-yellow-500 hover:bg-yellow-600`}
                  onClick={() => {
                    setEditingSubjectId(subject.id);
                    setEditedName(subject.name);
                    setEditedDescription(subject.description);
                    setSelectedStudents(students.filter(student => subject.students.includes(student.id)));
                    setSelectedTeachers(teachers.filter(teacher => subject.teachers.includes(teacher.id)));
                  }}
                >
                  Edit
                </button>
              )}
              <button
                className={`${buttonStyle} bg-red-500 hover:bg-red-600`}
                onClick={() => handleDeleteSubject(subject.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default AdminSubjects;