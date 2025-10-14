#!/usr/bin/env python3
"""
测试langchain调用OpenAI
"""

import os
import json
from datetime import datetime
from openai import OpenAI
from rich.console import Console

console = Console()

def test_openai_direct():
    """直接测试OpenAI API调用"""
    console.print("[bold blue]🧪 测试1: 直接OpenAI API调用[/bold blue]")

    try:
        # 从.env文件读取配置
        from config import Config
        config = Config()
        config.validate()

        console.print(f"API提供商: {config.API_PROVIDER}")
        console.print(f"模型: {config.MODEL_NAME}")
        console.print(f"Base URL: {config.OPENAI_BASE_URL}")

        # 创建OpenAI客户端
        client = OpenAI(
            api_key=config.OPENAI_API_KEY,
            base_url=config.OPENAI_BASE_URL
        )

        # 测试简单的翻译请求
        response = client.chat.completions.create(
            model=config.MODEL_NAME,
            messages=[
                {"role": "system", "content": "你是一位专业的塔罗牌翻译专家。"},
                {"role": "user", "content": """请将以下塔罗牌中文信息翻译为英文JSON格式：

输入：
- 中文名称：愚者
- 牌组：大阿卡纳

输出格式：
{
  "name_en": "英文名称",
  "suit_en": "英文牌组"
}"""}
            ],
            temperature=config.TEMPERATURE,
            max_tokens=100
        )

        if response.choices:
            content = response.choices[0].message.content
            console.print(f"[green]✅ API调用成功[/green]")
            console.print(f"响应内容: {content}")
            console.print(f"响应长度: {len(content)}")

            # 尝试解析JSON
            try:
                import json
                parsed = json.loads(content)
                console.print(f"[green]✅ JSON解析成功[/green]")
                console.print(f"解析结果: {parsed}")
                return True
            except json.JSONDecodeError as e:
                console.print(f"[red]❌ JSON解析失败: {e}[/red]")
                return False
        else:
            console.print("[red]❌ API没有返回选择项[/red]")
            return False

    except Exception as e:
        console.print(f"[red]❌ API调用失败: {e}[/red]")
        return False

def test_simple_response():
    """测试简单的响应"""
    console.print("\n[bold blue]🧪 测试2: 简单响应测试[/bold blue]")

    try:
        from config import Config
        config = Config()

        client = OpenAI(
            api_key=config.OPENAI_API_KEY,
            base_url=config.OPENAI_BASE_URL
        )

        # 测试最简单的请求
        response = client.chat.completions.create(
            model=config.MODEL_NAME,
            messages=[
                {"role": "user", "content": "Hello, please respond with just the word 'OK'"}
            ],
            temperature=0.1,
            max_tokens=10
        )

        if response.choices:
            content = response.choices[0].message.content
            console.print(f"[green]✅ 简单响应成功[/green]")
            console.print(f"响应: '{content}'")
            return True
        else:
            console.print("[red]❌ 简单响应失败[/red]")
            return False

    except Exception as e:
        console.print(f"[red]❌ 简单响应测试失败: {e}[/red]")
        return False

def test_list_models():
    """测试列出可用模型"""
    console.print("\n[bold blue]🧪 测试3: 列出可用模型[/bold blue]")

    try:
        from config import Config
        config = Config()

        client = OpenAI(
            api_key=config.OPENAI_API_KEY,
            base_url=config.OPENAI_BASE_URL
        )

        # 尝试列出模型
        models = client.models.list()
        console.print(f"[green]✅ 模型列表获取成功[/green]")
        console.print(f"可用模型数量: {len(models.data)}")

        # 显示前5个模型
        for model in models.data[:5]:
            console.print(f"  - {model.id}")

        # 检查我们使用的模型是否存在
        model_exists = any(model.id == config.MODEL_NAME for model in models.data)
        if model_exists:
            console.print(f"[green]✅ 目标模型 '{config.MODEL_NAME}' 存在[/green]")
        else:
            console.print(f"[red]❌ 目标模型 '{config.MODEL_NAME}' 不存在[/red]")
            console.print("可用模型列表:")
            for model in models.data:
                console.print(f"  - {model.id}")

        return model_exists

    except Exception as e:
        console.print(f"[red]❌ 模型列表获取失败: {e}[/red]")
        return False

def test_with_different_model():
    """使用不同模型测试"""
    console.print("\n[bold blue]🧪 测试4: 使用不同模型测试[/bold blue]")

    try:
        from config import Config
        config = Config()

        client = OpenAI(
            api_key=config.OPENAI_API_KEY,
            base_url=config.OPENAI_BASE_URL
        )

        # 尝试使用gpt-3.5-turbo
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": "Translate '愚者' to English tarot name"}
            ],
            temperature=0.1,
            max_tokens=50
        )

        if response.choices:
            content = response.choices[0].message.content
            console.print(f"[green]✅ gpt-3.5-turbo 调用成功[/green]")
            console.print(f"响应: {content}")
            return True
        else:
            console.print("[red]❌ gpt-3.5-turbo 调用失败[/red]")
            return False

    except Exception as e:
        console.print(f"[red]❌ gpt-3.5-turbo 测试失败: {e}[/red]")
        return False

def main():
    """主测试函数"""
    console.print("[bold yellow]🚀 开始OpenAI API连接测试[/bold yellow]")
    console.print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    console.print("=" * 50)

    results = []

    # 运行各项测试
    results.append(("简单响应测试", test_simple_response()))
    results.append(("模型列表测试", test_list_models()))
    results.append(("不同模型测试", test_with_different_model()))
    results.append(("直接翻译测试", test_openai_direct()))

    # 汇总结果
    console.print("\n" + "=" * 50)
    console.print("[bold yellow]📊 测试结果汇总[/bold yellow]")

    success_count = 0
    for test_name, success in results:
        status = "✅ 成功" if success else "❌ 失败"
        console.print(f"{test_name:<20}: {status}")
        if success:
            success_count += 1

    console.print(f"\n总体结果: {success_count}/{len(results)} 项测试通过")

    if success_count == len(results):
        console.print("[bold green]🎉 所有测试通过！API连接正常[/bold green]")
    else:
        console.print("[bold red]⚠️ 部分测试失败，请检查配置[/bold red]")

if __name__ == "__main__":
    main()