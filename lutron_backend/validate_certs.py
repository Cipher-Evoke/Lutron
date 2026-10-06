"""Run the certificate validator from repo root: python validate_certs.py [args...]"""

import sys

from app.certificates.validate_certs import main

if __name__ == "__main__":
    sys.exit(main())
