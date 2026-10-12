from dataclasses import dataclass, field

from basic_dtos import BaseDTO


@dataclass(slots=True)
class AnswerDTO(BaseDTO):
    question_id: str
    choice_indices: list[int] = field(default_factory=list)
    choice_index: int | None = None

    def __post_init__(self):
        if self.choice_index is not None and not self.choice_indices:
            self.choice_indices = [self.choice_index]
        if not self.question_id or not isinstance(self.choice_indices, list):
            raise ValueError("question_id and choice_indices are required")
        if any(not isinstance(index, int) or index < 0 for index in self.choice_indices):
            raise ValueError("choice_indices must contain non-negative integers")
        if len(set(self.choice_indices)) != len(self.choice_indices):
            raise ValueError("choice_indices must be unique")
