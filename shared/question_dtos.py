from dataclasses import dataclass, field

from basic_dtos import BaseDTO, UNSET


def _text(value: str, field_name: str, minimum: int, maximum: int) -> str:
    if not isinstance(value, str) or not minimum <= len(value.strip()) <= maximum:
        raise ValueError(f"{field_name} must contain between {minimum} and {maximum} characters")
    return value.strip()


def _choices(values: list[dict]) -> list[dict]:
    if not isinstance(values, list) or not 2 <= len(values) <= 6:
        raise ValueError("choices must contain between 2 and 6 items")
    result = []
    titles = set()
    correct_count = 0
    for value in values:
        if not isinstance(value, dict):
            raise ValueError("each choice must be an object")
        title = _text(value.get("title"), "choice title", 1, 500)
        if title.casefold() in titles:
            raise ValueError("choice titles must be unique")
        titles.add(title.casefold())
        description = _text(value.get("description", ""), "choice description", 0, 2_000)
        is_correct = value.get("is_correct", False)
        if not isinstance(is_correct, bool):
            raise ValueError("is_correct must be a boolean")
        correct_count += is_correct
        result.append({"title": title, "description": description, "is_correct": is_correct})
    if correct_count != 1:
        raise ValueError("exactly one choice must be correct")
    return result


@dataclass(slots=True)
class QuestionDTO(BaseDTO):
    title: str
    description: str
    choices: list[dict] = field(default_factory=list)

    def __post_init__(self):
        self.title = _text(self.title, "title", 3, 500)
        self.description = _text(self.description, "description", 1, 5_000)
        self.choices = _choices(self.choices)


@dataclass(slots=True)
class UpdateQuestionDTO(BaseDTO):
    title: str | None | object = UNSET
    description: str | None | object = UNSET
    choices: list[dict] | None | object = UNSET

    def __post_init__(self):
        if self.title is not UNSET:
            if self.title is None:
                raise ValueError("title is required")
            self.title = _text(self.title, "title", 3, 500)
        if self.description is not UNSET:
            if self.description is None:
                raise ValueError("description is required")
            self.description = _text(self.description, "description", 1, 5_000)
        if self.choices is not UNSET:
            if self.choices is None:
                raise ValueError("choices are required")
            self.choices = _choices(self.choices)
