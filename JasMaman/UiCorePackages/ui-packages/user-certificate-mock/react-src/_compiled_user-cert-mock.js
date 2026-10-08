var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CertificatesFileInput = function (_React$Component) {
    _inherits(CertificatesFileInput, _React$Component);

    function CertificatesFileInput(props) {
        _classCallCheck(this, CertificatesFileInput);

        var _this = _possibleConstructorReturn(this, (CertificatesFileInput.__proto__ || Object.getPrototypeOf(CertificatesFileInput)).call(this, props));

        _this.handleFileRead = function (content) {
            var certInfo = JSON.parse(content);
            _this.handleSign(certInfo);
        };

        _this.getSignInfo = _this.getSignInfo.bind(_this);
        _this.handleFileRead = _this.handleFileRead.bind(_this);
        _this.handleFileChoosen = _this.handleFileChoosen.bind(_this);
        _this.handleSign = _this.handleSign.bind(_this);

        var sign = {
            DataToSign: _this.props.dataToSign,
            CertInfo: null,
            SignedData: null,
            CertPem: null
        };

        if (_this.props.sign && sign.DataToSign === _this.props.dataToSign) {
            sign = _this.props.sign;
        }

        _this.state = {
            sign: sign
        };
        return _this;
    }

    _createClass(CertificatesFileInput, [{
        key: 'handleFileChoosen',
        value: function handleFileChoosen(file) {
            var fileReader = new FileReader();
            var that = this;
            fileReader.onloadend = function () {
                that.handleFileRead(fileReader.result);
            };
            fileReader.readAsText(file);
        }
    }, {
        key: 'handleSign',
        value: function handleSign(certInfo) {
            var keys = forge.pki.rsa.generateKeyPair(512);
            // Create X.509 certificate
            var cert = forge.pki.createCertificate();
            // Add public key to certificate
            cert.publicKey = keys.publicKey;
            // Set serial number
            cert.serialNumber = '01';

            // Set certificate start date to NOW
            cert.validity.notBefore = new Date();

            // Set certificate end date lower than 36,000 blocks =~ 250 days
            cert.validity.notAfter = new Date();
            cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

            var subjectAttrs = [{ name: 'commonName', shortName: "CN", value: certInfo.issuedTo }, { name: "serialName", shortName: "SERIALNUMBER", value: "IIN" + certInfo.iin }, { name: "organizationalUnitName", shortName: 'OU', value: certInfo.bin ? "BIN" + certInfo.bin : "" }, { shortName: 'O', value: certInfo.corpName + "" }, { name: "emailAddress", shortName: "E", value: "dont_email_me@demo.demo" }];

            cert.setSubject(subjectAttrs);

            var issuerAttrs = [{ name: 'commonName', shortName: "CN", value: 'Demo portal' }, { name: "OU", shortName: 'OU', value: 'Demo Org' }, { name: "emailAddress", value: "dont_email_me@demo.demo" }];

            cert.setIssuer(subjectAttrs);

            // Add extensions
            cert.setExtensions([{
                name: 'basicConstraints',
                cA: true
            }, {
                name: 'keyUsage',
                keyCertSign: true,
                digitalSignature: true,
                nonRepudiation: true,
                keyEncipherment: true,
                dataEncipherment: true
            }, {
                name: 'extKeyUsage',
                serverAuth: false,
                clientAuth: true,
                codeSigning: true,
                emailProtection: false,
                timeStamping: true
            }, {
                name: 'nsCertType',
                client: true,
                server: false,
                email: false,
                objsign: true,
                sslCA: false,
                emailCA: false,
                objCA: false
            }]);

            // self-sign certificate
            cert.sign(keys.privateKey, forge.md.sha256.create());

            // Convert ASN.1 to PKCS12 with private key and password
            var p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, cert, this.props.password);
            p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, this.props.password);

            var certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
            var bag = certBags[forge.pki.oids.certBag][0];

            var certPem = forge.pki.certificateToPem(bag.cert);
            certPem = certPem.replace('-----BEGIN CERTIFICATE-----', '');
            certPem = certPem.replace('-----END CERTIFICATE-----', '');

            var md = forge.md.sha256.create();
            md.update(this.props.dataToSign, "utf8");
            var signature = keys.privateKey.sign(md);

            var clientSignedData = forge.util.encode64(signature);

            this.setState({
                sign: {
                    CertInfo: {
                        Owner: certInfo.issuedTo,
                        Issuer: "Demo portal",
                        ValidFrom: formatDate('dd.mm.yy', cert.validity.notBefore),
                        ValidTo: formatDate('dd.mm.yy', cert.validity.notAfter),
                        Alg: forge.oids[cert.signatureOid],
                        IIN: certInfo.iin,
                        BIN: certInfo.bin,
                        Email: "noEmail@email.demo",
                        CorpName: certInfo.corpName
                    },
                    SignedData: clientSignedData,
                    CertPem: certPem,
                    DataToSign: this.props.dataToSign
                }
            });
        }
    }, {
        key: 'getSignInfo',
        value: function getSignInfo() {
            if (this.state.sign.CertInfo === null) {
                return React.createElement(
                    'div',
                    null,
                    '\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D'
                );
            }

            return React.createElement(
                'div',
                null,
                React.createElement(
                    'table',
                    null,
                    React.createElement(
                        'tr',
                        null,
                        React.createElement(
                            'td',
                            null,
                            '\u041A\u043E\u043C\u0443 \u0432\u044B\u0434\u0430\u043D'
                        ),
                        React.createElement(
                            'td',
                            null,
                            this.state.sign.CertInfo.Owner
                        )
                    ),
                    React.createElement(
                        'tr',
                        null,
                        React.createElement(
                            'td',
                            null,
                            '\u041A\u0435\u043C \u0432\u044B\u0434\u0430\u043D'
                        ),
                        React.createElement(
                            'td',
                            null,
                            this.state.sign.CertInfo.Issuer
                        )
                    ),
                    React.createElement(
                        'tr',
                        null,
                        React.createElement(
                            'td',
                            null,
                            '\u0418\u0418\u041D'
                        ),
                        React.createElement(
                            'td',
                            null,
                            this.state.sign.CertInfo.IIN
                        )
                    ),
                    React.createElement(
                        'tr',
                        null,
                        React.createElement(
                            'td',
                            null,
                            '\u0411\u0418\u041D'
                        ),
                        React.createElement(
                            'td',
                            null,
                            this.state.sign.CertInfo.BIN
                        )
                    ),
                    React.createElement(
                        'tr',
                        null,
                        React.createElement(
                            'td',
                            null,
                            '\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F'
                        ),
                        React.createElement(
                            'td',
                            null,
                            this.state.sign.CertInfo.CorpName
                        )
                    )
                )
            );
        }
    }, {
        key: 'render',
        value: function render() {
            var _this2 = this;

            return React.createElement(
                'div',
                { className: 'cert-select' },
                React.createElement(
                    'label',
                    { htmlFor: 'choose-cert-file-input', className: 'certificate-upload-button' },
                    '\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0438\u0437 \u0422\u0435\u0441\u0442\u043E\u0432\u043E\u0433\u043E JSON \u0444\u0430\u0439\u043B\u0430'
                ),
                React.createElement('input', { type: 'file', id: 'choose-cert-file-input', className: 'choose-cert-file-input', accept: '.json', onChange: function onChange(e) {
                        return _this2.handleFileChoosen(e.target.files[0]);
                    } }),
                this.getSignInfo(),
                React.createElement('input', { name: this.props.name, value: JSON.stringify(this.state.sign), type: 'hidden' })
            );
        }
    }]);

    return CertificatesFileInput;
}(React.Component);

$(document).ready(function () {
    $(".cert-sign-box").each(function () {
        var $this = $(this);
        var editorName = $this.data("editorName");
        var dataToSign = $this.data("dataToSign");
        var sign = $this.data("sign");

        ReactDOM.render(React.createElement(CertificatesFileInput, { name: editorName, dataToSign: dataToSign, sign: sign, password: '12' }), this);
    });
});