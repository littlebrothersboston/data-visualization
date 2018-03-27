from fastkml import kml
import json

input_file_name = "BHA Public Housing Community Map.kml"
output_file_name = "bha_housing_map.json"
features = ["name", "address", "description", "extended_data"]

with open(input_file_name, encoding="utf-8") as file:
    k = kml.KML()
    doc = file.read()

    k.from_string(doc)

document = list(k.features())[0]
folder = list(document.features())[0]
placemarks = list(folder.features())


def placemark_to_json(placemark):
    out = {
        "name": placemark.name,
        "address": placemark.address,
        "description": placemark.description,
        "style_url": placemark.styleUrl,
    }

    extended_data = placemark.extended_data
    extended = dict([(e.name, e.value) for e in extended_data.elements])
    out.update(extended)

    return out

with open(output_file_name, mode="w") as out:
    placemark_json = [placemark_to_json(p) for p in placemarks]
    out.write(json.dumps(placemark_json))

