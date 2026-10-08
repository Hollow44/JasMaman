$(document).ready(
    function ($) {
        $(".search-widget-table").each(function () {
            var $table = $(this);
            var queryName = $table.data("queryName");
            var saveOrderWidthUrl = $table.data("saveOrderWidthUrl");

            $(this).searchWidget({
				columnsChanged : function(cols){
					if (!saveOrderWidthUrl)
                    return;
                    
                    $.ajax({
                        url: saveOrderWidthUrl,
                        dataType: "JSON",
                        method: "POST",
                        data: {
                            queryName: queryName,
                            fields: JSON.stringify(cols)
                        },
                        success: function (result) { }
                    }); 
				}
			});
        });
        $(".sw-pagination").each(function () {
            var $pagination = $(this);
            var name = $pagination.data("paginationName");

            $pagination.delegate("li", "click", function () {

                var $navItem = $(this);
                if ($navItem.hasClass("disabled")) {
                    return;
                }
                var pageIndex = $navItem.data("pageIndex");

                var $form = $pagination.closest("form");
                $form.find("[name='{0}']".format(name)).remove();
                var $input = $("<input type='hidden' name='{0}'>".format(name));
                $input.val(pageIndex);
                $form.append($input);

                $form.submit();
            });
        });
        $(".sw-select-fields-editor").click(function () {
            var $selectFieldsEditor = $(this);
            var fields = $selectFieldsEditor.data("fields");
            var initialSelected = $selectFieldsEditor.data("selected");
            var editorName = $selectFieldsEditor.data("editorName");
            var title = $selectFieldsEditor.data("title");
            var selectedHash = {};
            for (var i = 0; i < initialSelected.length; i++) {
                selectedHash[initialSelected[i]] = true;
            }

            var $div = $("<div>");

            for (var fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
                var field = fields[fieldIndex];
                var $field = $("<span class='sw-select-field'>{0}</span>".format(field.Text));
                $field.data("field", field);
                if (selectedHash[field.FieldName]) {
                    $field.addClass("checked");
                }
                $div.append($field);
            }

            $div.dialog({
                modal: true,
                title: title,
                buttons: [
                    {
                        text: "Ok",
                        click: function () {
                            var $form = $selectFieldsEditor.closest("form");
                            var $existsFieldsSelectInput = $form.find("[name='{0}']".format(editorName));
                            $existsFieldsSelectInput.remove();

                            $existsFieldsSelectInput = $("<input type='hidden' name='{0}'>".format(editorName));
                            var allSelected = [];
                            $div.find(".sw-select-field.checked").each(function () {
                                var $field = $(this);
                                allSelected.push($field.data("field").FieldName);
                            });
                            $existsFieldsSelectInput.val(JSON.stringify({selected:allSelected, initialSelected: initialSelected}));

                            $form.append($existsFieldsSelectInput);
                            $form.submit();
                        }
                    },
                    {
                        text: "Отмена",
                        click: function () {
                            $div.dialog("close");
                        }
                    }
                ],
                close: function () {
                    $div.bDialog("destroy");
                }
            });

            $div.on("click", ".sw-select-field", function () {
                $(this).toggleClass("checked");
            });
        });
    }
);


(function ($){
	$.widget("yoda.searchWidget", {
		_create: function(){
			var self = this;
			var $this = $(self.element);
			var colOrderSizeChangedCallback = this.options.columnsChanged || function(){};
			$this.uniqueId();
			var searchWidgetId = $this.prop("id");
			var $tableHeaderWrapper= $this.find(".sw-table-header-sticky-wrapper");
			var $tableContentWrapper= $this.find(".sw-table-content-wrapper");
			$tableHeaderWrapper.scroll(function () { 
				$tableContentWrapper.scrollLeft($tableHeaderWrapper.scrollLeft());
			});
			$tableContentWrapper.scroll(function () { 
				$tableHeaderWrapper.scrollLeft($tableContentWrapper.scrollLeft());
			});
			var $tableFixedHeader = $tableHeaderWrapper.find(".sw-table-header");
			var $tableContent = $tableContentWrapper.find(".sw-table-content");
			enableDragAndDrop($tableFixedHeader, $tableContent);
			
			function callChangeCallback() {
				var fieldsArr = [];
				
				$tableFixedHeader.find("col").each(function(index){
				var $col = $(this);
					fieldsArr.push({fieldName: $col.data("colName"), width: parseInt($col.css("width"))});
				});
				colOrderSizeChangedCallback(fieldsArr);
			}
			
			function enableDragAndDrop($tableHeader, $tableContent) {
				var that = this;
				
				function moveTableCol($table, cellTagName, colIndex, targetColIndex, placeToRightSide) {
					var $sourceCol = $table.find("col:eq(" + colIndex + ")");
					var $targetCol = $table.find("col:eq(" + targetColIndex + ")");
					if (placeToRightSide == true) {
						$targetCol.after($sourceCol);
					} else {
						$targetCol.before($sourceCol);
					}

					$table.find("tr").each(function () {
						var $tr = $(this);
						var $sourceCell = $tr.find(cellTagName + ":eq(" + colIndex + ")");
						var $targetCell = $tr.find(cellTagName + ":eq(" + targetColIndex + ")");
						if (placeToRightSide == true) {
							$targetCell.after($sourceCell);
						} else {
							$targetCell.before($sourceCell);
						}
					});
				};
				
				function moveCol(colIndex, targetColIndex, placeToRightSide) {
					moveTableCol($tableHeader, "th", colIndex, targetColIndex, placeToRightSide);
					moveTableCol($tableContent, "td", colIndex, targetColIndex, placeToRightSide);
				}
								
				$tableHeader.find("th").draggable({
					cursor: "move",
					appendTo: 'body',
					cursorAt: { top: 0, left: 0 },
					cancel: ".sw-col-resize-pin",
					axis: "x",
					start: function (event, ui) {
						$(this).draggable('instance').offset.click = {
							left: Math.floor(ui.helper.width() / 2),
							top: Math.floor(ui.helper.height() / 2)
						};
					},
					helper: function (event, ui) {
						var text = $(event.target).text();
						var $helper = $("<div style='z-index:1005'>");
						$helper.text(text);
						return $helper;
					}
				}
				);
				$tableHeader.find("th").droppable({
					hoverClass: "ui-state-hover",
					drop: function (event, ui) {
						var $targetCell = $(this);

						var targetCellWidth = $targetCell.width();

						var $draggingEl = ui.helper;
						var draggingElWidth = $draggingEl.width();

						var targetCellOffsetLeft = $targetCell.offset().left;

						var dropLeftPosition = (ui.offset.left + draggingElWidth / 2) - (targetCellOffsetLeft + targetCellWidth / 2);

						var targetCellIndex = $targetCell.index();
						var sourceCellIndex = ui.draggable.index();
						moveCol(sourceCellIndex, targetCellIndex, dropLeftPosition > 0);
						callChangeCallback();
					}
				});
			};
			var mouseDown=null;
			$(document).on('mousedown touchstart', "#" + searchWidgetId + " .sw-col-resize-pin", function(e) {
				var $this = $(this);
				e.preventDefault();
							
				var $table = $this.closest(".sw-table-header");
				
				var $relatedTable = $table.closest(".search-table-widget").find(".sw-table-content");
				
				var tableWidth = parseInt($table.css("width"));
				
				var colIndex  = $this.closest("th").index();
				var $col = $($table.find("col")[colIndex]);
				var $relatedCol = $($relatedTable.find("col")[colIndex]);
				var colWidth = parseInt($col.css("width"));
				mouseDown = {
					colIndex: colIndex,
					$pressedPin: $this,
					$col: $col,
					initialCellWidth: colWidth,
					initialTableWidth: tableWidth,
					initPageX: e.pageX,
					$table: $table,
					$relatedTable: $relatedTable,
					$relatedCol: $relatedCol
				};
			});
			var minDist=50;
					
			
			$(document).on('mousemove touchmove', function(e) {
			  if(mouseDown) {
				e.preventDefault();
				var distX = parseInt(e.pageX - mouseDown.initPageX);
				var width = mouseDown.initialCellWidth + distX;
				if(width < 50){
					width = 50;
				}
								
				var totalWidth = mouseDown.initialTableWidth - mouseDown.initialCellWidth + width;
				mouseDown.$table.css("width", totalWidth);
				mouseDown.$relatedTable.css("width", totalWidth);
				mouseDown.$col.css("width", width);
				mouseDown.$relatedCol.css("width", width);
			  }
			});
			
			$(document).on('mouseup touchend', function(event) {
				if(mouseDown!=null) {
					callChangeCallback();
					mouseDown = null;
				}
			});
		},
	
		destroy: function(){
			$.Widget.prototype.destroy.call(this);
		},
	});
})(jQuery);

$(document).ready(function(){
	$(".sw-table-header-sticky-wrapper").perfectScrollbar();
	// $(".sw-table-content").perfectScrollbar();
});