import PyPDF2
import random
import os
from datetime import datetime, timedelta
import holidays
import json
from langchain_ollama import OllamaLLM

def save_schedule_to_json(schedule, filename="lecture_schedule.json"):
    directory = os.path.dirname(filename)
    if not os.path.exists(directory):
        os.makedirs(directory)
    with open(filename, "w") as json_file:
        json.dump(schedule, json_file, indent=4)
    print(f"Lecture schedule saved to {filename}")

def extract_text_from_books(book_paths):
    full_text = ""
    for book_path in book_paths:
        print(f"Extracting text from book: {book_path}")
        pdf_reader = PyPDF2.PdfReader(book_path)
        for page_num in range(len(pdf_reader.pages)):
            page_text = pdf_reader.pages[page_num].extract_text()
            full_text += page_text + "\n\n"
    print("Text extraction from books complete.")
    return full_text

def inject_review_and_exploration(topics, num_lectures):
    print("Injecting review and exploration sessions...")
    review_topics = ["Review or assignment session", "Deeper exploration of earlier topics"]
    review_positions = random.sample(range(1, num_lectures), k=(num_lectures // 5))  

    for pos in sorted(review_positions, reverse=True): 
        topics.insert(pos, random.choice(review_topics))

    while len(topics) < num_lectures:
        topics.append(random.choice(review_topics))

    print(f"Finished injecting review/exploration. Total topics: {len(topics)}")
    return topics[:num_lectures]

def generate_topics_using_llm(text, num_lectures, model):
    print(f"Generating topics for {num_lectures} lectures using LLM...")

    prompt = (
        f"Your task is to generate specific and detailed lecture topics based on the structure of the provided book. "
        f"First, extract the major sections and subsections from the table of contents or index of the book. "
        f"Then, for each section, perform a deeper analysis to extract key concepts, methods, tools, and case studies that can fill multiple lectures. "
        f"Ensure that the lecture topics are detailed enough to span the full duration of the course, with distinct, granular topics that cover the material thoroughly. "
        f"Consider any chapters, subheadings, or detailed sections available to provide enough depth for the number of lectures needed. "
        f"Here is the reference text: \n\n{text}"
    )

    response = model.invoke(prompt)
    topics = [topic.strip() for topic in response.split("\n") if topic.strip()]

    print(f"LLM generated {len(topics)} topics.")
    
    if len(topics) > num_lectures:
        print(f"LLM generated more topics than required. Truncating to {num_lectures} topics.")
        topics = topics[:num_lectures]
    else:
        topics = inject_review_and_exploration(topics, num_lectures)

    refined_topics = refine_topics_in_bulk(topics, model)

    refined_topics = ensure_topic_count(refined_topics, num_lectures)

    return refined_topics

def refine_topics_in_bulk(topics, model):
    print("Refining all topics to remove meta-commentary...")

    topics_text = "\n".join(topics)
    prompt = (
        f"Please refine the following lecture topics and remove any meta-commentary, introductions, or filler content. "
        f"Make sure to only include the key points relevant to teaching these topics. Here are the topics: \n\n{topics_text}"
    )

    refined_response = model.invoke(prompt)
    refined_topics = [topic.strip() for topic in refined_response.split("\n") if topic.strip()]

    print(f"Finished refining topics. Total refined topics: {len(refined_topics)}")
    return refined_topics

def ensure_topic_count(topics, num_lectures):
    print(f"Ensuring the number of topics matches the number of lectures ({num_lectures})...")
    
    if len(topics) < num_lectures:
        print(f"Generated fewer topics ({len(topics)}). Padding with review sessions.")
        while len(topics) < num_lectures:
            topics.append("Review or assignment session")
    elif len(topics) > num_lectures:
        print(f"Generated more topics ({len(topics)}). Truncating to {num_lectures}.")
        topics = topics[:num_lectures]
    
    print(f"Final number of topics: {len(topics)}")
    return topics

def group_topics_into_lectures(topics, num_lectures):
    print("Grouping topics into lectures...")

    topics_per_lecture = max(2, len(topics) // num_lectures)

    grouped_lectures = []
    for i in range(0, len(topics), topics_per_lecture):
        lecture_topics = topics[i:i + topics_per_lecture]
        grouped_lectures.append(lecture_topics)

    while len(grouped_lectures) > num_lectures:
        grouped_lectures[-2].extend(grouped_lectures.pop()) 
    
    while len(grouped_lectures) < num_lectures:
        grouped_lectures.append(["Review or assignment session"])

    print(f"Total lectures after grouping: {len(grouped_lectures)}")
    return grouped_lectures

def generate_schedule(start_date, end_date, num_lectures, lecture_topics_grouped):
    print("Generating lecture schedule...")
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

    print(f"Lecture schedule generated with {len(schedule)} entries.")
    return schedule

def print_lecture_schedule(schedule):
    print("\nFinal Lecture Schedule:")
    for idx, entry in enumerate(schedule):
        print(f"Lecture {idx + 1}: {entry['date']}")
        for topic in entry['topics']:
            print(f"  - {topic}")

def generate_lecture_schedule(book_paths, start_date, end_date, hours_per_week):
    text = extract_text_from_books(book_paths)

    num_days = (end_date - start_date).days
    lectures_per_week = hours_per_week // 1  
    num_lectures = (num_days // 7) * lectures_per_week  

    print("Loading the LLaMA model (llama3.1)...")
    model = OllamaLLM(model="llama3.1")
    
    lecture_topics = generate_topics_using_llm(text, num_lectures, model)
    
    grouped_lectures = group_topics_into_lectures(lecture_topics, num_lectures)

    schedule = generate_schedule(start_date, end_date, num_lectures, grouped_lectures)
    print_lecture_schedule(schedule)

    save_schedule_to_json(schedule, "GuruCoursePlanner/lecture_schedule.json")

    return schedule

if __name__ == "__main__":
    book_paths = ["GuruCoursePlanner/Docs/Book 3 - practical-cyber-forensics-an-incident-based-approach-to-forensic-investigations-978-1-4842-4460-9_compress (1).pdf"]
    start_date = datetime(2024, 1, 10)  
    end_date = datetime(2024, 5, 10)    
    hours_per_week = int(input("Enter the number of lecture hours per week: "))  

    generate_lecture_schedule(book_paths, start_date, end_date, hours_per_week)