const socket = io();

let username            = '';
let cor                 = '';
let userList            = [];
let recipientElementID  = '';
let recipientID         = '';

if (localStorage.getItem("username") !== null) {
    username = localStorage.getItem('username');
    cor      = localStorage.getItem('cor');
    socket.emit('join-request', {username, cor});
}

let loginPage = document.querySelector('#loginPage');
let chatPage  = document.querySelector('#chatPage');

let inputColr  = document.querySelector('#cor');
let loginInput = document.querySelector('#loginNameInput');
let textInput  = document.querySelector('#chatTextInput');

loginPage.style.display = 'flex';
chatPage.style.display  = 'none';

function renderUserList() {
    let ul = document.querySelector('.userList');

    ul.innerHTML = '';

    if (recipientID === '') {
        ul.innerHTML += `<li class='userSelected' onclick='selectUser(this)' data-id='' id='todos'>Todos</li>`;
    } else {
        ul.innerHTML += `<li onclick='selectUser(this)' data-id='' id='todos'>Todos</li>`;
    }     

    userList.forEach(i => {
        if (recipientID != '' && recipientID === i.id) {
            ul.innerHTML += `<li class='userSelected' onclick='selectUser(this)' data-id='${i.username}-${i.id}' id='${i.id}'>${i.username}</li>`;
        } else {
            ul.innerHTML += `<li onclick='selectUser(this)' data-id='${i.username}-${i.id}' id='${i.id}'>${i.username}</li>`;
        }
    });
}

function selectUser(obj) {
    obj.classList.add('userSelected');
    
    document.querySelector('#todos').classList.remove('userSelected');

    if (recipientElementID != '' && recipientElementID !== obj.getAttribute('data-id')) {
        let el = document.querySelector(`#${recipientID}`);
        el.classList.remove('userSelected');
    }

    recipientElementID = obj.getAttribute('data-id');

    if (obj.getAttribute('id') === 'todos') {
        recipientID = '';
    } else {
        recipientID = obj.getAttribute('id');
    }
    
    obj.classList.add('userSelected');
}

function addMessage(type, sender, msg, recipient) {
    let ul = document.querySelector('.chatList');

    switch(type) {
        case 'status': 
            ul.innerHTML += `<li class='m-status'>${msg}</li>`;
        break;
        case 'msg': 
           if (username === sender?.username) {
                if (recipient) {
                    ul.innerHTML += `<li class='m-txt'><span class='m-text-me' style='color:${sender?.cor}'>${sender?.username} (você) - fala reservadamente para <i style='color:${recipient?.cor}'>${recipient?.username}</i></span> ${msg}</li>`;
                } else {
                    ul.innerHTML += `<li class='m-txt'><span class='m-text-me' style='color:${sender?.cor}'>${sender?.username}(você) - fala: </span> ${msg}</li>`;
                }                
           } else {
               ul.innerHTML += `<li class='m-txt'><span style='color:${sender?.cor}'>${sender?.username} fala: </span> ${msg}</li>`;
           }
        break;
    }
}

loginInput.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        let name = loginInput.value.trim();
        
        if (name != '') {
            username = name;
            cor      = inputColr.value;

            localStorage.setItem('username', username);
            localStorage.setItem('cor', cor);

            document.title = `Chat (${username})`;

            socket.emit('join-request', {username, cor});
        } 
    }
});

textInput.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        let txt = textInput.value.trim();
        textInput.value = '';

        if (recipientID === '') {
            socket.emit('send-broadcast', txt);
        } else {
           socket.emit('send-message', txt, recipientID);
        }
        
    }
});

socket.on('user-ok', (list) => {
    loginPage.style.display = 'none';
    chatPage.style.display  = 'flex';

    addMessage('status', null, 'Conectado!', null);

    userList = list;
    renderUserList();
});

socket.on('list-update', (data) => {
    userList = data.list;
    renderUserList();

    if (data.joined) {
        addMessage('status', null, data.joined + ' Entrou no chat', null);
    }

    if (data.left) {
        addMessage('status', null, data.left + ' Saiu do chat', null);
    }
});

socket.on('show-msg', (data) => {
    addMessage('msg', data.sender, data.message, data?.recipient);
});

socket.on('receive-message', (data) => {
    addMessage('msg', data.sender, data.message, data.recipient);
}) 

socket.on('disconnect', () => {
    addMessage('status', null, 'Você foi desconectado', null);
});

socket.on('reconnect_error', () => {
    addMessage('status', null, 'Tentando reconectar...', null);
});

socket.on('reconnect', () => {
    addMessage('status', null, 'Reconectado!', null);

    if(username != '') {
        socket.emit('join-request', username);
    }
});
