$(document).ready(function () {

    window.layersLib = {};
    window.layersLib;
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

    InitYodaGeomRenderers();

});

function InitYodaGeomRenderers() {
    $(".yoda-geom-renderer").each(function () {
        var $this = $(this);
        var geomRendererInputId = `${$this.attr("id-input")}`;
        var wkt = $this.attr("wkt");
        var hasValue = wkt != null && wkt.length > 0;
        $this.html(`<input id="${geomRendererInputId}" name="${geomRendererInputId}" class="d-none"></input>`);
        $(`#${geomRendererInputId}`).val(wkt);
        var geomRendererId = `${$this.attr("id")}`;
        var srid = $this.attr("srid");
        var strokeWidth = parseInt($this.attr("strokeWidth"));
        var strokeColor = $this.attr("strokeColor");
        var fillColor = $this.attr("fillColor");
        var radius = parseInt($this.attr("radius"));
        var background = $this.attr("background");
        var rounded = $this.attr("rounded") == "True";
        var setZoom = parseInt($this.attr("setZoom"));
        var setMinZoom = parseInt($this.attr("setMinZoom"));
        var setMaxZoom = parseInt($this.attr("setMaxZoom"));
        var canMove = $this.attr("canMove") == "True";
        var readOnly = $this.attr("geomReadOnly") == "True";
        var geomType = $this.attr("geomType");

        function createWktFeature(wkt, srid) {
            var format = new ol.format.WKT();

            var feature = format.readFeature(wkt, {
                dataProjection: 'EPSG:' + srid,
                featureProjection: 'EPSG:3857',
            });

            return feature;

        }
        function createStyles(strokeWidth, strokeColor, fillColor, radius) {
            var fill = new ol.style.Fill({
                color: fillColor
            });
            var stroke = new ol.style.Stroke({
                color: strokeColor,
                width: strokeWidth
            });
            var styles = [
                new ol.style.Style({
                    fill: fill,
                    stroke: stroke,
                    image: new ol.style.Circle({
                        fill: fill,
                        stroke: stroke,
                        radius: radius
                    }),
                })
            ];
            styles[ol.geom.Polygon] = [
                new ol.style.Style({
                    fill: fill
                })
            ];
            styles[ol.geom.MultiPolygon] = styles[ol.geom.Polygon];
            styles[ol.geom.LineString] = [
                new ol.style.Style({
                    stroke: stroke
                }),
                new ol.style.Style({
                    stroke: stroke
                })
            ];
            styles[ol.geom.MultiLineString] = styles[ol.geom.LineString];
            styles[ol.geom.Point] = [
                new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: radius,
                        fill: fill,
                        stroke: stroke
                    }),
                    zIndex: Infinity
                })
            ];
            styles[ol.geom.MultiPoint] = styles[ol.geom.Point];
            styles[ol.geom.GeometryCollection] = styles[ol.geom.Polygon].concat(
                styles[ol.geom.LineString],
                styles[ol.geom.Point]
            );
            return styles;
        }

        var styles = createStyles(strokeWidth, strokeColor, fillColor, radius);
        var layers = [];
        if (background != "none") {
            var backgroundLayer = window.layersLib[background]();
            layers.push(backgroundLayer);
        }
        var vectorSource = new ol.source.Vector({
            features: hasValue ? [createWktFeature(wkt, srid)] : [],
        });
        var vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: styles
        });
        layers.push(vectorLayer);

        var map = new ol.Map({
            controls: [],
            target: geomRendererId,
            layers: layers,
            view: (canMove || !readOnly) ? hasValue ? new ol.View({}) : new ol.View({ center: [7951137.118857781, 6651040.097882961] }) : new ol.View({}) // медаль тому кто починит --- new ol.View({ extent: ol.extent.buffer(vectorLayer.getSource().getExtent(), 10) })
        });

        if (hasValue) {
            map.getView().fit(vectorLayer.getSource().getExtent(), map.getSize());
        }

        if (setMaxZoom > 0) {
            map.getView().setMaxZoom(setMaxZoom);
        }
        if (setMinZoom > 0) {
            map.getView().setMinZoom(setMinZoom);
        }
        map.getView().setZoom(setZoom ?? setMinZoom ?? 1);

        if (rounded) {
            $this.children().addClass('rounded');
        }

        if (geomType != "Point" && hasValue) {
            map.getView().fit(vectorLayer.getSource().getExtent(), map.getSize());
        }

        if (!readOnly) {
            $(`#${geomRendererId}`).append(`
                <div class="ol-toggle-options ol-unselectable ${geomRendererId}-geom-type" style="position: absolute; top: 10px; right: 10px;">
                    <select class="form-control ${geomRendererId}-geom-type-input" id="example-select">
                        <option value="Polygon" selected>Полигон</option>
                        <option value="Point">Точка</option>
                    </select>
                </div>
            `);
            if (geomType != "Geometry") {
                $(`.${geomRendererId}-geom-type`).hide();
            }

            //жёлтый +
            var polygonInteraction = new ol.interaction.Draw({
                type: 'Polygon',
                source: vectorLayer.getSource(),
                style: createStyles(strokeWidth, '#ffbc00', '#ffbc00' + '50', radius)
            });
            polygonInteraction.setActive(false);
            polygonInteraction.on('drawend', function (e) {
                setTimeout(function () {

                    var selected_collection = selectSingleInteraction.getFeatures();
                    selected_collection.clear();
                    selected_collection.push(e.feature);

                    polygonInteraction.setActive(false);
                    pointInteraction.setActive(false);
                    modifyInteraction.setActive(false);
                    translateInteraction.setActive(true);
                    selectSingleInteraction.setActive(true);
                    selectDoubleInteraction.setActive(true);
                }, 100);
            });
            map.addInteraction(polygonInteraction);

            //жёлтый +
            var pointInteraction = new ol.interaction.Draw({
                type: 'Point',
                source: vectorLayer.getSource(),
                style: createStyles(strokeWidth, '#ffbc00', '#ffbc00' + '50', radius)
            });
            pointInteraction.setActive(false);
            pointInteraction.on('drawend', function (e) {
                setTimeout(function () {

                    var selected_collection = selectSingleInteraction.getFeatures();
                    selected_collection.clear();
                    selected_collection.push(e.feature);

                    polygonInteraction.setActive(false);
                    pointInteraction.setActive(false);
                    modifyInteraction.setActive(false);
                    translateInteraction.setActive(true);
                    selectSingleInteraction.setActive(true);
                    selectDoubleInteraction.setActive(true);
                }, 100);
            });
            map.addInteraction(pointInteraction);

            //зелёный +
            var selectSingleInteraction = new ol.interaction.Select({
                condition: ol.events.condition.singleClick,
                //features: vectorLayer.getSource().getFeatures(),
                wrapX: false,
                style: createStyles(strokeWidth, '#0acf97', '#0acf97' + '50', radius)
            });
            selectSingleInteraction.setActive(true);
            map.addInteraction(selectSingleInteraction);

            //розовый +
            var selectDoubleInteraction = new ol.interaction.Select({
                condition: ol.events.condition.doubleClick,
                //features: vectorLayer.getSource().getFeatures(),
                wrapX: false,
                style: createStyles(strokeWidth, '#ff679b', '#ff679b' + '50', radius)
            });
            selectDoubleInteraction.setActive(true);
            map.addInteraction(selectDoubleInteraction);

            var selected_collection = selectSingleInteraction.getFeatures();
            selected_collection.clear();
            selected_collection.push(new ol.Feature());
            var selected_double_collection = selectDoubleInteraction.getFeatures();
            selected_double_collection.clear();
            selected_double_collection.push(new ol.Feature());

            selectSingleInteraction.on('select', function (e) {
                //alert("change single");
                if (e.target.getFeatures().getLength() > 0) {
                    modifyInteraction.setActive(false);
                    translateInteraction.setActive(true);
                    selectSingleInteraction.setActive(true);
                    selectDoubleInteraction.setActive(true);
                    polygonInteraction.setActive(false);
                    pointInteraction.setActive(false);
                    var selected_double_collection = selectDoubleInteraction.getFeatures();
                    selected_double_collection.clear();
                    selected_double_collection.push(new ol.Feature());
                } else {
                    modifyInteraction.setActive(false);
                    translateInteraction.setActive(false);
                    selectSingleInteraction.setActive(true);
                    selectDoubleInteraction.setActive(true);
                    polygonInteraction.setActive(false);
                    pointInteraction.setActive(false);
                    var selected_collection = selectSingleInteraction.getFeatures();
                    selected_collection.clear();
                    selected_collection.push(new ol.Feature());
                    var selected_double_collection = selectDoubleInteraction.getFeatures();
                    selected_double_collection.clear();
                    selected_double_collection.push(new ol.Feature());
                }
            });
            selectDoubleInteraction.on('select', function (e) {
                //alert("change double");
                if (e.target.getFeatures().getLength() == 1) {
                    modifyInteraction.setActive(true);
                    translateInteraction.setActive(false);
                    selectSingleInteraction.setActive(true);
                    selectDoubleInteraction.setActive(true);
                    polygonInteraction.setActive(false);
                    pointInteraction.setActive(false);
                    var selected_collection = selectSingleInteraction.getFeatures();
                    selected_collection.clear();
                    selected_collection.push(new ol.Feature());
                } else {
                    if (
                        geomType == "MultiPolygon"
                        ||
                        (geomType == "Geometry" && $(`.${geomRendererId}-geom-type-input`).val() == "Polygon")
                        ||
                        (geomType == "Polygon" && vectorLayer.getSource().getFeatures().length == 0)
                    ) {
                        modifyInteraction.setActive(false);
                        translateInteraction.setActive(false);
                        selectSingleInteraction.setActive(false);
                        selectDoubleInteraction.setActive(false);
                        polygonInteraction.setActive(true);
                        var selected_collection = selectSingleInteraction.getFeatures();
                        selected_collection.clear();
                        selected_collection.push(new ol.Feature());
                        var selected_double_collection = selectDoubleInteraction.getFeatures();
                        selected_double_collection.clear();
                        selected_double_collection.push(new ol.Feature());
                    } else if (
                        (geomType == "Geometry" && $(`.${geomRendererId}-geom-type-input`).val() == "Point")
                        ||
                        (geomType == "Point" && vectorLayer.getSource().getFeatures().length == 0)
                    ) {
                        modifyInteraction.setActive(false);
                        translateInteraction.setActive(false);
                        selectSingleInteraction.setActive(false);
                        selectDoubleInteraction.setActive(false);
                        pointInteraction.setActive(true);
                        var selected_collection = selectSingleInteraction.getFeatures();
                        selected_collection.clear();
                        selected_collection.push(new ol.Feature());
                        var selected_double_collection = selectDoubleInteraction.getFeatures();
                        selected_double_collection.clear();
                        selected_double_collection.push(new ol.Feature());
                    } else {
                        modifyInteraction.setActive(false);
                        translateInteraction.setActive(false);
                        selectSingleInteraction.setActive(true);
                        selectDoubleInteraction.setActive(true);
                        polygonInteraction.setActive(false);
                        pointInteraction.setActive(false);
                        var selected_collection = selectSingleInteraction.getFeatures();
                        selected_collection.clear();
                        selected_collection.push(new ol.Feature());
                        var selected_double_collection = selectDoubleInteraction.getFeatures();
                        selected_double_collection.clear();
                        selected_double_collection.push(new ol.Feature());
                    }
                }
            });

            //синий
            var modifyInteraction = new ol.interaction.Modify({
                features: selectDoubleInteraction.getFeatures(),
                style: createStyles(strokeWidth, '#2c8ef8', '#2c8ef8' + '50', radius)
            });
            modifyInteraction.setActive(false);
            map.addInteraction(modifyInteraction);

            //фиолетовый
            var translateInteraction = new ol.interaction.Translate({
                features: selectSingleInteraction.getFeatures(),
                style: createStyles(strokeWidth, '#727cf5', '#727cf5' + '50', radius)
            });
            translateInteraction.setActive(false);
            map.addInteraction(translateInteraction);



            var snapInteraction = new ol.interaction.Snap({
                source: vectorLayer.getSource(),
                style: styles
            });
            snapInteraction.setActive(true);
            map.addInteraction(snapInteraction);

            map.getViewport().addEventListener('contextmenu', function (e) {
                e.preventDefault();
                modifyInteraction.setActive(false);
                translateInteraction.setActive(false);
                selectSingleInteraction.setActive(true);
                selectDoubleInteraction.setActive(true);
                polygonInteraction.setActive(false);
                pointInteraction.setActive(false);
                var selected_collection = selectSingleInteraction.getFeatures();
                selected_collection.clear();
                selected_collection.push(new ol.Feature());
                var selected_double_collection = selectDoubleInteraction.getFeatures();
                selected_double_collection.clear();
                selected_double_collection.push(new ol.Feature());
            });
            map.getViewport().addEventListener('mousedown', function (e) {
                if (e.which == 2) {
                    e.preventDefault();

                    var selected = selectSingleInteraction.getFeatures();
                    selected.forEach(function (feature) {
                        if (feature.getGeometry()) {
                            vectorLayer.getSource().removeFeature(feature);
                        }
                    });

                    modifyInteraction.setActive(false);
                    translateInteraction.setActive(false);
                    selectSingleInteraction.setActive(true);
                    selectDoubleInteraction.setActive(true);
                    polygonInteraction.setActive(false);
                    pointInteraction.setActive(false);
                    var selected_collection = selectSingleInteraction.getFeatures();
                    selected_collection.clear();
                    selected_collection.push(new ol.Feature());
                    var selected_double_collection = selectDoubleInteraction.getFeatures();
                    selected_double_collection.clear();
                    selected_double_collection.push(new ol.Feature());
                }
            });

            $this.closest("form").submit(function () {
                var selected_collection = selectSingleInteraction.getFeatures();
                selected_collection.clear();
                var selected_double_collection = selectDoubleInteraction.getFeatures();
                selected_double_collection.clear();

                var geometry =
                    geomType == "Geometry" ? new ol.geom.GeometryCollection(Array.from(vectorLayer.getSource().getFeatures(), feature => feature.getGeometry())) :
                        geomType == "MultiPolygon" ? new ol.geom.MultiPolygon(Array.from(vectorLayer.getSource().getFeatures(), feature => feature.getGeometry())) :
                            vectorLayer.getSource().getFeatures().length > 0 ? vectorLayer.getSource().getFeatures()[0].getGeometry() : new ol.geom.GeometryCollection([]);

                var format = new ol.format.WKT({
                });
                var featureGeometry = geometry.transform('EPSG:3857', 'EPSG:' + srid)
                var newWKT = format.writeGeometry(featureGeometry);
                var featureGeometry = geometry.transform('EPSG:' + srid, 'EPSG:3857')

                $(`#${geomRendererInputId}`).val(newWKT);
            });
        }

    });
}