
ALTER TABLE yoda_system.tbmrp
ALTER COLUMN flmrp SET NOT NULL;


ALTER TABLE yoda_system.tbmrp
ADD COLUMN flDate date;

with mrp as(
	SELECT * FROM (VALUES
		(2017, '2017-01-01'::date, 2269),
		(2018, '2018-01-01'::date, 2405),
		(2019, '2019-01-01'::date, 2525),
		(2020, '2020-01-01'::date, 2651),
		(2020, '2020-04-01'::date, 2778),
		(2021, '2021-01-01'::date, 2917),
		(2022, '2022-01-01'::date, 3063)
	) as t(flyear, fldate, flmrp)
)
UPDATE yoda_system.tbmrp
SET flDate = (SELECT fldate FROM mrp WHERE mrp.flyear = tbmrp.flyear AND mrp.flmrp = tbmrp.flmrp);

ALTER TABLE yoda_system.tbmrp
ALTER COLUMN flDate SET NOT NULL;


ALTER TABLE yoda_system.tbMrp DROP CONSTRAINT "pk_tbmrp";
ALTER TABLE yoda_system.tbMrp ADD CONSTRAINT PK_tbMrp PRIMARY KEY (flDate);
ALTER TABLE yoda_system.tbMrp ADD CONSTRAINT ch_tbmrp_opt_lock CHECK (flyear = DATE_PART('year', fldate)::integer);


ALTER TABLE yoda_system.z_history_tbmrp
ADD COLUMN flDate date;

with mrp as(
	SELECT * FROM (VALUES
		(2017, '2017-01-01'::date, 2269),
		(2018, '2018-01-01'::date, 2405),
		(2019, '2019-01-01'::date, 2525),
		(2020, '2020-01-01'::date, 2651),
		(2020, '2020-04-01'::date, 2778),
		(2021, '2021-01-01'::date, 2917),
		(2022, '2022-01-01'::date, 3063)
	) as t(flyear, fldate, flmrp)
)
UPDATE yoda_system.z_history_tbmrp
SET flDate = (SELECT fldate FROM mrp WHERE mrp.flyear = z_history_tbmrp.flyear AND mrp.flmrp = z_history_tbmrp.flmrp);

ALTER TABLE yoda_system.z_history_tbmrp
ALTER COLUMN flDate SET NOT NULL;