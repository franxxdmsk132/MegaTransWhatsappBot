const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const cors = require('cors'); // <-- nuevo
const qrcode = require('qrcode');
let open; // lo dejamos vacío

(async () => {
    open = (await import('open')).default;
})();

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors()); // <-- importante

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', async qr => {
    console.log('🔵 Generando QR para escanear...');
    const qrImageUrl = await qrcode.toDataURL(qr);

    const htmlContent = `
    <html>
    <body style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;">
      <h1>Escanea este QR para conectar WhatsApp</h1>
      <img src="${qrImageUrl}" />
    </body>
    </html>
    `;

    const fs = require('fs');
    fs.writeFileSync('qr.html', htmlContent);

    setTimeout(() => {
        open('qr.html');
    }, 1000);
});

client.on('ready', async () => {
    console.log('✅ Bot de WhatsApp conectado exitosamente');

    const chats = await client.getChats();
    const grupos = chats.filter(chat => chat.isGroup);

    console.log('📋 Lista de grupos disponibles:');
    grupos.forEach(group => {
        console.log(`➡️ Nombre: ${group.name}, ID: ${group.id._serialized}`);
    });
});


client.initialize();
// Ruta para recibir solicitudes y enviar mensajes
app.post('/enviar-grupo', async (req, res) => {
    const { grupoId, mensaje } = req.body;

    if (!grupoId || !mensaje) {
        return res.status(400).send('Faltan datos');
    }

    try {
        await client.sendMessage(grupoId, mensaje);
        res.send('📩 Mensaje enviado correctamente al grupo');
    } catch (error) {
        console.error('Error al enviar mensaje al grupo', error);
        res.status(500).send('Error al enviar mensaje al grupo');
    }
});

// Levantar servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
