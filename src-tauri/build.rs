use std::env;
use std::fs;
use std::path::Path;

fn main() {
    tauri_build::build();

    let out_dir = match env::var("OUT_DIR") {
        Ok(dir) => dir,
        Err(_) => return,
    };

    if let Some(target_dir) = Path::new(&out_dir).ancestors().nth(3) {
        let binaries_dir = Path::new("binaries");
        if binaries_dir.exists() {
            if let Ok(entries) = fs::read_dir(binaries_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("dll") {
                        let dest = target_dir.join(path.file_name().unwrap());
                        let _ = fs::copy(&path, &dest);
                    }
                }
            }
        }
    }
}

