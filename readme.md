## needed sudo rules for whatever user is running the node process

`node ALL=(ALL) NOPASSWD: /usr/sbin/ufw allow 80, /usr/sbin/ufw deny 80, /usr/sbin/ufw allow 443, /usr/sbin/ufw deny 443`