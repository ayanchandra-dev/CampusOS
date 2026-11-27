import os, datetime, jwt
from fastapi import Header, HTTPException
from passlib.context import CryptContext
pwd = CryptContext(schemes=["bcrypt"])
SECRET = os.getenv("JWT_SECRET")

def make_token(uid):
    return jwt.encode({"sub": str(uid), "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)}, SECRET, algorithm="HS256")

def current_user(authorization: str = Header(...)):
    try:
        return int(jwt.decode(authorization.removeprefix("Bearer "), SECRET, algorithms=["HS256"])["sub"])
    except Exception:
        raise HTTPException(401, "Invalid token")