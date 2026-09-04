#!/usr/bin/env python3
"""Inventory an OpenAPI source diff without modifying the repository."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path


BULK_SOURCE_FILE_LIMIT = 10
BULK_ROLE_LIMIT = 3
ROLE_ROOT = re.compile(r"^src/([^/]+)/openapi\.yaml$")
RISK_MARKERS = {
    "ref": re.compile(r"\$ref\s*:"),
    "required": re.compile(r"\brequired\s*:"),
    "nullable": re.compile(r"\bnullable\s*:"),
    "enum": re.compile(r"\benum\s*:"),
    "composition": re.compile(r"\b(?:allOf|anyOf|oneOf)\s*:"),
    "shape": re.compile(r"\b(?:type|properties|items|additionalProperties)\s*:"),
    "operation": re.compile(r"\b(?:requestBody|responses|schema)\s*:"),
    "list_item": re.compile(r"^\s*-\s+\S"),
}


@dataclass(frozen=True)
class SourceChange:
    status: str
    old_path: str | None
    new_path: str | None


@dataclass(frozen=True)
class RiskLine:
    path: str
    side: str
    line: int
    markers: tuple[str, ...]
    text: str


def run_git(repo: Path, *args: str, binary: bool = False) -> str | bytes:
    result = subprocess.run(
        ["git", "-C", str(repo), *args],
        capture_output=True,
        text=not binary,
        check=False,
    )
    if result.returncode != 0:
        stderr = result.stderr.decode() if binary else result.stderr
        raise RuntimeError(stderr.strip() or f"git {' '.join(args)} failed")
    return result.stdout


def resolve_commit(repo: Path, ref: str) -> str:
    output = run_git(repo, "rev-parse", "--verify", f"{ref}^{{commit}}")
    assert isinstance(output, str)
    return output.strip()


def parse_source_changes(repo: Path, base: str, head: str) -> list[SourceChange]:
    output = run_git(
        repo,
        "diff",
        "--name-status",
        "-z",
        "--find-renames",
        base,
        head,
        "--",
        "src",
        binary=True,
    )
    assert isinstance(output, bytes)
    tokens = output.decode("utf-8", errors="surrogateescape").split("\0")
    if tokens and not tokens[-1]:
        tokens.pop()

    changes: list[SourceChange] = []
    index = 0
    while index < len(tokens):
        status = tokens[index]
        index += 1
        if status.startswith(("R", "C")):
            old_path, new_path = tokens[index : index + 2]
            index += 2
        else:
            path = tokens[index]
            index += 1
            old_path = None if status == "A" else path
            new_path = None if status == "D" else path
        changes.append(SourceChange(status, old_path, new_path))
    return changes


def role_roots(repo: Path, commit: str) -> set[str]:
    output = run_git(repo, "ls-tree", "-r", "--name-only", commit, "--", "src")
    assert isinstance(output, str)
    roles = set()
    for path in output.splitlines():
        match = ROLE_ROOT.match(path)
        if match:
            roles.add(match.group(1))
    return roles


def changed_paths(change: SourceChange) -> tuple[str, ...]:
    return tuple(path for path in (change.old_path, change.new_path) if path)


def parse_hunk_start(header: str) -> tuple[int, int]:
    match = re.match(r"@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@", header)
    if not match:
        raise RuntimeError(f"cannot parse diff hunk: {header}")
    return int(match.group(1)), int(match.group(2))


def risk_lines(repo: Path, base: str, head: str) -> list[RiskLine]:
    output = run_git(
        repo,
        "diff",
        "--unified=0",
        "--no-color",
        "--no-ext-diff",
        base,
        head,
        "--",
        "src",
    )
    assert isinstance(output, str)

    old_path: str | None = None
    new_path: str | None = None
    old_line = 0
    new_line = 0
    hits: list[RiskLine] = []
    for raw_line in output.splitlines():
        if raw_line.startswith("diff --git "):
            old_path = None
            new_path = None
            continue
        if raw_line.startswith("--- "):
            path = raw_line[4:]
            old_path = path[2:] if path.startswith("a/") else None
            continue
        if raw_line.startswith("+++ "):
            path = raw_line[4:]
            new_path = path[2:] if path.startswith("b/") else None
            continue
        if raw_line.startswith("@@ "):
            old_line, new_line = parse_hunk_start(raw_line)
            continue
        if raw_line.startswith("index "):
            continue

        side: str | None = None
        line_number = 0
        content = ""
        if raw_line.startswith("+"):
            side, line_number, content = "added", new_line, raw_line[1:]
            new_line += 1
        elif raw_line.startswith("-"):
            side, line_number, content = "removed", old_line, raw_line[1:]
            old_line += 1
        elif raw_line.startswith(" "):
            old_line += 1
            new_line += 1

        path = new_path if side == "added" else old_path
        if side and path:
            markers = tuple(
                name for name, pattern in RISK_MARKERS.items() if pattern.search(content)
            )
            if markers:
                hits.append(RiskLine(path, side, line_number, markers, content.strip()))
    return hits


def build_inventory(repo: Path, base_ref: str, head_ref: str) -> dict[str, object]:
    base_commit = resolve_commit(repo, base_ref)
    head_commit = resolve_commit(repo, head_ref)
    merge_base = run_git(repo, "merge-base", base_commit, head_commit)
    assert isinstance(merge_base, str)
    merge_base = merge_base.strip()

    changes = parse_source_changes(repo, merge_base, head_commit)
    roles = role_roots(repo, merge_base) | role_roots(repo, head_commit)
    shared_changes = [
        change
        for change in changes
        if any(path.startswith("src/components/") for path in changed_paths(change))
    ]
    direct_roles = sorted(
        role
        for role in roles
        if any(
            path.startswith(f"src/{role}/")
            for change in changes
            for path in changed_paths(change)
        )
    )
    bundle_roles = sorted(roles if shared_changes else direct_roles)
    hits = risk_lines(repo, merge_base, head_commit)
    marker_counts = {
        marker: sum(marker in hit.markers for hit in hits) for marker in RISK_MARKERS
    }
    marker_counts = {name: count for name, count in marker_counts.items() if count}
    bulk_mode = len(changes) > BULK_SOURCE_FILE_LIMIT or len(direct_roles) > BULK_ROLE_LIMIT

    return {
        "repository": str(repo),
        "base_ref": base_ref,
        "base_commit": base_commit,
        "head_ref": head_ref,
        "head_commit": head_commit,
        "merge_base": merge_base,
        "source_file_count": len(changes),
        "shared_component_file_count": len(shared_changes),
        "direct_roles": direct_roles,
        "bundle_roles": bundle_roles,
        "risk_marker_line_count": len(hits),
        "risk_marker_counts": marker_counts,
        "bulk_mode": bulk_mode,
        "bulk_thresholds": {
            "source_files_greater_than": BULK_SOURCE_FILE_LIMIT,
            "direct_roles_greater_than": BULK_ROLE_LIMIT,
        },
        "source_changes": [asdict(change) for change in changes],
        "risk_lines": [asdict(hit) for hit in hits],
    }


def print_summary(inventory: dict[str, object]) -> None:
    print(f"base_commit: {inventory['base_commit']}")
    print(f"head_commit: {inventory['head_commit']}")
    print(f"merge_base: {inventory['merge_base']}")
    print(f"source_files: {inventory['source_file_count']}")
    print(f"shared_component_files: {inventory['shared_component_file_count']}")
    print(f"direct_roles: {', '.join(inventory['direct_roles']) or '-'}")
    print(f"bundle_roles: {', '.join(inventory['bundle_roles']) or '-'}")
    print(f"risk_marker_lines: {inventory['risk_marker_line_count']}")
    counts = inventory["risk_marker_counts"]
    assert isinstance(counts, dict)
    formatted_counts = ", ".join(f"{name}={count}" for name, count in counts.items())
    print(f"risk_markers: {formatted_counts or '-'}")
    print(f"bulk_mode: {'yes' if inventory['bulk_mode'] else 'no'}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default=".", help="fyle-platform-docs checkout")
    parser.add_argument("--base", required=True, help="PR base ref or commit")
    parser.add_argument("--head", required=True, help="PR head ref or commit")
    parser.add_argument("--format", choices=("summary", "json"), default="summary")
    args = parser.parse_args()

    try:
        repo_output = run_git(Path(args.repo).resolve(), "rev-parse", "--show-toplevel")
        assert isinstance(repo_output, str)
        repo = Path(repo_output.strip())
        inventory = build_inventory(repo, args.base, args.head)
    except RuntimeError as error:
        print(f"error: {error}", file=sys.stderr)
        return 2

    if args.format == "json":
        print(json.dumps(inventory, indent=2))
    else:
        print_summary(inventory)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
