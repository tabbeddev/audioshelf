# AudioShelf

The Jellyfin equivalent, but for music and audiobooks

## Installation

### Requirements

- Linux (everything else may work, but is untested and unsupported)
- Docker
- Docker Compose

### Step 1 - Create a directory to hold your files

```bash
mkdir ./audioshelf-server
cd ./audioshelf-server
```

### Step 2 - Download the required files from this GitHub Repo

```bash
# Download the docker compose file
wget -O docker-compose.yml https://github.com/tabbeddev/audioshelf/raw/refs/heads/main/prod.docker-compose.yml

# Download the example .env file
wget -O .env https://github.com/tabbeddev/audioshelf/raw/refs/heads/main/.env.example-prod
```

### Step 3 - Populate the .env file with your custom values

Open the `.env`-file with your favorite text editor and change all values to the right values.

### Step 4 - Start the container

```
docker compose up -d
```

### And now?

The server will listen on your host name on your post number.  
So the URL to your server will be this one:

`http(s)://<HOST-NAME>:<PORT-NUMBER>`

Then the first time setup will start.

## Install as an App

**This will not work on firefox, as firefox doesn't support PWAs**

First check on the user select screen if you see a message saying "You're not ready for offline use".

If you **do**, follow the [FAQ guide](#q-im-not-set-up-for-offline-use-what-do-i-need-to-do).  
If you **don't**, just continue.

1. Open the website of your AudioShelf-Instance
2. Click the Install Icon either in the URL bar (desktop) or in the three-dots-menu (mobile).
3. Click Install

## FAQ

### Q: I'm not set up for offline use. What do I need to do?

**A:** Enable the flag "Insecure origins treated as secure"
(or set up HTTPS with a valid non-self-signed certificate)

#### Chrome-based browsers

1. Go to the url `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. Go to the user selection screen of AudioShelf
3. Copy the url and paste it into the box
4. Enable the flag
5. Restart your browser

#### Firefox

Sorry, but a feature like that is currently not supported. (https://bugzilla.mozilla.org/show_bug.cgi?id=1410365)
