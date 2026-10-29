use std::fs;
use std::path::PathBuf;

/// Get the cached PDF path for a project
fn get_cached_pdf_path(project_id: &str) -> PathBuf {
    let temp_dir = std::env::temp_dir()
        .join("underleaf")
        .join(project_id)
        .join("output.pdf");
    temp_dir
}

#[tauri::command]
pub async fn export_pdf(
    project_id: String,
    export_path: String,
) -> Result<(), String> {
    let cached_pdf = get_cached_pdf_path(&project_id);
    
    if !cached_pdf.exists() {
        return Err("No compiled PDF found. Please compile the document first.".to_string());
    }

    fs::copy(&cached_pdf, &export_path)
        .map_err(|e| format!("Failed to export PDF: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_pdf_bytes(project_id: String) -> Result<Vec<u8>, String> {
    let cached_pdf = get_cached_pdf_path(&project_id);
    
    if !cached_pdf.exists() {
        return Err("No compiled PDF found.".to_string());
    }

    fs::read(&cached_pdf)
        .map_err(|e| format!("Failed to read PDF: {}", e))
}
