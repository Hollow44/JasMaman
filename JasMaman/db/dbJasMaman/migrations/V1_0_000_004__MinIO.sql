CREATE TABLE files.TbMinioFiles (
flEntityId bigint NOT NULL,
flRequestId bigint NOT NULL,
flIsHidden boolean NOT NULL,
flRequestType integer NOT NULL,
flRequestDate timestamp without time zone NOT NULL,
flRequestUserId integer NOT NULL,
flFileSrcId character varying(36) NOT NULL,
flFileHashSha256 character varying(64) NOT NULL,
flFileSize bigint NOT NULL, 

CONSTRAINT PK_TbMinioFiles PRIMARY KEY (
    flFileSrcId
)

);

CREATE UNIQUE INDEX IX_TbMinioFiles_flHash ON files.TbMinioFiles USING btree (flFileHashSha256);