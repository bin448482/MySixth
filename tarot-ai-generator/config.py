from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, Optional

import yaml
from dotenv import load_dotenv


class Config:
    """Configuration loader for tarot-ai-generator with YAML + .env support."""

    def __init__(
        self,
        settings_path: Optional[Path] = None,
        multilingual_path: Optional[Path] = None,
    ) -> None:
        load_dotenv()

        self.PROJECT_ROOT = Path(__file__).resolve().parent
        self._config_dir = self.PROJECT_ROOT / "config"

        self._settings_path = Path(settings_path or self._config_dir / "settings.yaml")
        self._multilingual_path = Path(multilingual_path or self._config_dir / "multilingual_dimension.yaml")

        self._settings = self._load_yaml(self._settings_path)
        self.MULTILINGUAL_CONFIG = self._load_yaml(self._multilingual_path)

        self._hydrate_general_settings()
        self._hydrate_llm_settings()
        self._hydrate_paths()

    # --------------------------------------------------------------------- #
    # YAML loading helpers
    # --------------------------------------------------------------------- #
    def _load_yaml(self, path: Path) -> Dict[str, Any]:
        if not path.exists():
            raise FileNotFoundError(f"配置文件不存在: {path}")
        with path.open("r", encoding="utf-8") as handle:
            data = yaml.safe_load(handle) or {}
        if not isinstance(data, dict):
            raise ValueError(f"配置文件必须是字典结构: {path}")
        return data

    def resolve_path(self, value: Optional[str]) -> str:
        """Resolve project-relative paths to absolute strings."""
        if value is None:
            raise ValueError("配置中的路径不能为空")
        candidate = Path(value)
        if not candidate.is_absolute():
            candidate = self.PROJECT_ROOT / candidate
        return str(candidate)

    # --------------------------------------------------------------------- #
    # Hydration helpers
    # --------------------------------------------------------------------- #
    def _hydrate_general_settings(self) -> None:
        general = self._settings.get("general", {})
        self.OUTPUT_PATH = self.resolve_path(general.get("output_path", "./output/card_interpretation_dimensions.json"))
        self.MULTILINGUAL_OUTPUT_PATH = self.resolve_path(
            general.get("multilingual_output_path", "./output/multilingual_dimensions.json")
        )

    def _hydrate_llm_settings(self) -> None:
        llm = self._settings.get("llm", {})

        self.API_PROVIDER = (llm.get("default_provider") or os.getenv("API_PROVIDER", "zhipu")).lower()
        self.MODEL_NAME = llm.get("default_model") or os.getenv("MODEL_NAME", "glm-4")
        self.TEMPERATURE = float(llm.get("temperature", 0.1))
        self.MAX_TOKENS = int(llm.get("max_tokens", 1000))
        self.RATE_LIMIT_PER_MINUTE = int(llm.get("rate_limit_per_minute", 60))
        self.BATCH_SIZE = int(llm.get("batch_size", 10))

        zhipu_cfg = llm.get("zhipu", {})
        openai_cfg = llm.get("openai", {})
        ollama_cfg = llm.get("ollama", {})

        self.ZHIPUAI_API_KEY = zhipu_cfg.get("api_key") or os.getenv("ZHIPUAI_API_KEY")
        self.OPENAI_API_KEY = openai_cfg.get("api_key") or os.getenv("OPENAI_API_KEY")

        self.OPENAI_BASE_URL = openai_cfg.get("base_url") or os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.OLLAMA_BASE_URL = ollama_cfg.get("base_url") or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.OLLAMA_MODEL = ollama_cfg.get("model") or os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
        self.ZHIPU_MODEL_NAME = zhipu_cfg.get("model") or os.getenv("ZHIPU_MODEL_NAME")
        self.OPENAI_MODEL_NAME = openai_cfg.get("model") or os.getenv("OPENAI_MODEL_NAME")

        # Provider-specific defaults
        if self.API_PROVIDER == "zhipu" and "model" in zhipu_cfg:
            self.MODEL_NAME = zhipu_cfg.get("model", self.MODEL_NAME)
        elif self.API_PROVIDER == "openai" and "model" in openai_cfg:
            self.MODEL_NAME = openai_cfg.get("model", self.MODEL_NAME)
        elif self.API_PROVIDER == "ollama":
            self.MODEL_NAME = self.OLLAMA_MODEL

    def _hydrate_paths(self) -> None:
        paths = self._settings.get("paths", {})
        self.CARD_INTERPRETATIONS_PATH = self.resolve_path(
            paths.get("card_interpretations", "data/config_jsons/card_interpretations.json")
        )
        self.DIMENSIONS_PATH = self.resolve_path(
            paths.get("dimensions", "data/config_jsons/dimensions.json")
        )
        self.PROMPT_TEMPLATE_PATH = self.resolve_path(
            paths.get("prompt_template", "prompt_template.txt")
        )

    # --------------------------------------------------------------------- #
    # Validation helpers
    # --------------------------------------------------------------------- #
    def validate(self) -> bool:
        provider = self.API_PROVIDER
        if provider == "zhipu":
            if not self.ZHIPUAI_API_KEY:
                raise ValueError("请在 config/settings.yaml 的 llm.zhipu.api_key 中设置密钥，或通过环境变量 ZHIPUAI_API_KEY 提供。")
        elif provider == "openai":
            if not self.OPENAI_API_KEY:
                raise ValueError("请在 config/settings.yaml 的 llm.openai.api_key 中设置密钥，或通过环境变量 OPENAI_API_KEY 提供。")
        elif provider == "ollama":
            if not self.OLLAMA_BASE_URL:
                raise ValueError("请在 .env 文件中设置 OLLAMA_BASE_URL")
            if not self.OLLAMA_MODEL:
                raise ValueError("请在 .env 文件中设置 OLLAMA_MODEL")
        else:
            raise ValueError(f"不支持的API提供商: {provider}，请设置为 'zhipu'、'openai' 或 'ollama'")

        for path_attr in ("CARD_INTERPRETATIONS_PATH", "DIMENSIONS_PATH", "PROMPT_TEMPLATE_PATH"):
            path = getattr(self, path_attr, None)
            if not path or not Path(path).exists():
                raise ValueError(f"必需的文件不存在: {path_attr} -> {path}")

        # 输出目录
        Path(self.OUTPUT_PATH).parent.mkdir(parents=True, exist_ok=True)
        Path(self.MULTILINGUAL_OUTPUT_PATH).parent.mkdir(parents=True, exist_ok=True)

        return True

    # --------------------------------------------------------------------- #
    # Access helpers for multilingual configuration
    # --------------------------------------------------------------------- #
    def get_multilingual_config(self) -> Dict[str, Any]:
        """Return a shallow copy of multilingual configuration."""
        return dict(self.MULTILINGUAL_CONFIG)
