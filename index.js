console.log('🧠 ESTE ES EL ARCHIVO CORRECTO (index.js)');

const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const cors = require('cors');
const qrcode = require('qrcode');
let open;

(async () => {
    open = (await import('open')).default;
})();

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

console.log('🛠️ Configurando cliente de WhatsApp...');

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
        console.log('🌐 Abriendo QR en el navegador...');
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

client.on('message', async msg => {
    console.log(`📨 Mensaje recibido desde ${msg.from}: ${msg.body}`);

    const fromGroupId = '120363399820920449@g.us';

    if (msg.from === fromGroupId) {
        const texto = msg.body;

        const matchEncomienda = texto.match(/EM\d{5,}/);
        const matchTransporte = texto.match(/TM\d{5,}/);

        if (matchEncomienda) {
            const numGuia = matchEncomienda[0];
            const telefono = encomiendas[numGuia];
            console.log(`🔍 Buscando encomienda ${numGuia}, Tel: ${telefono}`);

            if (telefono) {
                try {
                    let telefonoFormateado = telefono;
                    if (telefono.startsWith('0')) {
                        telefonoFormateado = '593' + telefono.slice(1);
                    }
                    await client.sendMessage(`${telefonoFormateado}@c.us`, `💬 Respuesta del grupo: ${texto}`);
                    console.log(`📤 Reenviado al cliente ${telefono} por guía ${numGuia}`);
                } catch (err) {
                    console.error(`❌ Error al enviar mensaje a ${telefono}`, err);
                }
            } else {
                console.log(`❗ Guía ${numGuia} no registrada, no se reenvió`);
            }
        } else if (matchTransporte) {
            const numOrden = matchTransporte[0];
            const telefono = transportes[numOrden];
            console.log(`🔍 Buscando transporte ${numOrden}, Tel: ${telefono}`);

            if (telefono) {
                try {
                    await client.sendMessage(`${telefono}@c.us`, `💬 Respuesta del grupo: ${texto}`);
                    console.log(`📤 Reenviado al cliente ${telefono} por orden ${numOrden}`);
                } catch (err) {
                    console.error(`❌ Error al enviar mensaje a ${telefono}`, err);
                }
            } else {
                console.log(`❗ Orden ${numOrden} no registrada, no se reenvió`);
            }
        } else {
            console.log('🟡 No se detectó ningún código EM o TM en el mensaje');
        }
    }
});

client.initialize();

app.post('/enviar-grupo', async (req, res) => {
    const { grupoId, mensaje } = req.body;
    console.log('📥 POST /enviar-grupo recibido');
    console.log('➡️ Datos recibidos:', req.body);

    if (!grupoId || !mensaje) {
        console.log('⚠️ Faltan datos: grupoId o mensaje');
        return res.status(400).send('Faltan datos');
    }

    try {
        await client.sendMessage(grupoId, mensaje);
        console.log(`📩 Mensaje enviado al grupo ${grupoId}`);
        res.send('📩 Mensaje enviado correctamente al grupo');
    } catch (error) {
        console.error('❌ Error al enviar mensaje al grupo', error);
        res.status(500).send('Error al enviar mensaje al grupo');
    }
});

const encomiendas = {};
app.post('/registrar-encomienda', (req, res) => {
    console.log('📥 POST /registrar-encomienda recibido');
    console.log('➡️ Datos:', req.body);

    const { numGuia, telefono } = req.body;

    if (!numGuia || !telefono) {
        console.log('⚠️ Faltan datos para registrar encomienda');
        return res.status(400).send('Faltan datos');
    }

    encomiendas[numGuia] = telefono;
    console.log(`📌 Encomienda registrada: ${numGuia} => ${telefono}`);
    res.send('✅ Encomienda registrada correctamente');
});

const transportes = {};
app.post('/registrar-transporte', (req, res) => {
    console.log('📥 POST /registrar-transporte recibido');
    console.log('➡️ Datos:', req.body);

    const { numOrden, telefono } = req.body;

    if (!numOrden || !telefono) {
        console.log('⚠️ Faltan datos para registrar transporte');
        return res.status(400).send('Faltan datos');
    }

    transportes[numOrden] = telefono;
    console.log(`📌 Transporte registrado: ${numOrden} => ${telefono}`);
    res.send('✅ Transporte registrado correctamente');
});

app.listen(port, () => {
    console.log(`🟢 Servidor escuchando en http://localhost:${port}`);
});
