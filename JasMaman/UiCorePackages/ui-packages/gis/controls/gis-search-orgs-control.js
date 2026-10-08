app.SearchOrgsControl = function (opt_options) {
    var options = opt_options || {};
    var searchUrl = options.searchOrgsUrl;

    var $button = $("<button type='button' class='gis-button btn-search-orgs'>")
        .attr("title", "Поиск организаций на карте");
    $button.text('SO');

    var vector = new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(0,0,255,0.3)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'blue',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#ffcc33'
                    })
                })
            })
        });

    var that = this;
    var $element = $('<div>');
    $element.addClass('gis-search-orgs-control ol-unselectable ol-control');
    $element.append($button);

    var $searchPanel = $("<div class='gis-search-orgs-panel gis-search-panel'>");
    var $searchPanelHeader = $("<table class='gis-search-panel-header-table'><tr><td class='gis-title-text-td'>Поиск организаций</td><td class='gis-close-td'>X</td></tr></table>");
    
    var $searchInput = $("<input type='text' placeholder='{0}'>".format("БИН или Наименование организации"));
    var $searchBtn = $("<button type='button'>");
    $searchBtn.text("Поиск");
    var $searchResult = $("<div class='gis-search-result-panel'>");
    
    $searchResult.append("<span class='gis-search-result-msg'>Выполните поиск</span>");

    var $searchPanelMarkupTable = $("<table class='gis-search-panel-markup-table'><tr><td class='search-tools-td'></td></tr><tr><td class='search-result-td'></td></tr></table>");
    var $searchToolsTd = $searchPanelMarkupTable.find(".search-tools-td");

    $searchToolsTd.append($searchPanelHeader);
    $searchToolsTd.append($searchInput);
    $searchToolsTd.append($searchBtn);
    var $searchResultTd = $searchPanelMarkupTable.find(".search-result-td");

    $searchResultTd.append($searchResult);
    
    $searchPanel.append($searchPanelMarkupTable);

    $searchBtn.click(function () {
        $.ajax({
            url: searchUrl,
            data: {
                flQuery: $searchInput.val(),
            },
            type: "POST",
            dataType: "json",
            success: function(result) {
                $searchResult.empty();
                if(result.length == 0) {
                    $searchResult.append("<span class='gis-search-result-msg'>По вашему запросу записей не найдено</span>");
                } else {
                    for(var i=0;i<result.length;i++) {
                        var curItem = result[i];
                        var $item = $("<div class='gis-search-result-item'>");
                        $item.attr("feature-Id", curItem.FeatureId);
                        $item.text(curItem.FeatureText);
                        $searchResult.append($item);
                    }
                }
            },
            error: function() {
                $searchResult.empty();
                $searchResult.append("<span class='gis-search-result-msg'>Не удалось выполнить поиск (ошибка)</span>");
            }
        });
    });

    $searchResult.delegate(".gis-search-result-item", "click", function() {
        $searchResult.find(".gis-search-result-item").removeClass("selected");
        var $selectedItem = $(this);
        $selectedItem.addClass("selected");
        
        //---------------------------
        var featureId = $(this).attr("feature-id");
        $.ajax({
            url: gisLayers.mapWmsUrl,
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
                cql_filter: "{0}={1}".format(gisLayers.buildsIdField, featureId)
            },
            success: function (response) {
                var geojsonFormat = new ol.format.GeoJSON();
                var features = geojsonFormat.readFeatures(response);
                vector.getSource().clear();
                vector.getSource().addFeatures(features);

                if (features.length > 0) {
                    var extent = features[0].getGeometry().getExtent();
                    var map = that.getMap();
                    map.getView().fitExtent(extent, map.getSize());
                    map.getView().setZoom(17);
                    map.render();
                } else {
                    alert('Привязанный объект на карте не найден (возможно, он исключен из слоя)');
                }
            }
        });
    });

    $searchPanelHeader.find(".gis-close-td").click(function() {
        $searchPanel.hide();
        that.getMap().removeLayer(vector);
    });

    $button.click(function() {
        that.getMap().deactivateControls(that);
        $element.after($searchPanel);
        $searchPanel.show();
        that.getMap().removeLayer(vector);
        that.getMap().addLayer(vector);
        that._inited = true;
    });

    this.onControlsDeactivate = function(sender) {
        if (sender == that) {
            return;
        }
        if(that._inited != true) {
            return;
        }
        $searchPanel.hide();
        that.getMap().removeLayer(vector);
    };

    ol.control.Control.call(this, {
        element: $element[0],
        target: options.target
    });
};
ol.inherits(app.SearchOrgsControl, ol.control.Control);