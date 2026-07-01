from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from database import get_db
from auth import verify_password, create_access_token, get_current_user

router = APIRouter()

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AddBookRequest(BaseModel):
    title: str
    author: Optional[str] = ""
    isbn: Optional[str] = None
    publisher: Optional[str] = ""
    publication_year: Optional[int] = None
    language: Optional[str] = "English"
    cover_image_path: Optional[str] = ""
    cover_image_url: Optional[str] = ""
    added_by: Optional[int] = None
    total_copies: Optional[int] = 1
    available_copies: Optional[int] = None
    location_id: Optional[int] = None
    category_ids: Optional[List[int]] = []

class UpdateBookRequest(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    language: Optional[str] = None
    total_copies: Optional[int] = None
    available_copies: Optional[int] = None
    location_id: Optional[int] = None

def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'librarian':
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.post("/admin/login")
def admin_login(req: AdminLoginRequest, db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute(
            "SELECT admin_id, username, full_name, email, password_hash FROM admins WHERE username = %s LIMIT 1",
            (req.username,)
        )
        admin = cursor.fetchone()
        
    if not admin or not verify_password(req.password, admin['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    access_token = create_access_token(data={"user_id": str(admin['admin_id']), "role": "librarian"})
    
    return {
        "status": "success",
        "message": "Login successful",
        "token": access_token,
        "user": {
            "user_id": admin['admin_id'],
            "student_id": admin['username'],
            "full_name": admin['full_name'],
            "email": admin['email'],
            "role": "librarian"
        }
    }

@router.post("/admin/books")
def add_book(req: AddBookRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    available_copies = req.available_copies if req.available_copies is not None else req.total_copies
    try:
        with db.cursor() as cursor:
            cursor.execute(
                """INSERT INTO books (title, author, isbn, publisher, publication_year, language, 
                                      cover_image_path, cover_image_url, added_by, total_copies, 
                                      available_copies, location_id)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (req.title, req.author, req.isbn, req.publisher, req.publication_year, req.language,
                 req.cover_image_path, req.cover_image_url, req.added_by, req.total_copies,
                 available_copies, req.location_id)
            )
            book_id = cursor.lastrowid
            
            if req.category_ids:
                for cat_id in req.category_ids:
                    cursor.execute("INSERT IGNORE INTO book_categories (book_id, category_id) VALUES (%s, %s)", (book_id, cat_id))
        db.commit()
        return {"status": "success", "message": "Book added successfully", "book_id": book_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/admin/books/{book_id}")
def update_book(book_id: int, req: UpdateBookRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    updates = []
    params = []
    
    update_data = req.dict(exclude_unset=True)
    for key, value in update_data.items():
        updates.append(f"{key} = %s")
        params.append(value)
        
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    params.append(book_id)
    try:
        with db.cursor() as cursor:
            cursor.execute(f"UPDATE books SET {', '.join(updates)} WHERE book_id = %s", tuple(params))
        db.commit()
        return {"status": "success", "message": "Book updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/books")
def all_books(admin = Depends(get_admin_user), db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT book_id, title, author, isbn, publisher, publication_year, language, total_copies, 
                      available_copies, location_id, cover_image_path, cover_image_url, availability_status, added_at
               FROM books ORDER BY added_at DESC"""
        )
        books = cursor.fetchall()
    return {"status": "success", "books": books}

@router.get("/admin/users")
def all_users(admin = Depends(get_admin_user), db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute(
            "SELECT user_id, student_id, full_name, email, account_status, created_at FROM users ORDER BY created_at DESC"
        )
        users = cursor.fetchall()
    return {"status": "success", "users": users}

@router.put("/admin/users/{user_id}/toggle")
def toggle_user(user_id: int, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT account_status FROM users WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
                
            new_status = 'suspended' if user['account_status'] == 'active' else 'active'
            cursor.execute("UPDATE users SET account_status = %s WHERE user_id = %s", (new_status, user_id))
        db.commit()
        return {"status": "success", "message": f"User status changed to {new_status}", "new_status": new_status}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
