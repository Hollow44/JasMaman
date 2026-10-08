
ALTER TABLE users.tbaccounts
ADD COLUMN flBlockDate timestamp without time zone ;


ALTER TABLE users.tbcorprelatedjobs
ADD COLUMN flLastSuccessDateTime timestamp without time zone ;


ALTER TABLE users.tbcorprelatedjobs
ADD COLUMN flGbdUlModelInJson character varying ;

ALTER TABLE users.TbRoles ADD CONSTRAINT PK_TbRoles PRIMARY KEY (flRoleId);

ALTER TABLE users.tbuserdocs
ALTER COLUMN fldoctype TYPE character varying(9);


ALTER TABLE users.tbuserrelatedjobs
ADD COLUMN flLastSuccessDateTime timestamp without time zone ;


ALTER TABLE users.tbuserrelatedjobs
ADD COLUMN flGbdFlModelInJson character varying ;


ALTER TABLE users.z_history_tbaccounts
ADD COLUMN flBlockDate timestamp without time zone ;


ALTER TABLE users.z_history_tbuserdocs
ALTER COLUMN fldoctype TYPE character varying(9);


ALTER TABLE users.z_history_tbcorprelatedjobs
ADD COLUMN flLastSuccessDateTime timestamp without time zone ;


ALTER TABLE users.z_history_tbcorprelatedjobs
ADD COLUMN flGbdUlModelInJson character varying ;


ALTER TABLE users.z_history_tbuserrelatedjobs
ADD COLUMN flLastSuccessDateTime timestamp without time zone ;


ALTER TABLE users.z_history_tbuserrelatedjobs
ADD COLUMN flGbdFlModelInJson character varying ;

ALTER TABLE yoda_system.tbMrp ADD CONSTRAINT PK_tbMrp PRIMARY KEY (flYear);
ALTER TABLE yoda_system.tbTextTranslations2 ADD CONSTRAINT PK_tbTextTranslations2 PRIMARY KEY (flTextId, flLang);

ALTER TABLE files.tbfilestorefiles
ALTER COLUMN flfileid TYPE character varying(60);

ALTER TABLE files.tbFileStoreFiles ADD CONSTRAINT IX_tbFileStoreFiles PRIMARY KEY (flFileId);