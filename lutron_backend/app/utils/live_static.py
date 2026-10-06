"""Static files whose directory is resolved on each request.

Nuitka onefile must not freeze the upload folder to a temp path captured at import.
"""

from __future__ import annotations

import os
from typing import Callable

from starlette.staticfiles import StaticFiles


class LiveDirStaticFiles(StaticFiles):
    def __init__(self, directory_getter: Callable[[], str]) -> None:
        self._directory_getter = directory_getter
        initial = directory_getter()
        os.makedirs(initial, exist_ok=True)
        super().__init__(directory=initial, check_dir=False)

    async def __call__(self, scope, receive, send):
        directory = self._directory_getter()
        os.makedirs(directory, exist_ok=True)
        self.directory = directory
        self.all_directories = [directory]
        await super().__call__(scope, receive, send)
