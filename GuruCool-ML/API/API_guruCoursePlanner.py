from flask import Flask, request, jsonify
from API.utils.coursePolicy import *
from langchain_ollama import OllamaLLM
from datetime import datetime

app = Flask(__name__)

@app.route('/generate_lecture_schedule', methods=['POST'])
def generate_lecture_schedule():
    try:
        data = request.json
        book_url = data.get("firebase_url") 
        start_date_str = data.get("start_date")
        end_date_str = data.get("end_date")
        hours_per_week = int(data.get("hours_per_week"))

        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')

        text = extract_text_from_books(book_url)

        num_days = (end_date - start_date).days
        lectures_per_week = hours_per_week // 1
        num_lectures = (num_days // 7) * lectures_per_week

        print("Loading the LLaMA model...")
        model = OllamaLLM(model="llama3.1")
        lecture_topics = generate_topics_using_llm(text, num_lectures, model)

        grouped_lectures = group_topics_into_lectures(lecture_topics, num_lectures)

        schedule = generate_schedule(start_date, end_date, num_lectures, grouped_lectures)
        save_schedule_to_json(schedule)

        return jsonify({"message": "Lecture schedule generated successfully", "schedule": schedule}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=8008)