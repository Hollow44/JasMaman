var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FileUploadEditor = function (_React$Component) {
    _inherits(FileUploadEditor, _React$Component);

    function FileUploadEditor() {
        _classCallCheck(this, FileUploadEditor);

        return _possibleConstructorReturn(this, (FileUploadEditor.__proto__ || Object.getPrototypeOf(FileUploadEditor)).apply(this, arguments));
    }

    _createClass(FileUploadEditor, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
            this.$el = $(this.el);
            this.handleChange = this.handleChange.bind(this);

            this.$el.fileListEditor({
                uploadUrl: this.props.fileUploadUrl,
                files: this.props.files || [],
                onChange: this.handleChange,
                readOnly: this.props.readonly
            });
        }
    }, {
        key: 'omponentWillUnmount',
        value: function omponentWillUnmount() {
            this.$eltEditor('destroy');
        }
    }, {
        key: 'handleChange',
        value: function handleChange(files) {
            var e = {
                files: files,
                target: {
                    name: this.props.name,
                    value: files
                }
            };
            this.props.onChange(e);
        }
    }, {
        key: 'render',
        value: function render() {
            var _this2 = this;

            return React.createElement('div', { ref: function ref(el) {
                    return _this2.el = el;
                } });
        }
    }]);

    return FileUploadEditor;
}(React.Component);