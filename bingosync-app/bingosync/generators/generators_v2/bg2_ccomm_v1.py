from bingosync.generators.generators_v2.bingo_generator_2 import *
import json
from pydantic import TypeAdapter

class CCommV1(BingoGeneratorV2):
    def validate_custom_json(self, custom_json : str, size : int = 5) -> CcommV1Generator | None:
        """Check if the custom_json (as raw string) is a valid generator json
        Return the structured generator object as get_card will expect it, or None for an invalid generator"""
        adapter = TypeAdapter(CcommV1Generator)
        generator: CcommV1Generator
        try:
            generator = adapter.validate_json(custom_json)
        except Exception:
            return None

        # TODO: validate generator tier count, etc.
        return generator

    def generate(self, 
                   seed : int, 
                   generator_json : CcommV1Generator, 
                   size : int) -> GeneratorOutput:
        """Generate a card of the given size, from the given seed, from the given generator.
        Subclasses should override this method, NOT get_card().
        Error cases can call back to _backup_generate()"""

        if len(generator_json) == size * size:
            return [GeneratorOutputSquare(name=objs[-1].name, tier=tier) for tier, objs in enumerate(generator_json)]

        return self._backup_generate(size)