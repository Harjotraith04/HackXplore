import requests
import json
from dotenv import load_dotenv
import os

load_dotenv()
GURUCOOL_API_KEY = os.getenv("GURUCOOL_API_KEY")

url = "http://localhost:8008/create_assignment"


payload = {
    "subject_id": "6d67QmkzhQOqaXgvN91m",
    "unit_id": "lMOzA7bviGhe4LouvdmH",
    "lecture_id": "WjsR2iHxjE5OAF7waRUJ",
    "num_questions": 5,
    "mcq_weightage": 0.4,   
    "long_answer_weightage": 0.3,
    "short_answer_weightage": 0.3
}

API_KEY = GURUCOOL_API_KEY


headers = {
    'Content-Type': 'application/json',
    'GuruCool-API-Key': API_KEY  
}


response = requests.post(url, data=json.dumps(payload), headers=headers)

if response.status_code == 200:
    print("Assignment created successfully!")
    print("Response:", response.json())
else:
    print(f"Failed to create assignment. Status code: {response.status_code}")
    print("Error:", response.json())
