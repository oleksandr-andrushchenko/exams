from dataclasses import asdict, dataclass
from typing import Any

from certification_dtos import CertificationDTO
from shared_utils import (Key, Permission, User, get_category,
                          get_dynamodb_item, get_dynamodb_table, to_kebab_case, utc_now, verify_authorization)


@dataclass(slots=True)
class Certification:
    id: str
    name: str
    provider: str
    description: str
    category: str
    level: str
    official_url: str | None
    image_filename: str | None
    created_at: int
    updated_at: int | None
    duration_minutes: int | None = None
    question_count: int | None = None


def certification_from_dynamodb(item: dict[str, Any]) -> Certification:
    return Certification(
        id=item.get("slug") or item["id"], name=item["name"], provider=item["provider"],
        description=item["description"], category=item.get("category", "other"),
        level=item.get("level", "professional"), official_url=item.get("official_url"),
        image_filename=item.get("image_filename"),
        duration_minutes=int(item["duration_minutes"]) if item.get("duration_minutes") is not None else None,
        question_count=int(item["question_count"]) if item.get("question_count") is not None else None,
        created_at=int(item["created_at"]), updated_at=item.get("updated_at"),
    )


def find_certification(certification_id: str) -> Certification | None:
    item = get_dynamodb_item("CERTIFICATION", certification_id)
    return certification_from_dynamodb(item) if item else None


def get_certification(certification_id: str) -> Certification:
    certification = find_certification(certification_id)
    if certification is None:
        raise LookupError(f"Certification '{certification_id}' not found")
    return certification


def get_certifications() -> list[Certification]:
    params = {"KeyConditionExpression": Key("pk").eq("CERTIFICATION")}
    certifications = []
    while True:
        response = get_dynamodb_table().query(**params)
        certifications.extend(certification_from_dynamodb(item) for item in response.get("Items", []))
        if not response.get("LastEvaluatedKey"):
            return certifications
        params["ExclusiveStartKey"] = response["LastEvaluatedKey"]


def create_certification(dto: CertificationDTO, user: User) -> Certification:
    verify_authorization(user, Permission.CREATE_CERTIFICATION)
    get_category(dto.category)
    now = utc_now()
    certification_id = to_kebab_case(dto.name)
    if not certification_id:
        raise ValueError("Certification name must produce a nonempty ID")
    certification = Certification(certification_id, dto.name, dto.provider,
                                  dto.description, dto.category, dto.level, dto.official_url,
                                  dto.image_filename, now, None, dto.duration_minutes, dto.question_count)
    item = {"pk": "CERTIFICATION", "sk": certification_id, **asdict(certification), "certification": True}
    get_dynamodb_table().put_item(Item=item, ConditionExpression="attribute_not_exists(pk)")
    return certification
