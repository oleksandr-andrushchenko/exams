"""Failures without a complete ASGI response must still fail the Lambda invocation."""
import asyncio
import os
from pathlib import Path
import sys

import pytest

project_root = Path(os.environ.get("PROJECT_ROOT", Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(project_root / "shared"))
from lambda_adapter import _invoke


@pytest.mark.parametrize("started", [False, True])
def test_incomplete_response_does_not_suppress_application_error(started):
    async def app(scope, receive, send):
        if started:
            await send({"type": "http.response.start", "status": 200, "headers": []})
            await send({"type": "http.response.body", "body": b"partial", "more_body": True})
        raise RuntimeError("application failure")

    with pytest.raises(RuntimeError, match="application failure"):
        asyncio.run(_invoke(app, {"rawPath": "/"}))


def test_complete_error_response_preserves_status_body_and_cookies():
    async def app(scope, receive, send):
        await send({"type": "http.response.start", "status": 500, "headers": [
            (b"content-type", b"application/json"), (b"set-cookie", b"session=; Max-Age=0"),
        ]})
        await send({"type": "http.response.body", "body": b'{"code":500}'})
        raise RuntimeError("already handled")

    response = asyncio.run(_invoke(app, {"rawPath": "/"}))
    assert response["statusCode"] == 500
    assert response["body"] == '{"code":500}'
    assert response["cookies"] == ["session=; Max-Age=0"]
