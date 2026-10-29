use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct CompileResult {
    pub success: bool,
    pub pdf_base64: Option<String>,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

/// Get the temporary compilation directory for a project
fn get_compile_dir(project_id: &str) -> PathBuf {
    let temp_dir = std::env::temp_dir().join("underleaf").join(project_id);
    fs::create_dir_all(&temp_dir).ok();
    temp_dir
}

#[tauri::command]
pub async fn compile_latex(
    latex_code: String,
    project_id: String,
) -> Result<CompileResult, String> {
    let compile_dir = get_compile_dir(&project_id);
    let tex_path = compile_dir.join("main.tex");

    fs::write(&tex_path, &latex_code)
        .map_err(|e| format!("Failed to write tex file: {}", e))?;

    let latex_to_compile = latex_code.clone();
    let (tx, rx) = tokio::sync::oneshot::channel();

    // Run Tectonic on an isolated OS thread outside of Tokio's worker pool.
    // This prevents "Cannot drop a runtime in a context where blocking is not allowed"
    // caused when Tectonic drops its internal runtime on Tokio threads.
    std::thread::spawn(move || {
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            tectonic::latex_to_pdf(&latex_to_compile)
        }));
        let _ = tx.send(result);
    });

    let compile_res = rx
        .await
        .map_err(|_| "Compilation thread was unexpectedly terminated".to_string())?;

    match compile_res {
        Ok(Ok(pdf_bytes)) => {
            // Cache the compiled PDF to disk
            let pdf_path = compile_dir.join("output.pdf");
            fs::write(&pdf_path, &pdf_bytes).ok();

            // Convert to base64 for frontend consumption
            let pdf_base64 = base64_encode(&pdf_bytes);

            Ok(CompileResult {
                success: true,
                pdf_base64: Some(pdf_base64),
                errors: vec![],
                warnings: vec![],
            })
        }
        Ok(Err(e)) => {
            let error_msg = format!("{}", e);
            let errors = parse_compile_errors(&error_msg);

            Ok(CompileResult {
                success: false,
                pdf_base64: None,
                errors: if errors.is_empty() {
                    vec![error_msg]
                } else {
                    errors
                },
                warnings: vec![],
            })
        }
        Err(panic_err) => {
            let msg = if let Some(s) = panic_err.downcast_ref::<&str>() {
                s.to_string()
            } else if let Some(s) = panic_err.downcast_ref::<String>() {
                s.clone()
            } else {
                "LaTeX compiler encountered an unexpected internal error".to_string()
            };

            Ok(CompileResult {
                success: false,
                pdf_base64: None,
                errors: vec![msg],
                warnings: vec![],
            })
        }
    }
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();
    let chunks = data.chunks(3);

    for chunk in chunks {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };

        let triple = (b0 << 16) | (b1 << 8) | b2;

        result.push(CHARS[((triple >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((triple >> 12) & 0x3F) as usize] as char);

        if chunk.len() > 1 {
            result.push(CHARS[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }

        if chunk.len() > 2 {
            result.push(CHARS[(triple & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }

    result
}

fn parse_compile_errors(error_output: &str) -> Vec<String> {
    let lines: Vec<String> = error_output
        .lines()
        .filter(|line| {
            line.contains("Error")
                || line.contains("error")
                || line.contains('!')
                || line.contains("fatal")
        })
        .map(|line| line.trim().to_string())
        .collect();

    if lines.is_empty() && !error_output.trim().is_empty() {
        vec![error_output.trim().to_string()]
    } else {
        lines
    }
}
