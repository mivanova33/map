$(document).ready(function() {
    var raster = new ol.layer.Tile({
        source: new ol.source.MapQuest({layer: 'osm'})
    });

    var map = new ol.Map({
        layers: [raster],
        target: document.getElementById('map'),
        //target: 'map',
        view: new ol.View({
            center: [5260000, 7585000],
            zoom: 14
        })
    });

    var features = new ol.Collection();
    var featureOverlay = new ol.layer.Vector({
        source: new ol.source.Vector({features: features}),
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#0000ff',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#0000ff'
                })
            })
        })
    });

    featureOverlay.setMap(map);
// Create vector source and the feature to it.
    var vectorSource = new ol.source.Vector();

    var modify = new ol.interaction.Modify({
        features: features,
        // the SHIFT key must be pressed to delete vertices, so
        // that new vertices can be drawn at the same position
        // of existing vertices
        deleteCondition: function(event) {
            return ol.events.condition.shiftKeyOnly(event) &&
                ol.events.condition.singleClick(event);
        }
    });

    modify.on('modifyend',
        function (evt) {
            var modifiedFeatures = evt.features;
            //console.log(modifiedFeatures);
            modifiedFeatures.forEach(function(feature){
                var modifiedCoords = feature.getGeometry().getCoordinates();
                //console.log(modifiedCoords);
                var polygonName = $('#label-polygon').val();
                feature.getId();
                console.log(feature);
                //var data = {
                //    coordinates: modifiedCoords,
                //    name: polygonName
                //    //id: polygonID
                //};
                //console.log(data);
                //$.post('coordinate-data.php', data, function(data){console.log(data)});

            });
            //console.log(modifiedFeatures);
        }
    );

    //mouse coordinates

    var mousePositionControl = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.createStringXY(4),
        projection: 'EPSG:3857',
        // comment the following two lines to have the mouse position
        // be placed within the map.
        className: 'custom-mouse-position',
        target: document.getElementById('mouse-position'),
        undefinedHTML: '&nbsp;'
    });

    $(".custom-mouse-position").hide();
    map.addControl(mousePositionControl);

    var precisionInput = $('#precision');
    precisionInput.on('change', function() {
        var format = ol.coordinate.createStringXY(this.valueAsNumber);
        mousePositionControl.setCoordinateFormat(format);

    });

    var draw; // global so we can remove it later
    function addInteraction() {
        draw = new ol.interaction.Draw({
            features: features,
            type: (typeSelect.value)
        });
        map.addInteraction(draw);

        draw.on('drawend',
            function (evt) {

                //evt.feature.setId(123456);
                //console.log(evt.feature);

                var sketch = evt.feature.clone();
                console.log(sketch);
                //console.log(sketch.getGeometry().getCoordinates());
                sketch.getGeometry().transform('EPSG:3857', 'EPSG:4326');
                var coordinates = sketch.getGeometry().getCoordinates();
                var polygonName = $('#label-polygon').val();
                var data = {
                    coordinates: coordinates,
                    name: polygonName
                    //id: polygonId
                };
                //console.log(data);
                $.post('coordinate-data.php', data, function(data){console.log(data)});
            });

    }

    var typeSelect = document.getElementById('type');
    /**
     * Let user change the geometry type.
     * @param {Event} e Change event.
     */
    typeSelect.onchange = function (e) {
        map.removeInteraction(draw);
        addInteraction();
    };

    addInteraction();

    $(this).keydown(function (e) {
        if (e.keyCode == 27) { // escape key maps to keycode `27`
            map.removeInteraction(draw);
        }
    });

    $(this).keyup(function (e) {
        if (e.keyCode == 27) { // escape key maps to keycode `27`
            map.addInteraction(draw);
        }
    });

    //console.log(vectorSource.getFeatures());

    $.get('coordinate-data.php', function(data){
        coordsObjs = JSON.parse(data);
        for (var i in coordsObjs) {
            var flatCoords = [];
            for(var j in coordsObjs[i]['coordinates'][0]){

                var x = parseFloat(coordsObjs[i]['coordinates'][0][j][0]),
                    y = parseFloat(coordsObjs[i]['coordinates'][0][j][1]),
                    name = (coordsObjs[i]['name']);
                    //console.log([x,y], name);
                    flatCoords.push(ol.proj.transform([x,y],'EPSG:4326', 'EPSG:3857'));
            }
            var savedPolygon = new ol.geom.Polygon([flatCoords]);
            //console.log(savedPolygon);
            // Create feature with polygon.
            var feature = new ol.Feature(savedPolygon);

            var vectorLayer = new ol.layer.Vector({
                // Create vector layer attached to the vector source.
                source: vectorSource,
                type: /** @type {ol.geom.GeometryType} */ (typeSelect.value),
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#0000ff',
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#0000ff'
                        })
                    })
                })
            });
            vectorSource.addFeature(feature);

           // Add the vector layer to the map.
            map.addLayer(vectorLayer);
            map.addInteraction(modify);
    //var  poly = {'id':'1234124','coordinates':[[47,56]]}
        }

        //closest point


        var newCoords =[];
        var point = null;
        var line = null;
        var displaySnap = function() {
            map.on('pointermove', function(evt) {

                var divValue = $(".custom-mouse-position").text();
                var mouseCoords = (divValue.split(','));
                for(var i in mouseCoords){
                    mouseCoords[i] = parseInt(mouseCoords[i]);
                }
                var closestFeature = vectorSource.getClosestFeatureToCoordinate(mouseCoords);
                var closestPoint = closestFeature.getGeometry().getClosestPoint(mouseCoords);
                point = new ol.geom.Point(closestPoint);
                point.setCoordinates(closestPoint);
                line = new ol.geom.LineString([mouseCoords, closestPoint]);
                line.setCoordinates([mouseCoords, closestPoint]);
                map.render();
                //newCoords.push(mouseCoords);
                //newCoords.push(closestPoint)
            });


            //var newPolygon = new ol.geom.Polygon(newCoords);
            //console.log();

        };

        vectorSource.forEachFeature(function(feature){
            var featCoords = feature.getGeometry().getCoordinates();
            console.log(feature)
        });

        map.on('pointermove', function(evt) {
            if (evt.dragging) {
                return;
            }
            var coordinate = map.getEventCoordinate(evt.originalEvent);
            displaySnap(coordinate);
        });

        map.on('click', function(evt) {
            displaySnap(evt.coordinate);
        });

        var imageStyle = new ol.style.Circle({
            radius: 10,
            fill: null,
            stroke: new ol.style.Stroke({
                color: 'rgba(255,255,0,0.9)',
                width: 3
            })
        });
        var strokeStyle = new ol.style.Stroke({
            color: 'rgba(255,255,0,0.9)',
            width: 3
        });
        map.on('postcompose', function(evt) {
            var vectorContext = evt.vectorContext;
            if (point !== null) {
                vectorContext.setImageStyle(imageStyle);
                vectorContext.drawPointGeometry(point);
            }
            if (line !== null) {
                vectorContext.setFillStrokeStyle(null, strokeStyle);
                vectorContext.drawLineStringGeometry(line);
                modify.setActive(line);
            }
        });

        map.on('pointermove', function(evt) {
            if (evt.dragging) {
                return;
            }
            var pixel = map.getEventPixel(evt.originalEvent);
            var hit = map.hasFeatureAtPixel(pixel);
            if (hit) {
                map.getTarget().style.cursor = 'pointer';
            } else {
                map.getTarget().style.cursor = '';

            }
        });
    });



});
/*
 // a normal select interaction to handle click
 var select = new ol.interaction.Select();
 var select = new ol.interaction.Select();
 map.addInteraction(select);


saving polygons after modifying
 button add
 button modify drawn
 drawing inside polygon is not allowed
 modifying savedPolygon
 http://vasir.net/blog/openlayers/openlayers-tutorial-part-3-controls
 http://openlayersbook.github.io/ch11-creating-web-map-apps/example-05.html
 randomize ids with math.rand


 Ok...I answer my own question. I basically needed:
 1.- Create a panel to add buttons in it
 var panel = new OpenLayers.Control.Panel({defaultControl: btnHiLite});
 2.- Add the button to the panel
 panel.addControls([btnHiLite]);
 3.- Add the panel to the map
 map = new OpenLayers.Map( 'map', {
 controls: [
 new OpenLayers.Control.PanZoom(),
 panel]
 });



;*/

