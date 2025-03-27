import React from 'react';
import rpiGif from '../assets/images/rpi_board.gif'; 
import rpiLogo from '../assets/images/rpi.gif'; 

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
    <header className="w-full bg-white text-black text-center py-8">
      {/* "Coming Soon" Heading */}
      <div className="mb-12">
        <h1 className="text-8xl font-extrabold">Coming Soon</h1>
      </div>
      <div className="flex items-center justify-center mx-auto max-w-4xl">
        <h2 className="text-5xl font-bold flex items-center">
          GuruCool Anywhere
        </h2>
      </div>
      {/* Add margin between the main heading and the rest of the content */}
      <div className="mt-12" />
    </header>

      <section className="w-full max-w-5xl p-8 text-black space-y-8">
        {/* Future Potential Section */}
        <div className="flex flex-col md:flex-row border border-gray-300 p-6 bg-white rounded-lg shadow-lg">
          <div className="md:w-3/4 md:pr-6">
            <h2 className="text-4xl font-semibold mb-4">Future Potential</h2>
            <p className="text-lg leading-relaxed">
              GuruCool Anywhere is a Raspberry Pi-based module that can locally record and transcribe lectures.
              This solution is designed for classrooms in regions with limited internet connectivity. The aim is to make smart education accessible everywhere, regardless of connectivity issues.
            </p>
          </div>
          <div className="md:w-1/4 flex justify-center items-center">
            <img
              src={rpiGif}
              alt="Raspberry Pi Logo"
              className="w-96 h-auto" // Adjust size as needed
            />
          </div>
        </div>

        {/* Expected Outcomes Section */}
        <div className="flex flex-col md:flex-row-reverse border border-gray-300 p-6 bg-white rounded-lg shadow-lg">
          <div className="md:w-3/4 md:pl-6">
            <h3 className="text-3xl font-semibold mb-4">Expected Outcomes</h3>
            <p className="text-lg leading-relaxed">
              Demonstrates how smart technology can transform classroom management and learning through automation, AI, and AR integration. Provides a user-friendly interface for students, teachers, and administrators, enabling easy interaction with the system. Ensures classrooms with limited or no internet access can benefit from smart classroom features through a Raspberry Pi-based module.
            </p>
          </div>
          <div className="md:w-1/4 flex justify-center items-center">
            <img
              src={rpiLogo}
              alt="Raspberry Pi Logo"
              className="w-32 h-auto" // Adjust size as needed
            />
          </div>
        </div>

             {/* Key Features Section */}
             <div className="flex flex-col items-center border border-gray-300 p-6 bg-white rounded-lg shadow-lg">
          <div className="md:w-full text-justify">
            <h3 className="text-3xl font-semibold mb-4">Key Features</h3>
            <ul className="list-disc list-inside text-lg leading-relaxed space-y-4">
              <li><strong>Local Recording and Transcription:</strong> The Raspberry Pi device will be equipped with a microphone and processing unit capable of recording lectures in real-time. Using onboard AI algorithms, it will automatically transcribe spoken content into text, storing these transcriptions locally.</li>
              <li><strong>Offline Operation:</strong> GuruCool Anywhere operates offline, relying on local storage and processing. Once connected to the internet, the device can sync all stored data to the GuruCool cloud for centralized access.</li>
              <li><strong>Cost-Effective and Scalable:</strong> The Raspberry Pi ensures the solution remains low-cost and affordable for educational institutions in underserved areas, with easy deployment across multiple classrooms.</li>
              <li><strong>Smart Synchronization:</strong> When connectivity is available, the device automatically uploads stored lectures and summaries to the cloud, enabling students to access materials via the GuruCool platform.</li>
              <li><strong>Localized Learning Environment:</strong> Educational institutions can offer smart learning without constant connectivity, enabling students to review lecture content and quizzes offline.</li>
              <li><strong>Portable and Easy to Deploy:</strong> The compact Raspberry Pi module is portable and easy to install, minimizing disruption to teaching activities.</li>
            </ul>
          </div>
        
         
        </div>

           {/* Benefits for Remote Classrooms Section */}
           <div className="flex flex-col items-center border border-gray-300 p-6 bg-white rounded-lg shadow-lg">
          <div className="md:w-full text-justify">
            <h3 className="text-3xl font-semibold mb-4">Benefits for Remote Classrooms</h3>
            <ul className="list-disc list-inside text-lg leading-relaxed space-y-4">
              <li><strong>Access to AI-Powered Tools:</strong> Students benefit from automated lecture summaries and interactive learning, even without internet.</li>
              <li><strong>Empowering Rural Education:</strong> Rural and underprivileged schools gain access to tools that enhance education quality, reducing the learning gap between urban and rural areas.</li>
              <li><strong>Sustainability:</strong> The system functions with minimal power, making it sustainable for areas with limited electricity.</li>
              <li><strong>Future Vision:</strong> GuruCool Anywhere will continuously upgrade to include edge computing capabilities for real-time query resolution and quiz generation without cloud access.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
