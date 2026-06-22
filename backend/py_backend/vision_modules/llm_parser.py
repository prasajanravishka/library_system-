import os
import json
# pyrefly: ignore [missing-import]
import google.generativeai as genai

OCR_POST_PROCESSING_PROMPT = """You are an OCR Post-Processing AI for a Smart Library Management System.

Your sole responsibility is to analyze OCR-extracted text from book covers, book spines, title pages, ISBN pages, and library labels, then identify the most likely Book Title and Author Name.

Instructions:

1. Carefully analyze the OCR text.

2. Ignore unrelated information such as:

   * ISBN numbers
   * Barcodes
   * Library stamps
   * Call numbers
   * Shelf codes
   * Publisher information
   * Edition information
   * Copyright notices
   * Pricing information
   * Marketing text
   * Reviews
   * Taglines
   * University or library labels
   * QR codes
   * Website URLs

3. Prioritize text that appears:

   * Large and prominent on the cover
   * Centered on the page
   * Repeated across multiple OCR regions
   * Associated with phrases such as "by"

4. Author names are typically:

   * Person names
   * Located below or above the title
   * One to four words
   * Written in title case

5. Book titles may:

   * Span multiple lines
   * Include subtitles
   * Contain punctuation
   * Be significantly larger than surrounding text

6. If multiple books appear in the image, select the most prominent book.

7. If confidence is low:

   * Make the best possible prediction.
   * Never invent information that does not appear in the OCR text.

8. Output ONLY valid JSON.

Output Format:

{
"title": "Book Title",
"author": "Author Name"
}

Rules:

* Return only JSON.
* No explanations.
* No markdown.
* No additional fields.
* No confidence scores.
* No comments.
* No reasoning.
* If author cannot be identified, return:
  {
  "title": "Detected Title",
  "author": ""
  }
* If title cannot be identified, return:
  {
  "title": "",
  "author": "Detected Author"
  }
* If neither can be identified, return:
  {
  "title": "",
  "author": ""
  }
"""

def parse_ocr_text(extracted_text: str) -> dict:
    """
    Takes raw OCR text and uses an LLM to parse out the title and author 
    based on the strict prompt.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY not found in environment. Returning empty structure.")
        return {"title": "", "author": ""}

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    full_prompt = f"{OCR_POST_PROCESSING_PROMPT}\n\nOCR Text:\n{extracted_text}"
    
    try:
        response = model.generate_content(full_prompt)
        text_response = response.text.strip()
        
        # Clean up any potential markdown block backticks if the model ignores the instruction
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.startswith("```"):
            text_response = text_response[3:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
            
        parsed_json = json.loads(text_response.strip())
        return parsed_json
    except Exception as e:
        print(f"Error parsing LLM response: {e}")
        return {"title": "", "author": ""}
