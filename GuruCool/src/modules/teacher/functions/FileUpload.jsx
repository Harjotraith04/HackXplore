import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebaseConfig';

const FileUpload = ({ lectureId, onFileUploaded }) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const fileRef = ref(storage, `lectures/${lectureId}/${file.name}`);
    const uploadTask = uploadBytes(fileRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progress);
      },
      (error) => {
        setError('Error uploading file: ' + error.message);
        setUploading(false);
      },
      async () => {
        try {
          const url = await getDownloadURL(fileRef);
          onFileUploaded(url, file.name);
          setFile(null);
          setProgress(0);
          setUploading(false);
        } catch (error) {
          setError('Error getting file URL: ' + error.message);
          setUploading(false);
        }
      }
    );
  };

  return (
    <div className="file-upload">
      <input
        type="file"
        onChange={handleFileChange}
        className="block w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleUpload}
        className="mt-4 w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600"
        disabled={uploading}
      >
        {uploading ? `Uploading ${Math.round(progress)}%` : 'Upload File'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default FileUpload;
