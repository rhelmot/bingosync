from __future__ import annotations
import random

from pydantic import BaseModel, TypeAdapter, model_validator

from .base import GeneratorOutputSquare, BingoGenerator, load_json, reorganize_tiers_for_arbitrary_sizes, shuffle_magic_square, magic_square

class GeneratorEntry(BaseModel):
    name: str
    types: list[str]

class CcommV1Generator(BaseModel):
    tiers: list[list[GeneratorEntry]]

    @model_validator(mode='before')
    @classmethod
    def _bare(cls, raw):
        return {"tiers": TypeAdapter(list[list[GeneratorEntry]]).validate_python(raw)}

class CcommV2Generator(BaseModel):
    tiergroup: list[list[list[GeneratorEntry]]]

class BingoGeneratorCcommV1NoLines(BingoGenerator):
    def __init__(self, filepath: str, debug: bool = False):
        self.generator = load_json(filepath, CcommV1Generator)
        self.debug = debug

    def generate(self, seed, size = 5):
        r = random.Random(seed)
        tiers_objectives = reorganize_tiers_for_arbitrary_sizes(self.generator.tiers, size*size)
        squares_difficulties = shuffle_magic_square(magic_square(size), r)
        chosen_objectives = [r.choice(tiers_objectives[difficulty]) for difficulty in squares_difficulties]
        return [GeneratorOutputSquare(name=obj.name, tier=tier) for tier, obj in zip(squares_difficulties, chosen_objectives)]
