#!/bin/bash

# Update
sudo apt-get update

# Install Node.js 18.x, npm, aria2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs aria2

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
echo "export TELEGRAMBOT=$TELEGRAMBOT" >> ~/.bashrc

# Reload the shell environment
source ~/.bashrc

# Install cloudfetch globally
sudo npm install -g cloudfetch

# Create cloudfetch systemd service
sudo tee /etc/systemd/system/cloudfetch.service <<EOF
[Unit]
Description=Cloudfetch Service
After=network.target

[Service]
ExecStart=/usr/bin/env cloudfetch
Restart=always
Environment="TELEGRAMBOT=$TELEGRAMBOT"

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd daemon and enable cloudfetch service
sudo systemctl daemon-reload
sudo systemctl enable cloudfetch.service

echo "Cloudfetch installation and service setup complete!"
