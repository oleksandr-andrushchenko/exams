"""Immutable readable identifiers bounded for DynamoDB keys and escaped URLs."""

import re
from urllib.parse import quote
from uuid import UUID, uuid4

from shared_utils import get_dynamodb_item, to_kebab_case


MAX_CONTENT_ID_BYTES = 600
MAX_ENCODED_CONTENT_ID_LENGTH = 1800


def make_content_id(title: str, unique_suffix: str | None = None, fallback: str = "item") -> str:
    suffix = unique_suffix or uuid4().hex[:16]
    if not re.fullmatch(r"[0-9a-f]{16}", suffix):
        raise ValueError("Content ID suffix must contain 16 lowercase hexadecimal characters")
    text = re.sub(r"[-_]+", "-", to_kebab_case(title)).strip("-") or fallback
    ending = "-" + suffix
    prefix = []
    byte_count = len(ending)
    encoded_count = len(ending)
    for character in text:
        size = len(character.encode("utf-8"))
        encoded_size = len(quote(character, safe=""))
        if byte_count + size > MAX_CONTENT_ID_BYTES or encoded_count + encoded_size > MAX_ENCODED_CONTENT_ID_LENGTH:
            break
        prefix.append(character)
        byte_count += size
        encoded_count += encoded_size
    return "".join(prefix).rstrip("-") + ending


def is_legacy_content_id(value: str) -> bool:
    try:
        UUID(value)
        return True
    except (ValueError, TypeError, AttributeError):
        return False


def resolve_content_id(kind: str, content_id: str) -> str:
    # New IDs need no alias read. UUID aliases preserve old API calls after migration.
    if not is_legacy_content_id(content_id):
        return content_id
    visited = set()
    while content_id not in visited:
        visited.add(content_id)
        record = get_dynamodb_item(f"{kind}#{content_id}", "META")
        target = record.get("content_redirect_id") if record else None
        if not target:
            return content_id
        if not is_legacy_content_id(target):
            return target
        content_id = target
    raise RuntimeError("Content ID redirect loop detected")
