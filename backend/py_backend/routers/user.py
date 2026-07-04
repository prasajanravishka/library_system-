from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from database import get_db
from auth import verify_password, create_access_token, get_current_user

router = APIRouter()

@router.get("/test_users")
def test_users(db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT user_id, student_id, full_name FROM users LIMIT 5")
        users = cursor.fetchall()
    return {
        "status": "success",
        "users": users
    }

class LoginRequest(BaseModel):
    student_id: str
    password: str

@router.post("/users/login")
def login(req: LoginRequest, db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT user_id, student_id, full_name, email, password_hash, account_status FROM users WHERE student_id = %s LIMIT 1", (req.student_id,))
        user = cursor.fetchone()
        
    if not user:
        raise HTTPException(status_code=401, detail="Invalid student ID or password")
        
    if user['account_status'] == 'suspended':
        raise HTTPException(status_code=403, detail="Account is suspended. Contact the library admin.")
        
    if not verify_password(req.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid student ID or password")
        
    from datetime import timedelta
    from auth import ACCESS_TOKEN_EXPIRE_MINUTES
    # Generate JWT
    access_token = create_access_token(
        data={"user_id": str(user['user_id']), "role": "student"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "status": "success",
        "message": "Login successful",
        "token": access_token,
        "user": {
            "user_id": user['user_id'],
            "student_id": user['student_id'],
            "full_name": user['full_name'],
            "email": user['email'],
            "role": "student"
        }
    }

@router.get("/users/profile")
def get_profile(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    
    with db.cursor() as cursor:
        cursor.execute("SELECT full_name, email, profile_image_url, rank, badge_icon, total_books_read FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        cursor.execute("SELECT COUNT(*) as count FROM borrow_records WHERE user_id = %s", (user_id,))
        total_borrowed = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM borrow_records WHERE user_id = %s AND status = 'borrowed' AND due_date < CURDATE()", (user_id,))
        total_overdue = cursor.fetchone()['count']
        
        cursor.execute("SELECT COALESCE(SUM(fine_amount), 0) as total FROM borrow_records WHERE user_id = %s AND fine_paid = FALSE AND fine_amount > 0", (user_id,))
        total_fines_pending = float(cursor.fetchone()['total'])
        
    return {
        "status": "success",
        "profile": {
            "full_name": user['full_name'],
            "email": user['email'],
            "profile_image_url": user['profile_image_url'],
            "role": "student",
            "total_borrowed": total_borrowed,
            "total_overdue": total_overdue,
            "total_fines_pending": total_fines_pending,
            "rank": user['rank'] or "Bronze",
            "badge_icon": user['badge_icon'] or "military_tech",
            "total_books_read": user['total_books_read'] or 0
        }
    }

@router.get("/books/search")
def search_books(q: str, category_id: Optional[int] = None, db = Depends(get_db)):
    query_term = f"{q}*"
    
    with db.cursor() as cursor:
        if category_id:
            sql = """
                SELECT b.book_id, b.title, b.author, b.isbn, b.publisher,
                       b.publication_year, b.language, b.total_copies, b.available_copies, b.location_id,
                       b.cover_image_path, b.cover_image_url, b.availability_status
                FROM books b
                JOIN book_categories bc ON b.book_id = bc.book_id
                WHERE bc.category_id = %s
                  AND MATCH(b.title, b.author, b.isbn) AGAINST(%s IN BOOLEAN MODE)
                ORDER BY b.title ASC
                LIMIT 50
            """
            cursor.execute(sql, (category_id, query_term))
        else:
            sql = """
                SELECT b.book_id, b.title, b.author, b.isbn, b.publisher,
                       b.publication_year, b.language, b.total_copies, b.available_copies, b.location_id,
                       b.cover_image_path, b.cover_image_url, b.availability_status
                FROM books b
                WHERE MATCH(b.title, b.author, b.isbn) AGAINST(%s IN BOOLEAN MODE)
                ORDER BY b.title ASC
                LIMIT 50
            """
            cursor.execute(sql, (query_term,))
        
        books = cursor.fetchall()
        
    return {
        "status": "success",
        "books": books
    }

@router.post("/books/{book_id}/save")
def save_book(book_id: int, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    with db.cursor() as cursor:
        try:
            cursor.execute("INSERT IGNORE INTO saved_books (user_id, book_id) VALUES (%s, %s)", (user_id, book_id))
            db.commit()
        except Exception as e:
            db.rollback()
    return {"status": "success", "message": "Book saved successfully"}

@router.delete("/books/{book_id}/save")
def unsave_book(book_id: int, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    with db.cursor() as cursor:
        cursor.execute("DELETE FROM saved_books WHERE user_id = %s AND book_id = %s", (user_id, book_id))
        db.commit()
    return {"status": "success", "message": "Book removed from saved list"}

@router.get("/users/me/saved-books")
def get_saved_books(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    with db.cursor() as cursor:
        sql = """
            SELECT b.book_id, b.title, b.author, b.isbn, b.publisher,
                   b.publication_year, b.language, b.total_copies, b.available_copies, b.location_id,
                   b.cover_image_path, b.cover_image_url, b.availability_status,
                   sb.created_at as saved_at
            FROM saved_books sb
            JOIN books b ON sb.book_id = b.book_id
            WHERE sb.user_id = %s
            ORDER BY sb.created_at DESC
        """
        cursor.execute(sql, (user_id,))
        books = cursor.fetchall()
        
    return {
        "status": "success",
        "books": books
    }
