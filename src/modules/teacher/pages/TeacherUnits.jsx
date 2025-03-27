import React, { useState, useEffect } from 'react';
import { db } from '../../../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const TeacherUnits = ({ userId }) => {
  const [unitTitle, setUnitTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [editUnitId, setEditUnitId] = useState(null);
  const [editUnitTitle, setEditUnitTitle] = useState('');

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

  const handleAddUnit = async () => {
    if (!selectedSubjectId) return;
    try {
      await addDoc(collection(db, `subjects/${selectedSubjectId}/units`), {
        title: unitTitle,
      });
      setUnitTitle('');
      fetchUnits(selectedSubjectId); // Refresh units list
      console.log('Unit added successfully');
    } catch (error) {
      console.error('Error adding unit:', error);
    }
  };

  const handleDeleteUnit = async (unitId) => {
    try {
      await deleteDoc(doc(db, `subjects/${selectedSubjectId}/units`, unitId));
      setUnits(units.filter(unit => unit.id !== unitId));
      console.log('Unit deleted successfully');
    } catch (error) {
      console.error('Error deleting unit:', error);
    }
  };

  const handleUpdateUnit = async (unitId) => {
    try {
      await updateDoc(doc(db, `subjects/${selectedSubjectId}/units`, unitId), {
        title: editUnitTitle,
      });
      setUnits(units.map(unit => unit.id === unitId ? { id: unitId, title: editUnitTitle } : unit));
      setEditUnitId(null); // Exit edit mode
      console.log('Unit updated successfully');
    } catch (error) {
      console.error('Error updating unit:', error);
    }
  };

  useEffect(() => {
    fetchSubjects();
    console.log(userId);
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchUnits(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  return (
    <div className="container mx-auto mt-10 p-4">
                  <style>
      </style>
      <h1 className="text-center text-3xl font-bold text-white">Teacher - Units</h1>

      <section className="my-8 p-6 bg-gray-100 rounded-md shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700">Add Unit to Subject</h2>
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
        <input
          type="text"
          className="block w-full mt-4 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Unit Title"
          value={unitTitle}
          onChange={(e) => setUnitTitle(e.target.value)}
        />
        <button
          className="mt-4 w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600"
          onClick={handleAddUnit}
        >
          Add Unit
        </button>
      </section>

      {selectedSubjectId && (
        <section className="my-8">
          <h2 className="text-2xl font-semibold text-white">Units List</h2>
          {units.map(unit => (
            <div key={unit.id} className="flex items-center justify-between mt-4 p-4 bg-white rounded-md shadow-md">
              <div>
                {editUnitId === unit.id ? (
                  <input
                    type="text"
                    className="block w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editUnitTitle}
                    onChange={(e) => setEditUnitTitle(e.target.value)}
                  />
                ) : (
                  <h3 className="text-xl font-semibold text-gray-800">{unit.title}</h3>
                )}
              </div>
              <div className="flex items-center">
                {editUnitId === unit.id ? (
                  <button
                    className="mr-4 bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600"
                    onClick={() => handleUpdateUnit(unit.id)}
                  >
                    Save
                  </button>
                ) : (
                  <button
                    className="mr-4 bg-yellow-500 text-white font-bold py-2 px-4 rounded-md hover:bg-yellow-600"
                    onClick={() => {
                      setEditUnitId(unit.id);
                      setEditUnitTitle(unit.title);
                    }}
                  >
                    Edit
                  </button>
                )}
                <button
                  className="bg-red-500 text-white font-bold py-2 px-4 rounded-md hover:bg-red-600"
                  onClick={() => handleDeleteUnit(unit.id)}
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

export default TeacherUnits;

