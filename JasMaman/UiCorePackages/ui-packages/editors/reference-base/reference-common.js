function $getJSONReference(refName, refGroup, refTable, parentVal, handler) {
    if (!refName) {
        throw "Имя справочника не может быть пустым";
    }
    if (!refGroup) {
        throw "Группа справочника не может быть пустым (передайте none если без группы)";
    }
    if (!refTable) {
        throw "Имя таблицы не может быть пустым";
    }
    return $.getJSON(
        rootDir + "reference-get/" + refTable + "/" + refGroup + "/" + refName + "/" + parentVal,
        handler
        );
}

function $getJSONReferenceFull(refName, refGroup, refTable, handler) {
    if (!refName) {
        throw "Имя справочника не может быть пустым";
    }
    if (!refGroup) {
        throw "Группа справочника не может быть пустым (передайте none если без группы)";
    }
    if (!refTable) {
        throw "Имя таблицы не может быть пустым";
    }
    return $.getJSON(
        rootDir + "reference-get-full/" + refTable + "/" + refGroup + "/" + refName,
        handler
        );
}

function $getJSONReferenceLimitedByLevel(refName, refGroup, refTable, refLevel, handler) {
    if (!refName) {
        throw "Имя справочника не может быть пустым";
    }
    if (!refGroup) {
        throw "Группа справочника не может быть пустым (передайте none если без группы)";
    }
    if (!refTable) {
        throw "Имя таблицы не может быть пустым";
    }
    return $.getJSON(
        rootDir + "reference-get-limited-by-level/" + refTable + "/" + refGroup + "/" + refName + "/" + refLevel,
        handler
        );
}

var uniqueIndex = 0;
function getUniqueIndex() {
    return (uniqueIndex++);
}

(function (jQuery) {
    jQuery.fn.hasAttr = function (name) {
        for (var i = 0, l = this.length; i < l; i++) {
            if (!!(this.attr(name) !== undefined)) {
                return true;
            }
        }
        return false;
    };
})(jQuery);


function ReferenceSelectDialog() {
    this._isClosed = false;
}

ReferenceSelectDialog.prototype.setOnClose = function (onCloseCallback) {
    this._onCloseFunc = onCloseCallback;
};

ReferenceSelectDialog.prototype.close = function () {
    if (this._onCloseFunc !== undefined) {
        this._onCloseFunc();
    }
    this._isClosed = true;
};
ReferenceSelectDialog.prototype.isClosed = function () {
    return this._isClosed;
};

ReferenceSelectDialog.prototype.markAsClosed = function () {
    this._isClosed = true;
};

var constRefSystemNullValue = "SYSTEM-NULL-VALUE";

var dataLoadingDiv = "<div class='loading-data-element' style='display:block'>Загрузка данных...</div>";
var checkedStyle = "ref-multiselect-item-state-checked";
var uncheckedStyle = "ref-multiselect-item-state-unchecked";
var intermediateStyle = "ref-multiselect-item-state-intermediate";

var funcRemoveAllClasses = function ($checkbox) {
    $checkbox.removeClass(checkedStyle);
    $checkbox.removeClass(uncheckedStyle);
    $checkbox.removeClass(intermediateStyle);
};

var funcSetVals = function ($multiselectRefsContext, vals) {
    vals.forEach(function (val) {
        var $chb = $(".ref-multiselect-item-checkbox[ref-value='" + val + "']", $multiselectRefsContext);
        funcRemoveAllClasses($chb);
        $chb.addClass(checkedStyle);

        var $subItemsContainer = $("#" + $chb.attr('ref-sub-items-container'));
        $subItemsContainer.find(".ref-multiselect-item-checkbox").each(
                    function () {
                        funcRemoveAllClasses($(this));
                        $(this).addClass(checkedStyle);
                    }
                );
    });
    $multiselectRefsContext.find(".ref-multiselect-item-checkbox." + uncheckedStyle).each(
                function () {
                    var $this = $(this);
                    var $childItemsContainer = $this.closest(".ref-item-and-childs-container").find(".ref-sub-items-container");
                    var uncheckedExsists = $childItemsContainer.find("." + uncheckedStyle + ":first").length > 0;
                    var checkedExists = $childItemsContainer.find("." + checkedStyle + ":first").length > 0;

                    funcRemoveAllClasses($this);
                    if (uncheckedExsists == true && checkedExists == true) {
                        $this.addClass(intermediateStyle);
                    } else if (checkedExists) {
                        $this.addClass(checkedStyle);
                    } else {
                        $this.addClass(uncheckedStyle);
                    }
                }

            );
};

function showMultiRefSelect(e, asDropMenu, offset, clipRectangleSize, refName, refGroup, refTable, refLevel, refDeepestLevel, isStaticReference, refValuesStoreId, refItemsDisplayId, dialogTitle) {
    var refValsId = refValuesStoreId;
    var refDisplayId = refItemsDisplayId;

    var values = $("#" + refValsId).val();
    var divClass = "div-for-dialog-temp";
    var refItemsContainerId = "refContainer-" + getUniqueIndex();
    var div = "<div class='" + divClass + "' title='" + dialogTitle + "' id='" + refItemsContainerId + "'>" + dataLoadingDiv + "<div>";

    $("#extra", document).append(div);
    var $div = $(document).find("#extra").find("." + divClass);
    var lockOkButton = true;
    var onOpen = function () {
        var allocateReference = function (childRefItems) {
            var html = getRefMultiselectItemsHtml(refName, childRefItems, refDeepestLevel, 1, $div);
            $div.empty().html(html);
            callAllReadyInObjectContext($div);
            funcSetVals($div, values.split(','));
            lockOkButton = false;
        };

        if (isStaticReference == true) {
            var reference = window.References.GetReference(refName);
            var refItems = reference.Items;
            allocateReference(refItems);
        } else {
            $getJSONReferenceLimitedByLevel(
                                refName, refGroup, refTable, refLevel,
                                allocateReference
                            );
        }
    };
    var onOk = function () {
        if (lockOkButton == true) {
            alert("Данные еще не загружены");
            return;
        }
        var vals = new Array();
        var texts = new Array();
        $div.find("." + checkedStyle).each(
                        function () {
                            vals.push($(this).attr("ref-value"));
                            texts.push($(this).text());
                        }
                    );
        var prevVal = $("#" + refValsId).val();
        var curVal = vals.join(",");
        if (prevVal != curVal) {
            $("#" + refValsId).val(curVal);
            $("#" + refValsId).change();
            $("#" + refDisplayId).text(texts.join("; "));
        }
    };

    if (asDropMenu == true) {
        var refSelectDivSize = {
            width: 400,
            height: 500
        };

        $div.addClass("filter-editor");
        $div.css("width", refSelectDivSize.width);
        $div.css("height", refSelectDivSize.height);
        $div.appendTo('body');


        var tipOffset = getTipPrefferedOffset(offset, clipRectangleSize, refSelectDivSize);
        $div.css("top", tipOffset.top);
        $div.css("left", tipOffset.left);
        $div.click(function (e) { e.stopPropagation(); });
        onOpen();
        //TODO с селект диалогом надо как нить по другому решать...
        var selectContextDlg = new ReferenceSelectDialog();
        var onLooseFocus = function () {
            $(document).unbind('click', onLooseFocus);
            if (selectContextDlg.isClosed())
                return;
            if (lockOkButton == true)
                return;
            onOk();
            selectContextDlg.markAsClosed();
            selectContextDlg.close();
        };
        selectContextDlg.setOnClose(onLooseFocus);
        $(document).bind('click', onLooseFocus);

        e.stopPropagation();

        return selectContextDlg;
    } else {
        var selectDlg = new ReferenceSelectDialog();
        $div.dialog({
            height: 600,
            width: 800,
            modal: true,
            open: onOpen,
            buttons: {
                "OK": function () {
                    selectDlg.close();
                },
                "Отмена": function () {
                    $div.dialog("close");
                }
            },
            close: function (e, ui) {
                $div.dialog('destroy');
                $div.empty().remove();
            }
        });
        selectDlg.setOnClose(
                function () {
                    onOk();
                    $div.dialog("close");
                }
                );
        return selectDlg;
    }
}

function getRefMultiselectItemsHtml(refName, refItems, refDeepestLevel, loadedLevel) {
    var itemsHtml = "<div class='refs-container'>";

    refItems.forEach(function (refItem) {
        var chbxId = "checkbox-ref-multiselect-" + getUniqueIndex();
        var subItemsContainer = chbxId + "-container";

        var itemHtml = "<div class='ref-item-and-childs-container'><div class='ref-multiselect-item'>";
        var subItemsHtml = "";
        if (refItem.Items != null && refItem.Items.length != 0) {
            subItemsHtml = getRefMultiselectItemsHtml(refName, refItem.Items, refDeepestLevel, loadedLevel + 1);
            itemHtml += "<span class='ref-multiselect-sub-items-expander ref-expander-state-collapsed' ref-name='" + refName + "' ref-checkbox-id='" + chbxId + "' ref-sub-items-container='" + subItemsContainer + "' ref-sub-item-level='" + loadedLevel + "' ref-deepest-level='" + refDeepestLevel + "' ref-loaded>+</span>";
        }

        /*itemHtml += "<span id='" + chbxId + "' class='ref-multiselect-item-checkbox ref-multiselect-item-state-unchecked' type='checkbox' ref-value='" + refItem.Value + "' ref-sub-items-container=" + subItemsContainer + ">&nbsp;</span><label class='ref-multiselect-item-label' for='" + chbxId + "'>" + refItem.Text + "</label></div>";*/
        itemHtml += "<span id='" + chbxId + "' class='ref-multiselect-item-checkbox ref-multiselect-item-state-unchecked' type='checkbox' ref-value='" + refItem.Value + "' ref-sub-items-container=" + subItemsContainer + ">" + refItem.Text + "</span></div>";
        itemHtml += "<div id='" + subItemsContainer + "' class='ref-sub-items-container ref-collapsed'>" + subItemsHtml + "</div></div>";

        itemsHtml += itemHtml;
    });
    itemsHtml += "</div>";
    return itemsHtml;
}

function $getNextRefPlainSelectCombo(refName, refGroup, refLevel) {
    var selector = ".ref-plain-select" + "[ref-group-name='" + refGroup + "']" + "[ref-name='" + refName + "']" + "[ref-level='" + (refLevel + 1) + "']";
    return $(selector);
}

function $getParentRefPlainSelectCombo(refName, refGroup, refLevel) {
    var selector = ".ref-plain-select" + "[ref-group-name='" + refGroup + "']" + "[ref-name='" + refName + "']" + "[ref-level='" + (refLevel - 1) + "']";
    return $(selector);
}

function allOrderedChildRefPlainSelectCombo(refName, refGroup, refLevel) {
    var retResult = new Array();
    var curRefLevel = refLevel;
    while (true) {
        var selector = ".ref-plain-select" + "[ref-group-name='" + refGroup + "']" + "[ref-name='" + refName + "']" + "[ref-level='" + (curRefLevel + 1) + "']";
        var $combo = $(selector);
        if ($combo.length == 0)
            break;
        retResult.push($combo);
        curRefLevel++;
    }
    return retResult;
}




/*
Получить справочник

reference: {
table:"",
group:"",
name:""
level:""
},
options: {
isStatic:false, //загрузить справочник из сервера или из статично зарегистрированного?
limitByLevel: true //элементы справочников, уровнем ниже чем level не загрузяться
},
callback: function(referenceItems){
}
*/
function getReference(referenceInfo, options, callback) {
    var defaultOptions = {
        isStatic: false,
        limitByLevel: false
    };
    var settings = $.extend({}, defaultOptions, options);

    if (settings.isStatic == true) {
        var ref = window.References.GetReference(referenceInfo.name);
        callback(ref.Items);
    } else {
        if (settings.isLimitByLevel == true) {
            $getJSONReferenceLimitedByLevel(
                referenceInfo.name,
                referenceInfo.group,
                referenceInfo.table,
                referenceInfo.level,
                callback
                );
        } else {
            $getJSONReferenceFull(
                referenceInfo.name,
                referenceInfo.group,
                referenceInfo.table,
                callback);
        }
    }
}