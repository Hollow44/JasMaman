CREATE SCHEMA diagnostics;

CREATE TABLE diagnostics.TbExceptionsLog (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flId integer NOT NULL,
flException character varying NOT NULL,
flProccessed boolean ,
flUrl character varying , 

CONSTRAINT PK_TbExceptionsLog PRIMARY KEY (
    flId
)

);




CREATE SEQUENCE diagnostics."seq_TbExceptionsLog_flId";

CREATE SCHEMA files;

CREATE TABLE files.TbFiles (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flFileSrcId character varying(36) NOT NULL,
flFileHashSha256 character varying(64) NOT NULL,
flFileSize bigint NOT NULL,
flContent bytea NOT NULL, 

CONSTRAINT PK_TbFiles PRIMARY KEY (
    flFileSrcId
)

);

CREATE UNIQUE INDEX IX_TbFiles_flHash ON files.TbFiles USING btree (flFileHashSha256);
CREATE UNIQUE INDEX IX_TbFiles_flHash_flSize ON files.TbFiles USING btree (flFileHashSha256, flFileSize);


CREATE TABLE files.z_history_TbFiles (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flFileSrcId character varying(36) NOT NULL,
flFileHashSha256 character varying(64) NOT NULL,
flFileSize bigint NOT NULL,
flContent bytea NOT NULL, 

CONSTRAINT PK_84af90d5425f276c4651e8b31b19067da2b2bbe2 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE files.tbFilesInfo (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flFileId character varying(36) NOT NULL,
flFileSrcId character varying(36) ,
flFileName character varying ,
flFileSize bigint NOT NULL,
flDescription character varying ,
flNamespace character varying , 

CONSTRAINT PK_tbFilesInfo PRIMARY KEY (
    flFileId
)

);




CREATE TABLE files.z_history_tbFilesInfo (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flFileId character varying(36) NOT NULL,
flFileSrcId character varying(36) ,
flFileName character varying ,
flFileSize bigint NOT NULL,
flDescription character varying ,
flNamespace character varying , 

CONSTRAINT PK_4e8c0655def48152cf28f0ca31f61b098459f5cc PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE files.tbFileStoreFiles (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flFileId character varying ,
flFileName character varying ,
flDescription character varying ,
flFileHash character varying ,
flFileSize bigint ,
flNamespace character varying ,
flContent bytea 
);




CREATE SCHEMA settings;

CREATE TABLE settings.TbUiSearchWidgetConfig (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer NOT NULL,
flQueryName character varying(120) NOT NULL,
flUpdateTime timestamp without time zone ,
flFieldsOrderAndWidth character varying ,
flSelectedOutputFields character varying ,
flSelectedFilterFields character varying , 

CONSTRAINT ixSearchWidgetPrimaryKey PRIMARY KEY (
    flUserId, flQueryName
)

);




CREATE TABLE settings.z_history_TbUiSearchWidgetConfig (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer NOT NULL,
flQueryName character varying(120) NOT NULL,
flUpdateTime timestamp without time zone ,
flFieldsOrderAndWidth character varying ,
flSelectedOutputFields character varying ,
flSelectedFilterFields character varying , 

CONSTRAINT PK_8c46b02992ca2addf2d45bbaa08b909e6e1ed5f0 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE settings.TbUiSearchWidgetConfigDefault (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flQueryName character varying(120) NOT NULL,
flUpdateTime timestamp without time zone ,
flFieldsOrderAndWidth character varying ,
flSelectedOutputFields character varying ,
flSelectedFilterFields character varying , 

CONSTRAINT ixDefaultSearchWidgetPrimaryKey PRIMARY KEY (
    flQueryName
)

);




CREATE TABLE settings.z_history_TbUiSearchWidgetConfigDefault (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flQueryName character varying(120) NOT NULL,
flUpdateTime timestamp without time zone ,
flFieldsOrderAndWidth character varying ,
flSelectedOutputFields character varying ,
flSelectedFilterFields character varying , 

CONSTRAINT PK_6cb9f439d1f7437ce58bc596f7629c276f976d93 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE settings.tbSearchOutputFieldsSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer ,
flQueryName character varying(250) ,
flFieldName character varying(100) 
);




CREATE TABLE settings.z_history_tbSearchOutputFieldsSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer ,
flQueryName character varying(250) ,
flFieldName character varying(100) , 

CONSTRAINT PK_6130b28a73cd9d012d408c90b4afd57bafd36738 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE settings.tbSearchFieldsOrderSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer ,
flQueryName character varying(250) ,
flFieldName character varying(100) ,
flWeight numeric (18, 2) 
);




CREATE TABLE settings.z_history_tbSearchFieldsOrderSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer ,
flQueryName character varying(250) ,
flFieldName character varying(100) ,
flWeight numeric (18, 2) , 

CONSTRAINT PK_79a4f790f2ad97bc2044c691f0d6b675a937073b PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE settings.tbSearchFieldsWidthSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer ,
flQueryName character varying(250) ,
flFieldName character varying(100) ,
flWidth integer 
);




CREATE TABLE settings.z_history_tbSearchFieldsWidthSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer ,
flQueryName character varying(250) ,
flFieldName character varying(100) ,
flWidth integer , 

CONSTRAINT PK_8f80a193bb33a39d484196f9123fcfb05d5fc824 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE settings.tbSearchFilterFieldsSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer ,
flQueryName character varying(250) ,
flFieldName character varying(100) 
);




CREATE TABLE settings.z_history_tbSearchFilterFieldsSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer ,
flQueryName character varying(250) ,
flFieldName character varying(100) , 

CONSTRAINT PK_ce34877be71d0a5f39aa6db12c91de43234b641e PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE settings.tbSearchDefaultOutputFieldsSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flQueryName character varying(250) ,
flFieldName character varying(100) 
);




CREATE TABLE settings.z_history_tbSearchDefaultOutputFieldsSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flQueryName character varying(250) ,
flFieldName character varying(100) , 

CONSTRAINT PK_4cfe177a9b7578c0c982ad9bb136ec9b6fcd1c72 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE settings.tbSearchDefaultFieldsOrderSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flQueryName character varying(250) ,
flFieldName character varying(100) ,
flWeight numeric (18, 2) 
);




CREATE TABLE settings.z_history_tbSearchDefaultFieldsOrderSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flQueryName character varying(250) ,
flFieldName character varying(100) ,
flWeight numeric (18, 2) , 

CONSTRAINT PK_35d7355b3dda6b3d7b6bdb0287ad38ed96a0ac96 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE settings.tbSearchDefaultFieldsWidthSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flQueryName character varying(250) ,
flFieldName character varying(100) ,
flWidth integer 
);




CREATE TABLE settings.z_history_tbSearchDefaultFieldsWidthSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flQueryName character varying(250) ,
flFieldName character varying(100) ,
flWidth integer , 

CONSTRAINT PK_d229ef8091aa1870133c42abebd4502e4c76a327 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE settings.tbSearchDefaultFilterFieldsSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flQueryName character varying(250) ,
flFieldName character varying(100) 
);




CREATE TABLE settings.z_history_tbSearchDefaultFilterFieldsSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flQueryName character varying(250) ,
flFieldName character varying(100) , 

CONSTRAINT PK_878ddc266653602d0094270259c4c2647fbf561a PRIMARY KEY (
    flEntityId, flRequestId
)

);



CREATE SCHEMA yoda_system;

CREATE TABLE yoda_system.tbAccessToReferencesRoles (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flReferenceAccessRoleId integer ,
flRoleText character varying ,
flReferenceValues character varying 
);




CREATE TABLE yoda_system.z_history_tbAccessToReferencesRoles (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flReferenceAccessRoleId integer ,
flRoleText character varying ,
flReferenceValues character varying , 

CONSTRAINT PK_14f86d49f39229aef9932be4beed5861cec516f4 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE yoda_system.TbCsSavedQueriesSchemas (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer ,
flQueryName character varying ,
flQueryXmlSchema character varying 
);




CREATE TABLE yoda_system.z_history_TbCsSavedQueriesSchemas (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer ,
flQueryName character varying ,
flQueryXmlSchema character varying , 

CONSTRAINT PK_91487ce96b624ca25c232c6ca7ff41afb60e8062 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE yoda_system.tbMrp (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flYear integer ,
flMrp numeric (18, 2) 
);




CREATE TABLE yoda_system.z_history_tbMrp (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flYear integer ,
flMrp numeric (18, 2) , 

CONSTRAINT PK_31ce122eac7b8dda35a1a18e35a0ba0c1a56a926 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE yoda_system.tbTextTranslations2 (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flTextId integer ,
flLang character varying(10) ,
flTranslatedText character varying 
);




CREATE TABLE yoda_system.z_history_tbTextTranslations2 (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flTextId integer ,
flLang character varying(10) ,
flTranslatedText character varying , 

CONSTRAINT PK_c073a99d214eeb84707d6e54ed2929af8c810427 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE yoda_system.tbTranslationsAllRegistredTexts (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flRowId integer ,
flText character varying ,
flCodeStack character varying ,
flUrl character varying 
);




CREATE TABLE yoda_system.z_history_tbTranslationsAllRegistredTexts (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flRowId integer ,
flText character varying ,
flCodeStack character varying ,
flUrl character varying , 

CONSTRAINT PK_af138dbab2c77803676c356d16f39094bb015dfc PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE yoda_system.TbTextSources2 (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flTextId integer ,
flSource character varying 
);




CREATE TABLE yoda_system.z_history_TbTextSources2 (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flTextId integer ,
flSource character varying , 

CONSTRAINT PK_aa558209bad93295c859f04423775a6f2a92cf9f PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE yoda_system.TbTextTranslationsCategories (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flCategoryId integer ,
flText character varying 
);




CREATE TABLE yoda_system.z_history_TbTextTranslationsCategories (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flCategoryId integer ,
flText character varying , 

CONSTRAINT PK_7dc7f047a756db2e23b569a29239bd41de265efe PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE yoda_system.TbTextSourceCategories (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flCategoryId integer ,
flSource character varying(500) 
);




CREATE TABLE yoda_system.z_history_TbTextSourceCategories (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flCategoryId integer ,
flSource character varying(500) , 

CONSTRAINT PK_b38b5e9eb8bcc9d0362f15e76d53ea34f9e252f2 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE yoda_system.TbTextsAll (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flId integer NOT NULL,
flText character varying NOT NULL,
flExportToJavascript boolean , 

CONSTRAINT PK_TbTextsAll PRIMARY KEY (
    flId
)

);




CREATE TABLE yoda_system.z_history_TbTextsAll (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flId integer NOT NULL,
flText character varying NOT NULL,
flExportToJavascript boolean , 

CONSTRAINT PK_f73fab33ea028cdad0ab1ce7cbd2b48e2fbc40c1 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE yoda_system.tbTextsIgnore (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flTextId integer 
);




CREATE TABLE yoda_system.tbNotWorkingDaysCalendar (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flDate date 
);




CREATE TABLE yoda_system.z_history_tbNotWorkingDaysCalendar (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flDate date , 

CONSTRAINT PK_66da3e7dd07a6296e887f4f3d7c4fbf0fc4a54d9 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE yoda_system.tbBlock (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flTheme character varying(100) ,
flModule character varying(200) ,
flBlock character varying(100) ,
flRegion character varying(50) ,
flWeight numeric (18, 2) 
);




CREATE TABLE yoda_system.z_history_tbBlock (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flTheme character varying(100) ,
flModule character varying(200) ,
flBlock character varying(100) ,
flRegion character varying(50) ,
flWeight numeric (18, 2) , 

CONSTRAINT PK_96db1046206d00d8f396572d3760606c78929a72 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE SEQUENCE yoda_system."seq_TbTextTranslationsCategories_flCategoryId";


CREATE SEQUENCE yoda_system."seq_TbTextsAll_flId";

CREATE SCHEMA users;

CREATE TABLE users.TbDataAccessSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flSettingsId integer ,
flTitle character varying ,
flReferenceName character varying(200) ,
flUserProfile character varying(100) 
);




CREATE TABLE users.z_history_TbDataAccessSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flSettingsId integer ,
flTitle character varying ,
flReferenceName character varying(200) ,
flUserProfile character varying(100) , 

CONSTRAINT PK_e94f51aef8b435df6100fa120d312fd9df83a9fe PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbDataAccessSettingsToTablesMap (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flMapId integer ,
flTableName character varying(200) ,
flSettingsId integer 
);




CREATE TABLE users.z_history_TbDataAccessSettingsToTablesMap (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flMapId integer ,
flTableName character varying(200) ,
flSettingsId integer , 

CONSTRAINT PK_0cbb56ea49ffdc513f55fab5ee5bf50556d55bac PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbDataAccessUserSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flId integer NOT NULL,
flSettingsId integer NOT NULL,
flUserId integer NOT NULL,
flValue character varying NOT NULL, 

CONSTRAINT PK_TbDataAccessUserSettings PRIMARY KEY (
    flId
)

);




CREATE TABLE users.z_history_TbDataAccessUserSettings (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flId integer NOT NULL,
flSettingsId integer NOT NULL,
flUserId integer NOT NULL,
flValue character varying NOT NULL, 

CONSTRAINT PK_29da563ea899011899c0363c2c8440fc70233417 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbRoles (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flRoleId integer NOT NULL,
flRoleName character varying NOT NULL,
flRoleDescription character varying ,
flProject character varying(128) ,
flUserProfile character varying(20) ,
flAutoAssigned boolean 
);




CREATE TABLE users.z_history_TbRoles (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flRoleId integer NOT NULL,
flRoleName character varying NOT NULL,
flRoleDescription character varying ,
flProject character varying(128) ,
flUserProfile character varying(20) ,
flAutoAssigned boolean , 

CONSTRAINT PK_13e08298465414a31c7f9fbc42ee15f0083d5155 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.tbRolePermissions (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flRoleId integer ,
flControllerName character varying ,
flPermission character varying 
);




CREATE TABLE users.z_history_tbRolePermissions (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flRoleId integer ,
flControllerName character varying ,
flPermission character varying , 

CONSTRAINT PK_de8003b8061964dc0e1a00b3cb54616fc201297f PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbUserRoles (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer ,
flRoleId integer 
);




CREATE TABLE users.z_history_TbUserRoles (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer ,
flRoleId integer , 

CONSTRAINT PK_5f7e43289bd4fe7721eb9cf98a6acdace6b73b58 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbCorpRelatedJobs (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flBin character varying(12) NOT NULL,
flGbdUlSyncJobId character varying(36) , 

CONSTRAINT PK_TbCorpRelatedJobs PRIMARY KEY (
    flBin
)

);




CREATE TABLE users.z_history_TbCorpRelatedJobs (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flBin character varying(12) NOT NULL,
flGbdUlSyncJobId character varying(36) , 

CONSTRAINT PK_2db96d844aea9486dc166f0cd3a5d3e1bfcf6005 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbUserRelatedJobs (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flIin character varying(12) NOT NULL,
flGbdFlSyncJobId character varying(36) , 

CONSTRAINT PK_TbUserRelatedJobs PRIMARY KEY (
    flIin
)

);




CREATE TABLE users.z_history_TbUserRelatedJobs (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flIin character varying(12) NOT NULL,
flGbdFlSyncJobId character varying(36) , 

CONSTRAINT PK_afb4413e13519970763ad7b085afba755284f0e0 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbUsers (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer NOT NULL,
flLogin character varying(25) NOT NULL,
flAccountId character varying(15) NOT NULL,
flAccountType character varying(14) NOT NULL,
flXin character varying(12) NOT NULL,
flIin character varying(12) NOT NULL,
flGroupName character varying NOT NULL,
flFirstName character varying NOT NULL,
flLastName character varying NOT NULL,
flMiddleName character varying ,
flFullName character varying NOT NULL,
flEmail character varying NOT NULL,
flMobilePhone character varying ,
flIsMobilePhoneConfirmed boolean NOT NULL,
flStationaryPhone character varying ,
flPassword character varying NOT NULL,
flIsBlocked boolean NOT NULL,
flBlockReason character varying ,
flAutoBlockAfter date ,
flRegistrationDate timestamp without time zone NOT NULL, 

CONSTRAINT PK_TbUsers PRIMARY KEY (
    flUserId
)

);

CREATE UNIQUE INDEX IX_TbUsers_Login_Unique ON users.TbUsers USING btree (flLogin);
CREATE UNIQUE INDEX IX_TbUsers_AccountId_Iin ON users.TbUsers USING btree (flAccountId, flIin);


CREATE TABLE users.z_history_TbUsers (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer NOT NULL,
flLogin character varying(25) NOT NULL,
flAccountId character varying(15) NOT NULL,
flAccountType character varying(14) NOT NULL,
flXin character varying(12) NOT NULL,
flIin character varying(12) NOT NULL,
flGroupName character varying NOT NULL,
flFirstName character varying NOT NULL,
flLastName character varying NOT NULL,
flMiddleName character varying ,
flFullName character varying NOT NULL,
flEmail character varying NOT NULL,
flMobilePhone character varying ,
flIsMobilePhoneConfirmed boolean NOT NULL,
flStationaryPhone character varying ,
flPassword character varying NOT NULL,
flIsBlocked boolean NOT NULL,
flBlockReason character varying ,
flAutoBlockAfter date ,
flRegistrationDate timestamp without time zone NOT NULL, 

CONSTRAINT PK_55cae888b551506bbf981472b86545e1b80994d9 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbAccounts (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flAccountId character varying(15) NOT NULL,
flAccountType character varying(14) NOT NULL,
flXin character varying(12) NOT NULL,
flNameRu character varying NOT NULL,
flNameKz character varying NOT NULL,
flIsBlocked boolean NOT NULL,
flBlockReason character varying , 

CONSTRAINT PK_TbAccounts PRIMARY KEY (
    flAccountId
)

);

CREATE UNIQUE INDEX IX_TbAccounts_AccountType_Xin ON users.TbAccounts USING btree (flAccountType, flXin);


CREATE TABLE users.z_history_TbAccounts (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flAccountId character varying(15) NOT NULL,
flAccountType character varying(14) NOT NULL,
flXin character varying(12) NOT NULL,
flNameRu character varying NOT NULL,
flNameKz character varying NOT NULL,
flIsBlocked boolean NOT NULL,
flBlockReason character varying , 

CONSTRAINT PK_e21c7bebd191d8d7cdfab81e3f510935fe7fd454 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbAccountAddr (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flAccountId character varying(15) NOT NULL,
flAddrType character varying(5) NOT NULL,
flAdrCountry character varying(10) NOT NULL,
flAdrIndex character varying ,
flAdrObl character varying(10) NOT NULL,
flAdrReg character varying(10) NOT NULL,
flAdrAdr character varying NOT NULL,
flRkaCode character varying , 

CONSTRAINT PK_TbAccountAddr PRIMARY KEY (
    flAccountId, flAddrType
)

);




CREATE TABLE users.z_history_TbAccountAddr (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flAccountId character varying(15) NOT NULL,
flAddrType character varying(5) NOT NULL,
flAdrCountry character varying(10) NOT NULL,
flAdrIndex character varying ,
flAdrObl character varying(10) NOT NULL,
flAdrReg character varying(10) NOT NULL,
flAdrAdr character varying NOT NULL,
flRkaCode character varying , 

CONSTRAINT PK_767b0448951275f516465d879275ec5b1d900646 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbAccountAdmins (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flAccountId character varying(15) NOT NULL,
flLogin character varying(25) NOT NULL, 

CONSTRAINT PK_TbAccountAdmins PRIMARY KEY (
    flAccountId, flLogin
)

);




CREATE TABLE users.z_history_TbAccountAdmins (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flAccountId character varying(15) NOT NULL,
flLogin character varying(25) NOT NULL, 

CONSTRAINT PK_8dc76748b83685943950e695d33ad3beba196507 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbCorpData (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flAccountId character varying(15) NOT NULL,
flBin character varying(15) NOT NULL,
flFirstPersonFio character varying ,
flFirstPersonIin character varying(12) ,
flCorpEmail character varying NOT NULL,
flCorpMobilePhone character varying ,
flCorpStationaryPhone character varying , 

CONSTRAINT PK_TbCorpData PRIMARY KEY (
    flAccountId
)

);

CREATE UNIQUE INDEX IX_TbCorpData_flBin ON users.TbCorpData USING btree (flBin);


CREATE TABLE users.z_history_TbCorpData (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flAccountId character varying(15) NOT NULL,
flBin character varying(15) NOT NULL,
flFirstPersonFio character varying ,
flFirstPersonIin character varying(12) ,
flCorpEmail character varying NOT NULL,
flCorpMobilePhone character varying ,
flCorpStationaryPhone character varying , 

CONSTRAINT PK_d4907471abe0ca99aeb79792783a63ea0c2dc01f PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbUserInvites (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flInviteAccountId character varying NOT NULL,
flIin character varying(12) NOT NULL,
flEmail character varying NOT NULL,
flGroupName character varying NOT NULL,
flInviteExpiresAt date NOT NULL,
flAutoBlockAfter date NOT NULL,
flInviteCode character varying(20) NOT NULL,
flUsed boolean NOT NULL, 

CONSTRAINT PK_TbUserInvites PRIMARY KEY (
    flIin, flInviteCode
)

);




CREATE TABLE users.z_history_TbUserInvites (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flInviteAccountId character varying NOT NULL,
flIin character varying(12) NOT NULL,
flEmail character varying NOT NULL,
flGroupName character varying NOT NULL,
flInviteExpiresAt date NOT NULL,
flAutoBlockAfter date NOT NULL,
flInviteCode character varying(20) NOT NULL,
flUsed boolean NOT NULL, 

CONSTRAINT PK_89ef2ca80d77d2123ddfee1e2afd2f5aad194cf3 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbUserDocs (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer NOT NULL,
flGivenBy character varying NOT NULL,
flNumber character varying NOT NULL,
flDate date NOT NULL,
flDocType character varying(8) NOT NULL, 

CONSTRAINT PK_TbUserDocs PRIMARY KEY (
    flUserId
)

);




CREATE TABLE users.z_history_TbUserDocs (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer NOT NULL,
flGivenBy character varying NOT NULL,
flNumber character varying NOT NULL,
flDate date NOT NULL,
flDocType character varying(8) NOT NULL, 

CONSTRAINT PK_8bfefeb709d0412b74d8b127aaba16208f4709bd PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbUsersAuthorizationHistory (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer NOT NULL,
flLogin character varying NOT NULL,
flRemoteAddr character varying NOT NULL,
flAuthorizationDate timestamp without time zone NOT NULL,
flSuccess boolean NOT NULL,
flReason character varying 
);




CREATE TABLE users.z_history_TbUsersAuthorizationHistory (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer NOT NULL,
flLogin character varying NOT NULL,
flRemoteAddr character varying NOT NULL,
flAuthorizationDate timestamp without time zone NOT NULL,
flSuccess boolean NOT NULL,
flReason character varying , 

CONSTRAINT PK_02c19830b05321effaf7e2d36c387c1b4bf15374 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbUsersPasswordHistory (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer NOT NULL,
flPassword character varying NOT NULL,
flChangeDate timestamp without time zone NOT NULL
);




CREATE TABLE users.z_history_TbUsersPasswordHistory (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer NOT NULL,
flPassword character varying NOT NULL,
flChangeDate timestamp without time zone NOT NULL, 

CONSTRAINT PK_67ac3da686117d5c9eaa71adb0f7592a8ac9e80d PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbTermsAndConditions (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flVersion integer ,
flTermsAndConditions character varying , 

CONSTRAINT PK_tbTermsAndConditions_flVersion PRIMARY KEY (
    flVersion
)

);




CREATE TABLE users.z_history_TbTermsAndConditions (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flVersion integer ,
flTermsAndConditions character varying , 

CONSTRAINT PK_4996b12709df1e02e3bdf46aeddbb987909cc148 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbUserTermsAndConditions (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer ,
flVersion integer ,
flTermsAndConditionsToSign character varying ,
flSignedData character varying ,
flCertInfo character varying ,
flSignDate timestamp without time zone , 

CONSTRAINT PK_tbUserTermsAndConditions PRIMARY KEY (
    flUserId, flVersion
)

);




CREATE TABLE users.z_history_TbUserTermsAndConditions (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flUserId integer ,
flVersion integer ,
flTermsAndConditionsToSign character varying ,
flSignedData character varying ,
flCertInfo character varying ,
flSignDate timestamp without time zone , 

CONSTRAINT PK_650aacc089c30d6a8456c11418b24e75d9ad80b7 PRIMARY KEY (
    flEntityId, flRequestId
)

);




CREATE TABLE users.TbAccountBankAccount (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flAccountId character varying(15) NOT NULL,
flBankBIC character varying(8) NOT NULL,
flKbe character varying(2) ,
flIik character varying(20) NOT NULL,
flNote character varying , 

CONSTRAINT PK_TbAccountBankAccount PRIMARY KEY (
    flAccountId
)

);




CREATE TABLE users.z_history_TbAccountBankAccount (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flAccountId character varying(15) NOT NULL,
flBankBIC character varying(8) NOT NULL,
flKbe character varying(2) ,
flIik character varying(20) NOT NULL,
flNote character varying , 

CONSTRAINT PK_dff2f1fa1e57ffab24ca85bef74b744d80c3a446 PRIMARY KEY (
    flEntityId, flRequestId
)

);


CREATE TABLE users.TbAccountModel (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flAccountId character varying(15) NOT NULL,
flUpdatedAt timestamp without time zone ,
flPrevUpdateVersion integer NOT NULL,
flUpdateVersion integer NOT NULL,
flAccountDataModel character varying NOT NULL, 

CONSTRAINT PK_TbAccountModel PRIMARY KEY (
    flAccountId
));




CREATE TABLE users.z_history_TbAccountModel (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flAccountId character varying(15) NOT NULL,
flUpdatedAt timestamp without time zone ,
flPrevUpdateVersion integer NOT NULL,
flUpdateVersion integer NOT NULL,
flAccountDataModel character varying NOT NULL, 

CONSTRAINT PK_f4e50377bdebb9eed917109ab1216d54551c3c26 PRIMARY KEY (
    flEntityId, flRequestId
));



CREATE TABLE users.TbUserModel (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flLogin character varying(25) NOT NULL,
flUpdatedAt timestamp without time zone ,
flPrevUpdateVersion integer NOT NULL,
flUpdateVersion integer NOT NULL,
flUserDataModel character varying NOT NULL, 

CONSTRAINT PK_TbUserModel PRIMARY KEY (
    flLogin
));
ALTER TABLE users.TbAccountModel ADD CONSTRAINT ch_tbaccountmodel_opt_lock CHECK (flupdateversion = (flprevupdateversion + 1));


CREATE TABLE users.z_history_TbUserModel (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flLogin character varying(25) NOT NULL,
flUpdatedAt timestamp without time zone ,
flPrevUpdateVersion integer NOT NULL,
flUpdateVersion integer NOT NULL,
flUserDataModel character varying NOT NULL, 

CONSTRAINT PK_9536d5425c5d708c60851e93f5d9a4526b6ed0fa PRIMARY KEY (
    flEntityId, flRequestId
));

ALTER TABLE users.TbUserModel ADD CONSTRAINT ch_tbusermodel_opt_lock CHECK (flupdateversion = (flprevupdateversion + 1));



CREATE SEQUENCE users."seq_TbDataAccessSettings_flSettingsId";


CREATE SEQUENCE users."seq_TbDataAccessSettingsToTablesMap_flMapId";


CREATE SEQUENCE users."seq_TbDataAccessUserSettings_flId";


CREATE SEQUENCE users."seq_TbRoles_flRoleId";


CREATE SEQUENCE users."seq_TbUsers_flUserId";



---
CREATE SCHEMA jobs;

CREATE TABLE jobs.tbJobs (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flJobId character varying(32) NOT NULL,
flRowVersion integer NOT NULL,
flQueueName character varying(150) NOT NULL,
flMessage character varying NOT NULL,
flStatus character varying(9) NOT NULL,
flCreatedAt timestamp without time zone NOT NULL,
flStartAfter timestamp without time zone NOT NULL,
flExpireAt timestamp without time zone ,
flStartedAt timestamp without time zone ,
flFinishedAt timestamp without time zone ,
flUpdatedAt timestamp without time zone NOT NULL,
flLastSuccessAt timestamp without time zone ,
flRepeatsCount integer NOT NULL,
flRetriesCount integer NOT NULL,
flDescription character varying ,
flException character varying , 

CONSTRAINT PK_tbJobs PRIMARY KEY (
    flJobId
)

);

CREATE INDEX IX_Status_StartAfter ON jobs.tbJobs USING btree (flStatus, flStartAfter);

CREATE SCHEMA refs;

CREATE TABLE refs.tbbanks (
flNodeId integer ,
flRevisionId integer ,
flBik character varying(8) ,
flName character varying(2048) ,
flNote character varying ,
flStatus character varying 
);