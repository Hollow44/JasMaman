
ALTER TABLE users.tbusers
ADD COLUMN flBlockUntil timestamp without time zone ;

CREATE INDEX IX_flAuthorizationDate ON users.TbUsersAuthorizationHistory USING btree (flAuthorizationDate);
CREATE INDEX IX_flUserId ON users.TbUsersAuthorizationHistory USING btree (flUserId);

ALTER TABLE users.z_history_tbusers
ADD COLUMN flBlockUntil timestamp without time zone ;


ALTER TABLE users.z_history_tbcorprelatedjobs 
RENAME TO __rm__z_history_tbcorprelatedjobs;


ALTER TABLE users.z_history_tbuserrelatedjobs 
RENAME TO __rm__z_history_tbuserrelatedjobs;

ALTER TABLE yoda_system.tbMrp DROP CONSTRAINT "ch_tbmrp_opt_lock";
ALTER TABLE yoda_system.tbMrp ADD CONSTRAINT ch_tbmrp_flyear CHECK ((flyear = (date_part('year'::text, fldate))::integer));
CREATE INDEX ix_queuename_status_startafter_flexpireat ON jobs.tbJobs USING btree (flqueuename, flstatus, flstartafter, flexpireat);