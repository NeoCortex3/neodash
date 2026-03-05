<b>NeoDash</b><br>
Homeserver Dashboard das einfach funktioniert.<br>
<br>
<img width="1157" height="519" alt="grafik" src="https://github.com/user-attachments/assets/8508d627-bc42-4637-a256-e0ee3f9eb6ef" /><br>
<br>
<img width="448" height="778" alt="grafik" src="https://github.com/user-attachments/assets/e12ce086-6d95-45e7-bf83-f2b35f1ee5b9" />
<br>
<br>
<b>Schnellstart</b><br>
Docker Compose:<br>
<pre>
services:
  neodash:
    image: neodash:latest
    container_name: neodash
    ports:
      - "9020:3000"
    volumes:
      - data:/app/data #einstellungen
      - uploads:/app/public/uploads #uploads hintergrund, icons
    restart: unless-stopped

volumes:
  data:
  uploads:
  </pre>

Gemacht mit <img width="12" height="12" alt="grafik" src="https://github.com/user-attachments/assets/f54c7386-2c3b-4cc8-a3fb-89f12599d3cb" /> von Neo und Claude.ai
