
ALTER TABLE users.tbusertermsandconditions
ADD COLUMN flSignType character varying(11) NOT NULL DEFAULT 'Certificate';


ALTER TABLE users.z_history_tbusertermsandconditions
ADD COLUMN flSignType character varying(11) NOT NULL DEFAULT 'Certificate';
