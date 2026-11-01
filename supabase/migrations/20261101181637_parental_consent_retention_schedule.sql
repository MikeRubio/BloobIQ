create extension if not exists pg_cron;
select cron.schedule('bloopiq-parent-consent-retention','15 * * * *','select private.expire_parental_consents();');
