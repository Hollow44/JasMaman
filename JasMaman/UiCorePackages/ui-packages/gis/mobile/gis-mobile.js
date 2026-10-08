var map, vectorLayer;
function SetObjectsOnMap(dataJson) {
    /*
    data = [];
    var item = {
        objectType:'me',// object
        lattitude:71.35,
        longitude:56.32
    };
    */
    if (map == null) {
        alert('Не найдена карта');
        return;
    }
    if (vectorLayer == null) {
        alert('Не найден слой');
        return;
    }
    if (dataJson == null) {
        alert('Данные не найдены');
        return;
    }

    var getFeature = function(featureAttrs) {
        var resultText = 'ok';
        var feature = undefined;
        if (featureAttrs.lattitude == null || featureAttrs.longitude == null || featureAttrs.objectType == null || (featureAttrs.objectType != 'me' && featureAttrs.objectType != 'object')) {
            resultText = 'error';
        }
        if (resultText == 'ok') {
            var coords = ol.proj.transform([featureAttrs.longitude, featureAttrs.lattitude], 'EPSG:4326', gisLayers.defaultSrsName);
            var geom = new ol.geom.Point(coords);
            feature = new ol.Feature(geom);
            var meIconPath = filesRootDir + "Plugins/Gis/Content/marker-me.png";
            var objectIconPath = filesRootDir + 'Plugins/Gis/Content/marker-object.png';
            //featureAttrs.objectType == 'object' ? '#3399CC' : '#eb33aa';
            
            var iconStyle = new ol.style.Style({
                image: new ol.style.Icon(({
                    anchor: [0.5, 46],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    opacity: 0.75,
                    src: featureAttrs.objectType == 'object' ? objectIconPath : meIconPath
                }))
            });
            feature.setStyle(iconStyle);
        }
        var result = {
            resultText: resultText,
            feature: feature
        };
        return result;
    };

    var data = JSON.parse(dataJson);
    if (data != null && data.length > 0) {
        var vectorSource = vectorLayer.getSource();
        vectorSource.clear();
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            if (item == null) {
                alert('объект не найден. (JSON parse failed)');
                return;
            }
            var result = getFeature(item);
            if (result.resultText == 'error') {
                alert('Неправильный формат данных. (JSON parse failed)');
                return;
            }
            vectorSource.addFeature(result.feature);
        }
        var view = map.getView();
        var extent = vectorSource.getExtent();
        view.fitExtent(extent, map.getSize());
        if (data.length > 1) {
            view.setZoom(17);
        }
        map.refreshLayers();
    }
};

$(document).ready(function () {
    $(".mobile-map").each(function() {
        var cfg = gisLayers;

        var $map = $(this);
        $map.addClass("mobile-map-control");

        var mapWmsUrl = cfg.mapWmsUrl;

        var schemaLayer = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: mapWmsUrl,
                params: { 'LAYERS': gisLayers.schematicFull, 'srs': gisLayers.defaultSrsName },//ast_osm_full -> kz
                projection: gisLayers.defaultSrsName,
                crossOrigin: 'anonymous'
            }),
        });

        var layers = [
            schemaLayer
        ];

        var view = new ol.View({
            center: [7951138.85194, 6617835.78100],
            zoom: 17,
            projection: gisLayers.defaultSrsName,
            extent: gisLayers.mapBounds,
            minZoom: gisLayers.minZoom,
            maxZoom: gisLayers.maxZoom
        });

        var mobileControls = [new app.ZoomControl()];

        $("html body").removeAttr("style");
        $('html body .mobile-map').css({ 'margin': '0', 'padding': '0', 'width': '100%', 'height': $(window).height() });
        $('body').css({ 'min-width': 'auto' });
        $('body').css({ 'min-height': 'auto' });
        $('#text').css({ 'min-height': 'auto' });
        var target = $('.mobile-map').show();
        target = target.add(target.parentsUntil('body')).siblings().hide();

        /*
        var paramsResult = GetUrlParams();
        if (paramsResult.count > 0) {
            var coords = ol.proj.transform([parseFloat(paramsResult.coordinateParams["lattitude"]), parseFloat(paramsResult.coordinateParams["longitude"])], 'EPSG:4326', gisLayers.defaultSrsName);
            var geom = new ol.geom.Point(coords);
            var feature = new ol.Feature(geom);
            feature.setStyle(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({
                        color: '#3399CC'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 2
                    })
                })
            }));

            var vectorSource = new ol.source.Vector({
                features: [feature],
                projection: gisLayers.defaultSrsName
            });

            vectorLayer = new ol.layer.Vector({
                source: vectorSource,
                style: new ol.style.Style({
                    fill: new ol.style.Fill({ color: 'blue' }),
                    stroke: new ol.style.Stroke({
                        color: 'red',
                        width: 10
                    })
                })
            });
            layers.push(vectorLayer);
            view.setCenter(coords);
        }
        */

        var vectorSource = new ol.source.Vector({
            projection: gisLayers.defaultSrsName
        });

        vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: new ol.style.Style({
                fill: new ol.style.Fill({ color: 'blue' }),
                stroke: new ol.style.Stroke({
                    color: 'red',
                    width: 10
                })
            })
        });
        layers.push(vectorLayer);
        map = new ol.Map({
            controls: mobileControls,
            layers: layers,
            target: $map[0],
            view: view,
            logo: false
        });

        window.onresize = function() {
            $('html body .mobile-map').css({ 'margin': '0', 'padding': '0', 'width': '100%', 'height': $(window).height() });
            $('body').css({ 'min-width': 'auto' });
            $('body').css({ 'min-height': 'auto' });
            $('#text').css({ 'min-height': 'auto' });
            map.updateSize();
        };
    });
});