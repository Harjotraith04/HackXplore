from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/hello_world')
def hello_world():
    # Access headers
    firebase_url = request.headers.get('firebase_url')
    subject = request.headers.get('subject')
    unit = request.headers.get('unit')
    lecture = request.headers.get('lecture')
    
    # Print headers for debugging
    print(f"Firebase URL: {firebase_url}")
    print(f"Subject: {subject}")
    print(f"Unit: {unit}")
    print(f"Lecture: {lecture}")
    
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8008)
