$(document).ready(function () {

    var target = "yoda-map";
    var baseURL = location.protocol + '//' + location.host + location.pathname;

    $(".content-page").html($("#yoda-map"));
    $("#yoda-map").append(`
        <div class="ol-control-widget ol-widget btn-group ol-toggle-options ol-unselectable"></div>
        <div class="ol-hover-data-widget ol-widget ol-toggle-options ol-unselectable" style="display: none;">
            <div class="ol-hover-data-widget-close">
                <div class="ol-hover-data-widget-close-icon text-primary mdi mdi-close">
                </div>
            </div>
            <div class="ol-hover-data-widget-content"></div>
        </div>
        <div class="ol-filter-widget ol-widget ol-toggle-options ol-unselectable" style="display: none;"></div>
        <div class="ol-legend-widget ol-widget ol-toggle-options ol-unselectable" style="display: none;"></div>
    `);
    $(".ol-hover-data-widget-close").click(function () { $(".ol-hover-data-widget").hide() });

    var yodaMapLayers = $("#yoda-map").data("layers");
    var mapView = new ol.View($("#yoda-map").data("view-config"));
    var backgrounds = $("#yoda-map").data("backgrounds");
    var defBackground = $("#yoda-map").data("default-background");
    console.log(yodaMapLayers);

    var frontGroundLayers = [];
    yodaMapLayers.forEach(function (layer) {
        if (layer.LayerType == "GeometryLayer") {
            frontGroundLayers.push({ subLayers: [createEmptyVectorLayer(layer.LayerName)], text: layer.LayerText, name: layer.LayerName });
        }
        if (layer.LayerType == "GeoserverLayer") {
            frontGroundLayers.push({ subLayers: [createRasterLayer(layer.GeoserverData.GeoserverUrl, layer.GeoserverData.GeoserverLayerName)], text: layer.LayerText, name: layer.LayerName });
        }
    });

    var mapLayers = [];

    var backGroundLayers = [];
    var backGroundLayersLegend = [];
    backgrounds.forEach(function (background) {
        var layer = layersLib.getLayer(background);
        backGroundLayers.push({ subLayers: [layer], text: layer.text, name: layer.name });
    });
    backGroundLayers.forEach(function (layer) {

        layer.subLayers.forEach(function (itemLayer) {
            mapLayers.push(itemLayer);
        });
        backGroundLayersLegend.push({
            text: layer.text,
            name: layer.name,
            subLayers: layer.subLayers
        });

    })
    SetFirstBackgroundLayer(backGroundLayersLegend, defBackground);

    var frontGroundLayersLegend = [];
    frontGroundLayers.forEach(function (layer) {

        layer.subLayers.forEach(function (itemLayer) {
            mapLayers.push(itemLayer);
        });
        frontGroundLayersLegend.push({
            text: layer.text,
            name: layer.name,
            subLayers: layer.subLayers
        });

    })

    var CustomOnChange = function (target, legendName, prevLayer, currLayer) {
        ConfirmFilterData(target, mapView, yodaMapLayers, frontGroundLayers, baseURL, currLayer);
    };

    var map = new ol.Map({
        controls: ol.control.defaults({ rotate: false }).extend([
            new ol.control.FullScreen(),
            new controlsLib.ChooseLayersControl({
                mapId: target,
                iconClass: "mdi mdi-layers-triple-outline",
                legendName: "FrontGroundLayersLegend",
                legend: frontGroundLayersLegend,
                customOnChange: CustomOnChange
            }),
            new controlsLib.ChooseLayersControl({
                mapId: target,
                iconClass: "mdi mdi-layers-triple",
                legendName: "BackGroundLayersLegend",
                iconTitle: "Выбор подложек",
                legend: backGroundLayersLegend
            })
        ]),
        interactions: ol.interaction.defaults({ altShiftDragRotate: false, pinchRotate: false }),
        target: target,
        layers: mapLayers,
        view: mapView
    });

    RestructControls(yodaMapLayers);

    map.on('pointermove', function (e) {
        OnPointerMove(map, e, yodaMapLayers);
    });

    map.on('click', function (e) {
        OnClick(map, e, yodaMapLayers);
    });
});

function SetFirstBackgroundLayer(backGroundLayersLegend, defBackground) {
    var indexOfNeedLayer = -1;
    var needLayer = null;
    backGroundLayersLegend.forEach(function (layer, index) {
        if (layer.name == defBackground) {
            indexOfNeedLayer = index;
            needLayer = Object.assign(layer);
        }
    });

    if (indexOfNeedLayer >= 0 && needLayer != null) {
        var copyOfFirstLayer = Object.assign(backGroundLayersLegend[0]);
        backGroundLayersLegend[0] = needLayer;
        backGroundLayersLegend[indexOfNeedLayer] = copyOfFirstLayer;
    }
}

function ConfirmFilterData(target, mapView, yodaMapLayers, frontGroundLayers, baseURL, currLayer) {
    yodaMapLayers.forEach(function (layer) {
        if (layer.LayerName == currLayer) {
            if (layer.LayerType == "GeometryLayer") {
                $.ajax({
                    url: `${baseURL}?MenuAction=GetData&MapLayerName=${currLayer}`,
                    success: function (result) {
                        frontGroundLayers.forEach(function (frontGroundLayer) {
                            if (frontGroundLayer.name == currLayer) {
                                frontGroundLayer.subLayers.forEach(function (subLayer) {
                                    if (subLayer.name == currLayer) {
                                        var source = subLayer.getSource();
                                        source.clear();
                                        result.forEach(function (resultItem) {
                                            var regionPoint = createFeature(resultItem.WKT, resultItem.FillColor, resultItem.BorderSize, resultItem.BorderColor, resultItem.Radius, resultItem.HoverTemplate, resultItem.ClickRedirectUrl);
                                            source.addFeature(regionPoint);
                                        });
                                        subLayer.setSource(source);
                                        //mapView.fit(source.getExtent(), [100, 100, 100, 100]);
                                    }
                                });
                            }
                        });
                        console.log(result);
                    },
                    error: function (xhr, status) {
                    }
                });
            }
            if (layer.LayerType == "GeoserverLayer") {

            }
        }
    });
}

function RestructControls(yodaMapLayers) {

    var hasFilters = yodaMapLayers.some(function (yodaMapLayer) { yodaMapLayer.Filter != null });
    var hasLegends = yodaMapLayers.some(function (yodaMapLayer) { yodaMapLayer.Legend != null });


    $(".ol-zoom-in").appendTo(".ol-control-widget");
    $(".ol-zoom-in").addClass("btn btn-primary ol-control-btn");
    $(".ol-zoom-out").appendTo(".ol-control-widget");
    $(".ol-zoom-out").addClass("btn btn-primary ol-control-btn");
    if (hasFilters) {
        $(".ol-control-widget").append('<button type="button" class="btn btn-primary ol-control-btn ol-filter mdi mdi-filter-outline" title="Фильтр слоя"></button>');
    }
    if (hasLegends) {
        $(".ol-control-widget").append('<button type="button" class="btn btn-primary ol-control-btn ol-legend mdi mdi-information-outline" title="Легенда слоя"></button>');
    }
    $(".ol-choose-layer").appendTo(".ol-control-widget");
    $(".ol-choose-layer").addClass("btn btn-primary ol-control-btn");
    $(".ol-full-screen-false").appendTo(".ol-control-widget");
    $(".ol-full-screen-false").addClass("btn btn-primary ol-control-btn");
    $(".ol-full-screen").remove();
    $(".choose-layers").hide();
    $(".ol-zoom").remove();
    $(".ol-attribution").remove();
}

function DrawLegend(yodaMapLayers) {

    var hasFilters = yodaMapLayers.some(function (yodaMapLayer) { yodaMapLayer.Filter != null });
    var hasLegends = yodaMapLayers.some(function (yodaMapLayer) { yodaMapLayer.Legend != null });


    $(".ol-zoom-in").appendTo(".ol-control-widget");
    $(".ol-zoom-in").addClass("btn btn-primary ol-control-btn");
    $(".ol-zoom-out").appendTo(".ol-control-widget");
    $(".ol-zoom-out").addClass("btn btn-primary ol-control-btn");
    if (hasFilters) {
        $(".ol-control-widget").append('<button type="button" class="btn btn-primary ol-control-btn ol-filter mdi mdi-filter-outline" title="Фильтр слоя"></button>');
    }
    if (hasLegends) {
        $(".ol-control-widget").append('<button type="button" class="btn btn-primary ol-control-btn ol-legend mdi mdi-information-outline" title="Легенда слоя"></button>');
    }
    $(".ol-choose-layer").appendTo(".ol-control-widget");
    $(".ol-choose-layer").addClass("btn btn-primary ol-control-btn");
    $(".ol-full-screen-false").appendTo(".ol-control-widget");
    $(".ol-full-screen-false").addClass("btn btn-primary ol-control-btn");
    $(".ol-full-screen").remove();
    $(".choose-layers").hide();
    $(".ol-zoom").remove();
    $(".ol-attribution").remove();
}

function OnPointerMove(map, e, yodaMapLayers) {
    $(".ol-hover-data-widget").hide();
    var currLayer = window.ol.maps[map.getTarget()]["FrontGroundLayersLegend"].currLayer;
    map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        if (layer.name == currLayer) {
            yodaMapLayers.forEach(function (yodaMapLayer) {
                if (yodaMapLayer.LayerName == currLayer && feature && feature.get('hoverTemplate') != null) {
                    var hoverTemplate = feature.get('hoverTemplate');
                    $(".ol-hover-data-widget-content").html(hoverTemplate.TemplateHtml);

                    $(".ol-hover-data-widget").removeClass("bottom-right");
                    $(".ol-hover-data-widget").removeClass("bottom-left");
                    $(".ol-hover-data-widget").removeClass("top-right");
                    $(".ol-hover-data-widget").removeClass("top-left");
                    
                    var position = "";
                    switch (hoverTemplate.PositionString) {
                        case 'BottomLeft':
                            position = "bottom-left";
                            break;
                        case 'TopRight':
                            position = "top-right";
                            break;
                        case 'TopLeft':
                            position = "top-left";
                            break;
                        default:
                            position = "bottom-right";
                            break;
                    }
                    $(".ol-hover-data-widget").addClass(position);
                    $(".ol-hover-data-widget").show();
                }
            });
        }
    });
}

function OnClick(map, e, yodaMapLayers) {
    $(".ol-hover-data-widget").hide();
    var currLayer = window.ol.maps[map.getTarget()]["FrontGroundLayersLegend"].currLayer;
    yodaMapLayers.forEach(function (yodaMapLayer) {
        if (yodaMapLayer.LayerName == currLayer) {
            if (yodaMapLayer.LayerType == "GeometryLayer") {
                map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
                    if (layer.name == currLayer) {
                        if (feature) {
                            if (yodaMapLayer.LayerActions.indexOf("RedirectOnClick") > -1) {
                                var clickRedirectUrl = feature.get('clickRedirectUrl');
                                var win = window.open(clickRedirectUrl, '_blank');
                                if (win) {
                                    //Browser has allowed it to be opened
                                    win.focus();
                                } else {
                                    //Browser has blocked it
                                    //alert('Разрешите сайту открывать новые вкладки');
                                }
                            }
                            if (yodaMapLayer.LayerActions.indexOf("GetClickData") > -1) {
                            }
                        }
                    }
                });
            }
            if (yodaMapLayer.LayerType == "GeoserverLayer" && yodaMapLayer.LayerActions.indexOf("GetClickData") > -1) {
            }
        }
    });
}