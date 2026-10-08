function createEmptyVectorLayer(name) {
    var vectorSource = new ol.source.Vector({
        features: []
    });
    var vectorLayer = new ol.layer.Vector({
        source: vectorSource
    });

    vectorLayer.name = name;

    return vectorLayer;
}

function createRasterLayer(geoserver, layer) {
    var rasterLayer = new ol.layer.Tile({
        preload: Infinity,
        source: new ol.source.TileWMS({
            url: geoserver,
            params: {
                FORMAT: 'image/png',
                VERSION: '1.1.1',
                tiled: true,
                LAYERS: `service:${layer}`,
                exceptions: "application/vnd.ogc.se_inimage",
                tilesOrigin: 5564899.8761452 + "," + 4949441.58291756
            }
        })
    });
    return rasterLayer;
}

window.layersLib = {};
layersLib = window.layersLib;
layersLib["osm"] = function () {
    var ret = new ol.layer.Tile({
        preload: Infinity,
        source: new ol.source.OSM()
    });
    ret.text = "OSM светлый";
    ret.name = "osm";
    return (ret);
};
layersLib["osmGray"] = function () {
    var ret = new ol.layer.Tile({
        preload: Infinity,
        source: new ol.source.XYZ({
            url: 'https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
            attributions: 'Map Tiles &copy; ' + new Date().getFullYear() + ' ' +
                '<a href="http://developer.here.com">HERE</a>'
        })
    });
    ret.text = "OSM серый";
    ret.name = "osmGray";
    return (ret);
};
layersLib["osmDark"] = function () {
    var ret = new ol.layer.Tile({
        className: "bg-white",
        preload: Infinity,
        source: new ol.source.OSM({ "url": "http://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" }),
        opacity: 0.8
    });
    ret.text = "OSM тёмный";
    ret.name = "osmDark";
    return (ret);
};
layersLib["google"] = function () {
    var ret = new ol.layer.Tile({
        preload: Infinity,
        source: new ol.source.XYZ({ url: 'https://mt{0-3}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' })
    });
    ret.text = "Google";
    ret.name = "google";
    return (ret);
};
layersLib["airbus"] = function () {
    var apiKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI2OGUwM2RiYy1jNmU1LTQzYmQtYjU2YS1lNmFlNjM0OTI2ZjMiLCJhdWQiOiJodHRwczovL29uZWF0bGFzLmRhdGFkb29ycy5uZXQvaWQvcmVzb3VyY2VzIiwiaWRwIjoiVUNBX0FERlMiLCJhdXRoX3RpbWUiOjE2MDYzOTgwMjIsImFtciI6ImV4dGVybmFsIiwic2NvcGUiOlsib3BlbmlkIiwicHJvZmlsZSIsImVtYWlsIiwicm9sZXMiLCJyZWFkIiwid3JpdGUiXSwiaXNzIjoiaHR0cHM6Ly9vbmVhdGxhcy5kYXRhZG9vcnMubmV0L2lkIiwiZXhwIjoxNjM4MTA2ODIyLCJjbGllbnRfaWQiOiJwdGVzdF9leGFtcGxlXzEifQ.cAZLoWDeVT3Su2c3vrk4wWCEYUjzY4-S7U13sf7QFLZbozByvUC7-1eZS6oH7LM6BqAURMsw2TjOskuNfYnBWXjYF5sWgTZ7jvKwlp-oEliqBTOwOkhinihuFwPxOLtS7bnCb3ASmrnHpMBYm2xnqyTJLT8KuB6FWPbkcSJYpJI7JYL_3DsbSLd5JJTtQKLt73bjAL4v1J6pNjBSGkv1yrHuuudqyW93wxyI0X4E3zFMgYd_v-73Uza1lTE8AksR1AIK5oE8luHP3g7eNhwx4IRUkkqcwwuz1l3mbws8x6ujo63k-5Esk25nuaCNzEKdmPEwSzOaVbEuobBWmJQFOA";
    var WMTSUrl = "https://view.geoapi-airbusds.com/api/v1/map/imagery.wmts";
    var projection = ol.proj.get('EPSG:3857');
    var projectionExtent = projection.getExtent();
    var size = (ol.extent.getWidth(projectionExtent)) / 256;
    var resolutions = Array.from(Array(18), (item, index) => size / Math.pow(2, index));
    var matrixIds = Array.from(Array(18), (item, index) => index);

    var ret = new ol.layer.Tile({
        preload: Infinity,
        source: new ol.source.OneAtlas({
            url: WMTSUrl,
            format: 'image/png',
            matrixSet: "3857",
            tileGrid: new ol.tilegrid.WMTS({
                origin: ol.extent.getTopLeft(projectionExtent),
                resolutions: resolutions,
                matrixIds: matrixIds
            }),
            apiKey: apiKey
        })
    });
    ret.text = "Airbus Basemap";
    ret.name = "airbus";
    return ret;
};

layersLib.getLayer = function (name) {
    var layers = layersLib;
    return layers[name]();
};

layersLib.layerStores = {
    defaultStoreCode: "geoserver1",

    geoserver1: {
        type: "geoserver",
        baseUrl: "https://maps.qoldau.kz/gs1"
    },
    geoserver2: {
        type: "geoserver",
        baseUrl: "https://maps.qoldau.kz/gs2"
    },
    geoserver4: {
        type: "geoserver",
        baseUrl: "https://maps.qoldau.kz/gs4"
    },
    geoserver8: {
        type: "geoserver",
        baseUrl: "https://maps.qoldau.kz/gs3"
    },
    geoserver9: {
        type: "geoserver",
        baseUrl: "https://maps.qoldau.kz/gs4"
    },
    geoserver10: {
        type: "geoserver",
        baseUrl: "https://maps.qoldau.kz/gs6"
    },
    geoserver20: {
        type: "geoserver",
        baseUrl: "https://maps.qoldau.kz/gs20"
    },
    geoserver21: { //2021
        type: "geoserver",
        baseUrl: "https://maps.qoldau.kz/gs21"
    },
    filestore1: {
        type: "filestore",
        baseUrl: "https://maps.qoldau.kz/fs1/"
    },
    filestore2: {
        type: "filestore",
        baseUrl: "https://maps.qoldau.kz/fs2/"
    },
    airbus1: {
        type: "airbus",
        baseUrl: "https://maps.qoldau.kz/airbus1/"
    }
}