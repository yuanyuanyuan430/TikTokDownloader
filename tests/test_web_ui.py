import asyncio
from inspect import signature
import unittest
from unittest.mock import AsyncMock, Mock

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.application.main_server import APIServer
from src.models import LiveTikTok
from src.tools import DownloaderError
from src.tools.dynamic_import import get_base_dir


def build_test_app() -> FastAPI:
    api = APIServer.__new__(APIServer)
    api.server = FastAPI()
    api.server.mount(
        "/static",
        StaticFiles(directory=get_base_dir().joinpath("static")),
        name="static",
    )
    api.setup_routes()
    return api.server


def find_route(app: FastAPI, path: str, method: str):
    return next(
        route
        for route in app.routes
        if getattr(route, "path", None) == path
        and method in getattr(route, "methods", set())
    )


class WebUITest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = build_test_app()

    def test_root_serves_web_ui(self):
        response = asyncio.run(find_route(self.app, "/", "GET").endpoint())
        content = response.path.read_text(encoding="utf-8")

        self.assertIsInstance(response, FileResponse)
        self.assertIn("DouK 工作台", content)
        self.assertIn('id="request-form"', content)
        self.assertIn('location.protocol === "file:"', content)
        self.assertIn('class="direct-open-help"', content)

    def test_static_assets_are_available(self):
        web_root = get_base_dir().joinpath("static", "web")
        for path in (web_root / "app.css", web_root / "app.js"):
            with self.subTest(path=path):
                self.assertTrue(path.is_file())
                self.assertTrue(path.read_text(encoding="utf-8"))

    def test_tiktok_live_uses_room_id_schema(self):
        endpoint = find_route(self.app, "/tiktok/live", "POST").endpoint
        annotation = signature(endpoint).parameters["extract"].annotation

        self.assertIs(annotation, LiveTikTok)

    def test_account_api_keeps_coauthor_when_owner_item_is_missing(self):
        api = APIServer.__new__(APIServer)
        api.logger = Mock()
        api.console = Mock()
        api.parameter = Mock()
        api.extractor = Mock()
        api.extractor.preprocessing_data.side_effect = DownloaderError()
        api.extractor.run = AsyncMock(return_value=[{"nickname": "coauthor"}])
        api.cache = Mock()
        api.cache.has_cache = AsyncMock(return_value=None)
        context = AsyncMock()
        context.__aenter__.return_value = Mock()
        context.__aexit__.return_value = None
        logger = Mock(return_value=context)
        api.record = Mock()
        api.record.run.return_value = (None, {}, logger)

        result = asyncio.run(
            api._batch_process_detail(
                [{"author": {"sec_uid": "coauthor"}}],
                api=True,
                mode="post",
                user_id="target",
            )
        )

        self.assertEqual(result, [{"nickname": "coauthor"}])
        self.assertFalse(api.extractor.run.await_args.kwargs["same"])


if __name__ == "__main__":
    unittest.main()
