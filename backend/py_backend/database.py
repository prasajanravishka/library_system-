import os
import pymysql
from dotenv import load_dotenv
from pymysql.cursors import DictCursor

load_dotenv()

DB_HOST = os.getenv("DB_HOST") or os.getenv("MYSQL_HOST") or "127.0.0.1"
DB_PORT = int(os.getenv("DB_PORT") or os.getenv("MYSQL_PORT") or 3306)
DB_USER = os.getenv("DB_USER") or os.getenv("MYSQL_USER") or "root"
DB_PASS = os.getenv("DB_PASS") or os.getenv("MYSQL_PASSWORD") or ""
DB_NAME = os.getenv("DB_NAME") or os.getenv("MYSQL_DATABASE") or "smart_library"


def get_db_connection():
    """
    Returns a new PyMySQL connection.
    Always uses DictCursor so results are returned as dictionaries, mimicking PDO.
    """
    try:
        connection = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME,
            charset='utf8mb4',
            cursorclass=DictCursor,
            autocommit=False,  # Keep it False so we can use transactions explicitly if needed
            connect_timeout=5,
        )
        return connection
    except pymysql.err.OperationalError as exc:
        raise RuntimeError(
            f"Unable to connect to MySQL at {DB_HOST}:{DB_PORT} as {DB_USER} on database {DB_NAME}. "
            "Start the MySQL server and verify the credentials in the backend .env file."
        ) from exc

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
