function AppViewModel() {
    var self = this;
    var map;
    var framesPerSecond = 15;
    var initialOpacity = 1
    var opacity = initialOpacity;
    var initialRadius = 15;
    var radius = initialRadius;
    var maxRadius = 25;
    var isMapLoaded = false;
    var regionsMarkersMap = [];
    var socket = io.connect(location.host);
    var mapboxToken = '';
    self.info = ko.observable({
        totalCount: ko.observable(0),
        totalCountPerMinute: ko.observable(0),
        totalCountPerSecond: ko.observable(0),
        latency: ko.observable()
    });

    self.mode = ko.observable("calm");
    self.regions = ko.observableArray();

    var displayedRegions = [];

    function onDataArrived(data) {
        if (data) {
            previousCount = Math.round(self.info().totalCount());

            self.info().totalCount(data.totalCount);

            if (previousCount > 0) {
                self.info().totalCountPerSecond(data.totalCount - previousCount);
                self.info().totalCountPerMinute(self.info().totalCountPerSecond() * 60);
            }

            self.regions = ko.observableArray(data.regions);
            updateMap(data.regions);
        }
    }

    function listenToDataArrived() {
        socket.on('onEventsUpdate', function (data) {
            onDataArrived(data);
        });
    }

    self.panic = function () {
        $.ajax('/panic', { method: 'POST' }).done(function () { });
        self.mode("panic");

        drawRegion("northeurope");
        drawRegion("eastjapan");

        displayedRegions.push("northeurope");
        displayedRegions.push("eastjapan");
    }

    self.extremepanic = function () {
        $.ajax('/extremepanic', { method: 'POST' }).done(function () { });
        self.mode("extreme");

        self.regions().forEach(region => {
            if (displayedRegions.indexOf(region.name) == -1) {
                drawRegion(region.name);
                displayedRegions.push(region.name);
            }
        });
    }

    self.calmdown = function () {
        $.ajax('/calmdown', { method: 'POST' }).done(function () { });
        self.mode("calm");
        location.reload();
    }

    function drawRegion(region) {
        var coords = getCoordinatesForRegion(region);

        map.addSource(region + 'point', {
            "type": "geojson",
            "data": {
                "type": "Point",
                "properties": {
                    "name": "lala"
                },
                "coordinates": [coords[1], coords[0]]
            }
        });

        map.addLayer({
            "id": region + "point",
            "source": region + "point",
            "type": "circle",
            "paint": {
                "circle-radius": initialRadius,
                "circle-radius-transition": { duration: 0 },
                "circle-opacity-transition": { duration: 0 },
                "circle-color": "#F6F289"
            }
        });

        map.addLayer({
            "id": region + "point1",
            "source": region + "point",
            "type": "circle",
            "paint": {
                "circle-radius": initialRadius,
                "circle-color": "#F6F289"
            }
        });

        var popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });

        map.on('mouseenter', region + 'point', function (e) {
            map.getCanvas().style.cursor = 'pointer';

            var coordinates = e.features[0].geometry.coordinates.slice();

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            var name = e.features[0].source.replace("point", "");

            self.regions().forEach(region => {
                if (name == region.name) {
                    var count = region.count;
                    var description = name + ' ' + count;

                    popup.setLngLat(coordinates)
                        .setHTML("<h2><strong>Location: " + name + "</strong></h2><br><h3>Count: <strong>" + count + "</strong></h3>")
                        .addTo(map);
                }
            });
        });

        map.on('mouseleave', region + 'point', function () {
            map.getCanvas().style.cursor = '';
            popup.remove();
        });
    }

    function setMap() {
        mapboxgl.accessToken = mapboxToken;
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v9',
            zoom: 1,
            center: [0, 0]
        });

        map.on('load', function () {
            isMapLoaded = true;

            drawRegion("eastus");
            displayedRegions.push("eastus");
        });
    }

    function getCoordinatesForRegion(region) {
        var coordMaps = [];
        coordMaps['westus'] = [47.234300, -119.852550];
        coordMaps['eastus'] = [36.812583, -82.737827]
        coordMaps['southcentralus'] = [33.188184, -94.913368]
        coordMaps['northcentralus'] = [46.657331, -98.756287]
        coordMaps['centralus'] = [39.167335, -102.241092]
        coordMaps['centralcanada'] = [57.249709, -109.058208]
        coordMaps['northeurope'] = [52.241992, 4.968231]
        coordMaps['eastcanada'] = [57.718819, -94.423966]
        coordMaps['eastjapan'] = [37.495799, 139.949260]
        coordMaps['southbrazil'] = [-23.502068, -46.624720]
        coordMaps['centralfrance'] = [47.014907, 2.149497]
        coordMaps['southuk'] = [50.416668, -4.750000]
        coordMaps['westuk'] = [52.027571, -4.441195]
        coordMaps['southeastaustralia'] = [-33.639776, 149.220643]

        return coordMaps[region];
    }

    function setActiveTicketSales(region) {
        var marker = regionsMarkersMap[region];
        if (!marker) {
            var handle = animateMarker(region + 'point');
            regionsMarkersMap[region] = handle;
        }
    }

    function animateMarker(name) {
        return setTimeout(function () {
            requestAnimationFrame(function () {
                animateMarker(name);
            });

            radius += (maxRadius - radius) / framesPerSecond;
            opacity -= (.9 / framesPerSecond);

            if (opacity <= 0) {
                radius = initialRadius;
                opacity = initialOpacity;
            }

            map.setPaintProperty(name, 'circle-radius', radius);
            map.setPaintProperty(name, 'circle-opacity', opacity);

        }, 1000 / framesPerSecond);
    }

    function updateMap(regions) {
        if (!isMapLoaded)
            return;

        if (self.mode() == "calm") {
            setActiveTicketSales("eastus");
            return;
        }
        else if (self.mode() == "panic") {
            setActiveTicketSales("eastus");
            setActiveTicketSales("northeurope");
            setActiveTicketSales("eastjapan");
            return;
        }
        else if (self.mode() == "extreme") {
            regions.forEach(region => {
                setActiveTicketSales(region.name);
            });
        }
    }

    function measureLatency() {
        setInterval(function() {
            $.ajax('/latency').success(function(response) {
                self.info().latency(response.latency);
            });
        }, 3000);
    }

    function init() {
        setMap();
        listenToDataArrived();
        measureLatency();
    }

    init();
}