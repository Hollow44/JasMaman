$(function () {
    var $grids = $(".sc-spreadsheet-grid");
    $grids.each(function () {
        var self = this;
        var $grid = $(this);
        var editedCells = self.editedCells;
        if (editedCells === undefined) {
            editedCells = {};
        }

        var $editor = $('<input type="text" />');
        $editor.css({
            padding: '0px',
            margin: '0px',
            width: '100%',
            height: '99%'
        });

        editedCells = JSON.parse($(".cs-spreadsheet-edited-cells", $grid).val());
        for (var eKey in editedCells) {
            var e = editedCells[eKey];
            var cId = e.CellId;
            var cVal = e.CellValue;
            var hasError = e.HasError == 'True';

            var $cell = $("td.sc-input-cell[cell-id='{0}']".format(cId), $grid);
            if (!$cell)
                continue;
            $cell.addClass("sc-spreadsheet-cell-edited");
            $cell.text(cVal);
            $cell.attr('raw-data', cVal);
            if (hasError)
                $cell.addClass("sc-spreadsheet-cell-error");
        }


        $grid.delegate("td.sc-spreadsheet-cell-editable", "click", function () {
            var $this = $(this);
            var cellId = $this.attr('cell-id');
            var rawData = $this.attr('raw-data');
            var style = $this.attr('style');
            var cellText = $this.text();

            $editor.val('');
            $editor.val(rawData);
            $editor.css(style);
            $this.empty();
            $this.append($editor);
            $editor.select();

            function editorEndEdit() {
                var editedVal = $editor.val();
                $this.empty();
                if (editedVal == rawData) {
                    $this.text(cellText);
                    return;
                }
                $this.addClass("sc-spreadsheet-cell-edited");
                $this.text(editedVal);
                $this.attr('raw-data', editedVal);

                var cellInfo = { CellId: cellId, CellValue: editedVal };

                editedCells["cell_" + cellId] = cellInfo;
            }

            function editorRollback() {
                $this.empty();
                $this.text(cellText);
            }

            function activateNextCell() {
                var $nextItem = $this.next("td.sc-spreadsheet-cell-editable");
                if ($nextItem.length == 0) {
                    $nextItem = $this.parent().nextAll().children("td.sc-spreadsheet-cell-editable");
                }
                $nextItem.first().click();  // activate item
            }

            $editor.focusout(editorEndEdit);

            $editor.click(function (event) {
                event.stopPropagation();
            });
            $editor.keydown(function (event) {
                if (event.which == 13) {                // ENTER
                    event.stopPropagation();
                    editorEndEdit();
                    return (false);
                } else if (event.which == 9) {          // TAB
                    event.stopPropagation();
                    editorEndEdit();
                    activateNextCell();
                    return (false);
                } else if (event.which == 27) {         //ESC
                    event.stopPropagation();
                    editorRollback();
                    return (false);
                }
            });
        });

        $grid.closest("form").submit(function () {
            var $form = $(this);
            var editorName = $grid.attr("editor-name");
            if ($("#"+editorName).length>0) {
                $("#"+editorName).val(JSON.stringify(editedCells));
            } else {
                var $hidden = $("<input name='{0}' id='{0}' type='hidden' />".format(editorName));
                $hidden.val(JSON.stringify(editedCells));
                $form.append($hidden);
            }
        });
    });
});