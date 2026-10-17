"""Run certification, exam, and question ID migrations in order; defaults to dry run."""

import argparse

from content_id_migration import run as migrate_content
from migrate_certification_ids import run as migrate_certifications


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--user-id", required=True)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--checkpoint-dir", help="Override the host-mounted checkpoint directory")
    args = parser.parse_args()
    migrate_certifications(args.user_id, args.apply)
    migrate_content("EXAM", args.user_id, args.apply, checkpoint_root=args.checkpoint_dir)
    migrate_content("QUESTION", args.user_id, args.apply, checkpoint_root=args.checkpoint_dir)
