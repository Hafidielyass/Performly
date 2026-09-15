const VARIABLES_REQUISES = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'CORS_ORIGIN'];

const SECRETS_DEV_PAR_DEFAUT: Record<string, string> = {
  JWT_SECRET: 'change_me_dev_jwt_secret',
  JWT_REFRESH_SECRET: 'change_me_dev_refresh_secret',
};

/**
 * Fail-fast configuration gate, called by ConfigModule on boot. Relies on getOrThrow in the
 * services for per-use errors; this exists to catch the two mistakes that are silent and unique
 * to deployment: missing variables and dev-flag secrets leaked into production.
 */
export function validateConfig(config: Record<string, unknown>): Record<string, unknown> {
  const enProduction = config.NODE_ENV === 'production';

  if (!enProduction) return config;

  for (const cle of VARIABLES_REQUISES) {
    const valeur = config[cle];
    if (typeof valeur !== 'string' || valeur.trim() === '') {
      throw new Error(`Variable d'environnement manquante en production : ${cle}`);
    }
  }

  for (const [cle, valeurDev] of Object.entries(SECRETS_DEV_PAR_DEFAUT)) {
    if (config[cle] === valeurDev) {
      throw new Error(
        `${cle} garde sa valeur de développement par défaut en production. ` +
          `Générez un secret aléatoire fort (ex. openssl rand -hex 32).`,
      );
    }
  }

  return config;
}