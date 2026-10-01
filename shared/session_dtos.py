from dataclasses import dataclass

from basic_dtos import BaseDTO


@dataclass(slots=True)
class AnswerDTO(BaseDTO):
    question_id: str
    choice_index: int

    def __post_init__(self):
        if not self.question_id or not isinstance(self.choice_index, int) or self.choice_index < 0:
            raise ValueError("question_id and a non-negative choice_index are required")
