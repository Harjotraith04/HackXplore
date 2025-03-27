import React from "react";
import employeeMSImage from "../assets/images/API.png";
import bookMSImage from "../assets/images/API.png";
import API from "../assets/images/API.png";

const projects = [
  {
    id: 1,
    name: "Cloud-Based Infrastructure",
    technologies: "MERN Stack",
    image: employeeMSImage, // Adding the image source
    github: "https://github.com/example/cloud-based-infrastructure" // Example GitHub link
  },
  {
    id: 2,
    name: "LLM-Based Smart Learning Module",
    technologies: "Hugging Face Transformers, OpenAI API",
    image: bookMSImage, // Adding the image source
    github: "https://github.com/example/llm-smart-learning-module" // Example GitHub link
  },
  {
    id: 3,
    name: "API-Driven Integration",
    technologies: "Node.js, RESTful APIs",
    image: API, // Reusing the image source
    github: "https://github.com/example/api-driven-integration" // Example GitHub link
  },
];

const Projects = () => {
  return (
    <div className="bg-black text-white py-20" id="project">
      <div className="container mx-auto px-8 md:px-16 lg:px-24">
        <h2 className="text-4xl font-bold text-center mb-12">Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="bg-gray-800 p-6 rounded-lg hover:shadow-lg 
            transform transition-transform duration-300 hover:scale-105">
              {/* Increase the height of the images here */}
              <img src={project.image} alt={project.name} className="rounded-lg mb-4 w-full h-64 object-cover" />
              <h3 className="text-2xl font-bold mb-2">{project.name}</h3>
              <p className="text-gray-400 mb-4">{project.technologies}</p>
              <a href={project.github} className="inline-block bg-gradient-to-r 
              from-green-400 to-blue-500 text-white px-4 py-2 rounded-full" target="_blank" 
              rel="noopener noreferrer">GitHub</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;
