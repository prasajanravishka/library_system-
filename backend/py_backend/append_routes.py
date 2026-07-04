import sys
import os

file_path = r'd:\Projects\Smart-Library-Management-System\backend\py_backend\routers\user.py'
with open(file_path, 'a', encoding='utf-8') as f:
    f.write('''
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
        sql = \"\"\"
            SELECT b.book_id, b.title, b.author, b.isbn, b.publisher,
                   b.publication_year, b.language, b.total_copies, b.available_copies, b.location_id,
                   b.cover_image_path, b.cover_image_url, b.availability_status,
                   sb.created_at as saved_at
            FROM saved_books sb
            JOIN books b ON sb.book_id = b.book_id
            WHERE sb.user_id = %s
            ORDER BY sb.created_at DESC
        \"\"\"
        cursor.execute(sql, (user_id,))
        books = cursor.fetchall()
        
    return {
        "status": "success",
        "books": books
    }
''')
print('Appended endpoints to user.py')
