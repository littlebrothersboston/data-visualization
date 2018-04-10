import json

with open("bha_unit_summary.json") as file:
	bha_unit_summary = json.loads("".join(file.readlines()))

with open("bha_housing_map.json") as file:
	bha_housing_map = json.loads("".join(file.readlines()))

out = []
for unit in bha_housing_map:
	name = unit["name"]
	for unit_summary in bha_unit_summary:
		if unit_summary["Development Name"] == name:
			unit["members"] = int(unit_summary["Members"].replace(",", ""))
	out.append(unit)

with open("bha_housing_map_with_size.json", "w") as file:
	file.write(json.dumps(out))