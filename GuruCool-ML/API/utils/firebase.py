#utils/firebase.py
import os
import logging
import requests

import firebase_admin

from dotenv import load_dotenv
from firebase_admin import credentials, storage as firebase_storage, firestore

load_dotenv()
STORAGE_BUCKET = os.getenv("STORAGE_BUCKET")
CREDENTIALS_PATH = os.getenv("CREDENTIALS_PATH")

cred = credentials.Certificate(CREDENTIALS_PATH)
firebase_admin.initialize_app(cred, {
    'storageBucket': STORAGE_BUCKET  
})

db = firestore.client()
storage = firebase_storage.bucket()

def download_file_from_url(url, save_directory):
    try:
        logging.info(f"Attempting to download file from {url}")
        response = requests.get(url)
        response.raise_for_status()  
        file_name = os.path.basename(url.split('?')[0]) 
        logging.info(f"File name is - {file_name}")
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
    
def fetch_document_urls_from_firestore(subject, unit, lecture_id):
    """
    Fetches document URLs from Firestore based on subject, unit, and lecture ID.
    
    Args:
        subject (str): The subject of the lecture.
        unit (str): The unit of the lecture.
        lecture_id (str): The ID of the lecture.
        
    Returns:
        list: A list of document URLs (if found).
    """
    try:
        doc_ref = db.collection('subjects').document(subject)\
                     .collection('units').document(unit)\
                     .collection('lectures').document(lecture_id)
        
        doc = doc_ref.get()
        if doc.exists:
            document_data = doc.to_dict()
            document_urls = document_data.get('documentUrls', [])
            logging.info(f"Fetched document URLs for Lecture ID: {lecture_id}")
            return document_urls
        else:
            logging.error(f"No Firestore document found for Lecture ID: {lecture_id}")
            return []
    except Exception as e:
        logging.error(f"Error fetching document URLs from Firestore: {e}")
        return []
