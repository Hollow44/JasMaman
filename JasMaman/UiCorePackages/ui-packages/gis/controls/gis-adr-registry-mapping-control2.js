app.AdrRegistryMappingControl2 = function (opt_options) {
    var options = opt_options || {};
    var loadAdrRegistryTreeUrl = options.loadAdrRegistryTreeUrl;
    var loadArBindedItemsUrl = options.loadArBindedItemsUrl;
    var readonly = options.readonly || false;
    var baseLayer = options.baseLayer;
    var arBindManagers = { };
    arBindManagers[gisLayers.builds] = getBindArManager();
    arBindManagers[gisLayers.builds].bindingField = "flRca";
    arBindManagers[gisLayers.builds].allowMultiselect = false;
    arBindManagers[gisLayers.builds].supportedFeatureType = "BUILD";
    arBindManagers[gisLayers.builds].bindFunc = function(feature, arItem) {
        var parentItem = arItem.parentArItem;
        feature.set("name", parentItem.flType + " " + parentItem.flText);
        feature.set("num", arItem.flText);
        feature.set("arRca", arItem.flRca);
        feature.set("ArRkaChangeStatus", $.ArRcaChangeStatus.Changed);
    };
        
    arBindManagers[gisLayers.roads] = getBindArManager();
    arBindManagers[gisLayers.roads].bindingField = "flId";
    arBindManagers[gisLayers.roads].allowMultiselect = true;
    arBindManagers[gisLayers.roads].supportedFeatureType = "GEONIM";
    arBindManagers[gisLayers.roads].bindFunc = function(feature, arItem) {
        feature.set("name", arItem.flType + " " + arItem.flText);
        feature.set("arId", arItem.flId);
        feature.set("ArRkaChangeStatus", $.ArRcaChangeStatus.Changed);
    };
    
    arBindManagers[gisLayers.settlements] = getBindArManager();
    arBindManagers[gisLayers.settlements].bindingField = "flId";
    arBindManagers[gisLayers.settlements].allowMultiselect = true;
    arBindManagers[gisLayers.settlements].supportedFeatureType = "ATS";
    arBindManagers[gisLayers.settlements].bindFunc = function(feature, arItem) {
        feature.set("name", arItem.flType + " " + arItem.flText);
        feature.set("arId", arItem.flId);
        feature.set("ArRkaChangeStatus", $.ArRcaChangeStatus.Changed);
    };

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

    $treeTd.arTreeWidget({
        loadAdrRegistryTreeUrl: loadAdrRegistryTreeUrl,
        onItemClicked: function (arItem, $node) {
            var curLayer = options.getCurLayers()[0];
            var bindManager = arBindManagers[curLayer];
            if(!bindManager) {
                return;
            }
            var features = bindManager.getBindedFeatures(arItem[bindManager.bindingField]);
            if(features == undefined || features.length == 0) {
                return;
            }
            
            // TODO: pass function by options & check new edited features layer
            $.ajax({
                url: gisLayers.mapWmsUrl,
                jsonp: false,
                jsonpCallback: 'getGeomFromIdCallback',
                type: 'GET',
                dataType: 'jsonp',
                data: {
                    service: "WFS",
                    version: "1.1.0",
                    request: "GetFeature",
                    typename: curLayer,
                    srsname: gisLayers.defaultSrsName,
                    outputFormat: "text/javascript",
                    format_options: "callback:getGeomFromIdCallback",
                    cql_filter: "{0}={1}".format("id", features.join(" or {0}=".format("id")))
                },
                success: function(response) {
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
            
        },
        onItemRender: function (arItem, $node) {
            $node.find(".ar-item-text-wrapper .gis-ar-bind-btn").remove();
            
            var curLayers = options.getCurLayers();
            for (var i = 0; i < curLayers.length; i++) {
                var curLayer = curLayers[i];
                var bindManager = arBindManagers[curLayer];
                if (!bindManager) {
                    continue;
                }

                var bindingPossible = (arItem.flTypeId == bindManager.supportedFeatureType);
                if (bindingPossible != true) {
                    continue;
                }
                var bindedFeatures = bindManager.getBindedFeatures(arItem[bindManager.bindingField]);
                if (bindedFeatures) {
                    $node.addClass("ar-bind-exists");
                } else {
                    $node.removeClass("ar-bind-exists");
                }
                if ((bindManager.allowMultiselect == false) && (bindedFeatures)) {
                    continue;
                }

                if (readonly == false) {
                    var $bindBtn = $("<span class='gis-ar-bind-btn'>Привязать</span>");
                    $bindBtn.data("arItem", arItem);
                    $node.find(".ar-item-text-wrapper").append($bindBtn);
                }
            }
        },
    });

    var $treeHeader = $("<table class='gis-ar-tree-header-table'><tr><td class='gis-title-text-td'>Адресный регистр</td><td class='gis-close-td'>X</td></tr></table>");
    $treeHeaderTd.append($treeHeader);

    $treeHeader.find(".gis-close-td").click(function() {
        $treeWrapper.hide();
        that.getMap().removeLayer(vector);
    });
    
    var $treeLegend = $("<div>" +
        "<span class='ar-item-legend binded'>&nbsp</span><span class='ar-item-legend-text'> - привязан к карте</span>" +
        "<span class='ar-item-legend unbinded'>&nbsp</span><span class='ar-item-legend-text'> - не привязан к карте</span>" +
        "</div>");
    $treeLegendTd.append($treeLegend);


    $.ajax({
        url: loadArBindedItemsUrl,
        type: 'GET',
        dataType: 'json',
        success: function(result) {
            arBindManagers[gisLayers.builds].setInitialBinds(result.Builds);
            arBindManagers[gisLayers.roads].setInitialBinds(result.Geonims);
            arBindManagers[gisLayers.settlements].setInitialBinds(result.Settlements);
            $treeTd.arTreeWidget("refreshTree");
        },
        error: function(a, b, c) {
            alert("Ошибка загрузки адресного регистра");
        }
    });
    
    var baseLayerActive = function () {
        if (!baseLayer)
            return (true);
        return (baseLayer.getVisible() == true);
    };

    $treeTd.delegate(".ar-item-text[feature-id]", "click", function () {
        //tryResetCurBindingBtnState();
        
    });

    var $curEnabledItemBtn = null;

    $treeTd.delegate(".gis-ar-bind-btn", "click", function () {
        if (!baseLayerActive()) {
            alert("Для привязки выберите слой схем");
            return;
        }

        //tryResetCurBindingBtnState();

        if($curEnabledItemBtn!=null) {
            $curEnabledItemBtn.removeClass("selected");
            $curEnabledItemBtn.parent().removeClass("mapping-mode-enabled");
        }

        $curEnabledItemBtn = $(this);
        $curEnabledItemBtn.addClass("selected");
        $curEnabledItemBtn.parent().addClass("mapping-mode-enabled");
    });

    baseLayer.on("change:visible", function () {
        if ((baseLayer.getVisible() == false) && ($curEnabledItemBtn != null)) {
            //tryResetCurBindingBtnState();
        }
    });

    var onMapSingleClick = function(e) {
        if ($curEnabledItemBtn == null)
            return;
        var curBindingArItem = $curEnabledItemBtn.data("arItem");
        var coord = e.map.getCoordinateFromPixel(e.pixel);
        options.identifyObjectByCoord({
            coord: coord,
            success: function(features) {
                if (features.length == 0) {
                    return;
                }
                if($curEnabledItemBtn==null) 
                    return;
                
                var arItem = $curEnabledItemBtn.data("arItem");
                
                if(arItem != curBindingArItem) {
                    return;
                }
                
                var feature = features[0];
                
                var curLayer = options.getCurLayers()[0];
                var bindManager = arBindManagers[curLayer];
                if(!bindManager) {
                    return;
                }
                bindManager.bindFunc(feature, arItem);

                var geom = feature.getGeometry();
                var wktConvert = new ol.format.WKT();
                var geomInWkt = wktConvert.writeGeometry(geom);
                var id = feature.getId();

                options.onBindingEnd({
                    id: id,
                    geomWkt: geomInWkt,
                    attrs: getAttrsFromFeature(feature),
                });

                // e.map.refreshLayers();
            },
            error: function() {

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


    this.refreshTree = function(layer, featureBinds) {
        var bindManager = arBindManagers[layer];
        if(!bindManager) {
            return;
        }
        bindManager.refreshBindedFeatures(featureBinds);
        $treeTd.arTreeWidget("refreshTree");
    };
};
ol.inherits(app.AdrRegistryMappingControl2, ol.control.Control);






//-----------------------

function getBindArManager() {
    var bindedArManager = {
        _initialBinds: { },
        _editedBinds: { },
        _byArBinds: { },

        setInitialBinds: function(initialBinds) {
            this._initialBinds = initialBinds;
            this._byArBinds = this._getByArCode(initialBinds, this._byArBinds);
        },
        getBindedFeatures: function(arId) {
            return (this._byArBinds[arId]);
        },

        refreshBindedFeatures: function(editedBinds) {
            this._editedBinds = editedBinds;
            this._byArBinds = this._getByArCode(this._initialBinds, editedBinds);
        },

        _getByArCode: function(initialBinds, editedBinds) {
            var ret = { };
            var featureId;
            var arId;
            for (featureId in editedBinds) {
                arId = editedBinds[featureId];
                if (arId == null) {
                    continue;
                }

                if (!ret[arId]) {
                    ret[arId] = new Array();
                }
                ret[arId].push(featureId);
            }

            for (featureId in initialBinds) {
                if (editedBinds[featureId] !== undefined) {
                    continue;
                }
                arId = initialBinds[featureId];
                if (arId == null) {
                    continue;
                }

                if (!ret[arId]) {
                    ret[arId] = new Array();
                }
                ret[arId].push(featureId);
            }

            return (ret);
        }
    };
    return bindedArManager;
}
