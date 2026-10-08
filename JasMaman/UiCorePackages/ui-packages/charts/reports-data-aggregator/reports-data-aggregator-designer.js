$(document).ready(function ($) {
    $(".reports-data-aggregator-designer").each(function () {
        var $this = $(this);
        var editorName = $this.attr("editorName");
        var dimensions = JSON.parse($this.attr("dimensions"));
        var dataCols = JSON.parse($this.attr("dataCols"));
        var value = JSON.parse($this.attr("value"));

        function getUlWithHeader(headerText, ulId, ulClass) {
            if (headerText) {
                return "<span class='pg-group-title'>{0}</span><ul id='{1}' class='{2}'>".format(headerText, ulId, ulClass);
            }
            return "<ul id='{0}' class='{1}'>".format(ulId, ulClass);
        }

        var markup = "<table class='markup-table'>"
            + "<tr><td class='left-col-header'>{0}</td><td class='middle-col-header'>{1}</td><td class='right-col-header'>{2}</td></tr>".format("Поля группировки", "Структура вывода", "Поля данных")
            + "<tr>"
            + "<td class='left-col'>{0}</td>".format(getUlWithHeader(null, "pgDimFieldsAll", "pg-group-fields"))
            + "<td class='middle-col'><table><tr><td>{0}</td></tr><tr><td>{1}</td></tr></table></td>".format(getUlWithHeader("По колонкам", "pgDimFieldsCols", "pg-group-fields"), getUlWithHeader("По строкам", "pgDimFieldsRows", "pg-group-fields"))
            + "<td class='right-col'>{0}</td>".format(getUlWithHeader(null, "pgDataFieldsAll", "pg-data-fields"))
            + "</tr>"
            + "</table>";

        var $markup = $(markup);

        $this.append($markup);


        var $dimFieldsAll = $markup.find("#pgDimFieldsAll");
        var $dimFieldsCols = $markup.find("#pgDimFieldsCols");
        var $dimFieldsRows = $markup.find("#pgDimFieldsRows");

        var $allGroupFieldsSelect = $markup.find(".pg-group-fields");
        $allGroupFieldsSelect.sortable({
            connectWith: ".pg-group-fields",
            start: function () {
                $allGroupFieldsSelect.addClass("activated");
            },
            stop: function () {
                $allGroupFieldsSelect.removeClass("activated");
            },
        });
        $allGroupFieldsSelect.disableSelection();

        for (var i = 0; i < dimensions.length; i++) {
            var curDim = dimensions[i];
            $dimFieldsAll.append("<li class='dim-field' val='{0}'>{1}</li>".format(curDim.FieldName, curDim.Text));
        }

        $dimFieldsAll.append("<li class='dim-data-field' val='{0}'><div class='dim-data-field-text'>{1}</div>{2}</li>".format("SYSTEM_DataColumns", "ДАННЫЕ ДЛЯ ВЫВОДА", getUlWithHeader(null, "pgDataFieldsOutput", "pg-data-fields")));

        var $dataFieldsAll = $markup.find("#pgDataFieldsAll");
        var $dataFieldsSelected = $markup.find("#pgDataFieldsOutput");

        var $allDataFieldsSelect = $markup.find(".pg-data-fields");
        $allDataFieldsSelect.sortable({
            connectWith: ".pg-data-fields",
            start: function () {
                $allDataFieldsSelect.addClass("activated");
            },
            stop: function () {
                $allDataFieldsSelect.removeClass("activated");
            },
        });
        $allDataFieldsSelect.disableSelection();

        for (i = 0; i < dataCols.length; i++) {
            var curCol = dataCols[i];
            $dataFieldsAll.append("<li class='' val='{0}'>{1}</li>".format(curCol.FieldName, curCol.Text));
        }

        function moveDataColToDefaultContainer() {
            $item = $dimFieldsAll.find("li[val='{0}']".format("SYSTEM_DataColumns"));
            $dimFieldsCols.append($item);
        }

        if (value) {
            for (i = 0; i < value.Cols.length; i++) {
                var $item = $dimFieldsAll.find("li[val='{0}']".format(value.Cols[i].FieldName));
                $dimFieldsCols.append($item);
            }
            for (i = 0; i < value.Rows.length; i++) {
                $item = $dimFieldsAll.find("li[val='{0}']".format(value.Rows[i].FieldName));
                $dimFieldsRows.append($item);
            }
            if(value.Cols.length == 0 && value.Rows.length == 0) {
                moveDataColToDefaultContainer();
            }
            for (i = 0; i < value.DataCols.length; i++) {
                $item = $dataFieldsAll.find("li[val='{0}']".format(value.DataCols[i]));
                $dataFieldsSelected.append($item);
            }
        }else {
            moveDataColToDefaultContainer();
        }

        $this.closest("form").submit(function () {
            var $input = $("<input type='hidden'>");
            $input.attr("name", editorName);
            var val = { Cols: [], Rows: [], DataCols: [] };

            $dimFieldsCols.find(">li").each(function () {
                val.Cols.push({ FieldName: $(this).attr("val") });
            });
            $dimFieldsRows.find(">li").each(function () {
                val.Rows.push({ FieldName: $(this).attr("val") });
            });
            $dataFieldsSelected.find(">li").each(function () {
                val.DataCols.push($(this).attr("val"));
            });

            $input.val(JSON.stringify(val));
            $(this).append($input);
        });
    });
});