app.ChooseLayersControl = function (opt_options) {
    var options = opt_options || {};

    var legend = options.legend;
    var layers = [];
    for (var i = 0; i < legend.length; i++) {
        var item = legend[i];
        var itemLayers = item.layers;
        for (var li = 0; li < itemLayers.length; li++) {
            var layer = itemLayers[li];
            if (layers.indexOf(layer) >= 0) {
                continue;
            }
            layers.push(layer);
        }
    }

    var $button = $("<button type='button' class='gis-button btn-choose-layer' title='Выбор слоев'>");
    $button.text('LY');

    var that = this;
    var $layersPanel = $("<div class='gis-choose-layers-panel'>");
    for (var i = 0; i < legend.length; i++) {
        var item = legend[i];
        var $legendItem = $("<div class='gis-choose-layer-item' legend-index='{0}'><span class='gis-choose-layer-text'>{1}</span></div>".format(i, item.text));
        $layersPanel.append($legendItem);
    }

    $layersPanel.delegate(".gis-choose-layer-item", "click", function () {
        var $this = $(this);
        if ($this.hasClass("selected-item")) {
            return;
        }

        if (that._inited == true) {
            var map = that.getMap();
            map.deactivateControls();
        }

        $layersPanel.find(".gis-choose-layer-item").removeClass("selected-item");
        $this.addClass("selected-item");
        var index = $this.attr("legend-index");
        var layersToShow = legend[index].layers;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            layer.set('visible', layersToShow.indexOf(layer) >= 0);
        }
        $layersPanel.hide();
    });

    $($layersPanel.find(".gis-choose-layer-item")[0]).click();

    $('body').click(function (evt) {
        if ($layersPanel.is(':visible') == false) {
            return;
        }
        if ($(evt.target).parents('.gis-choose-layers-panel').length == 0) {
            $layersPanel.hide();
        }
    });

    var $element = $("<div class='choose-layers ol-unselectable ol-control'>");
    $element.append($button);

    $button.click(function () {
        $element.after($layersPanel);
        $layersPanel.show();
        that._inited = true;
    });

    this.onControlsDeactivate = function (sender) {
        if (sender == that) {
            return;
        }
        if (that._inited != true) {
            return;
        }
        $layersPanel.hide();
    };

    ol.control.Control.call(this, {
        element: $element[0],
        target: options.target
    });
};
ol.inherits(app.ChooseLayersControl, ol.control.Control);
