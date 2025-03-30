/** @jsxImportSource @emotion/react */
import React from "react";
import AboutImage from '../assets/images/whitelogo.png';
import { FaChartLine, FaRegFileAlt, FaMicrophone, FaGlobe } from "react-icons/fa";

const About = () => {
  return (
    <div className="bg-black">
      <section
        id="about"
        className="relative block px-6 py-10 md:py-20 md:px-10 border-t border-b border-neutral-900 bg-neutral-900/30"
      >
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-6 mb-10 text-center md:text-left">
            <img src={AboutImage} alt="GuruCool Logo" className="w-16 h-16 mb-4 md:mb-0" />
            <div>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                Key Features
              </h2>
              <p className="mt-4 max-w-xl mx-auto md:mx-0 text-gray-400">
                Discover the innovative features that set GuruCool apart in classroom management, each designed to support and enhance educational engagement.
              </p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl z-10 grid grid-cols-1 gap-10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-8 text-center shadow transform transition-transform duration-300 hover:scale-105">
            <FaChartLine className="text-xl text-blue-500 w-12 h-12 mx-auto"/>
            <h5 className="mt-6 text-gray-400">Elo Score</h5>
            <p className="mt-2 font-normal leading-relaxed tracking-wide text-gray-400">
              Track and assess student performance dynamically with an Elo-based scoring system, providing real-time feedback.
            </p>
          </div>

          <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-8 text-center shadow transform transition-transform duration-300 hover:scale-105">
            <FaRegFileAlt className="text-xl text-green-500 w-12 h-12 mx-auto"/>
            <h5 className="mt-6 text-gray-400">RAG Model</h5>
            <p className="mt-2 font-normal leading-relaxed tracking-wide text-gray-400">
              Visualize student progress using the RAG (Red-Amber-Green) model, aiding quick identification of learning gaps.
            </p>
          </div>

          <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-8 text-center shadow transform transition-transform duration-300 hover:scale-105">
            <FaMicrophone className="text-xl text-purple-500 w-12 h-12 mx-auto"/>
            <h5 className="mt-6 text-gray-400">Transcription</h5>
            <p className="mt-2 font-normal leading-relaxed tracking-wide text-gray-400">
              Capture and transcribe live lessons, making it easy for students to revisit and review lectures anytime.
            </p>
          </div>

          <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-8 text-center shadow transform transition-transform duration-300 hover:scale-105">
            <FaGlobe className="text-xl text-yellow-500 w-12 h-12 mx-auto"/>
            <h5 className="mt-6 text-gray-400">GuruCool Anywhere</h5>
            <p className="mt-2 font-normal leading-relaxed tracking-wide text-gray-400">
              Access all features offline or online, ensuring an uninterrupted learning experience, even in remote areas.
            </p>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 z-0 h-1/3 w-full border-b"
          style={{
            backgroundImage:
              "linear-gradient(to right top, rgba(79, 70, 229, 0.2) 0%, transparent 50%, transparent 100%)",
            borderColor: "rgba(92, 79, 240, 0.2)",
          }}
        ></div>
        <div
          className="absolute bottom-0 right-0 z-0 h-1/3 w-full"
          style={{
            backgroundImage:
              "linear-gradient(to left top, rgba(220, 38, 38, 0.2) 0%, transparent 50%, transparent 100%)",
            borderColor: "rgba(92, 79, 240, 0.2)",
          }}
        ></div>
      </section>
    </div>
  );
};

export default About;
