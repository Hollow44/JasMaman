/*
/* csField #1#

function ScField(parentTable, fieldName) {
    this._parentTable = parentTable;
    this._fieldName = fieldName;
}

ScField.prototype.parentTable = function (value) {
    if (value === undefined)//getter
        return this._parentTable;
    this._parentTable = value;
    return undefined;
};

ScField.prototype.fieldName = function(value) {
    if (value === undefined)
        return this._fieldName;
    this._fieldName = value;
    return undefined;
};

/* end scField #1#


function ScFieldInfo(name, text, type) {
    this._fieldName = name;
    this._fieldText = text;
    this._fieldType = type;
}
ScFieldInfo.prototype.fieldName = function (value) {
    if (value === undefined)
        return this._fieldName;
    this._fieldName = value;
    return undefined;
};
ScFieldInfo.prototype.fieldText = function (value) {
    if (value === undefined)
        return this._fieldText;
    this._fieldText = value;
    return undefined;
};
ScFieldInfo.prototype.fieldType = function(value) {
    if (value === undefined) {
        return this._fieldType;
    }
    this._fieldType = value;
    return undefined;
};

*/
