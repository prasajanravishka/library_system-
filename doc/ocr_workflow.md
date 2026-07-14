# 🔍 AI Book Scanner & OCR Workflow Architecture

This document outlines the end-to-end architecture and data flow for the AI-powered book scanner, detailing the integration between the client applications (Flutter mobile app and React web admin) and the Python (FastAPI) backend.

---

## 📱 1. Client Trigger (Flutter / React)
The scanning process can be initiated from the client interfaces.

*   **Image Acquisition**: Utilizing native or web APIs, users can capture a live photo or upload an existing cover image.
*   **Service Invocation**: The client application triggers an `extractBookInfo(image)` routine.
*   **Payload Transmission**: The image is packaged as a `multipart/form-data` HTTP POST request. It is securely transmitted to the FastAPI backend (port `8001`), authenticated via the `X-API-Key` header.

## 🐍 2. Backend Service (FastAPI)
The request is processed by the dedicated AI microservice endpoint: `POST /api/scan-book`.

*Note: The backend also exposes auxiliary computer vision endpoints `POST /api/analyze-cover` (for image quality & feature extraction without OCR) and `POST /api/detect-spines` (for shelf spatial analysis).*

*   **Ingestion**: FastAPI receives the raw image payload into memory.
*   **Routing**: The payload is immediately dispatched to the Computer Vision pipeline for synchronous processing.

## 👁️ 3. OCR Preprocessing & Extraction (`ocr_engine.py`)
To maximize optical character recognition (OCR) accuracy, the raw image undergoes extensive preprocessing.

*   **Image Conditioning (OpenCV)**: The image is upscaled (2x interpolation), converted to grayscale, subjected to bilateral filtering to reduce noise while preserving edges, and adaptively thresholded into a binary format.
*   **Text Extraction (Tesseract)**: The conditioned image is processed by Tesseract OCR. This yields a raw, unstructured string of text encompassing all visible characters.

## 🧠 4. Semantic Parsing (`llm_parser.py`)
The raw OCR output is highly unstructured. Semantic parsing is required to extract meaningful metadata.

*   **LLM Inference (Gemini)**: The raw text is transmitted to the Google Gemini API with a deterministic prompt: *"You are an OCR Post-Processing AI. Extract ONLY the book title and author from this messy text and return it as JSON."*
*   **Data Structuring**: The LLM filters out extraneous information and returns a strictly formatted JSON object (e.g., `{"title": "Harry Potter", "author": "J.K. Rowling"}`).

## 📲 5. Client Resolution & UI Update
*   **Response**: The Python backend persists the cover image to the local `uploads/` directory and returns the structured JSON with a `200 OK` status.
*   **State Update**: The client receives the payload and dismisses the loading state.
*   **Human-in-the-Loop Validation**: The data form is pre-filled with the extracted metadata. The user can review, manually correct any anomalies, enter the specific barcode/ISBN for the physical copies, and finalize the entry via the FastAPI CRUD endpoints.

---

### 🗺️ Visual Architecture Diagram

```mermaid
sequenceDiagram
    participant User
    participant Client as React Admin / Flutter App
    participant API as Python FastAPI
    participant CV as OpenCV + Tesseract
    participant LLM as Gemini API

    User->>Client: Capture/Upload Cover Image
    Client->>API: POST /api/scan-book (Multipart + X-API-Key)
    API->>CV: Dispatch for Preprocessing & OCR
    CV-->>API: Yield Raw Extracted Text
    API->>LLM: Send Text + Structuring Prompt
    LLM-->>API: Return Structured JSON (or fallback to Raw Text on failure)
    API-->>Client: 200 OK (JSON Payload)
    Client->>User: Render Pre-filled Form for Validation
```
