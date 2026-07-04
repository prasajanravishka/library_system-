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
    synopsis: Optional[str] = None

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
    category_ids: Optional[List[int]] = None
    synopsis: Optional[str] = None

class CirculationCheckoutRequest(BaseModel):
    student_id: str
    book_id: int

class CirculationCheckinRequest(BaseModel):
    student_id: str
    book_id: int

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
            # Use the currently logged-in admin's ID
            added_by_id = admin.get('user_id')
            cursor.execute(
                """INSERT INTO books (title, author, isbn, publisher, publication_year, language, 
                                      cover_image_path, cover_image_url, added_by, total_copies, 
                                      available_copies, location_id, synopsis)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (req.title, req.author, req.isbn, req.publisher, req.publication_year, req.language,
                 req.cover_image_path, req.cover_image_url, added_by_id, req.total_copies,
                 available_copies, req.location_id, req.synopsis)
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
    category_ids = update_data.pop('category_ids', None)

    for key, value in update_data.items():
        updates.append(f"{key} = %s")
        params.append(value)
        
    if not updates and category_ids is None:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    try:
        with db.cursor() as cursor:
            if updates:
                params.append(book_id)
                cursor.execute(f"UPDATE books SET {', '.join(updates)} WHERE book_id = %s", tuple(params))
            
            if category_ids is not None:
                cursor.execute("DELETE FROM book_categories WHERE book_id = %s", (book_id,))
                for cat_id in category_ids:
                    cursor.execute("INSERT IGNORE INTO book_categories (book_id, category_id) VALUES (%s, %s)", (book_id, cat_id))
        db.commit()
        return {"status": "success", "message": "Book updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/admin/books/{book_id}")
def delete_book(book_id: int, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            # Check if book exists
            cursor.execute("SELECT book_id FROM books WHERE book_id = %s", (book_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Book not found")
                
            # Delete the book (cascade takes care of relations)
            cursor.execute("DELETE FROM books WHERE book_id = %s", (book_id,))
        db.commit()
        return {"status": "success", "message": "Book deleted successfully"}
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/books")
def all_books(admin = Depends(get_admin_user), db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT book_id, title, author, isbn, publisher, publication_year, language, total_copies, 
                      available_copies, location_id, cover_image_path, cover_image_url, availability_status, added_at, synopsis
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

class CategoryRequest(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None

@router.post("/admin/categories")
def create_category(req: CategoryRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT category_id FROM categories WHERE name = %s", (req.name,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Category name already exists")
                
            cursor.execute(
                "INSERT INTO categories (name, description, icon) VALUES (%s, %s, %s)",
                (req.name, req.description, req.icon)
            )
            category_id = cursor.lastrowid
            
            cursor.execute("SELECT category_id AS id, name, description, icon FROM categories WHERE category_id = %s", (category_id,))
            category = cursor.fetchone()
            
        db.commit()
        return {"status": "success", "message": "Category created successfully", "category": category}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/admin/categories/{category_id}")
def update_category(category_id: int, req: CategoryRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT category_id FROM categories WHERE name = %s AND category_id != %s", (req.name, category_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Category name already exists")
                
            cursor.execute(
                "UPDATE categories SET name = %s, description = %s, icon = %s WHERE category_id = %s", 
                (req.name, req.description, req.icon, category_id)
            )
            
            cursor.execute("SELECT category_id AS id, name, description, icon FROM categories WHERE category_id = %s", (category_id,))
            category = cursor.fetchone()
            if not category:
                raise HTTPException(status_code=404, detail="Category not found")
                
        db.commit()
        return {"status": "success", "message": "Category updated successfully", "category": category}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/admin/categories/{category_id}")
def delete_category(category_id: int, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM categories WHERE category_id = %s", (category_id,))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Category not found")
        db.commit()
        return {"status": "success", "message": "Category deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/borrows")
def all_borrows(admin = Depends(get_admin_user), db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT br.borrow_id, br.user_id, br.book_id, br.borrow_date, br.due_date, 
                      br.return_date, br.status, br.fine_amount, br.fine_paid,
                      b.title, b.author,
                      u.student_id, u.full_name
               FROM borrow_records br
               JOIN books b ON br.book_id = b.book_id
               JOIN users u ON br.user_id = u.user_id
               ORDER BY br.borrow_date DESC"""
        )
        records = cursor.fetchall()
        
        for r in records:
            if r['borrow_date']: r['borrow_date'] = str(r['borrow_date'])
            if r['due_date']: r['due_date'] = str(r['due_date'])
            if r['return_date']: r['return_date'] = str(r['return_date'])
            
    return {"status": "success", "borrows": records}

@router.put("/admin/borrows/{borrow_id}/return")
def return_borrow(borrow_id: int, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT book_id, status FROM borrow_records WHERE borrow_id = %s", (borrow_id,))
            record = cursor.fetchone()
            if not record:
                raise HTTPException(status_code=404, detail="Borrow record not found")
            if record['status'] == 'returned':
                raise HTTPException(status_code=400, detail="Book is already returned")
                
            cursor.execute(
                "UPDATE borrow_records SET status = 'returned', return_date = CURDATE() WHERE borrow_id = %s",
                (borrow_id,)
            )
            cursor.execute("UPDATE books SET availability_status = 'available', available_copies = available_copies + 1 WHERE book_id = %s", (record['book_id'],))
        db.commit()
        return {"status": "success", "message": "Book returned successfully"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

from datetime import datetime, timedelta

@router.post("/admin/circulation/checkout")
def circulation_checkout(req: CirculationCheckoutRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            # Check user
            cursor.execute("SELECT user_id, account_status FROM users WHERE student_id = %s", (req.student_id,))
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="Student not found")
            if user['account_status'] != 'active':
                raise HTTPException(status_code=400, detail="Student account is suspended")
            
            # Check unpaid fines
            cursor.execute("SELECT SUM(fine_amount) as total_fine FROM borrow_records WHERE user_id = %s AND fine_paid = 0", (user['user_id'],))
            fine_record = cursor.fetchone()
            if fine_record and fine_record['total_fine'] and fine_record['total_fine'] > 0:
                raise HTTPException(status_code=400, detail=f"Student has unpaid fines (${float(fine_record['total_fine']):.2f})")
            
            # Check book
            cursor.execute("SELECT availability_status, available_copies FROM books WHERE book_id = %s", (req.book_id,))
            book = cursor.fetchone()
            if not book:
                raise HTTPException(status_code=404, detail="Book not found")
            if book['available_copies'] <= 0 or book['availability_status'] != 'available':
                raise HTTPException(status_code=400, detail="Book is out of stock or not available")
            
            # Create record
            due_date_str = (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d')
            cursor.execute(
                """INSERT INTO borrow_records (user_id, book_id, borrow_date, due_date, status)
                   VALUES (%s, %s, CURDATE(), %s, 'borrowed')""",
                (user['user_id'], req.book_id, due_date_str)
            )
            
            # Update book
            new_available = book['available_copies'] - 1
            new_status = 'borrowed' if new_available == 0 else 'available'
            cursor.execute("UPDATE books SET availability_status = %s, available_copies = %s WHERE book_id = %s", (new_status, new_available, req.book_id))
            
        db.commit()
        return {"status": "success", "message": "Book checked out successfully"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/circulation/checkin")
def circulation_checkin(req: CirculationCheckinRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            # Find user
            cursor.execute("SELECT user_id FROM users WHERE student_id = %s", (req.student_id,))
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="Student not found")
                
            # Find active borrow record
            cursor.execute(
                """SELECT borrow_id, due_date FROM borrow_records
                   WHERE user_id = %s AND book_id = %s AND status IN ('borrowed', 'overdue')
                   ORDER BY borrow_date DESC LIMIT 1""",
                (user['user_id'], req.book_id)
            )
            borrow = cursor.fetchone()
            
            if not borrow:
                raise HTTPException(status_code=400, detail="No active borrow record found for this student and book")
                
            # Calculate fine
            fine_per_day = 0.50
            due_date = borrow['due_date']
            if isinstance(due_date, str):
                due_date = datetime.strptime(due_date, '%Y-%m-%d').date()
            today = datetime.now().date()
            days_overdue = (today - due_date).days
            fine_amount = round(days_overdue * fine_per_day, 2) if days_overdue > 0 else 0.00
            
            # Update record
            cursor.execute(
                """UPDATE borrow_records
                   SET status = 'returned', return_date = CURDATE(), fine_amount = %s, fine_paid = FALSE
                   WHERE borrow_id = %s""",
                (fine_amount, borrow['borrow_id'])
            )
            
            # Update book
            cursor.execute("UPDATE books SET availability_status = 'available', available_copies = available_copies + 1 WHERE book_id = %s", (req.book_id,))
        db.commit()
        return {"status": "success", "message": "Book checked in successfully"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class TicketUpdate(BaseModel):
    status: str

@router.get("/admin/tickets")
def all_tickets(admin = Depends(get_admin_user), db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT t.ticket_id, t.user_id, t.subject, t.message, t.status, t.created_at, t.updated_at,
                      u.student_id, u.full_name
               FROM support_tickets t
               JOIN users u ON t.user_id = u.user_id
               ORDER BY t.created_at DESC"""
        )
        tickets = cursor.fetchall()
    return {"status": "success", "tickets": tickets}

@router.put("/admin/tickets/{ticket_id}")
def update_ticket(ticket_id: int, req: TicketUpdate, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute("UPDATE support_tickets SET status = %s WHERE ticket_id = %s", (req.status, ticket_id))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Ticket not found")
        db.commit()
        return {"status": "success", "message": "Ticket status updated successfully"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
