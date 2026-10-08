function GetUrlParams() {
    var coordinateParams = {};
    var count = 0;
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        coordinateParams[key] = value;
        count += 1;
    });
    var result = {
        coordinateParams: coordinateParams,
        count: count
    };
    return result;
}