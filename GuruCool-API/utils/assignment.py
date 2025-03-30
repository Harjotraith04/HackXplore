from utils.helpers import *
import re
import logging

def parse_question_and_answer(response_text):
    question_pattern = r"(?i)question\s*\d*:\s*(.*)"
    answer_pattern = r"(?i)answer\s*\d*:\s*(.*)"

    question_match = re.search(question_pattern, response_text)
    answer_match = re.search(answer_pattern, response_text)

    if question_match:
        question = question_match.group(1).strip()
    else:
        logging.error("No question found in the response.")
        question = ""

    if answer_match:
        answer = answer_match.group(1).strip()
    else:
        logging.error("No answer found in the response.")
        answer = ""

    return {
        "question": question,
        "answer": answer
    }

def generate_long_answer_question(llm, question_number, documents):
    content_chunks = doc_chunking(documents)
    
    prompt = (
        f"Using the content below, generate exactly one long-answer question with its corresponding answer. "
        f"Make sure to provide both the question and the answer, strictly following this format:\n\n"
        f"Question {question_number}: <Insert long-answer question>\n"
        f"Answer {question_number}: <Insert sample long answer>\n\n"
        f"Do not include any meta commentary, explanations, or extra information. Only provide the question and the answer.\n\n"
        f"Content:\n{content_chunks}"
    )
    
    response = llm.generate([prompt], clean_up_tokenization_spaces=True)

    if isinstance(response.generations, list) and len(response.generations) > 0:
        generated_text = "".join([chunk.text for chunk in response.generations[0]])
    else:
        logging.error("Unexpected response format from LLM.")
        raise ValueError("Unexpected response format from LLM.")
    
    parsed_long_answer = parse_question_and_answer(generated_text)
    return parsed_long_answer

def generate_short_answer_question(llm, question_number, documents):
    content_chunks = doc_chunking(documents)

    prompt = (
        f"Generate exactly one short-answer question from the following content. "
        f"The output should strictly follow this format:\n\n"
        f"Question {question_number}: <Insert short-answer question>\n"
        f"Answer: <Insert sample short answer>\n\n"
        f"Content:\n{content_chunks}"
    )
    
    response = llm.generate([prompt], clean_up_tokenization_spaces=True)

    if isinstance(response.generations, list) and len(response.generations) > 0:
        generated_text = "".join([chunk.text for chunk in response.generations[0]])
    else:
        logging.error("Unexpected response format from LLM.")
        raise ValueError("Unexpected response format from LLM.")
    
    parsed_short_answer = parse_question_and_answer(generated_text)
    return parsed_short_answer
