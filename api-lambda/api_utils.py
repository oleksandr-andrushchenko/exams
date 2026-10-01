from dataclasses import replace
from html.parser import HTMLParser
from urllib.parse import unquote, urlparse

from exam_dtos import (
    ExamCommentDTO, ExamDTO, UpdateCategoryDTO, UpdateExamCommentDTO, UpdateExamDTO, UpdateExamImpressionDTO,
    UpdateExamStatusDTO, UpdateTagDTO,
)
from basic_dtos import ContactMessageDTO, FileDTO, ImageFileDTO
from shared_utils import *
from shared_utils import (
    Category, User, find_exam, find_exam_by_slug_follow_redirects, find_user_by_username_follow_redirects,
    get_categories, get_dynamodb_item, get_exams, get_static_base_url, get_tags, get_web_base_url, logger,
)
from validation import validate_category_slug
from tag_subscription_dtos import TagSubscriptionDTO
from certification_utils import get_certification, get_certification_by_id
from question_dtos import QuestionDTO
from question_utils import create_question
from user_dtos import (
    UpdateUserDTO, UpdateUserImpressionDTO, UpdateUserStatusDTO,
    UserImpressionAction,
)
from web import RequestValidationError


class ExamHrefExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs: list[str] = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name == "href" and value is not None:
                self.hrefs.append(value)


class ExamImageSourceExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.sources: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() != "img":
            return
        for name, value in attrs:
            if name.lower() == "src" and value is not None:
                self.sources.append(value)
                return


def _get_internal_exam_link(href: str) -> tuple[str, str | None, str] | None:
    """Return the lookup type, optional username, and exam identifier for an internal exam URL."""
    parsed = urlparse(href)
    if parsed.netloc:
        site = urlparse(get_web_base_url())
        if not site.netloc or parsed.netloc.lower() != site.netloc.lower():
            return None
    elif parsed.scheme:
        return None

    path = unquote(parsed.path).rstrip("/")
    parts = path.split("/")
    if len(parts) != 3 or parts[0]:
        return None

    user_slug, exam_identifier = parts[1:]
    if user_slug == "exams":
        return "id", None, exam_identifier
    if user_slug.startswith("@"):
        user_slug = user_slug[1:]
    if not user_slug or not exam_identifier:
        return None
    return "slug", user_slug, exam_identifier


def _internal_exam_link_exists(link: tuple[str, str | None, str]) -> bool:
    lookup_type, user_slug, exam_identifier = link
    if lookup_type == "id":
        return find_exam(exam_identifier) is not None

    exam = find_exam_by_slug_follow_redirects(exam_identifier)
    user = find_user_by_username_follow_redirects(user_slug)
    return exam is not None and user is not None and exam.owner_id == user.id


def _normalize_href_for_duplicates(href: str) -> str:
    """Make absolute and root-relative same-site URLs comparable."""
    parsed = urlparse(href)
    if parsed.netloc:
        site = urlparse(get_web_base_url())
        if not site.netloc or parsed.netloc.lower() != site.netloc.lower():
            return href
    elif parsed.scheme or not parsed.path.startswith("/"):
        return href

    path = unquote(parsed.path).rstrip("/") or "/"
    query = f"?{parsed.query}" if parsed.query else ""
    fragment = f"#{parsed.fragment}" if parsed.fragment else ""
    return f"{path}{query}{fragment}"


def validate_exam_description_links(description: str) -> None:
    parser = ExamHrefExtractor()
    parser.feed(description)
    parser.close()

    seen = set()
    duplicate_hrefs = []
    for href in parser.hrefs:
        normalized_href = _normalize_href_for_duplicates(href)
        if normalized_href in seen and href not in duplicate_hrefs:
            duplicate_hrefs.append(href)
        seen.add(normalized_href)

    missing_hrefs = []
    checked_internal_links = set()
    for href in parser.hrefs:
        link = _get_internal_exam_link(href)
        if link is None or link in checked_internal_links:
            continue
        checked_internal_links.add(link)
        if not _internal_exam_link_exists(link):
            missing_hrefs.append(href)

    errors = []
    if duplicate_hrefs:
        errors.append(f"duplicate links: {', '.join(duplicate_hrefs)}")
    if missing_hrefs:
        errors.append(f"non-existent internal links: {', '.join(missing_hrefs)}")
    if errors:
        message = "; ".join(errors)
        raise RequestValidationError({"description": message, "content": message})


def get_all_exam_hrefs(cur_user: User | None = None) -> dict[str, list[str]]:
    query = ExamQueryDTO()
    result = {}

    while exams := get_exams(query, cur_user):
        for exam in exams:
            parser = ExamHrefExtractor()
            parser.feed(exam.description)
            parser.close()
            result[exam.id] = parser.hrefs

        offset = exams[-1].offset
        if not offset:
            break

        query = replace(query, offset=offset)

    return result


def get_all_exams(cur_user: User = None) -> list[Exam]:
    query = ExamQueryDTO()
    result = []

    while True:
        exams = get_exams(query, cur_user)

        if not exams:
            break

        result += exams

        offset = exams[-1].offset
        if not offset:
            break

        query = replace(query, offset=offset)

    return result


def drop_cdn_cache(user: User, paths: list[str] | None = None) -> tuple[bool, int]:
    verify_authorization(user, Permission.DROP_CDN_CACHE)
    res = _drop_cdn_cache(paths or [])
    return res.get("success"), res.get("items_count")


def _drop_cdn_cache(*urls) -> dict[str, Any]:
    items = set()
    for u in urls:
        if isinstance(u, str):
            items.add(u)
        elif isinstance(u, (list, tuple, set)):
            items.update(u)
        else:
            raise TypeError(f"Unsupported type: {type(u)}")

    # Resolve paths
    if items:
        paths = []
        for p in items:
            if not isinstance(p, str):
                raise TypeError(f"Invalid path type: {type(p)} (expected str)")

            if not p.startswith("/"):
                raise ValueError(f"Invalid CloudFront path (must start with '/'): {p}")

            paths.append(p)

        if len(paths) > 3000:
            raise ValueError("CloudFront supports max 3000 paths per invalidation request")
    else:
        paths = ["/*"]

    if not is_prod():
        return {
            "success": True,
            "invalidation_id": "",
            "status": "InProgress",
            "items_count": len(paths),
        }

    client = _get_cf_client()
    distribution_id = get_cf_distribution_id()
    response = client.create_invalidation(
        DistributionId=distribution_id,
        InvalidationBatch={
            "Paths": {
                "Quantity": len(paths),
                "Items": paths,
            },
            "CallerReference": str(uuid.uuid4()),
        },
    )

    metadata = response.get("ResponseMetadata", {})
    invalidation = response.get("Invalidation", {})

    return {
        "success": metadata.get("HTTPStatusCode") == 201,
        "invalidation_id": invalidation.get("Id"),
        "status": invalidation.get("Status"),
        "items_count": len(paths),
    }


def safe_execute(label: str, func, *args, **kwargs):
    try:
        return func(*args, **kwargs)
    except Exception as e:
        logger.warning(f"{label} failed: {e}")
        return None


def generate_sitemap(user: User, req) -> tuple[int, str]:
    verify_authorization(user, Permission.GENERATE_SITEMAP)

    today = datetime.utcnow().date().isoformat()

    def lastmod(ts_ms, fallback_ts_ms=None):
        ts_ms = ts_ms or fallback_ts_ms
        if not ts_ms:
            return today
        return datetime.fromtimestamp(
            float(ts_ms) / 1000,
            tz=timezone.utc
        ).date().isoformat()

    urls = []

    # Static
    def url(route: str) -> str:
        return get_url(req, route, True)

    urls.extend([
        (url("index"), today),
        (url("tags"), today),
        (url("contacts"), today),
        (url("rules"), today),
        (url("terms"), today),
        (url("earn"), today),
    ])

    # Post lists
    def exams_url(tp: ExamQueryType, tg: Tag | None = None) -> str:
        return get_exams_url(req, type=tp, tags=[tg.slug] if tg else [], absolute=True)

    for type_ in ExamQueryType:
        urls.append((exams_url(type_), today))
        for tag in get_tags(TagQueryDTO(limit=1000)):
            if tag.exams_count > 0:
                urls.append((exams_url(type_, tag), today))

    # Posts
    def exam_url(exam: Exam) -> str:
        return get_exam_url(req, exam, absolute=True)

    offset = None
    while exams := get_latest_exams(ExamQueryDTO(status=ExamStatus.PUBLISHED, limit=1000, offset=offset)):
        urls.extend([(exam_url(exam), lastmod(exam.updated_at, exam.created_at)) for exam in exams])
        offset = exams[-1].offset
        if not offset:
            break

    # User lists
    def users_url(tp: UserQueryType) -> str:
        return get_users_url(req, type=tp, absolute=True)

    for type_ in UserQueryType:
        urls.append((users_url(type_), today))

    # Users
    def user_url(user_: User) -> str:
        return get_user_url(req, user_, absolute=True)

    offset = None
    while users := get_latest_users(
            UserQueryDTO(status=UserStatus.ACTIVE, limit=1000, offset=offset)):
        urls.extend([(user_url(user), lastmod(user.updated_at, user.created_at)) for user in users])
        offset = users[-1].offset
        if not offset:
            break

    # Save
    sitemap_xml = f"""<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{''.join([f"""<url><loc>{loc}</loc><lastmod>{lastmod}</lastmod></url>""" for (loc, lastmod) in urls])}</urlset>"""

    sitemap_filename = save_public_file(
        FileDTO(content=sitemap_xml.encode("utf-8"), filename="sitemap.xml"),
        filename="sitemap.xml",
    )
    sitemap_url = get_static_url(req, sitemap_filename, absolute=True)

    # Invalidate CDN cache
    if is_prod():
        safe_execute("CF invalidation", _drop_cdn_cache, ["/sitemap.xml"])

    # Notify engines
    if is_prod():
        import httpx
        with httpx.Client(timeout=5.0) as client:
            safe_execute("Google SM notify", client.get, "https://www.google.com/ping", params={"sitemap": sitemap_url})
            safe_execute("Bing SM notify", client.get, "https://www.bing.com/ping", params={"sitemap": sitemap_url})

    return len(urls), sitemap_url


def create_tag_subscription(dto: TagSubscriptionDTO, user: User) -> TagSubscription:
    tag_subscription_id, now, key = str(uuid.uuid4()), utc_now(), tag_subscription_key(dto.tags)
    transacts = []
    add_dynamodb_put_transact(transacts, (f"USER#{user.id}", f"EXAM_TAG_SUBSCRIPTION#{tag_subscription_id}"),
                              {"exam_tag_subscription_id": tag_subscription_id, "user_id": user.id,
                               "tags": dto.tags, "exam_tag_subscription_key": key, "created_at": now})
    add_dynamodb_put_transact(transacts, (f"EXAM_TAG_SUBSCRIBERS#{key}", f"USER#{user.id}"),
                              {"user_id": user.id, "exam_tag_subscription_id": tag_subscription_id,
                               "exam_tag_subscription_key": key, "created_at": now}, new_pk_only=True)
    add_dynamodb_user_update_transact(transacts, user, deltas={"exam_tag_subscriptions_count": 1})
    try:
        dynamodb_transact_write(transacts)
    except DynamoDBTransactionError as exc:
        if exc.is_conditional():
            raise SlugDuplicationError("Tag subscription already exists", "tags")
        raise
    return TagSubscription(tag_subscription_id, user.id, dto.tags, now)


def delete_tag_subscription(tag_subscription_id: str, user: User) -> TagSubscription:
    item = get_dynamodb_item(f"USER#{user.id}", f"EXAM_TAG_SUBSCRIPTION#{tag_subscription_id}")
    if not item:
        raise UserNotFoundError("Tag subscription not found")
    subscription = tag_subscription_from_dynamodb(item)
    key = item.get("tag_subscription_key") or item["exam_tag_subscription_key"]
    transacts = []
    add_dynamodb_delete_transact(
        transacts, (f"USER#{user.id}", f"EXAM_TAG_SUBSCRIPTION#{tag_subscription_id}")
    )
    add_dynamodb_delete_transact(
        transacts, (f"EXAM_TAG_SUBSCRIBERS#{key}", f"USER#{user.id}")
    )
    add_dynamodb_user_update_transact(
        transacts, user, deltas={"exam_tag_subscriptions_count": -1}
    )
    dynamodb_transact_write(transacts)
    return subscription


def update_tag(tag: Tag, update_tag_dto: UpdateTagDTO, cur_user: User,
               req) -> None:
    verify_authorization(cur_user, Permission.UPDATE_TAG, tag)

    if cur_user.status == UserStatus.BANNED:
        raise UserBannedError()

    changes = update_tag_dto.get_changes(tag)
    if not changes:
        return

    now = utc_now()

    new_name = changes.pop("name", None)
    if new_name is not None:
        new_name = new_name.strip()
        if new_name != tag.name:
            changes["name"] = new_name

    image_action = changes.pop("image_action", "keep")

    if image_action == "delete":
        changes["image_filename"] = None
    elif image_action == "keep":
        changes.pop("image_filename", None)

    if not changes:
        return

    old_image = tag.image_filename
    old_slug = tag.slug
    slug = to_kebab_case(changes["name"]) if "name" in changes else old_slug
    slug_changed = slug != old_slug
    transacts = []

    if slug_changed:
        old_item = get_dynamodb_item(f"EXAM_TAG#{old_slug}", "META")
        if old_item is None:
            raise TagNotFoundError(f"Tag '{old_slug}' not found")

        new_item = {k: v for k, v in old_item.items() if k not in {"pk", "sk"}}
        new_item.update(changes)
        new_item["tag_name_sk"] = slug
        new_item["updated_at"] = now

        redirect_item = {
            "tag_name_sk": old_slug,
            "redirect_to": slug,
            "created_at": now,
        }
        add_dynamodb_put_transact(transacts, (f"EXAM_TAG_REDIRECT#{old_slug}", "META"), redirect_item, new_pk_only=True)
        add_dynamodb_put_transact(transacts, (f"EXAM_TAG#{slug}", "META"), new_item, new_pk_only=True)
        add_dynamodb_delete_transact(transacts, (f"EXAM_TAG#{old_slug}", "META"))

        for exam in get_latest_exams_by_tags(ExamQueryDTO(tags=[old_slug], limit=1000)):
            old_tags = list(exam.tags)
            tags = list(dict.fromkeys(slug if tag == old_slug else tag for tag in old_tags))

            add_delete_tag_combos_transact(transacts, exam, old_slug)
            add_dynamodb_exam_update_transact(transacts, exam, {"tags": tags})
            add_put_tag_combos_transact(transacts, exam, slug)
    else:
        add_dynamodb_tag_update_transact(transacts, tag, changes)

    try:
        dynamodb_transact_write(transacts)
    except DynamoDBTransactionError as e:
        if e.is_conditional():
            raise SlugDuplicationError(field="name")
        raise

    if "name" in changes:
        tag.name = changes["name"]
    if slug_changed:
        tag.slug = slug
    if "image_filename" in changes:
        tag.image_filename = changes["image_filename"]

    if old_image and image_action in {"delete", "replace"}:
        drop_public_file(old_image)


def save_public_file(file_dto: FileDTO, filename: str = None) -> str:
    if not filename:
        file_ext = file_dto.extension
        filename = str(uuid.uuid4())
        if isinstance(file_dto, ImageFileDTO):
            try:
                width, height = get_image_dimensions(file_dto.content)
                filename += f"_{width}x{height}"
            except ValueError:
                pass
        filename += f".{file_ext}"

    if not is_prod():
        filepath = os.path.join(get_static_files_dir(), filename)
        with open(filepath, "wb") as f:
            f.write(file_dto.content)
        return filename
    from io import BytesIO
    stream = BytesIO(file_dto.content)
    stream.seek(0)

    import mimetypes
    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    get_s3_client().upload_fileobj(
        stream,
        get_static_s3_bucket(),
        filename,
        ExtraArgs={
            "ContentType": content_type,
            "ContentDisposition": "inline",
        },
    )
    return filename


def resize_public_image(file_dto: ImageFileDTO, max_width: int = 1200) -> ImageFileDTO:
    width, height = get_image_dimensions(file_dto.content)
    if width <= max_width:
        return file_dto

    from io import BytesIO

    from PIL import Image

    target_height = max(1, round(height * max_width / width))
    output = BytesIO()
    with Image.open(BytesIO(file_dto.content)) as image:
        resized = image.resize((max_width, target_height), Image.Resampling.LANCZOS)
        resized.save(output, format=image.format)

    return replace(file_dto, content=output.getvalue())


def drop_public_file(filename: str) -> None:
    if not is_prod():
        # filepath = os.path.join(get_static_files_dir(), filename)
        # if os.path.exists(filepath):
        #     os.remove(filepath)
        return

    get_s3_client().delete_object(Bucket=get_static_s3_bucket(), Key=filename)


def update_category(category: Category, dto: UpdateCategoryDTO, cur_user: User) -> None:
    verify_authorization(cur_user, Permission.UPDATE_CATEGORY)
    if cur_user.status == UserStatus.BANNED:
        raise UserBannedError()

    changes = dto.get_changes(category)
    image_action = changes.pop("image_action", "keep")
    if image_action == "delete":
        changes["image_filename"] = None
    elif image_action == "keep":
        changes.pop("image_filename", None)
    if not changes:
        return

    old_image = category.image_filename
    now = utc_now()
    existing = get_dynamodb_item("CATEGORY", category.slug)
    changes = {
        "category_slug": category.slug,
        "name": category.name,
        "description": category.description,
        "created_at": (existing or {}).get("created_at", now),
        **({"published_exams_count": category.published_exams_count} if not existing else {}),
        **changes,
    }
    transacts = []
    add_dynamodb_update_transact(transacts, ("CATEGORY", category.slug), changes)
    dynamodb_transact_write(transacts)
    for key, value in changes.items():
        if hasattr(category, key):
            setattr(category, key, value)
    if old_image and image_action in {"delete", "replace"}:
        drop_public_file(old_image)


def create_category(slug: str, name: str, description: str, cur_user: User, parent_slug: str | None = None) -> Category:
    verify_authorization(cur_user, Permission.UPDATE_CATEGORY)
    if cur_user.status == UserStatus.BANNED:
        raise UserBannedError()
    slug = validate_category_slug(slug)
    name = name.strip()
    description = description.strip()
    if not 2 <= len(name) <= 80:
        raise ValueError("name must contain between 2 and 80 characters")
    if not 10 <= len(description) <= 500:
        raise ValueError("description must contain between 10 and 500 characters")
    existing = find_category(slug)
    if existing:
        return existing
    now = utc_now()
    values = {
        "category_slug": slug,
        "name": name,
        "description": description,
        "parent_slug": parent_slug,
        "published_exams_count": 0,
        "created_at": now,
    }
    transacts = []
    add_dynamodb_put_transact(transacts, ("CATEGORY", slug), values, new_pk_only=True)
    dynamodb_transact_write(transacts)
    return category_from_dynamodb(slug, {**values, "pk": "CATEGORY", "sk": slug})


def create_exam(exam_dto: ExamDTO, cur_user: User) -> Exam:
    verify_authorization(cur_user, Permission.CREATE_EXAM)

    if cur_user.status == UserStatus.BANNED:
        raise UserBannedError()

    now = utc_now()
    status = ExamStatus.UNPUBLISHED
    exam_id = str(uuid.uuid4())
    title = exam_dto.title
    description = exam_dto.description
    preview = description[:300]
    image_filename = exam_dto.image_filename
    tags = sanitize_tags(exam_dto.tags)
    category = exam_dto.category
    certification = get_certification_by_id(exam_dto.certification_id) if exam_dto.certification_id else None
    slug = to_kebab_case(title)

    transacts = []

    exam_item = {
        "id": exam_id,
        "title": title,
        "exam_slug": slug,
        "user_id": cur_user.id,
        "user_name": cur_user.name,
        "description": description,
        "content": description,
        "category": category,
        "certification_id": certification.id if certification else None,
        "certification_slug": certification.slug if certification else None,
        "certification_name": certification.name if certification else None,
        "difficulty": exam_dto.difficulty,
        "language": exam_dto.language,
        "tags": tags,
        "rating_sk": compute_rating_sk(0, now),
        "status": status,
        "created_at": now,
        "exam_status_pk": f"EXAM#{status}",
        "exam_user_status_pk": f"EXAM#{cur_user.id}#{status}",
        "exam_category_status_pk": f"EXAM#{category}#{status}",
    }
    if preview:
        exam_item["preview"] = preview
    if image_filename:
        exam_item["image_filename"] = image_filename
    if cur_user.username:
        exam_item["user_slug"] = cur_user.username
    add_dynamodb_put_transact(transacts, (f"EXAM#{exam_id}", "META"), exam_item, new_pk_only=True)

    add_user_activity_transact(transacts, cur_user, "exam.created", "exam", exam_id, title,
                               f"/exams/{exam_id}", cur_user.id, now)
    add_dynamodb_user_update_transact(transacts, cur_user, deltas={
        "unpublished_exams_count": 1,
    })
    # todo: should be unique in combination with username (cur_user, post)
    add_dynamodb_put_transact(transacts, (f"EXAM_SLUG#{slug}", "META"), {"exam_id": exam_id}, new_pk_only=True)

    try:
        dynamodb_transact_write(transacts)
    except DynamoDBTransactionError as e:
        if e.is_conditional():
            raise SlugDuplicationError(field="title")
        raise

    exam = exam_from_dynamodb(exam_item)
    create_question(exam, QuestionDTO(
        title="What is the main goal of this exam?",
        description="Choose the best answer.",
        choices=[
            {"title": "Understand the subject", "description": "Build understanding through practice.", "is_correct": True},
            {"title": "Skip the subject", "description": "Avoid learning the material.", "is_correct": False},
            {"title": "Avoid practice", "description": "Do not review the material.", "is_correct": False},
        ],
    ), cur_user)
    logger.info("New exam created", extra={"context": {"exam_id": exam_id}})
    return exam


def update_exam(exam: Exam, update_exam_dto: UpdateExamDTO, cur_user: User, req) -> None:
    verify_authorization(cur_user, Permission.UPDATE_EXAM, exam)

    if cur_user.status == UserStatus.BANNED:
        raise UserBannedError()

    changes = update_exam_dto.get_changes(exam)
    if not changes:
        return

    if "category" in changes:
        get_category(changes["category"])
    if "certification_id" in changes:
        certification_id = changes["certification_id"]
        certification = get_certification_by_id(certification_id) if certification_id else None
        changes["certification_id"] = certification.id if certification else None
        changes["certification_slug"] = certification.slug if certification else None
        changes["certification_name"] = certification.name if certification else None

    if "description" in changes:
        changes["content"] = changes["description"]
    if "tags" in changes:
        changes["tags"] = sanitize_tags(changes["tags"])
    old_status = exam.status
    published_already = old_status == ExamStatus.PUBLISHED
    now = utc_now()

    transacts = []

    old_title = exam.title
    if "title" in changes:
        new_title = changes["title"]
        if published_already and get_text_diff_percentage(old_title, new_title) > 10:
            changes["status"] = ExamStatus.UNPUBLISHED
        old_slug = exam.slug
        slug = to_kebab_case(new_title)
        if old_slug != slug:
            changes["exam_slug"] = slug
            # Create redirect item so old slug resolves
            redirect_item = {
                "exam_slug": old_slug,
                "redirect_to": slug,
                "created_at": now
            }
            add_dynamodb_put_transact(transacts, (f"EXAM_REDIRECT#{old_slug}", "META"), redirect_item, new_pk_only=True)
            # Create new slug lock
            add_dynamodb_put_transact(transacts, (f"EXAM_SLUG#{slug}", "META"), {"exam_id": exam.id},
                                      new_pk_only=True)

    old_description = exam.description
    if "description" in changes:
        description = changes["description"]
        if published_already and get_text_diff_percentage(old_description, description) > 10:
            changes["status"] = ExamStatus.UNPUBLISHED
        changes["preview"] = description[:300]

    old_tags = list(exam.tags)
    tags_changed = False
    if "tags" in changes:
        changes["tags"] = sanitize_tags(changes["tags"])
        tags_changed = sorted(changes["tags"]) != sorted(old_tags)
        if published_already and tags_changed:
            changes["status"] = ExamStatus.UNPUBLISHED

    if published_already and changes.get("status") == ExamStatus.UNPUBLISHED:
        add_decrease_tags_rating_transact(transacts, old_tags, now)
        add_delete_tag_combos_transact(transacts, exam)
    elif tags_changed:
        add_delete_tag_combos_transact(transacts, exam)

    category_changed = "category" in changes and changes["category"] != exam.category
    if published_already and category_changed:
        changes["status"] = ExamStatus.UNPUBLISHED

    exam_owner = get_user(exam.owner_id)
    if exam.user_name != exam_owner.name:
        changes["user_name"] = exam_owner.name
    if exam.user_slug != exam_owner.username:
        changes["user_slug"] = exam_owner.username

    exam_owner_deltas = {}

    status = changes.get("status", exam.status)
    status_changed = status != old_status
    if status_changed:
        # Update post lists
        changes["exam_status_pk"] = f"EXAM#{status}"
        changes["exam_user_status_pk"] = f"EXAM#{exam.user_id}#{status}"

        # User post counters
        exam_owner_deltas[f"{old_status}_exams_count"] = -1
        exam_owner_deltas[f"{status}_exams_count"] = 1

    if status_changed or "category" in changes:
        changes["exam_category_status_pk"] = f"EXAM#{changes.get('category', exam.category)}#{status}"

    crossed_published_boundary = (old_status == ExamStatus.PUBLISHED) != (status == ExamStatus.PUBLISHED)
    if crossed_published_boundary:
        add_update_category_published_count_transact(
            transacts, exam.category, 1 if status == ExamStatus.PUBLISHED else -1, now
        )

    add_dynamodb_user_update_transact(transacts, exam_owner, deltas=exam_owner_deltas)
    add_dynamodb_exam_update_transact(transacts, exam, changes)

    if cur_user.id != exam_owner.id:
        add_dynamodb_user_update_transact(transacts, cur_user)

    try:
        dynamodb_transact_write(transacts)
    except DynamoDBTransactionError as e:
        if e.is_conditional():
            raise SlugDuplicationError(field="title")
        raise

    for k, v in changes.items():
        if k == "exam_slug":
            k = "slug"
        if hasattr(exam, k):
            setattr(exam, k, v)


def create_exam_comment(exam: Exam, exam_comment_dto: ExamCommentDTO, cur_user: User,
                           req) -> ExamComment:
    verify_authorization(cur_user, Permission.CREATE_EXAM_COMMENT)

    if cur_user.status == UserStatus.BANNED:
        raise UserBannedError()

    now = utc_now()
    comment_id = f"{now}#{str(uuid.uuid4())}"

    transacts = []

    exam_comment_item = {
        "id": comment_id,

        "user_id": cur_user.id,
        "user_name": cur_user.name,
        "user_avatar_filename": cur_user.avatar_filename,
        "user_username": cur_user.username,

        "exam_id": exam.id,
        "exam_title": exam.title,
        "comment_exam_slug": exam.slug,
        "exam_comment_pk": "EXAM_COMMENT",
        "exam_comment_user_pk": f"USER#{cur_user.id}",

        "text": exam_comment_dto.text,
        "created_at": now,
    }

    add_dynamodb_put_transact(transacts, (f"EXAM#{exam.id}", f"COMMENT#{comment_id}"), exam_comment_item)
    add_dynamodb_exam_update_transact(transacts, exam, deltas={"comments_count": 1})
    add_user_activity_transact(transacts, cur_user, "comment.created", "comment", comment_id, exam.title,
                               f"/exams/{exam.id}#comment-{comment_id}", cur_user.id, now)
    add_dynamodb_user_update_transact(transacts, cur_user, deltas={
        "exam_comments_count": 1,
    })

    if cur_user.id != exam.owner_id:
        exam_owner = get_user(exam.owner_id)
        add_dynamodb_user_update_transact(transacts, exam_owner)

    try:
        dynamodb_transact_write(transacts)
    except DynamoDBTransactionError as e:
        if e.is_conditional():
            raise SlugDuplicationError(field="title")
        raise

    logger.info("New comment added", extra={"context": {"exam_id": exam.id, "comment_id": comment_id}})
    return exam_comment_from_dynamodb(exam_comment_item)


def update_exam_comment(exam: Exam, exam_comment: ExamComment,
                           update_exam_comment_dto: UpdateExamCommentDTO,
                           cur_user: User, req) -> None:
    verify_authorization(cur_user, Permission.UPDATE_EXAM_COMMENT, exam_comment)

    if cur_user.status == UserStatus.BANNED:
        raise UserBannedError()

    if exam_comment.likes_count != 0 or exam_comment.dislikes_count != 0:
        raise ExamCommentNonEditableError()

    changes = update_exam_comment_dto.get_changes(exam_comment)
    if not changes:
        return

    transacts = []

    add_dynamodb_update_transact(transacts, (f"EXAM#{exam.id}", f"COMMENT#{exam_comment.id}"), changes)

    add_dynamodb_user_update_transact(transacts, cur_user)

    if cur_user.id != exam.owner_id:
        exam_owner = get_user(exam.owner_id)
        add_dynamodb_user_update_transact(transacts, exam_owner)

    dynamodb_transact_write(transacts)

    for k, v in changes.items():
        if hasattr(exam_comment, k):
            setattr(exam_comment, k, v)


def update_dynamodb_item(
        key: tuple[str, str],
        changes: dict[str, Any] | None = None,
        deltas: dict[str, Any] | None = None,
        add_updated_at: bool = True
) -> None:
    param_dict = dict(locals())
    update_item_params = build_dynamodb_update_item_params(**param_dict)
    get_dynamodb_table().update_item(**update_item_params["Update"])


def update_user(user: User, update_user_dto: UpdateUserDTO, cur_user: User, req) -> None:
    verify_authorization(cur_user, Permission.UPDATE_USER, user)

    if cur_user.status == UserStatus.BANNED:
        raise UserBannedError()

    changes = update_user_dto.get_changes(user)
    if not changes:
        return

    now = utc_now()

    if "website" in changes and changes["website"]:
        website = str(changes["website"]).rstrip("/")
        if website == user.website:
            changes.pop("website")
        else:
            changes["website"] = website

    transacts = []
    avatar_action = changes.pop("avatar_action", "keep")

    if avatar_action == "delete":
        changes["avatar_filename"] = None
    elif avatar_action == "keep":
        changes.pop("avatar_filename", None)

    if not changes:
        return

    old_avatar = user.avatar_filename
    exam_user_changes = {}
    comment_user_changes = {}

    if "name" in changes:
        exam_user_changes["user_name"] = changes["name"]
        comment_user_changes["user_name"] = changes["name"]

    if "username" in changes:
        old_slug = user.username
        slug = changes["username"]

        if old_slug and slug:
            redirect_item = {
                "username": old_slug,
                "redirect_to": slug,
                "created_at": now
            }
            add_dynamodb_put_transact(transacts, (f"USER_REDIRECT#{old_slug}", "META"), redirect_item, new_pk_only=True)

        if slug:
            add_dynamodb_put_transact(transacts, (f"USER_SLUG#{slug}", "META"), {"user_id": user.id}, new_pk_only=True)
        elif old_slug:
            add_dynamodb_delete_transact(transacts, (f"USER_SLUG#{old_slug}", "META"))

        exam_user_changes["user_slug"] = slug
        comment_user_changes["user_username"] = slug

    if "avatar_filename" in changes:
        comment_user_changes["user_avatar_filename"] = changes["avatar_filename"]

    if exam_user_changes:
        for exam in get_all_exams_by_user(user):
            add_dynamodb_exam_update_transact(transacts, exam, exam_user_changes)

    if comment_user_changes:
        for comment in get_all_exam_comments_by_user(user):
            add_dynamodb_update_transact(
                transacts,
                (f"EXAM#{comment.exam_id}", f"COMMENT#{comment.id}"),
                comment_user_changes,
            )

    add_dynamodb_user_update_transact(transacts, user, changes, {})

    if user.id != cur_user.id:
        add_dynamodb_user_update_transact(transacts, cur_user)

    try:
        dynamodb_transact_write(transacts)
    except DynamoDBTransactionError as e:
        if e.is_conditional():
            raise SlugDuplicationError(field="username")
        raise

    if old_avatar and avatar_action in {"delete", "replace"}:
        drop_public_file(old_avatar)


def update_user_status(user: User, update_user_status_dto: UpdateUserStatusDTO, cur_user: User, req) -> None:
    # logger.debug(f"update_user_status: user: {user}, cur_user: {cur_user}")
    verify_authorization(cur_user, Permission.UPDATE_USER_STATUS)

    if cur_user.status == UserStatus.BANNED:
        raise UserBannedError()

    changes = update_user_status_dto.get_changes()
    if not changes:
        return
    if not "comment" in changes:
        changes["comment"] = None

    status = changes["status"]
    changes["user_status_pk"] = f"USER#{status}"

    transacts = []

    add_dynamodb_user_update_transact(transacts, cur_user)

    if cur_user.id != user.id:
        add_dynamodb_user_update_transact(transacts, user, changes, {})

    # logger.debug(transacts)

    dynamodb_transact_write(transacts)


def update_exam_status(exam: Exam, update_exam_status_dto: UpdateExamStatusDTO, cur_user: User,
                          req) -> None:
    # logger.debug(f"update_exam_status: post: {post}, cur_user: {cur_user}")
    verify_authorization(cur_user, Permission.UPDATE_EXAM_STATUS)

    if cur_user.status == UserStatus.BANNED:
        raise UserBannedError()

    if exam.status == ExamStatus.PUBLISHED:
        raise ExamAlreadyPublishedError()

    changes = update_exam_status_dto.get_changes()
    if not changes:
        return
    if not "comment" in changes:
        changes["comment"] = None

    old_status = exam.status
    status = changes["status"]
    now = utc_now()

    transacts = []

    exam_owner = get_user(exam.owner_id)
    add_dynamodb_user_update_transact(transacts, exam_owner, deltas={
        # User post counters
        f"{old_status}_exams_count": -1,
        f"{status}_exams_count": 1,
    })

    crossed_published_boundary = (old_status == ExamStatus.PUBLISHED) != (status == ExamStatus.PUBLISHED)
    if crossed_published_boundary and status == ExamStatus.PUBLISHED:
        if not exam.published_at:
            changes["published_at"] = now
        if exam_owner:
            changes["user_slug"] = exam_owner.username

        add_increase_tags_rating_transact(transacts, exam.tags, now)
        add_put_tag_combos_transact(transacts, exam)
        add_update_category_published_count_transact(transacts, exam.category, 1, now)
    elif crossed_published_boundary:
        add_decrease_tags_rating_transact(transacts, exam.tags, now)
        add_delete_tag_combos_transact(transacts, exam)
        add_update_category_published_count_transact(transacts, exam.category, -1, now)

    changes["exam_status_pk"] = f"EXAM#{status}"
    changes["exam_user_status_pk"] = f"EXAM#{exam.user_id}#{status}"
    changes["exam_category_status_pk"] = f"EXAM#{exam.category}#{status}"

    add_dynamodb_exam_update_transact(transacts, exam, changes)

    if cur_user.id != exam_owner.id:
        add_dynamodb_user_update_transact(transacts, cur_user)

    # logger.debug(transacts)

    dynamodb_transact_write(transacts)

    logger.info("Exam status changed", extra={"context": {"exam_id": exam.id, "status": status}})
    if status == ExamStatus.PUBLISHED:
        try:
            dispatch_exam_published_event(exam)
        except Exception:
            logger.exception("Unable to dispatch exam published event")


def create_contact_message(message_dto: ContactMessageDTO, user: User = None) -> ContactMessage:
    user and verify_authorization(user, Permission.CREATE_CONTACT_MESSAGE)

    now = utc_now()
    message_id = str(uuid.uuid4())

    name = message_dto.name
    message = message_dto.message

    if is_prod():
        text = (
            f"New contact form submission:\n"
            f"ID: {message_id}\n"
            f"Name: {name}\n"
            f"Email: {message_dto.email}\n"
            f"Message: {message}\n"
            f"User ID: {user.id if user else 'N/A'}"
        )
        get_sns_client().publish(
            TopicArn=get_contact_topic_arn(),
            Message=text,
            Subject="New Contact Form Submission"
        )

    message_item = {
        "pk": f"CONTACT_MESSAGE#{message_id}",
        "sk": "META",
        "message_id": message_id,
        "name": name,
        "email": message_dto.email,
        "message": message,
        "created_at": now,
    }
    if user:
        message_item["user_id"] = user.id

    get_dynamodb_table().put_item(Item=message_item)
    logger.info("New contact message", extra={"context": {"message_id": message_id}})

    return ContactMessage(
        id=message_id,
        name=message_item["name"],
        email=str(message_item["email"]),
        message=message_item["message"],
        user_id=message_item.get("user_id"),
        created_at=now,
    )


def update_exam_impression(exam: Exam, update_exam_impression_dto: UpdateExamImpressionDTO,
                              cur_user: User,
                              req) -> None:
    verify_authorization(cur_user, Permission.UPDATE_EXAM_IMPRESSION, exam)

    if cur_user.status == UserStatus.BANNED:
        raise UserBannedError()

    current_impression = find_exam_impression(exam, cur_user)
    current_action = current_impression.action if current_impression else None
    action = update_exam_impression_dto.action
    exam_impression_item = {
        "exam_id": exam.id,
        "user_id": cur_user.id,
        "action": action,
    }
    transacts = []

    exam_deltas = {}
    exam_imp_key = (f"EXAM#{exam.id}", f"IMP#{cur_user.id}")

    if action == ExamImpressionAction.LIKE:
        if current_action == ExamImpressionAction.LIKE:
            add_dynamodb_delete_transact(transacts, exam_imp_key)
            exam_deltas["likes_count"] = -1
            exam_deltas["rating_sk"] = compute_rating_sk(-1)
        elif current_action == ExamImpressionAction.DISLIKE:
            add_dynamodb_update_transact(transacts, exam_imp_key, {"action": ExamImpressionAction.LIKE})
            exam_deltas["dislikes_count"] = -1
            exam_deltas["likes_count"] = 1
            exam_deltas["rating_sk"] = compute_rating_sk(2)
        else:
            add_dynamodb_put_transact(transacts, exam_imp_key,
                                      {**exam_impression_item, "action": ExamImpressionAction.LIKE},
                                      new_pk_only=True)
            exam_deltas["likes_count"] = 1
            exam_deltas["rating_sk"] = compute_rating_sk(1)

    elif action == ExamImpressionAction.DISLIKE:
        if current_action == ExamImpressionAction.DISLIKE:
            add_dynamodb_delete_transact(transacts, exam_imp_key)
            exam_deltas["dislikes_count"] = -1
            exam_deltas["rating_sk"] = compute_rating_sk(1)
        elif current_action == ExamImpressionAction.LIKE:
            add_dynamodb_update_transact(transacts, exam_imp_key, {"action": ExamImpressionAction.DISLIKE})
            exam_deltas["likes_count"] = -1
            exam_deltas["dislikes_count"] = 1
            exam_deltas["rating_sk"] = compute_rating_sk(-2)
        else:
            add_dynamodb_put_transact(transacts, exam_imp_key,
                                      {**exam_impression_item, "action": ExamImpressionAction.DISLIKE},
                                      new_pk_only=True)
            exam_deltas["dislikes_count"] = 1
            exam_deltas["rating_sk"] = compute_rating_sk(-1)

    add_dynamodb_exam_update_transact(transacts, exam, deltas=exam_deltas)

    add_dynamodb_user_update_transact(transacts, cur_user)

    if cur_user.id != exam.owner_id:
        exam_owner = get_user(exam.owner_id)
        add_dynamodb_user_update_transact(transacts, exam_owner)

    logger.debug(transacts)
    dynamodb_transact_write(transacts)


def update_user_impression(user: User, update_relation_dto: UpdateUserImpressionDTO, cur_user: User, req) -> None:
    verify_authorization(cur_user, Permission.UPDATE_USER_IMPRESSION, user)

    if user.status == UserStatus.BANNED:
        raise UserBannedError()

    if user.id == cur_user.id:
        return

    current_relation = find_user_impression(user, cur_user)
    current_action = current_relation.action if current_relation else None
    action = update_relation_dto.action
    relation_item = {
        "user_id": cur_user.id,
        "target_user_id": user.id,
        "action": action,
    }
    transacts = []

    cur_user_deltas = {
    }
    user_deltas = {
    }
    relation_key = (f"USER#{cur_user.id}", f"REL#{user.id}")

    if action == UserImpressionAction.FOLLOW:
        if current_action == UserImpressionAction.FOLLOW:
            # Unfollow
            add_dynamodb_delete_transact(transacts, relation_key)
            cur_user_deltas["following_count"] = -1
            user_deltas["followers_count"] = -1
            user_deltas["rating_sk"] = compute_rating_sk(-1)
        elif current_action == UserImpressionAction.BLOCK:
            # Switching from block to follow
            add_dynamodb_update_transact(transacts, relation_key, {"action": UserImpressionAction.FOLLOW})
            cur_user_deltas["following_count"] = 1
            user_deltas["followers_count"] = 1
            user_deltas["rating_sk"] = compute_rating_sk(2)
        else:
            # New follow
            add_dynamodb_put_transact(transacts, relation_key, relation_item, new_pk_only=True)
            cur_user_deltas["following_count"] = 1
            user_deltas["followers_count"] = 1
            user_deltas["rating_sk"] = compute_rating_sk(1)

    elif action == UserImpressionAction.BLOCK:
        if current_action == UserImpressionAction.BLOCK:
            # Unblock
            add_dynamodb_delete_transact(transacts, relation_key)
            user_deltas["rating_sk"] = compute_rating_sk(1)
        elif current_action == UserImpressionAction.FOLLOW:
            # Switching from follow to block
            add_dynamodb_update_transact(transacts, relation_key, {"action": UserImpressionAction.BLOCK})
            cur_user_deltas["following_count"] = -1
            user_deltas["followers_count"] = -1
            user_deltas["rating_sk"] = compute_rating_sk(-2)
        else:
            # New block
            add_dynamodb_put_transact(transacts, relation_key, relation_item, new_pk_only=True)
            user_deltas["rating_sk"] = compute_rating_sk(-1)

    add_dynamodb_user_update_transact(transacts, cur_user, deltas=cur_user_deltas)
    add_dynamodb_user_update_transact(transacts, user, deltas=user_deltas)

    dynamodb_transact_write(transacts)


def get_email_files_dir() -> str:
    return config.get("email_files_dir")


def get_static_s3_bucket() -> str:
    return os.getenv("STATIC_S3_BUCKET")


def get_contact_topic_arn():
    return get_config().get("contact_topic_arn")


def get_ses_from_email():
    return get_config().get("ses_from_email")


def dispatch_exam_published_event(exam: Exam) -> None:
    handle_exam_published_event(ExamPublishedEvent(exam))


def save_email_to_disk(sender: str, recipient: str, subject: str, text_body: str, html_body: str) -> None:
    from email.message import EmailMessage

    message = EmailMessage()
    message["From"] = sender
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    emails_dir = get_email_files_dir()
    os.makedirs(emails_dir, exist_ok=True)
    email_path = os.path.join(emails_dir, f"{utc_now()}-{uuid.uuid4()}.eml")
    with open(email_path, "wb") as email_file:
        email_file.write(message.as_bytes())
    logger.info("Saved development email to %s", email_path)


def handle_exam_published_event(event: ExamPublishedEvent) -> None:
    from itertools import combinations

    exam = event.exam
    matching_subscription_tags = {}

    for size in range(1, len(exam.tags) + 1):
        for combo in combinations(sorted(exam.tags), size):
            subscription_key = "EXAM_TAG_SUBSCRIBERS#" + "#".join(combo)
            exclusive_start_key = None
            while True:
                response = query_dynamodb_table(
                    key_condition_expr=Key("pk").eq(subscription_key),
                    exclusive_start_key=exclusive_start_key,
                )
                for item in response.get("Items", []):
                    matching_subscription_tags.setdefault(item["user_id"], set()).add(combo)
                exclusive_start_key = response.get("LastEvaluatedKey")
                if not exclusive_start_key:
                    break

    if not matching_subscription_tags:
        return

    sender = get_ses_from_email()
    if is_prod() and not sender:
        logger.warning("Exam publication notification skipped: SES_FROM_EMAIL is not configured")
        return
    sender = sender or "no-reply@localhost"

    base_url = get_web_base_url().rstrip('/')
    exam_url = f"{base_url}/exams/{exam.id}"
    subject = f"New exam matching your interests: {exam.title}"

    for user_id, subscriptions in matching_subscription_tags.items():

        if user_id == exam.user_id:
            continue
        user = find_user(user_id)
        if not user or not user.email:
            continue

        tag_links = [
            {
                "name": " + ".join(subscription_tags),
                "url": f"{base_url}/exams?{urlencode([('type', 'latest'), ('status', 'published')] + [('tags', tag) for tag in subscription_tags])}",
            }
            for subscription_tags in sorted(subscriptions)
        ]
        subscribed_tags_text = ", ".join(link["name"] for link in tag_links)
        text_body = (
                f"Hello {user.name or 'there'},\n\n"
                "A new exam matching your interests was published:\n\n"
                f"{exam.title}\n"
                f"Subscribed interests: {subscribed_tags_text}\n"
                + "\n".join(f"{tag['name']}: {tag['url']}" for tag in tag_links)
                + f"\n\nRead it here: {exam_url}\n\n"
                  f"Best regards,\n{get_config().get('site_name', 'The team')}\n"
        )
        html_body = get_html_content("emails/exam-published-notification.html", {
            "recipient_name": user.name or "there",
            "exam_title": exam.title,
            "exam_url": exam_url,
            "tag_links": tag_links,
        })
        try:
            if not is_prod():
                save_email_to_disk(sender, user.email, subject, text_body, html_body)
                continue
            get_ses_client().send_email(
                Source=sender,
                Destination={"ToAddresses": [user.email]},
                Message={
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {
                        "Text": {"Data": text_body, "Charset": "UTF-8"},
                        "Html": {"Data": html_body, "Charset": "UTF-8"},
                    },
                },
            )
        except Exception:
            logger.exception(
                "Unable to send exam publication notification",
                extra={"user_id": user_id, "exam_id": exam.id},
            )


def get_cf_distribution_id() -> str:
    return os.getenv("CLOUDFRONT_DISTRIBUTION_ID")


@lru_cache
def get_s3_client():
    import boto3
    return boto3.client("s3")


@lru_cache
def _get_cf_client():
    import boto3
    return boto3.client("cloudfront")


@lru_cache
def get_sns_client():
    import boto3
    return boto3.client("sns")


@lru_cache
def get_ses_client():
    import boto3
    return boto3.client("ses", region_name=get_aws_region())


def get_image_dimensions(data: bytes) -> tuple[int, int]:
    """Return (width, height) for JPEG, PNG, GIF images from raw bytes."""

    import struct

    # PNG
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        if len(data) < 24:
            raise ValueError("PNG file too short")
        width, height = struct.unpack(">II", data[16:24])
        return width, height

    # GIF
    elif data[:6] in (b"GIF87a", b"GIF89a"):
        if len(data) < 10:
            raise ValueError("GIF file too short")
        width, height = struct.unpack("<HH", data[6:10])
        return width, height

    # JPEG
    elif data[:2] == b"\xff\xd8":
        offset = 2
        while offset + 1 < len(data):
            if data[offset] != 0xFF:
                raise ValueError("Invalid JPEG marker")
            marker = data[offset + 1]

            if marker in {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                          0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}:
                # SOF payload starts with precision, followed by height and width.
                segment = data[offset + 4:offset + 9]
                if len(segment) < 5:
                    raise ValueError("JPEG SOF segment too short")
                height, width = struct.unpack(">xHH", segment)
                return width, height
            else:
                if offset + 4 > len(data):
                    raise ValueError("Truncated JPEG")
                seg_len = struct.unpack(">H", data[offset + 2:offset + 4])[0]
                if seg_len < 2:
                    raise ValueError("Invalid segment length")
                offset += 2 + seg_len

        raise ValueError("No SOF marker found in JPEG")

    raise ValueError("Unsupported image type")


def find_preview(html_content: str) -> str | None:
    from html_parsers import FirstPExtractor
    parser = FirstPExtractor()
    parser.feed(html_content)

    text = " ".join(part.strip() for part in parser.text_parts if part.strip())

    if not text:
        return None

    return text[:300]


def find_static_image_filename(html_content: str) -> str | None:
    allowed_extensions = "|".join(
        re.escape(extension) for extension in sorted(ImageFileDTO.ALLOWED_IMAGE_EXTENSIONS)
    )
    filename_pattern = re.compile(
        rf"[0-9a-fA-F-]+(?:_[0-9]+x[0-9]+)?\.(?:{allowed_extensions})",
        flags=re.IGNORECASE,
    )
    static_origin = urlparse(get_static_base_url())

    parser = ExamImageSourceExtractor()
    parser.feed(html_content)
    parser.close()

    for source in parser.sources:
        parsed_source = urlparse(source)
        if parsed_source.netloc:
            if not static_origin.netloc or parsed_source.netloc.lower() != static_origin.netloc.lower():
                continue
            if parsed_source.scheme and parsed_source.scheme.lower() != static_origin.scheme.lower():
                continue
            path = parsed_source.path
        elif parsed_source.scheme:
            continue
        else:
            path = parsed_source.path
            if "/" in path.lstrip("/"):
                continue

        filename = path.rsplit("/", 1)[-1]
        if filename_pattern.fullmatch(filename):
            return filename

    return None


def get_all_exams_by_user(user: User) -> list[Exam]:
    exams = []
    for status in ExamStatus:
        exclusive_start_key = None
        while True:
            response = query_dynamodb_table(
                index_name="EXAMS_BY_USER_STATUS_CREATED_AT_2",
                key_condition_expr=Key("exam_user_status_pk").eq(f"EXAM#{user.id}#{status}"),
                scan_index_forward=False,
                exclusive_start_key=exclusive_start_key,
            )
            exams.extend(exam_from_dynamodb(item) for item in response.get("Items", []))
            exclusive_start_key = response.get("LastEvaluatedKey")
            if not exclusive_start_key:
                break
    return exams


def get_all_exam_comments_by_user(user: User) -> list[ExamComment]:
    comments = []
    exclusive_start_key = None
    while True:
        response = query_dynamodb_table(
            index_name="EXAM_COMMENTS_BY_USER_CREATED_AT",
            key_condition_expr=Key("exam_comment_user_pk").eq(f"USER#{user.id}"),
            scan_index_forward=False,
            exclusive_start_key=exclusive_start_key,
        )
        comments.extend(exam_comment_from_dynamodb(item) for item in response.get("Items", []))
        exclusive_start_key = response.get("LastEvaluatedKey")
        if not exclusive_start_key:
            break
    return comments
