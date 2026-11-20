import os
import shutil
import tempfile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from llm import process_file_to_flashcards
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://caremelflow.com",
        "https://www.caremelflow.com",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/generate-flashcards")
async def generate_flashcards(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or "")[1].lower()
    if suffix not in {".pdf", ".jpg", ".jpeg", ".png"}:
        raise HTTPException(status_code=400, detail="Upload a PDF, JPG, or PNG.")

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = os.path.join(tmp_dir, f"upload{suffix}")
        with open(tmp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        try:
            cards = process_file_to_flashcards(tmp_path)
            return {"flashcards": cards}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))