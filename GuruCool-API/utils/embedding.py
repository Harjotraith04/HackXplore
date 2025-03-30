#utils/embedding.py
import os
import logging
import time
import pickle
import faiss
import torch
from sentence_transformers import SentenceTransformer

from utils.firebase import *
from utils.helpers import *

if torch.cuda.is_available():
    device = torch.device("cuda")
    print("Using CUDA (GPU)")
elif torch.backends.mps.is_available():
    device = torch.device("mps")
    print("Using MPS (Apple Silicon GPU)")
else:
    device = torch.device("cpu")
    print("Using CPU")

def get_embedding_cache_file(lecture_id, PROJECT_ROOT):
    return os.path.join(PROJECT_ROOT, f"Cache/{lecture_id}_embedding_cache.pkl")

def generate_and_save_embeddings(subject, unit, lecture_id, document_urls, PROJECT_ROOT):
    
    lecture_dir = os.path.join(PROJECT_ROOT, "Docs", subject, unit, lecture_id)
    os.makedirs(lecture_dir, exist_ok=True)  
    cache_directory = os.path.join(PROJECT_ROOT, "Cache")
    os.makedirs(cache_directory, exist_ok=True)  
    
    embedding_cache_file = os.path.join(cache_directory, f"{lecture_id}_embedding_cache.pkl")
    logging.info(f"Checking for cached embeddings at: {embedding_cache_file}")
    
    if os.path.exists(embedding_cache_file):
        logging.info("Embeddings cache already exists. No need to regenerate.")
        with open(embedding_cache_file, 'rb') as f:
            embeddings, index, cached_documents = pickle.load(f)
        return embeddings, index, cached_documents

    logging.info("No cache file found. Generating embeddings...")
    start_time = time.time()
    
    download_files(document_urls, lecture_dir)
    documents = load_documents(lecture_dir)
    
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device=device)
    document_texts = [doc.page_content for doc in documents]

    embeddings = embedding_model.encode(document_texts, convert_to_tensor=False)
    embedding_dim = len(embeddings[0])
    index = faiss.IndexFlatL2(embedding_dim)
    index.add(embeddings)

    try:
        with open(embedding_cache_file, 'wb') as f:
            pickle.dump((embeddings, index, documents), f)
        logging.info(f"Embeddings, index, and documents cached successfully at {embedding_cache_file}.")
    except Exception as e:
        logging.error(f"Error saving embeddings to cache: {e}")
        raise

    end_time = time.time()
    logging.info(f"Embeddings generated and saved in {end_time - start_time:.2f} seconds")

    return embeddings, index, documents