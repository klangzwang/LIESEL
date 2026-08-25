use tauri_plugin_opener::OpenerExt;

const BUYMEACOFFEE_URL: &str = "https://www.buymeacoffee.com/valeart";

#[tauri::command]
pub fn open_buymeacoffee(app: tauri::AppHandle) -> Result<(), String> {
    app.opener()
        .open_url(BUYMEACOFFEE_URL, None::<&str>)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn close_app(app: tauri::AppHandle) {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let _ = std::process::Command::new("taskkill")
            .args(["/F", "/IM", "llama-server.exe", "/T"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
    }
    app.exit(0);
}

#[tauri::command]
pub fn print_to_console(text: String) {
    println!("CONSOLE: {}", text);
}
