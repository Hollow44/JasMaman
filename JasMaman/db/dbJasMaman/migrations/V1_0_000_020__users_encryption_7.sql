
DROP VIEW IF EXISTS users.decrypted_tbusermodel;

ALTER TABLE users.tbusermodel
ALTER COLUMN fluserdatamodel TYPE text ;


ALTER TABLE users.z_history_tbusermodel
ALTER COLUMN fluserdatamodel TYPE text ;



select yoda_set_column_encrypted_security_label_v0('users', 'tbusermodel', 'fluserdatamodel'); 
comment on column users.tbusermodel.fluserdatamodel is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbusermodel', 'fluserdatamodel'); 
comment on column users.z_history_tbusermodel.fluserdatamodel is 'ENCRYPTED';



---------------


		
	SELECT * INTO TEMP tbusermodel_temp FROM users.tbusermodel;
	truncate users.tbusermodel;
	insert into users.tbusermodel select * from tbusermodel_temp;


	SELECT * INTO TEMP z_history_tbusermodel_temp FROM users.z_history_tbusermodel;
	truncate users.z_history_tbusermodel;
	insert into users.z_history_tbusermodel select * from z_history_tbusermodel_temp;


	
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbusermodel', 'fluserdatamodel'); 


    DROP VIEW IF EXISTS users.decrypted_z_history_tbusermodel;
