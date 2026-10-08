app.RefreshLayersControl = function (opt_options) {
    var options = opt_options || {};
    var that = this;
    var $button = $("<button type='button' class='gis-button btn-refresh-layers' title='Перерисовать слои'>");
    $button.text('R');
    $button.click(function () {
        that.getMap().refreshLayers();
    });

    var $element = $('<div>');
    $element.addClass('btn-refresh-layers-wrapper ol-selectable ol-control');
    $element.append($button);

    ol.control.Control.call(this, {
        element: $element[0],
        target: options.target
    });
};
ol.inherits(app.RefreshLayersControl, ol.control.Control);


app.ViewLoadSourceControl = function (opt_options) {
    var options = opt_options || {};
    var that = this;
    var $button = $("<button type='button' class='gis-button btn-view-load-source' title='Предварительный просмотр загрузки'>");
    $button.text('P');
    $button.click(function () {
        var center = proj4("EPSG:3395", "EPSG:4326", that.getMap().getView().getCenter());
        var href = "https://wego.here.com/?map={0},{1},17,satellite".format(center[1], center[0]);
        var $link = $("<a href='" + href + "' target='_blank'>Перейти</a>");
        var $div = $("<div>");
        $div.append($link);
        $link.click(function() { $div.dialog("close"); });
        $div.dialog({
            title: "Переход на источник загрузки",
            modal: true,
            height: 100,
            width: 280,
            closeOnEscape: true,
            close: function () {
                $div.dialog('destroy');
            }
        });
    });

    var $element = $('<div>');
    $element.addClass('btn-view-load-source-wrapper ol-selectable ol-control');
    $element.append($button);

    ol.control.Control.call(this, {
        element: $element[0],
        target: options.target
    });
};
ol.inherits(app.ViewLoadSourceControl, ol.control.Control);