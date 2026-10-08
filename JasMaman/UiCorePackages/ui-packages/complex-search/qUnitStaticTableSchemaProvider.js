(function ($) {
    $.extend({
        qUnitStaticTableSchemaProvider: function (qUnitInfo, onGetQUnitSchemaSuccess) {
            var getQueryTableSchemaUrl = "";
            qUnitInfo.schemaHandler.params.forEach(function (param) {
                if (param.name == "get-query-table-schema") {
                    getQueryTableSchemaUrl = param.value;
                }
            });
            $.ajax({
                url: getQueryTableSchemaUrl,
                data: { tableName: qUnitInfo.name },
                dataType: "JSON",
                success: function (schemaXml) {
                    var table = qUnitFromXml(schemaXml.Xml);
                    onGetQUnitSchemaSuccess(table);
                }
            });
        }
    });
} (jQuery));
