import os
import logging
import pickle
import faiss

from utils.embedding import *
from utils.helpers import *
from utils.firebase import *
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_ollama import OllamaLLM
from sentence_transformers import SentenceTransformer

# Load environment variables
load_dotenv()
STORAGE_BUCKET = os.getenv("STORAGE_BUCKET")
CREDENTIALS_PATH = os.getenv("CREDENTIALS_PATH")
PORT = os.getenv("PORT")
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.getenv("DATA_PATH", os.path.join(PROJECT_ROOT, "Docs"))
GURUCOOL_API_KEY = os.getenv("GURUCOOL_API_KEY")

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize the OllamaLLM (LLaMA 3.1)
ollama_model = OllamaLLM(model="llama3.1")

# Load the embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Helper function to create MCQ
def generate_mcq_question(llm, question_number, documents):
    prompt = (
        f"Generate exactly one multiple-choice question (MCQ) from the following content with 4 options."
        f" One of the options must be the correct answer. The format must be strictly followed."
        f" Do not include any meta commentary, explanations, or extra information."
        f" The output should only include the question, options, and the correct answer.\n\n"
        f"Question {question_number}: <Insert MCQ question>\n"
        f"A) <Insert option 1>\n"
        f"B) <Insert option 2>\n"
        f"C) <Insert option 3>\n"
        f"D) <Insert option 4>\n"
        f"Answer {question_number}: <Insert correct answer>\n\n"
        f"Content:\n{documents}"
    )
    response = llm.generate([prompt], clean_up_tokenization_spaces=True)
    return "".join(chunk.text for chunk in response.generations[0])

# Helper function to create long-answer question
def generate_long_answer_question(llm, question_number, documents):
    prompt = (
        f"Generate exactly one long-answer question from the following content. "
        f"The format must be strictly followed. Do not include any meta commentary, explanations, or extra information."
        f" The output should only include the question and the answer. "
        f"Keep the answer approximately 250-300 words.\n\n"
        f"Question {question_number}: <Insert long-answer question>\n"
        f"Answer {question_number}: <Insert sample long answer>\n\n"
        f"Content:\n{documents}"
    )
    response = llm.generate([prompt], clean_up_tokenization_spaces=True)
    return "".join(chunk.text for chunk in response.generations[0])

# Helper function to create short-answer question
def generate_short_answer_question(llm, question_number, documents):
    prompt = (
        f"Generate exactly one short-answer question from the following content. "
        f"The format must be strictly followed. Do not include any meta commentary, explanations, or extra information."
        f" The output should only include the question and the answer. "
        f"Keep the answer approximately 50-100 words.\n\n"
        f"Question {question_number}: <Insert short-answer question>\n"
        f"Answer {question_number}: <Insert sample short answer>\n\n"
        f"Content:\n{documents}"
    )
    response = llm.generate([prompt], clean_up_tokenization_spaces=True)
    return "".join(chunk.text for chunk in response.generations[0])

# Route to generate assignment
@app.route('/create_assignment', methods=['POST'])
def create_assignment():
    try:
        data = request.json
        subject = data.get("subject_id")
        unit = data.get("unit_id")
        lecture_id = data.get("lecture_id")
        num_questions = int(data.get("num_questions", 10))  # Total number of questions
        mcq_weightage = float(data.get("mcq_weightage", 0.4))  # Defaults to 40% MCQs
        long_answer_weightage = float(data.get("long_answer_weightage", 0.3))  # Defaults to 30% long answers
        short_answer_weightage = float(data.get("short_answer_weightage", 0.3))  # Defaults to 30% short answers

        if not all([subject, unit, lecture_id]):
            logging.error("Missing required fields: 'subject', 'unit', or 'lecture_id'")
            return jsonify({"error": "Required fields 'subject', 'unit', and 'lecture_id' are missing."}), 400
        
        lecture_dir = os.path.join(DATA_PATH, subject, unit, lecture_id)
        os.makedirs(lecture_dir, exist_ok=True)
        
        document_urls= fetch_document_urls_from_firestore(subject, unit, lecture_id)

        download_files(document_urls, lecture_dir)
        documents = load_documents(lecture_dir)
        embeddings, index, documents = generate_and_save_embeddings(subject, unit, lecture_id, documents, PROJECT_ROOT)


        # Calculate the number of each type of question
        mcq_count = int(num_questions * mcq_weightage)
        long_answer_count = int(num_questions * long_answer_weightage)
        short_answer_count = num_questions - mcq_count - long_answer_count  # Remaining questions

        # Generate MCQs
        mcq_questions = []
        for i in range(mcq_count):
            mcq_question = generate_mcq_question(ollama_model, i + 1, documents)
            mcq_questions.append(mcq_question)

        # Generate long-answer questions
        long_answer_questions = []
        for i in range(long_answer_count):
            long_answer_question = generate_long_answer_question(ollama_model, i + 1, documents)
            long_answer_questions.append(long_answer_question)

        # Generate short-answer questions
        short_answer_questions = []
        for i in range(short_answer_count):
            short_answer_question = generate_short_answer_question(ollama_model, i + 1, documents)
            short_answer_questions.append(short_answer_question)

        # Combine the generated questions into a structured assignment object
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

# Main Flask App Runner
if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    app.run(debug=True, host='0.0.0.0', port=8009)
