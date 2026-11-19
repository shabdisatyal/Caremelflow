import json
import os
from openai import OpenAI
from docling.document_converter import DocumentConverter 

# Initialize local Ollama client (ensure Ollama is running via `ollama serve`)
client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama", # Ollama doesn't require a real API key, but client expects one
)

def extract_document(file_path: str) -> str:
    
    converter = DocumentConverter()
    result = converter.convert(file_path)
    markdown_output = result.document.export_to_markdown()
    return markdown_output 

def process_file_to_flashcards(file_path: str):
    print(f"Parsing document with Docling: {file_path}...")
    markdown_text = extract_document(file_path)
    
    print("Generating structured JSON flashcards with Llama 3 via Ollama...")
    

    prompt = f"""
    You are an expert study material generator optimized for active recall. Given the following document text, extract the core concepts, definitions, and high-yield facts into concise flashcards.
    You MUST return a JSON object with two keys:
    - "deck_name": a short title for the deck, max 4 words, no punctuation
    - "flashcards": an array of objects with "front" and "back" keys
    No extra text outside the JSON.
        {{"deck_name": "Cell Biology Basics", "flashcards": [{{"front": "What is X?", "back": "X is Y."}}]}}

    Document Text:
    {markdown_text}
    """

    response = client.chat.completions.create(
        model="llama3",
        messages=[
            {"role": "system", "content": "You output only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content
    print("RAW MODEL OUTPUT:", content)
    data = json.loads(content)

    if isinstance(data, list):
        cards = data
    else:
        cards = data.get("flashcards") or next(
            (v for v in data.values() if isinstance(v, list)), []
        )

    return [
        {"front": str(c["front"]).strip(), "back": str(c["back"]).strip()}
        for c in cards
        if isinstance(c, dict) and c.get("front") and c.get("back")
    ]