var isDeveloper = true;

app.IdentifyControl2 = function (opt_options) {
    var options = opt_options || {};

    this.mapWmsUrl = options.mapWmsUrl;
    this.identifyFeaturesUrl = options.identifyFeaturesUrl;
    this.currentOrderLayer = options.currentOrderLayer;
    this.cqu_filter = undefined;
    switch (this.currentOrderLayer) {
        case gisLayers.roads:
            this.featureType = "line";
            break;
        case gisLayers.builds:
        case gisLayers.settlements:
        case gisLayers.additionalMassives:
            this.featureType = "polygon";
            break;
    };
    if (this.featureType === "polygon") {
        this.cqu_filter = "INTERSECTS(geom,POINT({0} {1}))";
    }
    if (this.featureType === "line") {
        this.cqu_filter = "DWITHIN(geom,POINT({0} {1}), 10, meters)";
    }
    if (this.featureType === "point") {
        //this.cql_filter = "DWITHIN(geom,POINT({0} {1}), 10, meters)";
        //TODO: cqu_filter intersect for points
    }
    
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

    /*
    var $tabContainer = $('<div id="gis-identify-tabs-container">');
    $tabContainer.append('<ul class="gis-identify-tabs-menu">' +
        '<li class="current"><a href="#gis-identify-tab-1">Карта</a></li>' +
        '<li><a href="#gis-identify-tab-2">Адресный регистр</a></li>' +
        '</ul>');
    var $tabsMenu = $tabContainer.find('.gis-identify-tabs-menu a');
    $tabsMenu.click(function(event) {
        event.preventDefault();
        $(this).parent().addClass("current");
        $(this).parent().siblings().removeClass("current");
        var tab = $(this).attr("href");
        $(".gis-identify-tab-content").not(tab).css("display", "none");
        
        $(tab).fadeIn();
    });
    var $tabs = $('<div class="gis-identify-tab">');
    
    var $tabMapInfo = $('<div class="gis-identify-tab-content" id="gis-identify-tab-1">');
    var $tabAdrRegInfo = $('<div class="gis-identify-tab-content" id="gis-identify-tab-2">');
    
    $tabs.append($tabMapInfo);
    $tabs.append($tabAdrRegInfo);
    $tabContainer.append($tabs);
    */
    //$content.append($tabContainer);

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
                    typename: that.currentOrderLayer,
                    srsname: gisLayers.defaultSrsName,
                    outputFormat: "text/javascript",
                    format_options: "callback:getGeomFromPointCallback",
                    cql_filter: that.cqu_filter.format(coord[0], coord[1])
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
                        url: that.identifyFeaturesUrl,
                        data: {
                            FeatureId: featureId,
                            FeatureLayer: that.currentOrderLayer
                        },
                        type: "POST",
                        dataType: "json",
                        success: function(result) {

                            if (result.StatusCode === "ERROR") {
                                alert("Ошибка: " + result.StatusText);
                                popupOverlay.setPosition(undefined);
                                return;
                            }
                            if (result.StatusCode === "NULL") {
                                return;
                            }
                            if (result.StatusCode === "OK") {

                                $content.empty();
                                if (result.Rca) {
                                    $content.append("<div class='gis-identify-label'>{0}</div>".format("Код РКА"));
                                    $content.append("<div class='gis-identify-data'>{0}</div>".format(result.Rca));
                                }
                                if (result.LayerResultStr) {  
                                    $content.append("<div class='gis-identify-label'>{0}</div>".format("Карта"));
                                    $content.append("<div class='gis-identify-data'>{0}</div>".format(result.LayerResultStr));
                                }
                                if (result.AddressRegistryResultStr) { 
                                    $content.append("<div class='gis-identify-label'>{0}</div>".format("Адресный регистр"));
                                    $content.append("<div class='gis-identify-data'>{0}</div>".format(result.AddressRegistryResultStr));
                                }
                                /*
                                $tabMapInfo.empty();
                                $tabAdrRegInfo.empty();
                                $tabMapInfo.append("<div class='gis-identify-label'>{0}</div>".format("Регион"));
                                $tabMapInfo.append("<div class='gis-identify-data'>{0}</div>".format(result.LayerResult.FeatureRegion));
                                $tabMapInfo.append("<div class='gis-identify-label'>{0}</div>".format("Район"));
                                $tabMapInfo.append("<div class='gis-identify-data'>{0}</div>".format(result.LayerResult.FeatureDistrict));


                                if (result.LayerResult.AddtionalInfo) {
                                    $.each(result.LayerResult.AddtionalInfo, function(k, v) {
                                        $tabMapInfo.append("<div class='gis-identify-label'>{0}</div>".format(k));
                                        $tabMapInfo.append("<div class='gis-identify-data'>{0}</div>".format(v));
                                    });
                                }

                                if (result.AddressRegistryResult && result.AddressRegistryResult.Info) {
                                    $.each(result.AddressRegistryResult.Info, function(k, v) {
                                        $tabAdrRegInfo.append("<div class='gis-identify-label'>{0}</div>".format(k));
                                        $tabAdrRegInfo.append("<div class='gis-identify-data'>{0}</div>".format(v));
                                    });
                                }
                                */
                                popupOverlay.setElement($container);
                                $container.show();
                                //$tabs.tabs();
                                popupOverlay.setPosition(coord);
                            }
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
        popupOverlay.setElement(simpleTooltipElement);
        $closer2.blur();
        $container.hide();
        identify.setActive(false);
        that.getMap().removeOverlay(popupOverlay);
        
        that._inited = false;
    };

    ol.control.Control.call(this, {
        element: $element[0],
        target: options.target
    });
};
ol.inherits(app.IdentifyControl2, ol.control.Control);
