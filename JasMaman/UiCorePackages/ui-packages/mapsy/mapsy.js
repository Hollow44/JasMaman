function createRasterLayer(name, geoserver, store, layer) {
    var rasterLayer = new ol.layer.Tile({
        visible: true,
        preload: Infinity,
        source: new ol.source.TileWMS({
            url: `${geoserver}/geoserver/${store}/wms`,
            params: {
                FORMAT: 'image/png',
                VERSION: '1.1.1',
                tiled: true,
                LAYERS: `${store}:${layer}`,
                exceptions: "application/vnd.ogc.se_inimage",
                tilesOrigin: 5564899.8761452 + "," + 4949441.58291756
            }
        })
    });
    rasterLayer.name = name;
    return rasterLayer;
}

$(document).ready(function () {
    $(".mapsy-map").each(function () {
        var $this = $(this);
        var that = this;
        var $mapWrapper = $("<div class='mapsy-ol-map-wrapper'>");
        $this.append($mapWrapper);
        $mapWrapper.append("<div id='progress'>");
        var $map = $("<div class='mapsy-ol-map'>");
        $mapWrapper.append($map);
        
        var progress = new Progress(document.getElementById("progress"));
        var stateFull = $(this).data("state");
        var statsApiUrl = $(this).data("statsApiUrl");
        var mapGlobal = null;
        var filters = {
            bbox: stateFull.InitialBbox,
            filters: stateFull.Filters
        };

        var curVisibleLayer = stateFull.DatasetState.State.WmsLayers[0];
        var requestsCount = 0;
        var currentRequestId = 0;
        function setFilters(newFilters) {
            filters = newFilters;
            
            function clearParams(url) {
                var paramsToRemove = [];
                for (var key of url.searchParams.keys()) {
                    if (key.startsWith("_mw_")) {
                        paramsToRemove.push(key);
                    }
                }

                for (var i = 0; i < paramsToRemove.length; i++) {
                    url.searchParams.delete(paramsToRemove[i]);
                }
            }

            function repopulateFilters(url) {
                clearParams(url);
                var bottomLeft = ol.extent.getBottomLeft(filters.bbox);
                var topRight = ol.extent.getTopRight(filters.bbox);
                url.searchParams.set("bbox", `${bottomLeft[0]},${bottomLeft[1]},${topRight[0]},${topRight[1]}`);
                for (var i = 0; i < filters.filters.length; i++) {
                    var filter = filters.filters[i];
                    url.searchParams.append(`_mw_${filter.Column}`, filter.Value);
                }
            }

            var curUrl = new URL(window.location);
            var url = new URL(statsApiUrl);

            repopulateFilters(curUrl);
            repopulateFilters(url);
            
            history.replaceState({}, null, curUrl.href);

            
            $(".mw").addClass("loading");
            function makeRequest(requestId, filters) {
                setTimeout(() => {
                    if (currentRequestId != requestId) {//выполнился еще один запрос
                        return;
                    }
                    requestsCount++;
                    $.ajax({
                        url: url.href,
                        success(data) {
                            requestsCount--;
                            if (currentRequestId != requestId) {//выполнился еще один запрос
                                return;
                            }
                            console.log(data);
                            
                            stateFull = data;
                            renderState(data);
                        },
                        error() {
                            requestsCount--;
                            if (currentRequestId != requestId) {//выполнился еще один запрос
                                return;
                            }
                        }
                    });

                    function isNumeric(str) {
                        return !isNaN(str) && !isNaN(parseFloat(str));
                    }
                    var columnVals = {};
                    for (var i = 0; i < filters.filters.length; i++) {
                        var filter = filters.filters[i];
                        if (columnVals[filter.Column]) {
                            columnVals[filter.Column].push(filter.Value);
                        } else {
                            columnVals[filter.Column] = [filter.Value];
                        }
                    }
                    function getValStr(val) {
                        return `'${val}'`;
                        if (isNumeric(val)) {
                            return `${val}`;
                        }
                    }
                    var filterStatements = [];
                    for (var key in columnVals) {
                        if (columnVals[key].length == 1) {
                            filterStatements.push(`${key.toLowerCase()} = ${getValStr(columnVals[key][0])}`);
                        } else {
                            filterStatements.push(`${key.toLowerCase()} IN (${columnVals[key].map(v => getValStr(v)).join(",")})`);
                        }
                    }


                    var filterParams = {
                        'FILTER': null,
                        'CQL_FILTER': filterStatements.length == 0 ? null : filterStatements.join(" AND "),
                        'FEATUREID': null
                    };
                    mapGlobal.getLayers().forEach(layer => {
                        if (layer.get("isStateLayer") == true) {
                            layer.getSource().updateParams(filterParams);
                        }
                    });
                }, 200);
            }

            currentRequestId++;
            makeRequest(currentRequestId, filters);
        }

        var mapAlreadyRendered = false;

        function refreshState() {
            renderState(stateFull);
        }

        function getShowAllResultParamName(id) {
            return `e_${id}`;
        }

        function formatNum(num) {
            var x = [
                {value: 1_000_000_000, unit: "B"},
                {value: 1_000_000, unit: "M"},
                {value: 1_000, unit: "K"},
            ];
            var unit = "";
            for (var i = 0; i < x.length; i++) {
                if (num >= x[i].value) {
                    num = num / x[i].value;
                    unit = x[i].unit;
                }
            }
            return (new Intl.NumberFormat("en", { style: "decimal", maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(num)) + unit;
        }

        function renderState(stateFull) {
            var state = stateFull.DatasetState;
            if (state.State.Status == "Pending") {
                $(this).append(state.State.Status);
            }

            setTimeout(() => {
                if (requestsCount != 0) {
                    $(".mw").addClass("loading");
                } else {
                    $(".mw").removeClass("loading");
                }
            }, 500);
            
            var stats = stateFull.Stats;
            var url = new URL(window.location.href);
            for (var i = 0; i < stats.AggregationResults.length; i++) {
                var r = stats.AggregationResults[i];
                var $pnl = $("#" + r.Id);
                $pnl.empty();

                var filtered = false;
                for (var fIndex = 0; fIndex < stateFull.Filters.length; fIndex++) {
                    if (stateFull.Filters[fIndex].Column == r.FilterColumn) {
                        filtered = true;
                        break;
                    }
                }
                if (filtered) {
                    $pnl.addClass("filtered");
                } else {
                    $pnl.removeClass("filtered");
                }

                if ($pnl.hasClass("mw-data-value")) {
                    $pnl.append($(`<div>${formatNum(r.Rows[0].Value)}</div>`));
                } else {
                    var maxValue = r.Rows.length > 0
                        ? r.Rows[0].Value
                        : 0;

                    var printRowsCount = r.Rows.length == 6
                        ? 6
                        : Math.min(5, r.Rows.length);

                    var expandResultsParamName = getShowAllResultParamName(r.Id);
                    if (url.searchParams.has(expandResultsParamName)) {
                        printRowsCount = r.Rows.length;
                    }

                    for (var j = 0; j < printRowsCount; j++) {
                        var row = r.Rows[j];
                        var isFilteredRow = false;
                        for (var fIndex = 0; fIndex < stateFull.Filters.length; fIndex++) {
                            if (stateFull.Filters[fIndex].Column == r.FilterColumn && stateFull.Filters[fIndex].Value == row.Category) {
                                isFilteredRow  = true;
                                break;
                            }
                        }
                        var textClass = "";
                        if (filtered) {
                            textClass = isFilteredRow
                                ? "text-dark"
                                : "text-muted";
                        }

                        var width = Math.max(1.5, row.Value / maxValue * 100);
                        var valueColorStyle = curVisibleLayer.AttributeName == r.FilterColumn
                            ? `background-color: ${curVisibleLayer.ValueVsColor[row.Category]}`
                            : '';

                        if (filtered && !isFilteredRow) {
                            valueColorStyle = 'background-color: #8b8b8b';
                        }

                        $pnl.append($(`
<div class='mw-r ${textClass} ${(isFilteredRow ? "selected" : "")}' data-value='${row.Category}' data-aggr-id='${r.Id}' data-filter-column='${r.FilterColumn}'>
    <div class='mw-r-c'>
        <span class='mw-c'>
            ${row.Category}
        </span>
        <span class='mw-v font-13'>${formatNum(row.Value.toFixed(2))}</span>
    </div>
    <div class='mb-2 mw-b-parent rounded bar'>
        <div class='mb-2 mw-b rounded' style='width: ${width.toFixed(0)}%; ${valueColorStyle}'></div>
    </div>
</div>`));
                    }
                    if (printRowsCount != r.Rows.length && r.Rows.length > 6) {
                        var otherSum = r.Rows.filter((x, index) => index >= 5).map(x=>x.Value).reduce((p, c) => p + c);
                        $pnl.append($(`
<div class='mw-r-other text-muted' data-id='${r.Id}' role='button'>
    <div class='mw-r-c'>
        <span class='mw-c other'>
            ОСТАЛЬНОЕ (${r.Rows.length - 5})
        </span>
        <span class='mw-v font-13'>${formatNum(otherSum.toFixed(2))}</span>
    </div>
    <div class='mb-2 mw-b-parent rounded bar'>
        <div class='mb-2 mw-b-inactive rounded'</div>
    </div>
</div>`));
                    }

                    if (printRowsCount == r.Rows.length && r.Rows.length > 6) {
                        $pnl.append($(`
<div class='mw-r-collapse text-muted text-center' data-id='${r.Id}' role='button'>
    <span class='mw-c'>
        СВЕРНУТЬ СПИСОК
    </span>
</div>`));
                    }
                }
            }

            for (var i = 0; i < stats.TopNResults.length; i++) {
                var r = stats.TopNResults[i];
                var $pnl = $("#" + r.Id);
                $pnl.empty();

                for (var j = 0; j < Math.min(15, r.Rows.length); j++) {
                    var row = r.Rows[j];
                    $pnl.append($(`<div><span class='mw-c'>${row.Category}</span><span class='mw-v text-secondary font-13'>${new Intl.NumberFormat("ru", { style: "decimal", maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(row.Value.toFixed(2))}</span></div>`));
                }
            }

            $map.addClass("web-map-control");

            /*$mapWrapper.addClass("position-fixed");
           
            $mapWrapper.width($this.width());
            $mapWrapper.css("top", $this.offset().top);*/
            if (mapAlreadyRendered) {
                mapGlobal.updateSize();
                return;
            }

            window.onresize = function () {
                setTimeout(function () {
                    /*$mapWrapper.width($this.width());*/
                    mapGlobal.updateSize();
                }, 200);
            }
            

            var layers = [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ];

            for (var i = 0; i < state.State.WmsLayers.length; i++) {
                var wmsLayerInfo = state.State.WmsLayers[i];
                var schemaLayer = createRasterLayer(wmsLayerInfo.LayerName, wmsLayerInfo.GeoServerUrl, wmsLayerInfo.WorkspaceName, wmsLayerInfo.LayerName);
                schemaLayer.setVisible(wmsLayerInfo.LayerName == curVisibleLayer.LayerName);
                schemaLayer.set("name", wmsLayerInfo.LayerName);
                schemaLayer.set("isStateLayer", true);
                layers.push(schemaLayer);

                schemaLayer.getSource().on('tileloadstart', function (event) {
                    progress.addLoading();
                });

                schemaLayer.getSource().on('tileloadend', function (event) {
                    progress.addLoaded();
                });
                schemaLayer.getSource().on('tileloaderror', function (event) {
                    progress.addLoaded();
                });
            }
            
            var map = new ol.Map({
                controls: ol.control.defaults({ rotate: false }).extend([
                    new ol.control.FullScreen()
                ]),
                view: new ol.View({
                    center: [7951137.118857781, 6651040.097882961],
                    zoom: 5.5
                }),
                layers: layers,
                target: $map[0]
            });
            var initialBbox = stateFull.InitialBbox;

            map.getView().fit(ol.proj.transformExtent([initialBbox.Xmin, initialBbox.Ymin, initialBbox.Xmax, initialBbox.Ymax], `EPSG:${stateFull.Srid}`, 'EPSG:3857'));

            function onMoveEnd(evt) {
                const map = evt.map;
                
                const extent = ol.proj.transformExtent(map.getView().calculateExtent(map.getSize()), 'EPSG:3857', `EPSG:${stateFull.Srid}`)

                setFilters(setBbox(filters, extent));
            }

            map.on('moveend', onMoveEnd);
            mapGlobal = map;

            


            mapAlreadyRendered = true;

            
        }

        renderState(stateFull);

        function setBbox(filters, bbox) {
            filters = JSON.parse(JSON.stringify(filters));
            filters.bbox = bbox;
            return filters;
        }

        function toggleColumnFilter(filters, filterColumn, value) {
            filters = JSON.parse(JSON.stringify(filters));

            for (var i = 0; i < filters.filters.length; i++) {
                var filter = filters.filters[i];
                if (filter.Column == filterColumn && filter.Value == value) {
                    filters.filters.splice(i, 1);
                    return filters;
                }
            }
            filters.filters.push({ Column: filterColumn, Value: value });
            return filters;
        }

        $(document).on("click", ".mw-r", (e) => {
            var value = $(e.currentTarget).data("value");
            var filterColumn = $(e.currentTarget).data("filterColumn");
            setFilters(toggleColumnFilter(filters, filterColumn, value));
            $(e.currentTarget).toggleClass("selected");
            console.log(value);
        });

        $(document).on("click", ".mw-r-other", (e) => {
            var id = $(e.currentTarget).data("id");
            var pName = getShowAllResultParamName(id);
            var curUrl = new URL(window.location);

            if (curUrl.searchParams.has(pName)) {
                return;
            }

            curUrl.searchParams.set(pName, 1);
            history.replaceState({}, null, curUrl.href);
            refreshState();
        });

        $(document).on("click", ".mw-r-collapse", (e) => {
            var id = $(e.currentTarget).data("id");
            var pName = getShowAllResultParamName(id);
            var curUrl = new URL(window.location);

            if (!curUrl.searchParams.has(pName)) {
                return;
            }

            curUrl.searchParams.delete(pName);
            history.replaceState({}, null, curUrl.href);
            refreshState();
        });

        function setVisibleLayer(wmsLayer) {
            $(".select-layer").each(function () {
                var $i = $(this);
                $i.removeClass("text-primary selected");
                $i.addClass("text-secondary");
            });
            mapGlobal.getLayers().forEach(x => {
                if (x.get("name") == curVisibleLayer.LayerName) {
                    x.setVisible(false);
                }
            });

            curVisibleLayer = wmsLayer;
            $(".select-layer").each(function() {
                var $i = $(this);
                if ($i.data("column") == curVisibleLayer.AttributeName) {
                    $i.addClass("text-primary selected");
                    $i.removeClass("text-secondary");
                }
            });

            mapGlobal.getLayers().forEach(x => {
                if (x.get("name") == curVisibleLayer.LayerName) {
                    x.setVisible(true);
                }
            });
            refreshState();
        }

        $(document).on("click", ".select-layer", (e) => {
            var $clickedItem = $(e.target);
            var column = $clickedItem.data("column");
            setVisibleLayer(
                $clickedItem.hasClass("selected")
                    ? stateFull.DatasetState.State.WmsLayers[0]
                    : stateFull.DatasetState.State.WmsLayers.find(x => x.AttributeName == column)
            );
        });

        var $mapsyData = $(".mapsy-data");
        var $switcherIcon = $(".mw-data-panel-switcher i");

        function toggleSwitchClasses() {
            $mapsyData.toggleClass("toggled");
            $switcherIcon.toggleClass("dripicons-chevron-left dripicons-chevron-right");
        }

        $(document).on("click", ".mw-data-panel-switcher", toggleSwitchClasses);

        $(document).on("swiped-left", ".mw-data-panel-switcher", (e) => {
            if ($mapsyData.hasClass("toggled")) {
                toggleSwitchClasses();
            }
        });

        $(document).on("swiped-right", ".mapsy-data", toggleSwitchClasses);
    });
});