class SearchCollectionEditor extends React.Component {
    constructor(props) {
        super(props);

        var text = "";
        if (this.props.value !== null && this.props.value !== undefined) {
            text = this.props.value.SearchItemText;
        }
        this.state = {
            value: this.props.value,
            text: text,
            dialogState: "Closed"
        };
        this.onValueChange = this.onValueChange.bind(this);
        this.onSearchButtonClick = this.onSearchButtonClick.bind(this);
        this.onSearchDialogClose = this.onSearchDialogClose.bind(this);

    }
    onValueChange(item) {
        this.setState({
            value: item,
            text: item.SearchItemText,
            dialogState: "Closed"
        });
        if (this.props.onChange) {
            this.props.onChange(item);
        }
    }
    onSearchButtonClick() {
        this.setState({
            dialogState: "Open"
        });
    }
    onSearchDialogClose() {
        this.setState({
            dialogState: "Closed"
        });
    }

    render() {
        var hiddenInputWithSerializedValue = this.props.dontPutHiddenInput === true
            ? null
            : <input name={this.props.name} value={JSON.stringify(this.state.value)} type="hidden" />;
        return this.props.readonly === true ? (<span className="form-control">{this.state.text}</span>)
            : (
            <div className="input-group">
                <input type="text" className="form-control" aria-label="..." readOnly value={this.state.text} />
                <div className="input-group-btn">
                    <button type="button" className="btn btn-primary" onClick={e => this.onSearchButtonClick()}>{T("Выбрать")}</button>
                </div>

                <SearchCollectionQueryEditor twoFielded={this.props.twoFielded} show={(this.state.dialogState === "Open")} onHide={e => this.onSearchDialogClose()} headerText={this.props.searchDialogHeaderText} onSelect={item => this.onValueChange(item)} searchCollectionUrl={this.props.searchCollectionUrl} queryInputPlaceholder={this.props.queryInputPlaceholder} querySettings={this.props.querySettings} />
                {hiddenInputWithSerializedValue}
            </div>
        );
    }
}
