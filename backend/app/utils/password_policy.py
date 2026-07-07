import re
from typing import List, Tuple

from app.config import settings


class PasswordError(Exception):
    def __init__(self, message: str, code: str):
        self.message = message
        self.code = code
        super().__init__(message)


def validate_password(password: str) -> List[Tuple[str, str]]:
    errors: List[Tuple[str, str]] = []

    if len(password) < settings.MIN_PASSWORD_LENGTH:
        errors.append((
            "TOO_SHORT",
            f"Password must be at least {settings.MIN_PASSWORD_LENGTH} characters long",
        ))

    if settings.PASSWORD_REQUIRE_UPPER and not re.search(r"[A-Z]", password):
        errors.append(("NO_UPPER", "Password must contain at least one uppercase letter"))

    if settings.PASSWORD_REQUIRE_LOWER and not re.search(r"[a-z]", password):
        errors.append(("NO_LOWER", "Password must contain at least one lowercase letter"))

    if settings.PASSWORD_REQUIRE_DIGIT and not re.search(r"\d", password):
        errors.append(("NO_DIGIT", "Password must contain at least one digit"))

    if settings.PASSWORD_REQUIRE_SPECIAL and not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-]", password):
        errors.append(("NO_SPECIAL", "Password must contain at least one special character"))

    return errors


def check_password_strength(password: str) -> dict:
    errors = validate_password(password)
    score = max(0, 5 - len(errors))
    strength = "weak" if score <= 2 else "medium" if score <= 4 else "strong"
    return {
        "score": score,
        "strength": strength,
        "errors": [{"code": c, "message": m} for c, m in errors],
        "is_valid": len(errors) == 0,
    }
