
CREATE TABLE diagnostics.TbTranslationLog (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flId integer NOT NULL,
flUserName character varying ,
flSourceLang character varying NOT NULL,
flTargetLang character varying NOT NULL,
flSourceText character varying NOT NULL,
flTranslatedText character varying ,
flSuccess boolean NOT NULL,
flErrorMessage character varying ,
flReferer character varying , 
CONSTRAINT PK_TbTranslationLog PRIMARY KEY (
    flId
));



CREATE SEQUENCE diagnostics."seq_TbTranslationLog_flId";


CREATE TABLE jas_maman.university (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUniversityId bigint NOT NULL,
flLegacyId bigint ,
flBin character varying(12) ,
flNameRu character varying(1024) NOT NULL,
flNameKz character varying(1024) ,
flShortName character varying(256) ,
flRegion character varying(256) ,
flAddress character varying(1024) ,
flPhone character varying(128) ,
flEmail character varying(256) ,
flIsCollege character varying(3) NOT NULL,
flIsResearchInstitute character varying(3) NOT NULL,
flHasYoungSpecialists character varying(3) NOT NULL,
flIsActive character varying(3) NOT NULL,
flUpdatedAt timestamp without time zone NOT NULL, 
CONSTRAINT PK_university PRIMARY KEY (
    flUniversityId
));


CREATE INDEX IX_university_LegacyId ON jas_maman.university USING btree (flLegacyId);
CREATE INDEX IX_university_Bin ON jas_maman.university USING btree (flBin);

CREATE TABLE jas_maman.z_history_university (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUniversityId bigint NOT NULL,
flLegacyId bigint ,
flBin character varying(12) ,
flNameRu character varying(1024) NOT NULL,
flNameKz character varying(1024) ,
flShortName character varying(256) ,
flRegion character varying(256) ,
flAddress character varying(1024) ,
flPhone character varying(128) ,
flEmail character varying(256) ,
flIsCollege character varying(3) NOT NULL,
flIsResearchInstitute character varying(3) NOT NULL,
flHasYoungSpecialists character varying(3) NOT NULL,
flIsActive character varying(3) NOT NULL,
flUpdatedAt timestamp without time zone NOT NULL, 
CONSTRAINT PK_f261a075e2c11c03ef247d7ab2d75522e3917933 PRIMARY KEY (
    flEntityId, flRequestId
));



CREATE TABLE jas_maman.speciality (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flSpecialityId bigint NOT NULL,
flLegacyId bigint ,
flCode character varying(64) ,
flNameRu character varying(1024) NOT NULL,
flNameKz character varying(1024) ,
flParentId bigint ,
flStudyYears integer ,
flIsYoungSpecialist character varying(3) NOT NULL,
flIsActive character varying(3) NOT NULL,
flUpdatedAt timestamp without time zone NOT NULL, 
CONSTRAINT PK_speciality PRIMARY KEY (
    flSpecialityId
));


CREATE INDEX IX_speciality_LegacyId ON jas_maman.speciality USING btree (flLegacyId);
CREATE INDEX IX_speciality_Code ON jas_maman.speciality USING btree (flCode);

CREATE TABLE jas_maman.z_history_speciality (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flSpecialityId bigint NOT NULL,
flLegacyId bigint ,
flCode character varying(64) ,
flNameRu character varying(1024) NOT NULL,
flNameKz character varying(1024) ,
flParentId bigint ,
flStudyYears integer ,
flIsYoungSpecialist character varying(3) NOT NULL,
flIsActive character varying(3) NOT NULL,
flUpdatedAt timestamp without time zone NOT NULL, 
CONSTRAINT PK_c156865207b0751eb33296340a48a78d27df9745 PRIMARY KEY (
    flEntityId, flRequestId
));

