// server.js
const WebSocket = require('ws');

// Автоматический выбор порта хостинга Render (по умолчанию 10000)
const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`Облачный WebSocket сервер запущен на порту ${PORT}`);

wss.on('connection', (ws, req) => {
    // Получаем имя пользователя из параметров подключения
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    ws.name = urlParams.get('name') || 'Аноним';

    console.log(`Пользователь [${ws.name}] вошел в чат`);

    // Рассылаем всем уведомление о входе
    broadcast({
        name: "Система",
        message: `Пользователь [${ws.name}] подключился к чату`,
        isSystem: true
    }, ws);

    ws.on('message', function incoming(message) {
        try {
            let data = JSON.parse(message);
            console.log(`[${ws.name}]: ${data.message}`);
            
            // Пересылаем сообщение всем остальным участникам
            broadcast({
                name: ws.name,
                message: data.message,
                isSystem: false
            }, ws);
        } catch (e) {
            console.error("Ошибка обработки сообщения от клиента:", e);
        }
    });

    ws.on('close', function() {
        console.log(`Пользователь [${ws.name}] покинул чат`);
        broadcast({
            name: "Система",
            message: `Пользователь [${ws.name}] отключился`,
            isSystem: true
        }, ws);
    });
});

// Функция вещания на всех клиентов
function broadcast(jsonData, senderWs) {
    wss.clients.forEach(client => {
        if (client !== senderWs && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(jsonData));
        }
    });
}
