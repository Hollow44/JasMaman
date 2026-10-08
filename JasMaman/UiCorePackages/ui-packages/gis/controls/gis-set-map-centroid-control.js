app.SetMapCentroidControl = function (opt_options) {
    var options = opt_options || {};

    var that = this;
    var coordTypes = {
        degree: 'degree',
        meter: 'meter'
    };
    var $button = $("<button type='button' class='gis-button btn-set-view-by-centroid'>")
        .attr("title", "Перейти по координатам");
    $button.addClass('gis-set-centroid-control-not-highlighted');

    var $element = $('<div>');
    $element.addClass('gis-set-map-centroid-control ol-unselectable ol-control');
    $element.append($button);
    
    var $selectCoordType = $("<select class='gis-coord-type-select'><option value='{0}' selected>Долгота/Широта</option><option value='{1}'>X/Y</option></select>".format(coordTypes.degree, coordTypes.meter));
    var $coordTypePanel = $('<div>');
    $coordTypePanel.append('<div style="float:left;padding-right:3px;margin-top:5px;">Измерение:</div>');
    $coordTypePanel.append($selectCoordType);
    var $panel = $("<div class='gis-set-coordinate-panel'>");
    var $inputLong = $("<input type='text'placeholder='{0}'>".format("Долгота")); //x - 71
    $inputLong.addClass('gis-coordinate-input');
    var $inputLat = $("<input type='text' placeholder='{0}'>".format("Широта")); //y - 51
    $inputLat.addClass('gis-coordinate-input');
    var $buttonSearch = $('<button type="button" style="width: 215px;">');
    $buttonSearch.text('Перейти');
    $panel.append($coordTypePanel);
    $panel.append($inputLong);
    $panel.append($inputLat);
    $panel.append($buttonSearch);

    $selectCoordType.on('change', function() {
        $inputLong.val('');
        $inputLat.val('');
    });

    var layerVector = new ol.layer.Vector({
        source: new ol.source.Vector({
                projection: gisLayers.defaultSrsName,
            }),
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
    

    $buttonSearch.click(function() {
        var map = that.getMap();
        var $longitude = parseFloat($inputLong.val());
        var $lattitude = parseFloat($inputLat.val());
        if (isNaN($longitude)  || isNaN($lattitude)) {
            alert('Не правильные значения');
            return;
        }
        var coords = [];
        if ($selectCoordType.val() === coordTypes.degree) {
            coords = ol.proj.transform([$longitude, $lattitude], 'EPSG:4326', gisLayers.defaultSrsName);
        }
        if ($selectCoordType.val() === coordTypes.meter) {
            coords = [$longitude, $lattitude];
        }
        map.getView().setCenter(coords);
        var source = layerVector.getSource();
        source.clear();
        var geom = new ol.geom.Point(coords);
        var feature = new ol.Feature(geom);
        source.addFeatures([feature]);
        map.getView().setZoom(10);
        map.refreshLayers();
    });
    var isClick = function() {
        var classes = $button.attr("class").split(' ');
        return classes.indexOf('gis-set-centroid-control-highlight')>-1;
    };
    var isNotClicked = function () {
        var classes = $button.attr("class").split(' ');
        return classes.indexOf('gis-set-centroid-control-not-highlighted') > -1;
    };

    $button.click(function() {
        var map = that.getMap();
        if (isNotClicked()) {
            $button.removeClass("gis-set-centroid-control-not-highlighted");
            map.addLayer(layerVector);
            $button.addClass("gis-set-centroid-control-highlight");
            $button.css('background-color', 'red');
            $element.after($panel);
            $panel.show();
        } else {
            map.removeLayer(layerVector);
            that.onControlsDeactivate(that);
        }
    });


    this.onControlsDeactivate = function(sender) {
        $button.removeClass("gis-set-centroid-control-highlight");
        $button.css('background-color', '');
        $button.addClass("gis-set-centroid-control-not-highlighted");
        
        $panel.hide();
    };

    ol.control.Control.call(this, {
        element: $element[0],
        target: options.target
    });
};
ol.inherits(app.SetMapCentroidControl, ol.control.Control);