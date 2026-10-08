var isDeveloper = true;

app.IdentifyControl = function (opt_options) {
    var options = opt_options || {};

    this.mapWmsUrl = options.mapWmsUrl;
    this.identifyOrgsUrl = options.identifyOrgsUrl;
   
    var $container = $("<div class='gis-ol-popup'>");
    $container.append('<a href="#" id="popup-closer" class="gis-ol-popup-closer"></a><div id="popup-content"></div>');
    var $closer2 = $container.find('#popup-closer');
    $closer2[0].onclick = function () {
        popupOverlay.setPosition(undefined);
        $container.hide();
        $closer2.blur();
        return false;
    };

    var $content = $container.find('#popup-content');
    var simpleTooltipElement = document.createElement('div');
    var popupOverlay = new ol.Overlay(({
        element: simpleTooltipElement,
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    }));

    var $btnIdentify = $("<button type='button'>");
    $btnIdentify.addClass('gis-button btn-gis-identify');
    $btnIdentify.attr("title", "Атрибуты объекта");
    var that = this;


    var identify = {
        init: function (map) {
            this.map = map;
            this.map.addOverlay(popupOverlay);
        },
        setActive: function (active) {
            if (active == true) {
                this.map.on("singleclick", this.onSingleClick);
            } else {
                this.map.un("singleclick", this.onSingleClick);
            }
        },
        onSingleClick: function(e) {
            var map = e.map;
            var coord = map.getCoordinateFromPixel(e.pixel);
            if (simpleTooltipElement.style.visibility == 'visible') {
                simpleTooltipElement.style.visibility = 'hidden';
            }
            
            $.ajax({
                url: that.mapWmsUrl,
                jsonp: false,
                jsonpCallback: 'getGeomFromPointCallback',
                type: 'GET',
                dataType: 'jsonp',
                data: {
                    service: "WFS",
                    version: "1.1.0",
                    request: "GetFeature",
                    typename: gisLayers.builds,
                    srsname: gisLayers.defaultSrsName,
                    outputFormat: "text/javascript",
                    format_options: "callback:getGeomFromPointCallback",
                    cql_filter: "INTERSECTS(geom,POINT(" + coord[0] + " " + coord[1] + "))"
                },
                success: function(response) {
                    var geojsonFormat = new ol.format.GeoJSON();
                    var features = geojsonFormat.readFeatures(response);
                    
                    if (features.length == 0) {
                        popupOverlay.setPosition(undefined);
                        return;
                    }
                    
                    var featureId = features[0].getProperties()["id"];

                    $.ajax({
                        url: that.identifyOrgsUrl,
                        data: {
                            FeatureId: featureId,
                        },
                        type: "POST",
                        dataType: "json",
                        success: function(result) {
                            $content.empty();
                            if (result.StatusCode != "OK") {
                                alert("Ошибка: " +result.StatusText);
                                popupOverlay.setPosition(undefined);
                                return;
                            }
                            var $container2 = $("<div class='gis-identify-wrapper'>");
                            $container2.append("<div class='gis-identify-label'>{0}</div>".format("Адрес"));
                            $container2.append("<div class='gis-identify-data'>{0}</div>".format(result.Address));
                            if (result.Rca) {
                                $container2.append("<div class='gis-identify-label'>{0}</div>".format("Код РКА"));
                                $container2.append("<div class='gis-identify-data'>{0}</div>".format(result.Rca));
                            }
                            var orgs = result.Organizations;
                            if (orgs && (result.Organizations.length > 0)) {
                                $container2.append("<div class='gis-identify-label'>{0}</div>".format("Организации"));
                                var $orgsContainer = $("<div class='gis-orgs-container'>");
                                for (var i = 0; i < orgs.length; i++) {
                                    $orgsContainer.append("<div class='gis-identify-data org-data'><a href='{0}' target='_blank'>{1}</a></div>".format(orgs[i].Url, orgs[i].OrgName));
                                }
                                $container2.append($orgsContainer);
                            }
                            $content.append($container2);
                            popupOverlay.setElement($container);
                            popupOverlay.setPosition(coord);
                            $container.show();

                        },
                        error: function(err) {
                            popupOverlay.setPosition(undefined);
                            alert(err);
                        }
                    });
                },
                error: function(resp) {
                    alert(resp);
                }
            });
        },
    };


    $btnIdentify.click(function () {
        var map = that.getMap();
        map.deactivateControls(that);
        
        identify.init(map);
        identify.setActive(true);
        that._inited = true;
    });


    var $element = $('<div>');
    $element.addClass('btn-gis-identify ol-selectable ol-control');
    $element.append($btnIdentify);

    this.onControlsDeactivate = function (sender) {
        if (sender == that) {
            return;
        }
        if (that._inited != true) {
            return;
        }
        
        popupOverlay.setPosition(undefined);
        $container.hide();
        $closer2.blur();
        
        identify.setActive(false);
        that.getMap().removeOverlay(popupOverlay);
        that._inited = false;
    };

    ol.control.Control.call(this, {
        element: $element[0],
        target: options.target
    });
};
ol.inherits(app.IdentifyControl, ol.control.Control);