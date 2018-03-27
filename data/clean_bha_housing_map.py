from fastkml import kml

import requests
import json
import time

input_file_name = "BHA Public Housing Community Map.kml"
output_file_name = "bha_housing_map.json"
features = ["name", "address", "description", "extended_data"]

with open(input_file_name, encoding="utf-8") as file:
    k = kml.KML()
    doc = file.read()

    k.from_string(doc)

# Dive into the file, extracting each of the place markers (placemarks)
document = list(k.features())[0]
folder = list(document.features())[0]
placemarks = list(folder.features())


# Define the geocoding function using google's API

def geocode(address):
    # Ensure API throttled to correct rate
    time.sleep(1 / 50)

    api_key = "AIzaSyBhaVj4lWoj_nK1Tuu4KFaoZ5pjOTGou7Q"

    response = requests.get("https://maps.googleapis.com/maps/api/geocode/json?address=%s&key=%s"
                            % (address.replace(" ", "+"), api_key))
    response_json = json.loads(response.content)
    location = response_json["results"][0]["geometry"]["location"]
    print(address, location)
    return location['lat'], location['lng']


def placemark_to_json(placemark):
    lat, long = geocode(placemark.address)
    out = {
        "name": placemark.name,
        "address": placemark.address,
        "lat": lat,
        "long": long,
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
