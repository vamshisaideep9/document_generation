import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-this-in-production-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8


def _load_users() -> dict[str, str]:
    users = {}
    for i in range(1, 20):
        u = os.environ.get(f"USER{i}_USERNAME")
        p = os.environ.get(f"USER{i}_PASSWORD")
        if u and p:
            users[u] = p
    if not users:
        users["admin"] = os.environ.get("ADMIN_PASSWORD", "admin@2024")
    return users


USERS = _load_users()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def create_access_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": username, "exp": expire}, JWT_SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None or username not in USERS:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username


auth_router = APIRouter()


@auth_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    stored_password = USERS.get(credentials.username)
    if not stored_password or stored_password != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    return TokenResponse(access_token=create_access_token(credentials.username))
