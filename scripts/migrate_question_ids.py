"""Migrate legacy question UUIDs to readable IDs; run after the exam migration."""

import argparse

from content_id_migration import run


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--user-id", required=True)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--id", action="append", dest="content_ids", help="Limit migration to this legacy ID; repeatable")
    parser.add_argument("--checkpoint-dir", help="Override the host-mounted checkpoint directory")
    args = parser.parse_args()
    run("QUESTION", args.user_id, args.apply, args.content_ids, args.checkpoint_dir)
