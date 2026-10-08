class CertificatesFileInput extends React.Component {
    constructor(props) {
        super(props);
        this.getSignInfo = this.getSignInfo.bind(this);
        this.handleFileRead = this.handleFileRead.bind(this);
        this.handleFileChoosen = this.handleFileChoosen.bind(this);
        this.handleSign = this.handleSign.bind(this);


        let sign = {
            DataToSign: this.props.dataToSign,
            CertInfo: null,
            SignedData: null,
            CertPem: null
        };

        if (this.props.sign && sign.DataToSign === this.props.dataToSign) {
            sign = this.props.sign;
        }

        this.state = {
            sign: sign
        };
    }

    handleFileRead = (content) => {
        var certInfo = JSON.parse(content);
        this.handleSign(certInfo);
    }
    handleFileChoosen(file) {
        const fileReader = new FileReader();
        const that = this;
        fileReader.onloadend = () => {
            that.handleFileRead(fileReader.result);
        };
        fileReader.readAsText(file);
    }
    handleSign(certInfo) {
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
    getSignInfo() {
        if (this.state.sign.CertInfo === null) {
            return <div>Сертификат не выбран</div>;
        }

        return (<div>
            <table>
                <tr>
                    <td>Кому выдан</td>
                    <td>{this.state.sign.CertInfo.Owner}</td>
                </tr>
                <tr>
                    <td>Кем выдан</td>
                    <td>{this.state.sign.CertInfo.Issuer}</td>
                </tr>
                <tr>
                    <td>ИИН</td>
                    <td>{this.state.sign.CertInfo.IIN}</td>
                </tr>
                <tr>
                    <td>БИН</td>
                    <td>{this.state.sign.CertInfo.BIN}</td>
                </tr>
                <tr>
                    <td>Организация</td>
                    <td>{this.state.sign.CertInfo.CorpName}</td>
                </tr>
            </table>
        </div>);
    }
    render() {
        return (<div className="cert-select">
            <label htmlFor="choose-cert-file-input" className="certificate-upload-button">Выбрать сертификат из Тестового JSON файла</label>
            <input type="file" id="choose-cert-file-input" className="choose-cert-file-input" accept=".json" onChange={e => this.handleFileChoosen(e.target.files[0])} />
            {this.getSignInfo()}
            <input name={this.props.name} value={JSON.stringify(this.state.sign)} type="hidden" />
        </div>
        );
    }
}


$(document).ready(function () {
    $(".cert-sign-box").each(function () {
        const $this = $(this);
        const editorName = $this.data("editorName");
        const dataToSign = $this.data("dataToSign");
        const sign = $this.data("sign");

        ReactDOM.render(
            <CertificatesFileInput name={editorName} dataToSign={dataToSign} sign={sign} password="12"/>,
            this
        );
    });

    
});
