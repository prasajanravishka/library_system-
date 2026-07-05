from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from database import get_db
from auth import get_current_user
import math

router = APIRouter()

class BorrowRequest(BaseModel):
    book_id: int

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
                
            # Calculate fine if overdue ($0.50 per day)
            fine_per_day = 0.50
            due_date = borrow['due_date']
            if isinstance(due_date, str):
                due_date = datetime.strptime(due_date, '%Y-%m-%d').date()
            
            today = datetime.now().date()
            days_overdue = (today - due_date).days
            fine_amount = round(days_overdue * fine_per_day, 2) if days_overdue > 0 else 0.00
            
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
            response["fine_message"] = f"Overdue fine of ${fine_amount} has been applied."
            
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

