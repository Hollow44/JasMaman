class CustomItemList extends React.Component {
    constructor(props) {
        super(props);
        var items = this.props.items;
        if (items === undefined || items === null) {
            items = [];
        }
        items = items.map(x => {
            var inputs = $.extend(true, [], this.props.inputs);
            for (var i = 0; i < inputs.length; i++) {
                var input = inputs[i];
                input.Value = x[input.Name];
                this.prepareInput(input);
            }
            return { Inputs: inputs };
        });
        this.state = {
            items: items,
            inputs: this.props.inputs,
            showSelectModal: false,
            editRowIndex: null,
            editRequestId: 0
        };
        this.prepareInput = this.prepareInput.bind(this);
        this.getDateFromStr = this.getDateFromStr.bind(this);
        this.getEmptyItem = this.getEmptyItem.bind(this);
        this.getItemByRowIndex = this.getItemByRowIndex.bind(this);
        this.showEditor = this.showEditor.bind(this);
        this.closeEditor = this.closeEditor.bind(this);
        this.saveItemAndCloseEditor = this.saveItemAndCloseEditor.bind(this);
        this.getDownloadUrl = this.getDownloadUrl.bind(this);
        this.redirectToFile = this.redirectToFile.bind(this);
    }
    prepareInput(input) {
        input.VisibleValue = input.Value;
        
        if (input.InputType === "Reference" && input.Value) {
            input.VisibleValue = input.RefItems.find(x => x.Code === input.Value).Text;
        }

        if (input.InputType === "CollectionModel" && input.Value) {
            input.VisibleValue = input.Value.SearchItemText;
        }

        if (input.InputType === "CollectionModelList" && input.Value) {
            input.VisibleValue = input.Value.map(i => i.SearchItemText).join(", ");
        }

        if (input.InputType === "Date" && input.Value) {
            var date = this.getDateFromStr(input.Value);
            input.Value = date;
            input.VisibleValue = Utils.dateToString(date);
            if (input.MinValue) {
                input.MinValue = this.getDateFromStr(input.MinValue);
            }
            if (input.MaxValue) {
                input.MaxValue = this.getDateFromStr(input.MaxValue);
            }
        }

        if (input.VisibleValue === null || input.VisibleValue === undefined) {
            input.VisibleValue = "";
        }
    }
    getDateFromStr(newtonsoftJsonSerializedDateString) {
        if (newtonsoftJsonSerializedDateString instanceof Date) {
            return newtonsoftJsonSerializedDateString;
        }
        //2019-12-12T00:00:00+06:00 примерно вот так выглядит сериализованная строка. нас timezone не интересует, так как все даты считаются по времени Астаны
        const year = newtonsoftJsonSerializedDateString.substring(0, 4);
        const month = newtonsoftJsonSerializedDateString.substring(5, 7);
        const day = newtonsoftJsonSerializedDateString.substring(8, 10);
        return new Date(Date.parse(newtonsoftJsonSerializedDateString));
    }
    
    getEmptyItem() {
        var inputs = $.extend(true, [], this.props.inputs);
        for (var i = 0; i < inputs.length; i++) {
            this.prepareInput(inputs[i]);
        }
        return {
            Inputs: inputs
        };
    }

    getItemByRowIndex(rowIndex) {
        if (rowIndex === -1) {
            return this.getEmptyItem();
        } else {
            return this.state.items[rowIndex];
        }
    }
    showEditor(rowIndex) {
        this.setState({ editRowIndex: rowIndex, editRequestId: this.state.editRequestId + 1 });
    }
    redirectToFile(fileId) {
        $.ajax({
            url: "/ru/file/get-download-url/" + fileId,
            type: "GET"
        }).done(function (result) {
            window.location.href = result;
        });
	}
    tryRemove(rowIndex) {
        if (confirm("Удалить запись?") !== true) {
            return;
        }
        var items = $.extend(true, [], this.state.items);
        items.splice(rowIndex, 1);
        this.setState({ items: items });
    }
    closeEditor() {
        this.setState({ editRowIndex: null });
    }
    saveItemAndCloseEditor(inputs, rowIndex) {
        inputs = $.extend(true, [], inputs);
        inputs.forEach(input => this.prepareInput(input));
        var items = $.extend(true, [], this.state.items);
        if (rowIndex === -1) {
            items.push({Inputs: inputs});
        } else {
            items[rowIndex].Inputs = inputs;
        }
        this.setState({ items: items });
        this.closeEditor();
    }
    getOpsCellIfNotReadonly(rowIndex) {
        if (this.props.readonly) {
            return null;
        }
        return (<td>
            <span className="badge badge-success cursor-pointer" onClick={e => this.showEditor(rowIndex)}>Редактировать</span>
            <span>&nbsp;</span>
            <span className="badge badge-danger cursor-pointer" onClick={e => this.tryRemove(rowIndex)}>Удалить</span>
        </td>);
    }
    getDownloadUrl(fileId) {
        var url = null;
        $.ajax({
            url: "/ru/file/get-download-url/" + fileId,
            success: function (result) {
                url = result;
            }.bind(this)
        })
        return url;
    }
    
    render() {
        const items = this.state.items.map((item, index) => 
            (<tr key={item.Id} className="custom-item">
                <td>{index + 1}</td>
                {this.getOpsCellIfNotReadonly(index)}
                <td>{item.Inputs.map((itm) => {
                    if (itm.InputType === "File" && itm.Value !== null) {
                        return itm.Value.map((file) => {
                            return (<div><a className="file-name" target="_blank" onClick={e => this.redirectToFile(file.FileId)}>{file.FileName}</a>
                                <span className="file-size-info"> {file.HumanReadableFileSize}</span></div>);
                        });
                    } else {
                        return (<div><b>{itm.Text}</b>{": " + itm.VisibleValue.toString()}</div>)
					}
                })}</td>
            </tr>)
        );
       
        var empty = null;
        if (this.state.items.length === 0) {
            empty = <tr key={"empty"} className="empty-item"><td colSpan={(this.props.readonly === true ? 2: 3)}>Нет записей</td></tr>;
        }

        var customItemEditor = null;
        if (this.state.editRowIndex !== null) {
            customItemEditor = <CustomInputList show key={this.state.editRequestId} text={this.props.text} inputs={this.getItemByRowIndex(this.state.editRowIndex).Inputs} onCancel={this.closeEditor} onSave={inputs => this.saveItemAndCloseEditor(inputs, this.state.editRowIndex)} />;
        }
        var val = this.state.items.map(x => {
            var ret = {};
            for (var inputIndex = 0; inputIndex < x.Inputs.length; inputIndex++) {
                var curInput = x.Inputs[inputIndex];
                ret[curInput.Name] = curInput.Value;
            }
            return ret;
        });
        var addBtn = null;
        var operationsHeaderCell = null;
        if (this.props.readonly !== true) {
            addBtn = (<div>
                <button className="btn btn-primary" type="button" onClick={e => this.showEditor(-1)}>Добавить</button>
            </div>);
            operationsHeaderCell = <th width="180px">Операции</th>;
        }
        return (
            <div>
                {addBtn}
                <div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th width="20px">№</th>
                                {operationsHeaderCell}
                                <th>Данные</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items}
                            {empty}
                        </tbody>
                    </table>
                </div>
                {customItemEditor}
                <input type="hidden" value={JSON.stringify(val)} name={this.props.name} />
            </div>
        );
    }
}

$(document).ready(function () {
    $(".custom-object-list-editor").each(function () {
        const $this = $(this);
        const editorName = $this.data("editorName");
        const isReadonly = $this.data("readonly");
        const items = $this.data("items");
        const inputs = $this.data("inputs");
        const text = $this.data("text");
        ReactDOM.render(
            <CustomItemList name={editorName} text={text} readonly={isReadonly} items={items} inputs={inputs}/>,
            this
        );
    });
});