FROM nginx:alpine

# Копируем все файлы
COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY script.js /usr/share/nginx/html/script.js
COPY remanga-extension.user.js /usr/share/nginx/html/remanga-extension.user.js

# Настройка nginx
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ =404; \
    } \
    \
    location ~ \.user\.js$ { \
        add_header Content-Type "text/javascript; charset=utf-8"; \
        add_header Cache-Control "no-cache, must-revalidate"; \
        add_header Access-Control-Allow-Origin "*"; \
    } \
    \
    location ~ \.(css|js)$ { \
        add_header Cache-Control "public, max-age=3600"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
