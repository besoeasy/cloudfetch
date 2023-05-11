#!/bin/bash

# Function to check if command exists
command_exists() {
  command -v "$@" > /dev/null 2>&1
}

# Function to install dependencies for different distros
install_dependencies() {
  case $1 in
    debian|ubuntu)
      sudo apt-get update
      sudo apt-get install -y curl aria2
      ;;
    fedora)
      sudo dnf update
      sudo dnf install -y curl aria2
      ;;
    centos|rhel)
      sudo yum update
      sudo yum install -y curl aria2
      ;;
    opensuse)
      sudo zypper update
      sudo zypper install -y curl aria2
      ;;
    arch)
      sudo pacman -Syu
      sudo pacman -S --noconfirm curl aria2
      ;;
    *)
      echo "Unsupported distribution. Exiting."
      exit 1
      ;;
  esac
}

# Detect distribution
if [ -f /etc/os-release ]; then
  . /etc/os-release
  distro=$ID
else
  echo "Unable to detect distribution. Exiting."
  exit 1
fi

# Install dependencies
install_dependencies $distro

# Check if Node.js is already installed
if ! command_exists node; then

    # Node.js not found, so install it
    echo "Node.js not found, installing..."

    # Install Node.js using the official package manager
    case $distro in
      debian|ubuntu)
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
        ;;
      fedora)
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo dnf install -y nodejs
        ;;
      centos|rhel)
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo yum install -y nodejs
        ;;
      opensuse)
        sudo rpm --import https://github.com/nodesource/distributions/raw/master/RPM-GPG-KEY.nodesource
        sudo zypper addrepo --gpgcheck --refresh https://rpm.nodesource.com/pub_18.x/sles/15/nodesource.repo
        sudo zypper install -y nodejs
        ;;
      arch)
        sudo pacman -S --noconfirm nodejs npm
        ;;
      *)
        echo "Unsupported distribution. Exiting."
        exit 1
        ;;
    esac
else
    # Node.js already installed, print message
    echo "Node.js already installed."
fi

# Install cloudfetch using npm
sudo npm install -g cloudfetch

# Confirm successful installation
echo "Installation complete."

# Prompt user for TELEGRAMBOT variable with regex check
while true; do
  read -p "Please enter your Telegram bot token: " TELEGRAMBOT
  if [[ $TELEGRAMBOT =~ ^[0-9]{9,10}:[A-Za-z0-9_-]{35}$ ]]; then
    break
  else
    echo "Invalid Telegram bot token. Please try again."
  fi
done

# Set TELEGRAMBOT as an environment variable
echo "export TELEGRAMBOT=$TELEGRAMBOT" >> ~/.bashrc && source ~/.bashrc
source ~/.bashrc

echo "Telegram bot token Set !"


# Create a systemd service file to run cloudfetch on boot
cat > cloudfetch.service << EOL
[Unit]
Description=Cloud Download Manager
After=network.target

[Service]
Environment=TELEGRAMBOT=${TELEGRAMBOT}
ExecStart=/usr/bin/env cloudfetch
Restart=always
User=${USER}

[Install]
WantedBy=multi-user.target
EOL

# Move the service file to systemd system directory
sudo mv cloudfetch.service /etc/systemd/system/

# Reload systemd daemon and enable cloudfetch service
sudo systemctl daemon-reload
sudo systemctl enable cloudfetch.service

# Start the cloudfetch service
sudo systemctl start cloudfetch.service

# Confirm that the cloudfetch service is running
echo "Checking the status of cloudfetch service:"
sudo systemctl status cloudfetch.service