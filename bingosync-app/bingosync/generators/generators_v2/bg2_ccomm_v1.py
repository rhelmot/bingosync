from bingosync.generators.generators_v2.bingo_generator_2 import *
import json
import math
import random
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

        self.rand = random.Random(seed)
        self.generated_tiers = False

        if len(generator_json) != size * size:
            generator_json = self.rebalance_tiers(generator_json, size)

        bingo_board = [GeneratorOutputSquare(name="", tier=0)] * 25
        for i in range(size * size):
            tier = self.difficulty(size, i)
            bingo_board[i] = GeneratorOutputSquare(name=f"Tier {tier} Objective", tier=tier)

        for i in range(size * size):
            tier = bingo_board[i].tier

            shuffled_goals = self.get_shuffled_goals(tier, generator_json)
            j = 0
            synergy = 9999
            current_obj = None
            min_syn_obj = None
            while synergy != 0  and j < len(shuffled_goals):
                current_obj = GeneratorOutputSquare(
                    name=shuffled_goals[j].name,
                    tier=tier,
                    tags=shuffled_goals[j].types)
                bingo_board[i] = current_obj
                obj_synergy = self.check_line_synergy(i, size, bingo_board)
                if min_syn_obj == None or obj_synergy < synergy:
                    min_syn_obj = current_obj
                    synergy = obj_synergy
                j += 1

        return bingo_board


    def rebalance_tiers(self, generator : CcommV1Generator, size : int):
        all_objs = [obj for tier in generator for obj in tier]
        count = len(all_objs)
        per_each = math.floor(count / (size * size))
        remainder = count % (size * size)

        obj_iter = 0
        gen : CcommV1Generator = [[] for i in range(size * size)]
        for i in range(size * size):
            for j in range(per_each):
                gen[i].append(all_objs[obj_iter])
                obj_iter += 1
            if i < remainder:
                gen[i].append(all_objs[obj_iter])
                obj_iter += 1
        return gen


    def check_line_synergy(self, square : int, size : int, board : GeneratorOutput) -> int:
        """Iterate the given square's rows and columns to count objectives with synergy"""
        row = square % size
        col = square // size

        self_tags = board[square].tags
        synergy = 0
        # Iterate row
        for i in range(size):
            if i == col:
                continue
            for tag in self_tags:
                if tag in board[(row * size) + i].tags:
                    synergy += 1

        # Iterate col
        for i in range(size):
            if i == row:
                continue
            for tag in self_tags:
                if tag in board[(i * size) + col].tags:
                    synergy += 1

        # Iterate TLBR
        if row == col:
            for i in range(size):
                if i == row:
                    continue
                for tag in self_tags:
                    if tag in board[(i * size) + i].tags:
                        synergy += 1

        # Iterate TRBL
        if row == (size - col - 1):
            for i in range(size):
                if i == row:
                    continue
                for tag in self_tags:
                    if tag in board[(i * size) + size - i - 1].tags:
                        synergy += 1
        return synergy

    def shuffle(self, list : list):
        for i in range(len(list)):
            elt = self.rand.randint(0, i)
            temp = list[i]
            list[i] = list[elt]
            list[elt] = temp

    def get_shuffled_goals(self, tier : int, board : CcommV1Generator):
        tier_copy = board[tier].copy()
        self.shuffle(tier_copy)
        return tier_copy

    def difficulty(self, size, tier):
            # This function takes a space on the board between 0 and 24, and returns its difficulty score, also between 0 and 24.
            # For some sizes, these should always form a magic square if seed remains the same
        if size == 5:
            return self.difficulty_5(tier)

        try:
            return self.rand_tiers[tier]
        except AttributeError:
            self.rand_tiers = self.shuffle([*range(size * size)])
            return self.rand_tiers[tier]

    def difficulty_5(self, tier):
        if not self.generated_tiers:
            # Taken from legacy ccomm_v1
            self.rt1 = [*range(5)]
            self.shuffle(self.rt1)

            self.rt2 = [*range(5)]
            self.shuffle(self.rt2)

            self.random_seed_x = self.rand.randint(0, 4)
            self.generated_tiers = True

        y = tier // 5
        x = (tier + self.random_seed_x) % 5
        index1 = (x + 3 * y) % 5
        index2 = (3 * x + y) % 5

        row = self.rt1[index1]
        col = self.rt2[index2]
        return (5 * row) + col