import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # 智谱AI API 配置
    ZHIPUAI_API_KEY = os.getenv('ZHIPUAI_API_KEY')
    
    # 数据文件路径
    CARD_INTERPRETATIONS_PATH = os.getenv('CARD_INTERPRETATIONS_PATH', '../my-tarot-app/assets/data/card_interpretations.json')
    DIMENSIONS_PATH = os.getenv('DIMENSIONS_PATH', '../my-tarot-app/assets/data/dimensions.json')
    
    # 输出配置
    OUTPUT_PATH = os.getenv('OUTPUT_PATH', './output/card_interpretation_dimensions.json')
    
    # LLM 配置
    MODEL_NAME = os.getenv('MODEL_NAME', 'glm-4')
    TEMPERATURE = float(os.getenv('TEMPERATURE', '0.7'))
    MAX_TOKENS = int(os.getenv('MAX_TOKENS', '1000'))
    
    # API 调用限制
    RATE_LIMIT_PER_MINUTE = int(os.getenv('RATE_LIMIT_PER_MINUTE', '60'))
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', '10'))
    
    def validate(self):
        """验证配置是否完整"""
        if not self.ZHIPUAI_API_KEY:
            raise ValueError("请在 .env 文件中设置 ZHIPUAI_API_KEY")
        
        if not os.path.exists(self.CARD_INTERPRETATIONS_PATH):
            raise ValueError(f"卡牌解读文件不存在: {self.CARD_INTERPRETATIONS_PATH}")
        
        if not os.path.exists(self.DIMENSIONS_PATH):
            raise ValueError(f"维度定义文件不存在: {self.DIMENSIONS_PATH}")
        
        return True