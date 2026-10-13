from dataclasses import dataclass
from urllib.parse import urlsplit


@dataclass(slots=True)
class UpsertRedirectDTO:
    path: str
    redirect_to: str

    def __post_init__(self):
        for field in ("path", "redirect_to"):
            value = getattr(self, field)
            if not isinstance(value, str):
                raise ValueError(f"{field} must be a string")
            value = value.strip()
            if not value or len(value) > 2048:
                raise ValueError(f"{field} must contain between 1 and 2048 characters")
            if "\\" in value or any(ord(char) < 32 or ord(char) == 127 for char in value):
                raise ValueError(f"{field} must not contain backslashes or control characters")
            parsed = urlsplit(value)
            if parsed.scheme or parsed.netloc or not value.startswith("/") or value.startswith("//"):
                raise ValueError(f"{field} must be a root-relative URL")
            setattr(self, field, value)

        source = urlsplit(self.path)
        if source.query or source.fragment:
            raise ValueError("path must not contain a query or fragment")
        if "." in self.path:
            raise ValueError("path must not identify a file")
        if self.path == urlsplit(self.redirect_to).path:
            raise ValueError("redirect_to must point to a different path")
