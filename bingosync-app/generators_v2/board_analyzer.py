from generators_v2.bg2_ccomm_v1 import CCommV1
import os

json_path = "generators/generator_jsons_v2"
json_323 = os.path.join(json_path, "celeste_v2_lockout.json")
json_34 = os.path.join(json_path, "celeste_v2_3_4.json")

with open(json_34, encoding="utf-8") as json_file:
    json = json_file.read()

    gen = CCommV1(json)
    gen.debug = True
    board = gen.default_generate(5176883, 5)
    for obj in board:
        print("\t", obj)