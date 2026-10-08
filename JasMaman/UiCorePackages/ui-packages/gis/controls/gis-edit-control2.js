app.EditControl2 = function(opt_options) {
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

            if (this._inited) {
                return;
            }
            this._inited = true;

            this.select = new ol.interaction.Select({
                layers: [vector],
                condition: ol.events.condition.never,
                addCondition: function(mapBrowserEvent) {
                    return ol.events.condition.click(mapBrowserEvent) &&
                        ol.events.condition.altKeyOnly(mapBrowserEvent);
                },
                removeCondition: function(mapBrowserEvent) {
                    return false;
                },
            });
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
                $modify.css('background-color', 'rgba(213, 21, 21, 0.94)');
                vector.getSource().clear();
                $btnDrag.enable = true;
            } else {
                this.map.un("singleclick", this.onSingleClick);
                $modify.css('background-color', 'rgba(112, 159, 0, 0.9)');
            }
        },
        onSingleClick: function(e) {
            var thisInstance = this;

            var coord = e.map.getCoordinateFromPixel(e.pixel);

            if (modify.select.getFeatures().length > 0) {
                return;
            }
            
            options.identifyObjectByCoord({
                    coord: coord,
                    success: function(features) {
                        var selectFeatures = modify.select.getFeatures();
                        vector.getSource().clear();
                        if (features && features.length > 0) {
                            features.forEach(function(feat) {
                                if (isFeatureRemoved(feat)) {
                                    return;
                                }
                                vector.getSource().addFeature(feat);
                            });
                        }
                        modify.select.setActive(true);
                        modify.select.getFeatures().extend(vector.getSource().getFeatures());
                        if (features.length == 0) {
                            return;
                        }
                        selectFeatures.once("remove", function(eventArgs) {
                            if (isFeatureRemoved(eventArgs.element) === true) {
                                return;
                            }
                            var geom = eventArgs.element.getGeometry();
                            var wktConvert = new ol.format.WKT();
                            var geomInWkt = wktConvert.writeGeometry(geom);
                            var id = eventArgs.element.getId();
                            options.onFeatureModifyFinish({
                                id: id,
                                geomWkt: geomInWkt,
                                attrs: getAttrsFromFeature(eventArgs.element),
                                //layer: id.split('.')[0],//"builds",
                            });
                        });
                    },
                    error: function() {

                    }
                }
            );
        },
    };

    var draw = null;
    draw = {
        init: function(map) {
            if (this._inited) {
                return;
            }
            this._inited = true;
            map.addInteraction(this.Point);
            this.Point.setActive(false);
            map.addInteraction(this.LineString);
            this.LineString.setActive(false);
            map.addInteraction(this.MultiPolygon);
            this.MultiPolygon.setActive(false);

            function drawEndHandler(e) {
                draw.setActive(false);
                modify.setActive(true);
                modify.select.getFeatures().push(e.feature);

                var selectFeatures = modify.select.getFeatures();

                selectFeatures.once("remove", function(eventArgs) {
                    var geom = eventArgs.element.getGeometry();
                    var wktConvert = new ol.format.WKT();
                    var geomInWkt = wktConvert.writeGeometry(geom);
                    options.onFeatureDrawFinish({
                        id: -1,
                        geomWkt: geomInWkt,
                        attrs: {},
                    });
                });
                
                modify.setActive(false);
                draw.setActive(true);
            }

            this.MultiPolygon.on("drawend", drawEndHandler);
            this.LineString.on("drawend", drawEndHandler);
        },
        Point: new ol.interaction.Draw({
            source: vector.getSource(),
            type: /** @type {ol.geom.GeometryType} */('Point')
        }),
        LineString: new ol.interaction.Draw({
            source: vector.getSource(),
            type: /** @type {ol.geom.GeometryType} */('MultiLineString')
        }),
        MultiPolygon: new ol.interaction.Draw({
            source: vector.getSource(),
            type: /** @type {ol.geom.GeometryType} */('MultiPolygon')
        }),
        getActive: function() {
            return this.activeType ? this[this.activeType].getActive() : false;
        },
        setActive: function(active) {
            var type = 'MultiPolygon';
            if (options.getDrawGeomType) {
                type = options.getDrawGeomType();
            }
            if (active) {
                this.activeType && this[this.activeType].setActive(false);
                this[type].setActive(true);
                this.activeType = type;
                vector.getSource().clear();
                $drawPolygon.css('background-color', 'rgba(213, 21, 21, 0.94)');
            } else {
                this.activeType && this[this.activeType].setActive(false);
                this.activeType = null;
                $drawPolygon.css('background-color', 'rgba(112, 159, 0, 0.9)');
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
                $remove.css('background-color', 'rgba(213, 21, 21, 0.94)');
                vector.getSource().clear();

            } else {
                this.map.un("singleclick", this.onSingleClick);
                $remove.css('background-color', 'rgba(112, 159, 0, 0.9)');
                vector.getSource().clear();
            }
        },
        onSingleClick: function(e) {
            var map = e.map;
            var coord = map.getCoordinateFromPixel(e.pixel);
            options.identifyObjectByCoord({
                    coord: coord,
                    success: function(features) {
                        vector.getSource().clear();
                        vector.getSource().addFeatures(features);


                        if (features.length > 0 && confirm("Удалить объект(ы)?")) {
                            var wktConvert = new ol.format.WKT();
                            features.forEach(function(a) {
                                if (isFeatureRemoved(a)) {
                                    return;
                                }
                                var geomInWkt = wktConvert.writeGeometry(a.getGeometry());
                                //vector.getSource().clear();
                                var id = a.getId();
                                options.onFeatureRemoveFinish({
                                    id: id,
                                    attrs: getAttrsFromFeature(a),
                                    geomWkt: geomInWkt,                                    
                                });
                            });
                        }
                        vector.getSource().clear();
                    },
                    error: function() {

                    }
                }
            );
        },
    };

    var union = {
        init: function(map) {
            this.map = map;
            if (this._inited) {
                return;
            }
            this._inited = true;
            this.unionVectorLayer = new ol.layer.Vector({
                source: new ol.source.Vector(),
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#EA99F3',
                        width: 4
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                })
            });
        },
        setEvents: function() {

        },
        setActive: function(active) {
            if (active == true) {
                this.map.on("singleclick", this.onSingleClick);
                $union.css('background-color', 'rgba(213, 21, 21, 0.94)');
                this.unionVectorLayer.getSource().clear();
                this.map.addLayer(this.unionVectorLayer);

            } else {
                this.map.un("singleclick", this.onSingleClick);
                $union.css('background-color', 'rgba(112, 159, 0, 0.9)');
                $btnEndUnion.hide();
                this.map.removeLayer(this.unionVectorLayer);
            }
        },
        isFeatureExistInUnionLayer: function(feature) {
            var existingFeaturesInUnionLayer = union.unionVectorLayer.getSource().getFeatures();
            if (existingFeaturesInUnionLayer) {
                var featureExists = false;
                existingFeaturesInUnionLayer.forEach(function(a) {
                    if (a.getId() === feature.getId()) {
                        featureExists = true;
                    }
                });
            }
            return featureExists;
        },
        onSingleClick: function(e) {
            var coord = e.map.getCoordinateFromPixel(e.pixel);
            options.identifyObjectByCoord({
                    coord: coord,
                    success: function(features) {
                        features.forEach(function(feature) {
                            if (isFeatureRemoved(feature)) {
                                return;
                            }
                            if (union.isFeatureExistInUnionLayer(feature) === true) {
                                return;
                            }
                            union.unionVectorLayer.getSource().addFeature(feature);
                            union.ActivateFinishUnionBtn();
                        });
                    },
                    error: function() {

                    }
                }
            );
        },
        ActivateFinishUnionBtn: function() {
        var unionFeaturesLength = this.unionVectorLayer.getSource().getFeatures().length;
            if (unionFeaturesLength && unionFeaturesLength >= 2) {
                $btnEndUnion.show();
            } else {
                $btnEndUnion.hide();
            }
        },
        DoUnion: function() {
            var featuresToUnion = union.unionVectorLayer.getSource().getFeatures();
            var unionedFeature = null;
            var wktConvert = new ol.format.WKT();
            featuresToUnion.forEach(function(a) {
                if (unionedFeature === null) {
                    unionedFeature = a;
                } else {
                    unionedFeature = UnionFeatures(unionedFeature, a);
                }
                var id = a.getId();
                options.onFeatureRemoveFinish({
                    id: id,
                    attrs: getAttrsFromFeature(a),
                    geomWkt: wktConvert.writeGeometry(a.getGeometry()),
                    //layer: id.split('.')[0]
                });
            });
            
            var geomInWkt_u = wktConvert.writeGeometry(unionedFeature.getGeometry());
            options.onFeatureDrawFinish({
                id: -1,
                geomWkt: geomInWkt_u,
                attrs: {},
            });
            union.unionVectorLayer.getSource().clear();
            this.ActivateFinishUnionBtn();
        }
    };

    var divide = null;
    divide = {
        init: function(map) {
            this.map = map;

            if (this._inited) {
                return;
            }
            this._inited = true;
           
            this.divideVectorLayer = new ol.layer.Vector({
                source: new ol.source.Vector(),
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#EA54E3',
                        width: 4
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                })
            });
             this.LineString = new ol.interaction.Draw({
                source: divide.divideVectorLayer.getSource(),
                type: /** @type {ol.geom.GeometryType} */('LineString')
            });


            function drawEndHandler(e) {
                var splitter = e.feature;
                var wktConvert = new ol.format.WKT();
                var splittedGeometries = [];
                var dividedFeatureGeometryType = divide.dividedFeature.getGeometry().getType();
                if (dividedFeatureGeometryType === "MultiLineString" || dividedFeatureGeometryType === "LineString") {
                    splittedGeometries = SplitLineByLine(splitter,divide.dividedFeature,options.splitLineByPolitUrl );                    
                    
                }
                if (dividedFeatureGeometryType === "MultiPolygon" || dividedFeatureGeometryType === "Polygon") {
                    splittedGeometries = SplitPolygonByLine(divide.dividedFeature, splitter);
                }
                var id = divide.dividedFeature.getId();
                var geomInWkt = wktConvert.writeGeometry(divide.dividedFeature.getGeometry());
                options.onFeatureRemoveFinish({
                    id: id,
                    attrs: getAttrsFromFeature(divide.dividedFeature),
                    geomWkt: geomInWkt,
                    //layer: id.split('.')[0]
                });
                splittedGeometries.forEach(function(a) {
                    var geomInWkt_i = wktConvert.writeGeometry(a.getGeometry());
                    options.onFeatureDrawFinish({
                        id: -1,
                        geomWkt: geomInWkt_i,
                        attrs: {},
                    });
                });
                divide.map.removeInteraction(divide.LineString);
                divide.dividedFeature = null;
                divide.divideVectorLayer.getSource().clear();
                divide.setActiveOnMapSingleClick(true);
            }

            this.LineString.on("drawend", drawEndHandler);
            this.setEvents();
        },
        setEvents: function() {
        },
        setActive: function(active) {
            if (active == true) {
                this.map.addLayer(divide.divideVectorLayer);
                this.setActiveOnMapSingleClick(true);
                $divide.css('background-color', 'rgba(213, 21, 21, 0.94)');
            } else {
                this.map.removeLayer(divide.divideVectorLayer);
                this.setActiveOnMapSingleClick(false);
                $divide.css('background-color', 'rgba(112, 159, 0, 0.9)');
            }
        },
        setActiveOnMapSingleClick: function(active) {
        if (active == true) {
                this.map.on("singleclick", this.onSingleClick);
            } else {
                this.map.un("singleclick", this.onSingleClick);
            }
        },
        onSingleClick: function(e) {
            var thisInstance = this;
            var coord = e.map.getCoordinateFromPixel(e.pixel);
            
            options.identifyObjectByCoord({
                    coord: coord,
                    success: function(features) {
                        if (features.length == 0) {
                            return;
                        }
                        features.forEach(function(feature) {
                            if (isFeatureRemoved(feature)) {
                                return;
                            }
                            divide.dividedFeature = feature;
                            divide.divideVectorLayer.getSource().clear();
                            divide.divideVectorLayer.getSource().addFeature(feature);
                            return;
                        });
                        if (divide.dividedFeature && confirm("Удалить объект и продолжит разделение объекта?")) {
                            divide.setActiveOnMapSingleClick(false);
                            divide.map.addInteraction(divide.LineString);
                        }
                    },
                    error: function() {

                    }
                }
            );
        },
    };
    //123
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
            options.identifyObjectByCoord({
                coord: coord,
                success: function(features) {
                    vector.getSource().clear();
                    vector.getSource().addFeatures(features);

                    if (features.length == 0) {
                        return;
                    }
                    var editorWidget = getObjectEditorWidget({ flStreet: { text: "Улица", type: "text" }, flBuildNum: { text: "Номер дома", type: "text" } });
                    editorWidget.setVal({
                        flStreet: features[0].get("uni_geonim"),
                        flBuildNum: features[0].get("uni_house"),
                    });
                    var $editorDialog = $("<div>");
                    $editorDialog.append(editorWidget.$widget);
                    $editorDialog.dialog({
                        title: "Атрибуты объекта",
                        modal: true,
                        buttons: [
                            {
                                text: "Сохранить",
                                click: function() {
                                    var val = editorWidget.getVal();
                                    options.onAttributeEditFinish({
                                        id: features[0].getId(),
                                        val: val
                                    });
                                }
                            },
                            {
                                text: "Отменить",
                                click: function() {
                                    $editorDialog.dialog("close");
                                }
                            }
                        ],
                        close: function() {
                            vector.getSource().clear();
                            $editorDialog.dialog("destroy");
                            $editorDialog.remove();
                        }
                    });
                },
                error: function() {
                }
            });
        },
    };
    //123
    var drag = {
        init: function(map) {
            this.map = map;
            if (this._inited) {
                return;
            }
            this._inited = true;
        },
        setActive: function(active) {
            if (active == true) {
                vector.getSource().clear();
                var dragOptions = {
                    onFeatureModifyFinish: function(feature) {
                        var geom = feature.getGeometry();
                        var wktConvert = new ol.format.WKT();
                        var geomInWkt = wktConvert.writeGeometry(geom);
                        var id = feature.getId();
                        options.onFeatureModifyFinish({
                            id: id,
                            geomWkt: geomInWkt,
                            attrs: getAttrsFromFeature(feature)
                        });
                    },
                    isFeatureRemoved: isFeatureRemoved
                };
                
                this.dragInteraction = new app.Drag(dragOptions);
                this.map.addInteraction(this.dragInteraction);
                $btnDrag.css('background-color', 'rgba(213, 21, 21, 0.94)');
            } else {
                this.map.removeInteraction(this.dragInteraction);
                $btnDrag.css('background-color', 'rgba(112, 159, 0, 0.9)');
            }
        },
        disable: function(disable) {
            if (disable) {
                $('.btn-feature-drag')[0].disable = true;
            } else {
                $('.btn-feature-drag')[0].disable = false;
            }
        }
    };

    var tools = [draw,modify,remove,drag,divide,union/*,editAttribute*/];
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
    //$toolbar.append($editAttrs);
    $editAttrs.click(function() {
        activateTool(editAttribute);
    });
    
    var $btnDrag = $("<button type='button' class='gis-button btn-feature-drag'>П</button>")
        .attr("title", "Перетаскивание");
    $btnDrag.text('D');
    $btnDrag.enable = false;
    $toolbar.append($btnDrag);
    $btnDrag.click(function () {
        activateTool(drag);
    });
    
    var $union = $("<button type='button' class='gis-button btn-feature-union'>C</button>")
        .attr("title", "Слияние");
    var $btnEndUnion = $("<button type='button' class='gis-button btn-feature-union-end'>ЗC</button>")
        .attr("title", "Завершить слияние");
    $btnEndUnion.hide();
    $btnEndUnion.click(function() {
        union.DoUnion();
    });
    var $unionControl = $('<div>');
    $unionControl.append($union, $btnEndUnion);
    $union.text('EU');
    //$btnUnion.enable = false;
    $toolbar.append($unionControl);
    $union.click(function () {
        activateTool(union);
    });
    
    var $divide = $("<button type='button' class='gis-button btn-feature-divide'>C</button>")
        .attr("title", "Деление");
    $toolbar.append($divide);
    $divide.click(function () {
        activateTool(divide);
        //$btnEndDivide.show();
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
        //editAttribute.setActive(false);
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
ol.inherits(app.EditControl2, ol.control.Control);

function isFeatureRemoved(feature) {
    var actionType = feature.get('actionType');
    return actionType === 'remove';
}

function isFeatureModified(feature) {
    var actionType = feature.get('actionType');
    return actionType === 'modify';
}

function getAttrsFromFeature(feature) {
    var attrs = {};
    var keys = feature.getKeys();
    for (var i = 0; i < keys.length; i++) {
        var curKey = keys[i];
        if (curKey == "geometry") {
            continue;
        }
        attrs[curKey] = feature.get(curKey);
    }
    var wktConvert = new ol.format.WKT();
    var geomInWkt = wktConvert.writeGeometry(feature.getGeometry());
    var isGeomChanged = !(feature.getProperties().originalGeometry === geomInWkt);
    attrs["isGeomChanged"] = isGeomChanged.toString();
    return attrs;
}

function SplitPolygonByLine(olPolygonFeature,olLineFeature) {
    //if (poly.geometry === void 0 || poly.geometry.type !== 'Polygon' ) throw('"turf-cut" only accepts Polygon type as victim input');
	//if (line.geometry === void 0 || line.geometry.type !== 'LineString' ) throw('"turf-cut" only accepts LineString type as axe input');
	var format = new ol.format.GeoJSON();
    var turfLine = format.writeFeatureObject(olLineFeature);
    var turfPolygon = format.writeFeatureObject(olPolygonFeature);
    if(turf.inside(turf.point(turfLine.geometry.coordinates[0]), turfPolygon) || turf.inside (turf.point(turfLine.geometry.coordinates[turfLine.geometry.coordinates.length-1]), turfPolygon)) throw('Both first and last points of the polyline must be outside of the polygon');
    var _axe = turf.buffer(turfLine, 0.01, 'meters').features[0];		// turf-buffer issue #23
    var _body = turf.erase(turfPolygon, _axe);
		var pieces = [];
	
	if (_body.geometry.type == 'Polygon' ){
		pieces.push( turf.turfPolygon(_body.geometry.coordinates));
	}else{
		_body.geometry.coordinates.forEach(function(a){pieces.push( turf.polygon(a))});
	}

	pieces.forEach(function(a) { a.properties = turfPolygon.properties; });

    var resultFeatures = [];
    var splittedFeatures = turf.featurecollection(pieces);
    if (splittedFeatures && splittedFeatures.features) {
        splittedFeatures.features.forEach(function(turfFeature) {
            var multiGeomFeature = turf.getMultiGeomFeature(turfFeature);
            resultFeatures.push(format.readFeature(multiGeomFeature));
        });
    }
    return resultFeatures;
}

function SplitLineByLine(olLineSplitter, olLine) {
    var result = [];
    var format = new ol.format.GeoJSON();
    var turfLine = format.writeFeatureObject(olLine);
    var turfLineSplitter = format.writeFeatureObject(olLineSplitter);
    var lineType = olLine.getGeometry().getType();
    if (lineType === "MultiLineString") {
        var splittedTurfLines = turf.splitMultiLineByLine(turfLine, turfLineSplitter);
        if (splittedTurfLines && splittedTurfLines.length > 0) {
            splittedTurfLines.forEach(function(line) {
                var multiGeomFeature = turf.getMultiGeomFeature(line);
                var lineOl = format.readFeature(multiGeomFeature);
                result.push(lineOl);
            });
        }
    }
    if (lineType === "LineString") {
        var splittedTurfLines2 = turf.splitSingleLineByLine(turfLine, turfLineSplitter);
        if (splittedTurfLines2 && splittedTurfLines2.length > 0) {
            splittedTurfLines2.forEach(function(line) {
                var multiGeomFeature = turf.getMultiGeomFeature(line);
                var lineOl = format.readFeature(multiGeomFeature);
                result.push(lineOl);
            });
        }
    }
    return result;
};

turf.splitMultiLineByLine = function(multiLine, splitterLine) {
    var result = [];
    var getSingleLineByCoords = function(coords) {
        var line = {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            }
        };
        return line;
    };
    if (multiLine.geometry.coordinates && multiLine.geometry.coordinates.length > 0) {
        multiLine.geometry.coordinates.forEach(function(lineCoord) {
            var singleLine = getSingleLineByCoords(lineCoord);
            var splittedLinesResult = turf.splitSingleLineByLine(singleLine, splitterLine);
            if (splittedLinesResult && splittedLinesResult.length > 0) {
                result = $.merge(result, splittedLinesResult);
            } else {
                result.push(singleLine);
            }
        });
    }
    return result;
};

turf.splitSingleLineByLine = function(singleLine, splitterLine) {
    var result = [];
    var intersectionPoints = turf.intersect(singleLine, splitterLine);
    
    var getTurfPointByCoordPoint = function(coord) {
        var resPoint = {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Point",
                "coordinates": coord
            }
        };
        return resPoint;
    };

    if (intersectionPoints) {
        if (intersectionPoints.geometry.type === "Point") {
            result = turf.splitSingleLineByPoint(singleLine, intersectionPoints);
        }
        if (intersectionPoints.geometry.type === "MultiPoint") {
            var resultArr = [];
            var resultArr2 = [];
            for (var i = 0; i < intersectionPoints.geometry.coordinates.length; i++) {
                var turfPoint = getTurfPointByCoordPoint(intersectionPoints.geometry.coordinates[i]);
                if (i == 0) {
                    resultArr = turf.splitSingleLineByPoint(singleLine, turfPoint);
                } else {
                    resultArr.forEach(function(item) {
                        var splittedLines = turf.splitSingleLineByPoint(item, turfPoint);
                        if (splittedLines.length > 0) {
                            resultArr2 = $.merge(resultArr2, turf.splitSingleLineByPoint(item, turfPoint));
                        } else {
                            resultArr2.push(item);
                        }
                    });
                    resultArr = resultArr2;
                    resultArr2 = [];
                }
            }
            result = resultArr;
        }
    }
    return result;
};



turf.splitSingleLineByPoint = function(singleLine, point) {
    var result = [];
    var linePointCount = singleLine.geometry.coordinates.length;
    var lineStartPoint = {
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "Point",
            "coordinates": singleLine.geometry.coordinates[0]
        }
    };
    var lineEndPoint = {
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "Point",
            "coordinates": singleLine.geometry.coordinates[linePointCount - 1]
        }
    };
    var splittedLineSegment1 = turf.lineSlice(lineStartPoint, point, singleLine);
    var splittedLineSegment2 = turf.lineSlice(point, lineEndPoint, singleLine);
    
    if (splittedLineSegment1 && turf.lineDistance(splittedLineSegment1,'kilometers')>0) {
        result.push(splittedLineSegment1);
    }
    if (splittedLineSegment2 && turf.lineDistance(splittedLineSegment2,'kilometers')>0) {
        result.push(splittedLineSegment2);
    }
    return result;
};


function UnionFeatures(olFeature1, olFeature2) {
    var format = new ol.format.GeoJSON();
    var turfFeature1 = format.writeFeatureObject(olFeature1);
    var turfFeature2 = format.writeFeatureObject(olFeature2);
    var unionedFeature = turf.union(turfFeature1, turfFeature2);
    var multiGeomFeature = turf.getMultiGeomFeature(unionedFeature);
    return format.readFeature(multiGeomFeature);
}

function SetMapMouseCursor(mapTarget,actionType) {
    if (actionType === 'default') {
        mapTarget.style.cursor = 'default';
    }
    if (actionType === 'add') {
        mapTarget.style.cursor = 'crosshair';
    }
    if (actionType === 'modify') {
        mapTarget.style.cursor = 'default';
    }
    if (actionType === 'remove') {
        mapTarget.style.cursor = 'default';
    }
}

turf.getMultiGeomFeature = function(feature) {
    var geomType = feature.geometry.type;
    var resultGeomType = null;
    var coords = null;
    switch (geomType) {
    case "Point":        
        resultGeomType = 'MultiPoint';
        coords = [feature.geometry.coordinates];
        break;
    case "MultiPoint":
        resultGeomType = 'MultiPoint';
        coords = feature.geometry.coordinates;
        break;
    case "LineString":
        resultGeomType = 'MultiLineString';
        coords = [feature.geometry.coordinates];
        break;
    case "MultiLineString":        
        resultGeomType = 'MultiLineString';
        coords = feature.geometry.coordinates;
        break;
    case "Polygon":
        resultGeomType = 'MultiPolygon';
        coords = [feature.geometry.coordinates];
        break;
    case "MultiPolygon":
        resultGeomType = 'MultiPolygon';
        coords = feature.geometry.coordinates;
        break;
    }
    var resultMultiGeomFeature = {
        "type": "Feature",
        "properties": feature.properties,
        "geometry": {
            "coordinates": coords,
            "type": resultGeomType
        }
    };
    return resultMultiGeomFeature;
};