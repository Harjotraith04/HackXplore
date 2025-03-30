import os
import pickle
import time
import logging
from dotenv import load_dotenv
from flask import Flask, request, jsonify, session
from langchain_ollama import OllamaLLM
from sentence_transformers import SentenceTransformer
from flask_cors import CORS
import faiss
import warnings

load_dotenv()
warnings.filterwarnings("ignore", category=FutureWarning)

# ASKGURU_API_KEY = os.getenv("ASKGURU_API_KEY")

app = Flask(__name__)
CORS(app)
# app.secret_key = ASKGURU_API_KEY

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_embedding_cache_file(lecture_id):
    return os.path.join(PROJECT_ROOT, f"Cache/{lecture_id}_embedding_cache.pkl")

def load_embeddings(lecture_id):
    embedding_cache_file = get_embedding_cache_file(lecture_id)
    logging.info(f"Loading embeddings from cache at: {embedding_cache_file}")
    
    if not os.path.exists(embedding_cache_file):
        raise FileNotFoundError(f"Embedding cache file not found for lecture ID: {lecture_id}. Please generate embeddings first.")
    
    with open(embedding_cache_file, 'rb') as f:
        embeddings, index, documents = pickle.load(f)
    
    logging.info(f"Embeddings, index, and documents loaded successfully for lecture ID: {lecture_id}.")
    return embeddings, index, documents

def retrieve_relevant_docs(query, index, documents, embedding_model):
    query_embedding = embedding_model.encode([query], convert_to_tensor=False)
    _, indices = index.search(query_embedding, k=5)
    relevant_docs = [documents[i] for i in indices[0]] 
    return relevant_docs

def generate_response(query, relevant_docs, conversation_history):
    context = " ".join([f"Q: {q}\nA: {a}" for q, a in conversation_history])
    context += " " + " ".join([doc.page_content for doc in relevant_docs])
    
    prompt = (
        f"Answer the following question based on the provided context. If the answer is not explicitly available in the context, "
        f"you may still provide a general response, but specify that the information could not be found in the provided documents.\n\n"
        f"Question: {query}\n"
        f"Context: {context}\n"
        f"Answer:"
    )
    
    ollama_model = OllamaLLM(model="llama3.1")
    
    try:
        response = ollama_model.generate([prompt], clean_up_tokenization_spaces=True)
        answer = "".join(chunk.text for chunk in response.generations[0])
        logging.info(f"Ollama response generated successfully.")
    except Exception as e:
        logging.error(f"Error generating response: {e}")
        answer = "Sorry, I couldn't generate a response."
    
    document_sources = [doc.metadata.get("source") for doc in relevant_docs]
    return answer, document_sources

@app.route('/chat', methods=['POST'])
def chat():
    start_time = time.time()
    
    if 'conversation_history' not in session:
        session['conversation_history'] = []
    
    user_query = request.json.get("query")
    lecture_id = request.json.get("lecture_id")
    
    if not user_query or not lecture_id:
        logging.error("Both 'query' and 'lecture_id' are required.")
        return jsonify({"error": "Both 'query' and 'lecture_id' are required."}), 400
    
    logging.info(f"Received query: {user_query}, Lecture ID: {lecture_id}")
    
    try:
        embeddings, index, documents = load_embeddings(lecture_id)
    except FileNotFoundError as e:
        logging.error(f"Error loading embeddings: {e}")
        return jsonify({"error": str(e)}), 500
    
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

    retrieval_start_time = time.time()
    relevant_docs = retrieve_relevant_docs(user_query, index, documents, embedding_model)
    retrieval_end_time = time.time()
    
    response, document_sources = generate_response(user_query, relevant_docs, session['conversation_history'])

    session['conversation_history'].append((user_query, response))
    
    end_time = time.time()

    logging.info(f"Document retrieval time: {retrieval_end_time - retrieval_start_time:.2f} seconds")
    logging.info(f"Total processing time: {end_time - start_time:.2f} seconds")
    logging.info(f"Referenced Documents: {', '.join(document_sources)}")
    
    return jsonify({
        "response": response,
        "document_sources": document_sources,
        "processing_time": f"{end_time - start_time:.2f} seconds"
    })

@app.route('/reset', methods=['POST'])
def reset():
    session.pop('conversation_history', None)
    logging.info("Conversation history reset.")
    return jsonify({"message": "Conversation history reset."})

if __name__ == "__main__":  
    app.run(debug=True, host='0.0.0.0', port=8000)
