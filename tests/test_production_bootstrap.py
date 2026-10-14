"""Production maintenance commands resolve runtime settings from the deployment environment."""
import os
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

project_root = Path(os.environ.get("PROJECT_ROOT", Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(project_root / "scripts"))

import production_bootstrap


def test_production_bootstrap_resolves_deployed_table(monkeypatch):
    calls = []

    class CloudFormation:
        def describe_stacks(self, **kwargs):
            calls.append(kwargs)
            return {"Stacks": [{"Outputs": [{"OutputKey": "DynamoDbTableName", "OutputValue": "deployed-table"}]}]}

    def session(**kwargs):
        calls.append(kwargs)
        return SimpleNamespace(client=lambda service: CloudFormation())

    monkeypatch.setattr(production_bootstrap.boto3, "Session", session)
    environment = {"AWS_PROJECT": "project", "AWS_REGION": "us-west-2", "AWS_STACK": "production-stack"}
    production_bootstrap.configure_environment(environment)
    assert environment["AWS_PROFILE"] == "project"
    assert environment["DYNAMODB_TABLE"] == "deployed-table"
    assert calls == [{"profile_name": "project", "region_name": "us-west-2"}, {"StackName": "production-stack"}]


def test_production_bootstrap_preserves_explicit_runtime_settings(monkeypatch):
    def unexpected_session(**kwargs):
        raise AssertionError("An explicit table must not require a CloudFormation lookup")

    monkeypatch.setattr(production_bootstrap.boto3, "Session", unexpected_session)
    environment = {"AWS_PROFILE": "explicit-profile", "AWS_PROJECT": "project", "AWS_REGION": "us-west-2",
                   "DYNAMODB_TABLE": "explicit-table"}
    production_bootstrap.configure_environment(environment)
    assert environment["AWS_PROFILE"] == "explicit-profile"
    assert environment["DYNAMODB_TABLE"] == "explicit-table"


@pytest.mark.parametrize("environment", [{}, {"AWS_PROJECT": "project", "AWS_REGION": "us-west-2"}])
def test_production_bootstrap_rejects_missing_configuration(environment):
    with pytest.raises(ValueError):
        production_bootstrap.configure_environment(environment)
