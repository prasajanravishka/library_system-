from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from database import get_db
from auth import get_current_user
import math
import os
import secrets

router = APIRouter()

class BorrowRequest(BaseModel):
    book_id: int

class BookReviewRequest(BaseModel):
    book_id: int
    rating: int
    review_text: Optional[str] = None

@router.post("/borrow")
def borrow_book(req: BorrowRequest, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    book_id = req.book_id
    
    try:
        with db.cursor() as cursor:
            # Check book availability
            cursor.execute("SELECT availability_status, available_copies FROM books WHERE book_id = %s", (book_id,))
            book = cursor.fetchone()
            
            if not book:
                raise HTTPException(status_code=404, detail="Book not found")
            if book['available_copies'] <= 0 or book['availability_status'] != 'available':
                raise HTTPException(status_code=400, detail="Book is not available for borrowing")
            
            # Find an available copy
            cursor.execute("SELECT copy_id FROM book_copies WHERE book_id = %s AND status = 'available' LIMIT 1", (book_id,))
            copy = cursor.fetchone()
            if not copy:
                raise HTTPException(status_code=400, detail="No available copies found")
            copy_id = copy['copy_id']
            
            # Insert borrow record (14-day loan period)
            due_date_str = (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d')
            cursor.execute(
                """INSERT INTO borrow_records (user_id, book_id, copy_id, borrow_date, due_date, status)
                   VALUES (%s, %s, %s, CURDATE(), %s, 'borrowed')""",
                (user_id, book_id, copy_id, due_date_str)
            )
            borrow_id = cursor.lastrowid
            
            # Update copy status
            cursor.execute("UPDATE book_copies SET status = 'borrowed' WHERE copy_id = %s", (copy_id,))
            
            # Update book status and copies
            new_available = book['available_copies'] - 1
            new_status = 'borrowed' if new_available == 0 else 'available'
            cursor.execute("UPDATE books SET availability_status = %s, available_copies = %s WHERE book_id = %s", (new_status, new_available, book_id))
            
        db.commit()
        
        return {
            "status": "success",
            "message": "Book borrowed successfully",
            "borrow_id": borrow_id,
            "due_date": due_date_str
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/borrow/return")
def return_book(req: BorrowRequest, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    book_id = req.book_id
    
    try:
        with db.cursor() as cursor:
            # Find active borrow record
            cursor.execute(
                """SELECT borrow_id, due_date FROM borrow_records
                   WHERE user_id = %s AND book_id = %s AND status IN ('borrowed', 'overdue')
                   ORDER BY borrow_date DESC LIMIT 1""",
                (user_id, book_id)
            )
            borrow = cursor.fetchone()
            
            if not borrow:
                raise HTTPException(status_code=400, detail="No active borrow record found")
                
            # Calculate fine if overdue
            cursor.execute("SELECT setting_key, setting_value FROM library_settings")
            settings = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}
            fine_per_day = float(settings.get('fine_per_day', '0.50'))
            exempt_days_str = settings.get('exempt_days', '')
            exempt_days_list = [int(x.strip()) for x in exempt_days_str.split(',')] if exempt_days_str else []

            cursor.execute("SELECT start_date, end_date FROM excluded_date_ranges")
            ranges = cursor.fetchall()
            excluded_ranges = [(r['start_date'], r['end_date']) for r in ranges]

            due_date = borrow['due_date']
            if isinstance(due_date, str):
                if due_date.startswith('0000'):
                    due_date = datetime.now().date()
                else:
                    due_date = datetime.strptime(due_date, '%Y-%m-%d').date()
            
            today = datetime.now().date()
            days_overdue = (today - due_date).days
            
            if days_overdue > 0:
                current_date = due_date + timedelta(days=1)
                exempt_count = 0
                while current_date <= today:
                    is_exempt_day = exempt_days_list and (current_date.weekday() in exempt_days_list)
                    is_vacation_day = False
                    if excluded_ranges:
                        for start_date, end_date in excluded_ranges:
                            start = start_date if isinstance(start_date, date) else datetime.strptime(str(start_date), '%Y-%m-%d').date()
                            end = end_date if isinstance(end_date, date) else datetime.strptime(str(end_date), '%Y-%m-%d').date()
                            if start <= current_date <= end:
                                is_vacation_day = True
                                break
                    
                    if is_exempt_day or is_vacation_day:
                        exempt_count += 1
                    current_date += timedelta(days=1)
                days_overdue -= exempt_count
                days_overdue = max(0, days_overdue)
                fine_amount = round(days_overdue * fine_per_day, 2)
            else:
                fine_amount = 0.00
            
            # Update borrow record
            cursor.execute(
                """UPDATE borrow_records
                   SET status = 'returned', return_date = CURDATE(),
                       fine_amount = %s, fine_paid = FALSE
                   WHERE borrow_id = %s""",
                (fine_amount, borrow['borrow_id'])
            )
            
            # Update copy
            cursor.execute(
                """UPDATE book_copies bc
                   JOIN borrow_records br ON bc.copy_id = br.copy_id
                   SET bc.status = 'available'
                   WHERE br.borrow_id = %s""",
                (borrow['borrow_id'],)
            )
            
            # Update book status and increment copies
            cursor.execute("UPDATE books SET availability_status = 'available', available_copies = available_copies + 1 WHERE book_id = %s", (book_id,))
            
            # Update user rank/badge
            cursor.execute("SELECT COUNT(*) as count FROM borrow_records WHERE user_id = %s", (user_id,))
            total_borrowed = cursor.fetchone()['count']
            
            if total_borrowed >= 15:
                rank, badge = 'Gold', 'emoji_events'
            elif total_borrowed >= 5:
                rank, badge = 'Silver', 'workspace_premium'
            else:
                rank, badge = 'Bronze', 'military_tech'
                
            cursor.execute(
                "UPDATE users SET `rank` = %s, badge_icon = %s, total_books_read = %s WHERE user_id = %s",
                (rank, badge, total_borrowed, user_id)
            )
            
        db.commit()
        
        response = {"status": "success", "message": "Book returned successfully"}
        if fine_amount > 0:
            response["fine_amount"] = fine_amount
            response["fine_message"] = f"Overdue fine of LKR {fine_amount} has been applied."
            
        return response
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/borrow/history")
def get_library(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT br.borrow_id, b.book_id, b.title, b.author, b.cover_image_path,
                      br.borrow_date, br.due_date, br.return_date, br.status,
                      DATEDIFF(br.due_date, CURDATE()) as days_left
               FROM borrow_records br
               JOIN books b ON br.book_id = b.book_id
               WHERE br.user_id = %s
               ORDER BY br.borrow_date DESC""",
            (user_id,)
        )
        records = cursor.fetchall()
        
    return {
        "status": "success",
        "library": records
    }

@router.get("/borrow/reading_history")
def get_reading_history(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT br.borrow_id, b.book_id, b.title, b.author, b.cover_image_path, b.cover_image_url,
                      br.borrow_date, br.due_date, br.return_date, br.status, br.fine_amount
               FROM borrow_records br
               JOIN books b ON br.book_id = b.book_id
               WHERE br.user_id = %s AND br.status IN ('returned', 'lost')
               ORDER BY br.return_date DESC""",
            (user_id,)
        )
        records = cursor.fetchall()
        
    return {
        "status": "success",
        "history": records
    }


@router.post("/borrow/upload-receipt")
async def upload_receipt(
    borrow_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    user_id = current_user['user_id']
    
    # Create receipts directory
    upload_dir = os.path.join("uploads", "receipts")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save the file
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{secrets.token_hex(8)}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Forward slash path for web compatibility
    db_file_path = f"uploads/receipts/{unique_filename}"
    
    try:
        with db.cursor() as cursor:
            # 1. Verify borrow record exists, belongs to user, and has fine
            cursor.execute(
                "SELECT borrow_id, fine_amount FROM borrow_records WHERE borrow_id = %s AND user_id = %s AND fine_paid = FALSE",
                (borrow_id, user_id)
            )
            borrow = cursor.fetchone()
            if not borrow:
                raise HTTPException(status_code=400, detail="Invalid borrow record or no pending fines.")
            
            fine_amount = float(borrow['fine_amount'])
            if fine_amount <= 0:
                raise HTTPException(status_code=400, detail="This borrow record does not have a fine.")
                
            # 2. Get or create fine_id
            cursor.execute("SELECT fine_id FROM fines WHERE borrow_id = %s LIMIT 1", (borrow_id,))
            fine_row = cursor.fetchone()
            if fine_row:
                fine_id = fine_row['fine_id']
            else:
                cursor.execute(
                    "INSERT INTO fines (borrow_id, amount, reason) VALUES (%s, %s, 'Overdue return')",
                    (borrow_id, fine_amount)
                )
                fine_id = cursor.lastrowid
                
            # 3. Create pending payment log
            txn_ref = f"TXN-{secrets.token_hex(4).upper()}"
            cursor.execute(
                """INSERT INTO payments (user_id, fine_id, amount_paid, payment_method, status, transaction_reference, receipt_image_path)
                   VALUES (%s, %s, %s, 'online', 'pending', %s, %s)""",
                (user_id, fine_id, fine_amount, txn_ref, db_file_path)
            )
            
            # 4. Insert notification for user
            cursor.execute(
                """INSERT INTO notifications (user_id, title, message, type, is_read)
                   VALUES (%s, 'Receipt Uploaded', %s, 'fine', 0)""",
                (user_id, f"Your payment receipt for transaction {txn_ref} has been uploaded and is pending verification.")
            )
            
        db.commit()
        return {
            "status": "success",
            "message": "Payment receipt uploaded successfully. Awaiting administrator approval.",
            "transaction_reference": txn_ref
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/borrow/payments")
def get_payments(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    with db.cursor() as cursor:
        sql = """
            SELECT p.payment_id, p.amount_paid, p.payment_method, p.status, 
                   p.transaction_reference, p.receipt_image_path, p.paid_at,
                   b.title as book_title
            FROM payments p
            JOIN fines f ON p.fine_id = f.fine_id
            JOIN borrow_records br ON f.borrow_id = br.borrow_id
            JOIN books b ON br.book_id = b.book_id
            WHERE p.user_id = %s
            ORDER BY p.paid_at DESC
        """
        cursor.execute(sql, (user_id,))
        payments = cursor.fetchall()
        
        # Format datetimes
        for p in payments:
            if isinstance(p['paid_at'], datetime):
                p['paid_at'] = p['paid_at'].isoformat()
                
    return {"status": "success", "payments": payments}


@router.get("/borrow/unpaid-fines")
def get_unpaid_fines(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    from routers.admin import calculate_dynamic_fine
    with db.cursor() as cursor:
        cursor.execute("SELECT setting_key, setting_value FROM library_settings")
        settings = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}
        fine_per_day = float(settings.get('fine_per_day', '0.50'))
        exempt_days_str = settings.get('exempt_days', '')
        exempt_days_list = [int(x.strip()) for x in exempt_days_str.split(',')] if exempt_days_str else []

        cursor.execute("SELECT start_date, end_date FROM excluded_date_ranges")
        ranges = cursor.fetchall()
        excluded_ranges = [(r['start_date'], r['end_date']) for r in ranges]

        cursor.execute(
            """SELECT br.borrow_id, br.user_id, br.book_id, br.borrow_date, br.due_date, br.return_date, 
                      br.status, br.fine_amount, br.fine_paid, b.title as book_title, b.author
               FROM borrow_records br
               JOIN books b ON br.book_id = b.book_id
               WHERE br.user_id = %s AND br.fine_paid = FALSE AND (br.fine_amount > 0 OR br.status = 'overdue')""",
            (user_id,)
        )
        unpaid = cursor.fetchall()
        
        filtered_unpaid = []
        for f in unpaid:
            new_fine, new_status = calculate_dynamic_fine(cursor, f, fine_per_day, exempt_days_list, excluded_ranges)
            f['fine_amount'] = new_fine
            f['status'] = new_status
            
            if f['fine_amount'] > 0:
                filtered_unpaid.append({
                    'borrow_id': f['borrow_id'],
                    'fine_amount': f['fine_amount'],
                    'book_title': f['book_title'],
                    'author': f['author']
                })
        db.commit()
    return {"status": "success", "fines": filtered_unpaid}

@router.post("/borrow/reviews")
def add_book_review(req: BookReviewRequest, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    rating = req.rating
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
    try:
        with db.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) as count FROM borrow_records WHERE user_id = %s AND book_id = %s",
                (user_id, req.book_id)
            )
            count_res = cursor.fetchone()
            if not count_res or count_res['count'] == 0:
                raise HTTPException(
                    status_code=403, 
                    detail="You can only review books that you have borrowed previously"
                )
                
            cursor.execute(
                """INSERT INTO reviews (user_id, book_id, rating, review_text)
                   VALUES (%s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE rating = VALUES(rating), review_text = VALUES(review_text)""",
                (user_id, req.book_id, rating, req.review_text)
            )
        db.commit()
        return {"status": "success", "message": "Review submitted successfully"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

