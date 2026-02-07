const socket = io('http://localhost:4835', {
  query: { discordId: '1370487803648934080' },
});

// const socket = io(import.meta.env.VITE_WS_URL, {
//   auth: { token: localStorage.getItem('access_token') },
// });

const chatDiv = document.getElementById('chat');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

// Messaging
sendBtn.onclick = () => {
  const text = messageInput.value;
  if (!text) return;
  socket.emit('message:send', {
    sender: '1370487803648934080',
    reciever: '496721669168037889',
    text: text,
    status: 'sent',
  });
  addChat('Me: ' + text);
  messageInput.value = '';
};

socket.on('message:new', (msg) => {
  console.log(msg.text);
  addChat(msg.sender.username + ': ' + msg.text);
});

function addChat(text) {
  const p = document.createElement('p');
  p.textContent = text;
  chatDiv.appendChild(p);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// ---- WebRTC Part ----
const startCallBtn = document.getElementById('startCallBtn');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let pc;
let localStream;

async function initPeerConnection() {
  pc = new RTCPeerConnection();
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit('webrtc_ice_candidate', {
        to: 'otherUserId',
        candidate: e.candidate,
      });
    }
  };
  pc.ontrack = (e) => {
    remoteVideo.srcObject = e.streams[0];
  };
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
  localVideo.srcObject = localStream;
}

startCallBtn.onclick = async () => {
  await initPeerConnection();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('webrtc_offer', { to: 'otherUserId', sdp: offer });
};

socket.on('call:offer', async (data) => {
  await initPeerConnection();
  await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('webrtc_answer', { to: data.from, sdp: answer });
});

socket.on('webrtc_answer', async (data) => {
  await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
});

socket.on('webrtc_ice_candidate', async (data) => {
  try {
    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
  } catch (err) {
    console.error('Error adding ICE candidate', err);
  }
});
