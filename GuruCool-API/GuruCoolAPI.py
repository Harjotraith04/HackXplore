import os
import warnings
import logging
import time
import threading

from dotenv import load_dotenv
from datetime import datetime

from flask import Flask, abort, request, jsonify, session
from flask_cors import CORS

from firebase_admin import storage as firebase_storage, firestore

from langchain_ollama import OllamaLLM
from sentence_transformers import SentenceTransformer

from utils.helpers import *
from utils.embedding import * 
from utils.firebase import *
from utils.quiz import *
from utils.transcribe import *
from utils.askguru import *
from utils.coursepolicy import *
from utils.assignment import *
from utils.cleanup import *

warnings.filterwarnings("ignore", category=FutureWarning, module="whisper")
warnings.filterwarnings("ignore", category=UserWarning, module="whisper")

# --------------------------------------------------------------- ENV INIT --------------------------------------------------------------- 

load_dotenv()
STORAGE_BUCKET = os.getenv("STORAGE_BUCKET")
CREDENTIALS_PATH = os.getenv("CREDENTIALS_PATH")
PORT = os.getenv("PORT")
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.getenv("DATA_PATH", os.path.join(PROJECT_ROOT, "Docs"))
CACHE_PATH = os.getenv("DATA_PATH", os.path.join(PROJECT_ROOT, "Cache"))
GURUCOOL_API_KEY = os.getenv("GURUCOOL_API_KEY")
LOGS = os.path.join(PROJECT_ROOT, "Logs/log.txt")
MODEL = os.getenv("MODEL","llama3.1")

logging.basicConfig(filename=LOGS, level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = GURUCOOL_API_KEY

db = firestore.client()
storage = firebase_storage.bucket()

ollama_model = OllamaLLM(model=MODEL)

# --------------------------------------------------------------- API Key Middleware --------------------------------------------------------------- 

def require_api_key(func):
    def wrapper(*args, **kwargs):
        api_key = request.headers.get('GuruCool-API-Key')
        if api_key != GURUCOOL_API_KEY:
            logging.error(f"Unauthorized access attempt with API Key: {api_key}")
            abort(401, description="Unauthorized access. Invalid API key.")
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__ 
    return wrapper

#  --------------------------------------------------------------- ROUTES --------------------------------------------------------------- 

@app.route('/', methods=['GET'])
def hello_world():
    return '''
    <html>
        <head>
            <title>Hello World</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background-color: #1c1c1c;
                    color: #f0f0f0;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
                .container {
                    background-color: #2a2a2a;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
                    text-align: center;
                    max-width: 600px;
                    width: 100%;
                }
                h1 {
                    color: #ffcc00;
                    font-size: 2.8em;
                    margin-bottom: 15px;
                }
                p {
                    color: #cccccc;
                    font-size: 1.2em;
                    margin: 10px 0;
                }
                .api-key {
                    font-weight: bold;
                    color: #ff6b6b;
                }
                .footer {
                    margin-top: 25px;
                    font-size: 0.9em;
                    color: #888888;
                }
                a {
                    color: #ffcc00;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Hello, World!</h1>
                <p>GuruCool API is functional</p>
                <p class="api-key">API Key is: 1234</p>
                <p class="footer">lmao</p>
            </div>
        </body>
    </html>
    '''
    
@app.route('/generate_embeddings', methods=['POST'])
@require_api_key
def generate_embeddings():
    """
    Generate embeddings for a lecture based on the provided subject, unit, lecture ID, and document URLs.
    Returns:
        A JSON response containing the status of the embedding generation process.
    Raises:
        Exception: If an error occurs during the embedding generation process.
    """
    try:
        data = request.json
        subject = data.get('subject')
        unit = data.get('unit')
        lecture_id = data.get('lecture')
        document_urls = data.get('document_urls', [])
        
        if isinstance(document_urls, str):
            document_urls = [document_urls] 
        
        logging.info(f"Document URLs: {document_urls}")

        if not subject or not unit or not lecture_id or not document_urls:
            logging.error("Missing fields: 'subject', 'unit', 'lecture', and 'document_urls' are required.")
            return jsonify({"error": "Missing fields: 'subject', 'unit', 'lecture', and 'document_urls' are required."}), 400
        
        logging.info(f"Starting embedding generation for lecture ID: {lecture_id}")
    
        generate_and_save_embeddings(subject, unit, lecture_id, document_urls, PROJECT_ROOT=PROJECT_ROOT)
        
        logging.info(f"Embedding generation completed for lecture ID: {lecture_id}")
        return jsonify({
            "message": "Embeddings generated and cached successfully", 
            "embedding_cache_file": os.path.join(PROJECT_ROOT, "Cache", f"{lecture_id}_embedding_cache.pkl"),
        }), 200

    except Exception as e:
        logging.error(f"An error occurred in /generate_embeddings: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/transcribe_audio', methods=['POST'])
@require_api_key
def transcribe_audio():
    """
    Transcribes audio file and generates transcript and summary.
    Returns:
        A JSON response containing the message, transcript URL, and summary URL.
    """
    pass
    logging.info(f"Request received with body: {request.json}")
    try:
        data = request.json
        file_url = data.get('download_url')
        model_name = data.get('model_name', 'base')
        subject = data.get('subject')
        unit = data.get('unit')
        lecture = data.get('lecture')

        base_dir = os.path.join("Transcript", subject, unit, lecture)
        audio_dir = os.path.join(base_dir, "audio")
        transcript_dir = os.path.join(base_dir, "transcripts")
        
        logging.info(f"Attempting to download file from {file_url}")

        os.makedirs(audio_dir, exist_ok=True)
        os.makedirs(transcript_dir, exist_ok=True)

        audio_file_path = download_file_from_url(file_url, audio_dir)
        
        transcriber = Transcriber(model_name=model_name)
        transcript = transcriber.transcribe_audio(audio_file_path)
        
        if transcript:
            logging.info(f"Transcript generated successfully.")
            # logging.info(f"Transcript (first 500 chars): {transcript[:500]}")

            transcript_file_name = os.path.splitext(os.path.basename(audio_file_path))[0] + ".txt"
            local_transcript_path = os.path.join(transcript_dir, transcript_file_name)
            with open(local_transcript_path, "w", encoding="utf-8") as transcript_file:
                transcript_file.write(transcript)
            logging.info(f"Transcript saved locally at {local_transcript_path}")

            summary = summarize_transcript(transcript, ollama_model)
            summary_file_name = "summary_" + transcript_file_name
            local_summary_path = os.path.join(transcript_dir, summary_file_name)
            with open(local_summary_path, "w", encoding="utf-8") as summary_file:
                summary_file.write(summary)
            logging.info(f"Summary saved locally at {local_summary_path}")

            firebase_storage_path = f"{subject}/{unit}/{lecture}/{transcript_file_name}"
            transcript_url = upload_transcript_to_storage(transcript, firebase_storage_path)

            summary_storage_path = f"{subject}/{unit}/{lecture}/{summary_file_name}"
            summary_url = upload_transcript_to_storage(summary, summary_storage_path)
            logging.info(f"Transcript uploaded. Public URL: {transcript_url}")
            logging.info(f"Summary uploaded. Public URL: {summary_url}")

            doc_ref = db.collection('subjects').document(subject)\
                        .collection('units').document(unit)\
                        .collection('lectures').document(lecture)

            doc_ref.update({
                'transcript_url': transcript_url,
                'summary_url': summary_url,
                'documentUrls': firestore.ArrayUnion([
                    {"name": "Transcript", "url": transcript_url},
                    {"name": "Summary", "url": summary_url}
                ])
            })
            
            logging.info(f"Firestore document updated successfully for lecture {lecture}")
            
            return jsonify({"message": "Transcription and summary successful", "transcript_url": transcript_url, "summary_url": summary_url}), 200
        else:
            logging.error("Transcription failed.")
            return jsonify({"error": "Transcription failed."}), 500
    
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/generate_quiz', methods=['POST'])
@require_api_key
def generate_quiz():
    """
    Generates a quiz based on the provided input data.
    Returns:
        If successful, returns a JSON response containing the generated quiz.
        If unsuccessful, returns a JSON response containing an error message.
    Raises:
        ValueError: If there is a value error in the input data.
        Exception: If there is an internal error during the quiz generation process.
    """
    try:
        data = request.json
        subject = data.get("subject_id")
        unit = data.get("unit_id")
        lecture_id = data.get("lecture_id")
        num_questions = int(data.get("num_questions", 10))
        
        if not all([subject, unit, lecture_id]):
            logging.error("Required fields 'subject', 'unit', and 'lecture_id' are missing.")
            return jsonify({"error": "Required fields 'subject', 'unit', and 'lecture_id' are missing."}), 400

        logging.info(f"Generating quiz for Lecture ID: {lecture_id}, Subject: {subject}, Unit: {unit}")
   
        documents = check_or_download_files(DATA_PATH, subject, unit, lecture_id)

        if not documents:
            logging.error(f"Failed to load documents for Lecture ID: {lecture_id}")
            return jsonify({"error": "No documents could be loaded"}), 500

        quiz = generate_quiz_using_llm(documents, ollama_model, num_questions)
        
        if quiz:
            logging.info(f"Quiz generated successfully for Lecture ID: {lecture_id}")
            return jsonify({"quiz": quiz}), 200
        else:
            logging.error("No quiz generated. Please check the input content or LLM output.")
            return jsonify({"error": "No quiz generated. Please check the input content or LLM output."}), 500

    except ValueError as e:
        logging.error(f"ValueError: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logging.error(f"Internal error: {e}")
        return jsonify({"error": "An internal error occurred"}), 500
    
@app.route('/generate_mcq_quiz', methods=['POST'])
@require_api_key
def generate_mcq_quiz():
    """
    Generates a multiple-choice quiz based on the provided input data.
    Returns:
        If successful, returns a JSON response containing the generated quiz.
        If an error occurs, returns a JSON response with an error message.
    Raises:
        ValueError: If there is a value error in the input data.
        Exception: If there is an internal error during the quiz generation process.
    """
    try:
        data = request.json
        subject = data.get("subject_id")
        unit = data.get("unit_id")
        lecture_id = data.get("lecture_id")
        num_questions = int(data.get("num_questions", 10))
        
        if not all([subject, unit, lecture_id]):
            logging.error("Required fields 'subject', 'unit', and 'lecture_id' are missing.")
            return jsonify({"error": "Required fields 'subject', 'unit', and 'lecture_id' are missing."}), 400

        logging.info(f"Generating quiz for Lecture ID: {lecture_id}, Subject: {subject}, Unit: {unit}")
        
        documents = check_or_download_files(DATA_PATH, subject, unit, lecture_id)
        
        mcq_quiz = generate_mcq_quiz_using_llm(documents, ollama_model, num_questions)
        if mcq_quiz:
            return jsonify({"mcq_quiz": mcq_quiz}), 200
        else:
            return jsonify({"error": "No quiz generated. Please check the input content or LLM output."}), 500
        
    except ValueError as e:
        logging.error(f"ValueError: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logging.error(f"Internal error: {e}")
        return jsonify({"error": "An internal error occurred"}), 500
    
@app.route('/chat', methods=['POST'])
@require_api_key
def chat():
    """
    Function to handle chat requests and generate responses.
    Returns:
        A JSON response containing the generated response, document sources, and processing time.
    Raises:
        FileNotFoundError: If there is an error loading embeddings.
        ValueError: If there is a value error.
        Exception: If there is an internal error.
    """
    start_time = time.time()

    if 'conversation_history' not in session:
        session['conversation_history'] = []
    
    data = request.json
    user_query = data.get("query")
    subject = data.get("subject_id")
    unit = data.get("unit_id")
    lecture_id = data.get("lecture_id")

    if not user_query or not lecture_id:
        logging.error("Both 'query' and 'lecture_id' are required.")
        return jsonify({"error": "Both 'query' and 'lecture_id' are required."}), 400

    logging.info(f"Received query: {user_query}, Lecture ID: {lecture_id}")

    try:
        embeddings, index, documents = load_embeddings(lecture_id, subject, unit, PROJECT_ROOT=PROJECT_ROOT)

        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        relevant_docs = retrieve_relevant_docs(user_query, index, documents, embedding_model)

        response, document_sources = generate_response(user_query, relevant_docs, session['conversation_history'], ollama_model)

        session['conversation_history'].append((user_query, response))

        end_time = time.time()
        logging.info(f"Document retrieval time: {end_time - start_time:.2f} seconds")
        logging.info(f"Referenced Documents: {', '.join(document_sources)}")

        return jsonify({
            "response": response,
            "document_sources": document_sources,
            "processing_time": f"{end_time - start_time:.2f} seconds"
        })

    except FileNotFoundError as e:
        logging.error(f"Error loading embeddings: {e}")
        return jsonify({"error": str(e)}), 500
    except ValueError as e:
        logging.error(f"ValueError: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logging.error(f"Internal error: {e}")
        return jsonify({"error": "An internal error occurred."}), 500
    
@app.route('/generate_lecture_schedule', methods=['POST'])
def generate_lecture_schedule():
    """
    Generates a lecture schedule based on the provided parameters.
    Returns:
        A JSON response containing the generated lecture schedule and a success message, or an error message if an exception occurs.
    Raises:
        Exception: If an error occurs during the generation of the lecture schedule.
    """
    try:
        data = request.json
        book_url = data.get("firebase_url") 
        start_date_str = data.get("start_date")
        end_date_str = data.get("end_date")
        hours_per_week = int(data.get("hours_per_week"))

        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')

        text = extract_text_from_books(book_url, DATA_PATH)

        num_days = (end_date - start_date).days
        lectures_per_week = hours_per_week // 1
        num_lectures = (num_days // 7) * lectures_per_week
        
        lecture_topics = generate_topics_using_llm(text, num_lectures, ollama_model)

        grouped_lectures = group_topics_into_lectures(lecture_topics, num_lectures)

        schedule = generate_schedule(start_date, end_date, num_lectures, grouped_lectures)
        
        # save_schedule_to_json(schedule, os.path.join(save_directory, "lecture_schedule.json"))

        return jsonify({"message": "Lecture schedule generated successfully", "schedule": schedule}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/create_assignment', methods=['POST'])
def create_assignment():
    """
    Creates an assignment based on the provided data.
    Returns:
        A JSON response containing the generated assignment.
    Raises:
        ValueError: If there is an error in the provided data.
        Exception: If there is an internal error during assignment creation.
    """
    try:
        data = request.json
        subject = data.get("subject_id")
        unit = data.get("unit_id")
        lecture_id = data.get("lecture_id")
        num_questions = int(data.get("num_questions", 10))  
        mcq_weightage = float(data.get("mcq_weightage", 0.4))  
        long_answer_weightage = float(data.get("long_answer_weightage", 0.3))  
        short_answer_weightage = float(data.get("short_answer_weightage", 0.3))  

        if not all([subject, unit, lecture_id]):
            logging.error("Missing required fields: 'subject', 'unit', or 'lecture_id'")
            return jsonify({"error": "Required fields 'subject', 'unit', and 'lecture_id' are missing."}), 400
        
        documents = check_or_download_files(DATA_PATH, subject, unit, lecture_id)
        # chunk_content = doc_chunking(documents)
       
        mcq_count = int(num_questions * mcq_weightage)
        long_answer_count = int(num_questions * long_answer_weightage)
        short_answer_count = num_questions - mcq_count - long_answer_count  
        
        mcq_questions = []
        mcq_questions = generate_mcq_quiz_using_llm (documents, ollama_model, mcq_count)

        long_answer_questions = []
        for i in range(long_answer_count):
            long_answer_question = generate_long_answer_question(ollama_model, i+1, documents)
            long_answer_questions.append(long_answer_question)

        short_answer_questions = []
        for i in range(short_answer_count):
            short_answer_question = generate_short_answer_question(ollama_model, i+1, documents)
            short_answer_questions.append(short_answer_question)
     
        assignment = {
            "mcq_questions": mcq_questions,
            "long_answer_questions": long_answer_questions,
            "short_answer_questions": short_answer_questions
        }

        return jsonify({"assignment": assignment}), 200

    except ValueError as e:
        logging.error(f"ValueError: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logging.error(f"Internal error: {e}")
        return jsonify({"error": "An internal error occurred"}), 500
    
# --------------------------------------------------------------- MAIN --------------------------------------------------------------- 

if __name__ == "__main__":  
    
    cleanup_data_thread = threading.Thread(target=schedule_cleanup, args=(DATA_PATH,), daemon=True)
    cleanup_cache_thread = threading.Thread(target=schedule_cleanup, args=(CACHE_PATH,), daemon=True)
    cleanup_data_thread.start()
    cleanup_cache_thread.start()
    
    app.run(debug=True, host='0.0.0.0', port=PORT)