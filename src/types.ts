export interface TileData {
  id: string;
  char: string;
  x: number;
  y: number;
  isPlaced: boolean;
  initialized: boolean;
  groupId?: string; // どのグループに属しているか（未所属は undefined）
}

export interface AppState {
  tiles: TileData[];
}