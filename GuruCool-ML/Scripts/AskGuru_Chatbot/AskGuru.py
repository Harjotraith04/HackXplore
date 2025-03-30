import os
import pickle
from langchain_ollama import OllamaLLM
from sentence_transformers import SentenceTransformer
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
EMBEDDING_CACHE_FILE = os.path.join(PROJECT_ROOT, "embedding_cache.pkl")

def load_embeddings():
    print(f"Loading embeddings from cache at: {EMBEDDING_CACHE_FILE}")
    if not os.path.exists(EMBEDDING_CACHE_FILE):
        raise FileNotFoundError(f"Embedding cache file not found at {EMBEDDING_CACHE_FILE}. Please generate embeddings first.")
    
    with open(EMBEDDING_CACHE_FILE, 'rb') as f:
        embeddings, index, documents = pickle.load(f)
    print("Embeddings, index, and documents loaded successfully.")
    
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
    except Exception as e:
        print(f"Error generating response: {e}")
        answer = "Sorry, I couldn't generate a response."
    
    document_sources = [doc.metadata.get("source") for doc in relevant_docs]
    return answer, document_sources

def chatbot():
    try:
        embeddings, index, documents = load_embeddings()
    except FileNotFoundError as e:
        print(e)
        return
    
    conversation_history = []
    
    while True:
        query = input("You: ")
        if query.lower() in ["exit", "quit"]:
            break
        
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        relevant_docs = retrieve_relevant_docs(query, index, documents, embedding_model)
        response, document_sources = generate_response(query, relevant_docs, conversation_history)
        
        print("Ask Guru:", response)
        print("Referenced Documents:", ", ".join(document_sources))
        
        conversation_history.append((query, response))

if __name__ == "__main__":
    chatbot()