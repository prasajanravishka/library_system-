from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from database import get_db
from auth import get_current_user

router = APIRouter()

@router.get("/stats")
def get_global_stats(db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as count FROM books")
        total_books = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM borrow_records WHERE status = 'borrowed'")
        active_borrows = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM borrow_records WHERE status = 'borrowed' AND due_date < CURDATE()")
        overdue = cursor.fetchone()['count']
        
        # Trending Books query
        cursor.execute("""
            SELECT b.book_id, b.title, b.author, b.cover_image_url, COUNT(br.borrow_id) as borrow_count
            FROM books b
            JOIN book_copies bc ON b.book_id = bc.book_id
            JOIN borrow_records br ON bc.copy_id = br.copy_id
            WHERE br.borrow_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY b.book_id
            ORDER BY borrow_count DESC
            LIMIT 10
        """)
        trending_books = cursor.fetchall()
        
    return {
        "status": "success",
        "stats": {
            "total_books": total_books,
            "active_borrows": active_borrows,
            "overdue": overdue,
            "trending_books": trending_books
        }
    }

@router.get("/user_dashboard")
def get_user_dashboard(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    
    with db.cursor() as cursor:
        # Active reads
        cursor.execute(
            """SELECT b.book_id, b.title, b.author, b.cover_image_path, b.cover_image_url,
                      br.borrow_date, br.due_date,
                      DATEDIFF(br.due_date, CURDATE()) as days_left
               FROM borrow_records br
               JOIN books b ON br.book_id = b.book_id
               WHERE br.user_id = %s AND br.status = 'borrowed'""",
            (user_id,)
        )
        active_reads = cursor.fetchall()
        
        # Total borrowed
        cursor.execute("SELECT COUNT(*) as count FROM borrow_records WHERE user_id = %s", (user_id,))
        total_borrowed = cursor.fetchone()['count']
        
        if total_borrowed < 5:
            rank, level = 'Bronze', 1
        elif total_borrowed < 15:
            rank, level = 'Silver', 2
        else:
            rank, level = 'Gold', 3
            
        # Unread Notifications Count
        cursor.execute("SELECT COUNT(*) as count FROM notifications WHERE user_id = %s AND is_read = FALSE", (user_id,))
        unread_notifications = cursor.fetchone()['count']
        
    return {
        "status": "success",
        "dashboard": {
            "level": level,
            "rank": rank,
            "total_borrowed": total_borrowed,
            "active_reads": active_reads,
            "unread_notifications": unread_notifications
        }
    }

@router.get("/featured_books")
def get_featured_books(db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT book_id, title, author, cover_image_path, cover_image_url
               FROM books
               ORDER BY added_at DESC
               LIMIT 5"""
        )
        featured_books = cursor.fetchall()
        
    return {
        "status": "success",
        "featured_books": featured_books
    }

@router.get("/categories")
def get_categories(db = Depends(get_db)):
    with db.cursor() as cursor:
        try:
            cursor.execute(
                """SELECT c.category_id AS id, c.name, c.icon,
                          COUNT(bc.book_id) AS book_count
                   FROM categories c
                   LEFT JOIN book_categories bc ON c.category_id = bc.category_id
                   GROUP BY c.category_id
                   ORDER BY c.sort_order ASC, c.name ASC"""
            )
            categories = cursor.fetchall()
        except Exception:
            # Fallback
            categories = [
                {'id': 1, 'name': 'Technology', 'icon': 'computer', 'book_count': 0},
                {'id': 2, 'name': 'Fiction',    'icon': 'auto_stories', 'book_count': 0},
                {'id': 3, 'name': 'Science',    'icon': 'science', 'book_count': 0},
                {'id': 6, 'name': 'Mathematics', 'icon': 'calculate', 'book_count': 0},
                {'id': 9, 'name': 'Business',    'icon': 'business_center', 'book_count': 0},
                {'id': 10, 'name': 'Accounting',  'icon': 'account_balance', 'book_count': 0},
                {'id': 11, 'name': 'Electronic',  'icon': 'electrical_services', 'book_count': 0},
            ]
            
    return {
        "status": "success",
        "categories": categories
    }

@router.get("/categories/{category_id}/books")
def get_books_by_category(category_id: int, db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT category_id, name, description, icon FROM categories WHERE category_id = %s", (category_id,))
        category = cursor.fetchone()
        
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
            
        cursor.execute(
            """SELECT b.book_id, b.title, b.author, b.isbn, b.publisher,
                      b.publication_year, b.cover_image_path, b.cover_image_url,
                      b.availability_status
               FROM books b
               JOIN book_categories bc ON b.book_id = bc.book_id
               WHERE bc.category_id = %s
               ORDER BY b.title ASC""",
            (category_id,)
        )
        books = cursor.fetchall()
        
    return {
        "status": "success",
        "category": category,
        "books": books
    }

@router.get("/books/{book_id}")
def get_book_details(book_id: int, db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT b.book_id, b.title, b.author, b.isbn, b.publisher,
                      b.publication_year, b.language, b.total_copies, b.available_copies, 
                      b.cover_image_path, b.cover_image_url, b.synopsis, b.shelf_location, b.availability_status,
                      c.name as category_name,
                      l.name as location_name,
                      (SELECT u.full_name 
                       FROM borrow_records br 
                       JOIN users u ON br.user_id = u.user_id 
                       WHERE br.book_id = b.book_id AND br.status = 'borrowed' 
                       LIMIT 1) as borrowed_by
               FROM books b
               LEFT JOIN book_categories bc ON b.book_id = bc.book_id
               LEFT JOIN categories c ON bc.category_id = c.category_id
               LEFT JOIN locations l ON b.location_id = l.location_id
               WHERE b.book_id = %s""",
            (book_id,)
        )
        book = cursor.fetchone()
        
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
            
    return {
        "status": "success",
        "book": book
    }

@router.get("/trending_books")
def get_trending_books(db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("""
            SELECT b.book_id, b.title, b.author, b.cover_image_url, COUNT(br.borrow_id) as borrow_count
            FROM books b
            JOIN book_copies bc ON b.book_id = bc.book_id
            JOIN borrow_records br ON bc.copy_id = br.copy_id
            WHERE br.borrow_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY b.book_id
            ORDER BY borrow_count DESC
            LIMIT 10
        """)
        trending_books = cursor.fetchall()
        
    return {
        "status": "success",
        "trending_books": trending_books
    }
