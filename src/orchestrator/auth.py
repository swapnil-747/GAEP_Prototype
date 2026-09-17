from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import time
import uuid
from pathlib import Path
from typing import Any

import jwt
from fastapi import HTTPException, Request, status


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
USERS_FILE = DATA_DIR / "users.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)

if not USERS_FILE.exists():
    USERS_FILE.write_text("[]", encoding="utf-8")


JWT_SECRET = os.environ.get(
    "GAEP_JWT_SECRET",
    "gaep-development-secret-change-me",
)

JWT_ALGORITHM = "HS256"
TOKEN_TTL_SECONDS = 8 * 60 * 60
AUTH_COOKIE_NAME = "gaep_access_token"

PASSWORD_HASH_ALGORITHM = "sha256"
PASSWORD_HASH_ITERATIONS = 310_000
PASSWORD_SALT_BYTES = 16


def read_users() -> list[dict[str, Any]]:
    try:
        return json.loads(
            USERS_FILE.read_text(encoding="utf-8")
        )
    except FileNotFoundError:
        return []


def write_users(users: list[dict[str, Any]]) -> None:
    temporary_file = USERS_FILE.with_suffix(".tmp")

    temporary_file.write_text(
        json.dumps(users, indent=2),
        encoding="utf-8",
    )

    temporary_file.replace(USERS_FILE)


def find_user(username: str) -> dict[str, Any] | None:
    normalized_username = username.strip().lower()

    return next(
        (
            user
            for user in read_users()
            if user["username"] == normalized_username
        ),
        None,
    )


def hash_password(password: str) -> str:
    """
    Returns a self-contained password hash:

    pbkdf2_sha256$iterations$salt$derived_key
    """
    salt = secrets.token_bytes(PASSWORD_SALT_BYTES)

    derived_key = hashlib.pbkdf2_hmac(
        PASSWORD_HASH_ALGORITHM,
        password.encode("utf-8"),
        salt,
        PASSWORD_HASH_ITERATIONS,
    )

    return (
        f"pbkdf2_sha256$"
        f"{PASSWORD_HASH_ITERATIONS}$"
        f"{salt.hex()}$"
        f"{derived_key.hex()}"
    )


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations_text, salt_hex, key_hex = (
            stored_hash.split("$")
        )

        if algorithm != "pbkdf2_sha256":
            return False

        iterations = int(iterations_text)
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(key_hex)

        actual_key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            iterations,
        )

        return hmac.compare_digest(
            actual_key,
            expected_key,
        )
    except (ValueError, TypeError):
        return False


def create_user(username: str, password: str) -> dict[str, Any]:
    normalized_username = username.strip().lower()

    if not normalized_username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required",
        )

    if find_user(normalized_username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists",
        )

    user = {
        "id": str(uuid.uuid4()),
        "username": normalized_username,
        "password_hash": hash_password(password),
    }

    users = read_users()
    users.append(user)
    write_users(users)

    return user


def verify_credentials(
    username: str,
    password: str,
) -> dict[str, Any] | None:
    user = find_user(username)

    if not user:
        return None

    if not verify_password(
        password,
        user["password_hash"],
    ):
        return None

    return user


def create_access_token(user: dict[str, Any]) -> str:
    current_time = int(time.time())

    payload = {
        "sub": user["id"],
        "username": user["username"],
        "iat": current_time,
        "exp": current_time + TOKEN_TTL_SECONDS,
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def get_current_user(request: Request) -> dict[str, str]:
    token = request.cookies.get(AUTH_COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
    except jwt.PyJWTError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        ) from error

    user_id = payload.get("sub")
    username = payload.get("username")

    if not user_id or not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    return {
        "id": str(user_id),
        "username": str(username),
    }