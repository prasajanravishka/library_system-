"""
════════════════════════════════════════════════════════════════════════════
Smart Library — Python FastAPI Backend (AI/Vision Only)
Port: 8001
Host: 0.0.0.0 (accessible from mobile emulators and physical devices)
════════════════════════════════════════════════════════════════════════════
This service is dedicated exclusively to AI image processing (OCR/Vision).
All standard CRUD operations are handled by the PHP backend on port 8000.

Architecture:
- PHP Backend (Port 8000): User authentication, CRUD operations, borrow/return
- Python Backend (Port 8001): OCR processing, image analysis, AI/Vision tasks

Both services require valid API Key in X-API-Key header for authentication.
════════════════════════════════════════════════════════════════════════════
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader
import uvicorn
import os
from dotenv import load_dotenv

from vision_modules.ocr_engine import process_book_cover
from vision_modules.feature_matcher import analyze_cover, detect_spine_region

# Load environment variables
load_dotenv()

# ── API Key Configuration ────────────────────────────────────────────────────
API_KEY = os.getenv("API_KEY", "LIBRARY_SECRET_API_KEY_2026")

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def get_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden — invalid or missing API key")
    return api_key

# ── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Smart Library — AI Vision API",
    description="AI-powered OCR and image processing for book cover scanning",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ── Health Check ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "Smart Library AI Vision API",
        "port": 8001,
        "status": "running",
        "endpoints": ["/api/scan-book", "/api/analyze-cover", "/api/detect-spines"],
    }


# ── Scan Book (OCR + LLM Parsing) ───────────────────────────────────────────

@app.post("/api/scan-book")
async def scan_book(file: UploadFile = File(...), api_key: str = Security(get_api_key)):
    """
    Receive an image of a book cover, process with OpenCV + Tesseract OCR,
    optionally parse with LLM, and return structured book information.

    Returns JSON with:
      - raw_text: the raw OCR output
      - book_info: structured fields (title, author, isbn, publisher)
      - cover_analysis: image quality, colors, keypoints
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        image_bytes = await file.read()

        # 1. OCR extraction
        extracted_text = process_book_cover(image_bytes)

        # 2. Cover analysis (quality, colors, features)
        cover_analysis = analyze_cover(image_bytes)

        # 3. Try LLM parsing for structured data (graceful fallback)
        book_info = {
            "title": "",
            "author": "",
            "isbn": "",
            "publisher": "",
        }
        try:
            from vision_modules.llm_parser import parse_ocr_text
            book_info = parse_ocr_text(extracted_text)
        except Exception:
            # If LLM parsing fails, return raw text — user can manually fill in
            pass

        # 4. Save uploaded file
        os.makedirs("uploads", exist_ok=True)
        file_path = f"uploads/{file.filename}"
        with open(file_path, "wb") as f:
            f.write(image_bytes)

        book_info["cover_image_path"] = file_path

        return {
            "status": "success",
            "filename": file.filename,
            "raw_text": extracted_text,
            "book_info": book_info,
            "cover_analysis": cover_analysis,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# ── Analyze Cover (Features only, no OCR) ────────────────────────────────────

@app.post("/api/analyze-cover")
async def analyze_cover_endpoint(file: UploadFile = File(...), api_key: str = Security(get_api_key)):
    """
    Analyze a book cover image without OCR.
    Returns dominant colors, sharpness score, and keypoint count.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        image_bytes = await file.read()
        analysis = analyze_cover(image_bytes)

        return {
            "status": "success",
            "filename": file.filename,
            "analysis": analysis,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


# ── Detect Spines (Shelf scanning) ──────────────────────────────────────────

@app.post("/api/detect-spines")
async def detect_spines_endpoint(file: UploadFile = File(...), api_key: str = Security(get_api_key)):
    """
    Detect book spines in a shelf image using edge detection.
    Returns bounding boxes for each detected spine region.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        image_bytes = await file.read()
        result = detect_spine_region(image_bytes)

        return {
            "status": "success",
            "filename": file.filename,
            "spines": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection error: {str(e)}")


# ── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
