use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::{Builder, Manager, WebviewUrl, WebviewWindowBuilder, Wry};

pub fn open_tray_icon(app: &tauri::AppHandle) {
    let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>).unwrap();
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>).unwrap();
    let menu = Menu::with_items(app, &[&show, &quit]).unwrap();

    TrayIconBuilder::with_id("tray")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("")
        .icon(app.default_window_icon().unwrap().clone())
        .on_menu_event(|app, event| {
            if event.id == "show" {
                if let Some(window) = app.get_webview_window("editor") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            } else if event.id == "quit" {
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
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: tauri::tray::MouseButton::Left,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("editor") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)
        .expect("Failed to build tray icon");
}

pub fn open_window(app: &tauri::AppHandle) {
    let editor_builder =
        WebviewWindowBuilder::new(app, "editor", WebviewUrl::App("editor.html".into()))
            .title("Liesel")
            .inner_size(1280.0, 720.0)
            .min_inner_size(1280.0, 720.0)
            .center()
            .visible(true)
            .skip_taskbar(false)
            .decorations(false)
            .transparent(false)
            .resizable(true)
            .always_on_top(false)
            .disable_drag_drop_handler()
            .shadow(true);

    editor_builder.build().expect("Failed to build window");
}

pub fn start_up(builder: Builder<Wry>) -> Builder<Wry> {
    builder
        .invoke_handler(tauri::generate_handler![
            crate::handler::open_buymeacoffee,
            crate::handler::close_app,
            crate::handler::print_to_console,
            crate::llm::llm_check_model,
            crate::llm::llm_download_model,
            crate::llm::llm_start_server,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();

            open_tray_icon(&app_handle);
            open_window(&app_handle);

            crate::flow::open_flow_page(&app_handle);

            Ok(())
        })
}
