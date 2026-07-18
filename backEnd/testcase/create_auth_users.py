import os
import urllib.parse
from dotenv import load_dotenv
from supabase import create_client

# Load Env
load_dotenv(os.path.join(os.path.dirname(__file__), "../backEnd/.env"))

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

from sqlalchemy import create_engine, text

# Setup SQL Alchemy
db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)

users_to_create = [
    {
        "email": "day1@test.com",
        "password": "password123",
        "name": "Day 1 User (New Patient)",
        "streak": 1,
        "kl": 2
    },
    {
        "email": "day7@test.com",
        "password": "password123",
        "name": "Day 7 User (1-Week Streak)",
        "streak": 7,
        "kl": 3
    },
    {
        "email": "week12@test.com",
        "password": "password123",
        "name": "Week 12 User (Fully Unlocked)",
        "streak": 84,
        "kl": 4
    }
]

with engine.connect() as conn:
    for u in users_to_create:
        try:
            res = supabase.auth.admin.create_user({
                "email": u["email"],
                "password": u["password"],
                "email_confirm": True,
                "user_metadata": {"full_name": u["name"]}
            })
            uid = res.user.id
            print(f"Created Auth User {u['email']} with ID: {uid}")
        except Exception as e:
            if "already exists" in str(e).lower() or "same email address" in str(e).lower():
                print(f"User {u['email']} already exists. Fetching ID...")
                # Unfortunately, Supabase admin api doesn't let us query user by email easily in python without pagination.
                # Let's try to sign in to get the ID instead.
                try:
                    res = supabase.auth.sign_in_with_password({"email": u["email"], "password": u["password"]})
                    uid = res.user.id
                    print(f"Fetched existing User ID: {uid}")
                except Exception as ex:
                    print(f"Failed to fetch ID for {u['email']}: {ex}")
                    continue
            else:
                print(f"Error creating user {u['email']}: {e}")
                continue
                
        # Now we insert or update the profile in the DB.
        # Check if profile exists
        existing = conn.execute(text("SELECT id FROM profiles WHERE id = :uid"), {"uid": uid}).fetchone()
        
        if existing:
            conn.execute(text("""
                UPDATE profiles 
                SET full_name = :name, kl_grade = :kl, streak_current = :streak 
                WHERE id = :uid
            """), {"uid": uid, "name": u["name"], "kl": u["kl"], "streak": u["streak"]})
        else:
            conn.execute(text("""
                INSERT INTO profiles (id, full_name, kl_grade, streak_current) 
                VALUES (:uid, :name, :kl, :streak)
            """), {"uid": uid, "name": u["name"], "kl": u["kl"], "streak": u["streak"]})
            
        print(f"Updated profile for {u['email']}")

    conn.commit()
    print("Done linking Auth Users to Profiles!")

