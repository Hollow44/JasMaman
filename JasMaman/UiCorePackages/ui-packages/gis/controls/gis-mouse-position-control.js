app.MousePositionControl = function (mapDiv) {

    var mousePositionControl = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.createStringXY(4),
        projection: gisLayers.defaultSrsName,
        className: 'mouse-position',
        target: mapDiv
    });
    return mousePositionControl;
}