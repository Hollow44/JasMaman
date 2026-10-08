// declare SRS names
proj4.defs("EPSG:32642", "+proj=utm +zone=42 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:3395", "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");

// declare layers config
var gisLayers = {
    schematicFull: "gosreestr:kz",
    schematicFullRca: "gosreestr:kz_rca",
    buildsRca: "gosreestr:kz_build_rca",
    roadsRca: "gosreestr:kz_road_rca",
    additionalMassivesRca: "gosreestr:kz_massive_rca",
    settlementsRca: "gosreestr:kz_settlement_rca",
    hybridFull: "gosreestr:!none",  // -> kz_hybrid
    raster: "gosreestr:a1",
    addressRegistryBinded: "gosreestr:kz_build_ar",
    additionalMassives: "gosreestr:kz_massive",
    builds: "gosreestr:kz_build",
    buildsIdField:"id",
    roads:"gosreestr:kz_road",
    roadsResp:"gosreestr:kz_road_resp",
    roadsObl:"gosreestr:kz_road_obl",
    railways:"gosreestr:kz_railway",
    obl:"gosreestr:kz_region",
    rajon:"gosreestr:kz_district",
    settlements:"gosreestr:kz_settlement",
    defaultSrsName:"EPSG:3395",
    mapBounds:[5175907.09371032, 4921291.91130957, 9719922.10666375, 7412812.53542968],
    minZoom:5,
    maxZoom:19,

    mapWmsUrl: "https://maps.gosreestr.kz/geoserver/gosreestr/wms",
    mapGwcWmsUrl: "https://maps.gosreestr.kz/geoserver/gwc/service/wms",    // cached layers for big raster data etc..
};
window.gisLayers = gisLayers;

// declare app for GIS
window.app = {};
var app = window.app;

// declare common map functions
ol.Map.prototype.deactivateControls = function(sender) {
    var map = this;
    var controls = map.getControls();
    for(var i=0;i<controls.getLength();i++) {
        var curControl = controls.item(i);
        if(curControl.onControlsDeactivate) {
            curControl.onControlsDeactivate(sender);
        }
    }
};

ol.Map.prototype.refreshLayers = function() {
    var map = this;
    var mapLayers = map.getLayers();
    for (var i = 0; i < mapLayers.getLength(); i++) {
        var curLayer = mapLayers.item(i);
        var layerSource = curLayer.getSource();
        if(layerSource.updateParams) {  // TODO: check layer type and update only tile layers...
            layerSource.updateParams({ rand: Math.random() });
        }
        if (!layerSource.refresh) { 
            continue;
        }
        layerSource.refresh({ force: true });
        curLayer.redraw(true);
        curLayer.refresh({ force: true });
    }
    map.renderSync();
};

//, 66 ?, 84 ? 
IsGeonimAdditionalMassive = function(geonimSubtype) {
    var additionalMassiveSubTypes = [ "23","24", "25","30","32","33","34","35","36","40","42","43","46","47","50","51","58","61","62","63","64","66","67","68","71","72","73","74","75","76","77","78","79","80","81","82","83","84","85","86","87","89","90","91","92","93"];
    return additionalMassiveSubTypes.indexOf(geonimSubtype) > -1;
};

IsSettlement = function(atsSubType) {
    var nonSettlementTypes = ["3","5","7","8","10","52","59"];
    return nonSettlementTypes.indexOf(atsSubType) == -1;
};

$.ArRcaChangeStatus = {
    Changed: 'Changed',
    Cleared: 'Cleared',
    None:'None'
};