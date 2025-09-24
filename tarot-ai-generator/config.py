import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    API_PROVIDER = os.getenv('API_PROVIDER', 'zhipu').lower()

    ZHIPUAI_API_KEY = os.getenv('ZHIPUAI_API_KEY')

    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    OPENAI_BASE_URL = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')

    OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
    OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'qwen2.5:7b')

    PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
    CARD_INTERPRETATIONS_PATH = os.getenv('CARD_INTERPRETATIONS_PATH', os.path.join(PROJECT_ROOT, 'data/config_jsons/card_interpretations.json'))
    DIMENSIONS_PATH = os.getenv('DIMENSIONS_PATH', os.path.join(PROJECT_ROOT, 'data/config_jsons/dimensions.json'))

    OUTPUT_PATH = os.getenv('OUTPUT_PATH', './output/card_interpretation_dimensions.json')

    MODEL_NAME = os.getenv('MODEL_NAME', 'glm-4')
    TEMPERATURE = float(os.getenv('TEMPERATURE', '0.7'))
    MAX_TOKENS = int(os.getenv('MAX_TOKENS', '1000'))

    RATE_LIMIT_PER_MINUTE = int(os.getenv('RATE_LIMIT_PER_MINUTE', '60'))
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', '10'))

    def validate(self):
        if self.API_PROVIDER == 'zhipu':
            if not self.ZHIPUAI_API_KEY:
                raise ValueError("请在 .env 文件中设置 ZHIPUAI_API_KEY")
        elif self.API_PROVIDER == 'openai':
            if not self.OPENAI_API_KEY:
                raise ValueError("请在 .env 文件中设置 OPENAI_API_KEY")
        elif self.API_PROVIDER == 'ollama':
            if not self.OLLAMA_BASE_URL:
                raise ValueError("请在 .env 文件中设置 OLLAMA_BASE_URL")
            if not self.OLLAMA_MODEL:
                raise ValueError("请在 .env 文件中设置 OLLAMA_MODEL")
        else:
            raise ValueError(f"不支持的API提供商: {self.API_PROVIDER}，请设置为 'zhipu'、'openai' 或 'ollama'")

        if not os.path.exists(self.CARD_INTERPRETATIONS_PATH):
            raise ValueError(f"卡牌解读文件不存在: {self.CARD_INTERPRETATIONS_PATH}")

        if not os.path.exists(self.DIMENSIONS_PATH):
            raise ValueError(f"维度定义文件不存在: {self.DIMENSIONS_PATH}")

        return True