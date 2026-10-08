function ConditionValueText(value, text) {
    this._value = value;
    this._text = text;
}
ConditionValueText.prototype.getText = function () { return this._text; };
ConditionValueText.prototype.getValue = function () { return this._value; };

/* conditionMeta prototype */

function ConditionMeta(conditionSchema, qUnitsSchemas, querySchema) {
    this._conditionSchema = conditionSchema;
    this._qUnitsSchemas = qUnitsSchemas;
    this._querySchema = querySchema;

    this._resetMeta();
}
ConditionMeta.prototype._resetMeta = function () {
    if (this.isEmpty()) {
        this._fieldMeta = null;
    } else {
        this._fieldMeta = new ConditionFieldMeta(this._conditionSchema.leftParam, this._qUnitsSchemas, this._querySchema);
    }
};
ConditionMeta.prototype.isEmpty = function () {
    return this._conditionSchema.leftParam == null;
};

ConditionMeta.prototype.getFieldMeta = function () {
    return this._fieldMeta;
};

ConditionMeta.prototype.getConditionOpMeta = function () {
    return this.getFieldMeta().getConditionOpMeta(this._conditionSchema.conditionOp);
};

ConditionMeta.prototype.getEditorMeta = function () {
    return this.getConditionOpMeta().getEditorMeta(this._conditionSchema.rightParam.editorName);
};

ConditionMeta.prototype.setField = function (parentId, fieldName) {
    if (this._conditionSchema.leftParam == null) {
        this._conditionSchema.leftParam = {};
    }
    if (this._conditionSchema.leftParam.parentId == parentId && this._conditionSchema.leftParam.fieldName == fieldName) {
        return;
    }

    this._conditionSchema.leftParam.parentId = parentId;
    this._conditionSchema.leftParam.fieldName = fieldName;
    this._resetMeta();
    this.setConditionOp(this.getFieldMeta().getDefaultConditionOpMeta().getOperator());
};

ConditionMeta.prototype.setConditionOp = function (conditionOp) {
    if (this._conditionSchema.rightParam == null) {
        this._conditionSchema.rightParam = {};
    }

    if (this._conditionSchema.conditionOp == conditionOp) {
        return;
    }

    this._conditionSchema.conditionOp = conditionOp;
    var editorName = this.getConditionOpMeta().getDefaultEditorMeta().getEditorName();
    var curEditorMeta = this.getEditorMeta();
    if (curEditorMeta != null && curEditorMeta.getEditorName() == editorName) {
        return;
    }
    this.setEditor(editorName);

    this._conditionSchema.rightParam.value = null;
    this._conditionSchema.rightParam.text = null;
};

ConditionMeta.prototype.setEditor = function(editorName) {
    this._conditionSchema.rightParam.editorName = editorName;
};

ConditionMeta.prototype.setEditorValueAndText = function (conditionValueText) {
    this._conditionSchema.rightParam.value = conditionValueText.getValue();
    this._conditionSchema.rightParam.text = conditionValueText.getText();
};

ConditionMeta.prototype.getEditorValueText = function () {
    return new ConditionValueText(this._conditionSchema.rightParam.value, this._conditionSchema.rightParam.text);
};

/* end conditionMeta prototype */


function ConditionFieldMeta(fieldSchema, queryMeta, querySchema) {
    var self = this;
    this._fieldSchema = fieldSchema;
    this._qUnitsSchemas = queryMeta;
    this._querySchema = querySchema;
    var findJoinedTable = function (joinedTables) {
        var ret = null;
        joinedTables.forEach(function (joinedTable) {
            if (fieldSchema.parentId == joinedTable.id) {
                self._qUnitsSchemas.forEach(function (qUnitSchema) {
                    if (qUnitSchema.id == joinedTable.id) {
                        qUnitSchema.fields.forEach(function (field) {
                            if (field.name == fieldSchema.fieldName) {
                                ret = field;
                            }
                        });
                    }
                });
            } else if (joinedTable.joinedTables !== undefined) {
                var tempRet = findJoinedTable(joinedTable.joinedTables);
                if (tempRet != null) {
                    ret = tempRet;
                }
            }
        });
        return ret;
    };
    self._fieldMeta = findJoinedTable(querySchema.joinedTables);
    var conditionsOpsMeta = new Array();
    this._fieldMeta.availableConditionOps.forEach(function (condOp) {
        conditionsOpsMeta.push(new ConditionOpMeta(condOp));
    });
    this._conditionsOpsMeta = conditionsOpsMeta;
}

ConditionFieldMeta.prototype.getParentId = function () {
    return this._fieldSchema.parentId;
};
ConditionFieldMeta.prototype.getFieldName = function () {
    return this._fieldSchema.fieldName;
};
ConditionFieldMeta.prototype.getFieldText = function () {
    return this._fieldMeta.text;
};

ConditionFieldMeta.prototype.getConditionOpsMeta = function () {
    return this._conditionsOpsMeta;
};

ConditionFieldMeta.prototype.getConditionOpMeta = function (conditionOp) {
    var ret = null;
    this.getConditionOpsMeta().forEach(function (condOpMeta) {
        if (condOpMeta.getOperator() == conditionOp) {
            ret = condOpMeta;
        }
    });
    return ret;
};

ConditionFieldMeta.prototype.getDefaultConditionOpMeta = function () {
    var defaultConditionOp = this._fieldMeta.defaultConditionOp;
    if (isNullOrUndefined(defaultConditionOp) || defaultConditionOp == "") {
        return this.getConditionOpsMeta()[0];
    }
    return this.getConditionOpMeta(defaultConditionOp);
};

function ConditionOpMeta(conditionOpMeta) {
    this._conditionOpMeta = conditionOpMeta;

    var editorsMeta = new Array();
    this._conditionOpMeta.editors.forEach(function (editor) {
        editorsMeta.push(new EditorMeta(editor));
    });
    this._editorsMeta = editorsMeta;
}

ConditionOpMeta.prototype.getOperator = function () {
    return this._conditionOpMeta.conditionOp;
};
ConditionOpMeta.prototype.getOperatorText = function () {
    return this._conditionOpMeta.conditionOp;
};

ConditionOpMeta.prototype.getEditorsMeta = function () {
    return this._editorsMeta;
};
ConditionOpMeta.prototype.getDefaultEditorMeta = function () {
    if (isNullOrUndefined(this._conditionOpMeta.defaultEditor) || this._conditionOpMeta.defaultEditor == "")
        return this.getEditorsMeta()[0];
    return this.getEditorMeta(this._conditionOpMeta.defaultEditor);
};

ConditionOpMeta.prototype.getEditorMeta = function(editorName) {
    var ret = null;
    this.getEditorsMeta().forEach(function(editorMeta) {
        if (editorMeta.getEditorName() == editorName) {
            ret = editorMeta;
        }
    });
    return ret;
};


function EditorMeta(editorInfo) {
    this._editorInfo = editorInfo;
}

EditorMeta.prototype.getEditorName = function () {
    return this._editorInfo.editorName;
};

EditorMeta.prototype.getEditorParams = function() {
    return this._editorInfo.editorParams;
};
