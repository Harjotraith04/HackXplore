from langchain_ollama import OllamaLLM

model = OllamaLLM(model="llama3.1")

def load_transcript(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

def summarize_transcript(subject, file_path):
    transcript = load_transcript(file_path)
    prompt = f"""
    You are a helpful assistant that summarizes transcripts. Your name is HelpGuru. The transcript is from a lecture about {subject}.
    Here is the transcript:

    {transcript}

    Please provide a concise summary of this lecture with bullet points summarizing the key highlights.
    """
    
    result = model.invoke(input=prompt)
    return result

if __name__ == "__main__":
    subject = "Psychology" 
    transcript_file_path = "transcript.txt" 
    summary = summarize_transcript(subject, transcript_file_path)
    print("Lecture Summary:")
    print(summary)