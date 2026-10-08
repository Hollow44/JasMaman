

DROP VIEW IF EXISTS users.decrypted_tbaccountmodel;

ALTER TABLE users.tbaccountmodel
ALTER COLUMN flaccountdatamodel TYPE text ;


ALTER TABLE users.z_history_tbaccountmodel
ALTER COLUMN flaccountdatamodel TYPE text ;



select yoda_set_column_encrypted_security_label_v0('users', 'tbaccountmodel', 'flaccountdatamodel'); 
comment on column users.tbaccountmodel.flaccountdatamodel is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbaccountmodel', 'flaccountdatamodel'); 
comment on column users.z_history_tbaccountmodel.flaccountdatamodel is 'ENCRYPTED';




	SELECT * INTO TEMP tbaccountmodeltemp FROM users.tbaccountmodel;
	truncate users.tbaccountmodel;
	insert into users.tbaccountmodel select * from tbaccountmodeltemp;


	SELECT * INTO TEMP z_history_tbaccountmodell_temp FROM users.z_history_tbaccountmodel;
	truncate users.z_history_tbaccountmodel;
	insert into users.z_history_tbaccountmodel select * from z_history_tbaccountmodell_temp;



	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbaccountmodel', 'flaccountdatamodel'); 


    DROP VIEW IF EXISTS users.decrypted_z_history_tbaccountmodel;
  
