import os
import shutil
import tempfile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware



from llm import process_file_to_flashcards

app = FastAPI()

# Allow the Vite dev server to call this API



app.add_middleware(
    CORSMiddleware,
    allow_origin = ["*"], 
    
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/generate-flashcards")
async def generate_flashcards(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or "")[1].lower()
    if suffix not in {".pdf", ".jpg", ".jpeg", ".png"}:
        raise HTTPException(status_code=400, detail="Upload a PDF, JPG, or PNG.")

    # Docling needs a real file path, so save the upload temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        cards = process_file_to_flashcards(tmp_path)
        return {"flashcards": cards}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.remove(tmp_path)

# Run:  uvicorn parser_service:app --reload --port 8000
