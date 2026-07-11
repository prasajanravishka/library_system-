import os
import sys
import random
from datetime import date, timedelta
import pymysql

# Add py_backend to path so we can import database
sys.path.append(os.path.join(os.path.dirname(__file__), 'py_backend'))
from database import get_db_connection

def seed_database():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 0. Adjust Schema (Ensure barcode unique index exists)
            print("Ensuring barcode unique index exists in book_copies...")
            try:
                cursor.execute("ALTER TABLE book_copies ADD UNIQUE INDEX barcode (barcode)")
                print("Index added successfully.")
            except Exception as e:
                # If the index already exists, MySQL throws an error which we can safely ignore
                pass

            # 1. Truncate Tables
            print("Truncating tables...")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
            tables_to_truncate = [
                'authors', 'publishers', 'categories', 'locations',
                'books', 'book_categories', 'book_authors', 'book_copies',
                'borrow_records', 'fines', 'payments', 'reviews', 'saved_books'
            ]
            for table in tables_to_truncate:
                cursor.execute(f"TRUNCATE TABLE `{table}`;")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

            # 2. Base Data Setup
            print("Inserting Categories and Locations...")
            categories = [
                ('Computer science, information & general works', '000-099', 'Encyclopedias, journalism, generalities', 'computer'),
                ('Philosophy & psychology', '100-199', 'Ethics, parapsychology, logic', 'psychology'),
                ('Religion', '200-299', 'Bibles, mythology, world religions', 'menu_book'),
                ('Social sciences', '300-399', 'Sociology, politics, law, education, economics', 'groups'),
                ('Language', '400-499', 'Linguistics, dictionaries, specific languages', 'language'),
                ('Science', '500-599', 'Mathematics, astronomy, physics, biology', 'science'),
                ('Technology', '600-699', 'Medicine, engineering, agriculture, applied sciences', 'engineering'),
                ('Arts & recreation', '700-799', 'Architecture, painting, music, sports, games', 'palette'),
                ('Literature', '800-899', 'Poetry, drama, fiction, rhetoric', 'auto_stories'),
                ('History & geography', '900-999', 'Travel, biography, world', 'public')
            ]
            for cat in categories:
                cursor.execute("INSERT INTO categories (name, code_range, description, icon) VALUES (%s, %s, %s, %s)", cat)
            
            cursor.execute("SELECT category_id, name, code_range FROM categories")
            rows = cursor.fetchall()
            cat_map = {row['name']: row['category_id'] for row in rows}
            cat_code_map = {row['category_id']: row['code_range'].split('-')[0] for row in rows if row['code_range']}

            locations = ['East Wing A', 'West Wing B', 'North Wing C', 'Reference Room']
            for loc in locations:
                cursor.execute("INSERT INTO locations (name, description) VALUES (%s, 'General Shelving')", (loc,))
            
            cursor.execute("SELECT location_id, name FROM locations")
            loc_map = {row['name']: row['location_id'] for row in cursor.fetchall()}

            # 3. Book Data (25 books)
            books_data = [
                ("The Great Gatsby", "F. Scott Fitzgerald", "9780743273565", "Scribner", 1925, "Literature", "A novel set in the Jazz Age that tells the story of Jay Gatsby's unrequited love for Daisy Buchanan and explores themes of decadence, idealism, and the American Dream."),
                ("1984", "George Orwell", "9780451524935", "Signet Classic", 1949, "Literature", "A dystopian social science fiction novel that follows the life of Winston Smith, a low-ranking member of 'the Party', who is frustrated by the omnipresent eyes of Big Brother."),
                ("To Kill a Mockingbird", "Harper Lee", "9780060935467", "Harper Perennial", 1960, "Literature", "A profoundly moving novel that explores racial injustice and the loss of innocence in the American South through the eyes of a young girl named Scout Finch."),
                ("The Catcher in the Rye", "J.D. Salinger", "9780316769488", "Little, Brown", 1951, "Literature", "The classic novel of teenage angst and alienation, narrated by Holden Caulfield after his expulsion from a prestigious prep school."),
                ("Pride and Prejudice", "Jane Austen", "9780141439518", "Penguin Classics", 1813, "Literature", "A romantic novel of manners that follows the character development of Elizabeth Bennet as she navigates the societal pressures of 19th-century England."),
                ("Brave New World", "Aldous Huxley", "9780060850524", "Harper Perennial", 1932, "Literature", "A visionary novel that anticipates a future society engineered for supreme happiness, maintained by genetic manipulation, psychological conditioning, and a drug called soma."),
                ("The Hobbit", "J.R.R. Tolkien", "9780547928227", "Mariner Books", 1937, "Literature", "The enchanting prelude to The Lord of the Rings, following the journey of Bilbo Baggins as he is swept into an epic quest by the wizard Gandalf."),
                ("Fahrenheit 451", "Ray Bradbury", "9781451673319", "Simon & Schuster", 1953, "Literature", "A dystopian novel presenting a future American society where books are outlawed and 'firemen' burn any that are found."),
                ("Moby-Dick", "Herman Melville", "9780142437247", "Penguin Classics", 1851, "Literature", "The epic tale of Captain Ahab's obsessive quest for revenge against the giant white whale that bit off his leg at the knee."),
                ("Jane Eyre", "Charlotte Brontë", "9780141441146", "Penguin Classics", 1847, "Literature", "A classic coming-of-age story that follows the experiences of its eponymous heroine, including her growth to adulthood and her love for Mr. Rochester."),
                ("Dune", "Frank Herbert", "9780441172719", "Ace Books", 1965, "Literature", "A sweeping sci-fi epic set on the desert planet Arrakis, focusing on the young Paul Atreides and the complex politics surrounding the valuable spice melange."),
                ("Neuromancer", "William Gibson", "9780441569595", "Ace Books", 1984, "Literature", "The foundational cyberpunk novel that introduced the concept of cyberspace, following a washed-up computer hacker hired for a seemingly impossible heist."),
                ("Foundation", "Isaac Asimov", "9780553293357", "Bantam Spectra", 1951, "Literature", "The first novel in Asimov's seminal sci-fi series, chronicling the efforts of mathematician Hari Seldon to save human knowledge as the Galactic Empire falls."),
                ("The Color of Magic", "Terry Pratchett", "9780062225672", "Harper Paperbacks", 1983, "Literature", "The first book in the acclaimed Discworld series, introducing the cowardly wizard Rincewind and the naive tourist Twoflower."),
                ("Good Omens", "Neil Gaiman", "9780060853983", "William Morrow", 1990, "Literature", "A comedic novel about the birth of the son of Satan and the coming of the End Times, hampered by an angel and a demon who have grown fond of Earth."),
                ("The Name of the Rose", "Umberto Eco", "9780156001311", "Harcourt", 1980, "Literature", "A historical murder mystery set in an Italian monastery in the year 1327, blending semiotics, biblical analysis, and medieval studies."),
                ("The Girl with the Dragon Tattoo", "Stieg Larsson", "9780307949486", "Vintage Crime", 2005, "Literature", "A gripping thriller involving a disgraced financial journalist and a brilliant but deeply troubled computer hacker investigating a decades-old disappearance."),
                ("Clean Code", "Robert C. Martin", "9780132350884", "Prentice Hall", 2008, "Computer science, information & general works", "A handbook of agile software craftsmanship, offering essential principles, patterns, and practices for writing clean and maintainable code."),
                ("The Pragmatic Programmer", "Andrew Hunt", "9780135957059", "Addison-Wesley", 1999, "Computer science, information & general works", "A highly influential book on software engineering, presenting a collection of best practices and philosophies for modern programmers."),
                ("Design Patterns", "Erich Gamma", "9780201633610", "Addison-Wesley", 1994, "Computer science, information & general works", "The classic catalog of reusable object-oriented design patterns, also known as the 'Gang of Four' book, essential for software architects."),
                ("A Brief History of Time", "Stephen Hawking", "9780553380163", "Bantam", 1988, "Science", "A landmark volume in science writing that explores complex concepts like black holes, the Big Bang, and the nature of time for a general audience."),
                ("The Selfish Gene", "Richard Dawkins", "9780199291151", "Oxford University Press", 1976, "Science", "A revolutionary book on evolutionary biology that introduces the gene-centered view of evolution and the concept of the 'meme'."),
                ("Cosmos", "Carl Sagan", "9780345539434", "Ballantine Books", 1980, "Science", "A magnificent exploration of the universe, blending science, philosophy, and history to explain how the cosmos evolved over 14 billion years."),
                ("Sapiens", "Yuval Noah Harari", "9780062316097", "Harper", 2011, "History & geography", "A sweeping history of the human species, exploring how Homo sapiens came to dominate the planet and the profound revolutions that shaped our development."),
                ("Thinking, Fast and Slow", "Daniel Kahneman", "9780374533557", "Farrar, Straus and Giroux", 2011, "Philosophy & psychology", "A groundbreaking book by a Nobel laureate that explains the two systems that drive the way we think: one fast, intuitive, and emotional; the other slower and more logical.")
            ]

            print("Inserting Authors, Publishers, and Books...")
            for b in books_data:
                title, author_name, isbn, pub_name, year, cat_name, synopsis = b
                
                # Insert Publisher
                cursor.execute("INSERT IGNORE INTO publishers (name) VALUES (%s)", (pub_name,))
                cursor.execute("SELECT publisher_id FROM publishers WHERE name = %s", (pub_name,))
                pub_id = cursor.fetchone()['publisher_id']
                
                # Insert Author
                cursor.execute("INSERT IGNORE INTO authors (name) VALUES (%s)", (author_name,))
                cursor.execute("SELECT author_id FROM authors WHERE name = %s", (author_name,))
                auth_id = cursor.fetchone()['author_id']
                
                # Cover URL
                cover_url = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg"
                
                # Random Location
                loc_id = random.choice(list(loc_map.values()))
                
                # Insert Book
                cursor.execute("""
                    INSERT INTO books (title, author, isbn, publisher, publication_year, synopsis, cover_image_url, 
                                       language, availability_status, location_id, publisher_id, total_copies, available_copies)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'English', 'available', %s, %s, 0, 0)
                """, (title, author_name, isbn, pub_name, year, synopsis, cover_url, loc_id, pub_id))
                
                book_id = cursor.lastrowid
                
                # Book Categories
                cat_id = cat_map[cat_name]
                cursor.execute("INSERT INTO book_categories (book_id, category_id) VALUES (%s, %s)", (book_id, cat_id))
                
                # Book Authors
                cursor.execute("INSERT INTO book_authors (book_id, author_id) VALUES (%s, %s)", (book_id, auth_id))
                
                # Create Copies (2 to 4)
                num_copies = random.randint(2, 4)
                base_code = cat_code_map.get(cat_id, '000')
                for i in range(num_copies):
                    # Format: 813.0001 (Base Code . 4-digit ID)
                    # We can use the global copy counter or just a mix of book_id and copy index to ensure uniqueness across the DB.
                    # Since we want it unique globally, let's use book_id * 10 + i
                    unique_id = (book_id * 10) + i
                    barcode = f"{base_code}.{unique_id:04d}"
                    cursor.execute("""
                        INSERT INTO book_copies (book_id, barcode, isbn, `condition`, status)
                        VALUES (%s, %s, %s, 'Good', 'available')
                    """, (book_id, barcode, isbn))
                
                # Update Book copy counts
                cursor.execute("UPDATE books SET total_copies = %s, available_copies = %s WHERE book_id = %s", (num_copies, num_copies, book_id))

            # 4. Generate Borrow Records
            print("Generating Borrow Records & Fines...")
            cursor.execute("SELECT user_id FROM users")
            users = [r['user_id'] for r in cursor.fetchall()]
            
            if not users:
                print("No users found! Please ensure users exist in the DB.")
                return

            cursor.execute("SELECT copy_id, book_id FROM book_copies")
            copies = cursor.fetchall()
            
            today = date.today()
            
            # Helper to create a record
            def borrow(copy, user_id, b_date, d_date, r_date, status, fine_amt=0, fine_paid=0):
                cursor.execute("""
                    INSERT INTO borrow_records (user_id, book_id, copy_id, borrow_date, due_date, return_date, status, fine_amount, fine_paid)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (user_id, copy['book_id'], copy['copy_id'], b_date, d_date, r_date, status, fine_amt, fine_paid))
                borrow_id = cursor.lastrowid
                
                if status == 'borrowed' or status == 'overdue':
                    cursor.execute("UPDATE book_copies SET status = 'borrowed' WHERE copy_id = %s", (copy['copy_id'],))
                    cursor.execute("UPDATE books SET available_copies = available_copies - 1 WHERE book_id = %s", (copy['book_id'],))
                    
                if fine_amt > 0:
                    cursor.execute("INSERT INTO fines (borrow_id, amount, reason) VALUES (%s, %s, 'Overdue fine')", (borrow_id, fine_amt))
                    fine_id = cursor.lastrowid
                    if fine_paid:
                        cursor.execute("INSERT INTO payments (user_id, fine_id, amount_paid, payment_method, status) VALUES (%s, %s, %s, 'online', 'approved')", (user_id, fine_id, fine_amt))

            # Shuffle copies
            random.shuffle(copies)
            
            # Scenarios
            # 1. 20 Returned on time
            for i in range(20):
                c = copies.pop()
                u = random.choice(users)
                b_date = today - timedelta(days=random.randint(30, 60))
                d_date = b_date + timedelta(days=14)
                r_date = b_date + timedelta(days=random.randint(5, 13))
                borrow(c, u, b_date, d_date, r_date, 'returned')
                
            # 2. 10 Returned late (Fines paid)
            for i in range(10):
                c = copies.pop()
                u = random.choice(users)
                b_date = today - timedelta(days=random.randint(40, 60))
                d_date = b_date + timedelta(days=14)
                r_date = d_date + timedelta(days=random.randint(2, 10))
                fine = float((r_date - d_date).days * 0.50)
                borrow(c, u, b_date, d_date, r_date, 'returned', fine_amt=fine, fine_paid=1)
                
            # 3. 15 Active Borrows (Not due yet)
            for i in range(15):
                c = copies.pop()
                u = random.choice(users)
                b_date = today - timedelta(days=random.randint(1, 10))
                d_date = b_date + timedelta(days=14)
                borrow(c, u, b_date, d_date, None, 'borrowed')
                
            # 4. 8 Overdue Borrows (Fines pending)
            for i in range(8):
                c = copies.pop()
                u = random.choice(users)
                b_date = today - timedelta(days=random.randint(20, 30))
                d_date = b_date + timedelta(days=14)
                fine = float((today - d_date).days * 0.50)
                borrow(c, u, b_date, d_date, None, 'overdue', fine_amt=fine, fine_paid=0)
                
            # 5. 1 Pending Receipt for user S12345
            cursor.execute("SELECT user_id FROM users WHERE student_id = 'S12345'")
            s_user = cursor.fetchone()
            if s_user and copies:
                s_user_id = s_user['user_id']
                c = copies.pop()
                b_date = today - timedelta(days=50)
                d_date = b_date + timedelta(days=14)
                r_date = d_date + timedelta(days=10)
                fine = 5.00
                
                cursor.execute("""
                    INSERT INTO borrow_records (user_id, book_id, copy_id, borrow_date, due_date, return_date, status, fine_amount, fine_paid)
                    VALUES (%s, %s, %s, %s, %s, %s, 'returned', %s, 1)
                """, (s_user_id, c['book_id'], c['copy_id'], b_date, d_date, r_date, fine))
                borrow_id = cursor.lastrowid
                
                cursor.execute("INSERT INTO fines (borrow_id, amount, reason) VALUES (%s, %s, 'Overdue fine - Manual Review')", (borrow_id, fine))
                fine_id = cursor.lastrowid
                
                txn_ref = f"TXN-RECEIPT-{borrow_id}"
                cursor.execute("""
                    INSERT INTO payments (user_id, fine_id, amount_paid, payment_method, status, transaction_reference, receipt_image_path) 
                    VALUES (%s, %s, %s, 'bank_transfer', 'pending', %s, 'uploads/receipts/dummy_receipt.jpg')
                """, (s_user_id, fine_id, fine, txn_ref))

            conn.commit()
            print("Successfully seeded 25 books and generated complex borrow records and fines!")
            
    except Exception as e:
        conn.rollback()
        print(f"Error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed_database()
