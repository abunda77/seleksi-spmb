# Panduan Deployment untuk Mengatasi CORS

## Masalah CORS

Aplikasi ini menggunakan API eksternal (`https://api.spmb.id`) yang tidak mengizinkan CORS dari domain lain. Untuk mengatasi masalah ini, diperlukan setup proxy di server production.

## Solusi yang Diterapkan

### 1. Development (Localhost)
- Proxy sudah dikonfigurasi di `vite.config.ts`
- Request `/api/*` akan di-proxy ke `https://api.spmb.id/*`
- Tidak perlu konfigurasi tambahan untuk development

### 2. Production (Server)
Untuk production, perlu setup proxy di web server (Nginx/Apache).

## Setup Production

### A. Menggunakan Nginx

1. **Edit konfigurasi Nginx** (biasanya di `/etc/nginx/sites-available/your-site`):

```nginx
server {
    listen 80;
    server_name seleksi-spmb.produkmastah.com;
    
    # Serve static files
    location / {
        root /path/to/your/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy untuk API SPMB
    location /api/ {
        proxy_pass https://api.spmb.id/;
        proxy_set_header Host api.spmb.id;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
    }
    
    # Proxy untuk data seleksi
    location /seleksi/ {
        proxy_pass https://bantulkab.spmb.id/seleksi/;
        proxy_set_header Host bantulkab.spmb.id;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

2. **Test konfigurasi dan restart Nginx**:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### B. Menggunakan Apache

1. **Enable required modules**:
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod rewrite
```

2. **Edit VirtualHost** (biasanya di `/etc/apache2/sites-available/your-site.conf`):

```apache
<VirtualHost *:80>
    ServerName seleksi-spmb.produkmastah.com
    DocumentRoot /path/to/your/dist
    
    # Serve static files
    <Directory "/path/to/your/dist">
        AllowOverride All
        Require all granted
        
        # Handle React Router
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Proxy untuk API SPMB
    ProxyPreserveHost Off
    ProxyPass /api/ https://api.spmb.id/
    ProxyPassReverse /api/ https://api.spmb.id/
    
    # CORS headers untuk API
    <Location "/api/">
        Header always set Access-Control-Allow-Origin "*"
        Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Header always set Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range"
    </Location>
    
    # Proxy untuk data seleksi
    ProxyPass /seleksi/ https://bantulkab.spmb.id/seleksi/
    ProxyPassReverse /seleksi/ https://bantulkab.spmb.id/seleksi/
</VirtualHost>
```

3. **Restart Apache**:
```bash
sudo systemctl restart apache2
```

## Build dan Deploy

1. **Build aplikasi**:
```bash
npm run build
```

2. **Upload folder `dist` ke server** (ke path yang dikonfigurasi di web server)

3. **Test aplikasi** di browser dengan domain production

## Troubleshooting

### Jika masih ada error CORS:
1. Pastikan proxy dikonfigurasi dengan benar
2. Check log web server untuk error
3. Test endpoint proxy secara manual:
   ```bash
   curl https://seleksi-spmb.produkmastah.com/api/cari?no_daftar=test
   ```

### Jika data tidak muncul:
1. Check console browser untuk error
2. Check network tab di developer tools
3. Pastikan API endpoint dapat diakses

## Catatan Penting

- Proxy hanya diperlukan untuk production
- Development menggunakan proxy Vite yang sudah dikonfigurasi
- Pastikan SSL certificate dikonfigurasi jika menggunakan HTTPS
- Monitor log server untuk memastikan proxy bekerja dengan baik
