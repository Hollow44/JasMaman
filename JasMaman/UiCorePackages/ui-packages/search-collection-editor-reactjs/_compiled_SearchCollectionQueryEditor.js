var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SearchCollectionQueryEditor = function (_React$Component) {
    _inherits(SearchCollectionQueryEditor, _React$Component);

    function SearchCollectionQueryEditor(props) {
        _classCallCheck(this, SearchCollectionQueryEditor);

        var _this = _possibleConstructorReturn(this, (SearchCollectionQueryEditor.__proto__ || Object.getPrototypeOf(SearchCollectionQueryEditor)).call(this, props));

        _this.state = {
            query: null,
            items: [],
            currentState: "None",
            message: null,
            currentRequestId: null
        };
        _this.onSearchQueryChange = _this.onSearchQueryChange.bind(_this);
        _this.onSearchButtonClick = _this.onSearchButtonClick.bind(_this);
        _this.onSelect = _this.onSelect.bind(_this);
        return _this;
    }

    _createClass(SearchCollectionQueryEditor, [{
        key: 'onSearchQueryChange',
        value: function onSearchQueryChange(text) {
            this.setState({ query: text });
        }
    }, {
        key: 'onSearchButtonClick',
        value: function onSearchButtonClick() {
            var query = {
                Query: this.props.twoFielded ? $('#additional-field-bin').val() + ';' + this.state.query : this.state.query
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
    }, {
        key: 'onSelect',
        value: function onSelect(item) {
            if (item.Item.SearchItemId === null) {
                return;
            }
            this.props.onSelect(item.Item);
        }
    }, {
        key: 'render',
        value: function render() {
            var _this2 = this;

            var initialMessage = this.state.currentState === "None" ? React.createElement(
                'span',
                { className: 'list-group-item' },
                T("Выполните поиск")
            ) : null;
            var emptyMessage = this.state.currentState === "NoResult" ? React.createElement(
                'span',
                { className: 'list-group-item' },
                T("Ничего не найдено")
            ) : null;
            var searchInProgressMessage = this.state.currentState === "InProgress" ? React.createElement(
                'span',
                { className: 'list-group-item' },
                T("Загрузка данных...")
            ) : null;
            var errorMessage = this.state.currentState === "Error" ? React.createElement(
                'span',
                { className: 'list-group-item' },
                this.state.message
            ) : null;
            var resultItems = this.state.items.map(function (x) {
                return React.createElement(
                    'span',
                    { className: 'list-group-item', onClick: function onClick(e) {
                            _this2.onSelect(x);
                        } },
                    x.Item.SearchItemText
                );
            });

            var Modal = ReactBootstrap.Modal;
            var Button = ReactBootstrap.Button;

            var generalErrorPanel = null;
            if (this.props.errorMessage) {
                generalErrorPanel = React.createElement(
                    'div',
                    { className: 'alert alert-danger', role: 'alert' },
                    this.props.errorMessage
                );
            }

            var binPlaceHolder = null;
            var kadNumberPlaceholder = this.props.queryInputPlaceholder;

            if (this.props.queryInputPlaceholder.includes(';')) {
                var splitted = this.props.queryInputPlaceholder.split(';');
                binPlaceHolder = splitted[0];
                kadNumberPlaceholder = splitted[1];
            }

            var binField = null;
            if (this.props.twoFielded) {
                binField = React.createElement('input', { type: 'text', className: 'form-control', id: 'additional-field-bin', placeholder: binPlaceHolder });
            }

            return React.createElement(
                'div',
                null,
                React.createElement(
                    Modal,
                    { show: this.props.show, onHide: this.props.onHide },
                    React.createElement(
                        Modal.Header,
                        null,
                        React.createElement(
                            Modal.Title,
                            { id: 'contained-modal-title-lg' },
                            this.props.headerText
                        )
                    ),
                    React.createElement(
                        Modal.Body,
                        null,
                        generalErrorPanel,
                        React.createElement(
                            'div',
                            null,
                            React.createElement(
                                'div',
                                { className: 'row' },
                                React.createElement(
                                    'div',
                                    { className: 'col-md-12 search-query-input-toolbar' },
                                    React.createElement(
                                        'div',
                                        { className: 'input-group d-flex' },
                                        binField,
                                        React.createElement('input', { type: 'text', className: 'form-control', placeholder: kadNumberPlaceholder, onChange: function onChange(e) {
                                                return _this2.onSearchQueryChange(e.target.value);
                                            }, value: this.state.query }),
                                        React.createElement(
                                            'button',
                                            { className: 'btn btn-primary btn-search', type: 'submit', onClick: function onClick(e) {
                                                    return _this2.onSearchButtonClick();
                                                } },
                                            T("Найти")
                                        )
                                    )
                                )
                            ),
                            React.createElement(
                                'div',
                                { className: 'list-group' },
                                initialMessage,
                                emptyMessage,
                                searchInProgressMessage,
                                errorMessage,
                                resultItems
                            )
                        )
                    ),
                    React.createElement(
                        Modal.Footer,
                        null,
                        React.createElement(
                            Button,
                            { variant: 'secondary', onClick: this.props.onHide },
                            '\u041E\u0442\u043C\u0435\u043D\u0430'
                        )
                    )
                )
            );
        }
    }]);

    return SearchCollectionQueryEditor;
}(React.Component);