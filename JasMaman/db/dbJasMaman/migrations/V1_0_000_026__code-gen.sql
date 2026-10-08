
CREATE TABLE jas_maman.migrationlog (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flId bigint NOT NULL,
flJob character varying(128) NOT NULL,
flAfterId bigint NOT NULL,
flLastId bigint ,
flRead integer NOT NULL,
flImported integer NOT NULL,
flSkipped integer NOT NULL,
flFailed integer NOT NULL,
flDetails character varying ,
flAt timestamp without time zone NOT NULL, 
CONSTRAINT PK_migrationlog PRIMARY KEY (
    flId
));


CREATE INDEX IX_migrationlog_JobAt ON jas_maman.migrationlog USING btree (flJob, flAt);

CREATE TABLE jas_maman.z_history_migrationlog (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flId bigint NOT NULL,
flJob character varying(128) NOT NULL,
flAfterId bigint NOT NULL,
flLastId bigint ,
flRead integer NOT NULL,
flImported integer NOT NULL,
flSkipped integer NOT NULL,
flFailed integer NOT NULL,
flDetails character varying ,
flAt timestamp without time zone NOT NULL, 
CONSTRAINT PK_302f2d6a7551f97822234c9e51fe7bdde7547440 PRIMARY KEY (
    flEntityId, flRequestId
));



CREATE TABLE jas_maman.grantstate (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flGrantId bigint NOT NULL,
flLegacyStudyId bigint ,
flLegacyPersonId bigint ,
flIin character varying(12) NOT NULL,
flFullName character varying(512) NOT NULL,
flUniversityId bigint ,
flUniversityBin character varying(12) ,
flUniversityName character varying(1024) ,
flSpecialityId bigint ,
flSpecialityName character varying(1024) ,
flGrantCategory character varying(27) ,
flEducationLevel character varying(9) NOT NULL,
flMovement character varying(30) NOT NULL,
flGraduationYear integer ,
flStage character varying(18) NOT NULL,
flMonitoringStatus character varying(34) ,
flRecoveryStatus character varying(22) ,
flWorkedMonths integer ,
flRequiredMonths integer ,
flDebtBalance numeric (18, 2) ,
flArrivalDeadline timestamp without time zone ,
flDeferralUntil timestamp without time zone ,
flEmployerBin character varying(12) ,
flGrantState text NOT NULL,
flCreatedAt timestamp without time zone NOT NULL,
flRowVersion integer NOT NULL,
flPrevRowVersion integer NOT NULL,
flMomento timestamp without time zone NOT NULL, 
CONSTRAINT PK_grantstate PRIMARY KEY (
    flGrantId
));

select yoda_set_column_encrypted_security_label_v0('jas_maman', 'grantstate', 'flGrantState');
COMMENT ON COLUMN jas_maman.grantstate.flGrantState IS 'ENCRYPTED';

CREATE INDEX IX_grantstate_Iin ON jas_maman.grantstate USING btree (flIin);
CREATE INDEX IX_grantstate_LegacyStudyId ON jas_maman.grantstate USING btree (flLegacyStudyId);
CREATE INDEX IX_grantstate_University ON jas_maman.grantstate USING btree (flUniversityId);
CREATE INDEX IX_grantstate_UniversityBin ON jas_maman.grantstate USING btree (flUniversityBin);
CREATE INDEX IX_grantstate_Stage ON jas_maman.grantstate USING btree (flStage);
CREATE INDEX IX_grantstate_Monitoring ON jas_maman.grantstate USING btree (flMonitoringStatus);
CREATE INDEX IX_grantstate_Recovery ON jas_maman.grantstate USING btree (flRecoveryStatus);
CREATE INDEX IX_grantstate_GraduationYear ON jas_maman.grantstate USING btree (flGraduationYear);
CREATE INDEX IX_grantstate_DeferralUntil ON jas_maman.grantstate USING btree (flDeferralUntil);

ALTER TABLE jas_maman.grantstate ADD CONSTRAINT ch_grantstate_opt_lock CHECK (flrowversion = (flprevrowversion + 1));


CREATE TABLE jas_maman.z_history_grantstate (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flGrantId bigint NOT NULL,
flLegacyStudyId bigint ,
flLegacyPersonId bigint ,
flIin character varying(12) NOT NULL,
flFullName character varying(512) NOT NULL,
flUniversityId bigint ,
flUniversityBin character varying(12) ,
flUniversityName character varying(1024) ,
flSpecialityId bigint ,
flSpecialityName character varying(1024) ,
flGrantCategory character varying(27) ,
flEducationLevel character varying(9) NOT NULL,
flMovement character varying(30) NOT NULL,
flGraduationYear integer ,
flStage character varying(18) NOT NULL,
flMonitoringStatus character varying(34) ,
flRecoveryStatus character varying(22) ,
flWorkedMonths integer ,
flRequiredMonths integer ,
flDebtBalance numeric (18, 2) ,
flArrivalDeadline timestamp without time zone ,
flDeferralUntil timestamp without time zone ,
flEmployerBin character varying(12) ,
flGrantState text NOT NULL,
flCreatedAt timestamp without time zone NOT NULL,
flRowVersion integer NOT NULL,
flPrevRowVersion integer NOT NULL,
flMomento timestamp without time zone NOT NULL, 
CONSTRAINT PK_a4a459ef22686935af02a22738fa636f0df7a12a PRIMARY KEY (
    flEntityId, flRequestId
));

COMMENT ON COLUMN jas_maman.z_history_grantstate.flGrantState IS 'ENCRYPTED';


CREATE TABLE jas_maman.grantopstate (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flOperationId bigint NOT NULL,
flGrantId bigint NOT NULL,
flGrantRowVersion integer NOT NULL,
flInvokedByXin character varying(15) NOT NULL,
flInvokedByLogin character varying(128) NOT NULL,
flInvokedByName character varying(512) ,
flOperationNumber character varying(20) NOT NULL,
flOperationType character varying(22) NOT NULL,
flSummary character varying(1024) ,
flOpModel text NOT NULL,
flInvokeIpAddress character varying(64) NOT NULL,
flInvokedAt timestamp without time zone NOT NULL,
flMomento timestamp without time zone NOT NULL, 
CONSTRAINT PK_grantopstate PRIMARY KEY (
    flOperationId
));

select yoda_set_column_encrypted_security_label_v0('jas_maman', 'grantopstate', 'flOpModel');
COMMENT ON COLUMN jas_maman.grantopstate.flOpModel IS 'ENCRYPTED';

CREATE INDEX IX_grantopstate_GrantId ON jas_maman.grantopstate USING btree (flGrantId);
CREATE INDEX IX_grantopstate_InvokedAt ON jas_maman.grantopstate USING btree (flInvokedAt);
CREATE INDEX IX_grantopstate_Type ON jas_maman.grantopstate USING btree (flOperationType);

CREATE TABLE jas_maman.z_history_grantopstate (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flOperationId bigint NOT NULL,
flGrantId bigint NOT NULL,
flGrantRowVersion integer NOT NULL,
flInvokedByXin character varying(15) NOT NULL,
flInvokedByLogin character varying(128) NOT NULL,
flInvokedByName character varying(512) ,
flOperationNumber character varying(20) NOT NULL,
flOperationType character varying(22) NOT NULL,
flSummary character varying(1024) ,
flOpModel text NOT NULL,
flInvokeIpAddress character varying(64) NOT NULL,
flInvokedAt timestamp without time zone NOT NULL,
flMomento timestamp without time zone NOT NULL, 
CONSTRAINT PK_0e22dc2f28798dc112dea45a71c1812f85a2747e PRIMARY KEY (
    flEntityId, flRequestId
));

COMMENT ON COLUMN jas_maman.z_history_grantopstate.flOpModel IS 'ENCRYPTED';
