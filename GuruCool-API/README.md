# GuruCool API

<p align="center">
  <img src="https://github.com/user-attachments/assets/d48a5120-8c32-4b41-a96a-e3da506171e8" alt="Light with Text Hin">
</p>

This repository contains Flask-based APIs designed to support GuruCool - a smart classroom system, providing features like transcript generation, quiz creation, and embedding management.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Running Locally](#running-locally)
  - [Running with Docker](#running-with-docker)
- [Usage](#usage)
  - [API Endpoints](#api-endpoints)
    - [`GET /`](#get-)
    - [`POST /generate_embeddings`](#post-generate_embeddings)
    - [`POST /transcribe_audio`](#post-transcribe_audio)
    - [`POST /generate_quiz`](#post-generate_quiz)
    - [`POST /chat`](#post-chat)
    - [`POST /reset`](#post-reset)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Transcription Service**: Converts audio files into text transcripts and generates summaries.
- **Quiz Generation**: Automatically generates quiz questions based on lecture content.
- **Embedding Management**: Generates and manages document embeddings for efficient information retrieval and implementing a RAG model.
- **Document Processing**: Supports processing of various document formats including `.txt`, `.pdf`, and `.pptx`.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Python 3.10+
- Docker (if you want to run the application in a container)

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/HackPoolSIH/GuruCool-API.git
   cd GuruCool-API
   ```

2. **Install dependencies**:
   If you are running the application locally without Docker, you can install the required Python packages using:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

### Running Locally

1. **Set up environment variables**:
   You can create a `.env` file in the root of the project to store environment variables, such as:

   ```env
   STORAGE_BUCKET=your-firebase-storage-bucket
   CREDENTIALS_PATH=/path/to/your/firebase/credentials.json
   PORT=8008
   GURUCOOL_API_KEY=your-api-key
   ```

2. **Run the application**:
   ```bash
   python GuruCoolAPI.py
   ```

   The API will be available at `http://localhost:8008`.

### Running with Docker

1. **Build the Docker image**:
   ```bash
   docker build -t gurucoolapi .
   ```

2. **Run the Docker container**:
   ```bash
   docker run -d -p 8008:8008 --name gurucoolapi-container gurucoolapi
   ```

   - `-d`: Runs the container in detached mode (as a daemon).
   - `-p 8008:8008`: Maps port 8008 on your local machine to port 8008 in the container.
   - `--name gurucoolapi-container`: Names the container `gurucoolapi-container`.
   - `gurucoolapi`: The name of the Docker image.

   The API will be available at `http://localhost:8008`.

## Usage

Once the application is running, you can interact with the API using tools like `curl` or Postman.

### API Endpoints

#### `GET /`

- **Description**: Returns a simple "Hello, World!" message.
- **Headers**: None
- **Response**:
  ```json
  <HTML content>
  ```

#### `POST /generate_embeddings`

- **Description**: Generates embeddings for documents.
- **Headers**:
  - `GuruCool-API-Key`: Your API key (required).
  - `subject`: Subject ID (required).
  - `unit`: Unit ID (required).
  - `lecture`: Lecture ID (required).
  - `document_urls`: Comma-separated list of document URLs (required).
- **Response**:
  - **200 OK**: 
    ```json
    {
      "message": "Embeddings generated and cached successfully",
      "embedding_cache_file": "<path_to_cache_file>"
    }
    ```
  - **400 Bad Request**: Missing required headers.
  - **500 Internal Server Error**: Error during processing.

#### `POST /transcribe_audio`

- **Description**: Transcribes an audio file and generates a summary.
- **Headers**:
  - `GuruCool-API-Key`: Your API key (required).
  - `firebase_url`: Firebase URL of the audio file (required).
  - `model_name`: Whisper model name (optional, default is `base`).
  - `subject`: Subject ID (required).
  - `unit`: Unit ID (required).
  - `lecture`: Lecture ID (required).
- **Response**:
  - **200 OK**:
    ```json
    {
      "message": "Transcription and summary successful",
      "transcript_url": "<transcript_url>",
      "summary_url": "<summary_url>"
    }
    ```
  - **400 Bad Request**: Missing required headers.
  - **500 Internal Server Error**: Error during transcription or summary generation.

#### `POST /generate_quiz`

- **Description**: Generates quiz questions based on the provided lecture content.
- **Headers**:
  - `GuruCool-API-Key`: Your API key (required).
- **Body**:
  ```json
  {
    "subject_id": "subject_id_value",
    "unit_id": "unit_id_value",
    "lecture_id": "lecture_id_value",
    "document_urls": ["url1", "url2", ...],
    "num_questions": 5
  }
  ```
- **Response**:
  - **200 OK**:
    ```json
    {
      "Question 1": "Answer 1",
      "Question 2": "Answer 2",
      ...
    }
    ```
  - **400 Bad Request**: Missing required fields.
  - **404 Not Found**: No documents found for the given lecture ID.
  - **500 Internal Server Error**: Error during quiz generation.

#### `POST /chat`

- **Description**: Handles chat-based interactions using the lecture embeddings.
- **Headers**:
  - `GuruCool-API-Key`: Your API key (required).
- **Body**:
  ```json
  {
    "query": "User question",
    "lecture_id": "lecture_id_value",
    "subject_id": "subject_id_value",
    "unit_id": "unit_id_value"
  }
  ```
- **Response**:
  - **200 OK**:
    ```json
    {
      "response": "Chatbot's response",
      "document_sources": ["doc1", "doc2", ...],
      "processing_time": "1.23 seconds"
    }
    ```
  - **400 Bad Request**: Missing required fields.
  - **500 Internal Server Error**: Error during response generation.

#### `POST /reset`

- **Description**: Resets the conversation history for the chat.
- **Headers**: None
- **Response**:
  - **200 OK**:
    ```json
    {
      "message": "Conversation history reset."
    }
    ```

## Environment Variables

- `STORAGE_BUCKET`: Your Firebase Storage bucket name.
- `CREDENTIALS_PATH`: Path to your Firebase credentials JSON file.
- `PORT`: Port number where the Flask app runs.
- `GURUCOOL_API_KEY`: API key for securing your endpoints.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any bugs, feature requests, or improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
