class CustomInputList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            asyncRequestRunning: false,
            asyncRequestId: 0,
            asyncRequestError: null,
            inputs: this.props.inputs
        };
        this.onChange = this.onChange.bind(this);
        this.onSave = this.onSave.bind(this);
        this.validate = this.validate.bind(this);
        this.isNull = this.isNull.bind(this);
        this.isNullOrEmpty = this.isNullOrEmpty.bind(this);
        this.validateRanges = this.validateRanges.bind(this);
    }
    onChange(name, val) {
        var inputs = $.extend(true, [], this.state.inputs);
        var input = inputs.find(x => x.Name === name);
        input.Value = val;
        input.Error = this.validate(input);
        var generalError = this.state.generalError;
        if (inputs.every(input => this.isNullOrEmpty(input.Error))) {
            generalError = null;
		}
		if (input.HiddenField != null) {
            if (val === "Другое" || val === "Другое2") {
                $("input[name=" + input.HiddenField + "]").closest("div").removeAttr("hidden");
                $("input[name=" + input.HiddenField + "]").closest("div").show();
			} else {
                $("input[name=" + input.HiddenField + "]").closest("div").attr("hidden");
                $("input[name=" + input.HiddenField + "]").closest("div").hide();
			}
		}
        this.setState({ inputs: inputs, generalError: generalError });
    }
    onSave() {
        var inputs = $.extend(true, [], this.state.inputs);

        inputs.forEach(input => { input.Error = this.validate(input); });
        this.validateRanges(
            input => input.Name,
            inputs.filter(input => this.isNullOrEmpty(input.Error))
        );
        this.validateRanges(
            input => input.Alias,
            inputs.filter(input => this.isNullOrEmpty(input.Error) && !this.isNullOrEmpty(input.Alias))
        );

        if (inputs.some(input => !this.isNullOrEmpty(input.Error))) {
			this.setState({
				inputs: inputs, generalError: inputs.map(input => {
					if (!this.isNullOrEmpty(input.Error)) {
						return input.Text + ": " + input.Error + "; "
					}
				}) });
        } else {
            this.props.onSave(inputs);
        }
    }
    validateRanges(getInputNameLambda, inputs) {
        var fromSuffix = "From";
        var toSuffix = "To";
        
        var froms = inputs.filter(input => getInputNameLambda(input).endsWith(fromSuffix));
        froms.forEach(from => {
            var fromInputName = getInputNameLambda(from);
            var inputToName = fromInputName.substring(0, fromInputName.length - fromSuffix.length) + toSuffix;
            var inputTo = inputs.find(input => getInputNameLambda(input) === inputToName);

            if (inputTo) {
                if (inputTo.Value < from.Value) {
                    inputTo.Error = "Значение должно быть больше, чем \"" + from.Text + "\"";
                }
            }
        });
    }
    isNull(val) {
        if (val === undefined || val === null) {
            return true;
        }
        return false;
    }
    isNullOrEmpty(val) {
        if (this.isNull(val)) {
            return true;
        }
        return val === "";
    }
    validate(input) {
        if (input.InputType === "File") {
            return null;
        }
        if (!input.IsRequired) {
            return null;
        }

        if (!input.Value && !input.IsHidden) {
            return "поле обязательно для заполнения";
        }

        if (input.InputType === "Date") {
            if (input.MinValue && input.Value < input.MinValue) {
                return "значение не может быть меньше " + Utils.dateToString(input.MinValue);
            }
            if (input.MaxValue && input.Value > input.MaxValue) {
                return "значение не может быть больше " + Utils.dateToString(input.MaxValue);
            }
        }
        if (input.InputType === "Int" || input.InputType === "Decimal") {
            if (input.MinValue && input.Value < input.MinValue) {
                return "значение не может быть меньше " + input.MinValue;
            }
            if (input.MaxValue && input.Value > input.MaxValue) {
                return "значение не может быть больше " + input.MaxValue;
            }
        }
        return null;
    }
    render() {
        if (!this.props.show) {
            return null;
        }

        const Modal = ReactBootstrap.Modal;
        const Button = ReactBootstrap.Button;

        var generalErrorPanel = null;
        if (this.state.generalError) {
			generalErrorPanel = <div className="alert alert-danger" role="alert">{this.state.generalError}</div>;
        }

        return (
            <div>
                <Modal show backdrop="static" onHide={this.props.onCancel}>
                    <Modal.Header closeButton>
                        <Modal.Title id="contained-modal-title-lg">{this.props.text}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {generalErrorPanel}
                        <div>
                            {this.state.inputs.map(input => {
                                var classNames = ["form-group"];
								var inputErrorMsg = null;

                                if (input.Error) {
                                    classNames.push("hasError");
                                    inputErrorMsg = <span id="helpBlock2" className="help-block">{input.Error}</span>;
                                }
								return (<div className={classNames.join(" ")} hidden={input.IsHidden}  key={input.Id}>
                                    <label>{input.Text}</label>
                                    <CustomInput input={input} onChange={val => this.onChange(input.Name, val)} />
                                    {inputErrorMsg}
                                </div>);
                            }
                            )}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.onSave}>Добавить</Button>
                        <Button className="btn btn-secondary"  onClick={this.props.onCancel}>Отмена</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}