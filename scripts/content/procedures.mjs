import { imageChannels } from './product-model.mjs';

const term = (key) => ({ term: key });
const ui = (key) => ({ ui: key });
const route = (path) => ({ route: path });
const item = (...parts) => parts;
const step = (action, ...parts) => ({ action, parts });
const code = (channel, value, language = 'bash') => ({
  type: 'code',
  channel,
  language,
  value,
});
const routes = (...entries) => ({ type: 'routes', entries });
const composeLiteral = (value) => value.replaceAll('%{', '${');

const releaseChannels = (...facts) => ({
  stable: [item(imageChannels.stable.label, `\`${imageChannels.stable.image}\``), ...facts],
  beta: [item(imageChannels.beta.label, `\`${imageChannels.beta.image}\``), ...facts],
});

const composeYaml = composeLiteral(String.raw`services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: "%{POSTGRES_DB:?set POSTGRES_DB}"
      POSTGRES_USER: "%{POSTGRES_USER:?set POSTGRES_USER}"
      POSTGRES_PASSWORD: "%{POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}"
      TZ: "%{TZ:-Europe/Amsterdam}"
    volumes:
      - "%{DISCVAULT_POSTGRES_DATA:?set DISCVAULT_POSTGRES_DATA}:/var/lib/postgresql/data"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U %{POSTGRES_USER} -d %{POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 10

  next-api:
    image: "%{DISCVAULT_IMAGE:?set DISCVAULT_IMAGE}"
    restart: unless-stopped
    working_dir: /opt/discvault/backend
    command:
      - sh
      - -c
      - >-
        python next_database.py migrate &&
        exec gunicorn --bind 0.0.0.0:5000
        --workers %{DISCVAULT_API_WORKERS:-2}
        --timeout %{DISCVAULT_API_TIMEOUT:-180}
        next_app:app
    environment:
      DATABASE_URL: "postgresql://%{POSTGRES_USER}:%{POSTGRES_PASSWORD}@postgres:5432/%{POSTGRES_DB}"
      TZ: "%{TZ:-Europe/Amsterdam}"
      DISCVAULT_DATA_DIR: /data
      JWT_SECRET: "%{JWT_SECRET:?set JWT_SECRET}"
      RP_ID: "%{RP_ID:?set RP_ID}"
      RP_NAME: "%{RP_NAME:-DiscVault}"
      RP_ORIGINS: "%{RP_ORIGINS:?set RP_ORIGINS}"
      DISCVAULT_PLUGIN_INSTALL_DIR: /data/plugins
    volumes:
      - "%{DISCVAULT_DATA_DIR:?set DISCVAULT_DATA_DIR}:/data"
    ports:
      - "%{DISCVAULT_API_PORT:-6080}:5000"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test:
        - CMD
        - python
        - -c
        - "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/next/health')"
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s

  next-worker:
    image: "%{DISCVAULT_IMAGE:?set DISCVAULT_IMAGE}"
    restart: unless-stopped
    working_dir: /opt/discvault/backend
    command: ["python", "next_worker.py", "work"]
    environment:
      DATABASE_URL: "postgresql://%{POSTGRES_USER}:%{POSTGRES_PASSWORD}@postgres:5432/%{POSTGRES_DB}"
      TZ: "%{TZ:-Europe/Amsterdam}"
      DISCVAULT_DATA_DIR: /data
      DISCVAULT_WORKER_ID: "%{DISCVAULT_WORKER_ID:-worker-1}"
      DISCVAULT_WORKER_POLL_INTERVAL: "%{DISCVAULT_WORKER_POLL_INTERVAL:-2}"
      DISCVAULT_PLUGIN_INSTALL_DIR: /data/plugins
    volumes:
      - "%{DISCVAULT_DATA_DIR:?set DISCVAULT_DATA_DIR}:/data"
    depends_on:
      next-api:
        condition: service_healthy

  next-mcp:
    image: "%{DISCVAULT_IMAGE:?set DISCVAULT_IMAGE}"
    restart: unless-stopped
    working_dir: /opt/discvault/mcp-server
    command: ["python", "server.py", "--http", "--host", "0.0.0.0", "--port", "6090"]
    environment:
      DISCVAULT_API: http://next-api:5000
      TZ: "%{TZ:-Europe/Amsterdam}"
    ports:
      - "%{DISCVAULT_MCP_PORT:-6090}:6090"
    depends_on:
      next-api:
        condition: service_healthy
    healthcheck:
      test:
        - CMD
        - python
        - -c
        - "import urllib.request; urllib.request.urlopen('http://localhost:6090/health')"
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

networks:
  default:
    name: "%{DISCVAULT_NETWORK_NAME:-discvault}"`);

const composeSetup = String.raw`set -euo pipefail
test -n "$DISCVAULT_IMAGE"
case "$DISCVAULT_IMAGE" in
  ghcr.io/helmerznl/discvault:latest|ghcr.io/helmerznl/discvault:beta) ;;
  *) printf '%s\n' "$DISCVAULT_IMAGE" >&2; exit 64 ;;
esac
install -d -m 0700 /opt/discvault
install -d -m 0750 /srv/discvault
install -d -o 70 -g 70 -m 0700 /srv/discvault-postgres
cd /opt/discvault
test -f compose.yaml
umask 077
ENV_FILE=/opt/discvault/.env
test ! -e "$ENV_FILE"
ENV_TMP="$(mktemp "$ENV_FILE.tmp.XXXXXX")"
trap 'rm -f "$ENV_TMP"' EXIT
POSTGRES_PASSWORD="$(openssl rand -hex 32)"
JWT_SECRET="$(openssl rand -hex 32)"
printf '%s\n' \
  "DISCVAULT_IMAGE=$DISCVAULT_IMAGE" \
  'DISCVAULT_DATA_DIR=/srv/discvault' \
  'DISCVAULT_POSTGRES_DATA=/srv/discvault-postgres' \
  'DISCVAULT_API_PORT=6080' \
  'DISCVAULT_MCP_PORT=6090' \
  'DISCVAULT_NETWORK_NAME=discvault' \
  'DISCVAULT_API_WORKERS=2' \
  'DISCVAULT_API_TIMEOUT=180' \
  'DISCVAULT_WORKER_ID=worker-1' \
  'DISCVAULT_WORKER_POLL_INTERVAL=2' \
  'POSTGRES_DB=discvault' \
  'POSTGRES_USER=discvault' \
  "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" \
  "JWT_SECRET=$JWT_SECRET" \
  'TZ=Europe/Amsterdam' \
  'RP_ID=localhost' \
  'RP_NAME=DiscVault' \
  'RP_ORIGINS=http://localhost:6080' > "$ENV_TMP"
chmod 0600 "$ENV_TMP"
ln "$ENV_TMP" "$ENV_FILE"
rm -f "$ENV_TMP"
trap - EXIT
docker compose --env-file "$ENV_FILE" -p discvault -f compose.yaml config --quiet
docker compose --env-file "$ENV_FILE" -p discvault -f compose.yaml pull
docker compose --env-file "$ENV_FILE" -p discvault -f compose.yaml up -d
docker compose --env-file "$ENV_FILE" -p discvault -f compose.yaml ps
curl --fail http://localhost:6080/api/next/health`;

const composeCommand =
  'docker compose --env-file /opt/discvault/.env -p discvault -f /opt/discvault/compose.yaml';

const backupCommands = String.raw`set -euo pipefail
cd /opt/discvault
install -d -m 0700 /srv/backups
BACKUP_ID="$(date -u +%Y%m%dT%H%M%SZ)"
API_ID="$(docker compose --env-file .env -p discvault -f compose.yaml ps -q next-api)"
IMAGE_ID="$(docker inspect "$API_ID" --format '{{.Image}}')"
PREVIOUS_IMAGE="$(docker image inspect "$IMAGE_ID" --format '{{index .RepoDigests 0}}')"
test -n "$PREVIOUS_IMAGE"
printf 'BACKUP_ID=%s\nPREVIOUS_IMAGE=%s\n' "$BACKUP_ID" "$PREVIOUS_IMAGE" \
  > "/srv/backups/discvault-$BACKUP_ID.env"
chmod 0600 "/srv/backups/discvault-$BACKUP_ID.env"
docker compose --env-file .env -p discvault -f compose.yaml stop next-worker next-mcp next-api
docker compose --env-file .env -p discvault -f compose.yaml exec -T postgres \
  sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > "/srv/backups/discvault-$BACKUP_ID.dump"
tar --acls --xattrs -C /srv -czf \
  "/srv/backups/discvault-data-$BACKUP_ID.tgz" discvault
docker compose --env-file .env -p discvault -f compose.yaml start next-api
curl --fail http://localhost:6080/api/next/health
docker compose --env-file .env -p discvault -f compose.yaml start next-worker next-mcp
test -s "/srv/backups/discvault-$BACKUP_ID.dump"
gzip -t "/srv/backups/discvault-data-$BACKUP_ID.tgz"`;

const restoreCommands = String.raw`set -euo pipefail
BACKUP_ID=20260714T180000Z
cd /opt/discvault
. "/srv/backups/discvault-$BACKUP_ID.env"
test -n "$PREVIOUS_IMAGE"
export DISCVAULT_IMAGE="$PREVIOUS_IMAGE"
docker pull "$DISCVAULT_IMAGE"
ENV_FILE=/opt/discvault/.env
ENV_TMP="$(mktemp "$ENV_FILE.restore.XXXXXX")"
trap 'rm -f "$ENV_TMP"' EXIT
awk -v image="$DISCVAULT_IMAGE" '
  /^DISCVAULT_IMAGE=/ { print "DISCVAULT_IMAGE=" image; found=1; next }
  { print }
  END { if (!found) exit 42 }
' "$ENV_FILE" > "$ENV_TMP"
chmod 0600 "$ENV_TMP"
docker compose --env-file .env -p discvault -f compose.yaml stop next-worker next-mcp next-api
mv /srv/discvault "/srv/discvault.failed-$(date -u +%Y%m%dT%H%M%SZ)"
tar --acls --xattrs -C /srv -xzf \
  "/srv/backups/discvault-data-$BACKUP_ID.tgz"
docker compose --env-file .env -p discvault -f compose.yaml up -d postgres
docker compose --env-file .env -p discvault -f compose.yaml exec -T postgres \
  sh -c 'dropdb --if-exists --force -U "$POSTGRES_USER" "$POSTGRES_DB"'
docker compose --env-file .env -p discvault -f compose.yaml exec -T postgres \
  sh -c 'createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
docker compose --env-file .env -p discvault -f compose.yaml exec -T postgres \
  sh -c 'pg_restore --exit-on-error --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < "/srv/backups/discvault-$BACKUP_ID.dump"
docker compose --env-file .env -p discvault -f compose.yaml up -d --force-recreate next-api
curl --fail http://localhost:6080/api/next/health
docker compose --env-file .env -p discvault -f compose.yaml \
  up -d --force-recreate next-worker next-mcp
docker compose --env-file .env -p discvault -f compose.yaml ps
mv "$ENV_TMP" "$ENV_FILE"
trap - EXIT`;

export const procedures = {
  'start/index': {
    markers: ['`/install/`', '`/pwa/`', '`/ios/`', '`/android/`'],
    prerequisites: [
      item('Docker Engine `24+`'),
      item('iOS/iPadOS `17+`'),
      item('Android API `26+`'),
    ],
    channels: releaseChannels(item('PostgreSQL + `/data`', 'same v26 topology')),
    steps: [
      step('choose', route('install/index'), 'Docker Compose', 'DiscVault 26'),
      step('choose', route('pwa/index'), 'HTTPS', 'PWA'),
      step('choose', route('ios/index'), 'iOS/iPadOS `17+`', 'SwiftData'),
      step('choose', route('android/index'), 'Android API `26+`', 'Room'),
    ],
    blocks: [
      routes(
        ['install/index', 'DiscVault 26 · PostgreSQL · HTTPS'],
        ['pwa/index', 'PWA · browser'],
        ['ios/index', 'iOS/iPadOS 17+ · SwiftData'],
        ['android/index', 'Android API 26+ · Room'],
      ),
    ],
    outcomes: [item(term('selectedChannel')), item('server / PWA / iOS / Android')],
    safety: [item(term('dataRemains'), 'route selection')],
  },
  'start/requirements': {
    markers: ['Docker Engine `24+`', 'Docker Compose `v2`', 'PostgreSQL `17`', 'HTTPS'],
    prerequisites: [item('host shell'), item(term('writableStorage')), item('DNS + TLS')],
    channels: releaseChannels(item('Docker Compose `v2`', 'PostgreSQL `17`', 'persistent `/data`')),
    steps: [
      step('inspect', 'Docker Engine `≥24`', 'Docker Compose `v2`'),
      step('inspect', 'RAM `≥2 GB`', term('writableStorage')),
      step('configure', 'DNS', 'TLS', 'HTTPS', '`RP_ID`', '`RP_ORIGINS`'),
      step('record', 'host', 'browser', term('selectedChannel')),
    ],
    blocks: [
      code(
        'both',
        `docker version --format '{{.Server.Version}}'
docker compose version
curl --version`,
      ),
    ],
    outcomes: [item('Docker Engine `≥24`'), item('Docker Compose `v2`'), item('HTTPS DNS')],
    safety: [item(term('readOnlyRecovery'))],
  },
  'install/index': {
    markers: [
      '`:latest`',
      '`:beta`',
      '`:legacy`',
      '`DISCVAULT_IMAGE`',
      'PostgreSQL + `/data`',
      '`/update/migration/`',
    ],
    prerequisites: [item('Docker Engine `24+`'), item('Docker Compose `v2`')],
    channels: releaseChannels(
      item('same DiscVault 26 Compose topology'),
      item('PostgreSQL `17` + persistent `/data`'),
    ),
    steps: [
      step('choose', route('install/docker-compose'), 'recommended operational route'),
      step('choose', route('install/docker-run'), 'advanced complete equivalent'),
      step('choose', route('install/unraid'), 'Unraid Compose Manager'),
      step('choose', term('legacyChannelChoice')),
      step('preserve', term('legacyTopologyBoundary')),
      step('open', route('update/migration'), 'existing data → DiscVault 26'),
      step('record', '`DISCVAULT_IMAGE`', 'image digest', term('matchingBackupIfExisting')),
    ],
    blocks: [
      routes(
        [
          'install/docker-compose',
          'DiscVault 26 · Docker Compose · PostgreSQL + `/data` · `DISCVAULT_IMAGE`',
        ],
        ['install/docker-run', 'DiscVault 26 · Docker run · PostgreSQL + `/data` · `DATABASE_URL`'],
        ['install/storage-postgresql', 'DiscVault 26 · PostgreSQL + `/data`'],
        ['install/unraid', 'DiscVault 26 · Unraid · PostgreSQL + `/data`'],
        ['update/migration', 'previous generation → DiscVault 26 · guarded import'],
      ),
    ],
    outcomes: [
      item(term('selectedChannel')),
      item('PostgreSQL + `/data`', 'both v26 channels'),
      item(term('legacyTopologyBoundary')),
    ],
    safety: [
      item(term('legacyUpdateFlow')),
      item(term('legacyFrozen')),
      item(term('matchingBackupIfExisting')),
      item(term('releaseNotes')),
    ],
  },
  'install/docker-run': {
    markers: ['`DATABASE_URL`', '`discvault-postgres`', '`6080:5000`', '`/api/next/health`'],
    prerequisites: [
      item('Docker Engine `24+`'),
      item('OpenSSL'),
      item('advanced container operations'),
    ],
    channels: releaseChannels(
      item('PostgreSQL + API + worker + MCP'),
      item('host `6080` → API container `5000`'),
    ),
    steps: [
      step('record', '`DISCVAULT_IMAGE`', '`:latest` / `:beta`'),
      step('create', 'private `--env-file`', '`DATABASE_URL`', term('permission600')),
      step('start', '`discvault-postgres` → `discvault-api` → worker + MCP'),
      step('verify', '`6080:5000`', '`GET /api/next/health`', 'all four containers'),
    ],
    blocks: [
      code('stable', `export DISCVAULT_IMAGE=${imageChannels.stable.image}`),
      code('beta', `export DISCVAULT_IMAGE=${imageChannels.beta.image}`),
      code(
        'both',
        String.raw`set -euo pipefail
test -n "$DISCVAULT_IMAGE"
case "$DISCVAULT_IMAGE" in
  ghcr.io/helmerznl/discvault:latest|ghcr.io/helmerznl/discvault:beta) ;;
  *) printf '%s\n' "$DISCVAULT_IMAGE" >&2; exit 64 ;;
esac
install -d -m 0700 /opt/discvault
install -d -m 0750 /srv/discvault
install -d -o 70 -g 70 -m 0700 /srv/discvault-postgres
umask 077
ENV_FILE=/opt/discvault/docker-run.env
test ! -e "$ENV_FILE"
ENV_TMP="$(mktemp "$ENV_FILE.tmp.XXXXXX")"
trap 'rm -f "$ENV_TMP"' EXIT
POSTGRES_PASSWORD="$(openssl rand -hex 32)"
JWT_SECRET="$(openssl rand -hex 32)"
printf '%s\n' \
  'POSTGRES_DB=discvault' \
  'POSTGRES_USER=discvault' \
  "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" \
  "DATABASE_URL=postgresql://discvault:$POSTGRES_PASSWORD@discvault-postgres:5432/discvault" \
  "JWT_SECRET=$JWT_SECRET" \
  'TZ=Europe/Amsterdam' \
  'RP_ID=localhost' \
  'RP_NAME=DiscVault' \
  'RP_ORIGINS=http://localhost:6080' \
  'DISCVAULT_DATA_DIR=/data' \
  'DISCVAULT_PLUGIN_INSTALL_DIR=/data/plugins' \
  'DISCVAULT_WORKER_ID=worker-1' \
  'DISCVAULT_WORKER_POLL_INTERVAL=2' \
  'DISCVAULT_API=http://discvault-api:5000' > "$ENV_TMP"
chmod 0600 "$ENV_TMP"
ln "$ENV_TMP" "$ENV_FILE"
rm -f "$ENV_TMP"
trap - EXIT
docker network inspect discvault >/dev/null 2>&1 || docker network create discvault
docker run -d --name discvault-postgres --restart unless-stopped \
  --network discvault --env-file "$ENV_FILE" \
  --health-cmd 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  --health-interval 10s --health-timeout 5s --health-retries 10 \
  -v /srv/discvault-postgres:/var/lib/postgresql/data postgres:17-alpine
until [ "$(docker inspect discvault-postgres --format '{{.State.Health.Status}}')" = healthy ]; do
  sleep 2
done
docker run -d --name discvault-api --restart unless-stopped \
  --network discvault --env-file "$ENV_FILE" -w /opt/discvault/backend \
  -p 6080:5000 -v /srv/discvault:/data "$DISCVAULT_IMAGE" \
  sh -c 'python next_database.py migrate && exec gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 180 next_app:app'
until curl --fail http://localhost:6080/api/next/health; do sleep 2; done
docker run -d --name discvault-worker --restart unless-stopped \
  --network discvault --env-file "$ENV_FILE" -w /opt/discvault/backend \
  -v /srv/discvault:/data "$DISCVAULT_IMAGE" python next_worker.py work
docker run -d --name discvault-mcp --restart unless-stopped \
  --network discvault --env-file "$ENV_FILE" -w /opt/discvault/mcp-server \
  -p 6090:6090 "$DISCVAULT_IMAGE" \
  python server.py --http --host 0.0.0.0 --port 6090
docker ps --filter 'name=discvault-'`,
      ),
    ],
    outcomes: [item('HTTP `2xx`', '`/api/next/health`'), item('four v26 containers')],
    safety: [
      item('Docker Compose', 'recommended operational route'),
      item(term('matchingBackup'), 'PostgreSQL + `/data`'),
    ],
  },
  'install/docker-compose': {
    markers: ['`DISCVAULT_IMAGE`', '`postgres:17-alpine`', '`6080:5000`', '`/api/next/health`'],
    prerequisites: [item('Docker Compose `v2`'), item('OpenSSL'), item(term('writableStorage'))],
    channels: releaseChannels(
      item('identical Compose file and service graph'),
      item('only `DISCVAULT_IMAGE` selects the release channel'),
      item('derived from `app/deploy/next/docker-compose.yml`', 'internal API port `5000`'),
    ),
    steps: [
      step('create', '`/opt/discvault/compose.yaml`', 'exact v26 topology below'),
      step('choose', '`DISCVAULT_IMAGE`', '`:latest` stable / `:beta` beta'),
      step('create', '`/opt/discvault/.env`', term('permission600'), 'random secrets'),
      step('run', '`docker compose config --quiet`', 'pull', 'up', '`GET /api/next/health`'),
    ],
    blocks: [
      code('stable', `export DISCVAULT_IMAGE=${imageChannels.stable.image}`),
      code('beta', `export DISCVAULT_IMAGE=${imageChannels.beta.image}`),
      code('both', composeYaml, 'yaml'),
      code('both', composeSetup),
    ],
    outcomes: [
      item('`postgres`', '`next-api`', '`next-worker`', '`next-mcp`'),
      item('host `6080` → API container `5000`'),
      item('HTTP `2xx`', '`/api/next/health`'),
    ],
    safety: [
      item(term('matchingBackup')),
      item(term('releaseNotes')),
      item(term('separateDataStores')),
    ],
  },
  'install/unraid': {
    markers: [
      '`/mnt/user/appdata/discvault/postgres`',
      '`/mnt/user/appdata/discvault/data`',
      '`6080:5000`',
      '`DISCVAULT_IMAGE`',
    ],
    prerequisites: [item('Unraid `6.12+`'), item('Compose Manager'), item('OpenSSL')],
    channels: releaseChannels(
      item('same PostgreSQL + API + worker + MCP Compose stack'),
      item('stable default `:latest`; optional beta `:beta`'),
    ),
    steps: [
      step('install', 'Unraid Compose Manager', route('install/docker-compose')),
      step('configure', '`DISCVAULT_IMAGE`', '`:latest` default / `:beta` optional'),
      step(
        'configure',
        '`DISCVAULT_DATA_DIR=/mnt/user/appdata/discvault/data`',
        '`DISCVAULT_POSTGRES_DATA=/mnt/user/appdata/discvault/postgres`',
      ),
      step('verify', '`postgres`', '`next-api`', '`next-worker`', '`next-mcp`', '`6080:5000`'),
    ],
    blocks: [
      code(
        'stable',
        `DISCVAULT_IMAGE=${imageChannels.stable.image}
DISCVAULT_DATA_DIR=/mnt/user/appdata/discvault/data
DISCVAULT_POSTGRES_DATA=/mnt/user/appdata/discvault/postgres
DISCVAULT_API_PORT=6080
DISCVAULT_MCP_PORT=6090`,
        'text',
      ),
      code(
        'beta',
        `DISCVAULT_IMAGE=${imageChannels.beta.image}
DISCVAULT_DATA_DIR=/mnt/user/appdata/discvault/data
DISCVAULT_POSTGRES_DATA=/mnt/user/appdata/discvault/postgres
DISCVAULT_API_PORT=6080
DISCVAULT_MCP_PORT=6090`,
        'text',
      ),
    ],
    outcomes: [item('PostgreSQL persistence'), item('persistent `/data`'), item('HTTP `2xx`')],
    safety: [
      item(term('matchingBackup')),
      item('never remove appdata during container recreation'),
    ],
  },
  'install/storage-postgresql': {
    markers: ['`DISCVAULT_POSTGRES_DATA`', '`DISCVAULT_DATA_DIR`', '`postgres`', '`next-api`'],
    prerequisites: [
      item('running v26 Compose stack'),
      item(term('backupOutsideData')),
      item('PostgreSQL `17`'),
    ],
    channels: releaseChannels(
      item('PostgreSQL stores application records'),
      item('`/data` stores media, profiles, plugins, and file assets'),
    ),
    steps: [
      step('inspect', '`DISCVAULT_POSTGRES_DATA`', '`/var/lib/postgresql/data`'),
      step('inspect', '`DISCVAULT_DATA_DIR`', '`/data`'),
      step('verify', '`postgres`', '`healthy`', '`next-api`'),
      step('record', term('sameBackupWindow'), 'restore rehearsal'),
    ],
    blocks: [
      code(
        'both',
        `${composeCommand} ps
${composeCommand} exec -T postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
docker inspect discvault-next-api-1 --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println}}{{end}}'`,
      ),
    ],
    outcomes: [
      item('PostgreSQL', '`healthy`'),
      item('persistent `/data`'),
      item(term('matchingBackup')),
    ],
    safety: [item(term('separateDataStores')), item(term('backupOutsideData'))],
  },
  'install/reverse-proxy-passkeys': {
    markers: ['FQDN', '`RP_ORIGINS`', '`RP_ID`', '`6080`', '`/api/next/health`', 'localhost'],
    prerequisites: [item('public FQDN'), item('trusted TLS certificate'), item('reverse proxy')],
    notices: [
      {
        heading: term('legacyAuthFallbackHeading'),
        label: term('plannedLabel'),
        paragraphs: [term('legacyAuthFallbackSummary'), term('legacyAuthFallbackStatus')],
      },
    ],
    channels: releaseChannels(
      item('same `RP_ID` + `RP_ORIGINS` configuration'),
      item('proxy host port `6080`; API listens on container port `5000`'),
      item(term('fqdnSecureContext')),
      item(term('fqdnValues')),
    ),
    steps: [
      step('choose', 'stable FQDN', term('fqdnSecureContext')),
      step('configure', '`RP_ID`', 'hostname only'),
      step('configure', '`RP_ORIGINS`', 'exact public HTTPS origin'),
      step('configure', 'proxy upstream', '`http://127.0.0.1:6080`'),
      step('test', '`GET /api/next/health`', 'passkey registration', 'same origin'),
      step('record', term('fqdnChange')),
    ],
    blocks: [
      code(
        'both',
        `RP_ID=discvault.example.com
RP_ORIGINS=https://discvault.example.com
curl --fail https://discvault.example.com/api/next/health`,
        'text',
      ),
    ],
    outcomes: [
      item('HTTPS health', 'HTTP `2xx`'),
      item('passkey', '`RP_ID` + public origin'),
      item(term('fqdnValues')),
    ],
    safety: [item(term('fqdnChange')), item(term('proxyRecovery'))],
  },
  'install/first-start-health': {
    markers: ['`/api/next/health`', '`/api/next/auth/status`', '`6080:5000`', 'WebAuthn'],
    prerequisites: [item('running v26 deployment'), item('browser', 'configured origin')],
    channels: releaseChannels(
      item('same health and authentication endpoints'),
      item('host `6080` → internal API `5000`'),
    ),
    steps: [
      step('inspect', 'Compose status', '`postgres` health', 'startup logs'),
      step('verify', '`GET /api/next/health`', 'HTTP `2xx`'),
      step('open', 'configured origin', 'first account'),
      step('verify', 'owner', '`GET /api/next/auth/status`', 'WebAuthn'),
    ],
    blocks: [
      code(
        'both',
        `${composeCommand} ps
${composeCommand} logs --tail=100 next-api next-worker next-mcp postgres
curl --fail http://localhost:6080/api/next/health
curl --fail http://localhost:6080/api/next/auth/status`,
      ),
    ],
    outcomes: [item(term('ownerAccepted'))],
    safety: [item(term('redactedLogs')), item(term('matchingBackup'))],
  },
  'update/index': {
    markers: [
      '`/update/backup/`',
      '`/update/restore/`',
      '`/update/update/`',
      '`/update/rollback/`',
    ],
    prerequisites: [item(term('matchingBackup')), item(term('releaseNotes'))],
    channels: releaseChannels(item('one v26 backup/update/restore topology')),
    steps: [
      step('backup', route('update/backup'), term('matchingBackup')),
      step('test', route('update/restore'), 'restore rehearsal'),
      step('run', route('update/update'), '`DISCVAULT_IMAGE`'),
      step('preserve', route('update/rollback'), 'previous image + matching data'),
    ],
    blocks: [
      routes(
        ['update/backup', '1 · PostgreSQL + filesystem backup'],
        ['update/restore', '2 · matched restore rehearsal'],
        ['update/update', '3 · image-variable update'],
        ['update/rollback', '4 · image + matched data rollback'],
      ),
    ],
    outcomes: [item(term('backupAccepted')), item(term('updateAccepted'))],
    safety: [item(term('matchingBackup')), item('`PREVIOUS_IMAGE`', '`@sha256:`')],
  },
  'update/backup': {
    markers: ['`pg_dump -Fc`', '`DISCVAULT_DATA_DIR`', '`PREVIOUS_IMAGE`', '`next-api`'],
    prerequisites: [item(term('backupOutsideData')), item(term('writableStorage'))],
    channels: releaseChannels(item(term('sameBackupWindow')), item('PostgreSQL + `/data`')),
    steps: [
      step('record', '`PREVIOUS_IMAGE`', 'immutable `sha256` digest'),
      step('stop', '`next-api` + `next-worker` + `next-mcp` writers'),
      step('backup', '`pg_dump -Fc` + filesystem archive'),
      step('start', '`next-api` → health → worker + MCP', 'validate both files'),
    ],
    blocks: [code('both', backupCommands)],
    outcomes: [item(term('backupAccepted'))],
    safety: [item(term('backupFailure')), item(term('sameBackupWindow'))],
  },
  'update/restore': {
    markers: ['`pg_restore --exit-on-error`', '`discvault.failed-`', '`next-worker`', '`next-api`'],
    prerequisites: [
      item(term('matchingBackup')),
      item(term('maintenanceWindow')),
      item('`PREVIOUS_IMAGE`', term('privateRuntimeFile')),
    ],
    channels: releaseChannels(item(term('sameBackupWindow')), item(term('dataBeforeImage'))),
    steps: [
      step('stop', '`next-api` + `next-worker` + `next-mcp`'),
      step('restore', '`/data` archive', 'before image startup'),
      step('restore', 'PostgreSQL', '`pg_restore --exit-on-error`'),
      step('start', '`next-api` → `GET /api/next/health` → `next-worker` + `next-mcp`'),
    ],
    blocks: [code('both', restoreCommands)],
    outcomes: [item(term('matchedDataResult')), item('same procedure', '`:latest` / `:beta`')],
    safety: [item(term('restoreFailureStopsStartup'))],
  },
  'update/update': {
    markers: [
      '`:latest`',
      '`:beta`',
      '`:legacy`',
      '`DISCVAULT_IMAGE`',
      '`--force-recreate`',
      '`/update/migration/`',
    ],
    prerequisites: [item(term('matchingBackup')), item(term('releaseNotes'))],
    channels: releaseChannels(
      item('change only `DISCVAULT_IMAGE` in the same Compose deployment'),
      item('same PostgreSQL + `/data` topology', term('releaseNotes'), term('matchingBackup')),
    ),
    steps: [
      step('inspect', term('legacyChannelChoice')),
      step('backup', term('matchingBackup'), 'before pull or recreate'),
      step('choose', term('legacyUpdateFlow')),
      step('open', route('update/migration'), 'when moving to DiscVault 26'),
      step('preserve', term('legacyTopologyBoundary')),
      step('verify', '`DiscVault v26`', 'backup manifest', '`PREVIOUS_IMAGE=@sha256:…`'),
      step('choose', '`DiscVault v26`', '`DISCVAULT_IMAGE`', '`:latest` / `:beta`'),
      step('run', '`DiscVault v26`', 'Compose pull + `--force-recreate`', 'without deleting data'),
      step('compare', '`DiscVault v26`', term('updateAccepted')),
    ],
    blocks: [
      code('stable', `export DISCVAULT_IMAGE=${imageChannels.stable.image}`),
      code('beta', `export DISCVAULT_IMAGE=${imageChannels.beta.image}`),
      code(
        'both',
        String.raw`set -euo pipefail
test -n "$DISCVAULT_IMAGE"
case "$DISCVAULT_IMAGE" in
  ghcr.io/helmerznl/discvault:latest|ghcr.io/helmerznl/discvault:beta) ;;
  *) printf '%s\n' "$DISCVAULT_IMAGE" >&2; exit 64 ;;
esac
cd /opt/discvault
ENV_FILE=/opt/discvault/.env
ENV_TMP="$(mktemp "$ENV_FILE.update.XXXXXX")"
trap 'rm -f "$ENV_TMP"' EXIT
awk -v image="$DISCVAULT_IMAGE" '
  /^DISCVAULT_IMAGE=/ { print "DISCVAULT_IMAGE=" image; found=1; next }
  { print }
  END { if (!found) exit 42 }
' "$ENV_FILE" > "$ENV_TMP"
chmod 0600 "$ENV_TMP"
docker compose --env-file "$ENV_TMP" -p discvault -f compose.yaml config --quiet
docker compose --env-file "$ENV_TMP" -p discvault -f compose.yaml pull next-api next-worker next-mcp
docker compose --env-file "$ENV_TMP" -p discvault -f compose.yaml up -d --force-recreate
docker compose --env-file "$ENV_TMP" -p discvault -f compose.yaml ps
curl --fail http://localhost:6080/api/next/health
mv "$ENV_TMP" "$ENV_FILE"
trap - EXIT`,
      ),
    ],
    outcomes: [item(term('updateAccepted')), item(term('legacyTopologyBoundary'))],
    safety: [
      item(term('legacyFrozen')),
      item(route('update/rollback'), term('matchingBackup')),
      item(term('releaseNotes')),
    ],
  },
  'update/rollback': {
    markers: [
      '`PREVIOUS_IMAGE`',
      '`pg_restore --exit-on-error`',
      '`discvault.failed-`',
      '`DISCVAULT_IMAGE`',
    ],
    prerequisites: [item(term('matchingBackup')), item('recorded immutable `PREVIOUS_IMAGE`')],
    channels: releaseChannels(item(term('dataBeforeImage')), item('PostgreSQL + `/data`')),
    steps: [
      step('stop', '`next-api` + `next-worker` + `next-mcp`'),
      step('restore', 'matching `/data` archive'),
      step('restore', 'matching PostgreSQL dump', '`pg_restore --exit-on-error`'),
      step('start', '`PREVIOUS_IMAGE` → API health → worker + MCP'),
    ],
    blocks: [code('both', restoreCommands)],
    outcomes: [
      item('`PREVIOUS_IMAGE`', '`@sha256:`'),
      item(term('dataBeforeImage')),
      item(term('matchedDataResult')),
    ],
    safety: [item(term('restoreFailureStopsStartup'))],
  },
  'update/migration': {
    markers: [
      '`/migration/readiness`',
      '`ready_for_confirmation`',
      '`/data/discvault.db`',
      'legacy SQLite source',
    ],
    prerequisites: [
      item(term('legacyMigrationSource'), '`/data/discvault.db`', 'source backup'),
      item(term('sameBackupWindow')),
      item(term('ownerAccess')),
    ],
    channels: releaseChannels(
      item('DiscVault 26 migration assistant'),
      item(term('legacyMigrationSource'), 'SQLite → PostgreSQL'),
    ),
    steps: [
      step('backup', term('legacyMigrationSource'), term('sameBackupWindow'), 'before import'),
      step('inspect', '`/api/next/migration/readiness`', '`ready_for_confirmation`'),
      step('run', 'one migration job', '`POST /api/next/migration/start`'),
      step('compare', term('migrationAccepted')),
    ],
    blocks: [
      code(
        'both',
        `curl --fail http://localhost:6080/api/next/migration/readiness
curl --fail http://localhost:6080/api/next/migration/status
curl --fail -X POST http://localhost:6080/api/next/migration/start \\
  -H 'Content-Type: application/json' -d '{}'
curl --fail http://localhost:6080/api/next/migration/status`,
      ),
    ],
    outcomes: [item(term('migrationAccepted'))],
    safety: [item(term('migrationRecovery'))],
  },
  'configure/index': {
    markers: [
      '`/configure/environment/`',
      '`/configure/auth-rbac/`',
      '`/configure/plugins-metadata/`',
    ],
    prerequisites: [item(term('ownerAccess')), item('configuration backup')],
    channels: releaseChannels(item('same v26 environment, RBAC, and plugin interfaces')),
    steps: [
      step('choose', route('configure/environment'), 'runtime assignments'),
      step('choose', route('configure/auth-rbac'), 'passkeys + RBAC'),
      step('choose', route('configure/plugins-metadata'), 'provider registry'),
      step('record', 'one subsystem change', 'previous value', 'acceptance result'),
    ],
    blocks: [
      routes(
        ['configure/environment', 'v26 Compose variables · secrets'],
        ['configure/auth-rbac', 'DiscVault 26 · passkeys · invites · RBAC'],
        ['configure/plugins-metadata', 'DiscVault 26 · plugins · metadata'],
      ),
    ],
    outcomes: [
      item('focused procedure', term('selectedChannel')),
      item('one subsystem per change'),
    ],
    safety: [item(term('oneChangeRecovery'))],
  },
  'configure/environment': {
    markers: ['`/opt/discvault/.env`', '`DISCVAULT_IMAGE`', '`chmod 0600`', '`RP_ORIGINS`'],
    prerequisites: [item(term('privateRuntimeFile')), item('OpenSSL'), item(term('restartWindow'))],
    channels: releaseChannels(item('one `.env` schema consumed by the same Compose file')),
    steps: [
      step('create', '`/opt/discvault/.env`', term('permission600')),
      step('configure', '`DISCVAULT_IMAGE`', 'random secrets', '`RP_ORIGINS`'),
      step('verify', '`chmod 0600`', '`docker compose config --quiet`'),
      step('start', term('keepSecretsStable'), 'all v26 services'),
    ],
    blocks: [
      code('stable', `export DISCVAULT_IMAGE=${imageChannels.stable.image}`),
      code('beta', `export DISCVAULT_IMAGE=${imageChannels.beta.image}`),
      code('both', composeSetup),
    ],
    outcomes: [item(term('permission600')), item(term('environmentValidated'))],
    safety: [
      item(term('runtimeSeparation'), '`.env.example`'),
      item(term('keepSecretsStable'), '`JWT_SECRET`', '`POSTGRES_PASSWORD`'),
      item(term('restoreRuntimeFile')),
    ],
  },
  'configure/auth-rbac': {
    markers: [
      '`/api/next/auth/status`',
      '`/api/next/auth/rbac`',
      'WebAuthn',
      '`48 h`',
      'Windows Hello',
      'iOS/iPadOS `16+`',
      'Android `9+`',
    ],
    prerequisites: [
      item(term('ownerAccess')),
      item(route('install/reverse-proxy-passkeys'), 'HTTPS + FQDN'),
      item(term('recoveryMethod')),
    ],
    channels: releaseChannels(
      item('WebAuthn', 'owner / administrator / editor / fan / viewer'),
      item(term('passkeyModel')),
      item(term('passkeyBenefits')),
      item(term('passkeyInviteBoundary')),
    ),
    steps: [
      step('inspect', term('passkeyModel')),
      step('compare', term('passkeyBenefits'), term('passkeyInviteBoundary')),
      step('verify', term('passkeyWindows')),
      step('verify', term('passkeyApple')),
      step('verify', term('passkeyMobile')),
      step('create', term('passkeyRecovery')),
      step('open', ui('authEnable')),
      step('create', ui('authInvite')),
      step('configure', ui('authRoles')),
      step('test', 'second user', 'assigned permission only', 'owner session remains open'),
    ],
    blocks: [
      code(
        'both',
        `curl --fail http://localhost:6080/api/next/auth/status
curl --fail http://localhost:6080/api/next/auth/rbac`,
      ),
    ],
    outcomes: [
      item(term('authAccepted')),
      item(term('passkeyBenefits')),
      item(term('passkeyInviteBoundary')),
    ],
    safety: [item(term('passkeyRecovery')), item(term('authRecovery'))],
  },
  'configure/plugins-metadata': {
    markers: [
      '`/api/next/plugins/registry`',
      '`/data/plugins`',
      '`dryRun`',
      '`secret app_settings`',
    ],
    prerequisites: [item(term('adminAccess')), item(term('providerCredentials'))],
    channels: releaseChannels(item('DiscVault 26 plugin registry', '`/data/plugins` persistent')),
    steps: [
      step('inspect', '`GET /api/next/plugins/registry`', 'manifest'),
      step('configure', ui('pluginsConfigure'), term('providerCredentials')),
      step('test', ui('pluginsHealth'), ui('pluginsDryRun'), '`dryRun`'),
      step('record', 'provider order', 'health result', 'dry-run sample'),
    ],
    blocks: [
      code(
        'both',
        `curl --fail http://localhost:6080/api/next/plugins/registry
curl --fail http://localhost:6080/api/next/metadata/plugins`,
      ),
    ],
    outcomes: [item(term('pluginAccepted'))],
    safety: [item(term('pluginRecovery'))],
  },
  'pwa/index': {
    markers: ['PWA', 'HTTPS', '`Service Worker`', '`/pwa/offline/`'],
    prerequisites: [item('supported browser'), item('healthy HTTPS DiscVault 26 origin')],
    channels: releaseChannels(item('same v26 PWA shell and server-backed data')),
    steps: [
      step('install', route('pwa/install'), 'trusted HTTPS origin'),
      step('open', route('pwa/library-search'), 'library + search + filters'),
      step('test', route('pwa/offline'), '`Service Worker` cache boundary'),
      step('verify', 'same origin', 'passkey login', 'fresh server data after reconnect'),
    ],
    blocks: [
      routes(
        ['pwa/install', 'desktop · iOS/iPadOS · Android'],
        ['pwa/library-search', 'library · search · filters · watchlist'],
        ['pwa/offline', 'Service Worker · cache · reconnect'],
      ),
    ],
    outcomes: [
      item(ui('desktopInstall'), ui('iosPwaInstall'), ui('androidPwaInstall')),
      item(term('cacheBoundary')),
    ],
    safety: [item(term('pwaRemoval'))],
  },
  'pwa/install': {
    markers: ['HTTPS', '`display-mode: standalone`', 'iOS/iPadOS', 'Android'],
    prerequisites: [item('HTTPS or localhost'), item(term('signedInAccount'))],
    channels: releaseChannels(item('PWA', '`display-mode: standalone`', 'exact passkey origin')),
    steps: [
      step('install', ui('desktopInstall'), 'desktop Chromium'),
      step('install', ui('iosPwaInstall'), 'iOS/iPadOS Safari'),
      step('install', ui('androidPwaInstall'), 'Android Chromium'),
      step('verify', 'standalone window', 'same server origin', 'owner login'),
    ],
    blocks: [],
    outcomes: [
      item(ui('desktopInstall')),
      item(ui('iosPwaInstall')),
      item(ui('androidPwaInstall')),
      item(term('signedInAccount'), 'HTTPS'),
    ],
    safety: [item(term('pwaRemoval'))],
  },
  'pwa/library-search': {
    markers: [
      'PWA',
      '`watchlist`',
      '`history`',
      'RBAC',
      'Collectors Mode',
      '`merge_editions_as_title`',
      '`box_set`',
      '`vault`',
      '`collection`',
    ],
    prerequisites: [item(term('signedInAccount')), item('collection permission')],
    channels: releaseChannels(
      item('PWA', 'RBAC', 'account permissions'),
      item(term('collectorsDefaults')),
      item(term('editionMerge')),
    ),
    steps: [
      step('open', ui('librarySearch'), 'known title'),
      step('configure', ui('libraryFilter')),
      step('compare', ui('libraryView'), 'same result count'),
      step('test', ui('titleWatchlist'), 'reload persistence'),
      step('open', ui('collectorSettingsPath')),
      step('configure', term('collectorsDefaults')),
      step('test', term('editionMerge')),
      step('compare', term('boxSetDefinition')),
      step('compare', term('vaultDefinition')),
      step('compare', term('collectionDefinition')),
      step('test', term('collectorVisibility')),
    ],
    blocks: [],
    outcomes: [
      item(ui('librarySearch')),
      item(ui('libraryFilter')),
      item(ui('titleWatchlist')),
      item(term('editionMerge')),
      item(term('boxSetDefinition')),
      item(term('vaultDefinition')),
      item(term('collectionDefinition')),
    ],
    safety: [item(term('collectorVisibility')), item(term('libraryRecovery'))],
  },
  'pwa/offline': {
    markers: ['`Service Worker`', '`CacheStorage`', '`navigator.onLine`', 'HTTPS'],
    prerequisites: [item('installed PWA'), item('one successful online load')],
    channels: releaseChannels(item(term('cacheBoundary'), '`Service Worker`', '`CacheStorage`')),
    steps: [
      step('open', ui('librarySearch'), 'while online'),
      step('test', term('airplaneMode'), '`Service Worker`'),
      step('record', 'available cached screen', 'blocked server-backed action'),
      step('reconnect', 'network', 'reload', 'current server data'),
    ],
    blocks: [],
    outcomes: [item(term('cacheBoundary')), item('`Service Worker`', '`navigator.onLine`')],
    safety: [item(term('cacheBoundary'), 'DiscVault origin')],
  },
  'ios/index': {
    markers: ['SwiftData', 'iOS/iPadOS `17+`', 'WebAuthn', 'App Lock'],
    prerequisites: [
      item('iOS/iPadOS `17+`'),
      item(term('verifiedBuild')),
      item(term('cameraPermission')),
    ],
    channels: {
      beta: [item(term('noStoreClaim')), item('SwiftData', 'offline-first')],
    },
    steps: [
      step('open', ui('iosOnboarding')),
      step('create', ui('iosAdd'), 'one test title'),
      step('configure', ui('appLock')),
      step('test', term('airplaneMode'), term('localPersistence')),
    ],
    blocks: [],
    outcomes: [item(ui('iosOnboarding')), item(term('localPersistence'))],
    safety: [item(term('localLibrary'), term('noStoreClaim'))],
  },
  'ios/use-sync-limits': {
    markers: ['SwiftData', 'App Lock', '`/api/v1`', 'DiscVault'],
    prerequisites: [item('completed onboarding'), item(term('testLibrary'))],
    channels: {
      beta: [item('SwiftData', term('localPersistence')), item('`/api/v1`', term('noStoreClaim'))],
    },
    steps: [
      step('test', ui('librarySearch'), ui('iosAdd'), term('airplaneMode')),
      step('create', term('localLibrary'), term('localPersistence')),
      step('configure', ui('appLock'), ui('serverConnection')),
      step('compare', term('serverConnection'), term('syncOutcome')),
    ],
    blocks: [],
    outcomes: [item(term('localPersistence')), item(term('syncOutcome'))],
    safety: [item(term('syncOutcome'), term('localLibrary'), '`/api/v1`')],
  },
  'android/index': {
    markers: ['Room', 'Android API `26+`', 'CameraX', 'DiscVault'],
    prerequisites: [
      item('Android `8.0+` / API `26+`'),
      item(term('verifiedBuild')),
      item(term('cameraPermission')),
    ],
    channels: {
      beta: [item(term('noStoreClaim')), item('Room', 'offline-first foundation')],
    },
    steps: [
      step('open', ui('iosOnboarding'), 'Android'),
      step('create', ui('iosAdd'), 'one test title'),
      step('test', 'app restart', 'Room persistence'),
      step('test', term('airplaneMode'), term('localPersistence')),
    ],
    blocks: [],
    outcomes: [item(ui('iosOnboarding')), item('Room', term('localPersistence'))],
    safety: [item(term('localLibrary'), term('noStoreClaim'))],
  },
  'android/use-status': {
    markers: ['Room', 'CameraX', 'ML Kit', 'WorkManager'],
    prerequisites: [item(term('testLibrary')), item('network optional')],
    channels: {
      beta: [
        item('Room', term('localPersistence')),
        item('CameraX / ML Kit / WorkManager', term('verifiedBuild')),
      ],
    },
    steps: [
      step('verify', 'Room', term('localLibrary')),
      step('test', term('localPersistence'), term('airplaneMode')),
      step('inspect', 'CameraX / ML Kit', term('verifiedBuild')),
      step('inspect', 'WorkManager', term('noStoreClaim')),
    ],
    blocks: [],
    outcomes: [
      item(term('verifiedBuild'), 'Room CameraX ML Kit WorkManager'),
      item(term('localPersistence')),
    ],
    safety: [item(term('syncOutcome'), term('testLibrary'))],
  },
  'admin/index': {
    markers: ['`docker compose`', '`/api/next/jobs`', '`next-worker`', '`--tail=200`'],
    prerequisites: [
      item(term('ownerAccess')),
      item(term('matchingBackup')),
      item(term('redactedLogs')),
    ],
    channels: releaseChannels(item('same API + worker + MCP + PostgreSQL diagnostics')),
    steps: [
      step('inspect', '`/api/next/health`', 'Compose status'),
      step('inspect', term('redactedLogs'), 'failed job ID'),
      step('verify', 'latest matched backup', 'secret exposure'),
      step('preserve', 'error + timestamp + image digest', 'before retry'),
    ],
    blocks: [
      code(
        'both',
        `${composeCommand} logs --tail=200 next-api next-worker next-mcp postgres
curl --fail http://localhost:6080/api/next/jobs
curl --fail http://localhost:6080/api/next/health`,
      ),
    ],
    outcomes: [item(term('diagnosticEvidence')), item(term('matchingBackup'))],
    safety: [item(term('troubleshootingRecovery'))],
  },
  'integrations/index': {
    markers: ['MCP', 'REST', 'Plex', 'Jellyfin'],
    prerequisites: [item('HTTPS endpoint'), item('personal API key or admin session')],
    channels: releaseChannels(item('MCP, REST, plugin registry, Plex, and Jellyfin in v26')),
    steps: [
      step('choose', route('integrations/mcp-api'), 'personal key'),
      step('choose', route('integrations/plex-jellyfin'), 'provider secret'),
      step('configure', 'least permission', 'HTTPS endpoint'),
      step('revoke', 'test credential after validation'),
    ],
    blocks: [
      routes(
        ['integrations/mcp-api', 'DiscVault 26 · MCP · REST · personal key'],
        ['integrations/plex-jellyfin', 'DiscVault 26 · provider plugin'],
      ),
    ],
    outcomes: [item(term('providerCredentials')), item('HTTPS', 'MCP', 'REST', 'Plex', 'Jellyfin')],
    safety: [item(term('credentialRecovery'))],
  },
  'integrations/mcp-api': {
    markers: ['`streamable-http`', '`/mcp`', '`Authorization`', '`6090`'],
    prerequisites: [
      item('personal API key'),
      item('HTTPS DiscVault origin'),
      item('MCP streamable HTTP client'),
    ],
    channels: releaseChannels(item('`/mcp` on web origin or direct port `6090`', 'REST API')),
    steps: [
      step('create', 'personal user-scoped API key'),
      step('configure', '`streamable-http`', '`https://discvault.example.com/mcp`'),
      step('test', 'tool listing', 'owner-scoped collection'),
      step('revoke', 'test key', 'remove client secret'),
    ],
    blocks: [
      code(
        'both',
        `{
  "mcpServers": {
    "discvault": {
      "transport": "streamable-http",
      "url": "https://discvault.example.com/mcp",
      "headers": { "Authorization": "******" }
    }
  }
}`,
        'json',
      ),
      code('both', `curl --fail https://discvault.example.com/api/next/health`),
    ],
    outcomes: [
      item('DiscVault', '`streamable-http`', '`/mcp`'),
      item(term('providerCredentials'), '`Authorization`'),
    ],
    safety: [item(term('credentialRecovery'))],
  },
  'integrations/plex-jellyfin': {
    markers: ['Plex', 'Jellyfin', '`dryRun`', '`/api/next/digital-items`'],
    prerequisites: [
      item(term('providerCredentials')),
      item('reachable provider URL'),
      item(term('adminAccess')),
    ],
    channels: releaseChannels(item('DiscVault 26 digital-media-source plugins')),
    steps: [
      step('configure', ui('pluginsConfigure'), 'Plex / Jellyfin'),
      step('test', ui('pluginsHealth')),
      step('run', ui('pluginsDryRun'), '`dryRun=true`'),
      step('compare', '`/api/next/digital-items?limit=200`', 'provider library sample'),
    ],
    blocks: [
      code(
        'both',
        `curl --fail http://localhost:6080/api/next/digital-sources
curl --fail 'http://localhost:6080/api/next/digital-items?limit=200'`,
      ),
    ],
    outcomes: [
      item(ui('pluginsHealth')),
      item(ui('pluginsDryRun'), '`dryRun=true`'),
      item('Plex', 'Jellyfin', '`/api/next/digital-items`'),
    ],
    safety: [item(term('pluginRecovery')), item(term('credentialRecovery'))],
  },
  'troubleshooting/index': {
    markers: ['`docker compose`', '`/api/next/health`', '`postgres`', '`RP_ID`'],
    prerequisites: [
      item(term('selectedChannel')),
      item(term('redactedLogs')),
      item('current image digest'),
    ],
    channels: releaseChannels(item('same service names, port, endpoint, and data stores')),
    steps: [
      step('record', 'channel + image digest + timestamp'),
      step('isolate', ui('diagnosticChain')),
      step('inspect', term('redactedLogs'), 'first failing layer'),
      step('preserve', 'PostgreSQL + `/data` + app storage', 'before recovery'),
    ],
    blocks: [
      code(
        'both',
        `${composeCommand} ps
curl --fail http://localhost:6080/api/next/health
${composeCommand} logs --tail=200 next-api next-worker next-mcp postgres`,
      ),
    ],
    outcomes: [item(term('diagnosticEvidence'))],
    safety: [item(term('troubleshootingRecovery'))],
  },
  'reference/index': {
    markers: ['`:latest`', '`:beta`', '`:dev`', '`6080:5000`'],
    prerequisites: [item(term('selectedChannel'))],
    channels: releaseChannels(
      item('PostgreSQL + `/data`'),
      item('API `6080:5000` + MCP `6090:6090`'),
    ),
    steps: [
      step('inspect', 'running image digest', '`:latest` / `:beta`'),
      step('record', term('engineeringEscapeHatch'), '`:dev`'),
      step('record', 'ports + `/api/next/health` + passkey keys'),
      step('record', 'PostgreSQL + `/data`', 'matched backup method'),
    ],
    blocks: [],
    outcomes: [item(term('selectedChannel'), '`@sha256:`'), item('`:latest`', '`:beta`', '`:dev`')],
    safety: [item(term('referenceReadOnly')), item(term('engineeringEscapeHatch'), '`:dev`')],
  },
};

export const procedureTokens = { term, ui, route };
