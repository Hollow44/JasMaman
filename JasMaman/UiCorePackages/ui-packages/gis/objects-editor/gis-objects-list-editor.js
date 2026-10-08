$(document).ready(function () {
    $(".gis-objects-list-editor").each(function () {
        
        var $this = $(this);
        $this.addClass("web-map-control");
        var items = JSON.parse($this.attr("items"));
        var readOnly = $this.attr("read-only") == "True";
        var loadAdrRegistryTreeUrl = $this.attr("load-adr-registry-tree-url");
        var loadArBindedItemsUrl = $this.attr("get-ar-binded-items-url");
        var searchFeaturesUrl = $this.attr("search-features-url");
        var identifyOrgsUrl = $this.attr("identify-orgs-url");
        var identifyFeaturesUrl = $this.attr("identify-features-url");

        var onEditedFeaturesChangedListeners = [];
        var editor = getListEditorWidget({
                id: { text: "Ид.объекта", type: "text", hidden:true },
                actionType: { text: "Тип операции", type: "text", hidden:true },
                layer: { text: "Слой", type: "text", hidden:true },
                geom: { text: "Геометрия объекта", type: "text", hidden:true },
                attrs: { text: "Данные по объекту", type: "gisObjectAttributesEditor" },
            }, {
                toolbarItems: [],
                readonly: readOnly,
                editorDialogWidth: 600,
                buttons: { add: false, addMulti: false, addMultiWithHeader: false, removeAll: true },
                callbacks: {
                    onEditorDialogOpen: function(value, $widget) {
                        if(!value)
                            return;
                        if(value.layer == gisLayers.roads) {
                            $widget.find(".prop-wrapper[field-name='arCato']").hide();
                            $widget.find(".prop-wrapper[field-name='num']").hide();
                            $widget.find(".prop-wrapper[field-name='arRca']").hide();
                            $widget.find(".prop-wrapper[field-name='name']").text="Улица";
                        }else if(value.layer == gisLayers.builds) {
                            $widget.find(".prop-wrapper[field-name='arCato']").hide();
                            $widget.find(".prop-wrapper[field-name='arId']").hide();
                            $widget.find(".prop-wrapper[field-name='name']").text="Улица";
                        }else if(value.layer == gisLayers.settlements) {
                            $widget.find(".prop-wrapper[field-name='num']").hide();
                            $widget.find(".prop-wrapper[field-name='name']").find().text="Наименование";
                            $widget.find(".prop-wrapper[field-name='arRca']").hide();
                        }else if(value.layer == gisLayers.additionalMassives) {
                            $widget.find(".prop-wrapper[field-name='arCato']").hide();
                            $widget.find(".prop-wrapper[field-name='num']").hide();
                            $widget.find(".prop-wrapper[field-name='name']").text="Наименование";
                            $widget.find(".prop-wrapper[field-name='arRca']").hide();
                        }

                        var $divBindToRcaToolPanel = $("<div><span class='btn-bind-rca-tool-add'>Привязать к АР</span><span class='btn-bind-rca-tool-remove'>Убрать привязку</span></div>");
                        $widget.append($divBindToRcaToolPanel);
                        $divBindToRcaToolPanel.find(".btn-bind-rca-tool-remove").click(function() {
                            $widget.find(".prop-wrapper[field-name='arRca'] input").val("");
                            $widget.find(".prop-wrapper[field-name='arId'] input").val("");
                            $widget.find(".prop-wrapper[field-name='name'] input").val("");
                            $widget.find(".prop-wrapper[field-name='num'] input").val("");
                            $widget.find(".prop-wrapper[field-name='arCato'] input").val("");
                            $widget.find(".prop-wrapper[field-name='ArRkaChangeStatus'] input").val($.ArRcaChangeStatus.Cleared);
                        });

                        $divBindToRcaToolPanel.find(".btn-bind-rca-tool-add").click(function() {
                            var objLayer = value.layer;
                            var $div = $("<div>");
                            $div.dialog({
                                modal:true,
                                width: 500,
                                height: 600,
                                open: function() {
                                    $div.arTreeWidget({
                                        loadAdrRegistryTreeUrl: loadAdrRegistryTreeUrl,
                                        onItemClicked: function(arItem, $node) {
                                            $widget.find(".prop-wrapper[field-name='ArRkaChangeStatus'] input").val($.ArRcaChangeStatus.Changed);//isArRkaChanged
                                            if (objLayer == gisLayers.builds && arItem.flTypeId == "BUILD") {
                                                var parentItem = arItem.parentArItem;
                                                $widget.find(".prop-wrapper[field-name='arRca'] input").val(arItem.flRca);
                                                $widget.find(".prop-wrapper[field-name='name'] input").val(parentItem.flType + " " + parentItem.flText);
                                                $widget.find(".prop-wrapper[field-name='num'] input").val(arItem.flText);
                                                $div.dialog("close");
                                            }
                                            if (objLayer == gisLayers.roads && arItem.flTypeId == "GEONIM" && !IsGeonimAdditionalMassive(arItem.flSubType)) {
                                                $widget.find(".prop-wrapper[field-name='arId'] input").val(arItem.flId);
                                                $widget.find(".prop-wrapper[field-name='name'] input").val(arItem.flType + " " + arItem.flText);
                                                $div.dialog("close");
                                            }
                                            if (objLayer == gisLayers.settlements && arItem.flTypeId == "ATS") {
                                                $widget.find(".prop-wrapper[field-name='arCato'] input").val(arItem.flCato);
                                                $widget.find(".prop-wrapper[field-name='arId'] input").val(arItem.flId);
                                                $widget.find(".prop-wrapper[field-name='name'] input").val(arItem.flType + " " + arItem.flText);
                                                $div.dialog("close");
                                            }
                                            if (objLayer == gisLayers.additionalMassives && arItem.flTypeId == "GEONIM" && IsGeonimAdditionalMassive(arItem.flSubType)) {
                                                $widget.find(".prop-wrapper[field-name='arId'] input").val(arItem.flId);
                                                $widget.find(".prop-wrapper[field-name='name'] input").val(arItem.flType + " " + arItem.flText);
                                                $div.dialog("close");
                                            }
                                        },
                                        onItemRender: function(arItem, $node) {
                                            if (objLayer == gisLayers.builds && arItem.flTypeId == "BUILD") {
                                                $node.addClass("selectable");
                                            }
                                            if (objLayer == gisLayers.roads && arItem.flTypeId == "GEONIM" && !IsGeonimAdditionalMassive(arItem.flSubType)) {
                                                $node.addClass("selectable");
                                            }
                                            if (objLayer == gisLayers.settlements && arItem.flTypeId == "ATS") {
                                                $node.addClass("selectable");
                                            }
                                            if (objLayer == gisLayers.additionalMassives && arItem.flTypeId == "GEONIM" && IsGeonimAdditionalMassive(arItem.flSubType)) {
                                                $node.addClass("selectable");
                                            }
                                        },
                                    });
                                },
                                close: function() {
                                    $div.dialog("destroy");
                                }
                            });
                        });
                    },
                    afterRowPrinted: function (value, $tr) {
                        $tr.attr("featureId", value.id);
                    },
                    onValidate: function(value) {
                        var errors = { };
                        return errors;
                    },
                    onBeforeValueAccepted: function(value) {
                        
                    },
                    onAddMultiWithHeadersParsed: function(headerNames) {
                        
                    },
                    onActionCellPrinted: function(item, $td) {
                        
                    },
                    onSourceChanged: function () {
                        for(var listenerIndex=0;listenerIndex<onEditedFeaturesChangedListeners.length;listenerIndex++) {
                            onEditedFeaturesChangedListeners[listenerIndex]();
                        }
                    }
                }
            }
        );

        var $markupTable = $("<table class='gis-object-list-editor-markup-table'><tbody><tr><td class='td-map'></td><td class='td-operations'></td></tr></tbody></table>");
        
        var $selectLayer = $("<select class='gis-draw-layer-select'><option value='{0}' selected>Здания</option><option value='{1}'>Дороги</option><option value='{2}'>Массивы/микрорайоны</option><option value='{3}'>Населенные пункты</option></select>".format(gisLayers.builds, gisLayers.roads, gisLayers.additionalMassives, gisLayers.settlements));
        
        var $currentOrderLayerNameElements = document.getElementsByName('gis-object-editor-order-layer-name');
        var $currentOrderLayer = $currentOrderLayerNameElements[0].value;
            if ($currentOrderLayer === null || $currentOrderLayer === undefined || $currentOrderLayer.toLowerCase === 'null') {
                alert('Ошибка при определении слоя');
                return;
            }
            $selectLayer.val($currentOrderLayer);
            $selectLayer.enable(false);
        
        var fullScreenToggleText = ["Развернуть", "Свернуть"];
        var $fullScreen = $("<span class='gis-btn-full-screen'>{0}</span>".format(fullScreenToggleText[0]));

        /*$markupTable.find(".td-operations").append($fullScreen);
        $markupTable.find(".td-operations").append($selectLayer);
        $markupTable.find(".td-operations").append(editor.$widget);*/

        var $rightPaneMarkup = $("<table><tr><td class='gis-full-screen-btn-td'></td></tr><tr><td class='gis-select-layer-btn-td'></td></tr><tr><td class='gis-object-list-editor-td'></td></tr></table>");
        $rightPaneMarkup.css("height", "100%");
        $rightPaneMarkup.css("width", "100%");
        $rightPaneMarkup.find(".gis-full-screen-btn-td").append($fullScreen);
        $rightPaneMarkup.find(".gis-select-layer-btn-td").append($selectLayer);
        $rightPaneMarkup.find(".gis-object-list-editor-td").append(editor.$widget);
        $markupTable.find(".td-operations").append($rightPaneMarkup);

        $fullScreen.click(function() {
            $this.toggleClass("full-screen");
            if($fullScreen.text() == fullScreenToggleText[0]) {
                $fullScreen.text(fullScreenToggleText[1]);
            }else {
                $fullScreen.text(fullScreenToggleText[0]);
            }
        });

        var $map = $("<div>");
        $map.addClass('web-map-container-size');
        $markupTable.find(".td-map").append($map);
        $this.append($markupTable);
        
        var mapWmsUrl = gisLayers.mapWmsUrl;
        var mapGwcWmsUrl = gisLayers.mapGwcWmsUrl;   // cached layers for big raster data etc..
        
        var schemaLayer = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: mapWmsUrl,
                params: { 'LAYERS': gisLayers.schematicFull, 'srs': gisLayers.defaultSrsName },//ast_osm_full -> kz
                projection: gisLayers.defaultSrsName,
            }),
        });
        
        var buildsRcaLayer = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: mapWmsUrl,
                params: { 'LAYERS': gisLayers.buildsRca, 'srs': gisLayers.defaultSrsName },//ast_osm_full -> kz
                projection: gisLayers.defaultSrsName,
            }),
            visible : false
        });
        var roadsRcaLayer = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: mapWmsUrl,
                params: { 'LAYERS': gisLayers.roadsRca, 'srs': gisLayers.defaultSrsName },//ast_osm_full -> kz
                projection: gisLayers.defaultSrsName,
            }),
            visible : false
        });
        var settlementsRcaLayer = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: mapWmsUrl,
                params: { 'LAYERS': gisLayers.settlementsRca, 'srs': gisLayers.defaultSrsName },//ast_osm_full -> kz
                projection: gisLayers.defaultSrsName,
            }),
            visible : false
        });
        
        var additionalMassivesRcaLayer = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: mapWmsUrl,
                params: { 'LAYERS': gisLayers.additionalMassivesRca, 'srs': gisLayers.defaultSrsName },//ast_osm_full -> kz
                projection: gisLayers.defaultSrsName,
            }),
            visible : false
        });
        
        var featureActions = { };


        var editedFeaturesVector = new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: function(feature, resolution) {
                var action = featureActions[feature.getId()];
                var fillColor = 'rgba(255, 255, 255, 0.2)';
                var strokeColor = '#ffcc33';
                if(action) {
                    switch (action) {
                    case "add":
                        strokeColor = '#B3C5E8';
                        break;
                    case "modify":
                        strokeColor = '#709E58';
                        break;
                    case "remove":
                        strokeColor = '#FF9E9E';
                        break;
                    }
                }
                return [new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: fillColor
                    }),
                    stroke: new ol.style.Stroke({
                        color: strokeColor,
                        width: 3
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                })];
            }
        });
        
        //вспомогательный слой для опеределения ближайшей feature к заданной кординате
        var hiddenFeaturesVector = new ol.layer.Vector({
            source: new ol.source.Vector(),
            visible: false
        });
        // Для корректной работы OL с кэшем gwc нужно установить выравнивание и масштабы плиток. Где взять: 
        //  1) Выравнивание в геосервере в настроках кэшированного слоя как левая верхняя граница
        //  2) Уровни масштабов скопипастить из сгенерированного js-скрипта на странице просмотра кэшированных слоев в геосервере
        var reque = "http://maps.gosreestr.kz/geoserver/gwc/service/wfs?service=wfs&version=1.1.0&request=getfeature&typename=gosreestr:kz_settlement&outpuFormat=text/javascript&PROPERTYNAME=ar_id&CQL_FILTER=ar_id is not null";
        
        var satLayer = new ol.layer.Tile({
            visible: false,
            source: new ol.source.TileWMS({
                url: mapGwcWmsUrl,
                params: { 'LAYERS': gisLayers.raster, 'srs': gisLayers.defaultSrsName, 'format': 'image/png' },
                projection: gisLayers.defaultSrsName,
                tileGrid: new ol.tilegrid.TileGrid({
                    origin: [-20037508.342789244,-15496570.739723722],
                    resolutions:[156543.03392804097, 78271.51696402048, 39135.75848201024, 19567.87924100512, 9783.93962050256, 4891.96981025128, 2445.98490512564, 1222.99245256282, 611.49622628141, 305.748113140705, 152.8740565703525, 76.43702828517625, 38.21851414258813, 19.109257071294063, 9.554628535647032, 4.777314267823516, 2.388657133911758, 1.194328566955879, 0.5971642834779395]
                }),
            })
        });
        
        var layers = [
            satLayer,
            schemaLayer,
            buildsRcaLayer,
            roadsRcaLayer,
            settlementsRcaLayer,
            additionalMassivesRcaLayer,
            editedFeaturesVector,
            hiddenFeaturesVector
        ];

        var view = new ol.View({
            center: [7951138.85194, 6617835.78100],
            zoom: 14,
            projection: gisLayers.defaultSrsName,
            extent: gisLayers.mapBounds,
            minZoom: gisLayers.minZoom,
            maxZoom: gisLayers.maxZoom
        });

        function updateOrInsertItem(actionType, dataItem) {
            
            var editorItems = editor.getItems();
            var founded = false;
            for (var i = 0; i < editorItems.length; i++) {
                var item = editorItems[i];
                if (item.id == dataItem.id) {
                    founded = true;
                    if (item.actionType != "add") {
                        item.actionType = actionType;
                        dataItem.attrs.actionType = actionType;
                    }

                    if (item.actionType == "add" && actionType == "remove") {
                        delete editorItems[i];
                        break;
                    }
                    item.geom = dataItem.geomWkt;
                    item.attrs = dataItem.attrs;
                    break;
                }
            }
            if (founded == false) {
                dataItem.attrs.actionType = actionType;
                editorItems.push({
                    id: dataItem.id,
                    actionType: actionType,
                    layer: actionType==="add"?$selectLayer.val(): dataItem.attrs.layer,
                    geom: dataItem.geomWkt,
                    attrs: dataItem.attrs,
                });
            }

            //некоторые элементы могли быть удалены с помощью delete, поэтому найдем все не undefined
            var actualItems = [];
            for (var i = 0; i < editorItems.length; i++) {
                if (editorItems[i] == undefined)
                    continue;
                actualItems.push(editorItems[i]);

            }

            editor.setItems(actualItems);
        }

        function syncEditorItemsWithVectorLayer() {
            editedFeaturesVector.getSource().clear();
            var editorItems =  editor.getItems();
            var features = [];
            for(var i=0;i<editorItems.length;i++) {
                var curItem = editorItems[i];
                var wktConvert = new ol.format.WKT();
                var geom = wktConvert.readGeometry(curItem.geom);

                var f = new ol.Feature({
                    geometry: geom
                });
                f.setId(curItem.id);
                var attrs = curItem.attrs;
                for(var key in attrs) {
                    f.set(key, attrs[key]);
                }
                
                features.push(f);
                featureActions[editorItems[i].id] = editorItems[i].actionType;
            }
            editedFeaturesVector.getSource().addFeatures(features);
        }

        onEditedFeaturesChangedListeners.push(syncEditorItemsWithVectorLayer);

        
        function getNearestFeatureArr(features, coord) {
            if(!features || features.length == 0) {
                return [];
            }
            hiddenFeaturesVector.getSource().clear();
            hiddenFeaturesVector.getSource().addFeatures(features);
            var ret = hiddenFeaturesVector.getSource().getClosestFeatureToCoordinate(coord);
            hiddenFeaturesVector.getSource().clear();
            if(ret) {
                return [ret];
            }
            return [];
        }

        function identifyObjectByCoordInOrigBuildsLayer(coord, onSuccess, onError) {
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
                    cql_filter: "INTERSECTS(geom,POINT({0} {1}))".format(coord[0], coord[1])
                },
                success: function(response) {
                    var geojsonFormat = new ol.format.GeoJSON();
                    var features = geojsonFormat.readFeatures(response);

                    features = getNearestFeatureArr(features, coord);

                    for (var i = 0; i < features.length; i++) {
                        var curFeature = features[i];
                        curFeature.set("layer", gisLayers.builds);
                        curFeature.set("name", curFeature.get("uni_geonim"));
                        curFeature.set("num", curFeature.get("uni_house"));
                        curFeature.set("arRca", curFeature.get("ar_rca"));
                        curFeature.set("ArRkaChangeStatus", $.ArRcaChangeStatus.None);
                        

                        curFeature.setId("builds." + curFeature.get("id"));
                        var geom = curFeature.getGeometry();
                        var wktConvert = new ol.format.WKT();
                        var geomInWkt = wktConvert.writeGeometry(geom);
                        curFeature.set("originalGeometry", geomInWkt);
                    }
                    features = checkFeaturesForExistInEditLayer(features);
                    onSuccess(features);
                },
                error: function(a, b, c) {
                    onError(a, b, c);
                }
            });
        }
        function identifyObjectByCoordInOrigRoadsLayer(coord, onSuccess, onError) {
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
                    typename: gisLayers.roads,
                    srsname: gisLayers.defaultSrsName,
                    outputFormat: "text/javascript",
                    format_options: "callback:getGeomFromPointCallback",
                    cql_filter: "DWITHIN(geom,POINT({0} {1}), 10, meters)".format(coord[0], coord[1])
                },
                success: function(response) {
                    var geojsonFormat = new ol.format.GeoJSON();
                    var features = geojsonFormat.readFeatures(response);
                    
                    features = getNearestFeatureArr(features, coord);
                    
                    for(var i=0;i<features.length;i++) {
                        features[i].set("layer", gisLayers.roads);
                        features[i].set("arId", features[i].get("ar_id"));
                        features[i].set("ArRkaChangeStatus", $.ArRcaChangeStatus.None);
                        features[i].setId("roads." + features[i].get("id"));
                        var geom = features[i].getGeometry();
                        var wktConvert = new ol.format.WKT();
                        var geomInWkt = wktConvert.writeGeometry(geom);
                        features[i].set("originalGeometry", geomInWkt);
                    }
                    features = checkFeaturesForExistInEditLayer(features);
                    onSuccess(features);
                },
                error: function(a, b, c) {
                    onError(a, b, c);
                }
            });
        }

        function identifyObjectByCoordInOrigSettlementLayer(coord, onSuccess, onError) {
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
                    typename: gisLayers.settlements,
                    srsname: gisLayers.defaultSrsName,
                    outputFormat: "text/javascript",
                    format_options: "callback:getGeomFromPointCallback",
                    cql_filter: "INTERSECTS(geom,POINT({0} {1}))".format(coord[0], coord[1])
                },
                success: function(response) {
                    var geojsonFormat = new ol.format.GeoJSON();
                    var features = geojsonFormat.readFeatures(response);

                    features = getNearestFeatureArr(features, coord);

                    for(var i=0;i<features.length;i++) {
                        var curFeature = features[i];
                        curFeature.set("layer", gisLayers.settlements);
                        curFeature.set("name", curFeature.get("name_rus"));
                        curFeature.set("arId", curFeature.get("ar_id"));
                        curFeature.set("arCato", curFeature.get("kato"));
                        curFeature.set("ArRkaChangeStatus", $.ArRcaChangeStatus.None);
                        var geom = curFeature.getGeometry();
                        var wktConvert = new ol.format.WKT();
                        var geomInWkt = wktConvert.writeGeometry(geom);
                        curFeature.set("originalGeometry", geomInWkt);
                        curFeature.setId("settlements." + curFeature.get("id"));
                    }
                    features = checkFeaturesForExistInEditLayer(features);
                    onSuccess(features);
                },
                error: function(a, b, c) {
                    onError(a, b, c);
                }
            });
        }
        
        function identifyObjectByCoordInOrigAdditionalMassiveLayer(coord, onSuccess, onError) {
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
                    typename: gisLayers.additionalMassives,
                    srsname: gisLayers.defaultSrsName,
                    outputFormat: "text/javascript",
                    format_options: "callback:getGeomFromPointCallback",
                    cql_filter: "INTERSECTS(geom,POINT({0} {1}))".format(coord[0], coord[1])
                },
                success: function(response) {
                    var geojsonFormat = new ol.format.GeoJSON();
                    var features = geojsonFormat.readFeatures(response);

                    features = getNearestFeatureArr(features, coord);

                    for(var i=0;i<features.length;i++) {
                        var curFeature = features[i];
                        curFeature.set("layer", gisLayers.additionalMassives);
                        curFeature.set("name", curFeature.get("name_rus"));
                        curFeature.set("arId", curFeature.get("ar_id"));
                        var geom = curFeature.getGeometry();
                        var wktConvert = new ol.format.WKT();
                        var geomInWkt = wktConvert.writeGeometry(geom);
                        curFeature.set("originalGeometry", geomInWkt);
                        curFeature.set("ArRkaChangeStatus", $.ArRcaChangeStatus.None);
                        curFeature.setId("massives." + curFeature.get("id"));
                    }
                    features = checkFeaturesForExistInEditLayer(features);
                    onSuccess(features);
                },
                error: function(a, b, c) {
                    onError(a, b, c);
                }
            });
        }

        var checkFeaturesForExistInEditLayer = function(features) {
            var ret = [];
            if (features && features.length > 0) {
                features.forEach(function(feat) {
                    var existingFeatures = editedFeaturesVector.getSource().getFeatures();
                    if (existingFeatures && existingFeatures.length > 0) {
                        existingFeatures.forEach(function(existingFeat) {
                            if (existingFeat.getId() === feat.getId()) {
                                feat = existingFeat;
                                return;
                            }
                        });
                    }
                    ret.push(feat);
                });
            }
            return ret;
        };

        var controls = [
            new app.ZoomControl(),
            new app.SearchFeaturesControl({ searchFeaturesUrl: searchFeaturesUrl }),
            new app.ChooseLayersControl({
                    legend: [
                        { text: "Схема", layers: [schemaLayer] },
                        { text: "Спутник", layers: [satLayer] },
                        { text: "Гибрид", layers:[satLayer, schemaLayer]}
                    ]
                }),
            //new app.IdentifyControl({ mapDiv: $map[0], mapWmsUrl: mapWmsUrl, identifyOrgsUrl: identifyOrgsUrl }),
            new app.IdentifyControl2({ mapDiv: $map[0], mapWmsUrl: mapWmsUrl, identifyFeaturesUrl: identifyFeaturesUrl, currentOrderLayer:$currentOrderLayer }),
            new app.MousePositionControl($map[0]),
            new app.MeasureLengthControl(),
            new app.MeasureAreaControl(),
            new app.SetMapCentroidControl()
        ];
        
            controls.push(new app.RcaLayerViewerControl({
                buildsRcaLayer: buildsRcaLayer,
                roadsRcaLayer: roadsRcaLayer,
                settlementsRcaLayer: settlementsRcaLayer,
                additionalMassivesRcaLayer:additionalMassivesRcaLayer,
                editLayer: $selectLayer.val()
            }));
        var map = null;

        if(readOnly != true) {
            
            function identifyObjectByCoordHandler(opt) {
                    var features = editedFeaturesVector.getSource().getFeaturesAtCoordinate(opt.coord);
                    if (features.length > 0) {
                        opt.success(features);
                        return;
                    }
                    
                    var closestFeature = editedFeaturesVector.getSource().getClosestFeatureToCoordinate(opt.coord);
                    if(closestFeature) {
                        //вычисляем растояние от клика мыши, до ближайшего объекта в пикселях. Если расстояние небольшое то выбираем объект.

                        var closestPoint = closestFeature.getGeometry().getClosestPoint(opt.coord);
                        var pixel1 = map.getPixelFromCoordinate(opt.coord);
                        var pixel2 = map.getPixelFromCoordinate(closestPoint);

                        
                        var dist = Math.pow(Math.pow(pixel1[0] - pixel2[0], 2) + Math.pow(pixel1[1] - pixel2[1], 2), 0.5);
                        var constToleranceValue = 4;
                        if(dist <= constToleranceValue) {
                            opt.success([closestFeature]);
                            return;
                        }
                    }

                    var identifyObjByCoord = null;
                    if ($selectLayer.val() == gisLayers.builds) {
                        identifyObjByCoord = identifyObjectByCoordInOrigBuildsLayer;
                    } else if ($selectLayer.val() == gisLayers.roads) {
                        identifyObjByCoord = identifyObjectByCoordInOrigRoadsLayer;
                    } else if ($selectLayer.val() == gisLayers.settlements) {
                        identifyObjByCoord = identifyObjectByCoordInOrigSettlementLayer;
                    }else if ($selectLayer.val() == gisLayers.additionalMassives) {
                        identifyObjByCoord = identifyObjectByCoordInOrigAdditionalMassiveLayer;
                    }else {
                        throw "Неподдерживаемый слой";
                    }

                identifyObjByCoord(
                        opt.coord,
                        function(foundedFeatures) {
                            opt.success(foundedFeatures);
                        },
                        function(a, b, c) {
                            opt.error(a, b, c);
                        }
                    );
                }

            

            controls.push(new app.EditControl2({
                baseLayer: schemaLayer,
                identifyObjectByCoord: identifyObjectByCoordHandler,
                getDrawGeomType: function () {
                    if($selectLayer.val() == gisLayers.builds||$selectLayer.val() == gisLayers.settlements||$selectLayer.val() == gisLayers.additionalMassives) {
                        return "MultiPolygon";
                    }
                    if($selectLayer.val() == gisLayers.roads) {
                        return "LineString";
                    }
                    throw "Неподдерживаемый слой";
                },
                onFeatureDrawFinish: function(data) {
                    var curLayer = $selectLayer.val();
                    var prefix = null;
                    data.attrs["name"] = "";
                    data.attrs["num"] = "";

                    if(curLayer == gisLayers.builds) {
                        prefix = "builds";
                        data.attrs["arRca"] = "";
                    } else if(curLayer == gisLayers.roads) {
                        prefix = "roads";
                        data.attrs["arId"] = "";
                    } else if(curLayer == gisLayers.settlements) {
                        prefix = "settlements";
                        data.attrs["arId"] = "";
                    } else if(curLayer == gisLayers.additionalMassives) {
                        prefix = "massives";
                        data.attrs["arId"] = "";
                    }
                    else {
                        alert("Неподдерживаемый слой " + curLayer);
                        throw "Неподдерживаемый слой " + curLayer;
                    }

                    data.id = prefix + "." + "NEW-" + randomString(10);
                    
                    updateOrInsertItem("add", data);
                },
                onFeatureModifyFinish: function(data) {
                    updateOrInsertItem("modify", data);
                },
                onFeatureRemoveFinish: function(data) {
                    updateOrInsertItem("remove", data);
                },
                onAttributeEditFinish: function(data) {
                    updateOrInsertItem("editAttrs", data);
                }
            }));

            var arBindingControl = new app.AdrRegistryMappingControl2({
                baseLayer: schemaLayer,
                loadAdrRegistryTreeUrl: loadAdrRegistryTreeUrl,
                loadArBindedItemsUrl: loadArBindedItemsUrl,
                identifyObjectByCoord: identifyObjectByCoordHandler,
                onBindingEnd: function(data) {
                    updateOrInsertItem("modify", data);
                },
                getCurLayers: function () {
                    return [$selectLayer.val()];
                }
            });
            
            function syncArBinds() {
                var prefixesInfo = {
                    "roads": {
                        layer:gisLayers.roads,
                        bindField:"arId"
                    },
                    "builds": {
                        layer:gisLayers.builds,
                        bindField:"arRca"
                    },"settlements": {
                        layer:gisLayers.settlements,
                        bindField:"arId"
                    },"massives": {
                        layer:gisLayers.additionalMassives,
                        bindField:"arId"
                    }
                };
                var editorItems = editor.getItems();
                var binds = { };
                
                for (var i = 0; i < editorItems.length; i++) {
                    var curItem = editorItems[i];
                    var idParts = curItem.id.split("."); 
                    var prefix = idParts[0];
                    var rawId = idParts[1];
                    var config = prefixesInfo[prefix];
                    if(!config) {
                        alert("Unknown id prefix: " + prefix);
                        continue;   // o_O
                    }
                    var layer = config.layer;
                    var bindField = config.bindField;
                    if(binds[layer] == undefined) {
                        binds[layer] = { };
                    }
                    binds[layer][rawId] = curItem.attrs[bindField];
                }
                
                for(var conf in prefixesInfo) {
                    var layerName = prefixesInfo[conf].layer;
                    arBindingControl.refreshTree(layerName,binds[layerName]||{});
                }
            }

            $selectLayer.change(function() {
                syncArBinds();
            });

            onEditedFeaturesChangedListeners.push(syncArBinds);

            controls.push(arBindingControl);
        }

        map = new ol.Map({
            controls: controls,
            layers: layers,
            target: $map[0],
            view: view,
            logo:false
        });

        
        var highlightFeature = function(featureId, isHighlighted) {
            var feature = editedFeaturesVector.getSource().getFeatureById(featureId);
            if (isHighlighted == true) {
                var action = featureActions[feature.getId()];
                var fillColor = 'rgba(12, 54, 7, 1)';
                var strokeColor = 'rgba(12, 54, 7, 1)';
                var styleFeature = new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: fillColor
                    }),
                    stroke: new ol.style.Stroke({
                        color: strokeColor,
                        width: 4
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                });
                feature.setStyle(styleFeature);
            } else {
                feature.setStyle(null);
            }
        };
        var zoomToFeature = function(featureId) {
            var feature = editedFeaturesVector.getSource().getFeatureById(featureId);
            var extent = feature.getGeometry().getExtent();
            map.getView().fitExtent(extent, map.getSize());
        };

        editor.$widget.delegate("table tbody tr:not(.no-rows)", "mouseenter", function() {
            var $curTr = $(this);
            highlightFeature($curTr.attr("featureId"), true);

        });
        editor.$widget.delegate("table tbody tr:not(.no-rows)", "mouseleave", function() {
            var $curTr = $(this);
            highlightFeature($curTr.attr("featureId"), false);
        });
        editor.$widget.delegate("table tbody tr:not(.no-rows)", "click", function() {
            var $curTr = $(this);
            zoomToFeature($curTr.attr("featureId"));
        });

        if (items) {
            items.forEach(function(eachItem) {
                if (!eachItem.attrs.actionType) {
                    eachItem.attrs.actionType = eachItem.actionType;
                }
            });
        }
        editor.setItems(items);

        $this.closest("form").submit(function() {
            var editorName = $this.attr("editor-name");
            var $input = $("<input type='hidden' name='{0}'/>".format(editorName));
            var editorItemsJson = JSON.stringify(editor.getItems());
            $input.val(editorItemsJson);
            $(this).append($input);
        });
    });
});


registerEditorProvider("gisObjectAttributesEditor", {
    getWidget: function(options) {
        var editorWidget = getObjectEditorWidget({
            //nameSettlement: { text: "Наименование", type: "text", readonly:true },
            arCato: { text: "Код КАТО", type: "text", readonly:true },
            name: { text: "Улица", type: "text", readonly:true },
            num: { text: "Номер дома", type: "text", readonly:true },
            arRca: { text: "Код РКА", type:"text", readonly:true},
            arId: { text: "Код в адресном регистре", type:"text", readonly: true},
            actionType: { text: "Тип операции", type: "text", hidden:true },
            ArRkaChangeStatus: { text: "Статус изменения кода РКА",value:$.ArRcaChangeStatus.None, type: "text", hidden:true },
            isGeomChanged: { text: "Статус изменения геометрии", type: "text", hidden:true },
            layer: { text: "Слой объекта", type: "text", hidden:true },
        });
        editorWidget.$widget._editor = editorWidget;
        return editorWidget.$widget;
    },
    setValue: function($widget, value) {
        var editor = $widget._editor;
        editor.setVal(value);
    },
    getValue: function($widget) {
        var editor = $widget._editor;
        return editor.getVal();
    },
    getText: function(value) {
        var retStr = "";
        if(value.name && value.num) {
            retStr += "{0}, {1}".format(value.name || "", value.num || "");
        } if(value.name&&!value.num) {
            retStr = value.name;
        }if (value.nameSettlement) {
            retStr = value.nameSettlement;
        }
        if(value.arRca) {
            retStr += " (АР:{0})".format(value.arRca);
        } else if(value.arId) {
            retStr += " (АР:{0})".format(value.arId);
        } else {
            retStr+= " (АР:нет)";
        }
        if (value.layer == gisLayers.roads) {
            retStr+= "</br>Слой объекта: Улицы";
        } else if (value.layer == gisLayers.builds) {
            retStr+= "</br>Слой объекта: Здания";
        } else if (value.layer == gisLayers.settlements) {
            retStr+= "</br>Слой объекта: Населенные пункты";
            retStr+= "</br>Код КАТО: {0}".format(value.arCato);
        }

        if (value.actionType) {
            if (value.actionType == "add") {
                retStr += "<br>Тип операции: {0}".format("Создание объекта");
            }
            if (value.actionType == "modify") {
                retStr += "<br>Тип операции: {0}".format("Изменение объекта");
            }
            if (value.actionType == "remove") {
                retStr += "<br>Тип операции: {0}".format("Удаление объекта");
            }
            if (value.ArRkaChangeStatus) {
                if (value.ArRkaChangeStatus == $.ArRcaChangeStatus.Changed) {
                    retStr += "<br>Изменение кода РКА объекта";
                }
                if (value.ArRkaChangeStatus == $.ArRcaChangeStatus.Cleared) {
                    retStr += "<br>Удаление кода РКА объекта";
                }
            }
            if (value.isGeomChanged&&value.isGeomChanged=="true") {
                retStr += "<br>Изменение границы объекта";
            }
        }
        return retStr;
    },
    parse: function(text) {
        throw "Неподдерживаемая операция";
        //return JSON.parse(text);
    },
    setOnValueChangedCallback: function($widget, callback) {

    }
});