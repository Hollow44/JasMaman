app.MeasureLengthControl = function (opt_options) {
    var options = opt_options || {};

    var $btnMeasureLength = $("<button type='button'>");
    $btnMeasureLength.attr("title", "Измерить длину");
    $btnMeasureLength.addClass('gis-button btn-gis-measure-length');


    var sketch;
    var measureTooltipElement;
    var measureTooltipOverlay;
    var measureLayer;
    var that = this;

    measureLayer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ff5433',
                width: 4
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#ff5433'
                })
            })
        })
    });


    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'tooltip tooltip-measure';
    measureTooltipElement.id = 'tooltip-measure';

    measureTooltipOverlay = new ol.Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
    });

    var $container = $("<div id='gis-measure-length-info-popup' class='gis-measure-info-popup'>");
    var $closer = $("<a href='#' id='gis-ol-measure-info-closer' class='gis-ol-measure-info-closer'>");
    $closer.attr ('title',"Нажмите чтобы удалить последнюю точку");
    $closer.click(function() {
        var sketchGeometry = sketch.getGeometry();
        var coordsArr = sketchGeometry.getCoordinates();
        if (coordsArr.length <= 2) {
            return;
        }
        coordsArr.pop();
        sketchGeometry.setCoordinates(coordsArr);
        var output = formatLength(sketchGeometry);
        $measureInfo.empty();
        $measureInfo.append(output);
        measureTooltipOverlay.setElement($container);
        measureTooltipOverlay.setPosition(coordsArr[coordsArr.length - 1]);
        setCloseButtonVisibility(sketchGeometry);
    });
    $container.append($closer);
    var $measureInfo = $("<div class='gis-measure-info'>");
    $container.append($measureInfo);

    var formatLength = function (line) {
        var length = Math.round(line.getLength() * 100) / 100;

        var output;
        if (length > 100) {
            output = (Math.round(length / 1000 * 100) / 100) + ' км';
        } else {
            output = (Math.round(length * 100) / 100) + ' м';
        }
        return output;
    };

    var setCloseButtonVisibility = function (sketchGeometry) {
        if (sketchGeometry.getCoordinates().length > 2) {
            $closer.show();
        } else {
            $closer.hide();
        }
    };
    var draw = new ol.interaction.Draw({
        source: measureLayer.getSource(),
        type: ('LineString'),
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

    draw.on('drawstart', function (evt) {

        if (measureTooltipElement.style.visibility == 'hidden') {
            measureTooltipElement.style.visibility = 'visible';
        }
        $container.hide();
        measureTooltipOverlay.setElement(measureTooltipElement);
        measureTooltipOverlay.setPosition(undefined);
        var measureSource = measureLayer.getSource();
        measureSource.forEachFeature(function (feature) { measureSource.removeFeature(feature) });
        sketch = evt.feature;
    }, this);

    draw.on('drawend', function (evt) {

        var tooltipCoord = evt.coordinate;

        if (sketch) {
            var output;
            var geom = (sketch.getGeometry());
            setCloseButtonVisibility(geom);
            output = formatLength(geom);
            tooltipCoord = geom.getLastCoordinate();

            $container.show();
            if (measureTooltipElement.style.visibility == 'visible') {
                measureTooltipElement.style.visibility = 'hidden';
            }
            $measureInfo.empty();
            $measureInfo.append(output);
            measureTooltipOverlay.setElement($container);
            measureTooltipOverlay.setPosition(tooltipCoord);
        }

    }, this);


    var measureLength = {
        init: function (map) {
            this.map = map;
            this.map.addLayer(measureLayer);
            this.map.addOverlay(measureTooltipOverlay);
            measureTooltipOverlay.setPosition(undefined);
            this.map.addInteraction(draw);
        },
        setActive: function (active) {
            if (active) {
                this.map.on('pointermove', this.onPointerMove);
            } else {
                this.map.un('pointermove', this.onPointerMove);
            }
        },
        onPointerMove: function (evt) {
            if (evt.dragging) {
                return;
            }
            if (sketch) {
                var tooltipCoord = evt.coordinate;
                var output;
                var geom = (sketch.getGeometry());
                output = formatLength(geom);
                tooltipCoord = geom.getLastCoordinate();
                measureTooltipElement.innerHTML = output;
                measureTooltipOverlay.setPosition(tooltipCoord);
            }
        }
    };

    $btnMeasureLength.click(function () {

        var map = that.getMap();
        map.deactivateControls(that);
        if (that._inited != true) {
            measureLength.init(map);
            measureLength.setActive(true);
            that._inited = true;
        }
    });

    var $element = $('<div>');
    $element.addClass('btn-gis-measure-length ol-selectable ol-control');
    $element.append($btnMeasureLength);

    this.onControlsDeactivate = function (sender) {
        if (sender == that) {
            return;
        }
        if (that._inited != true) {
            return;
        }
        
        measureLength.setActive(false);
        measureTooltipElement.style.visibility = 'hidden';
        $container.hide();
        that.getMap().removeOverlay(measureTooltipOverlay);
        that.getMap().removeInteraction(draw);
        that._inited = false;
        var measureSource = measureLayer.getSource();
        measureSource.forEachFeature(function (feature) { measureSource.removeFeature(feature) });
    };

    ol.control.Control.call(this, {
        element: $element[0],
        target: options.target
    });
};
ol.inherits(app.MeasureLengthControl, ol.control.Control);