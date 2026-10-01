from dataclasses import asdict, dataclass
from typing import Any
from uuid import uuid4

from certification_dtos import CertificationDTO
from shared_utils import (Key, Permission, User, get_dynamodb_item, get_dynamodb_table, to_kebab_case, utc_now,
                          verify_authorization)


@dataclass(slots=True)
class Certification:
    id: str
    slug: str
    name: str
    provider: str
    description: str
    category: str
    level: str
    official_url: str | None
    image_filename: str | None
    created_at: int
    updated_at: int | None


def certification_from_dynamodb(item: dict[str, Any]) -> Certification:
    return Certification(
        id=item["id"], slug=item["slug"], name=item["name"], provider=item["provider"],
        description=item["description"], category=item.get("category", "other"),
        level=item.get("level", "professional"), official_url=item.get("official_url"),
        image_filename=item.get("image_filename"),
        created_at=int(item["created_at"]), updated_at=item.get("updated_at"),
    )


def find_certification(slug: str) -> Certification | None:
    item = get_dynamodb_item("CERTIFICATION", slug)
    return certification_from_dynamodb(item) if item else None


def get_certification(slug: str) -> Certification:
    certification = find_certification(slug)
    if certification is None:
        raise LookupError(f"Certification '{slug}' not found")
    return certification


def get_certification_by_id(certification_id: str) -> Certification:
    certification = next((item for item in get_certifications() if item.id == certification_id), None)
    if certification is None:
        raise LookupError(f"Certification '{certification_id}' not found")
    return certification


def get_certifications() -> list[Certification]:
    response = get_dynamodb_table().query(
        KeyConditionExpression=Key("pk").eq("CERTIFICATION")
    )
    return [certification_from_dynamodb(item) for item in response.get("Items", [])]


def create_certification(dto: CertificationDTO, user: User) -> Certification:
    verify_authorization(user, Permission.ROOT)
    now = utc_now()
    slug = to_kebab_case(dto.name)
    certification = Certification(str(uuid4()), slug, dto.name, dto.provider,
                                  dto.description, dto.category, dto.level, dto.official_url,
                                  dto.image_filename, now, None)
    item = {"pk": "CERTIFICATION", "sk": slug, **asdict(certification), "certification": True}
    get_dynamodb_table().put_item(Item=item, ConditionExpression="attribute_not_exists(pk)")
    return certification
