import { getFirestore, doc, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';

const K = 32; // Learning coefficient

const calculateExpectedPerformance = (studentELO, oppELO) => {
  return 1 / (1 + Math.pow(10, (oppELO - studentELO) / 400));
};

const updateRecentAuras = async (userId, subjectId, activityType, auraChange) => {
  const db = getFirestore();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();
    let recentAuras = userData.recentAuras || [];

    // Remove the oldest entry if there are already 2 entries
    if (recentAuras.length >= 2) {
      recentAuras.shift(); // Removes the first (oldest) entry
    }

    // Add the new aura change to the recentAuras array
    recentAuras.push({
      subjectId,
      activityType,
      auraChange,
      timestamp: new Date(),
    });

    // Update the recentAuras field in the user's document
    await updateDoc(userRef, { recentAuras });
  }
};

const calculateEloForQuiz = async (userId, quizId, normalizedScore, subjectId) => { 
  const db = getFirestore();
  const userRef = doc(db, 'users', userId);
  const quizRef = doc(db, 'quizzes', quizId);
  const subjectRef = doc(db, 'subjects', subjectId);
  
  const userDoc = await getDoc(userRef);
  const quizDoc = await getDoc(quizRef);
  const subjectDoc = await getDoc(subjectRef);

  if (!userDoc.exists() || !quizDoc.exists() || !subjectDoc.exists()) return;

  const currentELO = userDoc.data().aura;
  const oppELO = quizDoc.data().averageElo || 1000; // Default ELO if not available

  const E1 = calculateExpectedPerformance(currentELO, oppELO);
  const R1 = normalizedScore > 80 ? 1 : (normalizedScore >= 50 ? 0.5 : 0);

  const auraGained = K * (0.5 * (R1 - E1));
  const newELO = currentELO + auraGained;

  // Update user ELO score
  await updateDoc(userRef, { aura: Math.round(newELO) });

  // Log the aura gained in the subject's quizAuras sub-collection
  await addDoc(collection(db, `subjects/${subjectId}/quizAuras`), {
    userId,
    quizId,
    auraGained: Math.round(auraGained),
    timestamp: new Date(),
  });

  // Update recent auras for the user
  await updateRecentAuras(userId, subjectId, 'quiz', Math.round(auraGained));
};

const calculateEloForAssignment = async (userId, assignmentId, normalizedScore, subjectId) => {
  const db = getFirestore();
  const userRef = doc(db, 'users', userId);
  const assignmentRef = doc(db, 'assignments', assignmentId);
  const subjectRef = doc(db, 'subjects', subjectId);
  
  const userDoc = await getDoc(userRef);
  const assignmentDoc = await getDoc(assignmentRef);
  const subjectDoc = await getDoc(subjectRef);

  if (!userDoc.exists() || !assignmentDoc.exists() || !subjectDoc.exists()) return;

  const currentELO = userDoc.data().aura;
  const oppELO = assignmentDoc.data().averageElo || 1000; // Default ELO if not available

  const E2 = calculateExpectedPerformance(currentELO, oppELO);
  const R2 = normalizedScore > 80 ? 1 : (normalizedScore >= 50 ? 0.5 : 0);

  const auraGained = K * (0.3 * (R2 - E2));
  const newELO = currentELO + auraGained;

  // Update user ELO score
  await updateDoc(userRef, { aura: Math.round(newELO) });

  // Log the aura gained in the subject's assignmentAuras sub-collection
  await addDoc(collection(db, `subjects/${subjectId}/assignmentAuras`), {
    userId,
    assignmentId,
    auraGained: Math.round(auraGained),
    timestamp: new Date(),
  });

  // Update recent auras for the user
  await updateRecentAuras(userId, subjectId, 'assignment', Math.round(auraGained));
};

const calculateEloForAttendance = async (userId, attendanceId, attendanceRate, subjectId) => {
  const db = getFirestore();
  const userRef = doc(db, 'users', userId);
  const attendanceRef = doc(db, 'attendances', attendanceId);
  const subjectRef = doc(db, 'subjects', subjectId);

  const userDoc = await getDoc(userRef);
  const attendanceDoc = await getDoc(attendanceRef);
  const subjectDoc = await getDoc(subjectRef);

  if (!userDoc.exists() || !attendanceDoc.exists() || !subjectDoc.exists()) return;

  const currentELO = userDoc.data().aura;
  const oppELO = attendanceDoc.data().averageElo || 1000; // Default ELO if not available

  const E3 = calculateExpectedPerformance(currentELO, oppELO);
  const R3 = attendanceRate === 100 ? 1 : (attendanceRate >= 75 ? 0.5 : 0);

  const auraGained = K * (0.2 * (R3 - E3));
  const newELO = currentELO + auraGained;

  // Update user ELO score
  await updateDoc(userRef, { aura: Math.round(newELO) });

  // Log the aura gained in the subject's attendanceAuras sub-collection
  await addDoc(collection(db, `subjects/${subjectId}/attendanceAuras`), {
    userId,
    attendanceId,
    auraGained: Math.round(auraGained),
    timestamp: new Date(),
  });

  // Update recent auras for the user
  await updateRecentAuras(userId, subjectId, 'attendance', Math.round(auraGained));
};

export { calculateEloForQuiz, calculateEloForAssignment, calculateEloForAttendance };