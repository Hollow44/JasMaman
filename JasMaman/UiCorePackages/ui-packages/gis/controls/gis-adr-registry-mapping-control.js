app.AdrRegistryMappingControl = function (opt_options) {
    var options = opt_options || {};
    var loadAdrRegistryTreeUrl = options.loadAdrRegistryTreeUrl;
    var loadArBindedBuildsUrl = options.loadArBindedBuildsUrl;
    var saveArBindingBuildUrl = options.saveArBindingBuildUrl;
    var baseLayer = options.baseLayer;

    var mappedItems = null;

    var $button = $("<button type='button' class='gis-button btn-ar-tree'>")
        .attr("title", "Адресный регистр");
    $button.text('AR');

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
    $element.addClass('gis-adr-registry-mapping-control ol-unselectable ol-control');
    $element.append($button);

    var $treeWrapper = $("<div class='gis-adr-registry-tree-wrapper'>");

    var $treeMarkupTable = $(
        "<table class='gis-ar-tree-markup-table'>" +
            "<tr><td class='ar-tree-header-td'></td></tr>" +
            "<tr><td class='ar-tree-legend-td'></td></tr>" +
            "<tr><td class='ar-tree-td'></td></tr>" +
        "</table>");
    $treeWrapper.append($treeMarkupTable);

    var $treeHeaderTd = $treeMarkupTable.find(".ar-tree-header-td");
    var $treeLegendTd = $treeMarkupTable.find(".ar-tree-legend-td");
    var $treeTd = $treeMarkupTable.find(".ar-tree-td");

    var $treeHeader = $("<table class='gis-ar-tree-header-table'><tr><td class='gis-title-text-td'>Адресный регистр</td><td class='gis-close-td'>X</td></tr></table>");
    $treeHeaderTd.append($treeHeader);

    var $treeLegend = $("<div>" +
        "<span class='ar-item-legend binded'>&nbsp</span><span class='ar-item-legend-text'> - привязан к карте</span>" +
        "<span class='ar-item-legend unbinded'>&nbsp</span><span class='ar-item-legend-text'> - не привязан к карте</span>" +
        "</div>");
    $treeLegendTd.append($treeLegend);

    var $tree = $("<div class='gis-adr-registry-tree'>");
    $treeTd.append($tree);
    var dataUrl = loadAdrRegistryTreeUrl;

    var getElementDataUrl = function (parentId, typeId) {
        return (dataUrl + "?flId=" + parentId + "&flTypeId=" + typeId);
    };

    var loadChildsIfNeed = function (container, itemId, typeId) {
        var $container = $(container);
        if (container.ChildsLoaded)
            return;

        if (container.ChildsLoading)
            return;
        container.ChildsLoading = true;

        var dataLoadingDivHtml = "<div class='loading-data-element' style='display:block'>Загрузка данных...</div>";
        $container.html(dataLoadingDivHtml);

        $.getJSON(getElementDataUrl(itemId, typeId), function (items) {
            container.ChildsLoading = false;
            container.ChildsLoaded = true;

            var html = "";
            jQuery.each(items, function (index, arItem) {
                var rcaAttr = "";
                var rcaMapBtn = "";
                var moveToObjectBtn = "";
                if (arItem.flRca && arItem.flRca > 0) {
                    rcaAttr = "ar-rca='{0}'".format(arItem.flRca);

                    var mapExistsClass = "";
                    if (mappedItems[arItem.flRca]) {
                        rcaAttr += " feature-id='{0}'".format(mappedItems[arItem.flRca].FeatureId);

                        mapExistsClass = "gis-ra-mapped";
                    }

                    rcaMapBtn = "<span ar-rca='{0}' class='gis-adr-reg-mapping-btn {1}' title='Привязать к карте'>&</span>".format(arItem.flRca, mapExistsClass);
                }

                html += "<div class='ar-item ar-collapsed' ar-id='{0}' ar-type='{1}' {4}><span class='ar-item-text' {4}>{2}: {3}</span>{5}<div class='ar-item-childs'></div></div>".format(arItem.flId, arItem.flTypeId, arItem.flText, arItem.flType, rcaAttr, rcaMapBtn);

            });
            $container.html(html);
        }).fail(function () {
            container.ChildsLoading = false;
            var loadFailedDivHtml = "<div class='load-data-failed' style='display:block'>Не удалось загрузить данные...</div>";
            $container.html(loadFailedDivHtml);
        });
    };

    $.ajax({
        url: loadArBindedBuildsUrl,
        type: 'GET',
        dataType: 'json',
        success: function (result) {
            mappedItems = result;

            //astanaArId = 106724;
            var kzArId = 1;
            // load root element
            loadChildsIfNeed($tree[0], kzArId, "ATS");


        },
        error: function (a, b, c) {
            alert("Ошибка загрузки адресного регистра");
        }
    });
    var $curEnabledItemBtn = null;
    function tryResetCurBindingBtnState() {
        if ($curEnabledItemBtn != null) {
            $curEnabledItemBtn.removeClass("selected");
            $curEnabledItemBtn.parent().removeClass("mapping-mode-enabled");
        }
        $curEnabledItemBtn = null;
    }

    $treeHeader.find(".gis-close-td").click(function () {
        $treeWrapper.hide();
        that.getMap().removeLayer(vector);
    });

    $tree.delegate(".ar-item-text", "click", function () {
        vector.getSource().clear();
        var $item = $(this).parent();
        if ($item.hasClass("ar-expanded")) {
            $item.removeClass("ar-expanded");
            $item.addClass("ar-collapsed");
        } else {
            $item.addClass("ar-expanded");
            $item.removeClass("ar-collapsed");
            var container = $item.find(".ar-item-childs")[0];
            if (container == undefined) {
                return;
            }

            var id = $item.attr("ar-id");
            var typeId = $item.attr("ar-type");
            if (id != undefined && typeId != undefined && typeId != "BUILD") {
                loadChildsIfNeed(container, id, typeId);
            }
        }
    });

    var baseLayerActive = function () {
        if (!baseLayer)
            return (true);
        return (baseLayer.getVisible() == true);
    };

    $tree.delegate(".ar-item-text[feature-id]", "click", function () {
        tryResetCurBindingBtnState();
        var featureId = $(this).attr("feature-id");
        $.ajax({
            url: gisLayers.mapWmsUrl,
            jsonp: false,
            jsonpCallback: 'getGeomFromPointCallback',
            type: 'GET',
            /*async: false,*/
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
                }
            }
        });
    });

    $tree.delegate(".gis-adr-reg-mapping-btn", "click", function () {
        if (!baseLayerActive()) {
            alert("Для привязки выберите слой схем");
            return;
        }

        tryResetCurBindingBtnState();

        $curEnabledItemBtn = $(this);
        $curEnabledItemBtn.addClass("selected");
        $curEnabledItemBtn.parent().addClass("mapping-mode-enabled");
    });

    baseLayer.on("change:visible", function () {
        if ((baseLayer.getVisible() == false) && ($curEnabledItemBtn != null)) {
            tryResetCurBindingBtnState();
        }
    });


    var onMapSingleClick = function (e) {
        if ($curEnabledItemBtn == null)
            return;
        var curRca = $curEnabledItemBtn.attr("ar-rca");
        var coord = e.map.getCoordinateFromPixel(e.pixel);
        $.ajax({
            url: gisLayers.mapWmsUrl,
            jsonp: false,
            jsonpCallback: 'getGeomFromPointCallback',
            type: 'GET',
            /*async: false,*/
            dataType: 'jsonp',
            data: {
                service: "WFS",
                version: "1.1.0",
                request: "GetFeature",
                typename: gisLayers.builds,
                srsname: gisLayers.defaultSrsName,
                outputFormat: "text/javascript",
                format_options: "callback:getGeomFromPointCallback",
                cql_filter: "INTERSECTS(geom,POINT({0} {1}))".format(coord[0], coord[1])
            },
            success: function (response) {
                if ($curEnabledItemBtn == null) {
                    return;
                }
                if ($curEnabledItemBtn.attr("ar-rca") != curRca) {
                    return;
                }

                var $mappedItemBtn = $curEnabledItemBtn;

                var geojsonFormat = new ol.format.GeoJSON();
                var features = geojsonFormat.readFeatures(response);
                if (features.length > 0) {
                    var featureId = features[0].get(gisLayers.buildsIdField);
                    $.ajax({
                        url: saveArBindingBuildUrl,
                        data: {
                            FeatureId: featureId,
                            Rca: curRca
                        },
                        type: "POST",
                        dataType: "json",
                        success: function () {
                            $mappedItemBtn.addClass("gis-ra-mapped");
                            var $parent = $mappedItemBtn.parent();
                            $parent.attr("feature-id", featureId);
                            var $itmText = $parent.find(".ar-item-text");
                            $itmText.attr("feature-id", featureId);
                            $itmText.click();

                            // e.map.refreshLayers();
                        },
                        error: function () {
                            alert("Ошибка привязки к адресному регистру");
                        }
                    });

                    tryResetCurBindingBtnState();
                }
            },
            error: function () {
                alert("Ошибка получения данных с карты для АР");
            }
        });
    };
    $button.click(function () {
        that.getMap().deactivateControls(that);
        $element.after($treeWrapper);
        $treeWrapper.show();
        var map = that.getMap();

        map.removeLayer(vector);
        map.addLayer(vector);

        map.un("singleclick", onMapSingleClick);
        map.on("singleclick", onMapSingleClick);

        that._inited = true;
    });

    this.onControlsDeactivate = function (sender) {
        if (sender == that) {
            return;
        }

        if (that._inited != true) {
            return;
        }

        that.getMap().un("singleclick", onMapSingleClick);
        $treeWrapper.hide();
        that.getMap().removeLayer(vector);
    };

    ol.control.Control.call(this, {
        element: $element[0],
        target: options.target
    });
};
ol.inherits(app.AdrRegistryMappingControl, ol.control.Control);