import React from "react";
import AboutImage from '../assets/images/whitelogo.png';
import { FaRegHandPointRight, FaRegSmile, FaRocket, FaCog } from "react-icons/fa";

const About = () => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-black p-8 md:p-12 text-gray-300" id="about">
      <div className="max-w-7xl mx-auto text-gray-300 container">
        <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-6 mb-10 text-center md:text-left">
          <img src={AboutImage} alt="GuruCool Logo" className="w-16 h-16 mb-4 md:mb-0" />
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-200">
              Vision
            </h2>
            <p className="mt-4 text-gray-400">
              Our vision is to revolutionize education by integrating cutting-edge technology into classrooms. We aim to create a world where automation, AI-driven insights, and interactive tools empower educators and inspire students, fostering an environment where learning is both efficient and engaging. By making advanced technology accessible, we strive to shape a future where every classroom operates seamlessly, unlocking new possibilities for teaching and learning.
            </p>
          </div>
        </div>

        <div className="mt-12 grid divide-x divide-y divide-gray-800 rounded-3xl border border-gray-800 bg-gradient-to-b from-gray-900 to-black sm:grid-cols-2 lg:grid-cols-4 lg:divide-y-0 xl:grid-cols-4">
          <div className="group relative transition p-8 text-center bg-gray-900 hover:bg-gradient-to-b hover:from-green-500 hover:to-green-700 hover:shadow-2xl rounded-lg">
            <FaRegHandPointRight className="text-green-400 w-12 h-12 mx-auto"/>
            <h5 className="mt-4 text-xl font-semibold text-gray-200 transition">Automated Management</h5>
            <p className="text-gray-400 mt-2">
              We automate classroom management tasks to streamline operations, allowing teachers to focus on instruction.
            </p>
          </div>

          <div className="group relative transition p-8 text-center bg-gray-900 hover:bg-gradient-to-b hover:from-blue-500 hover:to-blue-700 hover:shadow-2xl rounded-lg">
            <FaCog className="text-blue-400 w-12 h-12 mx-auto"/>
            <h5 className="mt-4 text-xl font-semibold text-gray-200 transition">Smart Resource Optimization</h5>
            <p className="text-gray-400 mt-2">
              Optimize resources to reduce downtime, ensuring that students have consistent access to essential tools.
            </p>
          </div>

          <div className="group relative transition p-8 text-center bg-gray-900 hover:bg-gradient-to-b hover:from-purple-500 hover:to-purple-700 hover:shadow-2xl rounded-lg">
            <FaRocket className="text-purple-400 w-12 h-12 mx-auto"/>
            <h5 className="mt-4 text-xl font-semibold text-gray-200 transition">Interactive Learning</h5>
            <p className="text-gray-400 mt-2">
              Engage students with interactive tools and AR integration, enhancing their understanding through immersive technology.
            </p>
          </div>

          <div className="group relative transition p-8 text-center bg-gray-900 hover:bg-gradient-to-b hover:from-yellow-500 hover:to-yellow-700 hover:shadow-2xl rounded-lg">
            <FaRegSmile className="text-yellow-400 w-12 h-12 mx-auto"/>
            <h5 className="mt-4 text-xl font-semibold text-gray-200 transition">Accessible for All</h5>
            <p className="text-gray-400 mt-2">
              Our offline module ensures classrooms in areas with limited internet can still benefit from our features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
