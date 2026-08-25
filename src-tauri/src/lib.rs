mod flow;
mod handler;
mod llm;
mod process;

use tauri::{Emitter, Manager};

#[derive(Clone, serde::Serialize)]
struct SingleInstancePayload {
    args: Vec<String>,
    cwd: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            let _ = app.emit("single-instance", SingleInstancePayload { args: argv, cwd });
            if let Some(window) = app.get_webview_window("liesel") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_log::Builder::default().build());

    let process_builder = process::start_up(builder);

    process_builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
