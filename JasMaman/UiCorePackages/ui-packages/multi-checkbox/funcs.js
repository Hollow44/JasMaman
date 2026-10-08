function getModalFade() {
    return $("<div class='modal fade' data-backdrop='static' data-keyboard='false' tabindex='-1' role='dialog' aria-hidden='true'></div>");
}
function getModalDialog() {
    return $("<div class='modal-dialog modal-full-width'></div>");
}
function getModalContent() {
    return $("<div class='modal-content'></div>");
}
function getModalDialogHeader(headerText) {
    let $h4 = $("<h4 class='modal-title'>" + headerText + "</h4>");
    let $closeButton = $("<button type='button' class='close close-modal' data-dismiss='modal' aria-hidden='true'>×</button>");
    let $modalHeader = $("<div class='modal-header'></div>");
    $modalHeader.append($h4);
    $modalHeader.append($closeButton);
    return $modalHeader;
}

function getModalDialogFooter(readOnly, okText, closeText, checkAllText, uncheckAllText) {
    let $modalCheckAllButton = $("<button id='check-all' type='button' class='btn btn-secondary'>" + checkAllText + "</button>");
    let $modalUncheckAllButton = $("<button id='uncheck-all' type='button' class='btn btn-secondary'>" + uncheckAllText + "</button>");
    let $modalCloseButton = $("<button id='close' type='button' class='btn btn-light close-modal' data-dismiss='modal'>" + closeText + "</button>");
    let $modalOkButton = $("<button id='ok' type='button' class='btn btn-primary'>" + okText + "</button>");
    let $modalFooter = $("<div class='modal-footer'></div>");
    if (readOnly) {
        $modalFooter.append($modalCloseButton);
    } else {
        $modalFooter.append($modalCheckAllButton);
        $modalFooter.append($modalUncheckAllButton);
        $modalFooter.append($modalCloseButton);
        $modalFooter.append($modalOkButton);
    }
    return $modalFooter;
}
function _getSwitchElement(readOnly, key, text) {
    let $switchInput = $("<input " + (readOnly ? "disabled" : "") + " type='checkbox' class='custom-control-input' id='" + key + "'>");
    let $switchLabel = $("<label class='custom-control-label' for='" + key + "'>" + text + "</label>");
    let $switch = $("<div class='custom-control custom-switch' style='display:inline-block;'>");
    $switch.append($switchInput);
    $switch.append($switchLabel);
    $switch.attr("key", key);
    return $switch;
}

function createTree(readOnly, $items, $parentElement) {
    let $ul = $("<ul></ul>")
    $items.each(function (index, element) {
        let $switch = _getSwitchElement(readOnly, element.Key, element.Text);
        if (!_isNullOrUndefined($parentElement)) {
            $switch.attr("key", element.Key);
            $switch.attr("parent-key", $parentElement.attr("key"));
        } else {
            $switch.attr("key", element.Key);
            $switch.attr("parent-key", "null");
        }
        let $li = $("<li></li>");
        $li.css('list-style', 'none');
        //$li.attr("complect-key", element.Key)
        $li.append($switch);
        if (!_isNullOrUndefined(element.Items) && element.Items.length !== 0) {
            $li.attr('parent', '');
            $li.addClass('dripicons-minus');
            let $daughters = createTree(readOnly, $(element.Items), $switch)
            $daughters.attr("for-parent", element.Key)
            $li.append($daughters);

            $li.click(function (event) {
                if (event.target.tagName === "LI") {
                    var collapsed = $(this).hasClass("dripicons-plus");
                    if (collapsed) {
                        $(this).removeClass("dripicons-plus");
                        $(this).addClass("dripicons-minus");
                        $(this).find("ul[for-parent='" + element.Key + "']").show();
                    } else {
                        $(this).removeClass("dripicons-minus");
                        $(this).addClass("dripicons-plus");
                        $(this).find("ul[for-parent='" + element.Key + "']").hide();
                    }
                    return false;
                }
            });

        }
        $ul.append($li);
    });
    return $ul;
}



function _isNullOrUndefined(element) {
    if (element === undefined || element === null) {
        return true;
    }
    return false;
}
function getModalDialogBody() {
    let $modalContent = $("<div class='modal-body'></div>");
    return $modalContent;
}
function getModalDialogContainer(readOnly, items) {
    let $container = $("<div class='modal-dialog-container'></div>");
    $container.css("overflow", "hidden scroll");
    $container.css("height", "auto");
    $container.append(createTree(readOnly, $(items)));
    return $container;
}

//function getModalFade() {
//    return $("<div class='modal fade' data-backdrop='static' data-keyboard='false' tabindex='-1' role='dialog' aria-hidden='true'></div>");
//}
//function getModalDialog() {
//    return $("<div class='modal-dialog modal-full-width'></div>");
//}
//function getModalContent() {
//    return $("<div class='modal-content'></div>");
//}
//function getModalDialogHeader(headerText) {
//    let $h4 = $("<h4 class='modal-title'>" + headerText + "</h4>");
//    let $closeButton = $("<button type='button' class='close close-modal' data-dismiss='modal' aria-hidden='true'>×</button>");
//    let $modalHeader = $("<div class='modal-header'></div>");
//    $modalHeader.append($h4);
//    $modalHeader.append($closeButton);
//    return $modalHeader;
//}

//function getModalDialogFooter(readOnly, okText, closeText, checkAllText, uncheckAllText) {
//    let $modalCheckAllButton = $("<button id='check-all' type='button' class='btn btn-secondary'>" + checkAllText + "</button>");
//    let $modalUncheckAllButton = $("<button id='uncheck-all' type='button' class='btn btn-secondary'>" + uncheckAllText + "</button>");
//    let $modalCloseButton = $("<button id='close' type='button' class='btn btn-light close-modal' data-dismiss='modal'>" + closeText + "</button>");
//    let $modalOkButton = $("<button id='ok' type='button' class='btn btn-primary'>" + okText + "</button>");
//    let $modalFooter = $("<div class='modal-footer'></div>");
//    if (readOnly) {
//        $modalFooter.append($modalCloseButton);
//    } else {
//        $modalFooter.append($modalCheckAllButton);
//        $modalFooter.append($modalUncheckAllButton);
//        $modalFooter.append($modalCloseButton);
//        $modalFooter.append($modalOkButton);
//    }
//    return $modalFooter;
//}
//function _getSwitchElement(readOnly, key, text) {
//    let $switchInput = $("<input " + (readOnly ? "disabled": "") + " type='checkbox' class='custom-control-input' id='" + key + "'>");
//    let $switchLabel = $("<label class='custom-control-label' for='" + key + "'>" + text + "</label>");
//    let $switch = $("<div class='custom-control custom-switch'>");
//    $switch.append($switchInput);
//    $switch.append($switchLabel);
//    $switch.attr("key", key);
//    return $switch;
//}
//function printItems(readOnly, $container, $items, $parentElement) {
//    if (!_isNullOrUndefined($items) && $items.length !== 0) {
//        $items.each(function (index, element) {
//            let $switch = _getSwitchElement(readOnly, element.Key, element.Text);
//            if (!_isNullOrUndefined($parentElement)) {
//                $switch.css("margin-left", (parseInt($parentElement.css("margin-left")) + 16) + "px");
//                $switch.attr("key", element.Key);
//                $switch.attr("parent-key", $parentElement.attr("key"));
//            } else {
//                $switch.css("margin-left", "0px");
//                $switch.attr("key", element.Key);
//                $switch.attr("parent-key", "null");
//            }
//            $container.append($switch);
//            if (!_isNullOrUndefined(element.Items) && element.Items.length !== 0) {
//                let $containerChild = $("<div collapsable for-parent='" + element.Key + "'></div>");
//                printItems(readOnly, $containerChild, $(element.Items), $switch)
//                $container.append($containerChild);
//            }
//        });
//    }
//}

//function _isNullOrUndefined(element) {
//    if (element === undefined || element === null) {
//        return true;
//    }
//    return false;
//}
//function getModalDialogBody() {
//    let $modalContent = $("<div class='modal-body'></div>");
//    return $modalContent;
//}
//function getModalDialogContainer(readOnly, items) {
//    let $contaner = $("<div class='modal-dialog-container'></div>");
//    $contaner.css("overflow", "hidden scroll");
//    $contaner.css("height", "auto");
//    printItems(readOnly, $contaner, $(items));
//    return $contaner;
//}
