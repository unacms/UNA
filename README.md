<a href="https://unacms.com"><img width="300" alt="UNA Platform" src="https://github.com/user-attachments/assets/ef5c2250-e172-4b12-8948-f1084643bc55"></a>

## Unified Networking Applications

[![Official Website](https://img.shields.io/badge/website-unacms.com-blue.svg?style=for-the-badge)](https://unacms.com)
[![GitHub license](https://img.shields.io/github/license/unacms/UNA?style=for-the-badge)](https://github.com/unacms/UNA/blob/master/license.txt)
[![Releases](https://img.shields.io/github/downloads/unacms/UNA/total.svg?style=for-the-badge)](https://github.com/unacms/UNA/releases)
[![GitHub forks](https://img.shields.io/github/forks/unacms/UNA?style=for-the-badge)](https://github.com/unacms/UNA/forks)

UNA is a **Community** Management System. The core platform is a full-stack framework for independent community websites and apps. With UNA content management, collaboration, e-commerce, learning management, and social networking, you can build any online project you have in mind.

![screenshot](https://user-images.githubusercontent.com/22210428/186073113-8f82f8f2-fd5a-4dbb-8328-e0ca847809b9.png)

## Table of Contents

- [Key Features](#key-features)
- [Documentation](#documentation)
- [Download](#download)
- [Support & Development](#support--development)
- [Setup Development Environment](#setup-development-environment)
- [NEO web and mobile apps](#neo-web-and-mobile-apps)
- [License](#license)

## Key Features

- **Unlimited Scalability**: Hundreds, thousands, or millions - get as many users as your hosting can handle. UNA won't limit you.
- **Absolute Control**: You own the data, you set the rules, you lead the community. We give you the tools and support.
- **Permissive License**: MIT - the license allowing unrestricted commercial and private use, distribution, and modification.
- **Continuous Improvement**: Regular security, performance, and feature updates for the core platform, apps, and integrations.
- **Collective Innovation**: Improvements and revisions initiated and co-funded by the platform users community.
- **Integrations-Friendly**: Integrate 3rd-party services as UNA apps or use UNA REST API to talk to your external apps.
- **Secure-By-Design**: Full-site SSL encryption, SPD development, regular service updates, and vulnerability audits.
- **Compliance Readiness**: We offer HIPAA, GDPR, CCPA (and any other regulations) compliance preparation service.

## Documentation

To install and run the UNA platform, you'll need a web-hosting server or you can use [UNA Cloud hosting](https://unacms.com/start) for an instant launch.

- [UNACMS.COM - Official Website](https://unacms.com)
- [Documentation](https://unacms.com/wiki/Introduction)
- [Discussions](https://unacms.com/page/discussions-home)
- [Contact Team](https://unacms.com/page/contact)
- [Installation](https://unacms.com/wiki/Installation)

## Download

You can [download](https://github.com/unacms/UNA/archive/refs/heads/master.zip) the latest installable version of UNA Core and install it on your server. You will need to [create an UNACMS.COM account](https://unacms.com) to access all features.

## Support & Development

UNA is managed by [Yasko.Studio](https://yasko.studio) team and developed with the help of [UNA Community](https://unacms.com).

- Free community support - [Discussions](https://unacms.com/page/discussions-home)
- Direct support and professional services - [UNA Pro](https://unacms.com/start)

## Setup Development Environment

The repository runs UNA locally with Docker Compose: nginx, PHP-FPM 8.3, a cron container, MariaDB, phpMyAdmin, Mailpit (catches all outgoing email) and the Jot sockets server.

This setup is for development only. It uses fixed passwords (`root`/`root`, `una`/`una`), plain HTTP and debug-friendly settings. To run a live site, follow the [installation guide](https://unacms.com/wiki/Installation) on a server you secure yourself, or use [UNA Cloud](https://unacms.com/start).

### Requirements

- Docker with Docker Compose v2 (Docker Desktop, OrbStack, Colima, Podman with `docker compose`, or another compatible engine).
- Node.js 24 and Yarn 1.22, to build the JavaScript libraries.
- About 5 GB of free disk space: the checkout with its JavaScript and PHP dependencies takes about 3 GB, the Docker images and the database about 1.5 GB more.
- Git.

### Install

Clone the repository and go to its folder:

```bash
git clone https://github.com/unacms/UNA.git una
```

```bash
cd una
```

Install the JavaScript dependencies. This also builds `plugins_public/` and takes about 2 minutes:

```bash
yarn
```

Install the PHP dependencies into `plugins/`:

```bash
docker run --rm -v "$(pwd):/app" composer/composer:2 install --ignore-platform-reqs
```

Start UNA and the other services:

```bash
docker compose up -d
```

The first start builds the PHP and cron images from source, which takes 5 to 15 minutes (about 14 minutes on an Apple Silicon Mac). Later starts take seconds.

Open http://localhost in your browser and follow the installer. On the database step enter:

| Field | Value |
|---|---|
| Database host name | `mysql` |
| Database name | `una` |
| Database user | `una` |
| Database password | `una` |

The installer preselects the starter apps; add or remove apps there, or later in Studio. It then installs them in batches and shows its progress, which takes about 3 minutes. Keep the page open until it reaches the finish page.

### Other port, more than one copy

Port 80 is often taken (by another web server or your Docker app). Create a `.env` file next to `docker-compose.yml`:

```env
UNA_PORT=8200
```

Run `docker compose up -d` again and open http://localhost:8200. Install UNA at the address you will use: the installer saves it as the site URL. Any host name that points to `127.0.0.1` works the same way, for example `http://una.localhost:8200`.

All settings for `.env`:

| Variable | Default | What it does |
|---|---|---|
| `UNA_PORT` | `80` | Site port. Nginx listens on the same port inside the container, so UNA can reach its own URL from PHP (image transcoding needs this). |
| `PMA_PORT` | `8080` | phpMyAdmin |
| `MAILPIT_PORT` | `8025` | Mailpit |
| `MYSQL_PORT` | `3306` | MariaDB, for a database client on your computer |
| `JOT_PORT` | `5555` | Jot sockets server |
| `PHP_DISPLAY_ERRORS` | `0` | `1` prints PHP errors in pages. Errors are always in `docker compose logs php`. |
| `XDEBUG_MODE` | `off` | `debug` turns Xdebug on, see below |
| `COMPOSE_PROJECT_NAME` | folder name | Set a different one to run a second copy of UNA side by side, with different ports |

Run `docker compose up -d` after you change `.env`.

phpMyAdmin, Mailpit, MariaDB and Jot listen on `127.0.0.1` only. The site port listens on all network interfaces.

The older address `http://localhost.una.io` still works on port 80: it is a public DNS name that points to `127.0.0.1`, so it needs an internet connection.

### After the installer

The finish page lists three next steps. In this setup:

- **Crontab line:** skip it. Cron already runs every minute in the `cron` container; anything UNA's cron prints shows in `docker compose logs -f cron`.
- **Remove the `install` folder:** do it, from the repository folder: `rm -rf install`. Until then, every page of the site sends you to a page that asks you to remove it.
- **Go to Studio:** you are already signed in as the administrator you created. Studio is at http://localhost/studio/ (with your port, if you set `UNA_PORT`), where you add apps and change settings.

`install` is part of the repository, so in a git checkout `git status` lists its files as deleted. Don't commit that deletion. `git checkout install` brings the folder back when you need the installer again, for example after a reset (see below).

Other local services:

- Emails go to Mailpit: http://localhost:8025.
- Database: phpMyAdmin at http://localhost:8080 signs you in as MySQL `root` (password `root`).

### Everyday commands

| Command | What it does |
|---|---|
| `docker compose up -d` | Start, or apply changes to `docker-compose.yml` and `.env` |
| `docker compose stop` | Stop, keeping all data |
| `docker compose logs -f php` | PHP errors and the PHP-FPM log |
| `docker compose exec php bash` | Shell in the PHP container. The site is in `/opt/una`. |
| `docker compose build --pull` | Rebuild the PHP images, for example after a change to `scripts/docker-compose/*.Dockerfile` |
| `docker compose down -v` | Reset: delete the containers and the database. Then delete `inc/header.inc.php`, restore the `install` folder and run the installer again. Uploaded files in `storage/` stay. |

### Debugging with Xdebug

Set `XDEBUG_MODE=debug` in `.env` and run `docker compose up -d`. Xdebug starts a session for requests that carry the `XDEBUG_TRIGGER` cookie or query parameter (a browser extension such as Xdebug Helper sets it). Visual Studio Code users have a ready launch configuration in `.vscode/launch.json` that listens on port 9003.

## NEO web and mobile apps

NEO is UNA's Next.js web client and its Expo app for iOS and Android. It lives in the [`neo/`](neo/) folder. `docker compose` starts only UNA, not NEO: run NEO on your computer with Node.js against the local UNA.

1. Install UNA as above, then in Studio → API:
   - Settings: turn on **Enable API**, **Allow access by origin** and **Allow access with API key**.
   - Keys: add a key.
   - Origins: add `http://localhost:3000` (the NEO web address).
2. In `neo/`, run `yarn` and create `neo/.env.local`:

   ```env
   UNA_URL=http://localhost
   NEXT_PUBLIC_UNA_URL=http://localhost
   UNA_API_KEY=the-key-from-studio
   APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEO_IMAGES_ALLOW_LOCAL_IP=1
   ```

   Use your UNA address, with the port if you set `UNA_PORT`.
3. Start the web app with `yarn web2` in `neo/` and open http://localhost:3000. It runs the Next.js dev server with the variables from `neo/.env.local`. For another port, run `yarn web2 -p 3001` and use that address in `APP_URL`, `NEXT_PUBLIC_APP_URL` and the Studio origin. (`yarn web` is the same server behind the `portless` proxy, which you would have to install separately.)

For the native apps, other variables, deployment and the rules for changing NEO, see [`neo/README.md`](neo/README.md) and [`neo/AGENTS.md`](neo/AGENTS.md).

## License

MIT

---

> UNACMS on X [@unacms](https://twitter.com/unacms)

---

This project is tested with BrowserStack.
