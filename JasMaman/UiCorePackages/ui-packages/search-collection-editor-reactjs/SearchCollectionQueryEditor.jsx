class SearchCollectionQueryEditor extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            query: null,
            items: [],
            currentState: "None",
            message: null,
            currentRequestId: null
        };
        this.onSearchQueryChange = this.onSearchQueryChange.bind(this);
        this.onSearchButtonClick = this.onSearchButtonClick.bind(this);
        this.onSelect = this.onSelect.bind(this);
    }
    onSearchQueryChange(text) {
        this.setState({ query: text });
    }
    onSearchButtonClick() {
        var query = {
            Query: this.props.twoFielded
                ? $('#additional-field-bin').val() + ';' + this.state.query
                : this.state.query
        };

        if (this.props.querySettings) {
            query.Settings = JSON.stringify(this.props.querySettings);
        }

        this.setState({ currentState: "InProgress", items: [], message: "Загрузка данных..." });

        $.ajax({
            url: this.props.searchCollectionUrl,
            data: query,
            success: function (result) {
                if (result.length === 0) {
                    this.setState({ currentState: "NoResult", items: result, message: null });
                } else {
                    this.setState({ currentState: "Success", items: result, message: null });
                }
            }.bind(this),
            error: function (jqXHR, textStatus, errorThrown) {
                var errorMessage = "";
                if (jqXHR.responseJSON) {
                    errorMessage = T("Не удалось загрузить данные. {0}").format(jqXHR.responseJSON.message);
                } else {
                    errorMessage = T("Не удалось загрузить данные");
                }
                this.setState({ currentState: "Error", items: [], message: errorMessage });
            }.bind(this)
        });
    }
    onSelect(item) {
        if (item.Item.SearchItemId === null) {
            return;
        }
        this.props.onSelect(item.Item);
    }
    render() {
        var initialMessage = this.state.currentState === "None" ? <span className="list-group-item">{T("Выполните поиск")}</span> : null;
        var emptyMessage = this.state.currentState === "NoResult" ? <span className="list-group-item">{T("Ничего не найдено")}</span> : null;
        var searchInProgressMessage = this.state.currentState === "InProgress" ? <span className="list-group-item">{T("Загрузка данных...")}</span> : null;
        var errorMessage = this.state.currentState === "Error" ? <span className="list-group-item">{this.state.message}</span> : null;
        var resultItems = this.state.items.map(x => <span className="list-group-item" onClick={e => { this.onSelect(x); }}>{x.Item.SearchItemText}</span>);

        const Modal = ReactBootstrap.Modal;
        const Button = ReactBootstrap.Button;

        var generalErrorPanel = null;
        if (this.props.errorMessage) {
            generalErrorPanel = <div className="alert alert-danger" role="alert">{this.props.errorMessage}</div>;
        }

        var binPlaceHolder = null;
        var kadNumberPlaceholder = this.props.queryInputPlaceholder;

        if (this.props.queryInputPlaceholder.includes(';')) {
            var splitted = this.props.queryInputPlaceholder.split(';');
            binPlaceHolder = splitted[0]
            kadNumberPlaceholder = splitted[1];
        }

        var binField = null;
        if (this.props.twoFielded) {
            binField = <input type="text" className="form-control" id="additional-field-bin" placeholder={binPlaceHolder} />;
        }

        return (
            <div>
                <Modal show={this.props.show} onHide={this.props.onHide}>
                    <Modal.Header>
                        <Modal.Title id="contained-modal-title-lg">{this.props.headerText}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {generalErrorPanel}
                        <div>
                            <div className="row">
                                <div className="col-md-12 search-query-input-toolbar">
                                    <div className="input-group d-flex">
                                        {binField}
                                        <input type="text" className="form-control" placeholder={kadNumberPlaceholder} onChange={e => this.onSearchQueryChange(e.target.value)} value={this.state.query} />
                                        {/*<span className="input-group-btn">*/}
                                        <button className="btn btn-primary btn-search" type="submit" onClick={e => this.onSearchButtonClick()}>{T("Найти")}</button>
                                        {/*</span>*/}
                                    </div>
                                </div>
                            </div>
                            <div className="list-group">
                                {initialMessage}
                                {emptyMessage}
                                {searchInProgressMessage}
                                {errorMessage}
                                {resultItems}
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={this.props.onHide}>Отмена</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}
