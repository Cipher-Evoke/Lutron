"""Bootstrap Superadmin without embedding credentials in source.

Do not store passwords or database secrets in this file.
"""
import sys

print(
    "superadmin.py no longer contains credentials.\n"
    "Create a Superadmin interactively:\n"
    "  python create_superadmin.py\n"
)
sys.exit(1)
