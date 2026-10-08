class CustomInput extends React.Component {
    constructor(props) {
        super(props);
	}


    onMultiSearchChange(field, value) {
        this.setState({ [field]: value });
    }

    render() {
		var input = this.props.input;
		this.props.blocked = input.IsReadOnly;
        if (input.InputType === "Decimal" || input.InputType === "Int") {
            return <input className="form-control" type="number" onChange={e => this.props.onChange(e.target.valueAsNumber)} value={input.Value} disabled={this.props.blocked} name={input.Name} key={input.Name} />;
        }
        if (input.InputType === "Text") {
            if (input.IsMultiline) {
                return <textarea className="form-control" onChange={e => this.props.onChange(e.target.value)} value={input.Value} disabled={this.props.blocked} name={input.Name} key={input.Name} ></textarea>
			}
            return <input className="form-control" onChange={e => this.props.onChange(e.target.value)} value={input.Value} disabled={this.props.blocked} name={input.Name} key={input.Name} />;
        }
        if (input.InputType === "Reference") {
            var emptyOption = (!input.Value) ? <option>-</option> : null;
            return (<select className="form-control" onChange={e => this.props.onChange(e.target.value)} value={input.Value} disabled={this.props.blocked} name={input.Name} key={input.Name}>
                {emptyOption}
                {input.RefItems.map(i => <option value={i.Code}>{i.Text}</option>)}
            </select>
            );
        }
        if (input.InputType === "Boolean") {
            return (<select className="form-control" onChange={e => this.props.onChange(e.target.value)} value={input.Value} disabled={this.props.blocked} name={input.Name} key={input.Name}>
                {((!input.Value) ? <option>-</option> : null)}
                {input.RefItems.map(i => <option value={i.Code}>{i.Text}</option>)}
            </select>
            );
        }
        if (input.InputType === "File") {
            //return <input className="form-control" type="file" onChange={e => this.props.onChange(e.target.value)} value={input.Value} disabled={this.props.blocked} name={input.Name} key={input.Name} />;
            return <FileUploadEditor name={input.Name} files={input.Value} fileUploadUrl={input.FileUploadUrl} description="Документы" onChange={e => this.props.onChange(e.target.value)} disabled={this.props.blocked} />
        }
        if (input.InputType === "Date") {
            var valueForDateInput = "";
            if (input.Value) {
                valueForDateInput = Utils.dateToInputDateValue(input.Value);
            }
            return <input className="form-control" type="date" onChange={e => this.props.onChange(e.target.valueAsDate)} value={valueForDateInput} disabled={this.props.blocked} name={input.Name} key={input.Name} min={Utils.dateToInputDateValue(input.MinValue || new Date(1900, 0, 1))} max={Utils.dateToInputDateValue(input.MaxValue || new Date(2050, 0, 1))} />;
        }

        if (input.InputType === "DateTime") {
            var valueForDateInput = "";
            if (input.Value) {
                valueForDateInput = Utils.dateToInputDateValue(input.Value);
            }
            return <input className="form-control" type="datetime-local" onChange={e => this.props.onChange(e.target.valueAsDate)} value={valueForDateInput} disabled={this.props.blocked} name={input.Name} key={input.Name} min={Utils.dateToInputDateValue(input.MinValue || new Date(1900, 0, 1))} max={Utils.dateToInputDateValue(input.MaxValue || new Date(2050, 0, 1))} />;
        }

        if (input.InputType === "CollectionModel") {
            return <SearchCollectionEditorV2 name={input.Name} dontPutHiddenInput onChange={e => this.props.onChange(e)} value={input.Value} querySettings={JSON.parse(input.QuerySettings)} searchCollectionUrl={input.ModelCollectionUrl} searchDialogHeaderText="Выбор" queryInputPlaceholder="" key={input.Name} />
        }

        if (input.InputType === "CollectionModelList") {
            return <MultiSearchCollectionEditorV2 name={input.Name} dontPutHiddenInput onChange={e => this.props.onChange(e)} items={input.Value} querySettings={JSON.parse(input.QuerySettings)} searchCollectionUrl = { input.ModelCollectionUrl } searchDialogHeaderText = "Выбор" queryInputPlaceholder = "" key = { input.Name } />
        }

        throw "Не удалось определить редактор данных : " + input.InputType;
    }
}