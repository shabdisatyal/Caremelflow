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
    
    You MUST return your response strictly as a JSON array of objects with "front" and "back" keys. No extra text or markdown formatting outside the JSON array.
    
    Example format:
    [
      {{"front": "What is X?", "back": "X is Y."}}
    ]

    Document Text:
    {markdown_text}
    """

    response = client.chat.completions.create(
        model="llama3",
        messages=[
            {"role": "system", "content": "You output only valid JSON arrays."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content
    return json.loads(content)

if __name__ == "__main__":
    sample_file = "sample.pdf" 

    print("Cooking your materials !")
    try:
        cards = process_file_to_flashcards(sample_file)
        print("\n SUCCESS! Generated Flashcards JSON:")
        print(json.dumps(cards, indent=2))
    except Exception as e:
        print(f" Error during processing: {e}")