// src/createSampleData.js
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, setDoc } from "firebase/firestore";

async function createSampleData() {
  try {
    // Creating a Subject
    const subjectRef = await addDoc(collection(db, "subjects"), {
      name: "Math",
      description: "Mathematics Subject"
    });

    // Creating Units under the Subject
    const unit1Ref = await addDoc(collection(db, `subjects/${subjectRef.id}/units`), {
      title: "Algebra"
    });

    const unit2Ref = await addDoc(collection(db, `subjects/${subjectRef.id}/units`), {
      title: "Geometry"
    });

    // Creating Lectures under Unit 1
    const lecture1Ref = await addDoc(collection(db, `subjects/${subjectRef.id}/units/${unit1Ref.id}/lectures`), {
      title: "Linear Equations",
      content: "Introduction to linear equations."
    });

    const lecture2Ref = await addDoc(collection(db, `subjects/${subjectRef.id}/units/${unit1Ref.id}/lectures`), {
      title: "Quadratic Equations",
      content: "Introduction to quadratic equations."
    });

    // Creating Links under Lecture 1
    await addDoc(collection(db, `subjects/${subjectRef.id}/units/${unit1Ref.id}/lectures/${lecture1Ref.id}/links`), {
      title: "Linear Equations Document",
      url: "https://example.com/linear-equations"
    });

    await addDoc(collection(db, `subjects/${subjectRef.id}/units/${unit1Ref.id}/lectures/${lecture1Ref.id}/links`), {
      title: "Linear Equations Video",
      url: "https://example.com/linear-equations-video"
    });

    // Creating Lectures under Unit 2
    const lecture3Ref = await addDoc(collection(db, `subjects/${subjectRef.id}/units/${unit2Ref.id}/lectures`), {
      title: "Triangles",
      content: "Understanding triangles."
    });

    // Creating Links under Lecture 3
    await addDoc(collection(db, `subjects/${subjectRef.id}/units/${unit2Ref.id}/lectures/${lecture3Ref.id}/links`), {
      title: "Triangles Document",
      url: "https://example.com/triangles"
    });

    console.log("Sample data created successfully!");
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

export default createSampleData;
