$(document).ready(function () {
    $(".web-map").each(function() {
        var cfg = gisLayers;

        var $map = $(this);
        $map.addClass("web-map-control");

       
        var mapWmsUrl = cfg.mapWmsUrl;
        var searchFeaturesUrl = $map.attr("search-features-url");
        
        var searchOrgsUrl = $map.attr("search-orgs-url");
        var identifyOrgsUrl = $map.attr("identify-orgs-url");
        

        var loadAdrRegistryTreeUrl = $map.attr("load-adr-registry-tree-url");
        var loadArBindedItemsUrl = $map.attr("get-ar-binded-items-url");
        var initialMapExtentGeomWkt = $map.attr("initial-map-extent-geometry-wkt");

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
            zoom: 14,
            projection: gisLayers.defaultSrsName,
            extent: gisLayers.mapBounds,
            minZoom: gisLayers.minZoom,
            maxZoom: gisLayers.maxZoom
        });
        
        var arBindingControl = new app.AdrRegistryMappingControl2({
                baseLayer: schemaLayer,
                readonly: true,
                loadAdrRegistryTreeUrl: loadAdrRegistryTreeUrl,
                loadArBindedItemsUrl: loadArBindedItemsUrl,
                identifyObjectByCoord: function (){ return [];},
                onBindingEnd: function() { },
                getCurLayers: function () {
                    return [gisLayers.builds,gisLayers.roads,gisLayers.settlements];
                }
            });

        var map = new ol.Map({
            controls: [
                new app.ZoomControl(),
                new app.SearchFeaturesControl({ searchFeaturesUrl: searchFeaturesUrl }),
                new app.SearchOrgsControl({ searchOrgsUrl: searchOrgsUrl }),
                new app.ChooseLayersControl({
                    legend: [
                        { text: "Схема", layers: [schemaLayer] }
                    ]
                }),
                new app.IdentifyControl({ mapWmsUrl: mapWmsUrl, identifyOrgsUrl: identifyOrgsUrl}),
                new app.MousePositionControl($map[0]),
                new app.MeasureLengthControl(),
                new app.MeasureAreaControl(),
                new app.PrintControl({ mapWmsUrl: mapWmsUrl, center:view.getCenter(), zoom :view.getZoom(), layers:layers }),
                arBindingControl
            ],
            layers: layers,
            target: $map[0],
            view: view,
            logo:false
        });
        if (initialMapExtentGeomWkt) {
            var initialMapExtentVectorSource = new ol.source.Vector({
                projection: gisLayers.defaultSrsName,
            });

            var initialMapExtentVectorLayer = new ol.layer.Vector({
                source: initialMapExtentVectorSource,
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
            map.addLayer(initialMapExtentVectorLayer);
            var wktConvert = new ol.format.WKT();
            var geom = wktConvert.readGeometry(initialMapExtentGeomWkt);
            var extent = geom.getExtent();
            initialMapExtentVectorSource.clear();
            initialMapExtentVectorSource.addFeatures([new ol.Feature({ geometry: geom })]);
            map.getView().fitExtent(extent, map.getSize());
            map.render();
        };
    });
});