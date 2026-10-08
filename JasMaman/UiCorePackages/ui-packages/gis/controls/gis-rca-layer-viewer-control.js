app.RcaLayerViewerControl = function(opt_options) {
    var options = opt_options || {};

    var buildsRcaLayer = options.buildsRcaLayer;
    var roadsRcaLayer = options.roadsRcaLayer;
    var settlementsRcaLayer = options.settlementsRcaLayer;
    var additionalMassivesRcaLayer = options.additionalMassivesRcaLayer;
    
    var currentEditLayer = options.editLayer;

    var cbxOptions = {
        type: 'toggle',
        colors: { check: '#009900', uncheck: '#999999' },
        icons: { checked: 'tt-check-square-outbound-v', unchecked: 'tt-check-square-outbound-v' },
        disabled: false,
        fontsize: '2em'
    };

    var $elementWrapper = $('<div>');
    var $cbxRcaLayerSwitcher = $('<input type="checkbox" class="tiny-toggle">');
    $cbxRcaLayerSwitcher.hide();
    var $span = $("<span/>").addClass("tt").append($cbxRcaLayerSwitcher);
    var $icon = $("<i></i>");

    $span.css("font-size", cbxOptions.fontsize);

    var check = $cbxRcaLayerSwitcher.is(":checked");
    if (check) {
        $icon.addClass(cbxOptions.icons.checked);
        $icon.css('color', cbxOptions.colors.check);
    } else {
        $icon.addClass(cbxOptions.icons.unchecked);
        $icon.css('color', cbxOptions.colors.uncheck);
    }
    $icon.attr('title', 'Не привязанные объекты к адресному регистру на карте');
    $elementWrapper.append($span.append($icon));
    var $legends = $('<div>'); 
    $legends.css('float', 'left');
    $legends.css('padding', '10px');
    $legends.css('background-color', 'white');
    $legends.css('border', 'solid 1px rgb(0, 153, 0)');
    $legends.css('background-color', '#F1F1F1');

    var legendHeader = undefined;
    var legendClass = undefined;

    if (currentEditLayer === gisLayers.builds) {
        legendHeader = "Здания";
        legendClass = "build";
    }
    if (currentEditLayer === gisLayers.roads) {
        legendHeader = "Улицы";
        legendClass = "road";
    }
    if (currentEditLayer === gisLayers.settlements) {
        legendHeader = "Населенные пункты";
        legendClass = "settlement";
    }
    if (currentEditLayer === gisLayers.additionalMassives) {
        legendHeader = "Массивы";
        legendClass = "settlement";
    }

    $legends.append('<table width="150" align="center" cellpadding="4" cellspacing="1" >' +
        //'<tr><td colspan="2" class="layer-legend-text>' + legendHeader + '</br>адресному регистру на карте</td></tr>' +
        '<tr><td class="layer-legend '+legendClass+'"></td><td class="layer-legend-text">Объекты с</br>кодом РКА</td></tr>' +
        '<tr><td class="layer-legend ' + legendClass + '-rca"></td><td class="layer-legend-text">Объекты без</br>кода РКА</td></tr>' +
        '</table>'
    );
    $legends.hide();
    $elementWrapper.append($legends);
    $icon.click(function() {
        if (!$cbxRcaLayerSwitcher.data("disabled")) {
            var check2 = $cbxRcaLayerSwitcher.is(":checked");
            var data = $cbxRcaLayerSwitcher.data();
            if (check2) {
                buildsRcaLayer.set('visible', false);
                roadsRcaLayer.set('visible', false);
                settlementsRcaLayer.set('visible', false);
                $legends.hide();
                data.ui.find("i").removeClass(data.icons.checked).addClass(data.icons.unchecked).css('color', data.colors.uncheck);
                $cbxRcaLayerSwitcher.prop("checked", false).removeAttr("checked");

            } else {
                var isBuildsLayerCurrentEditLayer = currentEditLayer === gisLayers.builds;
                var isRoadsLayerCurrentEditLayer = currentEditLayer === gisLayers.roads;
                var isSettlementsLayerCurrentEditLayer = currentEditLayer === gisLayers.settlements;
                var isAdditionalMassivesLayerCurrentEditLayer = currentEditLayer === gisLayers.additionalMassives;
                buildsRcaLayer.set('visible', isBuildsLayerCurrentEditLayer);
                roadsRcaLayer.set('visible', isRoadsLayerCurrentEditLayer);
                settlementsRcaLayer.set('visible', isSettlementsLayerCurrentEditLayer);
                additionalMassivesRcaLayer.set('visible', isAdditionalMassivesLayerCurrentEditLayer);
                $legends.show();
                data.ui.find("i").removeClass(data.icons.unchecked).addClass(data.icons.checked).css('color', data.colors.check);
                $cbxRcaLayerSwitcher.prop("checked", true).attr("checked", "checked");
            }
        }
    });
    $span.hover(
        function() { if (!$cbxRcaLayerSwitcher.data("disabled")) $(this).find("i").addClass("tt-hover") },
        function() { if (!$cbxRcaLayerSwitcher.data("disabled")) $(this).find("i").removeClass("tt-hover") }
    );
    cbxOptions.ui = $span;
    $cbxRcaLayerSwitcher.data(cbxOptions);
    $elementWrapper.addClass('cbx-gis-show-rca-layer ol-control');

    this.onControlsDeactivate = function(sender) {

    };

    ol.control.Control.call(this, {
        element: $elementWrapper[0],
        target: options.target
    });
};
ol.inherits(app.RcaLayerViewerControl, ol.control.Control);