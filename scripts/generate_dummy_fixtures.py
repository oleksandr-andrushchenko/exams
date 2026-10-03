from api_utils import (
    ExamCommentDTO,
    ExamDTO,
    ExamImpressionAction,
    ExamStatus,
    Permission,
    TagSubscriptionDTO,
    UpdateExamImpressionDTO,
    UpdateExamStatusDTO,
    UpdateTagDTO,
    UpdateUserDTO,
    UpdateUserImpressionDTO,
    UserImpressionAction,
    create_exam,
    create_category,
    create_exam_comment,
    create_tag_subscription,
    find_tag,
    get_dummy_user_token,
    is_prod,
    update_exam_impression,
    update_exam_status,
    update_dynamodb_item,
    update_tag,
    update_user,
    update_user_impression,
    upsert_user_by_user_token,
)
from question_dtos import QuestionDTO
from question_utils import create_question
from shared_utils import get_user_tag_subscription_for_tags
from certification_dtos import CertificationDTO
from certification_utils import create_certification, find_certification
from shared_utils import to_kebab_case


def create_dummy_fixtures() -> None:
    import random
    import uuid
    if is_prod():
        return
    created_exams = []
    created_users = []

    def add_default_question(exam, owner):
        return create_question(exam, QuestionDTO(
            title="What is the primary design constraint?",
            description="Choose the constraint that best matches the scenario.",
            choices=[
                {"title": "Reliability", "description": "The system must keep working.", "is_correct": True},
                {"title": "Color", "description": "A visual presentation detail.", "is_correct": False},
                {"title": "Branding", "description": "A product identity detail.", "is_correct": False},
            ],
        ), owner)
    generated_image_filenames = [
        "3d7af01f-819e-4c2f-bc69-eb7245b76a74_1809x1247.png",
        "45e97e68-a321-4657-9956-e942d9d757a7_1279x518.png",
        "4fdd2dcc-8c7d-40ac-80a6-647c828af338_1000x376.png",
        "5b027ec7-c018-4744-9eda-00abf75cf685_1111x712.png",
        "6a5118c0-a073-483b-ac5b-79e0a554e703_988x494.png",
        "a167891d-7e91-40d6-a5c4-1a3ddb27dcc2_1575x842.png",
        "ebdbe93d-99ec-4a47-b821-f4dfe0da769b_798x475.png",
    ]
    used_user_names = {"John Doe"}
    used_exam_titles = set()
    first_names = ["Lorem", "Ipsum", "Dolor", "Amet", "Consectetur", "Adipiscing", "Elit"]
    last_names = ["Systems", "Patterns", "Scalability", "Reliability", "Architecture", "Telemetry", "Networks"]
    title_openers = ["Designing", "Building", "Exploring", "Modeling", "Operating", "Scaling", "Evolving"]
    title_subjects = ["Reliable Event Pipelines", "Distributed Data Planes", "Resilient Service Boundaries", "Adaptive Storage Systems", "Observable Control Loops", "Fault Tolerant Workflows", "Composable Platform Primitives"]
    title_endings = ["with Practical Constraints", "for Fast-Growing Systems", "under Real-World Load", "from First Principles", "without Losing Simplicity", "for Teams That Ship"]
    fixture_tag_names = [
        "distributed-systems", "event-driven", "cloud-architecture", "databases",
        "devops", "software-design", "observability", "reliability", "api-design",
        "backend", "frontend", "testing", "security", "performance", "automation",
        "containers", "kubernetes", "serverless", "messaging", "networking",
        "data-engineering", "machine-learning", "open-source", "teamwork",
    ]
    unused_fixture_tags = fixture_tag_names.copy()
    content_openers = ["A useful starting point is", "The practical challenge is", "In a production system", "A resilient design keeps", "The simplest approach begins with", "Over time, teams discover that"]
    content_subjects = ["clear ownership", "small feedback loops", "explicit boundaries", "measurable failure modes", "repeatable deployments", "well-defined contracts", "careful capacity planning"]
    content_actions = ["reduces unnecessary coordination", "makes failures easier to isolate", "keeps operational work visible", "creates room for gradual change", "turns assumptions into testable decisions", "helps teams compare trade-offs"]
    content_endings = ["before the system becomes difficult to change.", "without hiding important constraints.", "while keeping the implementation understandable.", "even when traffic and team size increase.", "so the result remains useful beyond the first release."]

    def unique_user_name() -> str:
        while True:
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            if name not in used_user_names:
                used_user_names.add(name)
                return name

    def unique_exam_title() -> str:
        while True:
            title = (f"{random.choice(title_openers)} {random.choice(title_subjects)} "
                     f"{random.choice(title_endings)} {uuid.uuid4().hex[:8]}")
            if title not in used_exam_titles:
                used_exam_titles.add(title)
                return title
    def random_exam_tags() -> list[str]:
        required_tag = unused_fixture_tags.pop(random.randrange(len(unused_fixture_tags))) if unused_fixture_tags else None
        available_tags = [tag for tag in fixture_tag_names if tag != required_tag]
        extra_tags = random.sample(available_tags, random.randint(0, 2))
        return [required_tag, *extra_tags] if required_tag else random.sample(fixture_tag_names, random.randint(1, 3))

    def random_exam_description() -> str:
        sentences = [
            f"{random.choice(content_openers)} {random.choice(content_subjects)} "
            f"{random.choice(content_actions)} {random.choice(content_endings)}"
            for _ in range(random.randint(4, 6))
        ]
        return " ".join(sentences)[:500]

    def random_exam_image() -> str:
        return random.choice(generated_image_filenames)

    user_token = get_dummy_user_token()
    root_user = upsert_user_by_user_token(user_token)
    created_users.append(root_user)
    update_dynamodb_item((f"USER#{root_user.id}", "META"), {"permissions": [Permission.ROOT]})
    root_user.permissions = [Permission.ROOT]
    for slug, name, description in [
        ("architecture", "Architecture", "System architecture and design fundamentals."),
        ("data", "Data", "Data storage, processing, and consistency patterns."),
        ("operations", "Operations", "Reliability, observability, and platform operations."),
        ("other", "Other", "Other useful system design topics."),
    ]:
        create_category(slug, name, description, root_user)
    def ensure_certification(dto):
        certification = find_certification(to_kebab_case(dto.name))
        if certification is None:
            return create_certification(dto, root_user)
        if dto.image_filename and certification.image_filename != dto.image_filename:
            update_dynamodb_item(("CERTIFICATION", certification.slug), {"image_filename": dto.image_filename})
            certification.image_filename = dto.image_filename
        return certification

    certifications = [
        ensure_certification(CertificationDTO(
            name="AWS Certified Solutions Architect - Professional",
            provider="AWS",
            description="Design and evaluate complex cloud architecture solutions on AWS.",
            category="architecture",
            level="professional",
            official_url="https://aws.amazon.com/certification/certified-solutions-architect-professional/",
            image_filename="3d7af01f-819e-4c2f-bc69-eb7245b76a74_1809x1247.png",
        )),
        ensure_certification(CertificationDTO(
            name="AWS Certified Developer - Associate",
            provider="AWS",
            description="Build, deploy, and maintain applications on AWS.",
            category="architecture",
            level="associate",
            official_url="https://aws.amazon.com/certification/certified-developer-associate/",
            image_filename="45e97e68-a321-4657-9956-e942d9d757a7_1279x518.png",
        )),
        ensure_certification(CertificationDTO(
            name="Google Professional Cloud Architect",
            provider="Google Cloud",
            description="Design secure, scalable, and highly available cloud architectures.",
            category="architecture",
            level="professional",
            official_url="https://cloud.google.com/learn/certification/cloud-architect",
            image_filename="5b027ec7-c018-4744-9eda-00abf75cf685_1111x712.png",
        )),
    ]

    def link_certification(exam, index):
        exam.certification_id = certifications[index % len(certifications)].id
        exam.category = certifications[index % len(certifications)].category
        return exam
    update_user_dto = UpdateUserDTO(
        name="John Doe",
        avatar_action="replace",
        avatar_filename="5b027ec7-c018-4744-9eda-00abf75cf685_1111x712.png",
        username="j-doe",
        headline="Software Engineer",
        website="https://example.com",
        about=("Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the "
               "industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type "
               "and scrambled it to make a type specimen book. It has survived not only five centuries, but also the "
               "leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s "
               "with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop "
               "publishing software like Aldus PageMaker including versions of Lorem Ipsum."),
        address="1600 Pennsylvania Ave NW, Washington, DC 20500"
    )
    update_user(root_user, update_user_dto, root_user)
    user_token3 = get_dummy_user_token(sub="p3", email="test3@example.com")
    user3 = upsert_user_by_user_token(user_token3)
    created_users.append(user3)
    update_user(user3, UpdateUserDTO(
        name=unique_user_name(),
        avatar_action="delete",
    ), root_user)
    user_token4 = get_dummy_user_token(sub="p4", email="test4@example.com")
    user4 = upsert_user_by_user_token(user_token4)
    created_users.append(user4)
    update_user(user4, UpdateUserDTO(
        name=unique_user_name(),
        avatar_action="replace",
        avatar_filename="5b027ec7-c018-4744-9eda-00abf75cf685_1111x712.png",
    ), root_user)
    user4.avatar_filename = "5b027ec7-c018-4744-9eda-00abf75cf685_1111x712.png"

    def ensure_tag_subscription(user, tags):
        if get_user_tag_subscription_for_tags(user, tags) is None:
            create_tag_subscription(TagSubscriptionDTO(tags=tags), user)

    ensure_tag_subscription(root_user, ["observability"])
    ensure_tag_subscription(user3, ["event-driven"])
    ensure_tag_subscription(user4, ["databases", "reliability"])

    exams = [
        ExamDTO(
            title=unique_exam_title(),
            description=random_exam_description(),
            image_filename=random_exam_image(),
            tags=random_exam_tags()
        ),
        ExamDTO(
            title=unique_exam_title(),
            description=random_exam_description(),
            image_filename=random_exam_image(),
            tags=random_exam_tags()
        ),
        ExamDTO(
            title=unique_exam_title(),
            description=random_exam_description(),
            image_filename=random_exam_image(),
            tags=random_exam_tags()
        ),
    ]
    for index, exam in enumerate(exams):
        link_certification(exam, index)
        created_exam = create_exam(exam, root_user)
        add_default_question(created_exam, root_user)
        update_exam_status(created_exam, UpdateExamStatusDTO(status=ExamStatus.PUBLISHED), root_user)
        created_exams.append(created_exam)
    user_token2 = get_dummy_user_token(sub="p2", email="test2@example.com", name=unique_user_name())
    user2 = upsert_user_by_user_token(user_token2)
    created_users.append(user2)
    update_user(user2, UpdateUserDTO(
        name=user2.name,
        avatar_action="delete",
    ), root_user)
    exams = [
        ExamDTO(
            title=unique_exam_title(),
            description=random_exam_description(),
            image_filename=random_exam_image(),
            tags=random_exam_tags()
        ),
        ExamDTO(
            title=unique_exam_title(),
            description=random_exam_description(),
            image_filename=random_exam_image(),
            tags=random_exam_tags()
        ),
        ExamDTO(
            title=unique_exam_title(),
            description=random_exam_description(),
            image_filename=random_exam_image(),
            tags=random_exam_tags()
        ),
    ]
    for index, exam in enumerate(exams, start=3):
        link_certification(exam, index)
        created_exam = create_exam(exam, user2)
        add_default_question(created_exam, user2)
        update_exam_status(created_exam, UpdateExamStatusDTO(status=ExamStatus.PUBLISHED), root_user)
        created_exams.append(created_exam)

    # Add enough published exams to exercise sitemap generation with a larger dataset.
    for exam_index in range(len(created_exams), 75):
        generated_exam_dto = link_certification(ExamDTO(
            title=unique_exam_title(),
            description=random_exam_description(),
            image_filename=random_exam_image(),
            tags=random_exam_tags(),
        ), exam_index)
        generated_exam = create_exam(generated_exam_dto, root_user)
        add_default_question(generated_exam, root_user)
        update_exam_status(
            generated_exam,
            UpdateExamStatusDTO(status=ExamStatus.PUBLISHED),
            root_user,
        )
        created_exams.append(generated_exam)

    for tag_name, image_filename in [("distributed-systems", "45e97e68-a321-4657-9956-e942d9d757a7_1279x518.png"),
                                     ("event-driven", "a167891d-7e91-40d6-a5c4-1a3ddb27dcc2_1575x842.png") ]:
        tag = find_tag(tag_name)
        update_tag(tag, UpdateTagDTO(
            name=tag_name,
            image_action="replace",
            image_filename=image_filename,
        ), root_user)
        tag.image_filename = image_filename

    comment_texts = [
        "This helped clarify the trade-offs. Thanks for writing it.",
        "Good walkthrough. I would like to see more examples around scaling this design.",
        "The section about operational limits is especially useful.",
        "Nice exam. The diagrams and constraints make the approach easier to follow.",
    ]
    for exam_index, exam in enumerate(created_exams):
        commenters = [user for user in created_users if user.id != exam.owner_id]
        for comment_index, user in enumerate(commenters[:2]):
            text = comment_texts[(exam_index + comment_index) % len(comment_texts)]
            create_exam_comment(exam, ExamCommentDTO(text=text), user)

    # Seed exam feedback through the same impression flow used by the API.
    # Each exam gets a random, unique subset of the available users as voters.
    for exam in created_exams:
        voters = random.sample(created_users, k=random.randint(0, len(created_users)))
        for user in voters:
            update_exam_impression(exam, UpdateExamImpressionDTO(
                action=random.choice([
                    ExamImpressionAction.LIKE,
                    ExamImpressionAction.DISLIKE,
                ])), user)

    for user in created_users:
        for user2 in created_users:
            if user.id != user2.id:
                update_user_impression(user, UpdateUserImpressionDTO(
                    action=UserImpressionAction.FOLLOW if random.random() < .5 else UserImpressionAction.BLOCK), user2)
    unpublished_exams = [
        ExamDTO(
            title=unique_exam_title(),
            description=random_exam_description(),
            image_filename=random_exam_image(),
            tags=random_exam_tags()
        ),
        ExamDTO(
            title=unique_exam_title(),
            description=random_exam_description(),
            image_filename=random_exam_image(),
            tags=random_exam_tags()
        ),
        ExamDTO(
            title=unique_exam_title(),
            description=random_exam_description(),
            image_filename=random_exam_image(),
            tags=random_exam_tags()
        ),
    ]
    for index, exam in enumerate(unpublished_exams, start=75):
        link_certification(exam, index)
        created_exam = create_exam(exam, user2)
        add_default_question(created_exam, user2)
    rejected_exams = [
        ExamDTO(
            title=unique_exam_title(),
            description=random_exam_description(),
            image_filename=random_exam_image(),
            tags=random_exam_tags()
        ),
        ExamDTO(
            title=unique_exam_title(),
            description=random_exam_description(),
            image_filename=random_exam_image(),
            tags=random_exam_tags()
        ),
        ExamDTO(
            title=unique_exam_title(),
            description=random_exam_description(),
            image_filename=random_exam_image(),
            tags=random_exam_tags()
        ),
    ]
    for index, exam in enumerate(rejected_exams, start=78):
        link_certification(exam, index)
        created_exam = create_exam(exam, user3)
        add_default_question(created_exam, user3)
        update_exam_status(created_exam,
                              UpdateExamStatusDTO(status=ExamStatus.REJECTED, comment="Some rejection reason"),
                              root_user)


if __name__ == "__main__":
    create_dummy_fixtures()
