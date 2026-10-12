"""Curated choices shared by validation and page forms."""

CERTIFICATION_LEVELS = (
    ("business", "Business"),
    ("foundational", "Foundational"),
    ("associate", "Associate"),
    ("professional", "Professional"),
    ("expert", "Expert"),
    ("specialty", "Specialty"),
    ("other", "Other"),
)

CERTIFICATION_PROVIDERS = (
    ("AWS", "Amazon Web Services (AWS)"),
    ("Microsoft", "Microsoft"),
    ("Google Cloud", "Google Cloud"),
    ("Cisco", "Cisco"),
    ("CompTIA", "CompTIA"),
    ("Oracle", "Oracle"),
    ("Red Hat", "Red Hat"),
    ("Broadcom VMware", "Broadcom / VMware"),
    ("Salesforce", "Salesforce"),
    ("ISC2", "ISC2"),
    ("ISACA", "ISACA"),
    ("PMI", "Project Management Institute (PMI)"),
    ("Linux Foundation", "Linux Foundation"),
    ("HashiCorp", "HashiCorp"),
    ("Other", "Other"),
)

EXAM_DIFFICULTIES = (
    ("beginner", "Introductory"),
    ("intermediate", "Standard"),
    ("advanced", "Challenging"),
    ("other", "Other"),
)

EXAM_LANGUAGES = (
    ("en", "English"),
    ("de", "German"),
    ("es", "Spanish"),
    ("fr", "French"),
    ("pl", "Polish"),
    ("uk", "Ukrainian"),
    ("other", "Other"),
)

CERTIFICATION_LEVEL_DIFFICULTIES = {
    "business": "intermediate",
    "foundational": "beginner",
    "associate": "intermediate",
    "professional": "advanced",
    "expert": "advanced",
    "specialty": "advanced",
    "other": "other",
}
