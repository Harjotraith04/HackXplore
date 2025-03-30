#utils/quiz.py
from utils.helpers import chunk_content, doc_chunking

# --------------------------------------------------------------- Single Quiz  ---------------------------------------------------------------
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

def generate_quiz_using_llm(documents, ollama_model, num_questions=10):
    try:
        content_chunks = doc_chunking(documents)
        
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

# ---------------------------------------------------------------  MCQ Quiz --------------------------------------------------------------- 

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

def generate_mcq_quiz_using_llm(documents, ollama_model, num_questions=5):
    try:
        if not documents:
            raise ValueError("No documents loaded.")
        
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