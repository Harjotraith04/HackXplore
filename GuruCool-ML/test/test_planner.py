import requests
import json

def test_generate_lecture_schedule():
    url = "http://localhost:8008/generate_lecture_schedule"
    payload = {
        "firebase_url": "https://firebasestorage.googleapis.com/v0/b/gurucool-ae1ce.appspot.com/o/pdfs%2FModule_1_cloud_computing_reference_model.pdf?alt=media&token=4dcc4a33-2ffb-47bb-b760-7e34feba60ee",
        "start_date": "2024-01-10",
        "end_date": "2024-05-10",
        "hours_per_week": 2
    }
    headers = {'Content-Type': 'application/json'}

    print("Sending test request to /generate_lecture_schedule...")

    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        if response.status_code == 200:
            print("Test successful! Schedule generated:")
            print(json.dumps(response.json(), indent=4))
        else:
            print(f"Test failed with status code {response.status_code}: {response.json()}")
    except Exception as e:
        print(f"Error during the test request: {e}")
        
if __name__ == "__main__":
    test_generate_lecture_schedule()