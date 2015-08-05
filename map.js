$(document).ready(function() {

    var raster = new ol.layer.Tile({
        source: new ol.source.MapQuest({layer: 'osm'})
    });

    var source = new ol.source.Vector();

    var vector = new ol.layer.Vector({
        source: source,
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


    /**
     * Currently drawn feature.
     * @type {ol.Feature}
     */
    var sketch;


    /**
     * The help tooltip element.
     * @type {Element}
     */
    var helpTooltipElement;


    /**
     * Overlay to show the help messages.
     * @type {ol.Overlay}
     */
    var helpTooltip;


    /**
     * The measure tooltip element.
     * @type {Element}
     */
    var measureTooltipElement;


    /**
     * Overlay to show the measurement.
     * @type {ol.Overlay}
     */
    var measureTooltip;


    /**
     * Message to show when the user is drawing a polygon.
     * @type {string}
     */
    var continuePolygonMsg = 'Click to continue drawing the polygon';


    /**
     * Message to show when the user is drawing a line.
     * @type {string}
     */
    var continueLineMsg = 'Click to continue drawing the line';


    /**
     * Handle pointer move.
     * @param {ol.MapBrowserEvent} evt
     */

    var pointerMoveHandler = function (evt) {
        if (evt.dragging) {
            return;
        }
        /** @type {string} */
        var helpMsg = 'Click to start drawing';
        /** @type {ol.Coordinate|undefined} */
        var tooltipCoord = evt.coordinate;

        if (sketch) {
            var output;
            var geom = (sketch.getGeometry());
            if (geom instanceof ol.geom.Polygon) {
                output = formatArea(/** @type {ol.geom.Polygon} */ (geom));
                helpMsg = continuePolygonMsg;
                tooltipCoord = geom.getInteriorPoint().getCoordinates();
            } else if (geom instanceof ol.geom.LineString) {
                output = formatLength(/** @type {ol.geom.LineString} */ (geom));
                helpMsg = continueLineMsg;
                tooltipCoord = geom.getLastCoordinate();
            }
            measureTooltipElement.innerHTML = output;
            measureTooltip.setPosition(tooltipCoord);
        }

        helpTooltipElement.innerHTML = helpMsg;
        helpTooltip.setPosition(evt.coordinate);
    };



    var select = new ol.interaction.Select({
        wrapX: false
    });

    var modify = new ol.interaction.Modify({
        features: select.getFeatures()
    });

    var map = new ol.Map({
        interactions: ol.interaction.defaults().extend([select, modify]),
        layers: [raster, vector],
        target: 'map',
        view: new ol.View({
           center: [ 5260050.233181125, -4009506.140626508],
            //cheb center: [5260000, 7585000],
            zoom: 14
        })
    });


    map.on('pointermove', pointerMoveHandler);

    function pointerClickHandler() {
        var sketch2 = sketch.clone();
        console.log(sketch.getGeometry().getCoordinates());
        sketch2.getGeometry().transform('EPSG:3857','EPSG:4326')
        var coordinates = sketch2.getGeometry().getCoordinates();
        var polygonName = $('#label-polygon').val();

        var data = {
            coordinates: coordinates,
            name : polygonName
        };
        $.post('coordinate-data.php', data, function(data){console.log(data)});
        delete sketch2;
    }

    var typeSelect = document.getElementById('type');

    var draw; // global so we can remove it later


    function addInteraction() {
        var type = (typeSelect.value == 'area' ? 'Polygon' : 'LineString');
        draw = new ol.interaction.Draw({
            source: source,
            type: /** @type {ol.geom.GeometryType} */ (type),
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    lineDash: [10, 10],
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 0.7)'
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    })
                })
            })
        });
        map.addInteraction(draw);
        createMeasureTooltip();

        createHelpTooltip();
        draw.on('drawstart',
            function (evt) {
                // set sketch
                sketch = evt.feature;
            }, this);

        draw.on('drawend',
            function (evt) {
                measureTooltipElement.className = 'tooltip tooltip-static';
                measureTooltip.setOffset([0, -7]);
                pointerClickHandler();
                // unset sketch
                sketch = null;
                // unset tooltip so that a new one can be created
                measureTooltipElement = null;
                createMeasureTooltip();
            }, this);
            }

    /**
     * Creates a new help tooltip
     */
    function createHelpTooltip() {
        if (helpTooltipElement) {
            helpTooltipElement.parentNode.removeChild(helpTooltipElement);
        }
        helpTooltipElement = document.createElement('div');
        helpTooltipElement.className = 'tooltip';
        helpTooltip = new ol.Overlay({
            element: helpTooltipElement,
            offset: [15, 0],
            positioning: 'center-left'
        });
        map.addOverlay(helpTooltip);
    }


    /**
     * Creates a new measure tooltip
     */
    function createMeasureTooltip() {
        if (measureTooltipElement) {
            measureTooltipElement.parentNode.removeChild(measureTooltipElement);
        }
        measureTooltipElement = document.createElement('div');
        measureTooltipElement.className = 'tooltip tooltip-measure';
        measureTooltip = new ol.Overlay({
            element: measureTooltipElement,
            offset: [0, -15],
            positioning: 'bottom-center'
        });
        map.addOverlay(measureTooltip);
    }


    /**
     * Let user change the geometry type.
     * @param {Event} e Change event.
     */
    typeSelect.onchange = function (e) {
        map.removeInteraction(draw);
        addInteraction();
    };


    /**
     * format length output
     * @param {ol.geom.LineString} line
     * @return {string}
     */
    var polygonLabel = document.getElementById('label-polygon').value;

    var formatLength = function (line) {
        var polygonLabel = document.getElementById('label-polygon').value;
        var length = Math.round(line.getLength() * 100) / 100;
        var output;
        if (length > 100) {
            output = (Math.round(length / 1000 * 100) / 100) +
                ' ' + 'km' + '<br>' + polygonLabel;
        } else {
            output = (Math.round(length * 100) / 100) +
                ' ' + 'm' + '<br>' + polygonLabel;
        }
        return output;
    };

    /**
     * format length output
     * @param {ol.geom.Polygon} polygon
     * @return {string}
     */


    var formatArea = function (polygon) {
        var polygonLabel = document.getElementById('label-polygon').value;
        var area = polygon.getArea();
        var output;
        if (area > 10000) {
            output = (Math.round(area / 1000000 * 100) / 100) +
                ' ' + 'km<sup>2</sup>' + '<br>' + polygonLabel;
        } else {
            output = (Math.round(area * 100) / 100) +
                ' ' + 'm<sup>2</sup>' + '<br>' + polygonLabel;
        }
        return output;
    };

    addInteraction();

    $.get('coordinate-data.php', function(data){
        coordsObjs = JSON.parse(data);
        for (var i in coordsObjs) {
            //console.log(coordsObjs[i]['coordinates'][0]);
            var savedPolygon = new ol.geom.Polygon(coordsObjs[i]['coordinates']);
            var sphericalCoords = savedPolygon.transform('EPSG:4326', 'EPSG:3857');

            var savedCoordinates = sphericalCoords.getCoordinates();
            console.log(savedCoordinates);
            savedPolygon.setCoordinates(savedCoordinates);

            var savedPolygon = new ol.geom.Polygon(savedCoordinates);
            // Create feature with polygon.
            var feature = new ol.Feature(savedPolygon);

            // Create vector source and the feature to it.
            var vectorSource = new ol.source.Vector();

            vectorSource.addFeature(feature);
            // Create vector layer attached to the vector source.
            var vectorLayer = new ol.layer.Vector({
                source: vectorSource,
                type: /** @type {ol.geom.GeometryType} */ (type),
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

            // Add the vector layer to the map.
            map.addLayer(vectorLayer);
        };


    })

    /*
    *0: 5259952.226857311 1: 7587049.467820894
    *0: 5259952.226857311 1: -4009540.4461652297
     */

map.addInteraction
});
