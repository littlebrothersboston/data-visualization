// Used to distinguish normal map use to new location use
let addingLocation = false;
// Used to keep track of selected nodes across multiple search bars
let currentlySelectedNodes = [];

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
            .attr("cy", padding);
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
            map.setOptions({draggableCursor: "url(img/symbol_add.png) 10 10, pointer"});
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


function membersOrDefault(d) {
    return (Math.sqrt(d.members) / 5 || 4.5) + 2
}

function addNodes(filePath, cssClassName, select2Id) {
    d3.json(filePath, function (error, data) {
        if (error) throw error;

        // currently selected in this searchbar
        let select2Data = [];

        // set up the data for select2
        let newSelect2Data = data;
        // create unique id's
        let i = 0;
        newSelect2Data.forEach(d => d.id = i++);
        // requires a "text" field to render in search
        newSelect2Data.forEach(d => d.text = d.name);
        newSelect2Data.sort((a, b) => {
            if (a.text > b.text) return 1; else return -1
        });

        $("#" + select2Id).select2({
            placeholder: 'Search...',
            data: newSelect2Data,
            multiple: "multiple",
            containerCssClass: select2Id
        }).on("select2:select", function (event) {
            currentlySelectedNodes.push(event.params.data.text);
            select2Data.push(event.params.data.text);
            const nodes = d3.selectAll("svg");
            const texts = nodes.selectAll("text");

            highlight(nodes, currentlySelectedNodes, n => n.name, .2, 1);
            highlight(texts, currentlySelectedNodes, n => n.text, 0, 1);
        }).on("select2:unselect", function (event) {
            currentlySelectedNodes.splice(currentlySelectedNodes.indexOf(event.params.data.text), 1);
            select2Data.splice(select2Data.indexOf(event.params.data.text), 1);
            const nodes = d3.selectAll("svg");
            const texts = nodes.selectAll("text");

            if (currentlySelectedNodes.length === 0) {
                // selection is empty, so reset all
                setOpacity(nodes, 1);
                setOpacity(texts, 0);
            } else {
                // highlight the nodes and text that are selected
                highlight(nodes, currentlySelectedNodes, n => n.name, .2, 1);
                highlight(texts, currentlySelectedNodes, n => n.text, 0, 1);
            }

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


                const marker = layer.selectAll("svg")
                    .data(data)
                    .each(transform) // update existing markers
                    .enter().append("svg:svg")
                    .each(transform)
                    .attr("class", "marker")

                marker.append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);


                const tooltipClicked = {};
                const tooltips = {};

                function createTooltip(d) {
                    var tooltip = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0);

                    tooltips[d.text] = tooltip;

                    tooltip.html(d.name
                        + (d.address ? '<br/>Address: ' + d.address : "")
                        + (d.members ? '<br/>Members: ' + d.members : "")
                        + (d.Program ? '<br/>Program: ' + d.Program : "")
                        // 6 indicates a city site, 4 from the json + the select2 id and text
                        + (Object.keys(d).length === 6 ? '<br/>Program Type: City Site' : "")
                        + (d.type ? '<br/>' + d.type : ""))
                        .style("left", (d3.event.pageX + 9) + "px")
                        .style("top", (d3.event.pageY - 28) + "px")

                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9)
                }

                function tooltipOn(d) {
                    tooltips[d.text].transition()
                        .duration(200)
                        .style("opacity", .9);
                }

                function tooltipOff(d) {
                    if (!tooltipClicked[d.text]) {
                        tooltips[d.text].transition()
                            .duration(200)
                            .style("opacity", 0);
                    }
                }

                marker.on("mouseover", function (d) {
                    if (tooltips[d.text]) {
                        tooltipOn(d)
                    } else {
                        createTooltip(d)
                    }
                }).on("mouseout", function (d) {
                    tooltipOff(d)
                }).on("click", function (d) {
                    tooltipClicked[d.text] = !tooltipClicked[d.text];
                });

                marker.append("circle")
                    .attr("r", membersOrDefault)
                    .attr("cx", padding)
                    .attr("cy", padding);
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

function toggle(cssClass) {
    if (!(cssClass in toggles)) {
        toggles[cssClass] = false
    }

    const nodes = d3.selectAll("div")
        .filter("." + cssClass)
        .selectAll("svg")
        .selectAll("circle");
    const legend = d3.selectAll("svg").filter("." + cssClass);

    function setOpacity(items, opacity) {
        items.transition()
            .duration(300)
            .style("opacity", opacity)
    }

    if (toggles[cssClass]) {
        setOpacity(nodes, 1);
        setOpacity(legend, 1);
    } else {
        setOpacity(nodes, .2);
        setOpacity(legend, .2);
    }
    toggles[cssClass] = !toggles[cssClass]
}

// SCATTER PLOT CODE

var leftMargin = 50;
let scatterItem = d3.select("#scatter")
scatterItem.append("svg")

let scatter = scatterItem.select("svg")
    .attr("width", 800 + leftMargin)
    .attr("height", 680)

// y axis
var scale = d3.scaleLinear().domain([0, 1]).range([570, 0]);
scatter.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + leftMargin + ", 10)")
    .call(d3.axisLeft(scale));

scatter.append("text")
.attr("transform", "rotate(-90)")
.attr("x", -300)
.attr("dy", "1em")
.style("text-anchor", "middle")
.text("Miles to City Site");

// x axis
var botScale = d3.scaleLinear().domain([0, 3000]).range([0, 750]);
scatter.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + (leftMargin + 1) + ", 580)")
    .call(d3.axisBottom(botScale));

scatter.append("text")
.attr("x", 400)
.attr("y", 640)
.style("text-anchor", "middle")
.text("Members");


var nodeLookup = {}
d3.json("data/bha_housing_map_with_size.json", function (housingData) {
    d3.json("data/city_sites_clean.json", function (citySites) {
        function nearestCitySiteDistance(d) {

            // no need to worry about curvature of earth
            var distances = citySites.map(c => {
                const latDist = c.lat - d.lat;
                const longDist = c.long - d.long;
                // calculated using https://andrew.hedges.name/experiments/haversine/
                return Math.sqrt(latDist * latDist * 69 + longDist * longDist * 51)
            })


            let lowestDist = 1000;
            for (let distance of distances) {
                lowestDist = Math.min(lowestDist, distance)
            }

            nodeLookup[d.name] = lowestDist;
            return lowestDist
        }

        scatter.append("g").selectAll("scatter-dot")
            .data(housingData)
            .enter()
            .append("circle")
            .attr("class", "scatter-dot")
            .attr("r", 4)
            .attr("cx", d => (35 + +d.members / 4) + leftMargin )
            .attr("cy", d => 570 - 570 * (nearestCitySiteDistance(d) * 4))
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
    })
});


var brush = d3.brush().on("end", brushended);
var brushing = false;

function toggleBrush() {
    if (!brushing) {
        brushing = true;
        scatter.append("g")
            .attr("class", "brush")
            .call(brush);
    } else {
        scatter.select('g.brush').remove();
    }
    brushing = !brushing;
}


function dragstarted(d) {
    // if (!d3.event.active) scatter.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    // if (!d3.event.active) scatter.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function brushended() {
    var s = d3.event.selection;
    console.log(s)

    if (!s) {
        return;
    }
    var x = [s[0][0], s[1][0]];
    var y = [s[0][1], s[1][1]];
    x.sort(function (a, b) {
        return a - b;
    });
    y.sort(function (a, b) {
        return a - b;
    });

    minMembers = x[0] * 4 - 35;
    maxMembers = x[1] * 4 - 35;
    minDist = (570 - y[0]) / 570;
    maxDist = (570 - y[1]) / 570;


    const nodes = d3.selectAll("div")
        .filter(".housing")
        .selectAll("svg")
        .selectAll("circle");

    const selectedNodes = [];
    nodes.each(function (node) {
        const distance = nodeLookup[node.name]
        if (node.members >= minMembers
            && node.members <= maxMembers
            // && distance >= minDist
            // && distance <= maxDist
           ) {

            selectedNodes.push(node.name);
        }
    });

    highlight(nodes, selectedNodes, n=>n.name, .2, 1)
}


