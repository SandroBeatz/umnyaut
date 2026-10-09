#!/usr/bin/env bash
# One-time provisioning of a fresh Ubuntu LTS VPS. Run as root:
#   DEPLOY_SSH_KEY="$(cat gha.pub owner.pub)" bash bootstrap.sh
# DEPLOY_SSH_KEY holds one or more public keys (one per line): the GitHub Actions key and the owner's.
# Creates the `deploy` user (SSH key only), root login by key only, firewall 22/80/443, a swap file,
# unattended security upgrades with a night reboot window, Docker Engine + Compose, and /srv/umnyaut.
# Put your own key into root's authorized_keys first (ssh-copy-id), or you lock yourself out of root.
set -euo pipefail

: "${DEPLOY_SSH_KEY:?set DEPLOY_SSH_KEY to the public keys of GitHub Actions and the owner}"
DEPLOY_USER=${DEPLOY_USER:-deploy}
APP_DIR=/srv/umnyaut
SWAP_SIZE=${SWAP_SIZE:-2G}

[[ $(id -u) -eq 0 ]] || { echo "run as root" >&2; exit 1; }
[[ -s /root/.ssh/authorized_keys ]] || { echo "add your key to /root/.ssh/authorized_keys first (ssh-copy-id)" >&2; exit 1; }
export DEBIAN_FRONTEND=noninteractive

echo "== packages"
apt-get update -q
apt-get upgrade -yq
apt-get install -yq ca-certificates curl gnupg ufw unattended-upgrades fail2ban

echo "== deploy user"
id "$DEPLOY_USER" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
touch "/home/$DEPLOY_USER/.ssh/authorized_keys"
while IFS= read -r key; do
  [[ -n $key ]] || continue
  grep -qxF "$key" "/home/$DEPLOY_USER/.ssh/authorized_keys" ||
    echo "$key" >>"/home/$DEPLOY_USER/.ssh/authorized_keys"
done <<<"$DEPLOY_SSH_KEY"
chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"

echo "== sshd: keys only, root by key only"
cat >/etc/ssh/sshd_config.d/10-umnyaut.conf <<'CONF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
CONF
sshd -t
systemctl reload ssh || systemctl reload sshd

echo "== firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

echo "== swap ($SWAP_SIZE): headroom while two app slots overlap during a deploy"
if ! swapon --show | grep -q .; then
  fallocate -l "$SWAP_SIZE" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
  echo 'vm.swappiness=10' >/etc/sysctl.d/60-umnyaut-swap.conf
  sysctl -q -p /etc/sysctl.d/60-umnyaut-swap.conf
fi

echo "== unattended security upgrades, reboot window 03:30"
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'CONF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
CONF
cat >/etc/apt/apt.conf.d/52umnyaut-unattended <<'CONF'
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "03:30";
CONF

echo "== Docker Engine + Compose plugin"
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  # shellcheck source=/dev/null
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    >/etc/apt/sources.list.d/docker.list
  apt-get update -q
  apt-get install -yq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
cat >/etc/docker/daemon.json <<'CONF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "7" },
  "live-restore": true
}
CONF
systemctl enable --now docker
systemctl restart docker
usermod -aG docker "$DEPLOY_USER"
# Note: Docker publishes ports through its own iptables chains, bypassing ufw. Only Caddy publishes ports.

echo "== app directory"
install -d -m 750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR" "$APP_DIR/state"

cat <<DONE

Bootstrap finished. Next, as $DEPLOY_USER in $APP_DIR:
  1. create .env      (DOMAIN, ACME_EMAIL)            — see infra/server.env.example
  2. create web.env   (APP_ENV=production + secrets)  — see .env.example; chmod 600
  3. the first deploy comes from GitHub Actions (deploy.yml) or: ./deploy.sh deploy <tag>
DONE
