"""Resolve production runtime settings before executing a maintenance command."""
import os
import sys

import boto3


def configure_environment(environment):
    profile = environment.get("AWS_PROFILE") or environment.get("AWS_PROJECT")
    region = environment.get("AWS_REGION")
    if not profile or not region:
        raise ValueError("Production scripts require AWS_PROJECT (or AWS_PROFILE) and AWS_REGION in .env.prod")
    environment["AWS_PROFILE"] = profile
    if environment.get("DYNAMODB_TABLE"):
        return
    stack = environment.get("AWS_STACK")
    if not stack:
        raise ValueError("Production scripts require AWS_STACK in .env.prod to resolve DYNAMODB_TABLE")
    session = boto3.Session(profile_name=profile, region_name=region)
    response = session.client("cloudformation").describe_stacks(StackName=stack)
    outputs = {item["OutputKey"]: item["OutputValue"]
               for item in response["Stacks"][0].get("Outputs", [])}
    table = outputs.get("DynamoDbTableName")
    if not table:
        raise ValueError(f"Stack {stack} has no DynamoDbTableName output")
    environment["DYNAMODB_TABLE"] = table


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Provide a production maintenance command")
    configure_environment(os.environ)
    os.execvp(sys.argv[1], sys.argv[1:])
