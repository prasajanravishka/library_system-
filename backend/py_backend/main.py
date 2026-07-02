"""
════════════════════════════════════════════════════════════════════════════
Smart Library — Python FastAPI Backend (Unified API)
Port: 8001
Host: 0.0.0.0 (accessible from mobile emulators and physical devices)
════════════════════════════════════════════════════════════════════════════
This service is the central monolithic backend for the Smart Library system.
It handles all CRUD operations, user authentication, borrow/return logic,
as well as AI-powered OCR and image processing.

Architecture:
- Unified Python Backend (Port 8001)

Authentication:
- API Key (x-api-key header) required for all requests.
- JWT Bearer tokens required for user-specific CRUD operations.
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

from routers import user, borrow, admin, dashboard, settings
# Load environment variables
load_dotenv()

# ── API Key Configuration ────────────────────────────────────────────────────
API_KEY = os.getenv("API_KEY", "LIBRARY_SECRET_API_KEY_2026")

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def get_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden — invalid or missing API key")
    return api_key

# ── Allowed Image Extensions ─────────────────────────────────────────────────
IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif')

# ── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Smart Library — AI Vision API",
    description="AI-powered OCR and image processing for book cover scanning",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    # When allow_credentials=True, you cannot use allow_origins=["*"].
    # Using allow_origin_regex=".*" permits any origin while supporting credentials.
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], # Explicitly allows Authorization
)

app.include_router(user.router, prefix="/api")
app.include_router(borrow.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(settings.router, prefix="/api")


# ── Health Check ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "Smart Library AI Vision API",
        "port": 8001,
        "status": "running",
        "endpoints": ["/api/scan-book", "/api/analyze-cover", "/api/detect-spines"],
    }


@app.api_route("/api", methods=["GET", "HEAD"])
def api_health():
    """Health-check endpoint at /api for client connectivity probes."""
    return {"status": "ok", "service": "Smart Library API"}


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
    # Validate image: check content_type first, then fall back to file extension
    is_image_content = file.content_type and file.content_type.startswith("image/")
    is_image_ext = file.filename and file.filename.lower().endswith(IMAGE_EXTENSIONS)
    if not is_image_content and not is_image_ext:
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
    # Validate image: check content_type first, then fall back to file extension
    is_image_content = file.content_type and file.content_type.startswith("image/")
    is_image_ext = file.filename and file.filename.lower().endswith(IMAGE_EXTENSIONS)
    if not is_image_content and not is_image_ext:
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
    # Validate image: check content_type first, then fall back to file extension
    is_image_content = file.content_type and file.content_type.startswith("image/")
    is_image_ext = file.filename and file.filename.lower().endswith(IMAGE_EXTENSIONS)
    if not is_image_content and not is_image_ext:
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
