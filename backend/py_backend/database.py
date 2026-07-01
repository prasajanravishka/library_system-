import pymysql
from pymysql.cursors import DictCursor
import os

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "smart_library")

def get_db_connection():
    """
    Returns a new PyMySQL connection.
    Always uses DictCursor so results are returned as dictionaries, mimicking PDO.
    """
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        charset='utf8mb4',
        cursorclass=DictCursor,
        autocommit=False # Keep it False so we can use transactions explicitly if needed
    )
    return connection

def get_db():
    """
    FastAPI dependency that yields a database connection and ensures it is closed.
    """
    conn = None
    try:
        conn = get_db_connection()
        yield conn
    finally:
        if conn:
            conn.close()
