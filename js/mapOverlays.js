// Used to distinguish normal map use to new location use
let addingLocation = true;

// given all such possible elements, the list of those to highlight,
// the function that extracts the field to compare with toHighlight,
// the opacity of the ones in the field, and the others,
// highlights nodes
function highlight(all, toHighlight, extractor, unselectedOpacity, selectedOpacity) {
    all.transition()
        .filter(x => !!x)
        .attr("opacity", unselectedOpacity)
        // choose selected ones
        .filter(n => toHighlight.indexOf(extractor(n)) >= 0)
        // update their opacity
        .attr("opacity", selectedOpacity)
}

function setOpacity(chosen, opacity) {
    // sets the opacity of all given elements to the given opacity
    highlight(chosen, [], x => x, opacity, opacity)
}

// Initiate map
const map = new google.maps.Map(d3.select("#map").node(), {
    zoom: 12,
    center: new google.maps.LatLng(42.318643, -71.072642),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    draggableCursor: "crosshair",
    draggingCursor: "all-scroll"
});

const potentialLocationData = [];
const potentialLocationOverlay = new google.maps.OverlayView();
// Add the container when the overlay is added to the map.
potentialLocationOverlay.onAdd = function () {
    const potentialLocationLayer = d3.select(potentialLocationOverlay.getPanes().overlayMouseTarget)
        .append("div")
        .attr("class", "potential-location");

    // Draw each marker as a separate SVG element.
    potentialLocationOverlay.draw = function () {
        const potentialLocationProjection = potentialLocationOverlay.getProjection();
        const padding = 15;

        function transform(d) {
            d = new google.maps.LatLng(d.lat, d.long);
            d = potentialLocationProjection.fromLatLngToDivPixel(d);
            return d3.select(this)
                .style("left", (d.x - padding) + "px")
                .style("top", (d.y - padding) + "px");
        }

        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        const marker = potentialLocationLayer.selectAll("svg")
            .data(potentialLocationData)
            .each(transform) // update existing markers
            .enter().append("svg:svg")
            .each(transform)
            .attr("class", "marker")
            .on("mouseover", function (d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9)
                tooltip.html(d.name + '<br>Potential Program Location')
                    .style("left", (d3.event.pageX + 9) + "px")
                    .style("top", (d3.event.pageY - 28) + "px")
            })
            .on("mouseout", function (d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0)
            })
            .on("click", function (d) {
                // clicking functionality goes here
            });

        marker.append("circle")
            .attr("r", 6.5)
            .attr("cx", padding)
            .attr("cy", padding)
            .append("svg:title")
            .text("Potential Program Location");

        marker.append("text")
            .attr("x", d => padding + 3 + 6.5)
            .attr("y", padding)
            .attr("opacity", 0)
            .attr("dy", ".31em")
            .attr("width", "100px")
            .text(function (d) {
                return d.name;
            });
    };
};

// Bind our overlay to the map…
potentialLocationOverlay.setMap(map);

function addLocation() {
    addingLocation = true;
}

// GET this working! Want to have a nice marker to show where new location will be
function drawPotentialLocation(coordinates) {
    const potentalLocationMarker = d3.select(".potential-location");
    potentalLocationMarker.attr({
        "cx": coordinates[0],
        "cy": coordinates[1],
        "r": 25
    });
}

//Fix later
const unusedconstiable = d3.select('body')
    .on('mousemove', function () {
        const coordinates = [0, 0]
        if (addingLocation) {
            map.setOptions({draggableCursor: "url(img/symbol_add.png) 64 64, pointer"});
        } else {
            map.setOptions({draggableCursor: "crosshair"});
        }
        // drawPotentialLocation(coordinates)
    })

google.maps.event.addListener(map, 'click', function (event) {
    if (addingLocation) {
        addingLocation = false;
        const newLocation = {};
        const objectId = potentialLocationData.length;
        newLocation.id = objectId;
        newLocation.lat = event.latLng.lat();
        newLocation.long = event.latLng.lng();
        newLocation.name = 'Potential Program Location';
        newLocation.text = 'Potential Program Location';
        potentialLocationData.push(newLocation)
        potentialLocationOverlay.draw();
        potentialLocationOverlay.setMap(map);
    }
});

// Start of boundary-limit code
const strictBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(42.226019, -71.151599),
    new google.maps.LatLng(42.421625, -71.023096)
);

// Listen for the dragend event
google.maps.event.addListener(map, 'dragend', function () {
    if (strictBounds.contains(map.getCenter())) return;

    // We're out of bounds - Move the map back within the bounds

    const c = map.getCenter();
    let x = c.lng();
    let y = c.lat();
    let maxX = strictBounds.getNorthEast().lng();
    let maxY = strictBounds.getNorthEast().lat();
    let minX = strictBounds.getSouthWest().lng();
    let minY = strictBounds.getSouthWest().lat();

    if (x < minX) x = minX;
    if (x > maxX) x = maxX;
    if (y < minY) y = minY;
    if (y > maxY) y = maxY;

    map.setCenter(new google.maps.LatLng(y, x));
});

// Zoom limits
map.setOptions({minZoom: 11, maxZoom: 18});
// End of boundary-limit code

map.mapTypes.set('styled_map', styledMapType);
map.setMapTypeId('styled_map');

const select2data = [];

function addNodes(filePath, cssClassName, select2Id) {
    d3.json(filePath, function (error, data) {
        if (error) throw error;

        // set up the data for select2
        let newSelect2Data = data;
        // create unique id's
        let i = 0;
        newSelect2Data.forEach(d => d.id = i++);
        // requires a "text" field to render in search
        newSelect2Data.forEach(d => d.text = d.name);
        newSelect2Data.sort((a, b) => {
            if (a.text > b.text) return 1; else return 0
        });

        $("#" + select2Id).select2({
            placeholder: 'Search...',
            data: newSelect2Data,
            multiple: "multiple",
            containerCssClass: select2Id
        }).on("select2:select", function (event) {
            const selection = $("#" + select2Id).select2("data");
            const toHighlight = selection.map(s => s.name);

            highlight(d3.selectAll("svg"), toHighlight, n => n.name, .2, 1);
            highlight(d3.selectAll("svg").selectAll("text"), toHighlight, n => n.text, 0, 1);
        }).on("select2:unselect", function (event) {
            const search = $("#" + select2Id);
            const previousSelection = search.select2("data");

            const selected = previousSelection.map(s => s.name);
            const nodes = d3.selectAll("svg");
            const texts = nodes.selectAll("text");

            if (selected.length === 0) {
                // selection is empty, so reset all
                setOpacity(nodes, .8);
                setOpacity(texts, 0);
            } else {
                // highlight the nodes and text that are selected
                highlight(nodes, selected, n => n.name, .2, 1);
                highlight(texts, selected, n => n.text, 0, 1);
            }

            search.trigger('change');
            throw "please ignore this error, it's supposed to be here";
        });

        const overlay = new google.maps.OverlayView();
        // Add the container when the overlay is added to the map.
        overlay.onAdd = function () {
            const layer = d3.select(overlay.getPanes().overlayMouseTarget)
                .append("div")
                .attr("class", cssClassName);

            // Draw each marker as a separate SVG element.
            overlay.draw = function () {
                const projection = overlay.getProjection();
                const padding = 15;

                function transform(d) {
                    d = new google.maps.LatLng(d.lat, d.long);
                    d = projection.fromLatLngToDivPixel(d);
                    return d3.select(this)
                        .style("left", (d.x - padding) + "px")
                        .style("top", (d.y - padding) + "px");
                }

                const tooltip = d3.select("body")
                    .append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                function membersOrDefault(d) {
                    return (Math.sqrt(d.members) / 5 || 4.5) + 2
                }

                const marker = layer.selectAll("svg")
                    .data(data)
                    .each(transform) // update existing markers
                    .enter().append("svg:svg")
                    .each(transform)
                    .attr("class", "marker")
                    .on("mouseover", function (d) {
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", .9);

                        tooltip.html(d.name
                            + '<br>Address: '
                            + (d.address ? '<br>Address: ' + d.address : "")
                            + (d.members ? '<br>Members: ' + d.members : ""))
                            .style("left", (d3.event.pageX + 9) + "px")
                            .style("top", (d3.event.pageY - 28) + "px")
                    })
                    .on("mouseout", function (d) {
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", 0)
                    })
                    .on("click", function (d) {
                        // clicking functionality goes here
                    });

                marker.append("circle")
                    .attr("r", membersOrDefault)
                    .attr("cx", padding)
                    .attr("cy", padding)
                    .append("svg:title")
                    .text(d => d.description || "City Site Program");

                marker.append("text")
                    .attr("x", d => padding + 3 + membersOrDefault(d))
                    .attr("y", padding)
                    .attr("opacity", 0)
                    .attr("dy", ".31em")
                    .attr("width", "100px")
                    .text(function (d) {
                        return d.name;
                    });
            };
        };

        // Bind our overlay to the map…
        overlay.setMap(map);
    });
}

addNodes("data/bha_housing_map_with_size.json", "housing", "search-bha");
addNodes("data/city_sites_clean.json", "city-sites", "search-city-sites");
addNodes("data/boston_high_schools.json", "high-schools", "search-high-schools");


// keeps track of each toggleable item and whether it's toggled
const toggles = {};

function toggle(it) {
    if (!(it in toggles)) {
        toggles[it] = true
    }
    const nodes = d3.selectAll("div")
        .filter("." + it)
        .selectAll("svg")
        .selectAll("circle");

    const legend = d3.selectAll("svg").filter("." + it);
    if (toggles[it]) {
        nodes.attr("opacity", .2);
        legend.attr("opacity", .2);
    } else {
        nodes.attr("opacity", 1);
        legend.attr("opacity", 1);
    }
    toggles[it] = !toggles[it]
}


