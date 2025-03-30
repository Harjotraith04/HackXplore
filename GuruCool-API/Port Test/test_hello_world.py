import requests

url = 'http://192.168.29.240:8000/hello_world'

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response Content: {response.text}")
except requests.exceptions.ConnectionError as e:
    print(f"Connection failed: {e}")
