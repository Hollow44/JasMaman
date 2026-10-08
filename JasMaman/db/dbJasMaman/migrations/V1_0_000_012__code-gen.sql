
ALTER TABLE users.tbusertermsandconditions 
RENAME fluserid TO __rm__fluserid; -- Дабы не потерять данные, просто переименовываем колонку. Удалить можно на следующих итерациях. Либо если вы уверенны что ничего страшного не произойдет замените на DROP COLUMN самостоятельно.


ALTER TABLE users.tbusertermsandconditions
ADD COLUMN flLogin character varying(25) NOT NULL;


ALTER TABLE users.TbUserTermsAndConditions DROP CONSTRAINT "pk_tbusertermsandconditions";


ALTER TABLE users.TbUserTermsAndConditions ADD CONSTRAINT PK_tbUserTermsAndConditions PRIMARY KEY (flLogin, flVersion);


ALTER TABLE users.tbusertermsandconditions
ALTER COLUMN __rm__fluserid DROP NOT NULL;


ALTER TABLE users.z_history_tbusertermsandconditions 
RENAME fluserid TO __rm__fluserid; -- Дабы не потерять данные, просто переименовываем колонку. Удалить можно на следующих итерациях. Либо если вы уверенны что ничего страшного не произойдет замените на DROP COLUMN самостоятельно.


ALTER TABLE users.z_history_tbusertermsandconditions
ADD COLUMN flLogin character varying(25) NOT NULL;


CREATE TABLE users.tbUserConsent (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flLogin character varying(25) NOT NULL,
flVersion integer NOT NULL,
flConsentToSign character varying ,
flSignedData character varying ,
flCertInfo character varying ,
flSignDate timestamp without time zone ,
flClientName character varying , 
CONSTRAINT PK_tbUserConsent PRIMARY KEY (
    flLogin, flVersion
));


CREATE TABLE users.z_history_tbUserConsent (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flLogin character varying(25) NOT NULL,
flVersion integer NOT NULL,
flConsentToSign character varying ,
flSignedData character varying ,
flCertInfo character varying ,
flSignDate timestamp without time zone ,
flClientName character varying , 
CONSTRAINT PK_0ddd1c73fb2e7dfe180d5b5d74f43fba97cc4465 PRIMARY KEY (
    flEntityId, flRequestId
));


CREATE TABLE users.TbUserBecomeAccountAdminSigns (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flAccountId character varying NOT NULL,
flLogin character varying NOT NULL,
flDataToSign character varying ,
flSignedData character varying ,
flCertInfo character varying ,
flSignDate timestamp without time zone );
