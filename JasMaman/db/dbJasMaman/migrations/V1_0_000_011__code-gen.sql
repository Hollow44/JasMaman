DELETE FROM yoda_system.tbtextsall WHERE fltext = '';
ALTER TABLE yoda_system.tbtextsall ADD CHECK (fltext <> '');

DELETE FROM yoda_system.tbtexttranslations2 WHERE fllang = '' or fltranslatedtext = '';
ALTER TABLE yoda_system.tbtexttranslations2 ADD CHECK (fllang <> '');
ALTER TABLE yoda_system.tbtexttranslations2 ADD CHECK (fltranslatedtext <> '');
