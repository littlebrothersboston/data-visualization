from fastkml import kml

import requests
import time
import json

def geocode(address):
    # Ensure API throttled to correct rate
    time.sleep(1 / 50)

    api_key = "AIzaSyBhaVj4lWoj_nK1Tuu4KFaoZ5pjOTGou7Q"

    response = requests.get("https://maps.googleapis.com/maps/api/geocode/json?address=%s&key=%s"
                            % (address.replace(" ", "+"), api_key))
    response_json = json.loads(response.content)
    location = response_json["results"][0]["geometry"]["location"]
    return location['lat'], location['lng']


def add_lat_long_to_address(value):
    lat, long = geocode(value["address"])
    value.update({"lat": lat, "long": long})
    return value


with open("city_sites.json") as file:
    out = [add_lat_long_to_address(a) for a in json.loads(file.read())]
    

with open("city_sites_clean.json", mode="w") as file:
    file.write(json.dumps(out))