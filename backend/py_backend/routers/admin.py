from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from database import get_db
from auth import verify_password, create_access_token, get_current_user, get_password_hash
import secrets
import string

router = APIRouter()

class UpdateSettingsRequest(BaseModel):
    fine_per_day: Optional[str] = None
    exempt_days: Optional[str] = None

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AddUserRequest(BaseModel):
    student_id: str
    full_name: str
    email: str
    password: Optional[str] = None

class PasswordResetRequest(BaseModel):
    new_password: Optional[str] = None

class BookCopyInput(BaseModel):
    barcode: str
    isbn: Optional[str] = None

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
    copies: Optional[List[BookCopyInput]] = []

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
    copies: Optional[List[BookCopyInput]] = None

class CirculationCheckoutRequest(BaseModel):
    student_id: str
    book_id: int
    due_date: Optional[str] = None
    barcode: Optional[str] = None

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

@router.get("/admin/settings")
def get_settings(admin = Depends(get_admin_user), db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT setting_key, setting_value FROM library_settings")
        settings = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}
    return {"status": "success", "settings": settings}

@router.put("/admin/settings")
def update_settings(req: UpdateSettingsRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            if req.fine_per_day is not None:
                cursor.execute("UPDATE library_settings SET setting_value = %s WHERE setting_key = 'fine_per_day'", (req.fine_per_day,))
            if req.exempt_days is not None:
                cursor.execute("UPDATE library_settings SET setting_value = %s WHERE setting_key = 'exempt_days'", (req.exempt_days,))
        db.commit()
        return {"status": "success", "message": "Settings updated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/books")
def add_book(req: AddBookRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    # Calculate copies from req.copies if provided, else use the request values
    total_copies = len(req.copies) if req.copies else req.total_copies
    available_copies = req.available_copies if req.available_copies is not None else total_copies
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
                 req.cover_image_path, req.cover_image_url, added_by_id, total_copies,
                 available_copies, req.location_id, req.synopsis)
            )
            book_id = cursor.lastrowid
            
            if req.category_ids:
                for cat_id in req.category_ids:
                    cursor.execute("INSERT IGNORE INTO book_categories (book_id, category_id) VALUES (%s, %s)", (book_id, cat_id))
                    
            # Insert individual copies
            if req.copies:
                for copy in req.copies:
                    clean_barcode = copy.barcode.strip()
                    if clean_barcode:
                        cursor.execute(
                            "INSERT INTO book_copies (book_id, barcode, isbn, status, `condition`) VALUES (%s, %s, %s, %s, %s)",
                            (book_id, clean_barcode, copy.isbn, 'available', 'Good')
                        )
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
    copies = update_data.pop('copies', None)

    for key, value in update_data.items():
        updates.append(f"{key} = %s")
        params.append(value)
        
    if not updates and category_ids is None and copies is None:
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
                    
            if copies is not None:
                cursor.execute("SELECT barcode FROM book_copies WHERE book_id = %s", (book_id,))
                current_barcodes = {row['barcode'] for row in cursor.fetchall()}
                new_copies_map = {c.barcode.strip(): c.isbn for c in copies if c.barcode.strip()}
                new_barcodes = set(new_copies_map.keys())
                
                # Add new barcodes
                to_add = new_barcodes - current_barcodes
                for bc in to_add:
                    cursor.execute(
                        "INSERT IGNORE INTO book_copies (book_id, barcode, isbn, status, `condition`) VALUES (%s, %s, %s, %s, %s)",
                        (book_id, bc, new_copies_map[bc], 'available', 'Good')
                    )
                
                # Update existing barcodes with new ISBNs if they changed
                to_update = current_barcodes.intersection(new_barcodes)
                for bc in to_update:
                    cursor.execute(
                        "UPDATE book_copies SET isbn = %s WHERE book_id = %s AND barcode = %s",
                        (new_copies_map[bc], book_id, bc)
                    )
                
                # Remove removed barcodes (only if they have no borrow records, else mark as maintenance)
                to_remove = current_barcodes - new_barcodes
                for bc in to_remove:
                    cursor.execute("SELECT copy_id FROM book_copies WHERE barcode = %s AND book_id = %s", (bc, book_id))
                    copy_row = cursor.fetchone()
                    if copy_row:
                        cursor.execute("SELECT borrow_id FROM borrow_records WHERE copy_id = %s LIMIT 1", (copy_row['copy_id'],))
                        if cursor.fetchone():
                            cursor.execute("UPDATE book_copies SET status = 'maintenance' WHERE copy_id = %s", (copy_row['copy_id'],))
                        else:
                            cursor.execute("DELETE FROM book_copies WHERE copy_id = %s", (copy_row['copy_id'],))

                # Update total copies in the books table to match the new count
                cursor.execute("SELECT COUNT(*) as count FROM book_copies WHERE book_id = %s", (book_id,))
                count_row = cursor.fetchone()
                if count_row:
                    cursor.execute("UPDATE books SET total_copies = %s WHERE book_id = %s", (count_row['count'], book_id))

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
        
        # Fetch available barcodes for physical copies
        cursor.execute("SELECT book_id, barcode, isbn FROM book_copies WHERE status = 'available'")
        available_copies = cursor.fetchall()
        
        # Group barcodes by book_id
        copies_map = {}
        for row in available_copies:
            b_id = row['book_id']
            if b_id not in copies_map:
                copies_map[b_id] = []
            copies_map[b_id].append({'barcode': row['barcode'], 'isbn': row['isbn']})
            
        # Attach barcodes to the book payloads
        for book in books:
            book['copies'] = copies_map.get(book['book_id'], [])
            
    return {"status": "success", "books": books}

@router.get("/admin/users")
def all_users(admin = Depends(get_admin_user), db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute(
            "SELECT user_id, student_id, full_name, email, account_status, created_at FROM users ORDER BY created_at DESC"
        )
        users = cursor.fetchall()
    return {"status": "success", "users": users}

@router.post("/admin/users")
@router.post("/admin/users/")
def add_user(req: AddUserRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    plain_password = req.password
    if not plain_password:
        plain_password = f"{req.student_id}@123"
        
    hashed_password = get_password_hash(plain_password)
    
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT user_id FROM users WHERE student_id = %s OR email = %s", (req.student_id, req.email))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="User with this student_id or email already exists")
                
            cursor.execute(
                """INSERT INTO users (student_id, full_name, email, password_hash, account_status) 
                   VALUES (%s, %s, %s, %s, 'active')""",
                (req.student_id, req.full_name, req.email, hashed_password)
            )
            user_id = cursor.lastrowid
        db.commit()
        
        return {
            "status": "success", 
            "message": "User created successfully",
            "user_id": user_id,
            "student_id": req.student_id,
            "full_name": req.full_name,
            "email": req.email,
            "plain_password": plain_password
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/admin/users/{user_id}/toggle")
@router.put("/admin/users/{user_id}/toggle/")
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

@router.put("/admin/users/{user_id}/reset-password")
@router.put("/admin/users/{user_id}/reset-password/")
def reset_password(user_id: int, req: PasswordResetRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="User not found")
                
            plain_password = req.new_password
            if not plain_password:
                alphabet = string.ascii_letters + string.digits
                plain_password = ''.join(secrets.choice(alphabet) for i in range(8))
                
            hashed_password = get_password_hash(plain_password)
            
            cursor.execute("UPDATE users SET password_hash = %s WHERE user_id = %s", (hashed_password, user_id))
            
        db.commit()
        return {
            "status": "success", 
            "message": "Password reset successfully", 
            "plain_password": plain_password
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/users/{user_id}")
@router.get("/admin/users/{user_id}/")
def get_user_details(user_id: int, admin = Depends(get_admin_user), db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute(
            "SELECT user_id, student_id, full_name, email, account_status, created_at FROM users WHERE user_id = %s",
            (user_id,)
        )
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        cursor.execute(
            """SELECT br.borrow_id, br.book_id, b.title, b.author, 
                      br.borrow_date, br.due_date, br.return_date, 
                      br.status, br.fine_amount, br.fine_paid 
               FROM borrow_records br 
               JOIN books b ON br.book_id = b.book_id 
               WHERE br.user_id = %s 
               ORDER BY br.borrow_date DESC""",
            (user_id,)
        )
        borrowing_history = cursor.fetchall()
        
        # Calculate stats
        total_borrowed = len(borrowing_history)
        currently_overdue = sum(1 for r in borrowing_history if r['status'] == 'overdue')
        unpaid_fines = sum(float(r['fine_amount']) for r in borrowing_history if r['fine_amount'] is not None and not r['fine_paid'])
        
    return {
        "status": "success",
        "user": user,
        "borrowing_history": borrowing_history,
        "stats": {
            "total_borrowed": total_borrowed,
            "currently_overdue": currently_overdue,
            "unpaid_fines": unpaid_fines
        }
    }

@router.get("/admin/fines")
def get_all_fines(admin = Depends(get_admin_user), db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT br.borrow_id, br.user_id, br.book_id, b.title, u.student_id, u.full_name,
                      br.borrow_date, br.due_date, br.return_date, 
                      br.status, br.fine_amount, br.fine_paid 
               FROM borrow_records br 
               JOIN books b ON br.book_id = b.book_id
               JOIN users u ON br.user_id = u.user_id
               WHERE br.fine_amount > 0
               ORDER BY br.borrow_date DESC"""
        )
        fines = cursor.fetchall()
    return {"status": "success", "fines": fines}

@router.delete("/admin/users/{user_id}")
@router.delete("/admin/users/{user_id}/")
def delete_user(user_id: int, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        import time
        timestamp = int(time.time())
        with db.cursor() as cursor:
            cursor.execute("SELECT student_id, email FROM users WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
                
            # Check for unreturned books
            cursor.execute("SELECT COUNT(*) as count FROM borrow_records WHERE user_id = %s AND status IN ('borrowed', 'overdue')", (user_id,))
            active_borrows = cursor.fetchone()
            unreturned_books = active_borrows['count'] if active_borrows else 0
                
            # Check for unpaid fines
            cursor.execute("SELECT SUM(fine_amount) as total_fines FROM borrow_records WHERE user_id = %s AND fine_paid = 0 AND fine_amount > 0", (user_id,))
            fines_record = cursor.fetchone()
            unpaid_fines = float(fines_record['total_fines']) if fines_record and fines_record['total_fines'] else 0.0

            if unreturned_books > 0 or unpaid_fines > 0:
                raise HTTPException(status_code=400, detail={
                    "error": "deletion_blocked",
                    "unreturned_books": unreturned_books,
                    "unpaid_fines": unpaid_fines
                })
                
            new_student_id = f"{user['student_id']}_del_{timestamp}"
            new_email = f"{user['email']}_del_{timestamp}"
            
            cursor.execute("""
                UPDATE users 
                SET account_status = 'deleted', 
                    student_id = %s, 
                    email = %s 
                WHERE user_id = %s
            """, (new_student_id, new_email, user_id))
            
        db.commit()
        return {
            "status": "success", 
            "message": "User permanently deleted and ID freed up for reuse"
        }
    except HTTPException:
        db.rollback()
        raise
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

def calculate_dynamic_fine(cursor, borrow_record, fine_per_day, exempt_days_list):
    status = borrow_record['status']
    due_date = borrow_record['due_date']
    fine_amount = borrow_record['fine_amount']
    
    if status not in ('borrowed', 'overdue') or not due_date:
        return fine_amount, status
        
    if isinstance(due_date, str):
        due_date = datetime.strptime(due_date, '%Y-%m-%d').date()
        
    today = datetime.now().date()
    days_overdue = (today - due_date).days
    
    if days_overdue > 0:
        if exempt_days_list:
            current_date = due_date + timedelta(days=1)
            exempt_count = 0
            while current_date <= today:
                if current_date.weekday() in exempt_days_list:
                    exempt_count += 1
                current_date += timedelta(days=1)
            days_overdue -= exempt_count
            days_overdue = max(0, days_overdue)
            
        calculated_fine = round(days_overdue * fine_per_day, 2)
        
        if status != 'overdue' or float(fine_amount or 0) != calculated_fine:
            cursor.execute(
                "UPDATE borrow_records SET status = 'overdue', fine_amount = %s WHERE borrow_id = %s",
                (calculated_fine, borrow_record['borrow_id'])
            )
        return calculated_fine, 'overdue'
    return fine_amount, status

@router.get("/admin/borrows")
def all_borrows(admin = Depends(get_admin_user), db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT setting_key, setting_value FROM library_settings")
        settings = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}
        fine_per_day = float(settings.get('fine_per_day', '0.50'))
        exempt_days_str = settings.get('exempt_days', '')
        exempt_days_list = [int(x.strip()) for x in exempt_days_str.split(',')] if exempt_days_str else []

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
            new_fine, new_status = calculate_dynamic_fine(cursor, r, fine_per_day, exempt_days_list)
            r['fine_amount'] = new_fine
            r['status'] = new_status

            if r['borrow_date']: r['borrow_date'] = str(r['borrow_date'])
            if r['due_date']: r['due_date'] = str(r['due_date'])
            if r['return_date']: r['return_date'] = str(r['return_date'])
            
        db.commit()
            
    return {"status": "success", "borrows": records}

@router.put("/admin/borrows/{borrow_id}/return")
def return_borrow(borrow_id: int, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT borrow_id, book_id, status, due_date, fine_amount, copy_id FROM borrow_records WHERE borrow_id = %s", (borrow_id,))
            record = cursor.fetchone()
            if not record:
                raise HTTPException(status_code=404, detail="Borrow record not found")
            if record['status'] == 'returned':
                raise HTTPException(status_code=400, detail="Book is already returned")
                
            cursor.execute("SELECT setting_key, setting_value FROM library_settings")
            settings = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}
            fine_per_day = float(settings.get('fine_per_day', '0.50'))
            exempt_days_str = settings.get('exempt_days', '')
            exempt_days_list = [int(x.strip()) for x in exempt_days_str.split(',')] if exempt_days_str else []
            
            final_fine, _ = calculate_dynamic_fine(cursor, record, fine_per_day, exempt_days_list)
            if final_fine is None: final_fine = 0.00
                
            cursor.execute(
                "UPDATE borrow_records SET status = 'returned', return_date = CURDATE(), fine_amount = %s, fine_paid = FALSE WHERE borrow_id = %s",
                (final_fine, borrow_id)
            )
            
            cursor.execute(
                """UPDATE book_copies bc
                   JOIN borrow_records br ON bc.copy_id = br.copy_id
                   SET bc.status = 'available'
                   WHERE br.borrow_id = %s""",
                (borrow_id,)
            )
            cursor.execute("UPDATE books SET availability_status = 'available', available_copies = available_copies + 1 WHERE book_id = %s", (record['book_id'],))
            
            # User rank update
            cursor.execute("SELECT COUNT(*) as count FROM borrow_records WHERE user_id = (SELECT user_id FROM borrow_records WHERE borrow_id = %s)", (borrow_id,))
            total_borrowed = cursor.fetchone()['count']
            if total_borrowed >= 15:
                cursor.execute("UPDATE users SET member_rank = 'Gold', badge_icon = 'emoji_events' WHERE user_id = (SELECT user_id FROM borrow_records WHERE borrow_id = %s)", (borrow_id,))
            elif total_borrowed >= 5:
                cursor.execute("UPDATE users SET member_rank = 'Silver', badge_icon = 'star' WHERE user_id = (SELECT user_id FROM borrow_records WHERE borrow_id = %s)", (borrow_id,))
                
        db.commit()
        return {"status": "success", "message": "Book returned successfully"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/admin/borrows/{borrow_id}/pay-fine")
def pay_fine(borrow_id: int, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT fine_amount, fine_paid, status, book_id, copy_id FROM borrow_records WHERE borrow_id = %s", (borrow_id,))
            record = cursor.fetchone()
            if not record:
                raise HTTPException(status_code=404, detail="Borrow record not found")
            if float(record['fine_amount']) <= 0:
                raise HTTPException(status_code=400, detail="No fine associated with this record")
            if record['fine_paid']:
                raise HTTPException(status_code=400, detail="Fine is already paid")
                
            cursor.execute("UPDATE borrow_records SET fine_paid = 1 WHERE borrow_id = %s", (borrow_id,))
            
            if record['status'] != 'returned':
                cursor.execute("UPDATE borrow_records SET status = 'returned', return_date = CURDATE() WHERE borrow_id = %s", (borrow_id,))
                if record['copy_id']:
                    cursor.execute("UPDATE book_copies SET status = 'available' WHERE copy_id = %s", (record['copy_id'],))
                cursor.execute("UPDATE books SET availability_status = 'available', available_copies = available_copies + 1 WHERE book_id = %s", (record['book_id'],))
                
        db.commit()
        return {"status": "success", "message": "Fine marked as paid"}
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
            
            # Find an available copy
            if req.barcode:
                cursor.execute("SELECT copy_id FROM book_copies WHERE book_id = %s AND barcode = %s AND status = 'available' LIMIT 1", (req.book_id, req.barcode))
            else:
                cursor.execute("SELECT copy_id FROM book_copies WHERE book_id = %s AND status = 'available' LIMIT 1", (req.book_id,))
            copy = cursor.fetchone()
            if not copy:
                raise HTTPException(status_code=400, detail="No available copies found with that barcode or in stock")
            copy_id = copy['copy_id']
            
            # Create record
            if req.due_date:
                due_date_str = req.due_date
            else:
                due_date_str = (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d')
            cursor.execute(
                """INSERT INTO borrow_records (user_id, book_id, copy_id, borrow_date, due_date, status)
                   VALUES (%s, %s, %s, CURDATE(), %s, 'borrowed')""",
                (user['user_id'], req.book_id, copy_id, due_date_str)
            )
            
            # Update copy status
            cursor.execute("UPDATE book_copies SET status = 'borrowed' WHERE copy_id = %s", (copy_id,))
            
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
            cursor.execute("SELECT setting_key, setting_value FROM library_settings")
            settings = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}
            fine_per_day = float(settings.get('fine_per_day', '0.50'))
            exempt_days_str = settings.get('exempt_days', '')
            exempt_days_list = [int(x.strip()) for x in exempt_days_str.split(',')] if exempt_days_str else []

            due_date = borrow['due_date']
            if isinstance(due_date, str):
                due_date = datetime.strptime(due_date, '%Y-%m-%d').date()
            today = datetime.now().date()
            days_overdue = (today - due_date).days
            
            if days_overdue > 0:
                if exempt_days_list:
                    current_date = due_date + timedelta(days=1)
                    exempt_count = 0
                    while current_date <= today:
                        if current_date.weekday() in exempt_days_list:
                            exempt_count += 1
                        current_date += timedelta(days=1)
                    days_overdue -= exempt_count
                    days_overdue = max(0, days_overdue)
                fine_amount = round(days_overdue * fine_per_day, 2)
            else:
                fine_amount = 0.00
            
            # Update record
            cursor.execute(
                """UPDATE borrow_records
                   SET status = 'returned', return_date = CURDATE(), fine_amount = %s, fine_paid = FALSE
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
