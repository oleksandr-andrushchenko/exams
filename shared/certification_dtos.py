from dataclasses import dataclass

from basic_dtos import BaseDTO
from form_options import CERTIFICATION_LEVELS


CERTIFICATION_LEVEL_VALUES = {value for value, _ in CERTIFICATION_LEVELS}


def _text(value: str, field: str, minimum: int, maximum: int) -> str:
    if not isinstance(value, str) or not minimum <= len(value.strip()) <= maximum:
        raise ValueError(f"{field} must contain between {minimum} and {maximum} characters")
    return value.strip()


@dataclass(slots=True)
class CertificationDTO(BaseDTO):
    name: str
    provider: str
    description: str
    category: str = "other"
    level: str = "professional"
    official_url: str | None = None
    image_filename: str | None = None

    def __post_init__(self):
        self.name = _text(self.name, "name", 3, 200)
        self.provider = _text(self.provider, "provider", 2, 100)
        self.description = _text(self.description, "description", 10, 5_000)
        self.category = _text(self.category, "category", 2, 80).lower()
        self.level = _text(self.level, "level", 2, 40).lower()
        if self.level not in CERTIFICATION_LEVEL_VALUES:
            raise ValueError("invalid certification level")
        if self.official_url is not None:
            self.official_url = _text(self.official_url, "official_url", 8, 500)
