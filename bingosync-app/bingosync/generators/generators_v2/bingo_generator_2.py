from pydantic import BaseModel
from bingosync.generators.bingo_generator import BingoGenerator
import random

type CcommV1Generator = list[list[GeneratorEntry]]
type CcommV2Generator = list[list[list[GeneratorEntry]]]
class GeneratorEntry(BaseModel):
    name: str
    types: list[str]

class GeneratorOutputSquare(BaseModel):
    name: str
    tier: int

type GeneratorOutput = list[GeneratorOutputSquare]

MAX_SEEDCOUNT = 10_000_000 - 1

class BingoGeneratorV2(BingoGenerator):
    def __init__(self, generator_json_str : str | None):
        self.generator_json = self.validate_custom_json(generator_json_str)

    def get_card(
            self, 
            _seed : (str | None) = None,
            generator_json : CcommV1Generator | CcommV2Generator | None = None,
            _size : int | str = 5) -> tuple[int, dict[str, any]]:

        seed : int
        size : int
        try:
            seed = int(_seed)
        except Exception:
            seed = random.randint(0, MAX_SEEDCOUNT)

        if type(_size) is str:
            try:
                size = int(_size)
            except Exception:
                size = 5
        else:
            size = _size

        output : GeneratorOutput
        if generator_json != None:
            # Custom JSON
            output = self.generate(seed, generator_json, size)
        elif self.generator_json != None:
            # Default variant JSON
            output = self.generate(seed, self.generator_json, size)
        else:
            # No JSON found
            output = self._backup_generate(size)

        return (seed, [square.model_dump() for square in output])

    def generate(self, 
                   seed : int, 
                   generator_json : CcommV1Generator | CcommV2Generator, 
                   size : int) -> GeneratorOutput:
        """Generate a card of the given size, from the given seed, from the given generator.
        Subclasses should override this method, NOT get_card().
        Error cases can call back to _backup_generate()"""
        return self._backup_generate(size)
    
    def _backup_generate(self, 
                   size : int) -> GeneratorOutput:
        ## Default impl just returns Missing Objectives
        missing_obj = GeneratorOutputSquare(name="Missing Objective", tier=999)
        
        return [missing_obj for _ in range(size * size)]

    def validate_custom_json(self, custom_json : str, size : int = 5) -> CcommV1Generator | CcommV2Generator | None:
        """Check if the custom_json (as raw string) is a valid generator json
        Return the structured generator object as get_card will expect it, or None for an invalid generator"""
        return None