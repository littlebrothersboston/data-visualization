import time
import requests
import json


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
