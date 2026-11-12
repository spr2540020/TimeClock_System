import sqlite3
import os

DB_PATH = "database/attendance.db"
os.makedirs("database", exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        stamp_type TEXT NOT NULL,
        score REAL,
        stamp_time TEXT
    )
    """)
    conn.commit()
    conn.close()

def save_stamp(name, stamp_type, score, stamp_time):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO attendance (name, stamp_type, score, stamp_time)
    VALUES (?, ?, ?, ?)
    """, (name, stamp_type, score, stamp_time))
    conn.commit()
    conn.close()

def get_logs():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    SELECT name, stamp_type, score, stamp_time
    FROM attendance
    ORDER BY id DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_logs_by_month(year, month):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    target = f"{year}-{month:02d}"
    cursor.execute("""
    SELECT name, stamp_type, score, stamp_time
    FROM attendance
    WHERE stamp_time LIKE ?
    ORDER BY id DESC
    """, (f"{target}%",))
    rows = cursor.fetchall()
    conn.close()
    return rows