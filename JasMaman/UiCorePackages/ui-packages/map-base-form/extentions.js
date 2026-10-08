var ol_ext_inherits = function (child, parent) {
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;
};
ol.inherits = ol_ext_inherits;

ol.Map.prototype.deactivateControls = function (sender) {
    var map = this;
    var controls = map.getControls();
    for (var i = 0; i < controls.getLength(); i++) {
        var curControl = controls.item(i);
        if (curControl.onControlsDeactivate) {
            curControl.onControlsDeactivate(sender);
        }
    }
};

window.controlsLib = window.controlsLib || {};
window.controlsLib.ChooseLayersControl = function (opt_options) {
    var options = opt_options || {};
    var that = this;

    var iconClass = opt_options.iconClass || "mdi mdi-layers-triple-outline";
    var iconTitle = opt_options.iconTitle || "Выбор слоев";
    var legendName = opt_options.legendName || `${Math.floor(Math.random() * 100) + 1}`;
    var target = opt_options.mapId || `unnamed-${Math.floor(Math.random() * 100) + 1}`;

    window.ol = window.ol || {};
    window.ol.maps = window.ol.maps || {};
    window.ol.maps[target] = window.ol.maps[target] || {};
    window.ol.maps[target][legendName] = window.ol.maps[target][legendName] || {};
    window.ol.maps[target][legendName].OnLegendValueChange = function (map, legendName, prevLayer, currLayer) {
        console.log(`Map: ${map}, Legend name: ${legendName}, Previous layer: ${prevLayer}, Current layer: ${currLayer}`);
        if (opt_options.customOnChange) {
            opt_options.customOnChange(map, legendName, prevLayer, currLayer);
        }
    };

    var legend = options.legend;
    var layers = [];
    for (var i = 0; i < legend.length; i++) {
        var item = legend[i];
        var itemLayers = item.subLayers;
        for (var li = 0; li < itemLayers.length; li++) {
            var layer = itemLayers[li];
            if (layers.indexOf(layer) >= 0) {
                continue;
            }
            layers.push(layer);
        }
    }

    var $button = $(`<button type='button' class='ol-choose-layer btn ${iconClass}' title='${iconTitle}' legend-name='${legendName}'>`);

    var $layersPanel = $("<div class='ol-choose-layer-panel' legend-name='{0}' style='pointer-events: auto;'>".format(legendName));
    for (var i = 0; i < legend.length; i++) {
        var item = legend[i];
        var $legendItem = $("<div class='ol-choose-layer-item' legend-index='{0}' legend-item-name='{1}'><span class='gis-choose-layer-text'>{2}</span></div>".format(i, item.name || `${Math.floor(Math.random() * 100) + 1}`, item.text));
        $legendItem.data("item-info", item);
        $layersPanel.append($legendItem);
    }

    $layersPanel.delegate(".ol-choose-layer-item", "click", function () {
        var $this = $(this);
        if ($this.hasClass("selected-item")) {
            return;
        }

        var map = null;
        if (that._inited === true) {
            map = that.getMap();
            map.deactivateControls();
        }

        $layersPanel.find(".ol-choose-layer-item").removeClass("selected-item");
        $this.addClass("selected-item");
        var index = $this.attr("legend-index");
        var name = $this.attr("legend-item-name");
        window.ol.maps[target][legendName].OnLegendValueChange(target, legendName, window.ol.maps[target][legendName], name);
        window.ol.maps[target][legendName].currLayer = name;
        var layersToShow = legend[index].subLayers;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            layer.set('visible', layersToShow.indexOf(layer) >= 0);
        }
        $layersPanel.hide();

        var itemInfo = $this.data("item-info");
        if (itemInfo && itemInfo.select) {
            itemInfo.select(itemInfo, map);
        }
    });


    $('body').click(function (evt) {
        //if ($layersPanel.is(':visible') == false) {
        //    return;
        //}
        //if ($(evt.target).parents(`.ol-choose-layer-panel`).length == 0) {
        //    $layersPanel.hide();
        //}
        if ($(evt.target).attr("legend-name") != legendName) {
            $layersPanel.hide();
        }
    });


    $button.click(function () {
        $element.after($layersPanel);
        $layersPanel.show();
        that._inited = true;
    });

    //$button.click();
    $($layersPanel.find(".ol-choose-layer-item")[0]).click();

    this.onControlsDeactivate = function (sender) {
        if (sender == that) {
            return;
        }
        if (that._inited != true) {
            return;
        }
        $layersPanel.hide();
    };

    var $element = $("<div class='choose-layers ol-unselectable ol-control'>");
    $element.append($button);

    ol.control.Control.call(this, {
        element: $element[0]
    });
};
ol.inherits(window.controlsLib.ChooseLayersControl, ol.control.Control);

ol.source.OneAtlas = function (options) {
    this.apiKey = options.apiKey || '';
    if (this.apiKey.indexOf("Bearer ") === -1) {
        this.apiKey = "Bearer " + this.apiKey;
    }
    ol.source.WMTS.call(this, {
        attributions: options.attributions,
        cacheSize: options.cacheSize,
        crossOrigin: options.crossOrigin,
        logo: options.logo,
        maxZoom: options.maxZoom !== undefined ? options.maxZoom : 18,
        minZoom: options.minZoom,
        projection: options.projection,
        state: "loading",
        wrapX: options.wrapX,
        matrixSet: options.matrixSet,
        format: options.format,
        url: options.url,
        tileGrid: options.tileGrid,
        layer: options.layer,
        tileLoadFunction: (image, src) => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    image.getImage().src = URL.createObjectURL(xhr.response);
                }
            };
            xhr.open('GET', src);
            xhr.responseType = 'blob';
            xhr.setRequestHeader('Authorization', this.apiKey);
            xhr.send();
        }
    });
};
ol.inherits(ol.source.OneAtlas, ol.source.WMTS);