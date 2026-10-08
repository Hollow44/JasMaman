function CertInfo({
    certInfo
}) {
    return (
        <div className="card mb-0 bg-white font-weight-600 lh-1 p-3 mt-xl-0">
            <div className="row lh-base">
                <div className="col text-uppercase fw-800 font-16 d-flex align-items-center">{certInfo.Owner}</div>
                <div className="col-auto d-flex justify-content-end"><div className="check-icon bg-check-icon"></div></div>
            </div>
            <div className="lh-1">
                <span>{T("ИИН")}:</span>
                <span className="pl-2 text-break">{certInfo.IIN}</span>
            </div>
            {certInfo.BIN &&
                <div className="lh-1">
                    <span>{T("БИН")}:</span>
                    <span className="pl-2 text-break">{certInfo.BIN}</span>
                </div>
            }
            {/*<div className="lh-base">*/}
            {/*    <span>E-Mail:</span>*/}
            {/*    <span className="pl-2 text-break">{certInfo.Email}</span>*/}
            {/*</div>*/}
        </div>
    );
}

class UserCertificateV8Mock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: this.props.name,
            valid: this.props.valid,
            errors: this.props.errors,
            selectCertButtonEnabled: true,

            dataToSign: this.props.value.dataToSign,

            initQrSignDataId: this.props.value.initQrSignDataId,
            keyUsageOids: this.props.value.keyUsageOids,

            signMobileDeepLink: null,

            signQrImageBase64: null,

            getSignResUrl: null,

            signData: null,
            egovAppStoreUrl: null,
            egovAppType: null,

            selfWidth: 0,
            windowWidth: 0,
        };
        this.selectCert = this.selectCert.bind(this);
        this.setSignData = this.setSignData.bind(this);

        this.selfRef = React.createRef();
    }

    setWidths() {
        this.setState(state => ({
            selfWidth: $(this.selfRef.current).width(),
            windowWidth: $(window).width(),
        }));
    }

    selectCert(file) {
        function b64EncodeUnicode(str) {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
                function toSolidBytes(match, p1) {
                    return String.fromCharCode('0x' + p1);
            }));
        };

        var $self = this;
        var base64String = b64EncodeUnicode($self.state.dataToSign);

        const fileReader = new FileReader();
        fileReader.onloadend = () => {
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

            var subjectAttrs = [
                { name: 'commonName', shortName: "CN", value: certInfo.issuedTo },
                { name: "serialName", shortName: "SERIALNUMBER", value: ("IIN" + certInfo.iin) },
                { name: "organizationalUnitName", shortName: 'OU', value: (certInfo.bin ? "BIN" + certInfo.bin : "") },
                { shortName: 'O', value: certInfo.corpName + "" },
                { name: "emailAddress", shortName: "E", value: "dont_email_me@demo.demo" }
            ];

            cert.setSubject(subjectAttrs);

            var issuerAttrs = [
                { name: 'commonName', shortName: "CN", value: 'Demo portal' },
                { name: "OU", shortName: 'OU', value: 'Demo Org' },
                { name: "emailAddress", value: "dont_email_me@demo.demo" }
            ];

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
            }
            ]);

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
            md.update(this.props.value.dataToSign, "utf8");
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

            this.setState(state => ({
                signData: {
                    certInfo: clietnCertInfo,
                    certInBase64: certPem,
                    signedData: clientSignedData
                },
            }));

        };
        fileReader.readAsText(file);


        //var singedCmsData = ret.body.result.replace('-----BEGIN CMS-----', '').replace('-----END CMS-----', '').replace(/[\r\n]/g, "");
        //var cmsCertificateInfo = getCertficiateInfoFromCms(singedCmsData);
        //$self.setSignData(singedCmsData, cmsCertificateInfo.certificate, cmsCertificateInfo.certificatePem)
    }

    setSignData(signedDataCms, certificate, certificatePem) {
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

        function getCertificateAlgorithmName(oid){
            var dgstmap = {
                "2.16.840.1.101.3.4.2.1": "SHA-256",
                "2.16.840.1.101.3.4.2.3": "SHA-512",
                "1.2.840.113549.1.1.11": "sha256WithRSAEncryption",
                "1.2.398.3.10.1.1.1.2": "ГОСТ 34.310",
                "1.2.398.3.10.1.1.2.3.2": "ГОСТ 34.310 2015"
            };
            return dgstmap[oid] || oid;
        }
        function getCertAttributeValue(certificateAttributes, attributeId){
            var attr = certificateAttributes.typesAndValues.find(x => x.type == attributeId);
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

        this.setState(state => ({
            signData: {
                certInfo: certInfo,
                certInBase64: certPem,
                signedData: signedDataCms
            },
        }));
    }

    componentDidMount() {
        let $this = this;

        $this.setWidths();
        $(window).resize(function () {
            $this.setWidths();
        });
    }
    componentWillUnmount() {
    }

    render() {

        const Button = ReactBootstrap.Button;
        const Row = ReactBootstrap.Row;
        const Col = ReactBootstrap.Col;

        return <div className={"card mb-0 bg-light p-3"}>
            <input type="hidden" name={this.state.name} value={JSON.stringify({ SignData: this.state.signData, DataToSign: this.state.dataToSign, InitQrSignDataId: this.state.initQrSignDataId })} />


            {this.state.selfWidth <= 380 || this.state.windowWidth <= 768
                ? <div className="">
                    {!isNullOrUndefined(this.state.signData) && !isNullOrUndefined(this.state.signData.certInfo)
                        ?
                        <div className="">
                            <CertInfo
                                certInfo={this.state.signData.certInfo}
                            ></CertInfo>
                            <label htmlFor="choose-cert-file-input" className="mt-1 mb-0 text-info">Выбрать другой сертификат из Тестового JSON файла</label>
                            <input type="file" id="choose-cert-file-input" variant="info" className="d-none" accept=".json" onChange={e => this.selectCert(e.target.files[0])} />
                        </div>
                        : <div className="">
                            <div className="font-weight-600 lh-1">
                                Для подписания необходимо наличие мобильного приложения <span className="text-info">eGov</span>
                            </div>
                            <div className="text-secondary mt-1 lh-1">После нажатия на кнопку вы будете перенаправлены в eGov {this.state.egovAppType}</div>
                            <label htmlFor="choose-cert-file-input" className="btn btn-info rounded-lg w-100 mt-2">Выбрать сертификат из Тестового JSON файла</label>
                            <input type="file" id="choose-cert-file-input" variant="info" className="d-none" accept=".json" onChange={e => this.selectCert(e.target.files[0])} />
                        </div>
                    }
                </div>
                : <Row className="h-100">
                    <Col className="col-auto">
                        <div className="rounded-5 bg-white p-2">
                            <div className="rounded-lg e-gov-mobile-qr bg-white e-gov-mobile-qr-not-loaded d-flex align-items-center text-center p-4 lh-1 fw-800">{T("На проде здесь QR")}</div>
                        </div>
                    </Col>
                    {!isNullOrUndefined(this.state.signData) && !isNullOrUndefined(this.state.signData.certInfo)
                        ?
                        <Col>
                            <CertInfo
                                certInfo={this.state.signData.certInfo}
                            ></CertInfo>
                            <label htmlFor="choose-cert-file-input" className="mt-1 mb-0 text-info">Выбрать другой сертификат из Тестового JSON файла</label>
                            <input type="file" id="choose-cert-file-input" variant="info" className="d-none" accept=".json" onChange={e => this.selectCert(e.target.files[0])} />
                        </Col>
                        :
                        <Col>
                            <div className="font-weight-bold lh-1">Для подписания отсканируйте QR в приложении eGov {this.state.egovAppType}<br />или выберите сертификат из файла</div>
                            <label htmlFor="choose-cert-file-input" className="btn btn-info rounded-lg my-1">Cертификат из Тестового JSON файла</label>
                            <input type="file" id="choose-cert-file-input" variant="info" className="d-none" accept=".json" onChange={e => this.selectCert(e.target.files[0])} />
                            <div className="text-secondary lh-1">Функция подписи использует программу «NCALayer» НУЦ РК</div>
                            <div className="mt-1 lh-1">
                                <span>1. Откройте eGov {this.state.egovAppType} на Вашем устройстве</span><br />
                                <span>2. Запустите сканер QR в правом верхнем углу страницы</span><br />
                                <span>3. Наведите телефон на этот экран, чтобы считать код</span>
                            </div>
                        </Col>
                    }
                </Row>
            }

        </div>;
    }
}

(function ($) {
    $(".user-certificate-v8-mock").each(function () {
        var $this = $(this);
        var name = $this.data("name");
        var value = $this.data("value");
        var valid = `${$this.data("valid")}`.toLowerCase() != "false";
        var errors = $this.data("errors");
        ReactDOM.render(
            <UserCertificateV8Mock
                name={name}
                value={value}
                valid={valid}
                errors={errors}
            />,
            this
        );
    });
})(jQuery);