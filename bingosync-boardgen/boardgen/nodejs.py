from __future__ import annotations
import os
from typing import Any
import json
import subprocess

from pydantic import BaseModel

from .base import GeneratorOutputSquare, BingoGenerator

class LegacyNodejsOutput(BaseModel):
    seed: int
    objectives: list[GeneratorOutputSquare]

class BingoGeneratorLegacyNodejs(BingoGenerator):
    def __init__(self, filepath: str, debug: bool = False):
        with open(filepath, 'rb') as fp:
            self.generator_bytes = fp.read()
        self.debug = debug

    def generate(self, seed, size = 5):
        opts = {"size": size, "seed": str(seed)}
        js_command = "bingoGenerator(bingoList, " + json.dumps(opts) + ")"
        raw = self.eval(js_command)
        return LegacyNodejsOutput.model_validate(raw).objectives

    def eval(self, js_command, timeout=None) -> Any:
        if timeout is None:
            # idk man
            timeout = 8

        js_eval = "\nconsole.log(JSON.stringify(" + js_command + "));"
        full_command = self.generator_bytes + js_eval.encode("utf-8")

        try:
            out = subprocess.check_output(["node", "-"], input=full_command, timeout=timeout, cwd=os.path.join(os.path.dirname(__file__), "js"))
        except subprocess.TimeoutExpired as e:
            raise TimeoutError("NodeJS timed out") from e

        return json.loads(out)
