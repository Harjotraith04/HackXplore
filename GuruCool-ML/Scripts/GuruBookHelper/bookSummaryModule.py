import PyPDF2
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaLLM
import os

def extract_text_from_pdf(pdf_path):
    print(f"Extracting text from PDF: {pdf_path}...")
    pdf_reader = PyPDF2.PdfReader(pdf_path)
    text = ""
    for page in range(len(pdf_reader.pages)):
        print(f"Extracting text from page {page + 1} of {len(pdf_reader.pages)}...")
        text += pdf_reader.pages[page].extract_text()
    print("Text extraction complete.")
    return text

def split_text_into_chunks(text, chunk_size=2000, chunk_overlap=100):
    print(f"Splitting text into chunks (chunk_size={chunk_size}, chunk_overlap={chunk_overlap})...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks = text_splitter.split_text(text)
    print(f"Text split into {len(chunks)} chunks.")
    return chunks

def summarize_text_chunks(chunks, model):
    print("Starting summarization of text chunks...")
    summaries = []
    for idx, chunk in enumerate(chunks):
        print(f"Summarizing chunk {idx + 1} of {len(chunks)}...")
        summary = model.invoke(f"Summarize the following text in a detailed but abstracted manner. Focus on the broader themes and key takeaways, without delving into too much technical detail: {chunk}")
        summaries.append(summary)
    print("Summarization of all chunks complete.")
    return summaries

def generate_comprehensive_summary(summaries, model):
    print("Combining all summaries into one comprehensive summary...")
    combined_summary = " ".join(summaries)
    final_summary = model.invoke(f"Based on the following section summaries, create a detailed but abstracted summary of the entire book. Focus on the broader themes and key concepts, and avoid excessive technical detail: {combined_summary}")
    print("Final comprehensive summary generated.")
    return final_summary

def ask_question_with_context(question, context, model):
    print(f"Asking the model the following question: {question}")
    prompt = f"Context: {context}\n\nQuestion: {question}\n\nAnswer the question based on the context."
    answer = model.invoke(prompt)
    print(f"Received answer: {answer}")
    return answer

def process_pdf_and_ask_questions(pdf_path):
    book_text = extract_text_from_pdf(pdf_path)
    chunks = split_text_into_chunks(book_text)
    
    model = OllamaLLM(model="llama3.1")

    summaries = summarize_text_chunks(chunks, model)
    comprehensive_summary = generate_comprehensive_summary(summaries, model)
    context = comprehensive_summary
    print(f"\nBook Summary:\n{comprehensive_summary}\n")
    
    while True:
        question = input("Ask a question (or type 'exit' to quit): ")
        if question.lower() == 'exit':
            print("Exiting the question-answer loop.")
            break
        answer = ask_question_with_context(question, context, model)
        print(f"Answer: {answer}")

        context += f"\n\nQuestion: {question}\nAnswer: {answer}"
        print("Context updated with the latest question and answer.")

if __name__ == "__main__":
    pdf_path = "GuruBookHelper\Docs\deep_learning_3_optimizers-1-2.pdf"
    process_pdf_and_ask_questions(pdf_path)
