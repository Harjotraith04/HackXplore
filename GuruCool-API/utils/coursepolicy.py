#utils/coursepolicy.py
import holidays
import json
from datetime import timedelta 
import os
import random

def inject_review_and_exploration(topics, num_lectures):
    review_topics = ["Review or assignment session", "Deeper exploration of earlier topics"]
    review_positions = random.sample(range(1, num_lectures), k=(num_lectures // 5))  

    for pos in sorted(review_positions, reverse=True):
        topics.insert(pos, random.choice(review_topics))

    while len(topics) < num_lectures:
        topics.append(random.choice(review_topics))

    return topics[:num_lectures]

def generate_topics_using_llm(text, num_lectures, model):
    """
    Generates lecture topics using a large language model based on the provided book text.

    Args:
        text (str): The full extracted text from the book.
        num_lectures (int): The number of lectures to divide topics into.
        model (OllamaLLM): The language model used for generating topics.

    Returns:
        list: A list of topics to be used in the lectures.
    """
    prompt = (
        f"Your task is to generate specific and detailed lecture topics based on the structure of the provided book. "
        f"Extract major sections, subsections, key concepts, methods, and case studies that can fill multiple lectures. "
        f"Here is the reference text: \n\n{text}"
    )

    response = model.invoke(prompt)
    topics = [topic.strip() for topic in response.split("\n") if topic.strip()]

    if len(topics) > num_lectures:
        topics = topics[:num_lectures]
    else:
        topics = inject_review_and_exploration(topics, num_lectures)

    refined_topics = refine_topics_in_bulk(topics, model)
    refined_topics = ensure_topic_count(refined_topics, num_lectures)

    return refined_topics

def refine_topics_in_bulk(topics, model):
    topics_text = "\n".join(topics)
    prompt = (
        f"Refine the following lecture topics and remove any meta-commentary, introductions, or filler content. "
        f"Here are the topics: \n\n{topics_text}"
    )
    refined_response = model.invoke(prompt)
    return [topic.strip() for topic in refined_response.split("\n") if topic.strip()]

def ensure_topic_count(topics, num_lectures):
    while len(topics) < num_lectures:
        topics.append("Review or assignment session")
    return topics[:num_lectures]

def group_topics_into_lectures(topics, num_lectures):
    topics_per_lecture = max(2, len(topics) // num_lectures)
    grouped_lectures = [topics[i:i + topics_per_lecture] for i in range(0, len(topics), topics_per_lecture)]

    while len(grouped_lectures) > num_lectures:
        grouped_lectures[-2].extend(grouped_lectures.pop())

    while len(grouped_lectures) < num_lectures:
        grouped_lectures.append(["Review or assignment session"])

    return grouped_lectures

def generate_schedule(start_date, end_date, num_lectures, lecture_topics_grouped):
    india_holidays = holidays.India(years=start_date.year)
    current_date = start_date
    schedule = []
    lecture_count = 0

    while current_date <= end_date and lecture_count < num_lectures:
        if current_date.weekday() < 6 and current_date not in india_holidays:
            schedule.append({
                "date": current_date.strftime('%Y-%m-%d'),
                "topics": lecture_topics_grouped[lecture_count]
            })
            lecture_count += 1
        current_date += timedelta(days=1)

    return schedule

def save_schedule_to_json(schedule, filename="GuruCoursePlanner/lecture_schedule.json"):
    """
    Save the generated schedule as a JSON file.
    
    Args:
        schedule (list): The list of lecture dates and topics.
        filename (str): The filename where the schedule should be saved.
    """
    directory = os.path.dirname(filename)
    if not os.path.exists(directory):
        os.makedirs(directory)
    with open(filename, "w") as json_file:
        json.dump(schedule, json_file, indent=4)
    print(f"Lecture schedule saved to {filename}")
