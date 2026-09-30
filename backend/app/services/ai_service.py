import json
import re
import random
from typing import List, Dict, Any, Optional
from openai import OpenAI
from app.config import settings

FALLBACK_TEMPLATES = [
    {
        "question_text": "What is the primary role of this topic in modern computing and software systems?",
        "options": [
            "Facilitating structured data processing and systematic workflow execution",
            "Preventing hardware malfunctions through physical cooling",
            "Replacing all human interaction in everyday communication",
            "Limiting user access to basic computing resources"
        ],
        "correct_answer": "Facilitating structured data processing and systematic workflow execution",
        "explanation": "This topic primarily enables systematic and structured processing within software environments."
    },
    {
        "question_text": "Which of the following best describes the core principle underlying the studied material?",
        "options": [
            "Modularity, efficiency, and clear separation of concerns",
            "Complete lack of structure and unmanaged state mutations",
            "Single-threaded execution with no error handling",
            "Unrestricted global state across all subsystems"
        ],
        "correct_answer": "Modularity, efficiency, and clear separation of concerns",
        "explanation": "Modern architectural standards rely on modularity, high cohesion, and loose coupling."
    },
    {
        "question_text": "When implementing this concept in a production environment, what is the best practice?",
        "options": [
            "Ensure proper error handling, logging, and security validation",
            "Ignore all edge cases and suppress error logs",
            "Store sensitive credentials directly in plain text",
            "Disable all validation checks to maximize speed"
        ],
        "correct_answer": "Ensure proper error handling, logging, and security validation",
        "explanation": "Production systems require robust validation, security practices, and reliable logging."
    },
    {
        "question_text": "What is a major advantage of following this standardized approach?",
        "options": [
            "Improved maintainability, scalability, and predictable behavior",
            "Guaranteed zero memory usage regardless of load",
            "Instant conversion of legacy code without testing",
            "Elimination of the need for any database or storage"
        ],
        "correct_answer": "Improved maintainability, scalability, and predictable behavior",
        "explanation": "Standardized patterns provide predictable outcomes and make long-term maintenance manageable."
    },
    {
        "question_text": "How does this concept contribute to optimal system performance?",
        "options": [
            "By optimizing resource allocation and reducing computational overhead",
            "By consuming all available CPU threads constantly",
            "By bypassing all network security protocols",
            "By increasing disk I/O operations unnecessarily"
        ],
        "correct_answer": "By optimizing resource allocation and reducing computational overhead",
        "explanation": "Optimized resource management directly minimizes overhead and latency."
    }
]

def generate_fallback_quiz(
    text: Optional[str],
    topic: Optional[str],
    num_questions: int = 5,
    difficulty: str = "medium"
) -> List[Dict[str, Any]]:
    """
    Generates high-quality contextual questions when OpenAI API is not configured or fails.
    """
    subject = topic or "Subject Matter"
    extracted_sentences = []
    if text:
        # Extract meaningful sentences from provided text
        raw_sentences = [s.strip() for s in re.split(r'[.\n\r?!]+', text) if len(s.strip()) > 30]
        for s in raw_sentences:
            if not s.startswith("http") and not all(c.isdigit() for c in s):
                extracted_sentences.append(s)

    questions = []
    for i in range(num_questions):
        if extracted_sentences and i < len(extracted_sentences):
            sample = extracted_sentences[i % len(extracted_sentences)]
            words = [w for w in sample.split() if len(w) > 4 and w.isalnum()]
            key_term = words[0] if words else subject

            q = {
                "question_text": f"According to the material, what is noted regarding: \"{sample[:90]}...\"?",
                "options": [
                    f"It highlights the critical significance of {key_term}",
                    f"It suggests that {key_term} is obsolete and unused",
                    f"It indicates that {key_term} only applies in isolated test environments",
                    f"It asserts that no configuration is needed for {key_term}"
                ],
                "correct_answer": f"It highlights the critical significance of {key_term}",
                "explanation": f"Based on the provided text, \"{sample[:120]}\" demonstrates this core insight.",
                "order_num": i + 1
            }
        else:
            template = FALLBACK_TEMPLATES[i % len(FALLBACK_TEMPLATES)]
            q = {
                "question_text": template["question_text"].replace("this topic", f"{subject}"),
                "options": template["options"],
                "correct_answer": template["correct_answer"],
                "explanation": template["explanation"],
                "order_num": i + 1
            }
        questions.append(q)

    return questions


async def generate_quiz_questions(
    text: Optional[str] = None,
    topic: Optional[str] = None,
    num_questions: int = 5,
    difficulty: str = "medium"
) -> List[Dict[str, Any]]:
    """
    Generates quiz questions using OpenAI GPT-4o-mini with fallback.
    """
    api_key = settings.OPENAI_API_KEY
    if not api_key or "sk-demo" in api_key or api_key.startswith("sk-..."):
        return generate_fallback_quiz(text, topic, num_questions, difficulty)

    try:
        client = OpenAI(api_key=api_key)
        prompt_content = f"""
You are an expert educational examiner and question generator.
Generate a high quality multiple choice quiz based on the following instructions:
- Topic: {topic or 'General'}
- Difficulty level: {difficulty}
- Number of questions: {num_questions}

Content / Reference Material:
{text[:4000] if text else "Generate standard questions on topic: " + (topic or "General Knowledge")}

Format your response strictly as a JSON array of objects with the following schema for each question:
[
  {{
    "question_text": "Clear question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Detailed explanation of why this answer is correct."
  }}
]
Rules:
1. Provide exactly 4 distinct options per question.
2. The correct_answer must exactly match one of the items in the options array.
3. Return ONLY valid JSON with no markdown backticks or commentary.
"""
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional quiz generator. Respond only in raw JSON."},
                {"role": "user", "content": prompt_content}
            ],
            temperature=0.7,
            max_tokens=2000
        )

        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\n?", "", content)
            content = re.sub(r"\n?```$", "", content)

        data = json.loads(content)
        questions = []
        for i, item in enumerate(data):
            questions.append({
                "question_text": item["question_text"],
                "options": item["options"],
                "correct_answer": item["correct_answer"],
                "explanation": item.get("explanation", "Correct based on the material."),
                "order_num": i + 1
            })
        return questions
    except Exception as e:
        # Fall back gracefully to NLP rule-based generator
        return generate_fallback_quiz(text, topic, num_questions, difficulty)
