import os
import pickle
import json
from langchain_ollama import OllamaLLM
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
EMBEDDING_CACHE_FILE = os.path.join(PROJECT_ROOT, "embedding_cache.pkl")

def load_embeddings_and_documents():
    try:
        print(f"Loading embeddings from cache at: {EMBEDDING_CACHE_FILE}")
        if not os.path.exists(EMBEDDING_CACHE_FILE):
            raise FileNotFoundError(f"Embedding cache file not found at {EMBEDDING_CACHE_FILE}. Please generate embeddings first.")
        
        with open(EMBEDDING_CACHE_FILE, 'rb') as f:
            embeddings, index, documents = pickle.load(f)
        print("Embeddings, index, and documents loaded successfully.")
        return documents
    except Exception as e:
        print(f"Error loading embeddings and documents: {e}")
        return []

def chunk_content(content, chunk_size=1000):
    return [content[i:i+chunk_size] for i in range(0, len(content), chunk_size)]

def generate_single_question(llm, content_chunk, question_number):
    prompt = (
        f"Using the content below, generate exactly one quiz question with an answer. "
        "Do NOT include any explanations, summaries, or extra information. "
        "The output must strictly follow this format:\n\n"
        f"Question {question_number}: <Insert question>\n"
        f"Answer {question_number}: <Insert answer>\n\n"
        "Make sure that there is nothing in the output other than the question and answer.\n\n"
        f"Content:\n{content_chunk}"
    )
    
    response = llm.generate([prompt], clean_up_tokenization_spaces=True)
    quiz_text = "".join(chunk.text for chunk in response.generations[0])
    
    return quiz_text

def generate_quiz_using_llm(documents, num_questions=5):
    try:
        if not documents:
            raise ValueError("No documents loaded.")
        
        ollama_model = OllamaLLM(model="llama3.1")
        
        combined_content = "\n\n".join(doc.page_content for doc in documents)
        content_chunks = chunk_content(combined_content)
        
        quiz = {}
        
        for i in range(min(num_questions, len(content_chunks))):
            quiz_text = generate_single_question(ollama_model, content_chunks[i], i+1)
            quiz.update(extract_questions_from_response(quiz_text))
        
        return quiz
    
    except Exception as e:
        print(f"Error generating quiz: {e}")
        return {}

def extract_questions_from_response(response_text):
    quiz = {}
    current_question = None
    current_answer = None
    
    lines = response_text.splitlines()
    
    for line in lines:
        line = line.strip()
        if line.lower().startswith("question"):
            if current_question and current_answer:
                quiz[current_question] = current_answer
            current_question = line.split(":")[1].strip()
            current_answer = None
        elif line.lower().startswith("answer"):
            current_answer = line.split(":")[1].strip()
    
    if current_question and current_answer:
        quiz[current_question] = current_answer
    
    return quiz

def generate_quiz(num_questions=5):
    documents = load_embeddings_and_documents()
    
    if not documents:
        print("No documents available to generate quiz.")
        return
    
    quiz = generate_quiz_using_llm(documents, num_questions)
    
    if quiz:
        print(json.dumps(quiz, indent=4))
    else:
        print("No quiz generated. Please check the input content or LLM output.")

if __name__ == "__main__":
    try:
        num_questions = int(input("Enter the number of quiz questions to generate: "))
        generate_quiz(num_questions)
    except ValueError:
        print("Invalid input. Please enter a valid number.")