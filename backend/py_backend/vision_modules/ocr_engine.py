# pyrefly: ignore [missing-import]
import cv2
# pyrefly: ignore [missing-import]
import pytesseract
# pyrefly: ignore [missing-import]
import numpy as np

def process_book_cover(image_bytes):
    """
    Takes raw image bytes, applies OpenCV preprocessing, and extracts text using Tesseract.
    """
    # 1. Convert image bytes to a numpy array, then to an OpenCV image format
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("Could not decode image.")

    # 2. OpenCV Preprocessing (Migrated from Colab)
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply a blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Apply thresholding (Binarization) to make text stand out
    # Adjust the block size (11) and C value (2) based on your specific glossy book covers
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                   cv2.THRESH_BINARY, 11, 2)

    # 3. Tesseract OCR Extraction
    # --psm 3 represents standard page layout analysis
    custom_config = r'--oem 3 --psm 3'
    extracted_text = pytesseract.image_to_string(thresh, config=custom_config)

    return extracted_text.strip()

#call the fuction with a dummy image bytes for testing
if __name__ == "__main__":
    # Load a sample image for testing
    with open(r"C:\Users\USER\Desktop\Farrell-HI.png", "rb") as f:
        image_bytes = f.read()
    
    extracted_text = process_book_cover(image_bytes)
    print("Extracted Text:", extracted_text)