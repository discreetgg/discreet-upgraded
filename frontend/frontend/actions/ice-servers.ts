'use server';

export async function getIceServersConfig(): Promise<RTCConfiguration> {
  return {
    iceServers: [
      {
        urls: [
          'turn:212.28.187.85:6005?transport=udp',
          'turn:212.28.187.85:6005?transport=tcp',
        ],
        username: process.env.TURN_SERVER_USERNAME || 'webrtc',
        credential: process.env.TURN_SERVER_CREDENTIAL || '',
      },
    ],
  };
}
