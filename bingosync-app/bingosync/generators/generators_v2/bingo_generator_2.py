from pydantic import BaseModel
from bingosync.generators.bingo_generator import BingoGenerator

type CcommV1Generator = list[list[GeneratorEntry]]
type CcommV2Generator = list[list[list[GeneratorEntry]]]
class GeneratorEntry(BaseModel):
    name: str
    types: list[str]

class GeneratorOutputSquare(BaseModel):
    name: str
    tier: int



class BingoGeneratorV2(BingoGenerator):
    def __init__(_):
        # TODO: implement json strings as "custom boards" instead of duplicating code
        pass

    def get_card(
            self, 
            seed : (int | None) = None,
            custom_board : CcommV1Generator | CcommV2Generator | None = None,
            size : int | str = 5) -> tuple[int, dict[str, any]]:

        if type(size) is str:
            try:
                size = int(size)
            except Exception:
                size = 5
        else:
            size = size

        missing_obj = GeneratorOutputSquare(name="Missing Objective", tier=999).model_dump()

        return (-1, [missing_obj for _ in range(size * size)])

    def validate_custom_json(self, custom_json, size=5) -> CcommV1Generator | CcommV2Generator:
        """Check if the custom_json (as raw string) is a valid generator json
        Return the structured generator object as get_card will expect it"""
        return []