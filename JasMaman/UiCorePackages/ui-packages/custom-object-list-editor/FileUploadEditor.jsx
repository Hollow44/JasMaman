class FileUploadEditor extends React.Component {
    componentDidMount() {
        this.$el = $(this.el);
        this.handleChange = this.handleChange.bind(this);

        this.$el.fileListEditor({
            uploadUrl: this.props.fileUploadUrl,
            files: this.props.files || [],
            onChange: this.handleChange,
            readOnly: this.props.readonly
        });

    }

    omponentWillUnmount() {
        this.$eltEditor('destroy');
    }

    handleChange(files) {
        var e = {
            files: files,
            target: {
                name: this.props.name,
                value: files
            }
        };
        this.props.onChange(e);
    }

    render() {
        return (
            <div ref={el => this.el = el} />
        );
    }
}