import sqlite3
from database import get_db_path

conn = sqlite3.connect(get_db_path())
cursor = conn.cursor()

print("--- [embeddings テーブル] ---")
try:
    cursor.execute("SELECT id, name, image_path FROM embeddings")
    for row in cursor.fetchall():
        print(row)
except sqlite3.OperationalError:
    print("embeddings テーブルはまだありません。")

print("\n--- [attendance テーブル] ---")
try:
    cursor.execute("SELECT * FROM attendance")
    for row in cursor.fetchall():
        print(row)
except sqlite3.OperationalError:
    print("attendance テーブルはまだありません。")

conn.close()