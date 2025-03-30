import os
import pickle
import random
from flask import Flask, request, jsonify
from langchain_ollama import OllamaLLM
import warnings
import requests
import json
warnings.filterwarnings("ignore", category=FutureWarning)
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

def get_embedding_cache_file(lecture_id):
    return os.path.join(PROJECT_ROOT, f"Cache/{lecture_id}_embedding_cache.pkl")

def load_embeddings_and_documents(lecture_id):
    try:
        embedding_cache_file = get_embedding_cache_file(lecture_id)
        print(f"Loading embeddings from cache at: {embedding_cache_file}")
        
        if not os.path.exists(embedding_cache_file):
            raise FileNotFoundError(f"Embedding cache file not found at {embedding_cache_file}. Please generate embeddings first.")
        
        with open(embedding_cache_file, 'rb') as f:
            embeddings, index, documents = pickle.load(f)
        
        print("Embeddings, index, and documents loaded successfully.")
        return documents
    except Exception as e:
        print(f"Error loading embeddings and documents: {e}")
        return []

def chunk_content(content, chunk_size=1000):
    return [content[i:i+chunk_size] for i in range(0, len(content), chunk_size)]

def generate_single_mcq(llm, content_chunk, question_number):
    prompt = (
        f"Using the content below, generate exactly one multiple-choice quiz question with 4 options. "
        "One of the options must be the correct answer. The output must strictly follow this format:\n\n"
        f"Question {question_number}: <Insert question>\n"
        f"A) <Insert option 1>\n"
        f"B) <Insert option 2>\n"
        f"C) <Insert option 3>\n"
        f"D) <Insert option 4>\n"
        f"Answer {question_number}: <Insert correct answer>\n\n"
        f"Content:\n{content_chunk}"
    )
    
    response = llm.generate([prompt], clean_up_tokenization_spaces=True)
    mcq_text = "".join(chunk.text for chunk in response.generations[0])
    
    return mcq_text

def generate_mcq_quiz_using_llm(documents, num_questions=5):
    try:
        if not documents:
            raise ValueError("No documents loaded.")
        
        ollama_model = OllamaLLM(model="llama3.1")
        
        combined_content = "\n\n".join(doc.page_content for doc in documents)
        content_chunks = chunk_content(combined_content)
        
        mcq_quiz = {}
        
        for i in range(min(num_questions, len(content_chunks))):
            mcq_text = generate_single_mcq(ollama_model, content_chunks[i], i+1)
            mcq_quiz.update(extract_mcq_from_response(mcq_text))
        
        return mcq_quiz
    
    except Exception as e:
        print(f"Error generating MCQ quiz: {e}")
        return {}

def extract_mcq_from_response(response_text):
    mcq = {}
    current_question = None
    current_options = []
    current_answer = None
    
    lines = response_text.splitlines()
    
    for line in lines:
        line = line.strip()
        if line.lower().startswith("question"):
            if current_question and current_options and current_answer:
                mcq[current_question] = {
                    "options": current_options,
                    "answer": current_answer
                }
            current_question = line.split(":")[1].strip()
            current_options = []
            current_answer = None
        elif line.lower().startswith("a)"):
            current_options.append(line)
        elif line.lower().startswith("b)"):
            current_options.append(line)
        elif line.lower().startswith("c)"):
            current_options.append(line)
        elif line.lower().startswith("d)"):
            current_options.append(line)
        elif line.lower().startswith("answer"):
            current_answer = line.split(":")[1].strip()
    
    if current_question and current_options and current_answer:
        mcq[current_question] = {
            "options": current_options,
            "answer": current_answer
        }
    
    return mcq

@app.route('/generate_mcq_quiz', methods=['POST'])
def generate_mcq_quiz():
    try:
        data = request.json
        lecture_id = data.get("lecture_id")
        num_questions = int(data.get("num_questions", 5))
        
        if not lecture_id:
            return jsonify({"error": "lecture_id is required"}), 400

        documents = load_embeddings_and_documents(lecture_id)
        
        if not documents:
            return jsonify({"error": "No documents found for the given lecture_id"}), 404
        
        mcq_quiz = generate_mcq_quiz_using_llm(documents, num_questions)
        
        if mcq_quiz:
            return jsonify({"mcq_quiz": mcq_quiz}), 200
        else:
            return jsonify({"error": "No quiz generated. Please check the input content or LLM output."}), 500
    
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

# Test function to send POST request and print result
def test_generate_mcq_quiz():
    url = "http://localhost:8008/generate_mcq_quiz"
    payload = {
        "lecture_id": "hiuyMlu4SgNENsWS3bW0",  # Sample lecture_id, adjust based on real lecture_id
        "num_questions": 5
    }
    
    try:
        headers = {
            'Content-Type': 'application/json'
        }
        
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        
        if response.status_code == 200:
            print("Quiz generated successfully!")
            print("MCQ Quiz:\n", json.dumps(response.json(), indent=4))
        elif response.status_code == 404:
            print("Error: No documents found for the given lecture_id.")
        else:
            print(f"Error: {response.json()['error']}")
    
    except Exception as e:
        print(f"Error during the request: {e}")

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=8008)