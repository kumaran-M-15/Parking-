import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any

class Database:
    def __init__(self, db_path: str = 'parking.db'):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create offices table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS offices (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                location TEXT NOT NULL,
                total_car_slots INTEGER NOT NULL,
                total_bike_slots INTEGER NOT NULL,
                available_car_slots INTEGER NOT NULL,
                available_bike_slots INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                emp_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                team TEXT,
                shift TEXT,
                role TEXT DEFAULT 'user',
                created_at TEXT NOT NULL
            )
        ''')
        
        # Create parking_requests table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS parking_requests (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                office_id TEXT NOT NULL,
                vehicle_type TEXT NOT NULL,
                vehicle_number TEXT NOT NULL,
                duration_type TEXT NOT NULL,
                parking_date TEXT,
                start_date TEXT,
                end_date TEXT,
                recurring_pattern TEXT,
                description TEXT,
                status TEXT DEFAULT 'pending',
                slot_number TEXT,
                approved_by TEXT,
                rejection_reason TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (office_id) REFERENCES offices (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def execute_query(self, query: str, params: tuple = ()) -> List[Dict]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(query, params)
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return results
    
    def execute_update(self, query: str, params: tuple = ()) -> int:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        conn.close()
        return cursor.rowcount

# Global database instance
db = Database()
