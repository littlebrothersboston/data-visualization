import requests
from bs4 import BeautifulSoup


for i in range(10):
    url = "https://www.bostonpublicschools.org//site/UserControls/Minibase" + \
          "/MinibaseListWrapper.aspx?ModuleInstanceID=1824&PageModuleInstanceID=1849" + \
          "&FilterFields=2%3AE%3A9-12%3B&DirectoryType=C&PageIndex=" + str(i) + "&_=1522699936745"
    soup = BeautifulSoup(requests.get(url).content, "html.parser")
    high_schools = soup.find_all("div", "sw-flex-item-group")
    spans = [x.find_all("span") for x in high_schools]

    print([y.get_text() for y in spans])
    # print(high_schools)

    # print(soup.prettify())
