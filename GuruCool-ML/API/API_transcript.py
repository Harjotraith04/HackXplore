import os
import requests
import whisper
import sys
import warnings
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, storage as firebase_storage, firestore
from flask_cors import CORS
import logging
from langchain_ollama import OllamaLLM

load_dotenv()
STORAGE_BUCKET = os.getenv("STORAGE_BUCKET")
CREDENTIALS_PATH = os.getenv("CREDENTIALS_PATH")

warnings.filterwarnings("ignore", category=FutureWarning, module="whisper")
warnings.filterwarnings("ignore", category=UserWarning, module="whisper")

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)

cred = credentials.Certificate(CREDENTIALS_PATH)
firebase_admin.initialize_app(cred, {
    'storageBucket': STORAGE_BUCKET  
})

db = firestore.client()
storage = firebase_storage.bucket()

ollama_model = OllamaLLM(model="llama3.1")

class Transcriber:
    def __init__(self, model_name):
        try:
            self.model = whisper.load_model(model_name)
            logging.info(f"Model '{model_name}' loaded successfully.")
        except Exception as e:
            logging.error(f"Failed to load model: {e}")
            sys.exit(1)

    def transcribe_audio(self, audio_file):
        try:
            logging.info(f"Transcribing {audio_file}...")
            result = self.model.transcribe(audio_file)
            transcript = result['text']
            if transcript:
                logging.info(f"Transcription successful: {len(transcript)} characters")
            else:
                logging.error("Transcription returned None or empty result.")
            return transcript
        except Exception as e:
            logging.error(f"Error during transcription: {e}")
            return None

def download_file_from_url(url, save_directory):
    try:
        logging.info(f"Attempting to download file from {url}")
        response = requests.get(url)
        response.raise_for_status()  
        file_name = os.path.basename(url.split('?')[0]) 
        file_path = os.path.join(save_directory, file_name)
 
        with open(file_path, "wb") as file:
            file.write(response.content)
        
        logging.info(f"File downloaded successfully and saved to {file_path}")
        return file_path
    except Exception as e:
        logging.error(f"Error downloading file: {e}")
        raise

def upload_transcript_to_storage(transcript_text, firebase_storage_path):
    try:
        logging.info(f"Uploading transcript to Firebase Storage at {firebase_storage_path}")
        blob = storage.blob(firebase_storage_path)
        blob.upload_from_string(transcript_text.encode('utf-8'), content_type='text/plain')
        
        blob.make_public()
        public_url = blob.public_url
        logging.info(f"Transcript uploaded successfully. Public URL: {public_url}")
        return public_url
    except Exception as e:
        logging.error(f"Error uploading transcript to Firebase Storage: {e}")
        raise

def summarize_transcript(subject, transcript):
    prompt = f"""
    You are a helpful assistant that summarizes transcripts. Your name is HelpGuru. The transcript is from a lecture about {subject}.
    Here is the transcript:

    {transcript}

    Please provide a concise summary of this lecture with bullet points summarizing the key highlights.
    """
    
    result = ollama_model.invoke(input=prompt)
    return result

@app.route('/transcribe_audio', methods=['POST'])
def transcribe_audio():
    try:
        firebase_url = request.headers.get('firebase_url')
        if not firebase_url:
            logging.error("Firebase URL header is missing.")
            return jsonify({"error": "Firebase URL header is required"}), 400
        
        model_name = request.headers.get('model_name', 'base')
        subject = request.headers.get('subject')
        unit = request.headers.get('unit')
        lecture = request.headers.get('lecture')
        
        if not all([subject, unit, lecture]):
            logging.error("Required headers (subject, unit, lecture) are missing.")
            return jsonify({"error": "subject, unit, and lecture headers are required"}), 400

        base_dir = os.path.join("Transcript", subject, unit, lecture)
        audio_dir = os.path.join(base_dir, "audio")
        transcript_dir = os.path.join(base_dir, "transcripts")
        
        os.makedirs(audio_dir, exist_ok=True)
        os.makedirs(transcript_dir, exist_ok=True)

        audio_file_path = download_file_from_url(firebase_url, audio_dir)
        
        transcriber = Transcriber(model_name=model_name)
        transcript = transcriber.transcribe_audio(audio_file_path)
        
        if transcript:
            logging.info(f"Transcript generated successfully.")
            logging.info(f"Transcript (first 500 chars): {transcript[:500]}")

            transcript_file_name = os.path.splitext(os.path.basename(audio_file_path))[0] + ".txt"
            local_transcript_path = os.path.join(transcript_dir, transcript_file_name)
            with open(local_transcript_path, "w", encoding="utf-8") as transcript_file:
                transcript_file.write(transcript)
            logging.info(f"Transcript saved locally at {local_transcript_path}")

            summary = summarize_transcript(subject, transcript)
            summary_file_name = "summary_" + transcript_file_name
            local_summary_path = os.path.join(transcript_dir, summary_file_name)
            with open(local_summary_path, "w", encoding="utf-8") as summary_file:
                summary_file.write(summary)
            logging.info(f"Summary saved locally at {local_summary_path}")

            firebase_storage_path = f"{subject}/{unit}/{lecture}/{transcript_file_name}"
            transcript_url = upload_transcript_to_storage(transcript, firebase_storage_path)

            summary_storage_path = f"{subject}/{unit}/{lecture}/{summary_file_name}"
            summary_url = upload_transcript_to_storage(summary, summary_storage_path)
            logging.info(f"Transcript uploaded. Public URL: {transcript_url}")
            logging.info(f"Summary uploaded. Public URL: {summary_url}")
            
            logging.info(f"Storing transcript and summary URLs in Firestore under subjects/{subject}/units/{unit}/lectures/{lecture}")
            doc_ref = db.collection('subjects').document(subject)\
                        .collection('units').document(unit)\
                        .collection('lectures').document(lecture)
            doc_ref.set({
                'subject': subject,
                'unit': unit,
                'lecture': lecture,
                'transcript_url': transcript_url,
                'summary_url': summary_url,
                'firebase_storage_path': firebase_storage_path,
                'summary_storage_path': summary_storage_path,
                'transcription_status': 'completed'
            })
            logging.info(f"Firestore document created/updated successfully for lecture {lecture}")
            
            return jsonify({"message": "Transcription and summary successful", "transcript_url": transcript_url, "summary_url": summary_url}), 200
        else:
            logging.error("Transcription failed.")
            return jsonify({"error": "Transcription failed."}), 500
    
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=8000)