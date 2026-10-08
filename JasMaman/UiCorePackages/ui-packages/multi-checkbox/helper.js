function _getSelectedItemsString(whereToLook, _selectedItems) {
    let ret = "";
    $(_selectedItems).each(function (index, itemKey) {
        let text = _getSelectedItemText(whereToLook, itemKey);
        if (_isNullOrUndefined(text)) {
            Console.log(itemKey + " not found");
        } else {
            ret += text + "; ";
        }
    });
    return ret;
}
function _getSelectedItemText(whereToLook, itemKey) {
    let $whereToLook = $(whereToLook);
    let ret = null;
    $whereToLook.each(function (index, element) {
        if (element.Key == itemKey) {
            ret = element.Text;
            return false;
        } else if (!_isNullOrUndefined(element.Items)) {
            let result = _getSelectedItemText(element.Items, itemKey);
            if (!_isNullOrUndefined(result)) {
                ret = result;
                return false;
            }
        }
    });
    return ret;
}

function _getDialogSize() {
    return $(window).height() - 60 - 71 - 16 * 2 - 28 * 2;
}