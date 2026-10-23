#!/usr/bin/env python3
"""Run Cantrip conformance scripts against an interpreter."""

from __future__ import annotations

import argparse
import difflib
import shlex
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TESTS_DIR = REPO_ROOT / "spec" / "tests"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run spec/tests against a Cantrip interpreter.",
    )
    parser.add_argument(
        "--cmd",
        required=True,
        help='interpreter command, for example "node ts/dist/index.js"',
    )
    args = parser.parse_args()

    command = shlex.split(args.cmd)
    if not command:
        parser.error("--cmd must not be empty")

    cases = discover(TESTS_DIR)
    if not cases:
        print(f"no conformance tests found in {TESTS_DIR.relative_to(REPO_ROOT)}")
        raise SystemExit(1)

    failures = 0
    for name, script, expected in cases:
        if script is None or expected is None:
            report_missing(name, script, expected)
            failures += 1
            continue
        if not run_case(command, name, script, expected):
            failures += 1

    if failures:
        raise SystemExit(1)


def discover(tests_dir: Path) -> list[tuple[str, Path | None, Path | None]]:
    if not tests_dir.is_dir():
        return []

    cases: list[tuple[str, Path | None, Path | None]] = []
    for child in sorted(path for path in tests_dir.iterdir() if path.is_dir()):
        script = child / f"{child.name}.cantrip"
        expected = child / f"{child.name}.expected"
        cases.append(
            (
                child.name,
                script if script.is_file() else None,
                expected if expected.is_file() else None,
            )
        )
    return cases


def report_missing(name: str, script: Path | None, expected: Path | None) -> None:
    missing = []
    if script is None:
        missing.append(f"{name}.cantrip")
    if expected is None:
        missing.append(f"{name}.expected")
    print(f"{name} ... FAIL")
    print(f"missing {', '.join(missing)}")


def run_case(command: list[str], name: str, script: Path, expected_path: Path) -> bool:
    rel_script = script.relative_to(REPO_ROOT).as_posix()
    try:
        result = subprocess.run(
            [*command, rel_script],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
    except OSError as exc:
        print(f"{name} ... FAIL")
        print(f"failed to run: {exc}")
        return False

    expected = expected_path.read_text(encoding="utf-8")
    stdout_ok = result.stdout == expected
    exit_ok = result.returncode == 0
    if stdout_ok and exit_ok:
        print(f"{name} ... ok")
        return True

    print(f"{name} ... FAIL")
    if not stdout_ok:
        sys.stdout.writelines(
            difflib.unified_diff(
                expected.splitlines(keepends=True),
                result.stdout.splitlines(keepends=True),
                fromfile=f"{name}.expected",
                tofile=f"{name} stdout",
            )
        )
    if not exit_ok:
        print(f"exit code: {result.returncode}")
        if result.stderr:
            sys.stdout.write(result.stderr)
            if not result.stderr.endswith("\n"):
                print()
    return False


if __name__ == "__main__":
    main()
