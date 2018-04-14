import requests
from bs4 import BeautifulSoup
import json

url = "https://www.bostonpublicschools.org//site/UserControls/Minibase" + \
      "/MinibaseListWrapper.aspx?ModuleInstanceID=1824&PageModuleInstanceID=1849" + \
      "&FilterFields=2%3AE%3A9-12%3B&DirectoryType=C&PageIndex=1&_=1522699936745"
soup = BeautifulSoup(requests.get(url).content, "html.parser")
high_schools = soup.find_all("div", "sw-flex-item-group")
school_divs = [x.find_all("div") for x in high_schools]

out = []
for school in school_divs:
    values = [row.get_text() for row in school]
    out.append({
        "name": values[0],
        "principal": values[1],
        "address": values[2] + " " + values[3],
        "grades": values[4],
        "hours": values[5],
        "type": values[6]
    })


with open("boston_high_schools.json", "w") as file:
    file.write(json.dumps(out))
