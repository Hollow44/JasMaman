function qUnitFromXml(xml) {
    var qUnitNode = $toXmlObject(xml).find("QUnitSchema");
    return qUnitFromQUnitXmlNode(qUnitNode);
}

function qUnitFromQUnitXmlNode(xmlQUnitNode) {
    var qUnitSchema = {
        name: xmlQUnitNode.attr("Name"),
        text: xmlQUnitNode.attr("Text"),
        canBeRoot:  xmlQUnitNode.attr("CanBeRoot") == "True",
        id: xmlQUnitNode.attr("Id"),
        rowNumOver: {
            partitionBy:[],
            orderBy:[]
        },
        joinType: "inner",
        fields: [],
        attrs: []
    };
    
    xmlQUnitNode.find("QUnitAttributes").find("QUnitAttribute").each(function () {
        var attr = $(this);
        qUnitSchema.attrs.push({ name: attr.attr("Name"), value: attr.attr("Value") });
    });

    xmlQUnitNode.find("JoinType").each(function () {
        qUnitSchema.joinType = $(this).attr("Value");
    });

    xmlQUnitNode.find("RowNumOver").find("PartitionBy").each(function () {
        var field = $(this);
        qUnitSchema.rowNumOver.partitionBy.push({ name: field.attr("Name"), parentId: field.attr("ParentId") });
    });

    xmlQUnitNode.find("RowNumOver").find("OrderBy").each(function () {
        var field = $(this);
        qUnitSchema.rowNumOver.orderBy.push({ name: field.attr("Name"), parentId: field.attr("ParentId"), orderType: field.attr("OrderType") });
    });

    xmlQUnitNode.find("Fields").find("Field").each(function () {
        var fieldNode = $(this);
        var field = {
            name: fieldNode.attr("Name"),
            text: fieldNode.attr("Text"),
            linkGroup:fieldNode.children("LinkGroup").attr("Value"),
            availableConditionOps: [],
            attrs: []
        };
        
        qUnitSchema.fields.push(field);
        fieldNode.find("FieldAttributes").find("FieldAttribute").each(function () {
            var attr = $(this);
            field.attrs.push({ name: attr.attr("Name"), value: attr.attr("Value") });
        });
        fieldNode.find("AvailableConditionOps").find("ConditionOperator").each(function () {
            var conditionOpNode = $(this);
            var conditionOp = {
                conditionOp: conditionOpNode.attr("Operator"),
                editors: []
            };
            field.availableConditionOps.push(conditionOp);
            conditionOpNode.find("Editors").find("Editor").each(function () {
                var editorNode = $(this);
                var editor = {
                    editorName: editorNode.attr("Name"),
                    editorParams: {}
                };
                conditionOp.editors.push(editor);
                editorNode.find("Params").find("Param").each(function () {
                    var editorParamNode = $(this);
                    editor.editorParams[editorParamNode.attr("Name")] = editorParamNode.attr("Value");
                });
            });
        });
    });
    return qUnitSchema;
}

function qUnitToXml(qUnitSchema) {
    var retXml = "";
    retXml += "<QUnitSchema {0}>".format(objToXmlAttrs({ Name: qUnitSchema.name, Text: qUnitSchema.text, CanBeRoot: (qUnitSchema.canBeRoot == true) ? "True" : "False", Id: qUnitSchema.id }));
    retXml += "<QUnitAttributes>";
    qUnitSchema.attrs.forEach(function (attr) {
        retXml += "<QUnitAttribute {0}>".format(objToXmlAttrs({ Name: attr.name, Value: attr.value }));
    });
    retXml += "</QUnitAttributes>";
    retXml += "<JoinType {0}/>".format(objToXmlAttrs({ Value: qUnitSchema.joinType }));
    retXml += "<RowNumOver>";
    if (!isNullOrUndefined(qUnitSchema.rowNumOver)) {
        retXml += "<PartitionBy>";
        qUnitSchema.rowNumOver.partitionBy.forEach(function (field) {
            retXml += "<Field {0} />".format(objToXmlAttrs({ ParentId: field.parentId, Name: field.name }));
        });
        retXml += "</PartitionBy>";
        retXml += "<OrderBy>";
        qUnitSchema.rowNumOver.orderBy.forEach(function (field) {
            retXml += "<Field {0} />".format(objToXmlAttrs({ ParentId: field.parentId, Name: field.name, OrderType: field.orderType }));
        });
        retXml += "</OrderBy>";
    }
    retXml += "</RowNumOver>";
    retXml += "<Fields>";
    qUnitSchema.fields.forEach(function (field) {
        retXml += "<Field {0}>".format(objToXmlAttrs({ Name: field.name, Text: field.text }));
        retXml += "<FieldAttributes>";
        field.attrs.forEach(function (fieldAttr) {
            retXml += "<FieldAttribute {0}/>".format(objToXmlAttrs({ Name: fieldAttr.name, Value: fieldAttr.value }));
        });
        retXml += "</FieldAttributes>";

        retXml += "<LinkGroup {0}/>".format(objToXmlAttrs({ Value: field.linkGroup }));

        retXml += "<AvailableConditionOps>";

        field.availableConditionOps.forEach(function (conditionOp) {
            retXml += "<ConditionOperator Operator='{0}'>".format(conditionOp.conditionOp);

            retXml += "<Editors>";

            conditionOp.editors.forEach(function (editor) {
                retXml += "<Editor Name='{0}'>".format(editor.editorName);
                retXml += "<Params>";
                for (var editorParam in editor.editorParams) {
                    retXml += "<Param Name='{0}' Value='{1}' />".format(editorParam, editor.editorParams[editorParam]);
                }
                retXml += "</Params>";
                retXml += "</Editor>";
            });
            retXml += "</Editors>";
            retXml += "</ConditionOperator>";
        });

        retXml += "</AvailableConditionOps>";
        retXml += "</Field>";
    });
    retXml += "</Fields>";
    retXml += "</QUnitSchema>";
    return retXml;
}