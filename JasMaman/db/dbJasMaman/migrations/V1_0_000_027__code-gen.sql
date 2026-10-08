
CREATE TABLE jas_maman.notification (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flNotificationId bigint NOT NULL,
flGrantId bigint NOT NULL,
flIin character varying(12) NOT NULL,
flFullName character varying(512) NOT NULL,
flKind character varying(19) NOT NULL,
flChannel character varying(10) NOT NULL,
flStatus character varying(9) NOT NULL,
flAddress character varying(1024) ,
flText text NOT NULL,
flProviderId character varying(128) ,
flError character varying(2000) ,
flCreatedAt timestamp without time zone NOT NULL,
flCreatedBy character varying(512) NOT NULL,
flApprovedAt timestamp without time zone ,
flApprovedBy character varying(512) ,
flSentAt timestamp without time zone ,
flStatusAt timestamp without time zone NOT NULL, 
CONSTRAINT PK_notification PRIMARY KEY (
    flNotificationId
));

select yoda_set_column_encrypted_security_label_v0('jas_maman', 'notification', 'flText');
COMMENT ON COLUMN jas_maman.notification.flText IS 'ENCRYPTED';

CREATE INDEX IX_notification_Grant ON jas_maman.notification USING btree (flGrantId);
CREATE INDEX IX_notification_Status ON jas_maman.notification USING btree (flStatus);
CREATE INDEX IX_notification_Iin ON jas_maman.notification USING btree (flIin);

CREATE TABLE jas_maman.z_history_notification (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flNotificationId bigint NOT NULL,
flGrantId bigint NOT NULL,
flIin character varying(12) NOT NULL,
flFullName character varying(512) NOT NULL,
flKind character varying(19) NOT NULL,
flChannel character varying(10) NOT NULL,
flStatus character varying(9) NOT NULL,
flAddress character varying(1024) ,
flText text NOT NULL,
flProviderId character varying(128) ,
flError character varying(2000) ,
flCreatedAt timestamp without time zone NOT NULL,
flCreatedBy character varying(512) NOT NULL,
flApprovedAt timestamp without time zone ,
flApprovedBy character varying(512) ,
flSentAt timestamp without time zone ,
flStatusAt timestamp without time zone NOT NULL, 
CONSTRAINT PK_18ff2ad9ee53dbbca9dea4a04dd496bbd3cb3aaf PRIMARY KEY (
    flEntityId, flRequestId
));

COMMENT ON COLUMN jas_maman.z_history_notification.flText IS 'ENCRYPTED';
