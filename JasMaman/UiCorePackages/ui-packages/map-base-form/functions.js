function createFeature(WKT, FillColor, BorderSize, BorderColor, Radius, HoverTemplate, ClickRedirectUrl) {

    var fill = new ol.style.Fill({
        color: FillColor
    });
    var stroke = new ol.style.Stroke({
        color: BorderColor,
        width: BorderSize
    });
    var styles = [
        new ol.style.Style({
            fill: fill,
            stroke: stroke,
            image: new ol.style.Circle({
                fill: fill,
                stroke: stroke,
                radius: Radius
            }),
        })
    ];
    styles[ol.geom.Polygon] = [
        new ol.style.Style({
            fill: fill
        })
    ];
    styles[ol.geom.MultiPolygon] =
        styles[ol.geom.Polygon];
    styles[ol.geom.LineString] = [
        new ol.style.Style({
            stroke: stroke
        }),
        new ol.style.Style({
            stroke: stroke
        })
    ];
    styles[ol.geom.MultiLineString] =
        styles[ol.geom.LineString];
    styles[ol.geom.Point] = [
        new ol.style.Style({
            image: new ol.style.Circle({
                radius: Radius,
                fill: fill,
                stroke: stroke
            }),
            zIndex: Infinity
        })
    ];
    styles[ol.geom.MultiPoint] =
        styles[ol.geom.Point];
    styles[ol.geom.GeometryCollection] =
        styles[ol.geom.Polygon].concat(
            styles[ol.geom.LineString],
            styles[ol.geom.Point]
        );


    var format = new ol.format.WKT();

    var feature = new ol.Feature({
        geometry: format.readGeometry(WKT,
            {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            }
        ),
        //data: polygonObject,
        //id: polygonId,
        hoverTemplate: HoverTemplate,
        clickRedirectUrl: ClickRedirectUrl
    });

    feature.setStyle(styles);

    return feature;

}

function flyTo(map, location, duration, done) {
    var view = map.getView();
    var newView = new ol.View();
    newView.fit(location, map.getSize());
    var zoom = view.getZoom();
    var parts = 2;
    var called = false;
    function callback(complete) {
        --parts;
        if (called) {
            return;
        }
        if (parts === 0 || !complete) {
            called = true;
            done(complete);
        }
    }
    view.animate(
        {
            center: location,
            duration: duration,
        },
        callback
    );
    view.animate(
        {
            zoom: zoom - 1,
            duration: duration / 2,
        },
        {
            zoom: newView.getZoom(),
            duration: duration / 2,
        },
        callback
    );
}