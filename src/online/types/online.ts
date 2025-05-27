export interface OnlinePlayer {
  id: string;
  name: string;
  is_connected: boolean;
  last_seen: string;
  is_host: boolean;
  player_order?: number;
}

export interface OnlineRoom {
  id: string;
  code: string;
  host_id: string;
  settings: any;
  status: 'waiting' | 'playing' | 'finished';
  created_at: string;
  max_players: number;
}

export interface RoomWithPlayers {
  room: OnlineRoom;
  players: OnlinePlayer[];
}