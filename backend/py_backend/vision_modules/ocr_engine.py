# pyrefly: ignore [missing-import]
import cv2
# pyrefly: ignore [missing-import]
import numpy as np
import os
import subprocess
import sys
import tempfile

import shutil
import platform

# Try to find tesseract in PATH
TESSERACT_PATH = shutil.which('tesseract')

# Fallback for Windows if not in PATH
if TESSERACT_PATH is None and platform.system() == 'Windows':
    TESSERACT_PATH = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Verify the path exists
if TESSERACT_PATH is None or not os.path.exists(TESSERACT_PATH):
    print(f"ERROR: Tesseract not found in PATH or at {r'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'}", file=sys.stderr)
    sys.exit(1)
else:
    print(f"OK: Tesseract found at: {TESSERACT_PATH}")
    # Test if it runs
    try:
        result = subprocess.run([TESSERACT_PATH, '--version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print(f"OK: Tesseract is working: {result.stdout.split(chr(10))[0]}")
        else:
            print(f"FAIL: Tesseract error: {result.stderr}", file=sys.stderr)
    except Exception as e:
        print(f"FAIL: Error testing Tesseract: {e}", file=sys.stderr)

def process_book_cover(image_bytes):
    """
    Takes raw image bytes, applies OpenCV preprocessing, and extracts text using Tesseract.
    """
    # 1. Convert image bytes to a numpy array, then to an OpenCV image format
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("Could not decode image.")
    
    print(f"  Image shape: {image.shape}")

    # 2. OpenCV Preprocessing (Migrated from Colab)
    # Upscale image for better OCR accuracy (Tesseract works better with larger images)
    scale_factor = 2
    image = cv2.resize(image, None, fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_CUBIC)
    print(f"  Upscaled image shape: {image.shape}")
    
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply a blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    
    # Try simple thresholding for clearer text
    _, thresh = cv2.threshold(blurred, 150, 255, cv2.THRESH_BINARY)
    print(f"  Threshold applied")

    # 3. Tesseract OCR Extraction using subprocess directly
    # Create a temporary file for the image
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
        tmp_image_path = tmp_file.name
        cv2.imwrite(tmp_image_path, thresh)
        print(f"  Temp image saved to: {tmp_image_path}")
    
    try:
        # Call tesseract directly with subprocess with better parameters
        output_file = tmp_image_path.replace('.png', '')
        # Using PSM 6 for better text block detection
        cmd = [TESSERACT_PATH, tmp_image_path, output_file, 
               '--psm', '6',  # Assume a single uniform block of text
               '--oem', '3']  # Use both legacy and LSTM modes
        
        print(f"  Running Tesseract OCR...")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        print(f"  Tesseract return code: {result.returncode}")
        
        if result.stderr:
            print(f"  Tesseract stderr: {result.stderr}")
        
        # Read the output
        txt_file = output_file + '.txt'
        if os.path.exists(txt_file):
            with open(txt_file, 'r', encoding='utf-8') as f:
                extracted_text = f.read()
            print(f"  Extracted {len(extracted_text)} characters")
            os.remove(txt_file)
            return extracted_text.strip()
        else:
            print(f"  Warning: Output file not found at {txt_file}")
            raise RuntimeError(f"Tesseract did not produce output. stderr: {result.stderr}")
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_image_path):
            os.remove(tmp_image_path)

#call the fuction with a dummy image bytes for testing
if __name__ == "__main__":
    # Load a sample image for testing
    image_path = r"C:\Users\USER\Desktop\Farrell-HI.png"
    
    if not os.path.exists(image_path):
        print(f"Error: Image file not found at {image_path}")
        print("Please provide a valid image file path.")
    else:
        with open(image_path, "rb") as f:
            image_bytes = f.read()
        
        extracted_text = process_book_cover(image_bytes)
        print("Extracted Text:", extracted_text)