#utils/askguru.py
from utils.embedding import *
from utils.helpers import *
import logging
import pickle
import os

def load_embeddings(lecture_id, subject, unit, PROJECT_ROOT=None):
    """
    Loads embeddings from cache if available; otherwise, generates them using the provided documents.
    
    Args:
        lecture_id (str): The ID of the lecture.
        subject (str): The subject of the lecture.
        unit (str): The unit of the lecture.
        PROJECT_ROOT (str): The root directory of the project.
    
    Returns:
        tuple: embeddings, index (FAISS index), and documents.
    """
    cache_directory = os.path.join(PROJECT_ROOT, "Cache")
    embedding_cache_file = os.path.join(cache_directory, f"{lecture_id}_embedding_cache.pkl")
    
    logging.info(f"Checking for cached embeddings at: {embedding_cache_file}")
    
    if os.path.exists(embedding_cache_file):
        logging.info(f"Embeddings found in cache for Lecture ID: {lecture_id}. Loading from cache...")
        try:
            with open(embedding_cache_file, 'rb') as f:
                embeddings, index, documents = pickle.load(f)
            return embeddings, index, documents
        except Exception as e:
            logging.error(f"Error loading embeddings from cache: {e}")
            raise
    else:
        logging.error(f"Embeddings not found in cache for Lecture ID: {lecture_id}.")
        raise FileNotFoundError(f"Embeddings not found for Lecture ID: {lecture_id}.")

def retrieve_relevant_docs(query, index, documents, embedding_model):
    """
    Retrieves relevant documents based on a given query.

    Args:
        query (str): The query string.
        index (Index): The index used for searching.
        documents (list): The list of documents.
        embedding_model (EmbeddingModel): The embedding model used for encoding the query.

    Returns:
        list: The list of relevant documents.
    """
    query_embedding = embedding_model.encode([query], convert_to_tensor=False)
    _, indices = index.search(query_embedding, k=5)
    relevant_docs = [documents[i] for i in indices[0]] 
    return relevant_docs

def generate_response(query, relevant_docs, conversation_history, ollama_model):
    """
    Generates a response to a given query based on the provided context and relevant documents.
    Args:
        query (str): The question/query to be answered.
        relevant_docs (list): A list of relevant documents.
        conversation_history (list): A list of tuples representing the conversation history.
    Returns:
        tuple: A tuple containing the generated answer and a list of document sources.
    Raises:
        Exception: If there is an error generating the response.
    """
    context = " ".join([f"Q: {q}\nA: {a}" for q, a in conversation_history])
    context += " " + " ".join([doc.page_content for doc in relevant_docs])
    
    prompt = (
        f"Answer the following question based on the provided context. If the answer is not explicitly available in the context, "
        f"you may still provide a general response, but specify that the information could not be found in the provided documents.\n\n"
        f"Question: {query}\n"
        f"Context: {context}\n"
        f"Answer:"
    )
    
    try:
        response = ollama_model.generate([prompt], clean_up_tokenization_spaces=True)
        answer = "".join(chunk.text for chunk in response.generations[0])
        logging.info(f"Ollama response generated successfully.")
    except Exception as e:
        logging.error(f"Error generating response: {e}")
        answer = "Sorry, I couldn't generate a response."
    
    document_sources = [doc.metadata.get("source") for doc in relevant_docs]
    return answer, document_sources