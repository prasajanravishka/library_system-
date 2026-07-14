from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date
from database import get_db
from auth import verify_password, create_access_token, get_current_user, get_password_hash
import secrets
import string

router = APIRouter()

class UpdateSettingsRequest(BaseModel):
    fine_per_day: Optional[str] = None
    exempt_days: Optional[str] = None

class AddVacationRequest(BaseModel):
    start_date: str
    end_date: str
    description: Optional[str] = None

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AddUserRequest(BaseModel):
    student_id: str
    full_name: str
    email: str
    password: Optional[str] = None

class EditUserRequest(BaseModel):
    student_id: str
    full_name: str
    email: str
    account_status: str

class PasswordResetRequest(BaseModel):
    new_password: Optional[str] = None

class BookCopyInput(BaseModel):
    barcode: str

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
    location_id: Optional[int] = None
    category_ids: Optional[List[int]] = []
    synopsis: Optional[str] = None
    keywords: Optional[str] = None
    copies: Optional[List[BookCopyInput]] = []

class UpdateBookRequest(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    language: Optional[str] = None
    cover_image_path: Optional[str] = None
    cover_image_url: Optional[str] = None
    total_copies: Optional[int] = None
    available_copies: Optional[int] = None
    location_id: Optional[int] = None
    category_ids: Optional[List[int]] = None
    synopsis: Optional[str] = None
    keywords: Optional[str] = None
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


@router.get("/admin/vacations")
def get_vacations(admin = Depends(get_admin_user), db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT range_id, start_date, end_date, description FROM excluded_date_ranges ORDER BY start_date ASC")
        vacations = cursor.fetchall()
        for v in vacations:
            if isinstance(v['start_date'], (datetime, date)):
                v['start_date'] = v['start_date'].isoformat()
            elif hasattr(v['start_date'], 'strftime'):
                v['start_date'] = v['start_date'].strftime('%Y-%m-%d')
            else:
                v['start_date'] = str(v['start_date'])

            if isinstance(v['end_date'], (datetime, date)):
                v['end_date'] = v['end_date'].isoformat()
            elif hasattr(v['end_date'], 'strftime'):
                v['end_date'] = v['end_date'].strftime('%Y-%m-%d')
            else:
                v['end_date'] = str(v['end_date'])
    return {"status": "success", "vacations": vacations}

@router.post("/admin/vacations")
def add_vacation(req: AddVacationRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        start = datetime.strptime(req.start_date, '%Y-%m-%d').date()
        end = datetime.strptime(req.end_date, '%Y-%m-%d').date()
        if start > end:
            raise HTTPException(status_code=400, detail="Start date must be before or equal to end date")
    except ValueError:
        raise HTTPException(status_code=400, detail="Dates must be in YYYY-MM-DD format")

    try:
        with db.cursor() as cursor:
            cursor.execute(
                "INSERT INTO excluded_date_ranges (start_date, end_date, description) VALUES (%s, %s, %s)",
                (req.start_date, req.end_date, req.description)
            )
        db.commit()
        return {"status": "success", "message": "Vacation range added successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/admin/vacations/{range_id}")
def delete_vacation(range_id: int, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT range_id FROM excluded_date_ranges WHERE range_id = %s", (range_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Vacation range not found")
            cursor.execute("DELETE FROM excluded_date_ranges WHERE range_id = %s", (range_id,))
        db.commit()
        return {"status": "success", "message": "Vacation range deleted successfully"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/books")
def add_book(req: AddBookRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    total_copies = len(req.copies) if req.copies else 0
    available_copies = total_copies
    
    isbn_clean = req.isbn.strip() if req.isbn else None
    cover_image_url = req.cover_image_url.strip() if req.cover_image_url else ""
    if not cover_image_url and isbn_clean:
        cover_image_url = f"https://covers.openlibrary.org/b/isbn/{isbn_clean}-L.jpg"

    try:
        with db.cursor() as cursor:
            # Use the currently logged-in admin's ID
            added_by_id = admin.get('user_id')
            cursor.execute(
                """INSERT INTO books (title, author, isbn, publisher, publication_year, language, 
                                      cover_image_path, cover_image_url, added_by, total_copies, 
                                      available_copies, location_id, synopsis, keywords)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (req.title, req.author, isbn_clean, req.publisher, req.publication_year, req.language,
                 req.cover_image_path, cover_image_url, added_by_id, total_copies,
                 available_copies, req.location_id, req.synopsis, req.keywords)
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
                            (book_id, clean_barcode, req.isbn, 'available', 'Good')
                        )
        db.commit()
        return {"status": "success", "message": "Book added successfully", "book_id": book_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/admin/books/{book_id}")
def update_book(book_id: int, req: UpdateBookRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    update_data = req.dict(exclude_unset=True)
    category_ids = update_data.pop('category_ids', None)
    copies = update_data.pop('copies', None)

    isbn = update_data.get('isbn')
    
    if ('cover_image_url' in update_data and not str(update_data['cover_image_url'] or '').strip()) or (isbn and 'cover_image_url' not in update_data):
        actual_isbn = isbn.strip() if isbn else None
        if not actual_isbn:
            with db.cursor() as cursor:
                cursor.execute("SELECT isbn FROM books WHERE book_id = %s", (book_id,))
                row = cursor.fetchone()
                actual_isbn = row['isbn'] if row else None
                
        if actual_isbn:
            should_update_cover = False
            if 'cover_image_url' in update_data and not str(update_data['cover_image_url'] or '').strip():
                should_update_cover = True
            else:
                with db.cursor() as cursor:
                    cursor.execute("SELECT cover_image_url FROM books WHERE book_id = %s", (book_id,))
                    row = cursor.fetchone()
                    existing_cover = row['cover_image_url'] if row else None
                    if not existing_cover or "openlibrary.org" in str(existing_cover):
                        should_update_cover = True
                        
            if should_update_cover:
                update_data['cover_image_url'] = f"https://covers.openlibrary.org/b/isbn/{actual_isbn.strip()}-L.jpg"

    updates = []
    params = []
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
                new_barcodes = {c.barcode.strip() for c in copies if c.barcode.strip()}
                
                # Fetch book's main ISBN for new copies
                book_isbn = req.isbn
                if not book_isbn:
                    cursor.execute("SELECT isbn FROM books WHERE book_id = %s", (book_id,))
                    isbn_row = cursor.fetchone()
                    book_isbn = isbn_row['isbn'] if isbn_row else None
                
                # Add new barcodes
                to_add = new_barcodes - current_barcodes
                for bc in to_add:
                    cursor.execute(
                        "INSERT IGNORE INTO book_copies (book_id, barcode, isbn, status, `condition`) VALUES (%s, %s, %s, %s, %s)",
                        (book_id, bc, book_isbn, 'available', 'Good')
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
                """INSERT INTO users (student_id, full_name, email, password_hash, is_temp_password, account_status) 
                   VALUES (%s, %s, %s, %s, 1, 'active')""",
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

@router.put("/admin/users/{user_id}")
@router.put("/admin/users/{user_id}/")
def update_user(user_id: int, req: EditUserRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            # 1. Verify user exists
            cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="User not found")
                
            # 2. Check for duplicate student_id or email among other users
            cursor.execute(
                "SELECT user_id FROM users WHERE (student_id = %s OR email = %s) AND user_id != %s",
                (req.student_id, req.email, user_id)
            )
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="User with this student_id or email already exists")
                
            # 3. Perform update
            cursor.execute(
                """UPDATE users 
                   SET student_id = %s, full_name = %s, email = %s, account_status = %s 
                   WHERE user_id = %s""",
                (req.student_id, req.full_name, req.email, req.account_status, user_id)
            )
            
            # 4. Fetch the updated user details to return in response
            cursor.execute(
                "SELECT user_id, student_id, full_name, email, account_status, created_at FROM users WHERE user_id = %s",
                (user_id,)
            )
            updated_user = cursor.fetchone()
            
        db.commit()
        return {
            "status": "success",
            "message": "User updated successfully",
            "user": updated_user
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
            
            cursor.execute("UPDATE users SET password_hash = %s, is_temp_password = 1 WHERE user_id = %s", (hashed_password, user_id))
            
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
        
        # Recalculate dynamic fines for their history
        cursor.execute("SELECT setting_key, setting_value FROM library_settings")
        settings = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}
        fine_per_day = float(settings.get('fine_per_day', '0.50'))
        exempt_days_str = settings.get('exempt_days', '')
        exempt_days_list = [int(x.strip()) for x in exempt_days_str.split(',')] if exempt_days_str else []

        cursor.execute("SELECT start_date, end_date FROM excluded_date_ranges")
        ranges = cursor.fetchall()
        excluded_ranges = [(r['start_date'], r['end_date']) for r in ranges]

        for r in borrowing_history:
            new_fine, new_status = calculate_dynamic_fine(cursor, r, fine_per_day, exempt_days_list, excluded_ranges)
            r['fine_amount'] = new_fine
            r['status'] = new_status
            
            if r['borrow_date']: r['borrow_date'] = str(r['borrow_date'])
            if r['due_date']: r['due_date'] = str(r['due_date'])
            if r['return_date']: r['return_date'] = str(r['return_date'])

        # Calculate stats
        total_borrowed = len(borrowing_history)
        currently_overdue = sum(1 for r in borrowing_history if r['status'] == 'overdue')
        unpaid_fines = sum(float(r['fine_amount']) for r in borrowing_history if r['fine_amount'] is not None and not r['fine_paid'])
        
        db.commit()
        
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
        cursor.execute("SELECT setting_key, setting_value FROM library_settings")
        settings = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}
        fine_per_day = float(settings.get('fine_per_day', '0.50'))
        exempt_days_str = settings.get('exempt_days', '')
        exempt_days_list = [int(x.strip()) for x in exempt_days_str.split(',')] if exempt_days_str else []

        cursor.execute("SELECT start_date, end_date FROM excluded_date_ranges")
        ranges = cursor.fetchall()
        excluded_ranges = [(r['start_date'], r['end_date']) for r in ranges]

        cursor.execute(
            """SELECT br.borrow_id, br.user_id, br.book_id, b.title, u.student_id, u.full_name,
                      br.borrow_date, br.due_date, br.return_date, 
                      br.status, br.fine_amount, br.fine_paid 
               FROM borrow_records br 
               JOIN books b ON br.book_id = b.book_id
               JOIN users u ON br.user_id = u.user_id
               WHERE br.fine_amount > 0 OR br.status = 'overdue'
               ORDER BY br.borrow_date DESC"""
        )
        fines = cursor.fetchall()
        
        for f in fines:
            new_fine, new_status = calculate_dynamic_fine(cursor, f, fine_per_day, exempt_days_list, excluded_ranges)
            f['fine_amount'] = new_fine
            f['status'] = new_status
            
            if f['borrow_date']: f['borrow_date'] = str(f['borrow_date'])
            if f['due_date']: f['due_date'] = str(f['due_date'])
            if f['return_date']: f['return_date'] = str(f['return_date'])
            
        db.commit()
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
    code_range: Optional[str] = None
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
                "INSERT INTO categories (name, code_range, description, icon) VALUES (%s, %s, %s, %s)",
                (req.name, req.code_range, req.description, req.icon)
            )
            category_id = cursor.lastrowid
            
            cursor.execute("SELECT category_id AS id, name, code_range, description, icon FROM categories WHERE category_id = %s", (category_id,))
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
                "UPDATE categories SET name = %s, code_range = %s, description = %s, icon = %s WHERE category_id = %s", 
                (req.name, req.code_range, req.description, req.icon, category_id)
            )
            
            cursor.execute("SELECT category_id AS id, name, code_range, description, icon FROM categories WHERE category_id = %s", (category_id,))
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

def calculate_dynamic_fine(cursor, borrow_record, fine_per_day, exempt_days_list, excluded_ranges=None):
    status = borrow_record['status']
    due_date = borrow_record['due_date']
    fine_amount = borrow_record['fine_amount']
    fine_paid = borrow_record.get('fine_paid', False)
    
    is_active = status in ('borrowed', 'overdue')
    is_unpaid = not fine_paid
    
    # We only recalculate active borrows, or returned borrows that are not yet paid
    if (not is_active and not (status == 'returned' and is_unpaid)) or not due_date:
        return fine_amount, status
        
    if isinstance(due_date, str):
        due_date = datetime.strptime(due_date, '%Y-%m-%d').date()
        
    return_date = borrow_record.get('return_date')
    if isinstance(return_date, str):
        return_date = datetime.strptime(return_date, '%Y-%m-%d').date()
    elif isinstance(return_date, datetime):
        return_date = return_date.date()
        
    today = datetime.now().date()
    end_date = return_date if return_date else today
    days_overdue = (end_date - due_date).days
    
    if days_overdue > 0:
        if excluded_ranges is None:
            cursor.execute("SELECT start_date, end_date FROM excluded_date_ranges")
            ranges = cursor.fetchall()
            excluded_ranges = [(r['start_date'], r['end_date']) for r in ranges]

        current_date = due_date + timedelta(days=1)
        exempt_count = 0
        while current_date <= end_date:
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
            
        calculated_fine = round(days_overdue * fine_per_day, 2)
        
        # If the fine amount has changed or status of an active overdue borrow needs updating, save it in the database
        current_fine_val = float(fine_amount or 0)
        new_status = 'overdue' if is_active else status
        if current_fine_val != calculated_fine or status != new_status:
            cursor.execute(
                "UPDATE borrow_records SET status = %s, fine_amount = %s WHERE borrow_id = %s",
                (new_status, calculated_fine, borrow_record['borrow_id'])
            )
            # Update corresponding fine in fines table if it exists
            cursor.execute("SELECT fine_id FROM fines WHERE borrow_id = %s LIMIT 1", (borrow_record['borrow_id'],))
            fine_row = cursor.fetchone()
            if fine_row:
                cursor.execute(
                    "UPDATE fines SET amount = %s WHERE fine_id = %s",
                    (calculated_fine, fine_row['fine_id'])
                )
        
        return calculated_fine, new_status
    else:
        # If overdue days are 0 or less, the fine should be 0.00
        if float(fine_amount or 0) != 0.00:
            cursor.execute(
                "UPDATE borrow_records SET fine_amount = 0.00 WHERE borrow_id = %s",
                (borrow_record['borrow_id'],)
            )
            cursor.execute("SELECT fine_id FROM fines WHERE borrow_id = %s LIMIT 1", (borrow_record['borrow_id'],))
            fine_row = cursor.fetchone()
            if fine_row:
                cursor.execute(
                    "UPDATE fines SET amount = 0.00 WHERE fine_id = %s",
                    (fine_row['fine_id'],)
                )
        return 0.00, status

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
        cursor.execute("SELECT start_date, end_date FROM excluded_date_ranges")
        ranges = cursor.fetchall()
        excluded_ranges = [(r['start_date'], r['end_date']) for r in ranges]

        for r in records:
            new_fine, new_status = calculate_dynamic_fine(cursor, r, fine_per_day, exempt_days_list, excluded_ranges)
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
                raise HTTPException(status_code=400, detail=f"Student has unpaid fines (LKR {float(fine_record['total_fine']):.2f})")
            
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

            cursor.execute("SELECT start_date, end_date FROM excluded_date_ranges")
            ranges = cursor.fetchall()
            excluded_ranges = [(r['start_date'], r['end_date']) for r in ranges]

            due_date = borrow['due_date']
            if isinstance(due_date, str):
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


class PaymentActionRequest(BaseModel):
    action: str

@router.get("/admin/payments")
def get_all_payments(admin = Depends(get_admin_user), db = Depends(get_db)):
    with db.cursor() as cursor:
        sql = """
            SELECT p.payment_id, p.amount_paid, p.payment_method, p.status, 
                   p.transaction_reference, p.receipt_image_path, p.paid_at,
                   u.student_id, u.full_name as student_name, b.title as book_title
            FROM payments p
            JOIN users u ON p.user_id = u.user_id
            JOIN fines f ON p.fine_id = f.fine_id
            JOIN borrow_records br ON f.borrow_id = br.borrow_id
            JOIN books b ON br.book_id = b.book_id
            ORDER BY p.paid_at DESC
        """
        cursor.execute(sql)
        payments = cursor.fetchall()
        for p in payments:
            if isinstance(p['paid_at'], datetime):
                p['paid_at'] = p['paid_at'].isoformat()
    return {"status": "success", "payments": payments}

@router.put("/admin/payments/{payment_id}/action")
def action_payment(payment_id: int, req: PaymentActionRequest, admin = Depends(get_admin_user), db = Depends(get_db)):
    if req.action not in ['approved', 'rejected']:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'approved' or 'rejected'")
        
    try:
        with db.cursor() as cursor:
            # Check if payment exists and is pending
            cursor.execute("SELECT user_id, fine_id, amount_paid, transaction_reference FROM payments WHERE payment_id = %s", (payment_id,))
            payment = cursor.fetchone()
            if not payment:
                raise HTTPException(status_code=404, detail="Payment record not found")
                
            user_id = payment['user_id']
            fine_id = payment['fine_id']
            amount = float(payment['amount_paid'])
            txn_ref = payment['transaction_reference']
            
            # Update payment status
            cursor.execute("UPDATE payments SET status = %s WHERE payment_id = %s", (req.action, payment_id))
            
            # If approved, mark the fine as paid in borrow_records
            if req.action == 'approved':
                cursor.execute("SELECT borrow_id FROM fines WHERE fine_id = %s", (fine_id,))
                fine = cursor.fetchone()
                if fine:
                    borrow_id = fine['borrow_id']
                    cursor.execute("UPDATE borrow_records SET fine_paid = TRUE WHERE borrow_id = %s", (borrow_id,))
                    
            # Send notification to student
            title = "Fine Payment Approved" if req.action == 'approved' else "Fine Payment Rejected"
            message = (
                f"Your payment of LKR {amount} for txn {txn_ref} has been approved."
                if req.action == 'approved' else
                f"Your payment receipt for txn {txn_ref} was rejected. Please upload a valid bank slip."
            )
            cursor.execute(
                """INSERT INTO notifications (user_id, title, message, type, is_read)
                   VALUES (%s, %s, %s, 'fine', 0)""",
                (user_id, title, message)
            )
            
        db.commit()
        return {"status": "success", "message": f"Payment status updated to {req.action}"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/reviews")
def get_all_reviews(admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute(
                """SELECT r.review_id, r.user_id, r.rating, r.review_text, r.created_at, 
                          u.full_name as student_name, u.student_id,
                          b.title as book_title, b.author, b.book_id
                   FROM reviews r
                   JOIN users u ON r.user_id = u.user_id
                   JOIN books b ON r.book_id = b.book_id
                   ORDER BY r.created_at DESC"""
            )
            reviews = cursor.fetchall()
            for r in reviews:
                if r['created_at']:
                    r['created_at'] = str(r['created_at'])
            return {"status": "success", "reviews": reviews}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/admin/reviews/{review_id}")
def delete_book_review(review_id: int, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT review_id FROM reviews WHERE review_id = %s", (review_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Review not found")
            cursor.execute("DELETE FROM reviews WHERE review_id = %s", (review_id,))
        db.commit()
        return {"status": "success", "message": "Review deleted successfully"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
