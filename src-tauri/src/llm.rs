use futures_util::StreamExt;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

// ─── Model Configuration ──────────────────────────────────────────────────────

/// Qwen2.5-VL-3B-Instruct GGUF URLs
const MODEL_URL: &str =
    // "https://huggingface.co/ggml-org/Qwen2.5-VL-3B-Instruct-GGUF/resolve/main/Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf";
    "https://huggingface.co/mradermacher/Qwen2.5-VL-3B-Instruct-abliterated-GGUF/resolve/main/Qwen2.5-VL-3B-Instruct-abliterated.Q4_K_M.gguf";
const MMPROJ_URL: &str =
    "https://huggingface.co/ggml-org/Qwen2.5-VL-3B-Instruct-GGUF/resolve/main/mmproj-Qwen2.5-VL-3B-Instruct-f16.gguf";

const MODEL_FILENAME: &str = "model.gguf";
const MMPROJ_FILENAME: &str = "mmproj.gguf";
const LLAMA_PORT: u16 = 8081;

// ─── Event Payloads ───────────────────────────────────────────────────────────

#[derive(Clone, serde::Serialize)]
pub struct DownloadProgressPayload {
    pub percent: f64,
    pub downloaded_bytes: u64,
    pub total_bytes: Option<u64>,
}

#[derive(Clone, serde::Serialize)]
pub struct LLMStatusPayload {
    pub status: String, // "checking" | "downloading" | "starting" | "ready" | "error"
    pub message: String,
}

// ─── Helper ───────────────────────────────────────────────────────────────────

fn model_path(app: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app_data_dir: {e}"))?;
    let models_dir = data_dir.join("models");
    Ok(models_dir.join(MODEL_FILENAME))
}

fn mmproj_path(app: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app_data_dir: {e}"))?;
    let models_dir = data_dir.join("models");
    Ok(models_dir.join(MMPROJ_FILENAME))
}

fn emit_status(app: &AppHandle, status: &str, message: &str) {
    let _ = app.emit(
        "llm-status",
        LLMStatusPayload {
            status: status.to_string(),
            message: message.to_string(),
        },
    );
}

async fn download_file(
    app: &AppHandle,
    url: &str,
    target_path: &PathBuf,
    label: &str,
) -> Result<(), String> {
    if target_path.exists() && target_path.metadata().map(|m| m.len() > 0).unwrap_or(false) {
        return Ok(());
    }

    emit_status(app, "downloading", &format!("Downloading {label}..."));

    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| format!("HTTP client error: {e}"))?;

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Download request failed for {label}: {e}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "HTTP {}: Download failed for {label}",
            response.status()
        ));
    }

    let total_bytes: Option<u64> = response.content_length();
    let mut downloaded: u64 = 0;

    let tmp_path = target_path.with_extension("tmp");
    let mut file = tokio::fs::File::create(&tmp_path)
        .await
        .map_err(|e| format!("Cannot create tmp file: {e}"))?;

    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {e}"))?;
        tokio::io::AsyncWriteExt::write_all(&mut file, &chunk)
            .await
            .map_err(|e| format!("Write error: {e}"))?;

        downloaded += chunk.len() as u64;
        let percent = match total_bytes {
            Some(total) if total > 0 => (downloaded as f64 / total as f64) * 100.0,
            _ => -1.0,
        };

        let _ = app.emit(
            "llm-download-progress",
            DownloadProgressPayload {
                percent,
                downloaded_bytes: downloaded,
                total_bytes,
            },
        );
    }

    tokio::io::AsyncWriteExt::flush(&mut file)
        .await
        .map_err(|e| format!("Flush error: {e}"))?;
    drop(file);
    tokio::fs::rename(&tmp_path, target_path)
        .await
        .map_err(|e| format!("Rename tmp file error: {e}"))?;

    Ok(())
}

// ─── Tauri Commands ───────────────────────────────────────────────────────────

#[tauri::command]
pub async fn llm_check_model(app: AppHandle) -> Result<bool, String> {
    let m_path = model_path(&app)?;
    let mm_path = mmproj_path(&app)?;
    Ok(m_path.exists() && mm_path.exists())
}

#[tauri::command]
pub async fn llm_download_model(app: AppHandle) -> Result<(), String> {
    let m_path = model_path(&app)?;
    let mm_path = mmproj_path(&app)?;

    if let Some(parent) = m_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("Failed to create models dir: {e}"))?;
    }

    download_file(&app, MODEL_URL, &m_path, "Model").await?;
    download_file(&app, MMPROJ_URL, &mm_path, "Vision Projector").await?;

    emit_status(&app, "ready_to_start", "Download complete");
    Ok(())
}

#[tauri::command]
pub async fn llm_start_server(app: AppHandle) -> Result<(), String> {
    let m_path = model_path(&app)?;
    let mm_path = mmproj_path(&app)?;

    if !m_path.exists() || !mm_path.exists() {
        return Err("Model or mmproj missing – run llm_download_model first".to_string());
    }

    let model_str = m_path
        .to_str()
        .ok_or("Invalid UTF-8 in model path")?
        .to_string();
    let mmproj_str = mm_path
        .to_str()
        .ok_or("Invalid UTF-8 in mmproj path")?
        .to_string();

    emit_status(&app, "starting", "Starting llama-server (Qwen2.5-VL)...");

    let (mut rx, _child) = app
        .shell()
        .sidecar("llama-server")
        .map_err(|e| format!("Sidecar error: {e}"))?
        .args([
            "--model",
            &model_str,
            "--mmproj",
            &mmproj_str,
            "--port",
            &LLAMA_PORT.to_string(),
            "--host",
            "127.0.0.1",
            "--ctx-size",
            "4096",
            "--n-predict",
            "-1",
            "--threads",
            "4",
            "--no-mmap",
        ])
        .spawn()
        .map_err(|e| format!("Failed to spawn llama-server: {e}"))?;

    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    println!("[llama-server stdout] {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Stderr(line) => {
                    eprintln!("[llama-server stderr] {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Terminated(payload) => {
                    eprintln!("[llama-server terminated] code: {:?}", payload.code);
                }
                _ => {}
            }
        }
    });

    let client = reqwest::Client::new();
    let health_url = format!("http://127.0.0.1:{LLAMA_PORT}/health");

    for attempt in 0..60 {
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

        if let Ok(resp) = client.get(&health_url).send().await {
            if resp.status().is_success() {
                emit_status(&app, "ready", "LLM server is ready");
                return Ok(());
            }
        }

        let dots = ".".repeat((attempt % 3) + 1);
        emit_status(
            &app,
            "starting",
            &format!("Waiting for server{dots} ({attempt}/60)"),
        );
    }

    Err("llama-server healthcheck timed out".to_string())
}
