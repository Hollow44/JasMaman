var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function CertInfo(_ref) {
    var certInfo = _ref.certInfo;

    return React.createElement(
        "div",
        { className: "card mb-0 bg-white font-weight-600 lh-1 p-3 mt-xl-0" },
        React.createElement(
            "div",
            { className: "row lh-base" },
            React.createElement(
                "div",
                { className: "col text-uppercase fw-800 font-16 d-flex align-items-center" },
                certInfo.Owner
            ),
            React.createElement(
                "div",
                { className: "col-auto d-flex justify-content-end" },
                React.createElement("div", { className: "check-icon bg-check-icon" })
            )
        ),
        React.createElement(
            "div",
            { className: "lh-1" },
            React.createElement(
                "span",
                null,
                T("ИИН"),
                ":"
            ),
            React.createElement(
                "span",
                { className: "pl-2 text-break" },
                certInfo.IIN
            )
        ),
        certInfo.BIN && React.createElement(
            "div",
            { className: "lh-1" },
            React.createElement(
                "span",
                null,
                T("БИН"),
                ":"
            ),
            React.createElement(
                "span",
                { className: "pl-2 text-break" },
                certInfo.BIN
            )
        )
    );
}

var UserCertificateV8Mock = function (_React$Component) {
    _inherits(UserCertificateV8Mock, _React$Component);

    function UserCertificateV8Mock(props) {
        _classCallCheck(this, UserCertificateV8Mock);

        var _this = _possibleConstructorReturn(this, (UserCertificateV8Mock.__proto__ || Object.getPrototypeOf(UserCertificateV8Mock)).call(this, props));

        _this.state = {
            name: _this.props.name,
            valid: _this.props.valid,
            errors: _this.props.errors,
            selectCertButtonEnabled: true,

            dataToSign: _this.props.value.dataToSign,

            initQrSignDataId: _this.props.value.initQrSignDataId,
            keyUsageOids: _this.props.value.keyUsageOids,

            signMobileDeepLink: null,

            signQrImageBase64: null,

            getSignResUrl: null,

            signData: null,
            egovAppStoreUrl: null,
            egovAppType: null,

            selfWidth: 0,
            windowWidth: 0
        };
        _this.selectCert = _this.selectCert.bind(_this);
        _this.setSignData = _this.setSignData.bind(_this);

        _this.selfRef = React.createRef();
        return _this;
    }

    _createClass(UserCertificateV8Mock, [{
        key: "setWidths",
        value: function setWidths() {
            var _this2 = this;

            this.setState(function (state) {
                return {
                    selfWidth: $(_this2.selfRef.current).width(),
                    windowWidth: $(window).width()
                };
            });
        }
    }, {
        key: "selectCert",
        value: function selectCert(file) {
            var _this3 = this;

            function b64EncodeUnicode(str) {
                return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
                    return String.fromCharCode('0x' + p1);
                }));
            };

            var $self = this;
            var base64String = b64EncodeUnicode($self.state.dataToSign);

            var fileReader = new FileReader();
            fileReader.onloadend = function () {
                var certInfo = JSON.parse(fileReader.result);

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
                var p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, cert, "mock");
                p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, "mock");

                var certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
                var bag = certBags[forge.pki.oids.certBag][0];

                var certPem = forge.pki.certificateToPem(bag.cert);
                certPem = certPem.replace('-----BEGIN CERTIFICATE-----', '');
                certPem = certPem.replace('-----END CERTIFICATE-----', '');

                var md = forge.md.sha256.create();
                md.update(_this3.props.value.dataToSign, "utf8");
                var signature = keys.privateKey.sign(md);

                var clientSignedData = forge.util.encode64(signature);

                var clietnCertInfo = {
                    Owner: null,
                    Issuer: null,
                    ValidFrom: null,
                    ValidTo: null,
                    Alg: null,
                    IIN: null,
                    BIN: null,
                    Email: null
                };

                clietnCertInfo.Alg = forge.oids[cert.signatureOid];
                clietnCertInfo.ValidFrom = formatDate('dd.mm.yy', cert.validity.notBefore);
                clietnCertInfo.ValidTo = formatDate('dd.mm.yy', cert.validity.notAfter);
                clietnCertInfo.Owner = certInfo.issuedTo;
                clietnCertInfo.IIN = certInfo.iin;
                clietnCertInfo.BIN = certInfo.bin;
                clietnCertInfo.Email = "noEmail@email.demo";
                clietnCertInfo.Issuer = "Demo portal";

                _this3.setState(function (state) {
                    return {
                        signData: {
                            certInfo: clietnCertInfo,
                            certInBase64: certPem,
                            signedData: clientSignedData
                        }
                    };
                });
            };
            fileReader.readAsText(file);

            //var singedCmsData = ret.body.result.replace('-----BEGIN CMS-----', '').replace('-----END CMS-----', '').replace(/[\r\n]/g, "");
            //var cmsCertificateInfo = getCertficiateInfoFromCms(singedCmsData);
            //$self.setSignData(singedCmsData, cmsCertificateInfo.certificate, cmsCertificateInfo.certificatePem)
        }
    }, {
        key: "setSignData",
        value: function setSignData(signedDataCms, certificate, certificatePem) {
            var $self = this;

            var certPem = null;
            var certInfo = {
                Owner: null,
                Issuer: null,
                ValidFrom: null,
                ValidTo: null,
                Alg: null,
                IIN: null,
                BIN: null,
                Email: null
            };

            function getCertificateAlgorithmName(oid) {
                var dgstmap = {
                    "2.16.840.1.101.3.4.2.1": "SHA-256",
                    "2.16.840.1.101.3.4.2.3": "SHA-512",
                    "1.2.840.113549.1.1.11": "sha256WithRSAEncryption",
                    "1.2.398.3.10.1.1.1.2": "ГОСТ 34.310",
                    "1.2.398.3.10.1.1.2.3.2": "ГОСТ 34.310 2015"
                };
                return dgstmap[oid] || oid;
            }
            function getCertAttributeValue(certificateAttributes, attributeId) {
                var attr = certificateAttributes.typesAndValues.find(function (x) {
                    return x.type == attributeId;
                });
                if (attr === undefined) {
                    return "";
                }
                return attr.value.valueBlock.value;
            }
            function getOwnerAttr(attrId) {
                return getCertAttributeValue(certificate.subject, attrId);
            }
            function getIssuerAttr(attrId) {
                return getCertAttributeValue(certificate.issuer, attrId);
            }

            certInfo.Alg = getCertificateAlgorithmName(certificate.signatureAlgorithm.algorithmId);
            certPem = certificatePem;
            certPem = certPem.replace('-----BEGIN CERTIFICATE-----', '');
            certPem = certPem.replace('-----END CERTIFICATE-----', '');
            certInfo.ValidFrom = certificate.notBefore.value.toLocaleDateString();
            certInfo.ValidTo = certificate.notAfter.value.toLocaleDateString();

            var attrsIds = {
                CN: "2.5.4.3",
                G: "2.5.4.42",
                SERIALNUMBER: "2.5.4.5",
                OU: "2.5.4.11",
                E: "1.2.840.113549.1.9.1"
            };

            certInfo.Owner = (getOwnerAttr(attrsIds.CN) + " " + getOwnerAttr(attrsIds.G)).trim();
            certInfo.IIN = getOwnerAttr(attrsIds.SERIALNUMBER).substring(3);
            certInfo.BIN = getOwnerAttr(attrsIds.OU).substring(3);
            certInfo.Email = getOwnerAttr(attrsIds.E);

            certInfo.Issuer = getIssuerAttr(attrsIds.CN);

            this.setState(function (state) {
                return {
                    signData: {
                        certInfo: certInfo,
                        certInBase64: certPem,
                        signedData: signedDataCms
                    }
                };
            });
        }
    }, {
        key: "componentDidMount",
        value: function componentDidMount() {
            var $this = this;

            $this.setWidths();
            $(window).resize(function () {
                $this.setWidths();
            });
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {}
    }, {
        key: "render",
        value: function render() {
            var _this4 = this;

            var Button = ReactBootstrap.Button;
            var Row = ReactBootstrap.Row;
            var Col = ReactBootstrap.Col;

            return React.createElement(
                "div",
                { className: "card mb-0 bg-light p-3" },
                React.createElement("input", { type: "hidden", name: this.state.name, value: JSON.stringify({ SignData: this.state.signData, DataToSign: this.state.dataToSign, InitQrSignDataId: this.state.initQrSignDataId }) }),
                this.state.selfWidth <= 380 || this.state.windowWidth <= 768 ? React.createElement(
                    "div",
                    { className: "" },
                    !isNullOrUndefined(this.state.signData) && !isNullOrUndefined(this.state.signData.certInfo) ? React.createElement(
                        "div",
                        { className: "" },
                        React.createElement(CertInfo, {
                            certInfo: this.state.signData.certInfo
                        }),
                        React.createElement(
                            "label",
                            { htmlFor: "choose-cert-file-input", className: "mt-1 mb-0 text-info" },
                            "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0434\u0440\u0443\u0433\u043E\u0439 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0438\u0437 \u0422\u0435\u0441\u0442\u043E\u0432\u043E\u0433\u043E JSON \u0444\u0430\u0439\u043B\u0430"
                        ),
                        React.createElement("input", { type: "file", id: "choose-cert-file-input", variant: "info", className: "d-none", accept: ".json", onChange: function onChange(e) {
                                return _this4.selectCert(e.target.files[0]);
                            } })
                    ) : React.createElement(
                        "div",
                        { className: "" },
                        React.createElement(
                            "div",
                            { className: "font-weight-600 lh-1" },
                            "\u0414\u043B\u044F \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u0438\u044F \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u043D\u0430\u043B\u0438\u0447\u0438\u0435 \u043C\u043E\u0431\u0438\u043B\u044C\u043D\u043E\u0433\u043E \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F ",
                            React.createElement(
                                "span",
                                { className: "text-info" },
                                "eGov"
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "text-secondary mt-1 lh-1" },
                            "\u041F\u043E\u0441\u043B\u0435 \u043D\u0430\u0436\u0430\u0442\u0438\u044F \u043D\u0430 \u043A\u043D\u043E\u043F\u043A\u0443 \u0432\u044B \u0431\u0443\u0434\u0435\u0442\u0435 \u043F\u0435\u0440\u0435\u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u044B \u0432 eGov ",
                            this.state.egovAppType
                        ),
                        React.createElement(
                            "label",
                            { htmlFor: "choose-cert-file-input", className: "btn btn-info rounded-lg w-100 mt-2" },
                            "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0438\u0437 \u0422\u0435\u0441\u0442\u043E\u0432\u043E\u0433\u043E JSON \u0444\u0430\u0439\u043B\u0430"
                        ),
                        React.createElement("input", { type: "file", id: "choose-cert-file-input", variant: "info", className: "d-none", accept: ".json", onChange: function onChange(e) {
                                return _this4.selectCert(e.target.files[0]);
                            } })
                    )
                ) : React.createElement(
                    Row,
                    { className: "h-100" },
                    React.createElement(
                        Col,
                        { className: "col-auto" },
                        React.createElement(
                            "div",
                            { className: "rounded-5 bg-white p-2" },
                            React.createElement(
                                "div",
                                { className: "rounded-lg e-gov-mobile-qr bg-white e-gov-mobile-qr-not-loaded d-flex align-items-center text-center p-4 lh-1 fw-800" },
                                T("На проде здесь QR")
                            )
                        )
                    ),
                    !isNullOrUndefined(this.state.signData) && !isNullOrUndefined(this.state.signData.certInfo) ? React.createElement(
                        Col,
                        null,
                        React.createElement(CertInfo, {
                            certInfo: this.state.signData.certInfo
                        }),
                        React.createElement(
                            "label",
                            { htmlFor: "choose-cert-file-input", className: "mt-1 mb-0 text-info" },
                            "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0434\u0440\u0443\u0433\u043E\u0439 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0438\u0437 \u0422\u0435\u0441\u0442\u043E\u0432\u043E\u0433\u043E JSON \u0444\u0430\u0439\u043B\u0430"
                        ),
                        React.createElement("input", { type: "file", id: "choose-cert-file-input", variant: "info", className: "d-none", accept: ".json", onChange: function onChange(e) {
                                return _this4.selectCert(e.target.files[0]);
                            } })
                    ) : React.createElement(
                        Col,
                        null,
                        React.createElement(
                            "div",
                            { className: "font-weight-bold lh-1" },
                            "\u0414\u043B\u044F \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u0438\u044F \u043E\u0442\u0441\u043A\u0430\u043D\u0438\u0440\u0443\u0439\u0442\u0435 QR \u0432 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438 eGov ",
                            this.state.egovAppType,
                            React.createElement("br", null),
                            "\u0438\u043B\u0438 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0438\u0437 \u0444\u0430\u0439\u043B\u0430"
                        ),
                        React.createElement(
                            "label",
                            { htmlFor: "choose-cert-file-input", className: "btn btn-info rounded-lg my-1" },
                            "C\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0438\u0437 \u0422\u0435\u0441\u0442\u043E\u0432\u043E\u0433\u043E JSON \u0444\u0430\u0439\u043B\u0430"
                        ),
                        React.createElement("input", { type: "file", id: "choose-cert-file-input", variant: "info", className: "d-none", accept: ".json", onChange: function onChange(e) {
                                return _this4.selectCert(e.target.files[0]);
                            } }),
                        React.createElement(
                            "div",
                            { className: "text-secondary lh-1" },
                            "\u0424\u0443\u043D\u043A\u0446\u0438\u044F \u043F\u043E\u0434\u043F\u0438\u0441\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0443 \xABNCALayer\xBB \u041D\u0423\u0426 \u0420\u041A"
                        ),
                        React.createElement(
                            "div",
                            { className: "mt-1 lh-1" },
                            React.createElement(
                                "span",
                                null,
                                "1. \u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 eGov ",
                                this.state.egovAppType,
                                " \u043D\u0430 \u0412\u0430\u0448\u0435\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435"
                            ),
                            React.createElement("br", null),
                            React.createElement(
                                "span",
                                null,
                                "2. \u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0441\u043A\u0430\u043D\u0435\u0440 QR \u0432 \u043F\u0440\u0430\u0432\u043E\u043C \u0432\u0435\u0440\u0445\u043D\u0435\u043C \u0443\u0433\u043B\u0443 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B"
                            ),
                            React.createElement("br", null),
                            React.createElement(
                                "span",
                                null,
                                "3. \u041D\u0430\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u043D\u0430 \u044D\u0442\u043E\u0442 \u044D\u043A\u0440\u0430\u043D, \u0447\u0442\u043E\u0431\u044B \u0441\u0447\u0438\u0442\u0430\u0442\u044C \u043A\u043E\u0434"
                            )
                        )
                    )
                )
            );
        }
    }]);

    return UserCertificateV8Mock;
}(React.Component);

(function ($) {
    $(".user-certificate-v8-mock").each(function () {
        var $this = $(this);
        var name = $this.data("name");
        var value = $this.data("value");
        var valid = ("" + $this.data("valid")).toLowerCase() != "false";
        var errors = $this.data("errors");
        ReactDOM.render(React.createElement(UserCertificateV8Mock, {
            name: name,
            value: value,
            valid: valid,
            errors: errors
        }), this);
    });
})(jQuery);