app.MeasureAreaControl = function (opt_options) {
    var options = opt_options || {};

    var $btnMeasureArea = $("<button type='button'>");
    $btnMeasureArea.attr("title", "Измерить площадь");
    $btnMeasureArea.addClass('gis-button btn-gis-measure-area');


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

    var $container = $("<div class='gis-measure-info-popup'>");
    var $closer = $("<a href='#' class='gis-ol-measure-info-closer'>");
    $closer.attr('title', "Нажмите чтобы удалить последнюю точку");
    $closer.click(function () {
        var sketchGeometry = sketch.getGeometry();
        var coordsArr = sketchGeometry.getCoordinates();
        if (coordsArr[0].length <= 4) {
            return;
        }
        coordsArr[0].splice(coordsArr[0].length - 2, 1);
        sketchGeometry.setCoordinates(coordsArr);
        var output = formatArea(sketchGeometry);
        $measureInfo.empty();
        $measureInfo.append(output);
        measureTooltipOverlay.setElement($container);
        measureTooltipOverlay.setPosition(coordsArr[coordsArr[0].length - 2]);
        setCloseButtonVisibility(sketchGeometry);
    });
    $container.append($closer);
    var $measureInfo = $("<div class='gis-measure-info'>");
    $container.append($measureInfo);

    var formatArea = function (polygon) {
        var area = polygon.getArea();

        var output;
        if (area > 10000) {
            output = (Math.round(area / 1000000 * 100) / 100) +
						' ' + 'км<sup>2</sup>';
        } else {
            output = (Math.round(area * 100) / 100) +
				' ' + 'м<sup>2</sup>';
        }
        return output;
    };

    var setCloseButtonVisibility = function (sketchGeometry) {
        if (sketchGeometry.getCoordinates()[0].length > 4) {
            $closer.show();
        } else {
            $closer.hide();
        }
    };

    var draw = new ol.interaction.Draw({
        source: measureLayer.getSource(),
        type: ('Polygon'),
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
            output = formatArea(geom);
            setCloseButtonVisibility(geom);
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


    var measureArea = {
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
                output = formatArea(geom);
                tooltipCoord = geom.getLastCoordinate();
                measureTooltipElement.innerHTML = output;
                measureTooltipOverlay.setPosition(tooltipCoord);
            }
        }
    };

    $btnMeasureArea.click(function () {

        var map = that.getMap();
        map.deactivateControls(that);
        if (that._inited != true) {
            measureArea.init(map);
            measureArea.setActive(true);
            that._inited = true;
        }
    });

    var $element = $('<div>');
    $element.addClass('btn-gis-measure-area ol-selectable ol-control');
    $element.append($btnMeasureArea);

    this.onControlsDeactivate = function (sender) {
        if (sender == that) {
            return;
        }
        if (that._inited != true) {
            return;
        }

        measureArea.setActive(false);

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
ol.inherits(app.MeasureAreaControl, ol.control.Control);