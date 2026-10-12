import re
from urllib.parse import urlparse


def validate_email_address(value: str) -> str:
    value = value.strip()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
        raise ValueError("Invalid email address")
    return value


def validate_http_url(value: str | None) -> str | None:
    if value is None:
        return value
    value = value.strip()
    if not value:
        return None
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Website must be a valid http or https URL")
    return value.rstrip("/")


def validate_optional_positive_int(value, field: str, maximum: int) -> int | None:
    if value is None or value == "":
        return None
    if isinstance(value, str) and re.fullmatch(r"[0-9]+", value.strip()):
        value = int(value.strip())
    if type(value) is not int or not 1 <= value <= maximum:
        raise ValueError(f"{field} must be a whole number between 1 and {maximum}")
    return value


def validate_category_slug(value: str) -> str:
    value = value.strip().lower()
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", value):
        raise ValueError(f"unsupported exam category: {value}")
    return value
