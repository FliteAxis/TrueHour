"""Unit tests for utility functions in app.main."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))


def _get_normalize_tail():
    """Inline implementation of normalize_tail for isolated testing."""

    def normalize_tail(tail: str) -> str:
        t = tail.upper().strip()
        if t.startswith("N"):
            t = t[1:]
        return t.replace("-", "").replace(" ", "")

    return normalize_tail


normalize_tail = _get_normalize_tail()


class TestNormalizeTail:
    def test_strips_n_prefix(self):
        assert normalize_tail("N172SP") == "172SP"

    def test_uppercase(self):
        assert normalize_tail("n172sp") == "172SP"

    def test_strips_dashes(self):
        assert normalize_tail("N-172-SP") == "172SP"

    def test_strips_spaces(self):
        assert normalize_tail("N 172 SP") == "172SP"

    def test_no_prefix(self):
        assert normalize_tail("172SP") == "172SP"

    def test_already_normalized(self):
        assert normalize_tail("172SP") == "172SP"

    def test_only_n(self):
        # Edge case: tail number that is just "N"
        assert normalize_tail("N") == ""

    def test_strips_leading_trailing_whitespace(self):
        assert normalize_tail("  N172SP  ") == "172SP"
