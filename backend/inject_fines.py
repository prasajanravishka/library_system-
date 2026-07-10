import mysql.connector
from datetime import datetime, timedelta

def inject_sample_fines():
    try:
        db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="smart_library"
        )
        cursor = db.cursor(dictionary=True)
        
        # Make sure we have at least one user
        cursor.execute("SELECT user_id FROM users LIMIT 1")
        user = cursor.fetchone()
        if not user:
            print("No users found to add fines to.")
            return
        user_id = user['user_id']
        
        # Make sure we have at least a few books
        cursor.execute("SELECT book_id FROM books LIMIT 3")
        books = cursor.fetchall()
        if not books:
            print("No books found.")
            return

        # Create some sample fines
        # 1. Unpaid returned fine
        cursor.execute("""
            INSERT INTO borrow_records (user_id, book_id, borrow_date, due_date, return_date, status, fine_amount, fine_paid)
            VALUES (%s, %s, '2023-05-01', '2023-05-15', '2023-05-20', 'returned', 2.50, 0)
        """, (user_id, books[0]['book_id']))

        # 2. Paid returned fine
        if len(books) > 1:
            cursor.execute("""
                INSERT INTO borrow_records (user_id, book_id, borrow_date, due_date, return_date, status, fine_amount, fine_paid)
                VALUES (%s, %s, '2023-06-01', '2023-06-15', '2023-06-25', 'returned', 5.00, 1)
            """, (user_id, books[1]['book_id']))

        # 3. Unpaid overdue fine
        if len(books) > 2:
            cursor.execute("""
                INSERT INTO borrow_records (user_id, book_id, borrow_date, due_date, return_date, status, fine_amount, fine_paid)
                VALUES (%s, %s, '2023-10-01', '2023-10-15', NULL, 'overdue', 12.00, 0)
            """, (user_id, books[2]['book_id']))

        db.commit()
        print("Successfully added sample fine records!")
        db.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inject_sample_fines()
