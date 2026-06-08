import json
import logging
import os
from typing import Any

log = logging.getLogger("aipm/text-data-worker.context")


class ChatContext:
    def __init__(self, file_path: str, max_messages: int):
        self._file_path = file_path
        self._max_messages = max_messages
        self._store: dict[str, list[dict[str, Any]]] = {}
        self._load()

    def add_message(self, chat_id: str, role: str, content: str) -> None:
        if chat_id not in self._store:
            self._store[chat_id] = []

        self._store[chat_id].append({"role": role, "content": content})

        if len(self._store[chat_id]) > self._max_messages:
            self._store[chat_id] = self._store[chat_id][-self._max_messages:]

        self._persist()

    def get_messages(self, chat_id: str) -> list[dict[str, Any]]:
        return list(self._store.get(chat_id, []))

    def _load(self) -> None:
        if not os.path.exists(self._file_path):
            return
        try:
            with open(self._file_path, "r", encoding="utf-8") as f:
                self._store = json.load(f)
            log.info("context loaded from %s", self._file_path)
        except Exception as e:
            log.error("failed to load context: %s", e)

    def _persist(self) -> None:
        try:
            os.makedirs(os.path.dirname(self._file_path), exist_ok=True)
            with open(self._file_path, "w", encoding="utf-8") as f:
                json.dump(self._store, f, ensure_ascii=False)
        except Exception as e:
            log.error("failed to persist context: %s", e)
