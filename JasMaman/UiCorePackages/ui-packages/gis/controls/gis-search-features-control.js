app.SearchFeaturesControl = function (opt_options) {
    var options = opt_options || {};
    var searchFeaturesUrl = options.searchFeaturesUrl;

    var $button = $("<button type='button' class='gis-button btn-search-by-addr'>")
        .attr("title", "Поиск по адресу");
    $button.text('S');

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
    $element.addClass('gis-search-feature-control ol-unselectable ol-control');
    $element.append($button);

    var $searchPanel = $("<div class='gis-search-panel'>");
    var $searchPanelHeader = $("<table class='gis-search-panel-header-table'><tr><td class='gis-title-text-td'>Поиск по адресу</td><td class='gis-close-td'>X</td></tr></table>");
    
    var $regionInput = $("<input type='text' placeholder='{0}'>".format("Населенный пункт"));
    var $massiveInput = $("<input type='text' placeholder='{0}'>".format("Массивы/микрорайоны"));
    var $searchStreetInput = $("<input type='text' placeholder='{0}'>".format("Наименование улицы"));
    var $searchBuildNumInput = $("<input type='text' placeholder='{0}'>".format("Номер дома"));
    var $searchRcaInput = $("<input type='text' placeholder='{0}'>".format("Код РКА"));
    var $searchBtn = $("<button type='button'>");
    $searchBtn.text("Поиск");
    var $searchResult = $("<div class='gis-search-result-panel'>");
    
    $searchResult.append("<span class='gis-search-result-msg'>Выполните поиск</span>");

    var $searchPanelMarkupTable = $("<table class='gis-search-panel-markup-table'><tr><td class='search-tools-td'></td></tr><tr><td class='search-result-td'></td></tr></table>");
    var $searchToolsTd = $searchPanelMarkupTable.find(".search-tools-td");

    $searchToolsTd.append($searchPanelHeader);
    $searchToolsTd.append($regionInput);
    $searchToolsTd.append($massiveInput);
    $searchToolsTd.append($searchStreetInput);
    $searchToolsTd.append($searchBuildNumInput);
    $searchToolsTd.append($searchRcaInput);
    $searchToolsTd.append($searchBtn);
    var $searchResultTd = $searchPanelMarkupTable.find(".search-result-td");

    $searchResultTd.append($searchResult);
    
    $searchPanel.append($searchPanelMarkupTable);

    var isInputValueNullOrEmpty = function(inputValue) {
        var isNull = (inputValue == null || inputValue == undefined || inputValue.trim() === '');
        return isNull;
    };

    $searchBtn.click(function () {
        $searchResult.empty();
        $searchResult.append("<div class='loading-data-element' style='display:block'>Загрузка данных...</div>");
        var isRegionValEmpty = isInputValueNullOrEmpty($regionInput.val());
        var isMassiveValEmpty = isInputValueNullOrEmpty($massiveInput.val());
        var isStreetValEmpty = isInputValueNullOrEmpty($searchStreetInput.val());
        var isBuildNumValEmpty = isInputValueNullOrEmpty($searchBuildNumInput.val());
        var isRcaValEmpty = isInputValueNullOrEmpty($searchRcaInput.val());
        
        if (isRegionValEmpty&&isMassiveValEmpty && isStreetValEmpty && isBuildNumValEmpty&&isRcaValEmpty) {
            $searchResult.empty();
            $searchResult.append("<span class='gis-search-result-msg'>Не удалось выполнить поиск, заполните данные</span>");
            return;
        }
        $.ajax({
            url: searchFeaturesUrl,
            data: {
                flRegion:$regionInput.val(),
                flMassive:$massiveInput.val(),
                flStreet: $searchStreetInput.val(),
                flBuildNum: $searchBuildNumInput.val(),
                flRca: $searchRcaInput.val(),
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
                        $item.attr("featureId", curItem.FeatureId);
                        $item.attr("geomWkt", curItem.GeomWkt);
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
        var wktConvert = new ol.format.WKT();
        var geom = wktConvert.readGeometry($selectedItem.attr("geomWkt"));
        var extent = geom.getExtent();
        vector.getSource().clear();
        vector.getSource().addFeatures([new ol.Feature({geometry: geom})]);
        var map = that.getMap();
        map.getView().fitExtent(extent, map.getSize());
        map.getView().setZoom(18);
        map.render();
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
ol.inherits(app.SearchFeaturesControl, ol.control.Control);