from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from db import get_db
from auth import pwd, make_token, current_user

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])  # tighten later

class Signup(BaseModel): username: str; email: str; password: str
class LogIn(BaseModel): skill: str; note: str; amount: int; proof_url: str = ""

@app.post("/auth/signup")
def signup(d: Signup):
    db = get_db(); cur = db.cursor()
    domain = d.email.split("@")[-1]
    cur.execute("SELECT id FROM colleges WHERE email_domain=%s", (domain,))
    college = cur.fetchone()
    if not college: raise HTTPException(400, "Use your college email")
    cur.execute("INSERT INTO users (username,email,password_hash,college_id) VALUES (%s,%s,%s,%s)",
                (d.username, d.email, pwd.hash(d.password), college[0]))
    db.commit(); return {"token": make_token(cur.lastrowid)}

@app.post("/logs")
def add_log(d: LogIn, uid: int = Depends(current_user)):
    db = get_db(); cur = db.cursor()
    cur.execute("INSERT INTO skill_logs (user_id,skill,note,amount,log_date,proof_url) VALUES (%s,%s,%s,%s,CURDATE(),%s)",
                (uid, d.skill, d.note, max(1, d.amount), d.proof_url))
    db.commit(); return {"id": cur.lastrowid}

@app.get("/heatmap")
def heatmap(year: int, uid: int = Depends(current_user)):
    cur = get_db().cursor()
    cur.execute("SELECT log_date, COUNT(*) FROM skill_logs WHERE user_id=%s AND YEAR(log_date)=%s GROUP BY log_date", (uid, year))
    return {str(day): n for day, n in cur.fetchall()}