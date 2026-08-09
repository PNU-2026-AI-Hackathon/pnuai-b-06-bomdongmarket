#!/usr/bin/env python3
"""Perform basic structural validation for a Codex skill."""

import re
import sys
from pathlib import Path

import yaml

MAX_SKILL_NAME_LENGTH = 64


def validate_skill(skill_path: str) -> tuple[bool, str]:
    """Validate the required SKILL.md frontmatter fields and naming rules."""
    skill_md = Path(skill_path) / "SKILL.md"
    if not skill_md.exists():
        return False, "SKILL.md not found"

    content = skill_md.read_text(encoding="utf-8")
    if not content.startswith("---"):
        return False, "No YAML frontmatter found"

    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return False, "Invalid frontmatter format"

    try:
        frontmatter = yaml.safe_load(match.group(1))
        if not isinstance(frontmatter, dict):
            return False, "Frontmatter must be a YAML dictionary"
    except yaml.YAMLError as error:
        return False, f"Invalid YAML in frontmatter: {error}"

    allowed_properties = {
        "name",
        "description",
        "license",
        "allowed-tools",
        "metadata",
    }
    unexpected_keys = set(frontmatter) - allowed_properties
    if unexpected_keys:
        unexpected = ", ".join(sorted(unexpected_keys))
        allowed = ", ".join(sorted(allowed_properties))
        return False, (
            f"Unexpected key(s) in SKILL.md frontmatter: {unexpected}. "
            f"Allowed properties are: {allowed}"
        )

    if "name" not in frontmatter:
        return False, "Missing 'name' in frontmatter"
    if "description" not in frontmatter:
        return False, "Missing 'description' in frontmatter"

    name = frontmatter["name"]
    if not isinstance(name, str):
        return False, f"Name must be a string, got {type(name).__name__}"

    name = name.strip()
    if not re.fullmatch(r"[a-z0-9-]+", name):
        return False, (
            f"Name '{name}' should be hyphen-case "
            "(lowercase letters, digits, and hyphens only)"
        )
    if name.startswith("-") or name.endswith("-") or "--" in name:
        return False, (
            f"Name '{name}' cannot start/end with a hyphen "
            "or contain consecutive hyphens"
        )
    if len(name) > MAX_SKILL_NAME_LENGTH:
        return False, (
            f"Name is too long ({len(name)} characters). "
            f"Maximum is {MAX_SKILL_NAME_LENGTH} characters."
        )

    description = frontmatter["description"]
    if not isinstance(description, str):
        return False, (
            f"Description must be a string, got {type(description).__name__}"
        )

    description = description.strip()
    if "<" in description or ">" in description:
        return False, "Description cannot contain angle brackets (< or >)"
    if len(description) > 1024:
        return False, (
            f"Description is too long ({len(description)} characters). "
            "Maximum is 1024 characters."
        )

    return True, "Skill is valid!"


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python quick_validate.py <skill_directory>")
        return 1

    valid, message = validate_skill(sys.argv[1])
    print(f"{sys.argv[1]}: {message}")
    return 0 if valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
