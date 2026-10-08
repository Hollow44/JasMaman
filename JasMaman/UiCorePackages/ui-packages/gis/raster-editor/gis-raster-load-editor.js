$(document).ready(function () {
    $(".gis-raster-load-editor").each(function() {
        var $this = $(this);
        var loadAdrRegistryTreeUrl = $this.attr("load-adr-registry-tree-url");
        var loadSettlementsCoordUrl = $this.attr("get-settlement-coords-url");

        var item = JSON.parse($this.attr("item"));
        var readOnly = $this.attr("read-only") == "True";
        var $loadAdrRegBtn = $('.load-adr-reg-button');
        $loadAdrRegBtn.css('width', '180px');
        
        if (readOnly) {
            $loadAdrRegBtn.hide();
        }
        
        $loadAdrRegBtn.click(function() {
            var $div = $("<div>");
            $div.dialog({
                modal: true,
                width: 500,
                height: 600,
                open: function() {
                    $div.arTreeWidget({
                        loadAdrRegistryTreeUrl: loadAdrRegistryTreeUrl,
                        onItemClicked: function(arItem, $node) {
                            if (arItem.flTypeId == "ATS" && arItem && IsSettlement(arItem.flSubType)) {
                                var isExist = function(arr, itemIn) {
                                    if (arr) {
                                        for (var j = 0; j < arr.length; j++) {
                                            if (arr[j] === itemIn)
                                                return true;
                                        }
                                    }
                                    return false;
                                };
                                var result = [];
                                result.unshift($node.text().replace(':', ' '));
                                var $parents = $node.parentsUntil('.gis-adr-registry-tree');
                                for (var i = 0; i < $parents.length; i++) {
                                    var $nodeItem = $parents[i];
                                    var $nodeItemClassList = $nodeItem.classList;
                                    if (isExist($nodeItemClassList, "ar-item-childs")) {
                                        continue;
                                    }
                                    if (isExist($nodeItemClassList, 'ar-item') && isExist($nodeItemClassList, 'ar-expanded')) { //&& isExist($nodeItemClassList,'ar-bind-exists')
                                        var $markUpTables = $nodeItem.getElementsByClassName('ar-item-markup-table');
                                        if ($markUpTables) {
                                            var $markUpTable = $markUpTables[0];
                                            if ($markUpTable) {
                                                var $itemLast = $markUpTable.getElementsByClassName('ar-item-text');
                                                if ($itemLast) {
                                                    if ($itemLast[0].innerText) {
                                                        result.unshift($itemLast[0].innerText.replace(':', ' '));
                                                    }
                                                }
                                            }
                                        }

                                    }
                                }

                                var setSettlementData = function(settlementParams) {
                                    if (settlementParams) {
                                        item.geometry = settlementParams.Geometry;
                                        item.boundBox = settlementParams.BoundaryBox;
                                        item.totalLoadTime = settlementParams.TimeLoad;
                                        item.area = settlementParams.TotalArea;
                                        zoomMapExtentToFeatures(item.geometry, item.boundBox);
                                    }

                                    var $settlementNameInput = document.getElementsByClassName('settlement-name-to-raster-load');
                                    var $settlementArIdInput = document.getElementsByClassName('settlement-ar-id-to-raster-load');
                                    var $settlementLoadTime = document.getElementsByClassName('settlement-raster-load-time');
                                    var $settlementLoadArea = document.getElementsByClassName('settlement-raster-load-area');
                                    $settlementNameInput[0].value = result.join(', ');
                                    item.settlementArId = arItem.flId;
                                    item.settlementName = result.join(', ');
                                    $settlementArIdInput[0].value = arItem.flId;
                                    $settlementLoadTime[0].value = settlementParams.TimeLoadString;
                                    $settlementLoadArea[0].value = settlementParams.TotalArea;

                                    $div.dialog("close");
                                };

                                $.ajax({
                                    url: loadSettlementsCoordUrl + "?ArId=" + arItem.flId,
                                    type: 'GET',
                                    dataType: 'json',
                                    success: function(ret) {
                                        if(ret.StatusCode != "OK") {
                                            alert("Ошибка загрузки данных по населенному пункту: " + ret.StatusText);
                                            return;
                                        }
                                        setSettlementData(ret.SettlementInfo);
                                    },
                                    error: function(a, b, c) {
                                        alert("Ошибка загрузки данных по населенному пункту");
                                    }
                                });
                            }
                        },
                        onItemRender: function(arItem, $node) {
                            if (arItem.flTypeId == "ATS" && arItem && IsSettlement(arItem.flSubType)) {
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
        $this.closest("form").submit(function() {
            var editorName = $this.attr("editor-name");
            var $input = $("<input type='hidden' name='{0}'/>".format(editorName));
            var editorItemJson = JSON.stringify(item);
            $input.val(editorItemJson);
            $(this).append($input);
        });
        //if (readOnly === true) {
        var $mapTarget = $('<div style="height:600px;width:100%;border:solid 1px grey;">');
        $mapTarget.addClass("web-map-control");
        //$mapTarget.addClass('web-map');
        $this.append('<br/>');
            $this.append($loadAdrRegBtn);
            $this.append('<br/>');
            $this.append('<br/>');
        $this.append($mapTarget);

        var vectorSource = new ol.source.Vector({
            projection: gisLayers.defaultSrsName,
        });

        var vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: new ol.style.Style({
                fill: new ol.style.Fill({ color: 'blue' }),
                stroke: new ol.style.Stroke({
                    color: 'red',
                    width: 10
                })
            })
        });
        var satLayer = new ol.layer.Tile({
            visible: false,
            source: new ol.source.TileWMS({
                url: gisLayers.mapGwcWmsUrl,
                params: { 'LAYERS': gisLayers.raster, 'srs': gisLayers.defaultSrsName, 'format': 'image/png' },
                projection: gisLayers.defaultSrsName,
                tileGrid: new ol.tilegrid.TileGrid({
                    origin: [-20037508.342789244, -15496570.739723722],
                    resolutions: [156543.03392804097, 78271.51696402048, 39135.75848201024, 19567.87924100512, 9783.93962050256, 4891.96981025128, 2445.98490512564, 1222.99245256282, 611.49622628141, 305.748113140705, 152.8740565703525, 76.43702828517625, 38.21851414258813, 19.109257071294063, 9.554628535647032, 4.777314267823516, 2.388657133911758, 1.194328566955879, 0.5971642834779395]
                }),
            })
        });

        var schemaLayer = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: gisLayers.mapWmsUrl,
                params: { 'LAYERS': gisLayers.schematicFull, 'srs': gisLayers.defaultSrsName },//ast_osm_full -> kz
                projection: gisLayers.defaultSrsName,
                crossOrigin: 'anonymous'
            }),
        });
        
        var layers = [
            satLayer, schemaLayer, vectorLayer
        ];

        var view = new ol.View({
            center: [7951138.85194, 6617835.78100],
            zoom: 14,
            projection: gisLayers.defaultSrsName,
            extent: gisLayers.mapBounds,
            minZoom: gisLayers.minZoom,
            maxZoom: gisLayers.maxZoom
        });
        var map = new ol.Map({
            controls: [
                new app.ZoomControl(), 
                new app.ChooseLayersControl({
                    legend: [
                        { text: "Спутник", layers: [satLayer] },
                        { text: "Схема", layers: [schemaLayer] },
                        { text: "Гибрид", layers: [satLayer, schemaLayer] },
                    ]
                }),
                new app.RefreshLayersControl(),
                new app.ViewLoadSourceControl()
            ],
            layers: layers,
            target: $mapTarget[0],
            view: view,
            logo: false
        });

        var zoomMapExtentToFeatures = function(geometry, boundBox) {
            var features = [];
            var wktConvert = new ol.format.WKT();
            if (boundBox) {
                var geomBound = wktConvert.readGeometry(boundBox);
                var boundStyle = new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#FC0022',
                        width: 4
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                });
                var boundFeature = new ol.Feature({ geometry: geomBound });
                boundFeature.setStyle(boundStyle);
                features.push(boundFeature);
            }
            if (geometry) {
                var polyGeom = wktConvert.readGeometry(geometry);
                var polyStyle = new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#007EFC',
                        width: 3
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                });
                var polyFeature = new ol.Feature({ geometry: polyGeom });
                polyFeature.setStyle(polyStyle);
                features.push(polyFeature);
            }
            if (features.length > 0) {
                var extent = features[0].getGeometry().getExtent();
                vectorLayer.getSource().clear();
                vectorLayer.getSource().addFeatures(features);
                map.getView().fitExtent(extent, map.getSize());
                map.render();
            }
        };
        if (item) {
            zoomMapExtentToFeatures(item.geometry, item.boundBox);
        }
    });
});



