#!/usr/bin/env python3
"""Sanitize a SARIF file so GitHub Code Scanning will accept it.

OWASP Dependency-Check produces rule identifiers and artifact URIs that embed
full transitive dependency paths (e.g. ``package-lock.json?foo:1.0/bar:^2.0``).
GitHub rejects rule identifiers longer than 255 characters and warns on URIs
that contain characters that are not valid in a URI.

This script rewrites the SARIF in place:

* Rule identifiers longer than the SARIF limit are truncated and suffixed with
  a short hash so they remain unique. ``results[].ruleId`` references are
  updated to match.
* ``artifactLocation.uri`` values are percent-encoded so the path component is
  a valid URI.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any
from urllib.parse import quote

MAX_ID_LENGTH = 255
HASH_LENGTH = 16
URI_SAFE = "/?&=#:"


def shorten_id(rule_id: str) -> str:
    digest = hashlib.sha256(rule_id.encode("utf-8")).hexdigest()[:HASH_LENGTH]
    prefix_len = MAX_ID_LENGTH - HASH_LENGTH - 1
    return f"{rule_id[:prefix_len]}-{digest}"


def fix_uri(uri: str) -> str:
    if not uri.startswith("file:///"):
        return uri
    rest = uri[len("file:///") :]
    return "file:///" + quote(rest, safe=URI_SAFE)


def sanitize_artifact_locations(node: Any) -> int:
    fixed = 0
    if isinstance(node, dict):
        if "uri" in node and isinstance(node["uri"], str):
            new_uri = fix_uri(node["uri"])
            if new_uri != node["uri"]:
                node["uri"] = new_uri
                fixed += 1
        for value in node.values():
            fixed += sanitize_artifact_locations(value)
    elif isinstance(node, list):
        for item in node:
            fixed += sanitize_artifact_locations(item)
    return fixed


def sanitize_rule_ids(run: dict[str, Any]) -> dict[str, str]:
    id_map: dict[str, str] = {}
    rules = run.get("tool", {}).get("driver", {}).get("rules", []) or []
    for rule in rules:
        old_id = rule.get("id")
        if isinstance(old_id, str) and len(old_id) > MAX_ID_LENGTH:
            new_id = shorten_id(old_id)
            id_map[old_id] = new_id
            rule["id"] = new_id

    for result in run.get("results", []) or []:
        rid = result.get("ruleId")
        if isinstance(rid, str) and rid in id_map:
            result["ruleId"] = id_map[rid]

    return id_map


def sanitize(path: Path) -> tuple[int, int]:
    data = json.loads(path.read_text(encoding="utf-8"))
    renamed = 0
    for run in data.get("runs", []) or []:
        renamed += len(sanitize_rule_ids(run))
    fixed_uris = sanitize_artifact_locations(data)

    # Atomic write so a partially written file can never replace the original.
    fd, tmp_name = tempfile.mkstemp(prefix=path.name + ".", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(data, fh)
        os.replace(tmp_name, path)
    except Exception:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)
        raise

    return renamed, fixed_uris


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sarif", type=Path, help="Path to the SARIF file to sanitize")
    args = parser.parse_args()

    if not args.sarif.is_file():
        print(f"SARIF file not found: {args.sarif}", file=sys.stderr)
        return 1

    renamed, fixed_uris = sanitize(args.sarif)
    print(f"Sanitized {args.sarif}: renamed {renamed} rule IDs, fixed {fixed_uris} URIs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
