from __future__ import annotations
import os
from typing import Any, Iterator
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

class BingoGeneratorLegacyNodejsBulk(BingoGeneratorLegacyNodejs):
    def all_the_boards(self, min_seed=0, max_seed=1_000_000 - 1) -> Iterator[LegacyNodejsOutput]:
        full_command = self.generator_bytes + f"""
            var i = {min_seed};
            const max_seed = {max_seed};
            function seed() {{
                while (i <= max_seed) {{
                    if (!process.stdout.write(JSON.stringify(bingoGenerator(bingoList, {{seed: i++}})) + "\\n")) {{
                        return process.stdout.once('drain', seed);
                    }}
                }}
            }}
            seed();
        """.encode()
        p = subprocess.Popen(["node", "-"], cwd=os.path.join(os.path.dirname(__file__), "js"), stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=False)
        assert p.stdin is not None
        assert p.stdout is not None
        p.stdin.write(full_command)
        p.stdin.flush()
        p.stdin.close()
        for i, line in enumerate(p.stdout):
            # if i % 1000 == 0:
            #     print(i)
            yield LegacyNodejsOutput.model_validate_json(line)
        p.wait()
