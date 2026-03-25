import pytest
from guitar_teacher.api.auth import create_token, verify_token, check_pin


def test_check_pin_correct():
    assert check_pin("1234") is True


def test_check_pin_wrong():
    assert check_pin("0000") is False


def test_create_and_verify_token():
    token = create_token()
    payload = verify_token(token)
    assert payload is not None
    assert "exp" in payload


def test_verify_token_invalid():
    payload = verify_token("garbage.token.here")
    assert payload is None


def test_verify_token_expired():
    from guitar_teacher.api.auth import _create_token_with_expiry
    import time
    token = _create_token_with_expiry(seconds=-1)
    payload = verify_token(token)
    assert payload is None
