#!/usr/bin/env python3
"""
塔罗牌维度解读生成工具
使用智谱AI生成详细的塔罗牌维度解读内容
"""

import json
import os
import time
import asyncio
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests
from rich.console import Console
from rich.progress import Progress, TaskID
from rich.table import Table
from rich.prompt import Confirm
from zhipuai import ZhipuAI
from openai import OpenAI
import ollama

from config import Config

console = Console()

class TarotAIGenerator:
    def __init__(self):
        self.config = Config()
        self.config.validate()

        if self.config.API_PROVIDER == 'zhipu':
            self.client = ZhipuAI(api_key=self.config.ZHIPUAI_API_KEY)
        elif self.config.API_PROVIDER == 'openai':
            self.client = OpenAI(
                api_key=self.config.OPENAI_API_KEY,
                base_url=self.config.OPENAI_BASE_URL
            )
        elif self.config.API_PROVIDER == 'ollama':
            self.client = ollama.Client(host=self.config.OLLAMA_BASE_URL)

        self.cards_data = self.load_cards_data()
        self.dimensions_data = self.load_dimensions_data()
        self.prompt_template = self.load_prompt_template()

        Path(self.config.OUTPUT_PATH).parent.mkdir(parents=True, exist_ok=True)
    
    def load_cards_data(self) -> List[Dict]:
        """加载塔罗牌数据"""
        with open(self.config.CARD_INTERPRETATIONS_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data['data']
    
    def load_dimensions_data(self) -> List[Dict]:
        """加载维度数据"""
        with open(self.config.DIMENSIONS_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data['data']
    
    def load_prompt_template(self) -> str:
        """加载提示词模板"""
        with open('prompt_template.txt', 'r', encoding='utf-8') as f:
            return f.read()
    
    def create_prompt(self, card: Dict, dimension: Dict) -> str:
        """创建提示词"""
        return self.prompt_template.format(
            card_name=card['card_name'],
            direction=card['direction'],
            summary=card['summary'],
            detail=card.get('detail', ''),
            dimension_name=dimension['name'],
            category=dimension['category'],
            description=dimension['description'],
            aspect=dimension.get('aspect', ''),
            aspect_type=dimension.get('aspect_type', '')
        )
    
    def call_ai_api(self, prompt: str) -> Optional[str]:
        try:
            if self.config.API_PROVIDER == 'zhipu':
                response = self.client.chat.completions.create(
                    model=self.config.MODEL_NAME,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    temperature=self.config.TEMPERATURE,
                    max_tokens=self.config.MAX_TOKENS
                )
            elif self.config.API_PROVIDER == 'openai':
                response = self.client.chat.completions.create(
                    model=self.config.MODEL_NAME,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    temperature=self.config.TEMPERATURE,
                    max_tokens=self.config.MAX_TOKENS
                )
            elif self.config.API_PROVIDER == 'ollama':
                response = self.client.chat(
                    model=self.config.OLLAMA_MODEL,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    options={
                        "temperature": self.config.TEMPERATURE,
                        "num_predict": self.config.MAX_TOKENS
                    }
                )
                if response and 'message' in response and 'content' in response['message']:
                    return response['message']['content'].strip()
                return None

            if response.choices:
                return response.choices[0].message.content.strip()
            return None

        except Exception as e:
            console.print(f"[red]API调用错误 ({self.config.API_PROVIDER}): {str(e)}[/red]")
            return None
    
    def generate_single_interpretation(self, card: Dict, dimension: Dict) -> Optional[Dict]:
        """生成单个解读"""
        prompt = self.create_prompt(card, dimension)
        content = self.call_ai_api(prompt)
        
        if content:
            return {
                "card_name": card['card_name'],
                "direction": card['direction'],
                "dimension_name": dimension['name'],
                "dimension_category": dimension['category'],
                "aspect": dimension.get('aspect', ''),
                "aspect_type": dimension.get('aspect_type', ''),
                "content": content
            }
        return None
    
    def generate_for_card(self, card_name: str, direction: str, force: bool = False) -> None:
        """为指定卡牌生成所有维度解读（使用协程并发）"""
        card = next((c for c in self.cards_data
                    if c['card_name'] == card_name and c['direction'] == direction), None)
        
        if not card:
            console.print(f"[red]未找到卡牌: {card_name} ({direction})[/red]")
            return
        
        total_dimensions = len(self.dimensions_data)
        console.print(f"[blue]为 {card_name} ({direction}) 生成 {total_dimensions} 个维度解读[/blue]")
        
        if not force and not Confirm.ask(f"预估成本: ~{total_dimensions * 500} tokens，继续？"):
            return
        
        results: List[Dict] = []
        
        with Progress() as progress:
            task = progress.add_task(f"生成解读中...", total=total_dimensions)

            async def run_all():
                # 并发上限（批大小）
                sem = asyncio.Semaphore(self.config.BATCH_SIZE)
                # 简单速率限制：控制两次调用之间的最小时间间隔
                min_interval = 60 / self.config.RATE_LIMIT_PER_MINUTE if self.config.RATE_LIMIT_PER_MINUTE > 0 else 0.0
                rate_lock = asyncio.Lock()
                next_allowed = 0.0  # event loop 时间（秒）

                async def worker(dimension: Dict) -> Optional[Dict]:
                    nonlocal next_allowed
                    async with sem:
                        # 在调用API前进行节流，避免超过每分钟限制
                        if min_interval > 0:
                            async with rate_lock:
                                now = asyncio.get_running_loop().time()
                                wait = max(0.0, next_allowed - now)
                                if wait > 0:
                                    await asyncio.sleep(wait)
                                next_allowed = asyncio.get_running_loop().time() + min_interval
                        # 将阻塞的网络调用丢到线程池中，避免阻塞事件循环
                        return await asyncio.to_thread(self.generate_single_interpretation, card, dimension)

                tasks = [asyncio.create_task(worker(dimension)) for dimension in self.dimensions_data]
                for coro in asyncio.as_completed(tasks):
                    res = await coro
                    if res:
                        results.append(res)
                    progress.advance(task)

            # 在同步方法中运行协程
            asyncio.run(run_all())
        
        self.save_results(results, f"card_{card_name}_{direction}")
        console.print(f"[green]完成！生成了 {len(results)} 条解读[/green]")
    
    def generate_for_dimension(self, dimension_name: str) -> None:
        """为指定维度生成所有卡牌解读（使用协程并发）"""
        dimension = next((d for d in self.dimensions_data
                         if d['name'] == dimension_name), None)

        if not dimension:
            console.print(f"[red]未找到维度: {dimension_name}[/red]")
            return

        total_cards = len(self.cards_data)
        console.print(f"[blue]为维度 '{dimension_name}' 生成 {total_cards} 张卡牌解读[/blue]")

        if not Confirm.ask(f"预估成本: ~{total_cards * 500} tokens，继续？"):
            return

        results: List[Dict] = []

        with Progress() as progress:
            task = progress.add_task(f"生成解读中...", total=total_cards)

            async def run_all():
                # 并发上限（批大小）
                sem = asyncio.Semaphore(self.config.BATCH_SIZE)
                # 简单的速率限制：控制两次调用之间的最小时间间隔
                min_interval = 60 / self.config.RATE_LIMIT_PER_MINUTE if self.config.RATE_LIMIT_PER_MINUTE > 0 else 0.0
                rate_lock = asyncio.Lock()
                next_allowed = 0.0  # 单位：event loop 时间（秒）

                async def worker(card: Dict) -> Optional[Dict]:
                    nonlocal next_allowed
                    async with sem:
                        # 在调用API前进行节流，避免超过每分钟限制
                        if min_interval > 0:
                            async with rate_lock:
                                now = asyncio.get_running_loop().time()
                                wait = max(0.0, next_allowed - now)
                                if wait > 0:
                                    await asyncio.sleep(wait)
                                next_allowed = asyncio.get_running_loop().time() + min_interval
                        # 重试机制
                        for attempt in range(3):
                            try:
                                res = await asyncio.to_thread(self.generate_single_interpretation, card, dimension)
                                if res:
                                    return res
                            except Exception as e:
                                console.print(f"[red]Error generating for card {card['card_name']} ({card['direction']}) attempt {attempt+1}: {e}[/red]")
                            await asyncio.sleep(2 * (attempt + 1))  # 简单退避
                        console.print(f"[yellow]Failed to generate after retries: {card['card_name']} ({card['direction']})[/yellow]")
                        return None

                async def run_batch(cards: List[Dict]) -> List[Dict]:
                    tasks = [asyncio.create_task(worker(card)) for card in cards]
                    completed_results = []
                    for coro in asyncio.as_completed(tasks):
                        try:
                            res = await coro
                            if res:
                                completed_results.append(res)
                        except Exception as e:
                            console.print(f"[red]Unhandled task error: {e}[/red]")
                        progress.advance(task)
                    return completed_results

                # 初次运行
                completed = await run_batch(self.cards_data)

                # 检查缺失并补发
                if len(completed) < total_cards:
                    done_keys = {(r['card_name'], r['direction']) for r in completed}
                    missing_cards = [c for c in self.cards_data if (c['card_name'], c['direction']) not in done_keys]
                    if missing_cards:
                        console.print(f"[yellow]Retrying {len(missing_cards)} missing cards...[/yellow]")
                        retries = await run_batch(missing_cards)
                        completed.extend(retries)

                results.extend(completed)

            # 在同步方法中运行协程
            asyncio.run(run_all())

        self.save_results(results, f"dimension_{dimension_name}")
        console.print(f"[green]完成！生成了 {len(results)} 条解读[/green]")
    
    def generate_sample(self, count: int = 5, force: bool = False) -> None:
        """生成样本数据用于测试"""
        console.print(f"[blue]生成 {count} 条样本解读用于测试[/blue]")
        
        if not force and not Confirm.ask(f"预估成本: ~{count * 500} tokens，继续？"):
            return
        
        results = []
        
        with Progress() as progress:
            task = progress.add_task("生成样本中...", total=count)
            
            for i in range(count):
                card = self.cards_data[i % len(self.cards_data)]
                dimension = self.dimensions_data[i % len(self.dimensions_data)]
                
                result = self.generate_single_interpretation(card, dimension)
                if result:
                    results.append(result)
                
                progress.advance(task)
                time.sleep(60 / self.config.RATE_LIMIT_PER_MINUTE)
        
        self.save_results(results, "sample")
        console.print(f"[green]完成！生成了 {len(results)} 条样本解读[/green]")
    
    def save_results(self, results: List[Dict], filename_suffix: str = "") -> None:
        """保存结果到JSON文件"""
        # 根据API提供商选择正确的模型名称
        model_name = self.config.OLLAMA_MODEL if self.config.API_PROVIDER == 'ollama' else self.config.MODEL_NAME

        output_data = {
            "version": "1.0.0",
            "generated_at": datetime.now().isoformat(),
            "model": model_name,
            "count": len(results),
            "data": results
        }
        
        if filename_suffix:
            base_path = Path(self.config.OUTPUT_PATH)
            output_path = base_path.parent / f"{base_path.stem}_{filename_suffix}{base_path.suffix}"
        else:
            output_path = Path(self.config.OUTPUT_PATH)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        console.print(f"[green]结果已保存到: {output_path}[/green]")
    
    def list_cards(self) -> None:
        """列出所有卡牌"""
        table = Table(title="塔罗牌列表")
        table.add_column("卡牌名称", style="cyan")
        table.add_column("方向", style="magenta")
        table.add_column("基础牌意", style="green")
        
        for card in self.cards_data[:10]:  # 只显示前10张作为示例
            table.add_row(
                card['card_name'],
                card['direction'],
                card['summary']
            )
        
        console.print(table)
        console.print(f"[yellow]共 {len(self.cards_data)} 张卡牌（仅显示前10张）[/yellow]")
    
    def list_dimensions(self) -> None:
        """列出所有维度"""
        table = Table(title="解读维度列表")
        table.add_column("维度名称", style="cyan")
        table.add_column("类别", style="magenta")
        table.add_column("描述", style="green")
        
        for dimension in self.dimensions_data:
            table.add_row(
                dimension['name'],
                dimension['category'],
                dimension['description']
            )
        
        console.print(table)
        console.print(f"[yellow]共 {len(self.dimensions_data)} 个维度[/yellow]")

def main():
    parser = argparse.ArgumentParser(description="塔罗牌维度解读生成工具")
    parser.add_argument("--card", help="指定卡牌名称")
    parser.add_argument("--direction", choices=["正位", "逆位"], help="指定牌位方向")
    parser.add_argument("--dimension", help="指定维度名称")
    parser.add_argument("--sample", type=int, help="生成指定数量的样本数据")
    parser.add_argument("--list-cards", action="store_true", help="列出所有卡牌")
    parser.add_argument("--list-dimensions", action="store_true", help="列出所有维度")
    parser.add_argument("--force", action="store_true", help="跳过确认直接生成")
    
    args = parser.parse_args()
    
    try:
        generator = TarotAIGenerator()
        
        if args.list_cards:
            generator.list_cards()
        elif args.list_dimensions:
            generator.list_dimensions()
        elif args.card and args.direction:
            generator.generate_for_card(args.card, args.direction, force=args.force)
        elif args.dimension:
            generator.generate_for_dimension(args.dimension)
        elif args.sample:
            generator.generate_sample(args.sample, force=args.force)
        else:
            console.print("[yellow]请指定操作参数，使用 --help 查看帮助[/yellow]")
            
    except Exception as e:
        console.print(f"[red]程序运行错误: {str(e)}[/red]")

if __name__ == "__main__":
    main()