#utils/transcribe.py
import sys
import logging
import whisper

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
        
def summarize_transcript(transcript, ollama_model):
    prompt = f"""
    Summarize the following lecture with bullet points highlighting the key points. Do not include any Meta Commentary.:

    {transcript}
    """
    
    result = ollama_model.invoke(input=prompt)
    return result