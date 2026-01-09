#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::State;
use serde::Serialize;

#[derive(Serialize, Clone)] // Добавляем Serialize для автоматической отправки в JS
struct GameState {
    board: [char; 9],
    current_player: char,
    game_over: bool,
    winner: Option<char>,
}

impl Default for GameState {
    fn default() -> Self {
        GameState {
            board: [' '; 9],
            current_player: 'X',
            game_over: false,
            winner: None,
        }
    }
}

#[tauri::command]
fn make_move(position: usize, state: State<Mutex<GameState>>) -> Result<GameState, String> {
    let mut game = state.lock().unwrap();
    
    if game.game_over { return Err("Игра завершена".into()); }
    if position >= 9 || game.board[position] != ' ' { return Err("Неверный ход".into()); }
    
    game.board[position] = game.current_player;
    
    if let Some(w) = check_winner(&game.board) {
        game.winner = Some(w);
        game.game_over = true;
    } else if !game.board.contains(&' ') {
        game.winner = Some('D');
        game.game_over = true;
    } else {
        game.current_player = if game.current_player == 'X' { 'O' } else { 'X' };
    }
    
    Ok(game.clone())
}

#[tauri::command]
fn get_game_state(state: State<Mutex<GameState>>) -> GameState {
    state.lock().unwrap().clone()
}

#[tauri::command]
fn reset_game(state: State<Mutex<GameState>>) -> GameState {
    let mut game = state.lock().unwrap();
    *game = GameState::default();
    game.clone()
}

fn check_winner(b: &[char; 9]) -> Option<char> {
    let wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for c in wins {
        if b[c[0]] != ' ' && b[c[0]] == b[c[1]] && b[c[1]] == b[c[2]] {
            return Some(b[c[0]]);
        }
    }
    None
}

fn main() {
    tauri::Builder::default()
        .manage(Mutex::new(GameState::default()))
        .invoke_handler(tauri::generate_handler![make_move, reset_game, get_game_state])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}