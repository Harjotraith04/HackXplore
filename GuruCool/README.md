# GuruCool - Smart Classroom Management System

Welcome to GuruCool, an innovative smart classroom management system designed to revolutionize the educational experience for both students and educators. GuruCool aims to transform traditional classrooms by introducing AI-powered features, gamified learning, and automated operational tasks, making teaching and learning more efficient, engaging, and personalized.

## Overview

GuruCool leverages the latest advancements in AI, LLMs, and automation to create a holistic and interactive learning environment. Our platform offers a range of features including:

- **Lecture Summaries:** Automatically converts lectures recorded on the GuruCool platform into concise summaries and full transcripts for easy review.
- **RAG Model Chatbot:** Provides personalized, 24/7 academic support by dynamically referencing class materials.
- **ELO (AURA) Score:** Gamifies learning by tracking student performance and promoting healthy competition.
- **Editable Course Planner:** Automatically generates course plans for educators, incorporating lecture hours, holidays, and assessments.
- **Automatic Assignment & Lab Creation:** Uses AI to generate and assess assignments and labs based on lecture content.
- **Interactive Learning Tools:** Enhances engagement with personalized tips, real-time progress updates, and collaborative smart boards.
- **GuruCool Anywhere:** A hardware module built with Raspberry Pi to ensure that smart classroom features are accessible even in regions with limited internet connectivity.

## Features

### For Students:
- **Interactive Learning Tools:** Engaging students with quizzes, flashcards, and personalized tips.
- **Chatbot Assistance:** 24/7 support to answer academic questions and provide learning resources.
- **ELO (AURA) Score:** A gamified scoring system to encourage healthy competition and track progress.

### For Teachers:
- **Automated Course Planning:** Efficiently plan courses, lectures, and assignments with our intelligent scheduler.
- **AI-Powered Lecture Summaries:** Automatically generate concise summaries and full transcripts for easy student review.
- **Data Analytics:** Gain insights into student performance and resource usage for personalized learning and balanced assessments.
- **Resource Management:** Automates the scheduling and management of classroom resources like smart boards and projectors.

## Deployment

GuruCool is designed to be a cross-platform solution that can be deployed on multiple platforms to ensure accessibility and ease of use. The application can be deployed on:

### 1. **Web Platform:**
   - **Frontend:** Built with React and Vite, styled using Tailwind CSS.
   - **Backend:** Currently hosted on Firebase, integrated with Firestore for database management.
   - **Deployment:** The web application can be deployed using services like Firebase Hosting or AWS S3 and CloudFront for a scalable and globally distributed setup.
   - **Instructions:**
     - Clone the repository.
     - Install the dependencies using `npm install`.
     - Build the project using `npm run build`.
     - Deploy the build folder to Firebase Hosting or an AWS S3 bucket and configure CloudFront for global distribution.

### 2. **Mobile Platform (Future Scope):**
   - We plan to extend GuruCool to mobile platforms using React Native to create a cross-platform mobile application for iOS and Android.
   - The mobile app will integrate with the same backend APIs as the web app to ensure feature parity.
   - **Deployment (Future):** 
     - For Android, it will be deployable on the Google Play Store.
     - For iOS, it will be deployable on the Apple App Store.

### 3. **Offline Platform (GuruCool Anywhere):**
   - A hardware module built using Raspberry Pi for offline access to GuruCool features.
   - This module can be set up in areas with limited internet connectivity to provide access to features like lecture summaries, quizzes, and more.
   - **Instructions:**
     - Set up the Raspberry Pi with the required software and scripts.
     - Sync the GuruCool database periodically when the internet is available.
     - Deploy the local web server on the Raspberry Pi to provide offline access.

### 4. **Server Deployment (Current Setup):**
   - **Firebase:** Currently used for storage, hosting, and real-time database management.
   - **API Gateway:** Interacts with various functions and databases to provide seamless backend services to the frontend.
   - **Instructions:**
     - Deploy the functions through Firebase Functions.
     - Integrate these functions with the frontend for seamless interaction.

## Getting Started

### Prerequisites

- Node.js and npm installed.
- Firebase CLI installed and configured.
- (Future) AWS CLI installed and configured for possible cloud integrations.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YourUsername/GuruCool.git
   ```
2. Navigate to the project directory:
   ```bash
   cd GuruCool
   ```
3. Install the necessary dependencies:
   ```bash
   npm install
   ```

### Running the Application Locally

1. To start the frontend application, run:
   ```bash
   npm run dev
   ```
   This will start the application on `localhost:3000`.

2. Deploy the backend services using Firebase as per the deployment instructions.

### Environment Variables

Ensure to set up the environment variables in a `.env` file at the root of the project. These variables include:
- Firebase configuration
- Other API keys and secrets used in the application

