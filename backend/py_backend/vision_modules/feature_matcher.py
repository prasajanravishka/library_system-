"""
Smart Library — Feature Matcher Module
Handles OpenCV-based book cover and spine feature matching
for identification against known covers in the database.
"""

import cv2
import numpy as np


def extract_features(image_bytes: bytes) -> dict:
    """
    Extract visual features from a book cover image.
    Uses ORB (Oriented FAST and Rotated BRIEF) feature detection.

    Args:
        image_bytes: Raw bytes of the image.

    Returns:
        A dict with feature descriptors and keypoint count.
    """
    # Decode the image from bytes
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"keypoints": 0, "descriptors": None, "error": "Failed to decode image"}

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Initialize ORB detector
    orb = cv2.ORB_create(nfeatures=500)
    keypoints, descriptors = orb.detectAndCompute(gray, None)

    return {
        "keypoints": len(keypoints) if keypoints else 0,
        "descriptors": descriptors,
        "image_shape": img.shape[:2],  # (height, width)
    }


def detect_spine_region(image_bytes: bytes) -> dict:
    """
    Detect a book spine region in the image using edge detection and
    contour analysis. Useful for shelf scanning mode.

    Args:
        image_bytes: Raw bytes of the image.

    Returns:
        A dict with detected spine bounding boxes and count.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"spines_detected": 0, "regions": [], "error": "Failed to decode image"}

    # Preprocessing
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Canny edge detection
    edges = cv2.Canny(blurred, 50, 150)

    # Morphological operations to connect edges
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 15))
    dilated = cv2.dilate(edges, kernel, iterations=2)

    # Find contours
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filter for tall, narrow spine-like contours
    spine_regions = []
    height, width = img.shape[:2]
    min_spine_height = height * 0.3  # At least 30% of image height

    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        aspect_ratio = h / max(w, 1)

        # Spines are typically tall and narrow
        if h >= min_spine_height and aspect_ratio > 2.0:
            spine_regions.append({
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h),
                "aspect_ratio": round(aspect_ratio, 2),
            })

    # Sort by x-coordinate (left to right on the shelf)
    spine_regions.sort(key=lambda r: r['x'])

    return {
        "spines_detected": len(spine_regions),
        "regions": spine_regions,
    }


def analyze_cover(image_bytes: bytes) -> dict:
    """
    Comprehensive cover analysis: extracts features, detects dominant colors,
    and estimates image quality.

    Args:
        image_bytes: Raw bytes of the image.

    Returns:
        Combined analysis results.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"error": "Failed to decode image"}

    height, width = img.shape[:2]

    # ── Dominant Colors (K-means clustering) ────────────────────────────
    resized = cv2.resize(img, (64, 64))
    pixels = resized.reshape(-1, 3).astype(np.float32)

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(pixels, 3, None, criteria, 5, cv2.KMEANS_RANDOM_CENTERS)

    dominant_colors = []
    for center in centers:
        b, g, r = int(center[0]), int(center[1]), int(center[2])
        dominant_colors.append(f"#{r:02x}{g:02x}{b:02x}")

    # ── Image Quality (Laplacian variance = blur detection) ─────────────
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    if laplacian_var < 50:
        quality = "blurry"
    elif laplacian_var < 200:
        quality = "acceptable"
    else:
        quality = "sharp"

    # ── Features ────────────────────────────────────────────────────────
    features = extract_features(image_bytes)

    return {
        "image_size": {"width": width, "height": height},
        "dominant_colors": dominant_colors,
        "quality": quality,
        "sharpness_score": round(laplacian_var, 2),
        "keypoints_detected": features["keypoints"],
    }
