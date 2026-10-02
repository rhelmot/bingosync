from __future__ import annotations

import json
import abc
from pathlib import Path
import random
import itertools
import functools
import subprocess
from typing import Any

from pydantic import BaseModel, TypeAdapter, model_validator, Field

class GeneratorOutputSquare(BaseModel):
    name: str
    tier: int = Field(validation_alias="difficulty")
    tags: list[str] = []

type GeneratorOutput = list[GeneratorOutputSquare]

class BingoGenerator(abc.ABC):
    @abc.abstractmethod
    def generate(self, seed: int, size: int = 5) -> GeneratorOutput:
        ...

def load_json[M: BaseModel](filename: str | Path, model: type[M]) -> M:
    with open(filename, 'rb') as fp:
        filedata = fp.read()
    return TypeAdapter(model).validate_json(filedata)

def reorganize_tiers_for_arbitrary_sizes[T](tiers: list[list[T]], target_tiers: int) -> list[list[T]]:
    if len(tiers) == target_tiers:
        return tiers
    result: list[list[T]] = [[]]
    flat = sum(tiers, [])
    if len(flat) < target_tiers:
        raise Exception("Not enough objectives to rebalance")

    for i, obj in enumerate(flat):
        chunk = int((i / len(flat)) * target_tiers)
        if chunk + 1 == len(result):
            result[-1].append(obj)
        else:
            result.append([obj])

    assert len(result) == target_tiers
    return result

@functools.cache
def magic_square(width: int) -> list[list[int]]:
    result = [[-1 for _ in range(width)] for _ in range(width)]
    if width % 2 == 1:
        x, y = 0, 0
        for i in range(width*width):
            result[y][x] = i
            x, y = (x-1)%width, (y+1)%width
            if result[y][x] != -1:
                y += 1
                y %= width
    else:
        raise NotImplementedError("COME ON MAN")
    # assert sorted(sum(result, [])) == list(range(width*width))
    return result

def shuffle_magic_square(square: list[list[int]], r: random.Random) -> list[int]:
    r.shuffle(square)
    square2 = list(zip(*square))
    r.shuffle(square2)
    return list(itertools.chain.from_iterable(square2))