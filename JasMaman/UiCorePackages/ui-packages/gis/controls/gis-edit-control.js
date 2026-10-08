app.EditControl = function (opt_options) {
    var options = opt_options || {};
    var saveGeomUrl = options.saveGeomUrl;
    var insertFeatureUrl = options.insertFeatureUrl;
    var removeFeatureUrl = options.removeFeatureUrl;
    var saveFeatureAttrsUrl = options.saveFeatureAttrsUrl;
    var baseLayer = options.baseLayer;

    var $btnEdit = $("<button type='button' class='gis-button btn-edit-panel'>");
    $btnEdit.attr("title", "Панель редактирования");
    $btnEdit.text("E");

    var that = this;


    var vector = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
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

    var modify = null;
    modify = {
        init: function(map) {
            this.map = map;
            this.select = new ol.interaction.Select();
            map.addInteraction(this.select);

            this.modify = new ol.interaction.Modify({
                features: this.select.getFeatures()
            });
            map.addInteraction(this.modify);
            this.setEvents();
        },
        setEvents: function() {
            var selectedFeatures = this.select.getFeatures();

            this.select.on('change:active', function() {
                selectedFeatures.forEach(selectedFeatures.remove, selectedFeatures);
            });
        },
        setActive: function(active) {
            this.select.setActive(false);
            this.modify.setActive(active);

            if (active == true) {
                this.map.on("singleclick", this.onSingleClick);
            } else {
                this.map.un("singleclick", this.onSingleClick);
            }
        },
        onSingleClick: function(e) {
            var coord = e.map.getCoordinateFromPixel(e.pixel);
            $.ajax({
                url: gisLayers.mapWmsUrl,
                jsonp: false,
                jsonpCallback: 'getGeomFromPointCallback',
                type: 'GET',
                /*async: false,*/
                dataType: 'jsonp',
                data: {
                    service:"WFS",
                    version:"1.1.0",
                    request: "GetFeature",
                    typename: gisLayers.builds,
                    srsname: gisLayers.defaultSrsName,
                    outputFormat: "text/javascript",
                    format_options:"callback:getGeomFromPointCallback",
                    cql_filter: "INTERSECTS(geom,POINT({0} {1}))".format(coord[0], coord[1])
                },
                success: function (response) {
                    var geojsonFormat = new ol.format.GeoJSON();
                    var features = geojsonFormat.readFeatures(response);
                    vector.getSource().clear();
                    vector.getSource().addFeatures(features);
                    
                    modify.select.setActive(true);
                    modify.select.getFeatures().extend(features);

                    if(features.length > 0) {
                        var selectFeatures = modify.select.getFeatures();
                        selectFeatures.once("remove", function(eventArgs) {
                            var geom = eventArgs.element.getGeometry();
                            var wktConvert = new ol.format.WKT();
                            var geomInWkt = wktConvert.writeGeometry(geom);

                            var gid = eventArgs.element.get("gid");

                            if(confirm("Сохранить изменения? " + geomInWkt) == true) {
                                $.ajax({
                                    url: saveGeomUrl,
                                    data: {
                                        gid: gid,
                                        geomWkt: geomInWkt
                                    },
                                    type: "POST",
                                    dataType: "json",
                                    success: function () {
                                        e.map.refreshLayers();
                                    },
                                    error: function () {
                                        alert("Ошибка изменения");
                                    }
                                });
                            }
                        });
                    }
                }
            });
        },
    };

    var draw = null;
    draw = {
        init: function (map) {
            map.addInteraction(this.Point);
            this.Point.setActive(false);
            map.addInteraction(this.LineString);
            this.LineString.setActive(false);
            map.addInteraction(this.MultiPolygon);
            this.MultiPolygon.setActive(false);

            this.MultiPolygon.on("drawend", function(e) {
                draw.setActive(false);
                modify.setActive(true);
                modify.select.getFeatures().push(e.feature);
                

                var selectFeatures = modify.select.getFeatures();
                selectFeatures.once("remove", function(eventArgs) {
                    var geom = eventArgs.element.getGeometry();
                    var wktConvert = new ol.format.WKT();
                    var geomInWkt = wktConvert.writeGeometry(geom);

                    if (confirm("Сохранить изменения? " + geomInWkt) == true) {
                        $.ajax({
                            url: insertFeatureUrl,
                            data: {
                                geomWkt: geomInWkt
                            },
                            type: "POST",
                            dataType: "json",
                            success: function() {
                                map.refreshLayers();
                            },
                            error: function() {
                                alert("Ошибка рисования");
                            }
                        });
                    }
                });

            });
        },
        Point: new ol.interaction.Draw({
            source: vector.getSource(),
            type: /** @type {ol.geom.GeometryType} */('Point')
        }),
        LineString: new ol.interaction.Draw({
            source: vector.getSource(),
            type: /** @type {ol.geom.GeometryType} */('LineString')
        }),
        MultiPolygon: new ol.interaction.Draw({
            source: vector.getSource(),
            type: /** @type {ol.geom.GeometryType} */('MultiPolygon')
        }),
        getActive: function () {
            return this.activeType ? this[this.activeType].getActive() : false;
        },
        setActive: function (active) {
            var type = 'MultiPolygon';
            if (active) {
                this.activeType && this[this.activeType].setActive(false);
                this[type].setActive(true);
                this.activeType = type;
            } else {
                this.activeType && this[this.activeType].setActive(false);
                this.activeType = null;
            }
        }
    };

    var remove = {
        init: function(map) {
            this.map = map;
        },
        setActive: function(active) {
            if (active == true) {
                this.map.on("singleclick", this.onSingleClick);
            } else {
                this.map.un("singleclick", this.onSingleClick);
            }
        },
        onSingleClick: function(e) {
            var map = e.map;
            var coord = map.getCoordinateFromPixel(e.pixel);
            $.ajax({
                url: gisLayers.mapWmsUrl,
                jsonp: false,
                jsonpCallback: 'getGeomFromPointCallback',
                type: 'GET',
                /*async: false,*/
                dataType: 'jsonp',
                data: {
                    service:"WFS",
                    version:"1.1.0",
                    request: "GetFeature",
                    typename: gisLayers.builds,
                    srsname: gisLayers.defaultSrsName,
                    outputFormat: "text/javascript",
                    format_options:"callback:getGeomFromPointCallback",
                    cql_filter: "INTERSECTS(geom,POINT({0} {1}))".format(coord[0], coord[1])
                },
                success: function (response) {
                    var geojsonFormat = new ol.format.GeoJSON();
                    var features = geojsonFormat.readFeatures(response);
                    vector.getSource().clear();
                    vector.getSource().addFeatures(features);
                    
                    if(features.length > 0) {
                        if (confirm("Удалить объект?") == true) {
                            $.ajax({
                                url: removeFeatureUrl,
                                data: {
                                    gid: features[0].get("gid")
                                },
                                type: "POST",
                                dataType: "json",
                                success: function() {
                                    map.refreshLayers();
                                },
                                error: function() {
                                    alert("Ошибка удаления");
                                }
                            });
                        }
                    }
                }
            });
        },
    };

    var editAttribute = {
        init: function(map) {
            this.map = map;
        },
        setActive: function(active) {
            if (active == true) {
                this.map.on("singleclick", this.onSingleClick);
            } else {
                this.map.un("singleclick", this.onSingleClick);
            }
        },
        onSingleClick: function(e) {
            var map = e.map;
            var coord = map.getCoordinateFromPixel(e.pixel);
            $.ajax({
                url: gisLayers.mapWmsUrl,
                jsonp: false,
                jsonpCallback: 'getGeomFromPointCallback',
                type: 'GET',
                /*async: false,*/
                dataType: 'jsonp',
                data: {
                    service:"WFS",
                    version:"1.1.0",
                    request: "GetFeature",
                    typename: gisLayers.builds,
                    srsname: gisLayers.defaultSrsName,
                    outputFormat: "text/javascript",
                    format_options:"callback:getGeomFromPointCallback",
                    cql_filter: "INTERSECTS(geom,POINT({0} {1}))".format(coord[0], coord[1])
                },
                success: function (response) {
                    var geojsonFormat = new ol.format.GeoJSON();
                    var features = geojsonFormat.readFeatures(response);
                    vector.getSource().clear();
                    vector.getSource().addFeatures(features);
                    
                    if(features.length > 0) {
                        var editorWidget = getObjectEditorWidget({ flStreet: { text: "Улица", type: "text" }, flBuildNum: { text: "Номер дома", type: "text" } });
                        editorWidget.setVal({
                            flStreet: features[0].get("uni_geonim"),
                            flBuildNum: features[0].get("uni_house"),
                        });
                        var $editorDialog = $("<div>");
                        $editorDialog.append(editorWidget.$widget);
                        $editorDialog.dialog({
                            title:"Атрибуты объекта",
                            modal:true,
                            buttons:[
                                {text:"Сохранить", click:function () {
                                    var val = editorWidget.getVal();
                                    $.ajax({
                                        url: saveFeatureAttrsUrl,
                                        data: {
                                            gid: features[0].get("gid"),
                                            flStreet: val.flStreet,
                                            flBuildNum: val.flBuildNum,
                                        },
                                        type: "POST",
                                        dataType: "json",
                                        success: function() {
                                            $editorDialog.dialog("close");                                            
                                            vector.getSource().clear();
                                            map.refreshLayers();
                                        },
                                        error: function() {
                                            alert("Ошибка редактирования");
                                        }
                                    });
                                }},
                                {text:"Отменить", click:function () {
                                    $editorDialog.dialog("close");
                                }}
                            ],
                            close: function () {
                                vector.getSource().clear();
                                $editorDialog.dialog("destroy");
                                $editorDialog.remove();
                            }
                        });
                    }
                }
            });
        },
    };
    
    var selectLine = {
        init: function(map) {
            this.map = map;
        },
        setActive: function(active) {
            if (active == true) {
                this.map.on("singleclick", this.onSingleClick);
            } else {
                this.map.un("singleclick", this.onSingleClick);
            }
        },
        onSingleClick: function(e) {
            var map = e.map;
            var coord = map.getCoordinateFromPixel(e.pixel);
            $.ajax({
                url: gisLayers.mapWmsUrl,
                jsonp: false,
                jsonpCallback: 'getGeomFromPointCallback',
                type: 'GET',
                /*async: false,*/
                dataType: 'jsonp',
                data: {
                    service:"WFS",
                    version:"1.1.0",
                    request: "GetFeature",
                    typename: gisLayers.roads,
                    srsname: gisLayers.defaultSrsName,
                    outputFormat: "text/javascript",
                    format_options:"callback:getGeomFromPointCallback",
                    cql_filter: "INTERSECTS(geom,POINT({0} {1}))".format(coord[0], coord[1])
                },
                success: function (response) {
                    var geojsonFormat = new ol.format.GeoJSON();
                    var features = geojsonFormat.readFeatures(response);
                    vector.getSource().clear();
                    vector.getSource().addFeatures(features);
                }
            });
        },
    };

    var tools = [draw,modify,remove,editAttribute,selectLine];
    var activateTool = function(tool) {
        for(var i = 0;i<tools.length;i++) {
            tools[i].setActive(tool == tools[i]);
        }
    };


    var $toolbar = $("<div class='gis-toolbar-edit ol-control'>");
    
    var $drawPolygon = $("<button type='button' class='gis-button btn-feature-draw'>РП</button>")
        .attr("title", "Нарисовать");
    $toolbar.append($drawPolygon);
    $drawPolygon.click(function () {
        activateTool(draw);
    });
    
    var $modify = $("<button type='button' class='gis-button btn-feature-edit'>ИЗМ</button>")
        .attr("title", "Изменить");
    $toolbar.append($modify);
    $modify.click(function () {
        activateTool(modify);
    });
    
    var $remove = $("<button type='button' class='gis-button btn-feature-remove'>УД</button>")
        .attr("title", "Удалить");
    $toolbar.append($remove);
    $remove.click(function() {
        activateTool(remove);
    });
    
    var $editAttrs = $("<button type='button' class='gis-button btn-feature-attrs'>АТР</button>")
        .attr("title", "Редактировать атрибуты");
    $toolbar.append($editAttrs);
    $editAttrs.click(function() {
        activateTool(editAttribute);
    });
    
    var $selectRoad = $("<button type='button' class='gis-button'>ЛИН</button>")
        .attr("title", "Выбрать дорогу");
    //$toolbar.append($selectRoad); // Не пашет...
    $selectRoad.click(function() {
        activateTool(selectLine);
    });

    var $element = $('<div>');
    $element.addClass('btn-gis-edit ol-unselectable ol-control');
    $element.append($btnEdit);

    $btnEdit.click(function() {
        var map = that.getMap();

        map.deactivateControls(that);

        map.getView().setRotation(0);
        $element.after($toolbar);
        $toolbar.show();

        that.getMap().addLayer(vector);
        for(var i = 0;i<tools.length;i++) {
            tools[i].init(map);
            tools[i].setActive(false);
        }

        that._inited = true;
    });

    this.onControlsDeactivate = function(sender) {
        if (sender == that) {
            return;
        }
        if(that._inited != true) {
            return;
        }
        
        draw.setActive(false);
        modify.setActive(false);
        remove.setActive(false);
        editAttribute.setActive(false);
        $toolbar.hide();
        that.getMap().removeLayer(vector);
    };

    baseLayer.on("change:visible", function() {
        if(baseLayer.getVisible()==true) {
            $btnEdit.prop("disabled", false);
        } else {
            $btnEdit.prop("disabled", true);
            that.onControlsDeactivate();
        }
    });

    ol.control.Control.call(this, {
        element: $element[0],
        target: options.target
    });
};
ol.inherits(app.EditControl, ol.control.Control);